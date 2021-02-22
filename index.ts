import {
  BuildOptions,
  OnLoadArgs,
  OnLoadResult,
  OnResolveArgs,
  PartialNote,
} from "esbuild";
import * as fs from "fs";
import { DecoratorType, decorators } from "decky/decorators";
import * as path from "path";
import chalk from "chalk";

const esmLexer = require("es-module-lexer");

let hasLoadedLexers = false;
async function initLexers() {
  if (hasLoadedLexers) return;
  await Promise.all([esmLexer.init]);
  hasLoadedLexers = true;
}

const VALID_DECORATOR_IMPORT_EXTENSIONS = [
  ".decorator.ts",
  ".decorator.tsx",
  ".decorator",
  ".decky.ts",
  ".decky.tsx",
  ".decky",
  ".dec.ts",
  ".dec.tsx",
  ".dec",
];

type ESMImport = {
  // start
  s: number;
  // end
  e: number;
  // statement start
  ss: number;
  // statement end
  se: number;
  // is it a dynamic import
  d: number;
  // module path
  n: string;
};

function filterDecoratorImport(esm: ESMImport, index: number) {
  return VALID_DECORATOR_IMPORT_EXTENSIONS.includes(
    path.extname(esm.n).toLowerCase()
  );
}

function parseDecoratorImports(code: string, filename: string): ESMImport[] {
  // This thing parses both imports and exports, which is unnecessary for this use case.
  // A future TODO if enough people use this thing would be to fork it and remove the code for parsing exports
  // That would probably make it much faster, but its already pretty quick.
  const [imports] = esmLexer.parse(code, filename);

  return (imports as ESMImport[]).filter(filterDecoratorImport);
}

type Qualifier = "public" | "private" | "protected" | null;

type DesignTimeProperty<T = any[]> = {
  key: string;
  type?: string;
  args?: T;
  isStatic?: boolean;
  qualifier?: Qualifier;
  metadata?: DecoratorResult;
  defaultValue?: string | number | null;
};

type UsageMap = Map<string, Set<string>>;

type DesignTimePropertyDecoratorFunction<T> = (
  property: DesignTimeProperty<T>
) => void | any;

export type DesignTimePropertyDecorator<T> = (
  ...args: string[]
) => DesignTimePropertyDecoratorFunction<T>;

type DesignTimeClass<T = any[]> = {
  className: string;
  args?: T;
  metadata?: DecoratorResult;
};

type DesignTimeClassFunction<T> = (klass: DesignTimeClass<T>) => void | any;

export type DesignTimeClassDecorator<T> = () => DesignTimeClassFunction<T>;

export type DecoratorsMap = {
  [modulePath: string]: {
    [name: string]:
      | DesignTimePropertyDecorator<any>
      | DesignTimeClassDecorator<any>;
  };
};

interface DecoratorResult {
  readonly code: string;
  readonly originalSource: string;
  readonly filePath: string;
  readonly startIndex: number;
  readonly stopIndex: number;
}

type DecoratorProcessor = (
  prefixStart: number,
  result: DecoratorResult
) => Promise<boolean>;

function trim(input: string) {
  return input.trim();
}

class ProcessorError extends Error {
  constructor(
    message: string,
    file: string,
    lineNumber: number,
    lineText: string,
    column?: number
  ) {
    super(message);
    this.note = {
      text: message,
      location: {
        file,
        line: lineNumber,
        lineText,

        column,
      },
    };
  }
  note: PartialNote;
}

