import * as fs from "fs";
import {DecoratorType} from "./decorators";
import * as path from "path";
function trim(input) {
  return input.trim();
}
class ProcessorError extends Error {
  constructor(message, file, lineNumber, lineText, column) {
    super(message);
    this.note = {
      text: message,
      location: {
        file,
        line: lineNumber,
        lineText,
        column
      }
    };
  }
}
function buildDecoratorProcessor(decoratorsModuleMap) {
  const fileMapping = {}, allPrefixes = new Set();
  for (let moduleName in decoratorsModuleMap) {
    const decorators = decoratorsModuleMap[moduleName], decoratorKeys = Object.keys(decorators).sort().reverse(), decoratorPrefixes = decoratorKeys.map((a) => a.toString()), decoratorFunctions = new Array(decoratorKeys.length), flattenedFuncs = decoratorKeys.map((a) => decorators[a].callback);
    for (let i = 0; i < decoratorKeys.length; i++) {
      const key = decoratorKeys[i], prefix = decoratorPrefixes[i], length = key.length, decoratorFunc = flattenedFuncs[i], processDecorator = async (prefixStart, result) => {
        let code = result.code, prefixEnd = prefixStart + length, argStart = prefixEnd, lineEnd = code.indexOf(`
`, prefixStart), argEnd = -1, argList;
        if (code[argStart++] === "(")
          if (argEnd = code.indexOf(")", argStart), argEnd - 1 > argStart) {
            if (argEnd < 0)
              throw new ProcessorError(`Missing ) for ${prefix}`, result.filePath, result.code.substring(0, prefixStart).split(`
`).length, result.code.split(`
`)[result.code.substring(0, prefixStart).split(`
`).length], prefixEnd);
            try {
              argList = JSON.parse("[" + code.substring(argStart, argEnd) + "]");
            } catch (exception) {
              throw new ProcessorError(`Arguments to ${prefix} must be JSON. Received: [${code.substring(argStart, argEnd)}]`, result.filePath, result.code.substring(0, prefixStart).split(`
`).length - 1, result.code.split(`
`)[result.code.substring(0, prefixStart).split(`
`).length - 1], argStart);
            }
          } else
            argStart = -1, argList = [];
        else
          argStart = -1, argList = [];
        let nextLineStart = lineEnd + 1, nextLineEnd = code.indexOf(`
`, nextLineStart), nextLine = code.substring(nextLineStart, nextLineEnd).trim(), isStatic = !1, qualifier = null;
        nextLine.startsWith("export ") && (nextLine = nextLine.substring("export ".length).trim()), nextLine.startsWith("public ") ? (qualifier = "public", nextLine = nextLine.substring("public".length)) : nextLine.startsWith("private ") ? (qualifier = "private", nextLine = nextLine.substring("private".length)) : nextLine.startsWith("protected ") && (qualifier = "protected", nextLine = nextLine.substring("protected".length)), nextLine = nextLine.trim();
        let isClass = nextLine.startsWith("class ");
        if (isClass || (isStatic = nextLine.startsWith("static "), isStatic && nextLine.substring("static ".length)), isClass)
          return nextLine = nextLine.substring("class ".length), await decoratorFunc({
            className: nextLine.substring(0, nextLine.indexOf(" ")),
            args: argList,
            metadata: result
          }), !1;
        {
          let typeSeparatorIndex = nextLine.indexOf(":"), key2 = nextLine.substring(0, typeSeparatorIndex).trim(), typeName = nextLine.substring(typeSeparatorIndex + 1).trim(), semicolonIndex = typeName.indexOf(";");
          semicolonIndex > -1 && (typeName = typeName.substring(0, semicolonIndex)), result.code = code;
          const newCode = await decoratorFunc({
            key: key2,
            type: typeName,
            args: argList,
            isStatic,
            qualifier,
            metadata: result
          });
          return !newCode && newCode !== "" ? (result.startIndex = prefixStart, result.stopIndex = prefixEnd, result.code = newCode || "", !1) : (result.startIndex = prefixStart - 1, result.stopIndex = nextLineEnd - 1, result.code = newCode || "", !0);
        }
      };
      decoratorFunctions[i] = processDecorator;
    }
    fileMapping[path.basename(moduleName, path.extname(moduleName))] = {
      decoratorFunctions,
      decoratorPrefixes
    }, decoratorPrefixes.forEach((prefix) => allPrefixes.add(prefix));
  }
  const modulesToCheck = Object.keys(fileMapping);
  return {
    process: async (code, filePath) => {
      for (let decoratorModuleName of modulesToCheck) {
        if (!code.includes(decoratorModuleName))
          continue;
        const {decoratorFunctions, decoratorPrefixes} = fileMapping[decoratorModuleName];
        let startIndex = -1, symbolI = code.lastIndexOf("@") - 1, _prefixI = -1;
        if (symbolI < -1)
          return {contents: code, note: null};
        symbolI < 0 && (symbolI = 0);
        let result = {
          code,
          originalSource: code,
          filePath,
          startIndex: -1,
          stopIndex: -1
        }, prefixI = -1;
        for (_prefixI = 0; _prefixI < decoratorPrefixes.length; _prefixI++)
          if (result.startIndex = code.indexOf(decoratorPrefixes[_prefixI], symbolI), result.startIndex > -1) {
            prefixI = _prefixI;
            break;
          }
        let prefix = "";
        for (; prefixI > -1; ) {
          if (prefix = decoratorPrefixes[prefixI], result.startIndex > -1) {
            let _code = result.code, didChange = !1;
            try {
              didChange = await decoratorFunctions[prefixI](result.startIndex, result);
            } catch (exception) {
              if (exception instanceof ProcessorError)
                return {
                  contents: "",
                  note: exception.note
                };
              throw exception;
            }
            didChange ? result.startIndex > -1 && result.stopIndex > -1 && (result.code = _code.substring(0, result.startIndex) + result.code + _code.substring(result.stopIndex)) : result.code = _code.substring(0, result.startIndex - 1) + _code.substring(_code.indexOf(`
`, result.startIndex)), result.startIndex = result.stopIndex = -1;
          }
          for (prefixI = -1, _prefixI = 0; _prefixI < decoratorPrefixes.length && (symbolI = result.code.lastIndexOf("@"), symbolI !== -1); _prefixI++)
            if (result.startIndex = result.code.indexOf(decoratorPrefixes[_prefixI], symbolI), result.startIndex > -1) {
              prefixI = _prefixI;
              break;
            }
        }
        return {
          contents: result.code,
          note: null
        };
      }
    },
    prefixes: [...allPrefixes]
  };
}
function onResolveDecorator(args) {
  return {
    path: args.path,
    namespace: "decorator-stub"
  };
}
function onResolveStaticDecorators(args) {
  return {
    path: args.path,
    namespace: "decky"
  };
}
const staticDecoratorCode = [property, klass].map((stub) => `/* @__PURE__ */
export function ${stub}(...args){return args;}
`).join(`
`);
function onLoadStaticDecorators(args) {
  return {
    contents: staticDecoratorCode,
    loader: "js"
  };
}
function plugin(decorators) {
  const {prefixes, process: process2} = buildDecoratorProcessor(decorators);
  function isPotentialMatch(content) {
    for (let prefix of prefixes)
      if (content.includes(prefix))
        return !0;
    return !1;
  }
  function onLoadDecoratorStub(args) {
    const stub = require(args.path).decorators;
    return {
      contents: Object.keys(stub).map((stub2) => `/* @__PURE__ */
export function ${stub2}(...args){return args;}
`).join(`
`),
      loader: "ts"
    };
  }
  async function onLoadTSX(args) {
    let contents = await fs.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader: "tsx"
      };
    const {note, contents: _contents} = await process2(contents, args.path) ?? {};
    return {
      contents: _contents,
      errors: note ? [{location: note.location, detail: note.text}] : void 0,
      loader: "tsx"
    };
  }
  async function onLoadTS(args) {
    const contents = await fs.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader: "ts"
      };
    const {note, contents: _contents} = await process2(contents, args.path) ?? {};
    return {
      contents: _contents,
      errors: note ? [{location: note.location, text: note.text}] : void 0,
      loader: "ts"
    };
  }
  return {
    name: "design-time-decorators",
    setup(build) {
      build.onResolve({filter: /\.(decorator|dec)\.(ts)$/}, onResolveDecorator), build.onResolve({filter: /\.(decorator|dec)\.(tsx)$/}, onResolveDecorator), build.onResolve({filter: /^decky$/}, onResolveStaticDecorators), build.onLoad({filter: /^decky$/, namespace: "decky"}, onLoadStaticDecorators), build.onLoad({filter: /\.(decorator|dec)\.(ts)$/, namespace: "decorator-stub"}, onLoadDecoratorStub), build.onLoad({filter: /\.(decorator|dec)\.(tsx)$/, namespace: "decorator-stub"}, onLoadDecoratorStub), build.onLoad({filter: /\.(ts)$/}, onLoadTS), build.onLoad({filter: /\.(tsx)$/}, onLoadTSX);
    }
  };
}
function property(callback) {
  return {
    callback,
    type: DecoratorType.property
  };
}
function propertyVoid(callback) {
  return {
    callback,
    type: DecoratorType.property
  };
}
function klass(callback) {
  return {
    callback,
    type: DecoratorType.klass
  };
}
async function load(decoratorsGlob, additionalConfig) {
  const {decorators} = require("./decorators"), entryPoints = await decorators(decoratorsGlob, additionalConfig), files = {};
  for (let file of entryPoints)
    Object.assign(files, {
      [file]: require(path.join(process.cwd(), path.dirname(file), path.basename(file).replace(".ts", ".js"))).decorators
    });
  return plugin(files);
}
export {
  klass as c,
  klass,
  load,
  property as p,
  propertyVoid as pV,
  plugin,
  property,
  propertyVoid
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEJ1aWxkT3B0aW9ucywgT25Mb2FkUmVzdWx0LCBQYXJ0aWFsTm90ZSB9IGZyb20gXCJlc2J1aWxkXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IERlY29yYXRvclR5cGUgfSBmcm9tIFwiLi9kZWNvcmF0b3JzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG50eXBlIFF1YWxpZmllciA9IFwicHVibGljXCIgfCBcInByaXZhdGVcIiB8IFwicHJvdGVjdGVkXCIgfCBudWxsO1xuXG50eXBlIERlc2lnblRpbWVQcm9wZXJ0eTxUID0gYW55W10+ID0ge1xuICBrZXk6IHN0cmluZztcbiAgdHlwZT86IHN0cmluZztcbiAgYXJncz86IFQ7XG4gIGlzU3RhdGljPzogYm9vbGVhbjtcbiAgcXVhbGlmaWVyPzogUXVhbGlmaWVyO1xuICBtZXRhZGF0YT86IERlY29yYXRvclJlc3VsdDtcbn07XG5cbnR5cGUgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248VD4gPSAoXG4gIHByb3BlcnR5OiBEZXNpZ25UaW1lUHJvcGVydHk8VD5cbikgPT4gdm9pZCB8IGFueTtcblxuZXhwb3J0IHR5cGUgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yPFQ+ID0gKFxuICAuLi5hcmdzOiBzdHJpbmdbXVxuKSA9PiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPjtcblxudHlwZSBEZXNpZ25UaW1lQ2xhc3M8VCA9IGFueVtdPiA9IHtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIGFyZ3M/OiBUO1xuICBtZXRhZGF0YT86IERlY29yYXRvclJlc3VsdDtcbn07XG5cbnR5cGUgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248VD4gPSAoa2xhc3M6IERlc2lnblRpbWVDbGFzczxUPikgPT4gdm9pZCB8IGFueTtcblxuZXhwb3J0IHR5cGUgRGVzaWduVGltZUNsYXNzRGVjb3JhdG9yPFQ+ID0gKCkgPT4gRGVzaWduVGltZUNsYXNzRnVuY3Rpb248VD47XG5cbmV4cG9ydCB0eXBlIERlY29yYXRvcnNNYXAgPSB7XG4gIFttb2R1bGVQYXRoOiBzdHJpbmddOiB7XG4gICAgW25hbWU6IHN0cmluZ106XG4gICAgICB8IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvcjxhbnk+XG4gICAgICB8IERlc2lnblRpbWVDbGFzc0RlY29yYXRvcjxhbnk+O1xuICB9O1xufTtcblxuaW50ZXJmYWNlIERlY29yYXRvclJlc3VsdCB7XG4gIHJlYWRvbmx5IGNvZGU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3JpZ2luYWxTb3VyY2U6IHN0cmluZztcbiAgcmVhZG9ubHkgZmlsZVBhdGg6IHN0cmluZztcbiAgcmVhZG9ubHkgc3RhcnRJbmRleDogbnVtYmVyO1xuICByZWFkb25seSBzdG9wSW5kZXg6IG51bWJlcjtcbn1cblxudHlwZSBEZWNvcmF0b3JQcm9jZXNzb3IgPSAoXG4gIHByZWZpeFN0YXJ0OiBudW1iZXIsXG4gIHJlc3VsdDogRGVjb3JhdG9yUmVzdWx0XG4pID0+IFByb21pc2U8Ym9vbGVhbj47XG5cbmZ1bmN0aW9uIHRyaW0oaW5wdXQ6IHN0cmluZykge1xuICByZXR1cm4gaW5wdXQudHJpbSgpO1xufVxuXG5jbGFzcyBQcm9jZXNzb3JFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgbGluZVRleHQ6IHN0cmluZyxcbiAgICBjb2x1bW4/OiBudW1iZXJcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5ub3RlID0ge1xuICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgIGZpbGUsXG4gICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgIGxpbmVUZXh0LFxuXG4gICAgICAgIGNvbHVtbixcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuICBub3RlOiBQYXJ0aWFsTm90ZTtcbn1cblxuZnVuY3Rpb24gYnVpbGREZWNvcmF0b3JQcm9jZXNzb3IoZGVjb3JhdG9yc01vZHVsZU1hcDogRGVjb3JhdG9yc01hcCkge1xuICBjb25zdCBmaWxlTWFwcGluZyA9IHt9O1xuICBjb25zdCBhbGxQcmVmaXhlcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgbW9kdWxlTmFtZSBpbiBkZWNvcmF0b3JzTW9kdWxlTWFwKSB7XG4gICAgY29uc3QgZGVjb3JhdG9ycyA9IGRlY29yYXRvcnNNb2R1bGVNYXBbbW9kdWxlTmFtZV07XG4gICAgY29uc3QgZGVjb3JhdG9yS2V5cyA9IE9iamVjdC5rZXlzKGRlY29yYXRvcnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gICAgY29uc3QgZGVjb3JhdG9yUHJlZml4ZXMgPSBkZWNvcmF0b3JLZXlzLm1hcCgoYSkgPT4gYS50b1N0cmluZygpKTtcbiAgICBjb25zdCBkZWNvcmF0b3JGdW5jdGlvbnM6IEFycmF5PERlY29yYXRvclByb2Nlc3Nvcj4gPSBuZXcgQXJyYXkoXG4gICAgICBkZWNvcmF0b3JLZXlzLmxlbmd0aFxuICAgICk7XG4gICAgY29uc3QgZmxhdHRlbmVkRnVuY3MgPSBkZWNvcmF0b3JLZXlzLm1hcChcbiAgICAgIChhKSA9PiAoZGVjb3JhdG9yc1thXSBhcyBhbnkpLmNhbGxiYWNrXG4gICAgKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVjb3JhdG9yS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gZGVjb3JhdG9yS2V5c1tpXTtcbiAgICAgIGNvbnN0IHByZWZpeCA9IGRlY29yYXRvclByZWZpeGVzW2ldO1xuICAgICAgY29uc3QgbGVuZ3RoID0ga2V5Lmxlbmd0aDtcbiAgICAgIGNvbnN0IGRlY29yYXRvckZ1bmM6XG4gICAgICAgIHwgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248YW55PlxuICAgICAgICB8IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPGFueT4gPSBmbGF0dGVuZWRGdW5jc1tpXTtcblxuICAgICAgY29uc3QgcHJvY2Vzc0RlY29yYXRvcjogRGVjb3JhdG9yUHJvY2Vzc29yID0gYXN5bmMgKFxuICAgICAgICBwcmVmaXhTdGFydCxcbiAgICAgICAgcmVzdWx0XG4gICAgICApID0+IHtcbiAgICAgICAgbGV0IGNvZGUgPSByZXN1bHQuY29kZTtcbiAgICAgICAgbGV0IHByZWZpeEVuZCA9IHByZWZpeFN0YXJ0ICsgbGVuZ3RoO1xuICAgICAgICBsZXQgYXJnU3RhcnQgPSBwcmVmaXhFbmQ7XG4gICAgICAgIGxldCBsaW5lRW5kID0gY29kZS5pbmRleE9mKFwiXFxuXCIsIHByZWZpeFN0YXJ0KTtcbiAgICAgICAgbGV0IGFyZ0VuZCA9IC0xO1xuICAgICAgICBsZXQgYXJnTGlzdDtcbiAgICAgICAgaWYgKGNvZGVbYXJnU3RhcnQrK10gPT09IFwiKFwiKSB7XG4gICAgICAgICAgYXJnRW5kID0gY29kZS5pbmRleE9mKFwiKVwiLCBhcmdTdGFydCk7XG4gICAgICAgICAgaWYgKGFyZ0VuZCAtIDEgPiBhcmdTdGFydCkge1xuICAgICAgICAgICAgaWYgKGFyZ0VuZCA8IDApXG4gICAgICAgICAgICAgIHRocm93IG5ldyBQcm9jZXNzb3JFcnJvcihcbiAgICAgICAgICAgICAgICBgTWlzc2luZyApIGZvciAke3ByZWZpeH1gLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zcGxpdChcIlxcblwiKVtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwcmVmaXhFbmRcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYXJnTGlzdCA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgICAgXCJbXCIgKyBjb2RlLnN1YnN0cmluZyhhcmdTdGFydCwgYXJnRW5kKSArIFwiXVwiXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFByb2Nlc3NvckVycm9yKFxuICAgICAgICAgICAgICAgIGBBcmd1bWVudHMgdG8gJHtwcmVmaXh9IG11c3QgYmUgSlNPTi4gUmVjZWl2ZWQ6IFske2NvZGUuc3Vic3RyaW5nKFxuICAgICAgICAgICAgICAgICAgYXJnU3RhcnQsXG4gICAgICAgICAgICAgICAgICBhcmdFbmRcbiAgICAgICAgICAgICAgICApfV1gLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCAtIDEsXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvZGUuc3BsaXQoXCJcXG5cIilbXG4gICAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGFyZ1N0YXJ0XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZ1N0YXJ0ID0gLTE7XG4gICAgICAgICAgICBhcmdMaXN0ID0gW107XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFyZ1N0YXJ0ID0gLTE7XG4gICAgICAgICAgYXJnTGlzdCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGxldCBuZXh0TGluZVN0YXJ0ID0gbGluZUVuZCArIDE7XG4gICAgICAgIGxldCBuZXh0TGluZUVuZCA9IGNvZGUuaW5kZXhPZihcIlxcblwiLCBuZXh0TGluZVN0YXJ0KTtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxMaW5lID0gY29kZS5zdWJzdHJpbmcobmV4dExpbmVTdGFydCwgbmV4dExpbmVFbmQpLnRyaW0oKTtcbiAgICAgICAgbGV0IG5leHRMaW5lID0gb3JpZ2luYWxMaW5lO1xuICAgICAgICBsZXQgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgICAgbGV0IHF1YWxpZmllcjogUXVhbGlmaWVyID0gbnVsbDtcblxuICAgICAgICBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcImV4cG9ydCBcIikpIHtcbiAgICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcImV4cG9ydCBcIi5sZW5ndGgpLnRyaW0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwicHVibGljIFwiKSkge1xuICAgICAgICAgIHF1YWxpZmllciA9IFwicHVibGljXCI7XG4gICAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwdWJsaWNcIi5sZW5ndGgpO1xuICAgICAgICB9IGVsc2UgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJwcml2YXRlIFwiKSkge1xuICAgICAgICAgIHF1YWxpZmllciA9IFwicHJpdmF0ZVwiO1xuICAgICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJpdmF0ZVwiLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcInByb3RlY3RlZCBcIikpIHtcbiAgICAgICAgICBxdWFsaWZpZXIgPSBcInByb3RlY3RlZFwiO1xuICAgICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJvdGVjdGVkXCIubGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUudHJpbSgpO1xuICAgICAgICBsZXQgaXNDbGFzcyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJjbGFzcyBcIik7XG5cbiAgICAgICAgaWYgKCFpc0NsYXNzKSB7XG4gICAgICAgICAgaXNTdGF0aWMgPSBuZXh0TGluZS5zdGFydHNXaXRoKFwic3RhdGljIFwiKTtcbiAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICAgIG5leHRMaW5lLnN1YnN0cmluZyhcInN0YXRpYyBcIi5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0NsYXNzKSB7XG4gICAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJjbGFzcyBcIi5sZW5ndGgpO1xuICAgICAgICAgIC8vIFRPRE86IG9iamVjdCBwb29saW5nXG4gICAgICAgICAgYXdhaXQgKGRlY29yYXRvckZ1bmMgYXMgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248YW55Pikoe1xuICAgICAgICAgICAgY2xhc3NOYW1lOiBuZXh0TGluZS5zdWJzdHJpbmcoMCwgbmV4dExpbmUuaW5kZXhPZihcIiBcIikpLFxuICAgICAgICAgICAgYXJnczogYXJnTGlzdCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiByZXN1bHQsXG4gICAgICAgICAgfSBhcyBEZXNpZ25UaW1lQ2xhc3MpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBsZXQgY29sb25cbiAgICAgICAgICBsZXQgdHlwZVNlcGFyYXRvckluZGV4ID0gbmV4dExpbmUuaW5kZXhPZihcIjpcIik7XG4gICAgICAgICAgbGV0IGtleSA9IG5leHRMaW5lLnN1YnN0cmluZygwLCB0eXBlU2VwYXJhdG9ySW5kZXgpLnRyaW0oKTtcbiAgICAgICAgICBsZXQgdHlwZU5hbWUgPSBuZXh0TGluZS5zdWJzdHJpbmcodHlwZVNlcGFyYXRvckluZGV4ICsgMSkudHJpbSgpO1xuXG4gICAgICAgICAgbGV0IHNlbWljb2xvbkluZGV4ID0gdHlwZU5hbWUuaW5kZXhPZihcIjtcIik7XG4gICAgICAgICAgaWYgKHNlbWljb2xvbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHR5cGVOYW1lID0gdHlwZU5hbWUuc3Vic3RyaW5nKDAsIHNlbWljb2xvbkluZGV4KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAocmVzdWx0LmNvZGUgYXMgYW55KSA9IGNvZGU7XG4gICAgICAgICAgLy8gVE9ETzogb2JqZWN0IHBvb2xpbmdcbiAgICAgICAgICBjb25zdCBuZXdDb2RlID0gYXdhaXQgKGRlY29yYXRvckZ1bmMgYXMgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PikoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICAgIGFyZ3M6IGFyZ0xpc3QsXG4gICAgICAgICAgICAgIGlzU3RhdGljLFxuICAgICAgICAgICAgICBxdWFsaWZpZXIsXG4gICAgICAgICAgICAgIG1ldGFkYXRhOiByZXN1bHQsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoIW5ld0NvZGUgJiYgbmV3Q29kZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgKHJlc3VsdC5zdGFydEluZGV4IGFzIGFueSkgPSBwcmVmaXhTdGFydDtcbiAgICAgICAgICAgIChyZXN1bHQuc3RvcEluZGV4IGFzIGFueSkgPSBwcmVmaXhFbmQ7XG4gICAgICAgICAgICAocmVzdWx0LmNvZGUgYXMgYW55KSA9IG5ld0NvZGUgfHwgXCJcIjtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAocmVzdWx0LnN0YXJ0SW5kZXggYXMgYW55KSA9IHByZWZpeFN0YXJ0IC0gMTtcbiAgICAgICAgICAocmVzdWx0LnN0b3BJbmRleCBhcyBhbnkpID0gbmV4dExpbmVFbmQgLSAxO1xuICAgICAgICAgIChyZXN1bHQuY29kZSBhcyBhbnkpID0gbmV3Q29kZSB8fCBcIlwiO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkZWNvcmF0b3JGdW5jdGlvbnNbaV0gPSBwcm9jZXNzRGVjb3JhdG9yO1xuICAgIH1cbiAgICBmaWxlTWFwcGluZ1twYXRoLmJhc2VuYW1lKG1vZHVsZU5hbWUsIHBhdGguZXh0bmFtZShtb2R1bGVOYW1lKSldID0ge1xuICAgICAgZGVjb3JhdG9yRnVuY3Rpb25zLFxuICAgICAgZGVjb3JhdG9yUHJlZml4ZXMsXG4gICAgfTtcbiAgICBkZWNvcmF0b3JQcmVmaXhlcy5mb3JFYWNoKChwcmVmaXgpID0+IGFsbFByZWZpeGVzLmFkZChwcmVmaXgpKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHVsZXNUb0NoZWNrID0gT2JqZWN0LmtleXMoZmlsZU1hcHBpbmcpO1xuICByZXR1cm4ge1xuICAgIHByb2Nlc3M6IGFzeW5jIChjb2RlOiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGZvciAobGV0IGRlY29yYXRvck1vZHVsZU5hbWUgb2YgbW9kdWxlc1RvQ2hlY2spIHtcbiAgICAgICAgLy8gVGhlcmUncyBnb3R0YSBiZSBhIGZhc3RlciAmIGxlc3MgaGFja3kgd2F5IHRvIGRvIHRoaXMgd2l0aG91dCBhIGZ1bGwgQVNULlxuICAgICAgICBpZiAoIWNvZGUuaW5jbHVkZXMoZGVjb3JhdG9yTW9kdWxlTmFtZSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IHsgZGVjb3JhdG9yRnVuY3Rpb25zLCBkZWNvcmF0b3JQcmVmaXhlcyB9ID0gZmlsZU1hcHBpbmdbXG4gICAgICAgICAgZGVjb3JhdG9yTW9kdWxlTmFtZVxuICAgICAgICBdO1xuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IC0xO1xuICAgICAgICBsZXQgc3ltYm9sSSA9IGNvZGUubGFzdEluZGV4T2YoXCJAXCIpIC0gMTtcbiAgICAgICAgbGV0IF9wcmVmaXhJID0gLTE7XG4gICAgICAgIGlmIChzeW1ib2xJIDwgLTEpIHJldHVybiB7IGNvbnRlbnRzOiBjb2RlLCBub3RlOiBudWxsIH07XG4gICAgICAgIGlmIChzeW1ib2xJIDwgMCkgc3ltYm9sSSA9IDA7XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IHtcbiAgICAgICAgICBjb2RlLFxuICAgICAgICAgIG9yaWdpbmFsU291cmNlOiBjb2RlLFxuICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgIHN0YXJ0SW5kZXg6IC0xLFxuICAgICAgICAgIHN0b3BJbmRleDogLTEsXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IHByZWZpeEkgPSAtMTtcbiAgICAgICAgZm9yIChfcHJlZml4SSA9IDA7IF9wcmVmaXhJIDwgZGVjb3JhdG9yUHJlZml4ZXMubGVuZ3RoOyBfcHJlZml4SSsrKSB7XG4gICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSBjb2RlLmluZGV4T2YoXG4gICAgICAgICAgICBkZWNvcmF0b3JQcmVmaXhlc1tfcHJlZml4SV0sXG4gICAgICAgICAgICBzeW1ib2xJXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAocmVzdWx0LnN0YXJ0SW5kZXggPiAtMSkge1xuICAgICAgICAgICAgcHJlZml4SSA9IF9wcmVmaXhJO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHByZWZpeCA9IFwiXCI7XG5cbiAgICAgICAgd2hpbGUgKHByZWZpeEkgPiAtMSkge1xuICAgICAgICAgIHByZWZpeCA9IGRlY29yYXRvclByZWZpeGVzW3ByZWZpeEldO1xuICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgX2NvZGUgPSByZXN1bHQuY29kZTtcbiAgICAgICAgICAgIGxldCBkaWRDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGRpZENoYW5nZSA9IGF3YWl0IGRlY29yYXRvckZ1bmN0aW9uc1twcmVmaXhJXShcbiAgICAgICAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICBpZiAoZXhjZXB0aW9uIGluc3RhbmNlb2YgUHJvY2Vzc29yRXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgY29udGVudHM6IFwiXCIsXG4gICAgICAgICAgICAgICAgICBub3RlOiBleGNlcHRpb24ubm90ZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGlkQ2hhbmdlKSB7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xICYmIHJlc3VsdC5zdG9wSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlID1cbiAgICAgICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZygwLCByZXN1bHQuc3RhcnRJbmRleCkgK1xuICAgICAgICAgICAgICAgICAgcmVzdWx0LmNvZGUgK1xuICAgICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKHJlc3VsdC5zdG9wSW5kZXgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHQuY29kZSA9XG4gICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKDAsIHJlc3VsdC5zdGFydEluZGV4IC0gMSkgK1xuICAgICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZyhfY29kZS5pbmRleE9mKFwiXFxuXCIsIHJlc3VsdC5zdGFydEluZGV4KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdC5zdGFydEluZGV4ID0gcmVzdWx0LnN0b3BJbmRleCA9IC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHByZWZpeEkgPSAtMTtcbiAgICAgICAgICBmb3IgKF9wcmVmaXhJID0gMDsgX3ByZWZpeEkgPCBkZWNvcmF0b3JQcmVmaXhlcy5sZW5ndGg7IF9wcmVmaXhJKyspIHtcbiAgICAgICAgICAgIHN5bWJvbEkgPSByZXN1bHQuY29kZS5sYXN0SW5kZXhPZihcIkBcIik7XG4gICAgICAgICAgICBpZiAoc3ltYm9sSSA9PT0gLTEpIGJyZWFrO1xuXG4gICAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCA9IHJlc3VsdC5jb2RlLmluZGV4T2YoXG4gICAgICAgICAgICAgIGRlY29yYXRvclByZWZpeGVzW19wcmVmaXhJXSxcbiAgICAgICAgICAgICAgc3ltYm9sSVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgIHByZWZpeEkgPSBfcHJlZml4STtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZW50czogcmVzdWx0LmNvZGUsXG4gICAgICAgICAgbm90ZTogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHByZWZpeGVzOiBbLi4uYWxsUHJlZml4ZXNdLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvblJlc29sdmVEZWNvcmF0b3IoYXJncykge1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICBuYW1lc3BhY2U6IFwiZGVjb3JhdG9yLXN0dWJcIixcbiAgfTtcbn1cblxuZnVuY3Rpb24gb25SZXNvbHZlU3RhdGljRGVjb3JhdG9ycyhhcmdzKSB7XG4gIHJldHVybiB7XG4gICAgcGF0aDogYXJncy5wYXRoLFxuICAgIG5hbWVzcGFjZTogXCJkZWNreVwiLFxuICB9O1xufVxuXG5jb25zdCBzdGF0aWNEZWNvcmF0b3JDb2RlID0gW3Byb3BlcnR5LCBrbGFzc11cbiAgLm1hcChcbiAgICAoc3R1YikgPT5cbiAgICAgIGAvKiBAX19QVVJFX18gKi9cXG5leHBvcnQgZnVuY3Rpb24gJHtzdHVifSguLi5hcmdzKXtyZXR1cm4gYXJnczt9XFxuYFxuICApXG4gIC5qb2luKFwiXFxuXCIpO1xuXG5mdW5jdGlvbiBvbkxvYWRTdGF0aWNEZWNvcmF0b3JzKGFyZ3MpIHtcbiAgcmV0dXJuIHtcbiAgICBjb250ZW50czogc3RhdGljRGVjb3JhdG9yQ29kZSxcbiAgICBsb2FkZXI6IFwianNcIixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBsdWdpbihkZWNvcmF0b3JzOiBEZWNvcmF0b3JzTWFwKSB7XG4gIGNvbnN0IHsgcHJlZml4ZXMsIHByb2Nlc3MgfSA9IGJ1aWxkRGVjb3JhdG9yUHJvY2Vzc29yKGRlY29yYXRvcnMpO1xuXG4gIGZ1bmN0aW9uIGlzUG90ZW50aWFsTWF0Y2goY29udGVudDogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgcHJlZml4IG9mIHByZWZpeGVzKSB7XG4gICAgICBpZiAoY29udGVudC5pbmNsdWRlcyhwcmVmaXggYXMgc3RyaW5nKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Mb2FkRGVjb3JhdG9yU3R1YihhcmdzKSB7XG4gICAgY29uc3Qgc3R1YiA9IHJlcXVpcmUoYXJncy5wYXRoKS5kZWNvcmF0b3JzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiBPYmplY3Qua2V5cyhzdHViKVxuICAgICAgICAubWFwKFxuICAgICAgICAgIChzdHViKSA9PlxuICAgICAgICAgICAgYC8qIEBfX1BVUkVfXyAqL1xcbmV4cG9ydCBmdW5jdGlvbiAke3N0dWJ9KC4uLmFyZ3Mpe3JldHVybiBhcmdzO31cXG5gXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICBsb2FkZXI6IFwidHNcIixcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gb25Mb2FkVFNYKGFyZ3MpOiBQcm9taXNlPE9uTG9hZFJlc3VsdD4ge1xuICAgIGxldCBjb250ZW50czogc3RyaW5nID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoYXJncy5wYXRoLCBcInV0ZjhcIik7XG4gICAgaWYgKCFpc1BvdGVudGlhbE1hdGNoKGNvbnRlbnRzKSlcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgICBsb2FkZXI6IFwidHN4XCIsXG4gICAgICB9O1xuXG4gICAgY29uc3QgeyBub3RlLCBjb250ZW50czogX2NvbnRlbnRzIH0gPVxuICAgICAgKGF3YWl0IHByb2Nlc3MoY29udGVudHMsIGFyZ3MucGF0aCkpID8/IHt9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiBfY29udGVudHMsXG4gICAgICBlcnJvcnM6IG5vdGVcbiAgICAgICAgPyBbeyBsb2NhdGlvbjogbm90ZS5sb2NhdGlvbiwgZGV0YWlsOiBub3RlLnRleHQgfV1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBsb2FkZXI6IFwidHN4XCIsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uTG9hZFRTKGFyZ3MpOiBQcm9taXNlPE9uTG9hZFJlc3VsdD4ge1xuICAgIGNvbnN0IGNvbnRlbnRzOiBzdHJpbmcgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShhcmdzLnBhdGgsIFwidXRmOFwiKTtcbiAgICBpZiAoIWlzUG90ZW50aWFsTWF0Y2goY29udGVudHMpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudHMsXG4gICAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgICAgfTtcblxuICAgIGNvbnN0IHsgbm90ZSwgY29udGVudHM6IF9jb250ZW50cyB9ID1cbiAgICAgIChhd2FpdCBwcm9jZXNzKGNvbnRlbnRzLCBhcmdzLnBhdGgpKSA/PyB7fTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogX2NvbnRlbnRzLFxuICAgICAgZXJyb3JzOiBub3RlID8gW3sgbG9jYXRpb246IG5vdGUubG9jYXRpb24sIHRleHQ6IG5vdGUudGV4dCB9XSA6IHVuZGVmaW5lZCxcbiAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiZGVzaWduLXRpbWUtZGVjb3JhdG9yc1wiLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vblJlc29sdmUoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzKSQvIH0sXG4gICAgICAgIG9uUmVzb2x2ZURlY29yYXRvclxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZShcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHN4KSQvIH0sXG4gICAgICAgIG9uUmVzb2x2ZURlY29yYXRvclxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogL15kZWNreSQvIH0sIG9uUmVzb2x2ZVN0YXRpY0RlY29yYXRvcnMpO1xuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogL15kZWNreSQvLCBuYW1lc3BhY2U6IFwiZGVja3lcIiB9LFxuICAgICAgICBvbkxvYWRTdGF0aWNEZWNvcmF0b3JzXG4gICAgICApO1xuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0cykkLywgbmFtZXNwYWNlOiBcImRlY29yYXRvci1zdHViXCIgfSxcbiAgICAgICAgb25Mb2FkRGVjb3JhdG9yU3R1YlxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHN4KSQvLCBuYW1lc3BhY2U6IFwiZGVjb3JhdG9yLXN0dWJcIiB9LFxuICAgICAgICBvbkxvYWREZWNvcmF0b3JTdHViXG4gICAgICApO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuKHRzKSQvIH0sIG9uTG9hZFRTKTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogL1xcLih0c3gpJC8gfSwgb25Mb2FkVFNYKTtcbiAgICB9LFxuICB9O1xufVxuXG50eXBlIE9wdGlvbmFsUHJvcGVydHlEZXNjcmlwdG9yPFQ+ID0gVCBleHRlbmRzIEV4Y2x1ZGU8XG4gIChudW1iZXIgfCBzdHJpbmcpW10sXG4gIHVuZGVmaW5lZFxuPlxuICA/ICguLi5hcmdzOiBUKSA9PiBQcm9wZXJ0eURlY29yYXRvclxuICA6IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eTxUPihcbiAgY2FsbGJhY2s6IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPFQ+XG4pOiBPcHRpb25hbFByb3BlcnR5RGVzY3JpcHRvcjxUPiB7XG4gIHJldHVybiB7XG4gICAgY2FsbGJhY2ssXG4gICAgdHlwZTogRGVjb3JhdG9yVHlwZS5wcm9wZXJ0eSxcbiAgfSBhcyBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eVZvaWQoXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxuZXZlcj5cbik6IFByb3BlcnR5RGVjb3JhdG9yIHtcbiAgcmV0dXJuIHtcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLnByb3BlcnR5LFxuICB9IGFzIGFueTtcbn1cblxuZXhwb3J0IHsgcHJvcGVydHkgYXMgcCwgcHJvcGVydHlWb2lkIGFzIHBWIH07XG5leHBvcnQgeyBrbGFzcyBhcyBjIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBrbGFzczxUIGV4dGVuZHMgYW55W10gPSBbXT4oXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPlxuKTogKC4uLmFyZ3M6IFQpID0+IENsYXNzRGVjb3JhdG9yIHtcbiAgcmV0dXJuIDxhbnkgfCB2b2lkPntcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLmtsYXNzLFxuICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZChcbiAgZGVjb3JhdG9yc0dsb2I/OiBzdHJpbmcsXG4gIGFkZGl0aW9uYWxDb25maWc/OiBQYXJ0aWFsPEJ1aWxkT3B0aW9ucz5cbikge1xuICBjb25zdCB7IGRlY29yYXRvcnMgfSA9IHJlcXVpcmUoXCIuL2RlY29yYXRvcnNcIik7XG4gIGNvbnN0IGVudHJ5UG9pbnRzID0gYXdhaXQgZGVjb3JhdG9ycyhkZWNvcmF0b3JzR2xvYiwgYWRkaXRpb25hbENvbmZpZyk7XG4gIGNvbnN0IGZpbGVzID0ge307XG4gIGZvciAobGV0IGZpbGUgb2YgZW50cnlQb2ludHMpIHtcbiAgICBPYmplY3QuYXNzaWduKGZpbGVzLCB7XG4gICAgICBbZmlsZV06IHJlcXVpcmUocGF0aC5qb2luKFxuICAgICAgICBwcm9jZXNzLmN3ZCgpLFxuICAgICAgICBwYXRoLmRpcm5hbWUoZmlsZSksXG4gICAgICAgIHBhdGguYmFzZW5hbWUoZmlsZSkucmVwbGFjZShcIi50c1wiLCBcIi5qc1wiKVxuICAgICAgKSkuZGVjb3JhdG9ycyxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBwbHVnaW4oZmlsZXMpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQ0E7QUFDQTtBQUNBO0FBbURBLGNBQWM7QUFDWixTQUFPLE1BQU07QUFBQTtBQXZEZiw2QkEwRDZCO0FBQUEsRUFDM0IsWUFDRSxTQUNBLE1BQ0EsWUFDQSxVQUNBO0FBRUEsVUFBTTtBQUNOLFNBQUssT0FBTztBQUFBLE1BQ1YsTUFBTTtB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
