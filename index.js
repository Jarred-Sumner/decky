var __create = Object.create, __defProp = Object.defineProperty, __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty, __getOwnPropNames = Object.getOwnPropertyNames, __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: !0});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: !0});
}, __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 == "object" || typeof module2 == "function")
    for (let key of __getOwnPropNames(module2))
      !__hasOwnProp.call(target, key) && key !== "default" && __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  return target;
}, __toModule = (module2) => module2 && module2.__esModule ? module2 : __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", {value: module2, enumerable: !0})), module2);
__markAsModule(exports);
__export(exports, {
  c: () => klass,
  klass: () => klass,
  load: () => load,
  p: () => property,
  pV: () => propertyVoid,
  plugin: () => plugin,
  property: () => property,
  propertyVoid: () => propertyVoid
});
var import_fs = __toModule(require("fs")), import_decorators = __toModule(require("./decorators")), import_path = __toModule(require("path"));
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
    fileMapping[import_path.default.basename(moduleName, import_path.default.extname(moduleName))] = {
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
    let contents = await import_fs.default.promises.readFile(args.path, "utf8");
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
    const contents = await import_fs.default.promises.readFile(args.path, "utf8");
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
    type: import_decorators.DecoratorType.property
  };
}
function propertyVoid(callback) {
  return {
    callback,
    type: import_decorators.DecoratorType.property
  };
}
function klass(callback) {
  return {
    callback,
    type: import_decorators.DecoratorType.klass
  };
}
async function load(decoratorsGlob, additionalConfig) {
  const {decorators} = require("./decorators"), entryPoints = await decorators(decoratorsGlob, additionalConfig), files = {};
  for (let file of entryPoints)
    Object.assign(files, {
      [file]: require(import_path.default.join(process.cwd(), import_path.default.dirname(file), import_path.default.basename(file).replace(".ts", ".js"))).decorators
    });
  return plugin(files);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEJ1aWxkT3B0aW9ucywgT25Mb2FkUmVzdWx0LCBQYXJ0aWFsTm90ZSB9IGZyb20gXCJlc2J1aWxkXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBEZWNvcmF0b3JUeXBlIH0gZnJvbSBcIi4vZGVjb3JhdG9yc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbnR5cGUgUXVhbGlmaWVyID0gXCJwdWJsaWNcIiB8IFwicHJpdmF0ZVwiIHwgXCJwcm90ZWN0ZWRcIiB8IG51bGw7XG5cbnR5cGUgRGVzaWduVGltZVByb3BlcnR5PFQgPSBhbnlbXT4gPSB7XG4gIGtleTogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICBhcmdzPzogVDtcbiAgaXNTdGF0aWM/OiBib29sZWFuO1xuICBxdWFsaWZpZXI/OiBRdWFsaWZpZXI7XG4gIG1ldGFkYXRhPzogRGVjb3JhdG9yUmVzdWx0O1xufTtcblxudHlwZSBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPiA9IChcbiAgcHJvcGVydHk6IERlc2lnblRpbWVQcm9wZXJ0eTxUPlxuKSA9PiB2b2lkIHwgYW55O1xuXG5leHBvcnQgdHlwZSBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3I8VD4gPSAoXG4gIC4uLmFyZ3M6IHN0cmluZ1tdXG4pID0+IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPFQ+O1xuXG50eXBlIERlc2lnblRpbWVDbGFzczxUID0gYW55W10+ID0ge1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgYXJncz86IFQ7XG4gIG1ldGFkYXRhPzogRGVjb3JhdG9yUmVzdWx0O1xufTtcblxudHlwZSBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPiA9IChrbGFzczogRGVzaWduVGltZUNsYXNzPFQ+KSA9PiB2b2lkIHwgYW55O1xuXG5leHBvcnQgdHlwZSBEZXNpZ25UaW1lQ2xhc3NEZWNvcmF0b3I8VD4gPSAoKSA9PiBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPjtcblxuZXhwb3J0IHR5cGUgRGVjb3JhdG9yc01hcCA9IHtcbiAgW21vZHVsZVBhdGg6IHN0cmluZ106IHtcbiAgICBbbmFtZTogc3RyaW5nXTpcbiAgICAgIHwgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yPGFueT5cbiAgICAgIHwgRGVzaWduVGltZUNsYXNzRGVjb3JhdG9yPGFueT47XG4gIH07XG59O1xuXG5pbnRlcmZhY2UgRGVjb3JhdG9yUmVzdWx0IHtcbiAgcmVhZG9ubHkgY29kZTogc3RyaW5nO1xuICByZWFkb25seSBvcmlnaW5hbFNvdXJjZTogc3RyaW5nO1xuICByZWFkb25seSBmaWxlUGF0aDogc3RyaW5nO1xuICByZWFkb25seSBzdGFydEluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IHN0b3BJbmRleDogbnVtYmVyO1xufVxuXG50eXBlIERlY29yYXRvclByb2Nlc3NvciA9IChcbiAgcHJlZml4U3RhcnQ6IG51bWJlcixcbiAgcmVzdWx0OiBEZWNvcmF0b3JSZXN1bHRcbikgPT4gYm9vbGVhbjtcblxuZnVuY3Rpb24gdHJpbShpbnB1dDogc3RyaW5nKSB7XG4gIHJldHVybiBpbnB1dC50cmltKCk7XG59XG5cbmNsYXNzIFByb2Nlc3NvckVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICBsaW5lVGV4dDogc3RyaW5nLFxuICAgIGNvbHVtbj86IG51bWJlclxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5vdGUgPSB7XG4gICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgZmlsZSxcbiAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgbGluZVRleHQsXG5cbiAgICAgICAgY29sdW1uLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG4gIG5vdGU6IFBhcnRpYWxOb3RlO1xufVxuXG5mdW5jdGlvbiBidWlsZERlY29yYXRvclByb2Nlc3NvcihkZWNvcmF0b3JzTW9kdWxlTWFwOiBEZWNvcmF0b3JzTWFwKSB7XG4gIGNvbnN0IGZpbGVNYXBwaW5nID0ge307XG4gIGNvbnN0IGFsbFByZWZpeGVzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBtb2R1bGVOYW1lIGluIGRlY29yYXRvcnNNb2R1bGVNYXApIHtcbiAgICBjb25zdCBkZWNvcmF0b3JzID0gZGVjb3JhdG9yc01vZHVsZU1hcFttb2R1bGVOYW1lXTtcbiAgICBjb25zdCBkZWNvcmF0b3JLZXlzID0gT2JqZWN0LmtleXMoZGVjb3JhdG9ycykuc29ydCgpLnJldmVyc2UoKTtcbiAgICBjb25zdCBkZWNvcmF0b3JQcmVmaXhlcyA9IGRlY29yYXRvcktleXMubWFwKChhKSA9PiBhLnRvU3RyaW5nKCkpO1xuICAgIGNvbnN0IGRlY29yYXRvckZ1bmN0aW9uczogQXJyYXk8RGVjb3JhdG9yUHJvY2Vzc29yPiA9IG5ldyBBcnJheShcbiAgICAgIGRlY29yYXRvcktleXMubGVuZ3RoXG4gICAgKTtcbiAgICBjb25zdCBmbGF0dGVuZWRGdW5jcyA9IGRlY29yYXRvcktleXMubWFwKFxuICAgICAgKGEpID0+IChkZWNvcmF0b3JzW2FdIGFzIGFueSkuY2FsbGJhY2tcbiAgICApO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWNvcmF0b3JLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBrZXkgPSBkZWNvcmF0b3JLZXlzW2ldO1xuICAgICAgY29uc3QgcHJlZml4ID0gZGVjb3JhdG9yUHJlZml4ZXNbaV07XG4gICAgICBjb25zdCBsZW5ndGggPSBrZXkubGVuZ3RoO1xuICAgICAgY29uc3QgZGVjb3JhdG9yRnVuYzpcbiAgICAgICAgfCBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxhbnk+XG4gICAgICAgIHwgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PiA9IGZsYXR0ZW5lZEZ1bmNzW2ldO1xuXG4gICAgICBjb25zdCBwcm9jZXNzRGVjb3JhdG9yOiBEZWNvcmF0b3JQcm9jZXNzb3IgPSBhc3luYyAoXG4gICAgICAgIHByZWZpeFN0YXJ0LFxuICAgICAgICByZXN1bHRcbiAgICAgICkgPT4ge1xuICAgICAgICBsZXQgY29kZSA9IHJlc3VsdC5jb2RlO1xuICAgICAgICBsZXQgcHJlZml4RW5kID0gcHJlZml4U3RhcnQgKyBsZW5ndGg7XG4gICAgICAgIGxldCBhcmdTdGFydCA9IHByZWZpeEVuZDtcbiAgICAgICAgbGV0IGxpbmVFbmQgPSBjb2RlLmluZGV4T2YoXCJcXG5cIiwgcHJlZml4U3RhcnQpO1xuICAgICAgICBsZXQgYXJnRW5kID0gLTE7XG4gICAgICAgIGxldCBhcmdMaXN0O1xuICAgICAgICBpZiAoY29kZVthcmdTdGFydCsrXSA9PT0gXCIoXCIpIHtcbiAgICAgICAgICBhcmdFbmQgPSBjb2RlLmluZGV4T2YoXCIpXCIsIGFyZ1N0YXJ0KTtcbiAgICAgICAgICBpZiAoYXJnRW5kIC0gMSA+IGFyZ1N0YXJ0KSB7XG4gICAgICAgICAgICBpZiAoYXJnRW5kIDwgMClcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFByb2Nlc3NvckVycm9yKFxuICAgICAgICAgICAgICAgIGBNaXNzaW5nICkgZm9yICR7cHJlZml4fWAsXG4gICAgICAgICAgICAgICAgcmVzdWx0LmZpbGVQYXRoLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnNwbGl0KFwiXFxuXCIpW1xuICAgICAgICAgICAgICAgICAgcmVzdWx0LmNvZGUuc3Vic3RyaW5nKDAsIHByZWZpeFN0YXJ0KS5zcGxpdChcIlxcblwiKS5sZW5ndGhcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHByZWZpeEVuZFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhcmdMaXN0ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgICAgICBcIltcIiArIGNvZGUuc3Vic3RyaW5nKGFyZ1N0YXJ0LCBhcmdFbmQpICsgXCJdXCJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgUHJvY2Vzc29yRXJyb3IoXG4gICAgICAgICAgICAgICAgYEFyZ3VtZW50cyB0byAke3ByZWZpeH0gbXVzdCBiZSBKU09OLiBSZWNlaXZlZDogWyR7Y29kZS5zdWJzdHJpbmcoXG4gICAgICAgICAgICAgICAgICBhcmdTdGFydCxcbiAgICAgICAgICAgICAgICAgIGFyZ0VuZFxuICAgICAgICAgICAgICAgICl9XWAsXG4gICAgICAgICAgICAgICAgcmVzdWx0LmZpbGVQYXRoLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoIC0gMSxcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zcGxpdChcIlxcblwiKVtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgYXJnU3RhcnRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJnU3RhcnQgPSAtMTtcbiAgICAgICAgICAgIGFyZ0xpc3QgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXJnU3RhcnQgPSAtMTtcbiAgICAgICAgICBhcmdMaXN0ID0gW107XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5leHRMaW5lU3RhcnQgPSBsaW5lRW5kICsgMTtcbiAgICAgICAgbGV0IG5leHRMaW5lRW5kID0gY29kZS5pbmRleE9mKFwiXFxuXCIsIG5leHRMaW5lU3RhcnQpO1xuICAgICAgICBjb25zdCBvcmlnaW5hbExpbmUgPSBjb2RlLnN1YnN0cmluZyhuZXh0TGluZVN0YXJ0LCBuZXh0TGluZUVuZCkudHJpbSgpO1xuICAgICAgICBsZXQgbmV4dExpbmUgPSBvcmlnaW5hbExpbmU7XG4gICAgICAgIGxldCBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgICBsZXQgcXVhbGlmaWVyOiBRdWFsaWZpZXIgPSBudWxsO1xuXG4gICAgICAgIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwiZXhwb3J0IFwiKSkge1xuICAgICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwiZXhwb3J0IFwiLmxlbmd0aCkudHJpbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJwdWJsaWMgXCIpKSB7XG4gICAgICAgICAgcXVhbGlmaWVyID0gXCJwdWJsaWNcIjtcbiAgICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcInB1YmxpY1wiLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcInByaXZhdGUgXCIpKSB7XG4gICAgICAgICAgcXVhbGlmaWVyID0gXCJwcml2YXRlXCI7XG4gICAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwcml2YXRlXCIubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwicHJvdGVjdGVkIFwiKSkge1xuICAgICAgICAgIHF1YWxpZmllciA9IFwicHJvdGVjdGVkXCI7XG4gICAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwcm90ZWN0ZWRcIi5sZW5ndGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS50cmltKCk7XG4gICAgICAgIGxldCBpc0NsYXNzID0gbmV4dExpbmUuc3RhcnRzV2l0aChcImNsYXNzIFwiKTtcblxuICAgICAgICBpZiAoIWlzQ2xhc3MpIHtcbiAgICAgICAgICBpc1N0YXRpYyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJzdGF0aWMgXCIpO1xuICAgICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgICAgbmV4dExpbmUuc3Vic3RyaW5nKFwic3RhdGljIFwiLmxlbmd0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQ2xhc3MpIHtcbiAgICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcImNsYXNzIFwiLmxlbmd0aCk7XG4gICAgICAgICAgLy8gVE9ETzogb2JqZWN0IHBvb2xpbmdcbiAgICAgICAgICBhd2FpdCAoZGVjb3JhdG9yRnVuYyBhcyBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxhbnk+KSh7XG4gICAgICAgICAgICBjbGFzc05hbWU6IG5leHRMaW5lLnN1YnN0cmluZygwLCBuZXh0TGluZS5pbmRleE9mKFwiIFwiKSksXG4gICAgICAgICAgICBhcmdzOiBhcmdMaXN0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHJlc3VsdCxcbiAgICAgICAgICB9IGFzIERlc2lnblRpbWVDbGFzcyk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGxldCBjb2xvblxuICAgICAgICAgIGxldCB0eXBlU2VwYXJhdG9ySW5kZXggPSBuZXh0TGluZS5pbmRleE9mKFwiOlwiKTtcbiAgICAgICAgICBsZXQga2V5ID0gbmV4dExpbmUuc3Vic3RyaW5nKDAsIHR5cGVTZXBhcmF0b3JJbmRleCkudHJpbSgpO1xuICAgICAgICAgIGxldCB0eXBlTmFtZSA9IG5leHRMaW5lLnN1YnN0cmluZyh0eXBlU2VwYXJhdG9ySW5kZXggKyAxKS50cmltKCk7XG5cbiAgICAgICAgICBsZXQgc2VtaWNvbG9uSW5kZXggPSB0eXBlTmFtZS5pbmRleE9mKFwiO1wiKTtcbiAgICAgICAgICBpZiAoc2VtaWNvbG9uSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdHlwZU5hbWUgPSB0eXBlTmFtZS5zdWJzdHJpbmcoMCwgc2VtaWNvbG9uSW5kZXgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIChyZXN1bHQuY29kZSBhcyBhbnkpID0gY29kZTtcbiAgICAgICAgICAvLyBUT0RPOiBvYmplY3QgcG9vbGluZ1xuICAgICAgICAgIGNvbnN0IG5ld0NvZGUgPSBhd2FpdCAoZGVjb3JhdG9yRnVuYyBhcyBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxhbnk+KShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgICAgICAgICAgYXJnczogYXJnTGlzdCxcbiAgICAgICAgICAgICAgaXNTdGF0aWMsXG4gICAgICAgICAgICAgIHF1YWxpZmllcixcbiAgICAgICAgICAgICAgbWV0YWRhdGE6IHJlc3VsdCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICghbmV3Q29kZSAmJiBuZXdDb2RlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAocmVzdWx0LnN0YXJ0SW5kZXggYXMgYW55KSA9IHByZWZpeFN0YXJ0O1xuICAgICAgICAgICAgKHJlc3VsdC5zdG9wSW5kZXggYXMgYW55KSA9IHByZWZpeEVuZDtcbiAgICAgICAgICAgIChyZXN1bHQuY29kZSBhcyBhbnkpID0gbmV3Q29kZSB8fCBcIlwiO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIChyZXN1bHQuc3RhcnRJbmRleCBhcyBhbnkpID0gcHJlZml4U3RhcnQgLSAxO1xuICAgICAgICAgIChyZXN1bHQuc3RvcEluZGV4IGFzIGFueSkgPSBuZXh0TGluZUVuZCAtIDE7XG4gICAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBuZXdDb2RlIHx8IFwiXCI7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGRlY29yYXRvckZ1bmN0aW9uc1tpXSA9IHByb2Nlc3NEZWNvcmF0b3I7XG4gICAgfVxuICAgIGZpbGVNYXBwaW5nW3BhdGguYmFzZW5hbWUobW9kdWxlTmFtZSwgcGF0aC5leHRuYW1lKG1vZHVsZU5hbWUpKV0gPSB7XG4gICAgICBkZWNvcmF0b3JGdW5jdGlvbnMsXG4gICAgICBkZWNvcmF0b3JQcmVmaXhlcyxcbiAgICB9O1xuICAgIGRlY29yYXRvclByZWZpeGVzLmZvckVhY2goKHByZWZpeCkgPT4gYWxsUHJlZml4ZXMuYWRkKHByZWZpeCkpO1xuICB9XG5cbiAgY29uc3QgbW9kdWxlc1RvQ2hlY2sgPSBPYmplY3Qua2V5cyhmaWxlTWFwcGluZyk7XG4gIHJldHVybiB7XG4gICAgcHJvY2VzczogYXN5bmMgKGNvZGU6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgZm9yIChsZXQgZGVjb3JhdG9yTW9kdWxlTmFtZSBvZiBtb2R1bGVzVG9DaGVjaykge1xuICAgICAgICAvLyBUaGVyZSdzIGdvdHRhIGJlIGEgZmFzdGVyICYgbGVzcyBoYWNreSB3YXkgdG8gZG8gdGhpcyB3aXRob3V0IGEgZnVsbCBBU1QuXG4gICAgICAgIGlmICghY29kZS5pbmNsdWRlcyhkZWNvcmF0b3JNb2R1bGVOYW1lKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3QgeyBkZWNvcmF0b3JGdW5jdGlvbnMsIGRlY29yYXRvclByZWZpeGVzIH0gPSBmaWxlTWFwcGluZ1tcbiAgICAgICAgICBkZWNvcmF0b3JNb2R1bGVOYW1lXG4gICAgICAgIF07XG4gICAgICAgIGxldCBzdGFydEluZGV4ID0gLTE7XG4gICAgICAgIGxldCBzeW1ib2xJID0gY29kZS5sYXN0SW5kZXhPZihcIkBcIikgLSAxO1xuICAgICAgICBsZXQgX3ByZWZpeEkgPSAtMTtcbiAgICAgICAgaWYgKHN5bWJvbEkgPCAtMSkgcmV0dXJuIHsgY29udGVudHM6IGNvZGUsIG5vdGU6IG51bGwgfTtcbiAgICAgICAgaWYgKHN5bWJvbEkgPCAwKSBzeW1ib2xJID0gMDtcblxuICAgICAgICBsZXQgcmVzdWx0ID0ge1xuICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgb3JpZ2luYWxTb3VyY2U6IGNvZGUsXG4gICAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgICAgc3RhcnRJbmRleDogLTEsXG4gICAgICAgICAgc3RvcEluZGV4OiAtMSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgcHJlZml4SSA9IC0xO1xuICAgICAgICBmb3IgKF9wcmVmaXhJID0gMDsgX3ByZWZpeEkgPCBkZWNvcmF0b3JQcmVmaXhlcy5sZW5ndGg7IF9wcmVmaXhJKyspIHtcbiAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCA9IGNvZGUuaW5kZXhPZihcbiAgICAgICAgICAgIGRlY29yYXRvclByZWZpeGVzW19wcmVmaXhJXSxcbiAgICAgICAgICAgIHN5bWJvbElcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBwcmVmaXhJID0gX3ByZWZpeEk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJlZml4ID0gXCJcIjtcblxuICAgICAgICB3aGlsZSAocHJlZml4SSA+IC0xKSB7XG4gICAgICAgICAgcHJlZml4ID0gZGVjb3JhdG9yUHJlZml4ZXNbcHJlZml4SV07XG4gICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBfY29kZSA9IHJlc3VsdC5jb2RlO1xuICAgICAgICAgICAgbGV0IGRpZENoYW5nZSA9IGZhbHNlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgZGlkQ2hhbmdlID0gYXdhaXQgZGVjb3JhdG9yRnVuY3Rpb25zW3ByZWZpeEldKFxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdGFydEluZGV4LFxuICAgICAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIGlmIChleGNlcHRpb24gaW5zdGFuY2VvZiBQcm9jZXNzb3JFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICBjb250ZW50czogXCJcIixcbiAgICAgICAgICAgICAgICAgIG5vdGU6IGV4Y2VwdGlvbi5ub3RlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaWRDaGFuZ2UpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEgJiYgcmVzdWx0LnN0b3BJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvZGUgPVxuICAgICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKDAsIHJlc3VsdC5zdGFydEluZGV4KSArXG4gICAgICAgICAgICAgICAgICByZXN1bHQuY29kZSArXG4gICAgICAgICAgICAgICAgICBfY29kZS5zdWJzdHJpbmcocmVzdWx0LnN0b3BJbmRleCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlID1cbiAgICAgICAgICAgICAgICBfY29kZS5zdWJzdHJpbmcoMCwgcmVzdWx0LnN0YXJ0SW5kZXggLSAxKSArXG4gICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKF9jb2RlLmluZGV4T2YoXCJcXG5cIiwgcmVzdWx0LnN0YXJ0SW5kZXgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSByZXN1bHQuc3RvcEluZGV4ID0gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJlZml4SSA9IC0xO1xuICAgICAgICAgIGZvciAoX3ByZWZpeEkgPSAwOyBfcHJlZml4SSA8IGRlY29yYXRvclByZWZpeGVzLmxlbmd0aDsgX3ByZWZpeEkrKykge1xuICAgICAgICAgICAgc3ltYm9sSSA9IHJlc3VsdC5jb2RlLmxhc3RJbmRleE9mKFwiQFwiKTtcbiAgICAgICAgICAgIGlmIChzeW1ib2xJID09PSAtMSkgYnJlYWs7XG5cbiAgICAgICAgICAgIHJlc3VsdC5zdGFydEluZGV4ID0gcmVzdWx0LmNvZGUuaW5kZXhPZihcbiAgICAgICAgICAgICAgZGVjb3JhdG9yUHJlZml4ZXNbX3ByZWZpeEldLFxuICAgICAgICAgICAgICBzeW1ib2xJXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgcHJlZml4SSA9IF9wcmVmaXhJO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRlbnRzOiByZXN1bHQuY29kZSxcbiAgICAgICAgICBub3RlOiBudWxsLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sXG4gICAgcHJlZml4ZXM6IFsuLi5hbGxQcmVmaXhlc10sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG9uUmVzb2x2ZURlY29yYXRvcihhcmdzKSB7XG4gIHJldHVybiB7XG4gICAgcGF0aDogYXJncy5wYXRoLFxuICAgIG5hbWVzcGFjZTogXCJkZWNvcmF0b3Itc3R1YlwiLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvblJlc29sdmVTdGF0aWNEZWNvcmF0b3JzKGFyZ3MpIHtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBhcmdzLnBhdGgsXG4gICAgbmFtZXNwYWNlOiBcImRlY2t5XCIsXG4gIH07XG59XG5cbmNvbnN0IHN0YXRpY0RlY29yYXRvckNvZGUgPSBbcHJvcGVydHksIGtsYXNzXVxuICAubWFwKFxuICAgIChzdHViKSA9PlxuICAgICAgYC8qIEBfX1BVUkVfXyAqL1xcbmV4cG9ydCBmdW5jdGlvbiAke3N0dWJ9KC4uLmFyZ3Mpe3JldHVybiBhcmdzO31cXG5gXG4gIClcbiAgLmpvaW4oXCJcXG5cIik7XG5cbmZ1bmN0aW9uIG9uTG9hZFN0YXRpY0RlY29yYXRvcnMoYXJncykge1xuICByZXR1cm4ge1xuICAgIGNvbnRlbnRzOiBzdGF0aWNEZWNvcmF0b3JDb2RlLFxuICAgIGxvYWRlcjogXCJqc1wiLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGx1Z2luKGRlY29yYXRvcnM6IERlY29yYXRvcnNNYXApIHtcbiAgY29uc3QgeyBwcmVmaXhlcywgcHJvY2VzcyB9ID0gYnVpbGREZWNvcmF0b3JQcm9jZXNzb3IoZGVjb3JhdG9ycyk7XG5cbiAgZnVuY3Rpb24gaXNQb3RlbnRpYWxNYXRjaChjb250ZW50OiBzdHJpbmcpIHtcbiAgICBmb3IgKGxldCBwcmVmaXggb2YgcHJlZml4ZXMpIHtcbiAgICAgIGlmIChjb250ZW50LmluY2x1ZGVzKHByZWZpeCkpIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTG9hZERlY29yYXRvclN0dWIoYXJncykge1xuICAgIGNvbnN0IHN0dWIgPSByZXF1aXJlKGFyZ3MucGF0aCkuZGVjb3JhdG9ycztcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogT2JqZWN0LmtleXMoc3R1YilcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAoc3R1YikgPT5cbiAgICAgICAgICAgIGAvKiBAX19QVVJFX18gKi9cXG5leHBvcnQgZnVuY3Rpb24gJHtzdHVifSguLi5hcmdzKXtyZXR1cm4gYXJnczt9XFxuYFxuICAgICAgICApXG4gICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgbG9hZGVyOiBcInRzXCIsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uTG9hZFRTWChhcmdzKTogUHJvbWlzZTxPbkxvYWRSZXN1bHQ+IHtcbiAgICBsZXQgY29udGVudHM6IHN0cmluZyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGFyZ3MucGF0aCwgXCJ1dGY4XCIpO1xuICAgIGlmICghaXNQb3RlbnRpYWxNYXRjaChjb250ZW50cykpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50cyxcbiAgICAgICAgbG9hZGVyOiBcInRzeFwiLFxuICAgICAgfTtcblxuICAgIGNvbnN0IHsgbm90ZSwgY29udGVudHM6IF9jb250ZW50cyB9ID1cbiAgICAgIChhd2FpdCBwcm9jZXNzKGNvbnRlbnRzLCBhcmdzLnBhdGgpKSA/PyB7fTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogX2NvbnRlbnRzLFxuICAgICAgZXJyb3JzOiBub3RlXG4gICAgICAgID8gW3sgbG9jYXRpb246IG5vdGUubG9jYXRpb24sIGRldGFpbDogbm90ZS50ZXh0IH1dXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgbG9hZGVyOiBcInRzeFwiLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBvbkxvYWRUUyhhcmdzKTogUHJvbWlzZTxPbkxvYWRSZXN1bHQ+IHtcbiAgICBjb25zdCBjb250ZW50czogc3RyaW5nID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoYXJncy5wYXRoLCBcInV0ZjhcIik7XG4gICAgaWYgKCFpc1BvdGVudGlhbE1hdGNoKGNvbnRlbnRzKSlcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgICBsb2FkZXI6IFwidHNcIixcbiAgICAgIH07XG5cbiAgICBjb25zdCB7IG5vdGUsIGNvbnRlbnRzOiBfY29udGVudHMgfSA9XG4gICAgICAoYXdhaXQgcHJvY2Vzcyhjb250ZW50cywgYXJncy5wYXRoKSkgPz8ge307XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IF9jb250ZW50cyxcbiAgICAgIGVycm9yczogbm90ZSA/IFt7IGxvY2F0aW9uOiBub3RlLmxvY2F0aW9uLCB0ZXh0OiBub3RlLnRleHQgfV0gOiB1bmRlZmluZWQsXG4gICAgICBsb2FkZXI6IFwidHNcIixcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImRlc2lnbi10aW1lLWRlY29yYXRvcnNcIixcbiAgICBzZXR1cChidWlsZCkge1xuICAgICAgYnVpbGQub25SZXNvbHZlKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0cykkLyB9LFxuICAgICAgICBvblJlc29sdmVEZWNvcmF0b3JcbiAgICAgICk7XG4gICAgICBidWlsZC5vblJlc29sdmUoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzeCkkLyB9LFxuICAgICAgICBvblJlc29sdmVEZWNvcmF0b3JcbiAgICAgICk7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eZGVja3kkLyB9LCBvblJlc29sdmVTdGF0aWNEZWNvcmF0b3JzKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9eZGVja3kkLywgbmFtZXNwYWNlOiBcImRlY2t5XCIgfSxcbiAgICAgICAgb25Mb2FkU3RhdGljRGVjb3JhdG9yc1xuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHMpJC8sIG5hbWVzcGFjZTogXCJkZWNvcmF0b3Itc3R1YlwiIH0sXG4gICAgICAgIG9uTG9hZERlY29yYXRvclN0dWJcbiAgICAgICk7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzeCkkLywgbmFtZXNwYWNlOiBcImRlY29yYXRvci1zdHViXCIgfSxcbiAgICAgICAgb25Mb2FkRGVjb3JhdG9yU3R1YlxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogL1xcLih0cykkLyB9LCBvbkxvYWRUUyk7XG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9cXC4odHN4KSQvIH0sIG9uTG9hZFRTWCk7XG4gICAgfSxcbiAgfTtcbn1cblxudHlwZSBPcHRpb25hbFByb3BlcnR5RGVzY3JpcHRvcjxUPiA9IFQgZXh0ZW5kcyBFeGNsdWRlPFxuICAobnVtYmVyIHwgc3RyaW5nKVtdLFxuICB1bmRlZmluZWRcbj5cbiAgPyAoLi4uYXJnczogVCkgPT4gUHJvcGVydHlEZWNvcmF0b3JcbiAgOiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHk8VD4oXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPlxuKTogT3B0aW9uYWxQcm9wZXJ0eURlc2NyaXB0b3I8VD4ge1xuICByZXR1cm4ge1xuICAgIGNhbGxiYWNrLFxuICAgIHR5cGU6IERlY29yYXRvclR5cGUucHJvcGVydHksXG4gIH0gYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHlWb2lkKFxuICBjYWxsYmFjazogRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248bmV2ZXI+XG4pOiBQcm9wZXJ0eURlY29yYXRvciB7XG4gIHJldHVybiB7XG4gICAgY2FsbGJhY2ssXG4gICAgdHlwZTogRGVjb3JhdG9yVHlwZS5wcm9wZXJ0eSxcbiAgfSBhcyBhbnk7XG59XG5cbmV4cG9ydCB7IHByb3BlcnR5IGFzIHAsIHByb3BlcnR5Vm9pZCBhcyBwViB9O1xuZXhwb3J0IHsga2xhc3MgYXMgYyB9O1xuXG5leHBvcnQgZnVuY3Rpb24ga2xhc3M8VCBleHRlbmRzIGFueVtdID0gW10+KFxuICBjYWxsYmFjazogRGVzaWduVGltZUNsYXNzRnVuY3Rpb248VD5cbik6ICguLi5hcmdzOiBUKSA9PiBDbGFzc0RlY29yYXRvciB7XG4gIHJldHVybiA8YW55IHwgdm9pZD57XG4gICAgY2FsbGJhY2ssXG4gICAgdHlwZTogRGVjb3JhdG9yVHlwZS5rbGFzcyxcbiAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWQoXG4gIGRlY29yYXRvcnNHbG9iPzogc3RyaW5nLFxuICBhZGRpdGlvbmFsQ29uZmlnPzogUGFydGlhbDxCdWlsZE9wdGlvbnM+XG4pIHtcbiAgY29uc3QgeyBkZWNvcmF0b3JzIH0gPSByZXF1aXJlKFwiLi9kZWNvcmF0b3JzXCIpO1xuICBjb25zdCBlbnRyeVBvaW50cyA9IGF3YWl0IGRlY29yYXRvcnMoZGVjb3JhdG9yc0dsb2IsIGFkZGl0aW9uYWxDb25maWcpO1xuICBjb25zdCBmaWxlcyA9IHt9O1xuICBmb3IgKGxldCBmaWxlIG9mIGVudHJ5UG9pbnRzKSB7XG4gICAgT2JqZWN0LmFzc2lnbihmaWxlcywge1xuICAgICAgW2ZpbGVdOiByZXF1aXJlKHBhdGguam9pbihcbiAgICAgICAgcHJvY2Vzcy5jd2QoKSxcbiAgICAgICAgcGF0aC5kaXJuYW1lKGZpbGUpLFxuICAgICAgICBwYXRoLmJhc2VuYW1lKGZpbGUpLnJlcGxhY2UoXCIudHNcIiwgXCIuanNcIilcbiAgICAgICkpLmRlY29yYXRvcnMsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcGx1Z2luKGZpbGVzKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBLGdCQUFlLDJCQUNmLG9CQUE4QixxQ0FDOUIsY0FBaUI7QUFtRGpCLGNBQWM7QUFDWixTQUFPLE1BQU07QUFBQTtBQXZEZiw2QkEwRDZCO0FBQUEsRUFDM0IsWUFDRSxT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