function buildDecoratorProcessor(decoratorsModuleMap: DecoratorsMap) {
  const fileMapping = {};
  const allPrefixes = new Set();

  for (let moduleName in decoratorsModuleMap) {
    const decorators = decoratorsModuleMap[moduleName];
    if (
      typeof decorators !== "object" ||
      Object.keys(decorators).length === 0
    ) {
      console.warn(
        `[decky] "decorators" not exported in ${moduleName}, ignoring file.`
      );
      continue;
    }

    const decoratorKeys = Object.keys(decorators).sort().reverse();
    const decoratorPrefixes = decoratorKeys.map((a) => a.toString());
    const decoratorFunctions: Array<DecoratorProcessor> = new Array(
      decoratorKeys.length
    );
    const flattenedFuncs = decoratorKeys.map(
      (a) => (decorators[a] as any).callback
    );

    for (let i = 0; i < decoratorKeys.length; i++) {
      const key = decoratorKeys[i];
      const prefix = decoratorPrefixes[i];
      const length = key.length;
      const decoratorFunc:
        | DesignTimeClassFunction<any>
        | DesignTimePropertyDecoratorFunction<any> = flattenedFuncs[i];

      const processDecorator: DecoratorProcessor = async (
        prefixStart,
        result
      ) => {
        if (globalThis.process.env.DECKY_TIMINGS)
          console.time(
            `[decky] -> ${prefix}: ${path.relative(
              globalThis.process.cwd(),
              result.filePath
            )}`
          );
        let code = result.code;
        let prefixEnd = result.stopIndex;
        let argStart = prefixEnd;
        let lineEnd = prefixEnd;

        while (code[lineEnd] !== "\n") {
          lineEnd++;
          if (code.length < lineEnd) break;
        }

        while (code[argStart] !== "(" && argStart < lineEnd) {
          argStart++;
        }

        let argEnd = -1;
        let argList;
        if (code[argStart++] === "(") {
          argEnd = code.indexOf(")", argStart);
          if (argEnd - 1 > argStart) {
            if (argEnd < 0)
              throw new ProcessorError(
                `Missing ) for ${prefix}`,
                result.filePath,
                result.code.substring(0, prefixStart).split("\n").length,
                result.code.split("\n")[
                  result.code.substring(0, prefixStart).split("\n").length
                ],
                prefixEnd
              );

            try {
              argList = JSON.parse(
                "[" + code.substring(argStart, argEnd) + "]"
              );
            } catch (exception) {
              throw new ProcessorError(
                `Arguments to ${prefix} must be JSON. Received: [${code.substring(
                  argStart,
                  argEnd
                )}]`,
                result.filePath,
                result.code.substring(0, prefixStart).split("\n").length - 1,
                result.code.split("\n")[
                  result.code.substring(0, prefixStart).split("\n").length - 1
                ],
                argStart
              );
            }
          } else {
            argStart = -1;
            argList = [];
          }
        } else {
          argStart = -1;
          argList = [];
        }
        let nextLineStart = lineEnd + 1;
        while (
          code[nextLineStart] === " " ||
          code[nextLineStart] === ";" ||
          code[nextLineStart] === "\n"
        ) {
          nextLineStart++;
        }

        let _nextNewline = code.indexOf("\n", nextLineStart);
        let _nextSemicolon = code.indexOf(";", nextLineStart);
        let nextLineEnd =
          (_nextNewline < _nextSemicolon ? _nextNewline : _nextSemicolon) + 1;
        const originalLine = code.substring(nextLineStart, nextLineEnd);
        let nextLine = originalLine;

        let isStatic = false;
        let qualifier: Qualifier = null;

        if (nextLine.startsWith("export ")) {
          nextLine = nextLine.substring("export ".length).trim();
        }

        if (nextLine.startsWith("public ")) {
          qualifier = "public";
          nextLine = nextLine.substring("public".length);
        } else if (nextLine.startsWith("private ")) {
          qualifier = "private";
          nextLine = nextLine.substring("private".length);
        } else if (nextLine.startsWith("protected ")) {
          qualifier = "protected";
          nextLine = nextLine.substring("protected".length);
        }

        nextLine = nextLine.trim();
        let isClass = nextLine.startsWith("class ");

        if (!isClass) {
          isStatic = nextLine.startsWith("static ");
          if (isStatic) {
            nextLine.substring("static ".length);
          }
        }

        if (isClass) {
          nextLine = nextLine.substring("class ".length).trim();
          nextLine = nextLine.substring(0, nextLine.indexOf(" ")).trim();
          if (globalThis.process.env.DECKY_TIMINGS)
            console.time(
              `[decky] ${
                path.basename(moduleName).split(".")[0]
              }.${prefix}(${argList.join(", ")})`
            );
          try {
            // TODO: object pooling
            await (decoratorFunc as DesignTimeClassFunction<any>)({
              className: nextLine,
              args: argList,
              metadata: result,
            } as DesignTimeClass);

            (result.stopIndex as any) = nextLineStart;
          } catch (exception) {
            throw new ProcessorError(
              exception.toString() + `\nIn file:\n${result.code}`,
              result.filePath,
              result.code.substring(0, prefixStart).split("\n").length,
              result.code.split("\n")[
                result.code.substring(0, prefixStart).split("\n").length - 1
              ],
              prefixEnd
            );
          } finally {
            if (globalThis.process.env.DECKY_TIMINGS)
              console.timeEnd(
                `[decky] ${
                  path.basename(moduleName).split(".")[0]
                }.${prefix}(${argList.join(", ")})`
              );
          }
          return false;
        } else {
          let key = nextLine.trim();
          let typeName = "";
          let typeSeparatorIndex = nextLine.indexOf(":");
          let equalsIndex = nextLine.indexOf("=");
          let openParentheses = nextLine.indexOf("(");
          let defaultValue = undefined;

          if (typeSeparatorIndex > -1) {
            key = nextLine.substring(0, typeSeparatorIndex).trim();
            typeName = nextLine.substring(typeSeparatorIndex + 1).trim();
          }

          let semicolonIndex = typeName.indexOf(";");

          // Ignore equals when open parentheses exists, not dealing with parsing that.
          if (equalsIndex > -1 && openParentheses === -1) {
            if (key === "") {
              key = nextLine.substring(0, equalsIndex).trim();
            }
            let _defaultValue = nextLine
              .substring(equalsIndex + 1)
              .trim()
              .replace(/;/gm, "")
              .trim();
            try {
              defaultValue = JSON.parse(_defaultValue);
            } catch (exception) {
              if (process.env.DECKY_VERBOSE) {
                console.warn(exception);
              }
            }

            if (typeof defaultValue !== "undefined" && typeName === "") {
              typeName = typeof defaultValue;
            }
          }

          if (semicolonIndex > -1) {
            typeName = typeName.substring(0, semicolonIndex);
          }

          if (key === "") {
            throw new ProcessorError(
              "Missing name for property below property descriptor",
              result.filePath,
              result.code.substring(0, prefixStart).split("\n").length,
              nextLine,
              prefixEnd
            );
          }

          (result.code as any) = code;
          // TODO: object pooling
          let newCode: string;
          if (globalThis.process.env.DECKY_TIMINGS)
            console.time(
              `[decky] ${
                path.basename(moduleName).split(".")[0]
              }.${prefix}(${argList.join(", ")})`
            );
          try {
            newCode = await (decoratorFunc as DesignTimePropertyDecoratorFunction<any>)(
              {
                key,
                type: typeName,
                args: argList,
                isStatic,
                qualifier,
                metadata: result,
                defaultValue,
              }
            );
          } catch (exception) {
            throw new ProcessorError(
              exception.toString() + `\nIn file:\n${result.code}`,
              result.filePath,
              result.code.substring(0, prefixStart).split("\n").length,
              result.code.split("\n")[
                result.code.substring(0, prefixStart).split("\n").length
              ],
              prefixEnd
            );
          } finally {
            if (globalThis.process.env.DECKY_TIMINGS)
              console.timeEnd(
                `[decky] ${
                  path.basename(moduleName).split(".")[0]
                }.${prefix}(${argList.join(", ")})`
              );
          }
          if (globalThis.process.env.DECKY_TIMINGS)
            console.timeEnd(
              `[decky] -> ${prefix}: ${path.relative(
                globalThis.process.cwd(),
                result.filePath
              )}`
            );
          if (!newCode && newCode !== "") {
            (result.startIndex as any) = prefixStart;
            (result.stopIndex as any) = nextLineStart;
            (result.code as any) = newCode || "";
            return false;
          }

          (result.startIndex as any) = prefixStart - 1;
          (result.stopIndex as any) = nextLineEnd - 1;
          (result.code as any) = newCode || "";
          return true;
        }
      };

      decoratorFunctions[i] = processDecorator;
    }
    fileMapping[path.basename(moduleName, path.extname(moduleName))] = {
      decoratorFunctions,
      decoratorPrefixes,
    };
    decoratorPrefixes.forEach((prefix) => allPrefixes.add(prefix));
  }

  const prefixes = [...allPrefixes].sort().reverse();

  return {
    process: async (code: string, filePath: string) => {
      let moduleImports: ESMImport[];
      try {
        moduleImports = parseDecoratorImports(code, filePath);
      } catch (exception) {
        throw new ProcessorError(
          `Import/export parse error: ${exception.toString()}`,
          filePath,
          0,
          code,
          0
        );
      }

      const modules = new Array<string>(moduleImports.length);
      let moduleI = 0;
      // Remove decorator imports
      for (let moduleImport of moduleImports) {
        code =
          code.substring(0, moduleImport.ss) +
          " ".repeat(moduleImport.se - moduleImport.ss + 1) +
          code.substring(moduleImport.se + 1);
        const name = path.basename(moduleImport.n);
        if (fileMapping[name]) {
          modules[moduleI++] = name;
        }
      }
      // 1. Ignore comment lines
      // 2. Replace double empty lines with single empty lines
      // 3. Trim trailing/leading whitespace/newlines, but add one newline at the end.
      // If this needs to be optimized, this code could be turned into one function call done in a single pass probably.
      code =
        code
          .replace(/^\s*\/\/.*\n?$/gm, "")
          .trim()
          .split("\n\n")
          .join("\n")
          .trim() + "\n";
      if (globalThis.process.env.DECKY_VERBOSE) console.log(chalk.yellow(code));
      if (moduleI !== modules.length) {
        modules.length = moduleI;
      }

      let result = {
        code,
        originalSource: code,
        filePath,
        startIndex: -1,
        stopIndex: -1,
      };

      let symbolI = code.lastIndexOf("@") - 1;
      if (symbolI < -1) return { contents: code, note: null };
      if (symbolI === -1) symbolI++;
      let _prefixI = -1;
      let prefixI = -1;
      let prefix = "";
      let _code = "";
      let didChange = false;

      let lastMatchIndex = -1;

      do {
        symbolI = result.code.lastIndexOf("@");
        if (symbolI === -1) break;
        result.startIndex = symbolI;
        result.stopIndex = result.startIndex + 1;
        prefix = "0AF";
        while (result.stopIndex < result.code.length) {
          result.stopIndex++;

          // Things that end statements in JavaScript:
          if (
            result.code[result.stopIndex] === " " ||
            result.code[result.stopIndex] === "(" ||
            result.code[result.stopIndex] === "\n" ||
            result.code[result.stopIndex] === ";" ||
            result.code[result.stopIndex] === ","
          ) {
            prefix = result.code.substring(
              result.startIndex + 1,
              result.stopIndex
            );
            break;
          }
          // TODO: do we need to add a helpful syntax error checker here?
          // Like if you type @ foo
          // Hopefully esbuild will just handle that case! thx @evanw
        }

        // The ultra efficient way to do this would be using a trie!
        // Only necessary if we get to the point where there are hundreds of decorators
        let decoratorModuleName;
        for (let moduleName of modules) {
          prefixI = fileMapping[moduleName].decoratorPrefixes.indexOf(prefix);
          if (prefixI > -1) {
            decoratorModuleName = moduleName;
            break;
          }
        }

        if (prefixI === -1) {
          // Excited for the github issue that says, "Why is there shrimp in my code??"
          result.code =
            result.code.substring(0, symbolI) +
            "🍤" +
            result.code.substring(symbolI + 1);
          continue;
        }

        const { decoratorFunctions } = fileMapping[decoratorModuleName];

        if (result.startIndex > -1 && decoratorFunctions[prefixI]) {
          _code = result.code;
          didChange = false;
          try {
            didChange = await decoratorFunctions[prefixI](
              result.startIndex,
              result
            );
          } catch (exception) {
            if (exception instanceof ProcessorError) {
              return {
                contents: "",
                note: exception.note,
              };
            } else {
              return {
                contents: "",
                note: new ProcessorError(
                  exception.toString(),
                  filePath,
                  0,
                  result.code,
                  0
                ).note,
              };
            }
          }

          if (didChange) {
            if (result.startIndex > -1 && result.stopIndex > -1) {
              result.code =
                _code.substring(0, result.startIndex) +
                result.code +
                _code.substring(result.stopIndex);
            }
          } else {
            result.code =
              _code.substring(0, result.startIndex - 1) +
              _code.substring(result.stopIndex);
          }

          result.startIndex = result.stopIndex = -1;
        }
      } while (symbolI > -1);

      if (globalThis.process.env.DECKY_VERBOSE)
        console.log(chalk.green(result.code));

      return {
        contents: result.code.replace(/🍤/gm, "@"),
        note: null,
      };
    },
    prefixes,
  };
}

