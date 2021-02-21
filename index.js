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
var import_fs = __toModule(require("fs")), import_decorators = __toModule(require("./decorators"));
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
function buildDecoratorProcessor(decorators) {
  const decoratorKeys = Object.keys(decorators).sort().reverse(), decoratorPrefixes = decoratorKeys.map((a) => a.toString()), decoratorFunctions = new Array(decoratorKeys.length), flattenedFuncs = decoratorKeys.map((a) => decorators[a].callback);
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
        return newCode ? (result.startIndex = prefixStart, result.stopIndex = nextLineEnd, result.code = newCode || "", !0) : (result.startIndex = prefixStart, result.stopIndex = prefixEnd, result.code = newCode || "", !1);
      }
    };
    decoratorFunctions[i] = processDecorator;
  }
  return {
    process: async (code, filePath) => {
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
    },
    prefixes: decoratorPrefixes
  };
}
function onResolveDecorator(args) {
  return console.log("DECORATOR"), {
    path: args.path,
    namespace: "decorator-stub"
  };
}
function onResolveStaticDecorators(args) {
  return console.log("DECORATOR"), {
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
  const {prefixes, process} = buildDecoratorProcessor(decorators);
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
    const {note, contents: _contents} = await process(contents, args.path);
    return {
      contents: _contents,
      errors: note ? [{location: note.location, detail: note.text}] : void 0,
      loader: "tsx"
    };
  }
  async function onLoadTS(args) {
    console.log("LOAD", args.path);
    const contents = await import_fs.default.promises.readFile(args.path, "utf8");
    if (!isPotentialMatch(contents))
      return {
        contents,
        loader: "ts"
      };
    const {note, contents: _contents} = await process(contents, args.path);
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
    Object.assign(files, require(file).decorators);
  return plugin(files);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEJ1aWxkT3B0aW9ucywgT25Mb2FkUmVzdWx0LCBQYXJ0aWFsTm90ZSB9IGZyb20gXCJlc2J1aWxkXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBEZWNvcmF0b3JUeXBlIH0gZnJvbSBcIi4vZGVjb3JhdG9yc1wiO1xudHlwZSBRdWFsaWZpZXIgPSBcInB1YmxpY1wiIHwgXCJwcml2YXRlXCIgfCBcInByb3RlY3RlZFwiIHwgbnVsbDtcblxudHlwZSBEZXNpZ25UaW1lUHJvcGVydHk8VCA9IGFueVtdPiA9IHtcbiAga2V5OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIGFyZ3M/OiBUO1xuICBpc1N0YXRpYz86IGJvb2xlYW47XG4gIHF1YWxpZmllcj86IFF1YWxpZmllcjtcbiAgbWV0YWRhdGE/OiBEZWNvcmF0b3JSZXN1bHQ7XG59O1xuXG50eXBlIERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPFQ+ID0gKFxuICBwcm9wZXJ0eTogRGVzaWduVGltZVByb3BlcnR5PFQ+XG4pID0+IHZvaWQgfCBhbnk7XG5cbmV4cG9ydCB0eXBlIERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvcjxUPiA9IChcbiAgLi4uYXJnczogc3RyaW5nW11cbikgPT4gRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248VD47XG5cbnR5cGUgRGVzaWduVGltZUNsYXNzPFQgPSBhbnlbXT4gPSB7XG4gIGNsYXNzTmFtZTogc3RyaW5nO1xuICBhcmdzPzogVDtcbiAgbWV0YWRhdGE/OiBEZWNvcmF0b3JSZXN1bHQ7XG59O1xuXG50eXBlIERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPFQ+ID0gKGtsYXNzOiBEZXNpZ25UaW1lQ2xhc3M8VD4pID0+IHZvaWQgfCBhbnk7XG5cbmV4cG9ydCB0eXBlIERlc2lnblRpbWVDbGFzc0RlY29yYXRvcjxUPiA9ICgpID0+IERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPFQ+O1xuXG5leHBvcnQgdHlwZSBEZWNvcmF0b3JzTWFwID0ge1xuICBbbmFtZTogc3RyaW5nXTpcbiAgICB8IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvcjxhbnk+XG4gICAgfCBEZXNpZ25UaW1lQ2xhc3NEZWNvcmF0b3I8YW55Pjtcbn07XG5cbmludGVyZmFjZSBEZWNvcmF0b3JSZXN1bHQge1xuICByZWFkb25seSBjb2RlOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9yaWdpbmFsU291cmNlOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGZpbGVQYXRoOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RvcEluZGV4OiBudW1iZXI7XG59XG5cbnR5cGUgRGVjb3JhdG9yUHJvY2Vzc29yID0gKFxuICBwcmVmaXhTdGFydDogbnVtYmVyLFxuICByZXN1bHQ6IERlY29yYXRvclJlc3VsdFxuKSA9PiBib29sZWFuO1xuXG5mdW5jdGlvbiB0cmltKGlucHV0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGlucHV0LnRyaW0oKTtcbn1cblxuY2xhc3MgUHJvY2Vzc29yRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgbGluZU51bWJlcjogbnVtYmVyLFxuICAgIGxpbmVUZXh0OiBzdHJpbmcsXG4gICAgY29sdW1uPzogbnVtYmVyXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubm90ZSA9IHtcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXG4gICAgICBsb2NhdGlvbjoge1xuICAgICAgICBmaWxlLFxuICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICBsaW5lVGV4dCxcblxuICAgICAgICBjb2x1bW4sXG4gICAgICB9LFxuICAgIH07XG4gIH1cbiAgbm90ZTogUGFydGlhbE5vdGU7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGVjb3JhdG9yUHJvY2Vzc29yKGRlY29yYXRvcnM6IERlY29yYXRvcnNNYXApIHtcbiAgY29uc3QgZGVjb3JhdG9yS2V5cyA9IE9iamVjdC5rZXlzKGRlY29yYXRvcnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gIGNvbnN0IGRlY29yYXRvclByZWZpeGVzID0gZGVjb3JhdG9yS2V5cy5tYXAoKGEpID0+IGEudG9TdHJpbmcoKSk7XG4gIGNvbnN0IGRlY29yYXRvckZ1bmN0aW9uczogQXJyYXk8RGVjb3JhdG9yUHJvY2Vzc29yPiA9IG5ldyBBcnJheShcbiAgICBkZWNvcmF0b3JLZXlzLmxlbmd0aFxuICApO1xuICBjb25zdCBmbGF0dGVuZWRGdW5jcyA9IGRlY29yYXRvcktleXMubWFwKFxuICAgIChhKSA9PiAoZGVjb3JhdG9yc1thXSBhcyBhbnkpLmNhbGxiYWNrXG4gICk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWNvcmF0b3JLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gZGVjb3JhdG9yS2V5c1tpXTtcbiAgICBjb25zdCBwcmVmaXggPSBkZWNvcmF0b3JQcmVmaXhlc1tpXTtcbiAgICBjb25zdCBsZW5ndGggPSBrZXkubGVuZ3RoO1xuICAgIGNvbnN0IGRlY29yYXRvckZ1bmM6XG4gICAgICB8IERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPGFueT5cbiAgICAgIHwgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PiA9IGZsYXR0ZW5lZEZ1bmNzW2ldO1xuXG4gICAgY29uc3QgcHJvY2Vzc0RlY29yYXRvcjogRGVjb3JhdG9yUHJvY2Vzc29yID0gYXN5bmMgKFxuICAgICAgcHJlZml4U3RhcnQsXG4gICAgICByZXN1bHRcbiAgICApID0+IHtcbiAgICAgIGxldCBjb2RlID0gcmVzdWx0LmNvZGU7XG4gICAgICBsZXQgcHJlZml4RW5kID0gcHJlZml4U3RhcnQgKyBsZW5ndGg7XG4gICAgICBsZXQgYXJnU3RhcnQgPSBwcmVmaXhFbmQ7XG4gICAgICBsZXQgbGluZUVuZCA9IGNvZGUuaW5kZXhPZihcIlxcblwiLCBwcmVmaXhTdGFydCk7XG4gICAgICBsZXQgYXJnRW5kID0gLTE7XG4gICAgICBsZXQgYXJnTGlzdDtcbiAgICAgIGlmIChjb2RlW2FyZ1N0YXJ0KytdID09PSBcIihcIikge1xuICAgICAgICBhcmdFbmQgPSBjb2RlLmluZGV4T2YoXCIpXCIsIGFyZ1N0YXJ0KTtcbiAgICAgICAgaWYgKGFyZ0VuZCAtIDEgPiBhcmdTdGFydCkge1xuICAgICAgICAgIGlmIChhcmdFbmQgPCAwKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFByb2Nlc3NvckVycm9yKFxuICAgICAgICAgICAgICBgTWlzc2luZyApIGZvciAke3ByZWZpeH1gLFxuICAgICAgICAgICAgICByZXN1bHQuZmlsZVBhdGgsXG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoLFxuICAgICAgICAgICAgICByZXN1bHQuY29kZS5zcGxpdChcIlxcblwiKVtcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBwcmVmaXhFbmRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXJnTGlzdCA9IEpTT04ucGFyc2UoXCJbXCIgKyBjb2RlLnN1YnN0cmluZyhhcmdTdGFydCwgYXJnRW5kKSArIFwiXVwiKTtcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQcm9jZXNzb3JFcnJvcihcbiAgICAgICAgICAgICAgYEFyZ3VtZW50cyB0byAke3ByZWZpeH0gbXVzdCBiZSBKU09OLiBSZWNlaXZlZDogWyR7Y29kZS5zdWJzdHJpbmcoXG4gICAgICAgICAgICAgICAgYXJnU3RhcnQsXG4gICAgICAgICAgICAgICAgYXJnRW5kXG4gICAgICAgICAgICAgICl9XWAsXG4gICAgICAgICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICAgICAgICAgcmVzdWx0LmNvZGUuc3Vic3RyaW5nKDAsIHByZWZpeFN0YXJ0KS5zcGxpdChcIlxcblwiKS5sZW5ndGggLSAxLFxuICAgICAgICAgICAgICByZXN1bHQuY29kZS5zcGxpdChcIlxcblwiKVtcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgYXJnU3RhcnRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFyZ1N0YXJ0ID0gLTE7XG4gICAgICAgICAgYXJnTGlzdCA9IFtdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmdTdGFydCA9IC0xO1xuICAgICAgICBhcmdMaXN0ID0gW107XG4gICAgICB9XG4gICAgICBsZXQgbmV4dExpbmVTdGFydCA9IGxpbmVFbmQgKyAxO1xuICAgICAgbGV0IG5leHRMaW5lRW5kID0gY29kZS5pbmRleE9mKFwiXFxuXCIsIG5leHRMaW5lU3RhcnQpO1xuICAgICAgY29uc3Qgb3JpZ2luYWxMaW5lID0gY29kZS5zdWJzdHJpbmcobmV4dExpbmVTdGFydCwgbmV4dExpbmVFbmQpLnRyaW0oKTtcbiAgICAgIGxldCBuZXh0TGluZSA9IG9yaWdpbmFsTGluZTtcbiAgICAgIGxldCBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgbGV0IHF1YWxpZmllcjogUXVhbGlmaWVyID0gbnVsbDtcblxuICAgICAgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJleHBvcnQgXCIpKSB7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwiZXhwb3J0IFwiLmxlbmd0aCkudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcInB1YmxpYyBcIikpIHtcbiAgICAgICAgcXVhbGlmaWVyID0gXCJwdWJsaWNcIjtcbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwdWJsaWNcIi5sZW5ndGgpO1xuICAgICAgfSBlbHNlIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwicHJpdmF0ZSBcIikpIHtcbiAgICAgICAgcXVhbGlmaWVyID0gXCJwcml2YXRlXCI7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJpdmF0ZVwiLmxlbmd0aCk7XG4gICAgICB9IGVsc2UgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJwcm90ZWN0ZWQgXCIpKSB7XG4gICAgICAgIHF1YWxpZmllciA9IFwicHJvdGVjdGVkXCI7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJvdGVjdGVkXCIubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS50cmltKCk7XG4gICAgICBsZXQgaXNDbGFzcyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJjbGFzcyBcIik7XG5cbiAgICAgIGlmICghaXNDbGFzcykge1xuICAgICAgICBpc1N0YXRpYyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJzdGF0aWMgXCIpO1xuICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICBuZXh0TGluZS5zdWJzdHJpbmcoXCJzdGF0aWMgXCIubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNDbGFzcykge1xuICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcImNsYXNzIFwiLmxlbmd0aCk7XG4gICAgICAgIC8vIFRPRE86IG9iamVjdCBwb29saW5nXG4gICAgICAgIGF3YWl0IChkZWNvcmF0b3JGdW5jIGFzIERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPGFueT4pKHtcbiAgICAgICAgICBjbGFzc05hbWU6IG5leHRMaW5lLnN1YnN0cmluZygwLCBuZXh0TGluZS5pbmRleE9mKFwiIFwiKSksXG4gICAgICAgICAgYXJnczogYXJnTGlzdCxcbiAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0LFxuICAgICAgICB9IGFzIERlc2lnblRpbWVDbGFzcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGxldCBjb2xvblxuICAgICAgICBsZXQgdHlwZVNlcGFyYXRvckluZGV4ID0gbmV4dExpbmUuaW5kZXhPZihcIjpcIik7XG4gICAgICAgIGxldCBrZXkgPSBuZXh0TGluZS5zdWJzdHJpbmcoMCwgdHlwZVNlcGFyYXRvckluZGV4KS50cmltKCk7XG4gICAgICAgIGxldCB0eXBlTmFtZSA9IG5leHRMaW5lLnN1YnN0cmluZyh0eXBlU2VwYXJhdG9ySW5kZXggKyAxKS50cmltKCk7XG5cbiAgICAgICAgbGV0IHNlbWljb2xvbkluZGV4ID0gdHlwZU5hbWUuaW5kZXhPZihcIjtcIik7XG4gICAgICAgIGlmIChzZW1pY29sb25JbmRleCA+IC0xKSB7XG4gICAgICAgICAgdHlwZU5hbWUgPSB0eXBlTmFtZS5zdWJzdHJpbmcoMCwgc2VtaWNvbG9uSW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBjb2RlO1xuICAgICAgICAvLyBUT0RPOiBvYmplY3QgcG9vbGluZ1xuICAgICAgICBjb25zdCBuZXdDb2RlID0gYXdhaXQgKGRlY29yYXRvckZ1bmMgYXMgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PikoXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICBhcmdzOiBhcmdMaXN0LFxuICAgICAgICAgICAgaXNTdGF0aWMsXG4gICAgICAgICAgICBxdWFsaWZpZXIsXG4gICAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFuZXdDb2RlKSB7XG4gICAgICAgICAgKHJlc3VsdC5zdGFydEluZGV4IGFzIGFueSkgPSBwcmVmaXhTdGFydDtcbiAgICAgICAgICAocmVzdWx0LnN0b3BJbmRleCBhcyBhbnkpID0gcHJlZml4RW5kO1xuICAgICAgICAgIChyZXN1bHQuY29kZSBhcyBhbnkpID0gbmV3Q29kZSB8fCBcIlwiO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIChyZXN1bHQuc3RhcnRJbmRleCBhcyBhbnkpID0gcHJlZml4U3RhcnQ7XG4gICAgICAgIChyZXN1bHQuc3RvcEluZGV4IGFzIGFueSkgPSBuZXh0TGluZUVuZDtcbiAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBuZXdDb2RlIHx8IFwiXCI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBkZWNvcmF0b3JGdW5jdGlvbnNbaV0gPSBwcm9jZXNzRGVjb3JhdG9yO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwcm9jZXNzOiBhc3luYyAoY29kZTogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgc3RhcnRJbmRleCA9IC0xO1xuICAgICAgbGV0IHN5bWJvbEkgPSBjb2RlLmxhc3RJbmRleE9mKFwiQFwiKSAtIDE7XG4gICAgICBsZXQgX3ByZWZpeEkgPSAtMTtcbiAgICAgIGlmIChzeW1ib2xJIDwgLTEpIHJldHVybiB7IGNvbnRlbnRzOiBjb2RlLCBub3RlOiBudWxsIH07XG4gICAgICBpZiAoc3ltYm9sSSA8IDApIHN5bWJvbEkgPSAwO1xuXG4gICAgICBsZXQgcmVzdWx0ID0ge1xuICAgICAgICBjb2RlLFxuICAgICAgICBvcmlnaW5hbFNvdXJjZTogY29kZSxcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIHN0YXJ0SW5kZXg6IC0xLFxuICAgICAgICBzdG9wSW5kZXg6IC0xLFxuICAgICAgfTtcblxuICAgICAgbGV0IHByZWZpeEkgPSAtMTtcbiAgICAgIGZvciAoX3ByZWZpeEkgPSAwOyBfcHJlZml4SSA8IGRlY29yYXRvclByZWZpeGVzLmxlbmd0aDsgX3ByZWZpeEkrKykge1xuICAgICAgICByZXN1bHQuc3RhcnRJbmRleCA9IGNvZGUuaW5kZXhPZihkZWNvcmF0b3JQcmVmaXhlc1tfcHJlZml4SV0sIHN5bWJvbEkpO1xuICAgICAgICBpZiAocmVzdWx0LnN0YXJ0SW5kZXggPiAtMSkge1xuICAgICAgICAgIHByZWZpeEkgPSBfcHJlZml4STtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgcHJlZml4ID0gXCJcIjtcblxuICAgICAgd2hpbGUgKHByZWZpeEkgPiAtMSkge1xuICAgICAgICBwcmVmaXggPSBkZWNvcmF0b3JQcmVmaXhlc1twcmVmaXhJXTtcbiAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICBsZXQgX2NvZGUgPSByZXN1bHQuY29kZTtcbiAgICAgICAgICBsZXQgZGlkQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRpZENoYW5nZSA9IGF3YWl0IGRlY29yYXRvckZ1bmN0aW9uc1twcmVmaXhJXShcbiAgICAgICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChleGNlcHRpb24gaW5zdGFuY2VvZiBQcm9jZXNzb3JFcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRzOiBcIlwiLFxuICAgICAgICAgICAgICAgIG5vdGU6IGV4Y2VwdGlvbi5ub3RlLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChkaWRDaGFuZ2UpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xICYmIHJlc3VsdC5zdG9wSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICByZXN1bHQuY29kZSA9XG4gICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKDAsIHJlc3VsdC5zdGFydEluZGV4KSArXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvZGUgK1xuICAgICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZyhyZXN1bHQuc3RvcEluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmNvZGUgPVxuICAgICAgICAgICAgICBfY29kZS5zdWJzdHJpbmcoMCwgcmVzdWx0LnN0YXJ0SW5kZXggLSAxKSArXG4gICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZyhfY29kZS5pbmRleE9mKFwiXFxuXCIsIHJlc3VsdC5zdGFydEluZGV4KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSByZXN1bHQuc3RvcEluZGV4ID0gLTE7XG4gICAgICAgIH1cblxuICAgICAgICBwcmVmaXhJID0gLTE7XG4gICAgICAgIGZvciAoX3ByZWZpeEkgPSAwOyBfcHJlZml4SSA8IGRlY29yYXRvclByZWZpeGVzLmxlbmd0aDsgX3ByZWZpeEkrKykge1xuICAgICAgICAgIHN5bWJvbEkgPSByZXN1bHQuY29kZS5sYXN0SW5kZXhPZihcIkBcIik7XG4gICAgICAgICAgaWYgKHN5bWJvbEkgPT09IC0xKSBicmVhaztcblxuICAgICAgICAgIHJlc3VsdC5zdGFydEluZGV4ID0gcmVzdWx0LmNvZGUuaW5kZXhPZihcbiAgICAgICAgICAgIGRlY29yYXRvclByZWZpeGVzW19wcmVmaXhJXSxcbiAgICAgICAgICAgIHN5bWJvbElcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBwcmVmaXhJID0gX3ByZWZpeEk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudHM6IHJlc3VsdC5jb2RlLFxuICAgICAgICBub3RlOiBudWxsLFxuICAgICAgfTtcbiAgICB9LFxuICAgIHByZWZpeGVzOiBkZWNvcmF0b3JQcmVmaXhlcyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gb25SZXNvbHZlRGVjb3JhdG9yKGFyZ3MpIHtcbiAgY29uc29sZS5sb2coXCJERUNPUkFUT1JcIik7XG4gIHJldHVybiB7XG4gICAgcGF0aDogYXJncy5wYXRoLFxuICAgIG5hbWVzcGFjZTogXCJkZWNvcmF0b3Itc3R1YlwiLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvblJlc29sdmVTdGF0aWNEZWNvcmF0b3JzKGFyZ3MpIHtcbiAgY29uc29sZS5sb2coXCJERUNPUkFUT1JcIik7XG4gIHJldHVybiB7XG4gICAgcGF0aDogYXJncy5wYXRoLFxuICAgIG5hbWVzcGFjZTogXCJkZWNreVwiLFxuICB9O1xufVxuXG5jb25zdCBzdGF0aWNEZWNvcmF0b3JDb2RlID0gW3Byb3BlcnR5LCBrbGFzc11cbiAgLm1hcChcbiAgICAoc3R1YikgPT5cbiAgICAgIGAvKiBAX19QVVJFX18gKi9cXG5leHBvcnQgZnVuY3Rpb24gJHtzdHVifSguLi5hcmdzKXtyZXR1cm4gYXJnczt9XFxuYFxuICApXG4gIC5qb2luKFwiXFxuXCIpO1xuXG5mdW5jdGlvbiBvbkxvYWRTdGF0aWNEZWNvcmF0b3JzKGFyZ3MpIHtcbiAgcmV0dXJuIHtcbiAgICBjb250ZW50czogc3RhdGljRGVjb3JhdG9yQ29kZSxcbiAgICBsb2FkZXI6IFwianNcIixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBsdWdpbihkZWNvcmF0b3JzOiBEZWNvcmF0b3JzTWFwKSB7XG4gIGNvbnN0IHsgcHJlZml4ZXMsIHByb2Nlc3MgfSA9IGJ1aWxkRGVjb3JhdG9yUHJvY2Vzc29yKGRlY29yYXRvcnMpO1xuXG4gIGZ1bmN0aW9uIGlzUG90ZW50aWFsTWF0Y2goY29udGVudDogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgcHJlZml4IG9mIHByZWZpeGVzKSB7XG4gICAgICBpZiAoY29udGVudC5pbmNsdWRlcyhwcmVmaXgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvbkxvYWREZWNvcmF0b3JTdHViKGFyZ3MpIHtcbiAgICBjb25zdCBzdHViID0gcmVxdWlyZShhcmdzLnBhdGgpLmRlY29yYXRvcnM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IE9iamVjdC5rZXlzKHN0dWIpXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKHN0dWIpID0+XG4gICAgICAgICAgICBgLyogQF9fUFVSRV9fICovXFxuZXhwb3J0IGZ1bmN0aW9uICR7c3R1Yn0oLi4uYXJncyl7cmV0dXJuIGFyZ3M7fVxcbmBcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBvbkxvYWRUU1goYXJncyk6IFByb21pc2U8T25Mb2FkUmVzdWx0PiB7XG4gICAgbGV0IGNvbnRlbnRzOiBzdHJpbmcgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShhcmdzLnBhdGgsIFwidXRmOFwiKTtcbiAgICBpZiAoIWlzUG90ZW50aWFsTWF0Y2goY29udGVudHMpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudHMsXG4gICAgICAgIGxvYWRlcjogXCJ0c3hcIixcbiAgICAgIH07XG5cbiAgICBjb25zdCB7IG5vdGUsIGNvbnRlbnRzOiBfY29udGVudHMgfSA9IGF3YWl0IHByb2Nlc3MoY29udGVudHMsIGFyZ3MucGF0aCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IF9jb250ZW50cyxcbiAgICAgIGVycm9yczogbm90ZVxuICAgICAgICA/IFt7IGxvY2F0aW9uOiBub3RlLmxvY2F0aW9uLCBkZXRhaWw6IG5vdGUudGV4dCB9XVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIGxvYWRlcjogXCJ0c3hcIixcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gb25Mb2FkVFMoYXJncyk6IFByb21pc2U8T25Mb2FkUmVzdWx0PiB7XG4gICAgY29uc29sZS5sb2coXCJMT0FEXCIsIGFyZ3MucGF0aCk7XG4gICAgY29uc3QgY29udGVudHM6IHN0cmluZyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGFyZ3MucGF0aCwgXCJ1dGY4XCIpO1xuICAgIGlmICghaXNQb3RlbnRpYWxNYXRjaChjb250ZW50cykpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50cyxcbiAgICAgICAgbG9hZGVyOiBcInRzXCIsXG4gICAgICB9O1xuXG4gICAgY29uc3QgeyBub3RlLCBjb250ZW50czogX2NvbnRlbnRzIH0gPSBhd2FpdCBwcm9jZXNzKGNvbnRlbnRzLCBhcmdzLnBhdGgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiBfY29udGVudHMsXG4gICAgICBlcnJvcnM6IG5vdGUgPyBbeyBsb2NhdGlvbjogbm90ZS5sb2NhdGlvbiwgdGV4dDogbm90ZS50ZXh0IH1dIDogdW5kZWZpbmVkLFxuICAgICAgbG9hZGVyOiBcInRzXCIsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJkZXNpZ24tdGltZS1kZWNvcmF0b3JzXCIsXG4gICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZShcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHMpJC8gfSxcbiAgICAgICAgb25SZXNvbHZlRGVjb3JhdG9yXG4gICAgICApO1xuICAgICAgYnVpbGQub25SZXNvbHZlKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0c3gpJC8gfSxcbiAgICAgICAgb25SZXNvbHZlRGVjb3JhdG9yXG4gICAgICApO1xuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvXmRlY2t5JC8gfSwgb25SZXNvbHZlU3RhdGljRGVjb3JhdG9ycyk7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIHsgZmlsdGVyOiAvXmRlY2t5JC8sIG5hbWVzcGFjZTogXCJkZWNreVwiIH0sXG4gICAgICAgIG9uTG9hZFN0YXRpY0RlY29yYXRvcnNcbiAgICAgICk7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzKSQvLCBuYW1lc3BhY2U6IFwiZGVjb3JhdG9yLXN0dWJcIiB9LFxuICAgICAgICBvbkxvYWREZWNvcmF0b3JTdHViXG4gICAgICApO1xuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0c3gpJC8sIG5hbWVzcGFjZTogXCJkZWNvcmF0b3Itc3R1YlwiIH0sXG4gICAgICAgIG9uTG9hZERlY29yYXRvclN0dWJcbiAgICAgICk7XG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9cXC4odHMpJC8gfSwgb25Mb2FkVFMpO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuKHRzeCkkLyB9LCBvbkxvYWRUU1gpO1xuICAgIH0sXG4gIH07XG59XG5cbnR5cGUgT3B0aW9uYWxQcm9wZXJ0eURlc2NyaXB0b3I8VD4gPSBUIGV4dGVuZHMgRXhjbHVkZTxcbiAgKG51bWJlciB8IHN0cmluZylbXSxcbiAgdW5kZWZpbmVkXG4+XG4gID8gKC4uLmFyZ3M6IFQpID0+IFByb3BlcnR5RGVjb3JhdG9yXG4gIDogdm9pZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5PFQ+KFxuICBjYWxsYmFjazogRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248VD5cbik6IE9wdGlvbmFsUHJvcGVydHlEZXNjcmlwdG9yPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLnByb3BlcnR5LFxuICB9IGFzIGFueTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5Vm9pZChcbiAgY2FsbGJhY2s6IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPG5ldmVyPlxuKTogUHJvcGVydHlEZWNvcmF0b3Ige1xuICByZXR1cm4ge1xuICAgIGNhbGxiYWNrLFxuICAgIHR5cGU6IERlY29yYXRvclR5cGUucHJvcGVydHksXG4gIH0gYXMgYW55O1xufVxuXG5leHBvcnQgeyBwcm9wZXJ0eSBhcyBwLCBwcm9wZXJ0eVZvaWQgYXMgcFYgfTtcbmV4cG9ydCB7IGtsYXNzIGFzIGMgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGtsYXNzPFQgZXh0ZW5kcyBhbnlbXSA9IFtdPihcbiAgY2FsbGJhY2s6IERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPFQ+XG4pOiAoLi4uYXJnczogVCkgPT4gQ2xhc3NEZWNvcmF0b3Ige1xuICByZXR1cm4gPGFueSB8IHZvaWQ+e1xuICAgIGNhbGxiYWNrLFxuICAgIHR5cGU6IERlY29yYXRvclR5cGUua2xhc3MsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkKFxuICBkZWNvcmF0b3JzR2xvYj86IHN0cmluZyxcbiAgYWRkaXRpb25hbENvbmZpZz86IFBhcnRpYWw8QnVpbGRPcHRpb25zPlxuKSB7XG4gIGNvbnN0IHsgZGVjb3JhdG9ycyB9ID0gcmVxdWlyZShcIi4vZGVjb3JhdG9yc1wiKTtcbiAgY29uc3QgZW50cnlQb2ludHMgPSBhd2FpdCBkZWNvcmF0b3JzKGRlY29yYXRvcnNHbG9iLCBhZGRpdGlvbmFsQ29uZmlnKTtcbiAgY29uc3QgZmlsZXMgPSB7fTtcbiAgZm9yIChsZXQgZmlsZSBvZiBlbnRyeVBvaW50cykge1xuICAgIE9iamVjdC5hc3NpZ24oZmlsZXMsIHJlcXVpcmUoZmlsZSkuZGVjb3JhdG9ycyk7XG4gIH1cblxuICByZXR1cm4gcGx1Z2luKGZpbGVzKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBLGdCQUFlLDJCQUNmLG9CQUE4QjtBQWlEOUIsY0FBYztBQUNaLFNBQU8sTUFBTTtBQUFBO0FBcERmLDZCQXVENkI7QUFBQSxFQUMzQixZQUNFLFNBQ0EsTUFDQSxZQUNBLFVBQ0E7QUFFQSxVQUFNO0FBQ04sU0FBSyxPQUFPO0FBQUEsTUFDVixNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0EsTUFBTTtBQUFBLFFBQ047QUFBQSxRQUVBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFPUixpQ0FBaUM7QUFDL0IsUUFBTSxnQkFBZ0IsT0FBTyxLQUFLLFlBQVksT0FBTyxXQUMvQyxvQkFBb0IsY0FBYyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQy9DLHFCQUFnRCxJQUFJLE1BQ3hELGNBQWMsU0FFVixpQkFBaUIsY0FBYyxJQUNuQyxDQUFDLE1BQU8sV0FBVyxHQUFXO0FBR2hDLFdBQVMsSUFBSSxHQUFHLElBQUksY0FBYyxRQUFRO0FBQ3hDLFVBQU0sTUFBTSxjQUFjLElBQ3BCLFNBQVMsa0JBQWtCLElBQzNCLFNBQVMsSUFBSSxRQUNiLGdCQUV5QyxlQUFlLElBRXhELG1CQUF1QyxPQUMzQyxhQUNBO0FBRUEsVUFBSSxPQUFPLE9BQU8sTUFDZCxZQUFZLGNBQWMsUUFDMUIsV0FBVyxXQUNYLFVBQVUsS0FBSyxRQUFRO0FBQUEsR0FBTSxjQUM3QixTQUFTLElBQ1Q7QUFDSixVQUFJLEtB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
