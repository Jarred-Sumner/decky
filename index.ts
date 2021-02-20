import fs from "fs";
import path from "path";
import { DecoratorType } from "./declarations";

type Qualifier = "public" | "private" | "protected" | null;

type DesignTimeProperty<T = any[]> = {
  key: string;
  type?: string;
  args?: T;
  isStatic?: boolean;
  qualifier?: Qualifier;
  metadata?: DecoratorResult;
};

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
  [name: string]:
    | DesignTimePropertyDecorator<any>
    | DesignTimeClassDecorator<any>;
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
) => boolean;

function trim(input: string) {
  return input.trim();
}

function buildDecoratorProcessor(decorators: DecoratorsMap) {
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
      let code = result.code;
      let prefixEnd = prefixStart + length;
      let argStart = prefixEnd;
      let lineEnd = code.indexOf("\n", prefixStart);
      let argEnd = -1;
      let argList;
      if (code[argStart++] === "(") {
        argStart++;
        argEnd = code.indexOf(")", argStart);
        argEnd--;
        if (argEnd < 0)
          throw `Missing ) for ${prefix} at ${path.basename(result.filePath)}:${
            result.code.substring(0, prefixStart).split("\n").length
          }`;

        argList = code.substring(argStart, argEnd).split(",").map(trim);
      } else {
        argStart = -1;
        argList = [];
      }
      let nextLineStart = lineEnd + 1;
      let nextLineEnd = code.indexOf("\n", nextLineStart);
      const originalLine = code.substring(nextLineStart, nextLineEnd).trim();
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
        nextLine = nextLine.substring("class ".length);
        // TODO: object pooling
        await (decoratorFunc as DesignTimeClassFunction<any>)({
          className: nextLine.substring(0, nextLine.indexOf(" ")),
          args: argList,
          metadata: result,
        } as DesignTimeClass);
        return false;
      } else {
        // let colon
        let typeSeparatorIndex = nextLine.indexOf(":");
        let key = nextLine.substring(0, typeSeparatorIndex).trim();
        let typeName = nextLine.substring(typeSeparatorIndex + 1).trim();

        let semicolonIndex = typeName.indexOf(";");
        if (semicolonIndex > -1) {
          typeName = typeName.substring(0, semicolonIndex);
        }

        (result.code as any) = code;
        // TODO: object pooling
        const newCode = await (decoratorFunc as DesignTimePropertyDecoratorFunction<any>)(
          {
            key,
            type: typeName,
            args: argList,
            isStatic,
            qualifier,
            metadata: result,
          }
        );
        if (!newCode) {
          (result.startIndex as any) = prefixStart;
          (result.stopIndex as any) = prefixEnd;
          (result.code as any) = newCode || "";
          return false;
        }

        (result.startIndex as any) = prefixStart;
        (result.stopIndex as any) = nextLineEnd;
        (result.code as any) = newCode || "";
        return true;
      }
    };

    decoratorFunctions[i] = processDecorator;
  }

  return {
    process: async (code: string, filePath: string) => {
      let startIndex = -1;
      let symbolI = code.lastIndexOf("@") - 1;
      let _prefixI = -1;
      if (symbolI < -1) return code;
      if (symbolI < 0) symbolI = 0;

      let result = {
        code,
        originalSource: code,
        filePath,
        startIndex: -1,
        stopIndex: -1,
      };

      let prefixI = -1;
      for (_prefixI = 0; _prefixI < decoratorPrefixes.length; _prefixI++) {
        result.startIndex = code.indexOf(decoratorPrefixes[_prefixI], symbolI);
        if (result.startIndex > -1) {
          prefixI = _prefixI;
          break;
        }
      }

      let prefix = "";

      while (prefixI > -1) {
        prefix = decoratorPrefixes[prefixI];
        if (result.startIndex > -1) {
          let _code = result.code;
          if (await decoratorFunctions[prefixI](result.startIndex, result)) {
            if (result.startIndex > -1 && result.stopIndex > -1) {
              result.code =
                _code.substring(0, result.startIndex) +
                result.code +
                _code.substring(result.stopIndex);
            }
          } else {
            result.code =
              _code.substring(0, result.startIndex - 1) +
              _code.substring(_code.indexOf("\n", result.startIndex));
          }

          result.startIndex = result.stopIndex = -1;
        }

        prefixI = -1;
        for (_prefixI = 0; _prefixI < decoratorPrefixes.length; _prefixI++) {
          symbolI = result.code.lastIndexOf("@");
          if (symbolI === -1) break;

          result.startIndex = result.code.indexOf(
            decoratorPrefixes[_prefixI],
            symbolI
          );
          if (result.startIndex > -1) {
            prefixI = _prefixI;
            break;
          }
        }
      }

      console.log(result.code);
      return result.code;
    },
    prefixes: decoratorPrefixes,
  };
}

function onResolveDecorator(args) {
  console.log("DECORATOR");
  return {
    path: args.path,
    namespace: "decorator-stub",
  };
}

function onResolveStaticDecorators(args) {
  console.log("DECORATOR");
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

export function plugin(decorators: DecoratorsMap, disable = false) {
  const { prefixes, process } = buildDecoratorProcessor(decorators);

  function isPotentialMatch(content: string) {
    for (let prefix of prefixes) {
      if (content.includes(prefix)) return true;
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

  async function onLoadTSX(args) {
    const contents: string = await fs.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader: "tsx",
      };

    return {
      contents: await process(contents, args.path),
      loader: "tsx",
    };
  }

  async function onLoadTS(args) {
    console.log("LOAD", args.path);
    const contents: string = await fs.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader: "ts",
      };

    return {
      contents: await process(contents, args.path),
      loader: "ts",
    };
  }

  return {
    name: "design-time-decorators",
    setup(build) {
      build.onResolve(
        { filter: /\.(decorator|dec)\.(ts)$/ },
        onResolveDecorator
      );
      build.onResolve(
        { filter: /\.(decorator|dec)\.(tsx)$/ },
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
      build.onLoad({ filter: /\.(ts)$/ }, onLoadTS);
      build.onLoad({ filter: /\.(tsx)$/ }, onLoadTSX);
    },
  };
}

export function property<T extends any[] | undefined>(
  callback: DesignTimePropertyDecoratorFunction<T>
): (...args: T) => PropertyDecorator {
  return <any | void>{
    callback,
    type: DecoratorType.property,
  };
}
export function klass<T extends any[] | undefined>(
  callback: DesignTimeClassFunction<T>
): (...args: T) => ClassDecorator {
  return <any | void>{
    callback,
    type: DecoratorType.klass,
  };
}