function onResolveDecorator(args: OnResolveArgs) {
  return {
    path: args.path,
    namespace: "decorator-stub",
  };
}

function onResolveStaticDecorators(args) {
  return {
    path: args.path,
    namespace: "decky",
  };
}

const staticDecoratorCode = [property, klass]
  .map(
    (stub) =>
      `/* @__PURE__ */\nexport function ${stub}(...args){return args;}\n`
  )
  .join("\n");

function onLoadStaticDecorators(args) {
  return {
    contents: staticDecoratorCode,
    loader: "js",
  };
}

export function plugin(decorators: DecoratorsMap) {
  const { prefixes, process } = buildDecoratorProcessor(decorators);

  function isPotentialMatch(content: string) {
    for (let prefix of prefixes) {
      if (content.includes(prefix as string)) return true;
    }

    return false;
  }

  function onLoadDecoratorStub(args) {
    const stub = require(args.path).decorators;

    return {
      contents: Object.keys(stub)
        .map(
          (stub) =>
            `/* @__PURE__ */\nexport function ${stub}(...args){return args;}\n`
        )
        .join("\n"),
      loader: "ts",
    };
  }

  async function onLoadCode(args: OnLoadArgs): Promise<OnLoadResult> {
    const loader = path.extname(args.path).substring(1) as "tsx" | "ts";

    let contents: string = await fs.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader,
      };

    if (globalThis.process.env.DECKY_TIMINGS)
      console.time(
        "[decky] ./" + path.relative(globalThis.process.cwd(), args.path)
      );
    await initLexers();

    const { note, contents: _contents } =
      (await process(contents, args.path)) ?? {};

    if (globalThis.process.env.DECKY_TIMINGS)
      console.timeEnd(
        "[decky] ./" + path.relative(globalThis.process.cwd(), args.path)
      );

    return {
      contents: _contents,
      errors: note ? [{ location: note.location, text: note.text }] : undefined,
      loader,
    };
  }

  return {
    name: "decky",
    setup(build) {
      build.onResolve(
        { filter: /\.(decorator|dec|decky)\.(ts|tsx)$/ },
        onResolveDecorator
      );
      build.onResolve({ filter: /^decky$/ }, onResolveStaticDecorators);
      build.onLoad(
        { filter: /^decky$/, namespace: "decky" },
        onLoadStaticDecorators
      );
      build.onLoad(
        { filter: /\.(decorator|dec)\.(ts)$/, namespace: "decorator-stub" },
        onLoadDecoratorStub
      );
      build.onLoad(
        { filter: /\.(decorator|dec)\.(tsx)$/, namespace: "decorator-stub" },
        onLoadDecoratorStub
      );
      build.onLoad({ filter: /\.(ts|tsx)$/ }, onLoadCode);
    },
  };
}

type OptionalPropertyDescriptor<T> = T extends Exclude<
  (number | string)[],
  undefined
>
  ? (...args: T) => PropertyDecorator
  : void;

export function property<T>(
  callback: DesignTimePropertyDecoratorFunction<T>
): OptionalPropertyDescriptor<T> {
  return {
    callback,
    type: DecoratorType.property,
  } as any;
}

export function propertyVoid(
  callback: DesignTimePropertyDecoratorFunction<never>
): PropertyDecorator {
  return {
    callback,
    type: DecoratorType.property,
  } as any;
}

export function klass<T extends any[] = []>(
  callback: DesignTimeClassFunction<T>
): (...args: T) => ClassDecorator {
  return <any | void>{
    callback,
    type: DecoratorType.klass,
  };
}

export function klassVoid(
  callback: DesignTimeClassFunction<never>
): ClassDecorator {
  return <any | void>{
    callback,
    type: DecoratorType.klass,
  };
}

export { property as p, propertyVoid as pV };
export { klass as c, klassVoid as cV };

export async function load(
  decoratorsGlob?: string,
  additionalConfig?: Partial<BuildOptions>
) {
  const entryPoints = await decorators(decoratorsGlob, additionalConfig);
  const files = {};
  for (let file of entryPoints) {
    Object.assign(files, {
      [file]: require(path.join(
        process.cwd(),
        path.dirname(file),
        path.basename(file).replace(".ts", ".js")
      )).decorators,
    });
  }

  return plugin(files);
}
