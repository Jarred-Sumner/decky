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
  p: () => property,
  pV: () => propertyVoid,
  plugin: () => plugin,
  property: () => property,
  propertyVoid: () => propertyVoid
});
var import_fs = __toModule(require("fs")), import_declarations = __toModule(require("./declarations"));
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
function plugin(decorators, disable = !1) {
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
    type: import_declarations.DecoratorType.property
  };
}
function propertyVoid(callback) {
  return {
    callback,
    type: import_declarations.DecoratorType.property
  };
}
function klass(callback) {
  return {
    callback,
    type: import_declarations.DecoratorType.klass
  };
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBEZWNvcmF0b3JUeXBlIH0gZnJvbSBcIi4vZGVjbGFyYXRpb25zXCI7XG5pbXBvcnQgeyBCdWlsZFJlc3VsdCwgT25Mb2FkUmVzdWx0LCBQYXJ0aWFsTm90ZSB9IGZyb20gXCJlc2J1aWxkXCI7XG50eXBlIFF1YWxpZmllciA9IFwicHVibGljXCIgfCBcInByaXZhdGVcIiB8IFwicHJvdGVjdGVkXCIgfCBudWxsO1xuXG50eXBlIERlc2lnblRpbWVQcm9wZXJ0eTxUID0gYW55W10+ID0ge1xuICBrZXk6IHN0cmluZztcbiAgdHlwZT86IHN0cmluZztcbiAgYXJncz86IFQ7XG4gIGlzU3RhdGljPzogYm9vbGVhbjtcbiAgcXVhbGlmaWVyPzogUXVhbGlmaWVyO1xuICBtZXRhZGF0YT86IERlY29yYXRvclJlc3VsdDtcbn07XG5cbnR5cGUgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248VD4gPSAoXG4gIHByb3BlcnR5OiBEZXNpZ25UaW1lUHJvcGVydHk8VD5cbikgPT4gdm9pZCB8IGFueTtcblxuZXhwb3J0IHR5cGUgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yPFQ+ID0gKFxuICAuLi5hcmdzOiBzdHJpbmdbXVxuKSA9PiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPjtcblxudHlwZSBEZXNpZ25UaW1lQ2xhc3M8VCA9IGFueVtdPiA9IHtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIGFyZ3M/OiBUO1xuICBtZXRhZGF0YT86IERlY29yYXRvclJlc3VsdDtcbn07XG5cbnR5cGUgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248VD4gPSAoa2xhc3M6IERlc2lnblRpbWVDbGFzczxUPikgPT4gdm9pZCB8IGFueTtcblxuZXhwb3J0IHR5cGUgRGVzaWduVGltZUNsYXNzRGVjb3JhdG9yPFQ+ID0gKCkgPT4gRGVzaWduVGltZUNsYXNzRnVuY3Rpb248VD47XG5cbmV4cG9ydCB0eXBlIERlY29yYXRvcnNNYXAgPSB7XG4gIFtuYW1lOiBzdHJpbmddOlxuICAgIHwgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yPGFueT5cbiAgICB8IERlc2lnblRpbWVDbGFzc0RlY29yYXRvcjxhbnk+O1xufTtcblxuaW50ZXJmYWNlIERlY29yYXRvclJlc3VsdCB7XG4gIHJlYWRvbmx5IGNvZGU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3JpZ2luYWxTb3VyY2U6IHN0cmluZztcbiAgcmVhZG9ubHkgZmlsZVBhdGg6IHN0cmluZztcbiAgcmVhZG9ubHkgc3RhcnRJbmRleDogbnVtYmVyO1xuICByZWFkb25seSBzdG9wSW5kZXg6IG51bWJlcjtcbn1cblxudHlwZSBEZWNvcmF0b3JQcm9jZXNzb3IgPSAoXG4gIHByZWZpeFN0YXJ0OiBudW1iZXIsXG4gIHJlc3VsdDogRGVjb3JhdG9yUmVzdWx0XG4pID0+IGJvb2xlYW47XG5cbmZ1bmN0aW9uIHRyaW0oaW5wdXQ6IHN0cmluZykge1xuICByZXR1cm4gaW5wdXQudHJpbSgpO1xufVxuXG5jbGFzcyBQcm9jZXNzb3JFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgbGluZVRleHQ6IHN0cmluZyxcbiAgICBjb2x1bW4/OiBudW1iZXJcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5ub3RlID0ge1xuICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgIGZpbGUsXG4gICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgIGxpbmVUZXh0LFxuXG4gICAgICAgIGNvbHVtbixcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuICBub3RlOiBQYXJ0aWFsTm90ZTtcbn1cblxuZnVuY3Rpb24gYnVpbGREZWNvcmF0b3JQcm9jZXNzb3IoZGVjb3JhdG9yczogRGVjb3JhdG9yc01hcCkge1xuICBjb25zdCBkZWNvcmF0b3JLZXlzID0gT2JqZWN0LmtleXMoZGVjb3JhdG9ycykuc29ydCgpLnJldmVyc2UoKTtcbiAgY29uc3QgZGVjb3JhdG9yUHJlZml4ZXMgPSBkZWNvcmF0b3JLZXlzLm1hcCgoYSkgPT4gYS50b1N0cmluZygpKTtcbiAgY29uc3QgZGVjb3JhdG9yRnVuY3Rpb25zOiBBcnJheTxEZWNvcmF0b3JQcm9jZXNzb3I+ID0gbmV3IEFycmF5KFxuICAgIGRlY29yYXRvcktleXMubGVuZ3RoXG4gICk7XG4gIGNvbnN0IGZsYXR0ZW5lZEZ1bmNzID0gZGVjb3JhdG9yS2V5cy5tYXAoXG4gICAgKGEpID0+IChkZWNvcmF0b3JzW2FdIGFzIGFueSkuY2FsbGJhY2tcbiAgKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlY29yYXRvcktleXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBkZWNvcmF0b3JLZXlzW2ldO1xuICAgIGNvbnN0IHByZWZpeCA9IGRlY29yYXRvclByZWZpeGVzW2ldO1xuICAgIGNvbnN0IGxlbmd0aCA9IGtleS5sZW5ndGg7XG4gICAgY29uc3QgZGVjb3JhdG9yRnVuYzpcbiAgICAgIHwgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248YW55PlxuICAgICAgfCBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxhbnk+ID0gZmxhdHRlbmVkRnVuY3NbaV07XG5cbiAgICBjb25zdCBwcm9jZXNzRGVjb3JhdG9yOiBEZWNvcmF0b3JQcm9jZXNzb3IgPSBhc3luYyAoXG4gICAgICBwcmVmaXhTdGFydCxcbiAgICAgIHJlc3VsdFxuICAgICkgPT4ge1xuICAgICAgbGV0IGNvZGUgPSByZXN1bHQuY29kZTtcbiAgICAgIGxldCBwcmVmaXhFbmQgPSBwcmVmaXhTdGFydCArIGxlbmd0aDtcbiAgICAgIGxldCBhcmdTdGFydCA9IHByZWZpeEVuZDtcbiAgICAgIGxldCBsaW5lRW5kID0gY29kZS5pbmRleE9mKFwiXFxuXCIsIHByZWZpeFN0YXJ0KTtcbiAgICAgIGxldCBhcmdFbmQgPSAtMTtcbiAgICAgIGxldCBhcmdMaXN0O1xuICAgICAgaWYgKGNvZGVbYXJnU3RhcnQrK10gPT09IFwiKFwiKSB7XG4gICAgICAgIGFyZ0VuZCA9IGNvZGUuaW5kZXhPZihcIilcIiwgYXJnU3RhcnQpO1xuICAgICAgICBpZiAoYXJnRW5kIC0gMSA+IGFyZ1N0YXJ0KSB7XG4gICAgICAgICAgaWYgKGFyZ0VuZCA8IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgUHJvY2Vzc29yRXJyb3IoXG4gICAgICAgICAgICAgIGBNaXNzaW5nICkgZm9yICR7cHJlZml4fWAsXG4gICAgICAgICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICAgICAgICAgcmVzdWx0LmNvZGUuc3Vic3RyaW5nKDAsIHByZWZpeFN0YXJ0KS5zcGxpdChcIlxcblwiKS5sZW5ndGgsXG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnNwbGl0KFwiXFxuXCIpW1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHByZWZpeEVuZFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcmdMaXN0ID0gSlNPTi5wYXJzZShcIltcIiArIGNvZGUuc3Vic3RyaW5nKGFyZ1N0YXJ0LCBhcmdFbmQpICsgXCJdXCIpO1xuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFByb2Nlc3NvckVycm9yKFxuICAgICAgICAgICAgICBgQXJndW1lbnRzIHRvICR7cHJlZml4fSBtdXN0IGJlIEpTT04uIFJlY2VpdmVkOiBbJHtjb2RlLnN1YnN0cmluZyhcbiAgICAgICAgICAgICAgICBhcmdTdGFydCxcbiAgICAgICAgICAgICAgICBhcmdFbmRcbiAgICAgICAgICAgICAgKX1dYCxcbiAgICAgICAgICAgICAgcmVzdWx0LmZpbGVQYXRoLFxuICAgICAgICAgICAgICByZXN1bHQuY29kZS5zdWJzdHJpbmcoMCwgcHJlZml4U3RhcnQpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCAtIDEsXG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnNwbGl0KFwiXFxuXCIpW1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBhcmdTdGFydFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXJnU3RhcnQgPSAtMTtcbiAgICAgICAgICBhcmdMaXN0ID0gW107XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZ1N0YXJ0ID0gLTE7XG4gICAgICAgIGFyZ0xpc3QgPSBbXTtcbiAgICAgIH1cbiAgICAgIGxldCBuZXh0TGluZVN0YXJ0ID0gbGluZUVuZCArIDE7XG4gICAgICBsZXQgbmV4dExpbmVFbmQgPSBjb2RlLmluZGV4T2YoXCJcXG5cIiwgbmV4dExpbmVTdGFydCk7XG4gICAgICBjb25zdCBvcmlnaW5hbExpbmUgPSBjb2RlLnN1YnN0cmluZyhuZXh0TGluZVN0YXJ0LCBuZXh0TGluZUVuZCkudHJpbSgpO1xuICAgICAgbGV0IG5leHRMaW5lID0gb3JpZ2luYWxMaW5lO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQgcXVhbGlmaWVyOiBRdWFsaWZpZXIgPSBudWxsO1xuXG4gICAgICBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcImV4cG9ydCBcIikpIHtcbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJleHBvcnQgXCIubGVuZ3RoKS50cmltKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwicHVibGljIFwiKSkge1xuICAgICAgICBxdWFsaWZpZXIgPSBcInB1YmxpY1wiO1xuICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcInB1YmxpY1wiLmxlbmd0aCk7XG4gICAgICB9IGVsc2UgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJwcml2YXRlIFwiKSkge1xuICAgICAgICBxdWFsaWZpZXIgPSBcInByaXZhdGVcIjtcbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwcml2YXRlXCIubGVuZ3RoKTtcbiAgICAgIH0gZWxzZSBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcInByb3RlY3RlZCBcIikpIHtcbiAgICAgICAgcXVhbGlmaWVyID0gXCJwcm90ZWN0ZWRcIjtcbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwcm90ZWN0ZWRcIi5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnRyaW0oKTtcbiAgICAgIGxldCBpc0NsYXNzID0gbmV4dExpbmUuc3RhcnRzV2l0aChcImNsYXNzIFwiKTtcblxuICAgICAgaWYgKCFpc0NsYXNzKSB7XG4gICAgICAgIGlzU3RhdGljID0gbmV4dExpbmUuc3RhcnRzV2l0aChcInN0YXRpYyBcIik7XG4gICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgIG5leHRMaW5lLnN1YnN0cmluZyhcInN0YXRpYyBcIi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0NsYXNzKSB7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwiY2xhc3MgXCIubGVuZ3RoKTtcbiAgICAgICAgLy8gVE9ETzogb2JqZWN0IHBvb2xpbmdcbiAgICAgICAgYXdhaXQgKGRlY29yYXRvckZ1bmMgYXMgRGVzaWduVGltZUNsYXNzRnVuY3Rpb248YW55Pikoe1xuICAgICAgICAgIGNsYXNzTmFtZTogbmV4dExpbmUuc3Vic3RyaW5nKDAsIG5leHRMaW5lLmluZGV4T2YoXCIgXCIpKSxcbiAgICAgICAgICBhcmdzOiBhcmdMaXN0LFxuICAgICAgICAgIG1ldGFkYXRhOiByZXN1bHQsXG4gICAgICAgIH0gYXMgRGVzaWduVGltZUNsYXNzKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbGV0IGNvbG9uXG4gICAgICAgIGxldCB0eXBlU2VwYXJhdG9ySW5kZXggPSBuZXh0TGluZS5pbmRleE9mKFwiOlwiKTtcbiAgICAgICAgbGV0IGtleSA9IG5leHRMaW5lLnN1YnN0cmluZygwLCB0eXBlU2VwYXJhdG9ySW5kZXgpLnRyaW0oKTtcbiAgICAgICAgbGV0IHR5cGVOYW1lID0gbmV4dExpbmUuc3Vic3RyaW5nKHR5cGVTZXBhcmF0b3JJbmRleCArIDEpLnRyaW0oKTtcblxuICAgICAgICBsZXQgc2VtaWNvbG9uSW5kZXggPSB0eXBlTmFtZS5pbmRleE9mKFwiO1wiKTtcbiAgICAgICAgaWYgKHNlbWljb2xvbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICB0eXBlTmFtZSA9IHR5cGVOYW1lLnN1YnN0cmluZygwLCBzZW1pY29sb25JbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICAocmVzdWx0LmNvZGUgYXMgYW55KSA9IGNvZGU7XG4gICAgICAgIC8vIFRPRE86IG9iamVjdCBwb29saW5nXG4gICAgICAgIGNvbnN0IG5ld0NvZGUgPSBhd2FpdCAoZGVjb3JhdG9yRnVuYyBhcyBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxhbnk+KShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgICAgICAgIGFyZ3M6IGFyZ0xpc3QsXG4gICAgICAgICAgICBpc1N0YXRpYyxcbiAgICAgICAgICAgIHF1YWxpZmllcixcbiAgICAgICAgICAgIG1ldGFkYXRhOiByZXN1bHQsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBpZiAoIW5ld0NvZGUpIHtcbiAgICAgICAgICAocmVzdWx0LnN0YXJ0SW5kZXggYXMgYW55KSA9IHByZWZpeFN0YXJ0O1xuICAgICAgICAgIChyZXN1bHQuc3RvcEluZGV4IGFzIGFueSkgPSBwcmVmaXhFbmQ7XG4gICAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBuZXdDb2RlIHx8IFwiXCI7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgKHJlc3VsdC5zdGFydEluZGV4IGFzIGFueSkgPSBwcmVmaXhTdGFydDtcbiAgICAgICAgKHJlc3VsdC5zdG9wSW5kZXggYXMgYW55KSA9IG5leHRMaW5lRW5kO1xuICAgICAgICAocmVzdWx0LmNvZGUgYXMgYW55KSA9IG5ld0NvZGUgfHwgXCJcIjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGRlY29yYXRvckZ1bmN0aW9uc1tpXSA9IHByb2Nlc3NEZWNvcmF0b3I7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHByb2Nlc3M6IGFzeW5jIChjb2RlOiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBzdGFydEluZGV4ID0gLTE7XG4gICAgICBsZXQgc3ltYm9sSSA9IGNvZGUubGFzdEluZGV4T2YoXCJAXCIpIC0gMTtcbiAgICAgIGxldCBfcHJlZml4SSA9IC0xO1xuICAgICAgaWYgKHN5bWJvbEkgPCAtMSkgcmV0dXJuIHsgY29udGVudHM6IGNvZGUsIG5vdGU6IG51bGwgfTtcbiAgICAgIGlmIChzeW1ib2xJIDwgMCkgc3ltYm9sSSA9IDA7XG5cbiAgICAgIGxldCByZXN1bHQgPSB7XG4gICAgICAgIGNvZGUsXG4gICAgICAgIG9yaWdpbmFsU291cmNlOiBjb2RlLFxuICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgc3RhcnRJbmRleDogLTEsXG4gICAgICAgIHN0b3BJbmRleDogLTEsXG4gICAgICB9O1xuXG4gICAgICBsZXQgcHJlZml4SSA9IC0xO1xuICAgICAgZm9yIChfcHJlZml4SSA9IDA7IF9wcmVmaXhJIDwgZGVjb3JhdG9yUHJlZml4ZXMubGVuZ3RoOyBfcHJlZml4SSsrKSB7XG4gICAgICAgIHJlc3VsdC5zdGFydEluZGV4ID0gY29kZS5pbmRleE9mKGRlY29yYXRvclByZWZpeGVzW19wcmVmaXhJXSwgc3ltYm9sSSk7XG4gICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgcHJlZml4SSA9IF9wcmVmaXhJO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxldCBwcmVmaXggPSBcIlwiO1xuXG4gICAgICB3aGlsZSAocHJlZml4SSA+IC0xKSB7XG4gICAgICAgIHByZWZpeCA9IGRlY29yYXRvclByZWZpeGVzW3ByZWZpeEldO1xuICAgICAgICBpZiAocmVzdWx0LnN0YXJ0SW5kZXggPiAtMSkge1xuICAgICAgICAgIGxldCBfY29kZSA9IHJlc3VsdC5jb2RlO1xuICAgICAgICAgIGxldCBkaWRDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGlkQ2hhbmdlID0gYXdhaXQgZGVjb3JhdG9yRnVuY3Rpb25zW3ByZWZpeEldKFxuICAgICAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFByb2Nlc3NvckVycm9yKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29udGVudHM6IFwiXCIsXG4gICAgICAgICAgICAgICAgbm90ZTogZXhjZXB0aW9uLm5vdGUsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRpZENoYW5nZSkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEgJiYgcmVzdWx0LnN0b3BJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlID1cbiAgICAgICAgICAgICAgICBfY29kZS5zdWJzdHJpbmcoMCwgcmVzdWx0LnN0YXJ0SW5kZXgpICtcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZSArXG4gICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKHJlc3VsdC5zdG9wSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuY29kZSA9XG4gICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZygwLCByZXN1bHQuc3RhcnRJbmRleCAtIDEpICtcbiAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKF9jb2RlLmluZGV4T2YoXCJcXG5cIiwgcmVzdWx0LnN0YXJ0SW5kZXgpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCA9IHJlc3VsdC5zdG9wSW5kZXggPSAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZpeEkgPSAtMTtcbiAgICAgICAgZm9yIChfcHJlZml4SSA9IDA7IF9wcmVmaXhJIDwgZGVjb3JhdG9yUHJlZml4ZXMubGVuZ3RoOyBfcHJlZml4SSsrKSB7XG4gICAgICAgICAgc3ltYm9sSSA9IHJlc3VsdC5jb2RlLmxhc3RJbmRleE9mKFwiQFwiKTtcbiAgICAgICAgICBpZiAoc3ltYm9sSSA9PT0gLTEpIGJyZWFrO1xuXG4gICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSByZXN1bHQuY29kZS5pbmRleE9mKFxuICAgICAgICAgICAgZGVjb3JhdG9yUHJlZml4ZXNbX3ByZWZpeEldLFxuICAgICAgICAgICAgc3ltYm9sSVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHByZWZpeEkgPSBfcHJlZml4STtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50czogcmVzdWx0LmNvZGUsXG4gICAgICAgIG5vdGU6IG51bGwsXG4gICAgICB9O1xuICAgIH0sXG4gICAgcHJlZml4ZXM6IGRlY29yYXRvclByZWZpeGVzLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvblJlc29sdmVEZWNvcmF0b3IoYXJncykge1xuICBjb25zb2xlLmxvZyhcIkRFQ09SQVRPUlwiKTtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBhcmdzLnBhdGgsXG4gICAgbmFtZXNwYWNlOiBcImRlY29yYXRvci1zdHViXCIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG9uUmVzb2x2ZVN0YXRpY0RlY29yYXRvcnMoYXJncykge1xuICBjb25zb2xlLmxvZyhcIkRFQ09SQVRPUlwiKTtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBhcmdzLnBhdGgsXG4gICAgbmFtZXNwYWNlOiBcImRlY2t5XCIsXG4gIH07XG59XG5cbmNvbnN0IHN0YXRpY0RlY29yYXRvckNvZGUgPSBbcHJvcGVydHksIGtsYXNzXVxuICAubWFwKFxuICAgIChzdHViKSA9PlxuICAgICAgYC8qIEBfX1BVUkVfXyAqL1xcbmV4cG9ydCBmdW5jdGlvbiAke3N0dWJ9KC4uLmFyZ3Mpe3JldHVybiBhcmdzO31cXG5gXG4gIClcbiAgLmpvaW4oXCJcXG5cIik7XG5cbmZ1bmN0aW9uIG9uTG9hZFN0YXRpY0RlY29yYXRvcnMoYXJncykge1xuICByZXR1cm4ge1xuICAgIGNvbnRlbnRzOiBzdGF0aWNEZWNvcmF0b3JDb2RlLFxuICAgIGxvYWRlcjogXCJqc1wiLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGx1Z2luKGRlY29yYXRvcnM6IERlY29yYXRvcnNNYXAsIGRpc2FibGUgPSBmYWxzZSkge1xuICBjb25zdCB7IHByZWZpeGVzLCBwcm9jZXNzIH0gPSBidWlsZERlY29yYXRvclByb2Nlc3NvcihkZWNvcmF0b3JzKTtcblxuICBmdW5jdGlvbiBpc1BvdGVudGlhbE1hdGNoKGNvbnRlbnQ6IHN0cmluZykge1xuICAgIGZvciAobGV0IHByZWZpeCBvZiBwcmVmaXhlcykge1xuICAgICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMocHJlZml4KSkgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Mb2FkRGVjb3JhdG9yU3R1YihhcmdzKSB7XG4gICAgY29uc3Qgc3R1YiA9IHJlcXVpcmUoYXJncy5wYXRoKS5kZWNvcmF0b3JzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiBPYmplY3Qua2V5cyhzdHViKVxuICAgICAgICAubWFwKFxuICAgICAgICAgIChzdHViKSA9PlxuICAgICAgICAgICAgYC8qIEBfX1BVUkVfXyAqL1xcbmV4cG9ydCBmdW5jdGlvbiAke3N0dWJ9KC4uLmFyZ3Mpe3JldHVybiBhcmdzO31cXG5gXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICBsb2FkZXI6IFwidHNcIixcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gb25Mb2FkVFNYKGFyZ3MpOiBQcm9taXNlPE9uTG9hZFJlc3VsdD4ge1xuICAgIGxldCBjb250ZW50czogc3RyaW5nID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoYXJncy5wYXRoLCBcInV0ZjhcIik7XG4gICAgaWYgKCFpc1BvdGVudGlhbE1hdGNoKGNvbnRlbnRzKSlcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgICBsb2FkZXI6IFwidHN4XCIsXG4gICAgICB9O1xuXG4gICAgY29uc3QgeyBub3RlLCBjb250ZW50czogX2NvbnRlbnRzIH0gPSBhd2FpdCBwcm9jZXNzKGNvbnRlbnRzLCBhcmdzLnBhdGgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiBfY29udGVudHMsXG4gICAgICBlcnJvcnM6IG5vdGVcbiAgICAgICAgPyBbeyBsb2NhdGlvbjogbm90ZS5sb2NhdGlvbiwgZGV0YWlsOiBub3RlLnRleHQgfV1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBsb2FkZXI6IFwidHN4XCIsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uTG9hZFRTKGFyZ3MpOiBQcm9taXNlPE9uTG9hZFJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKFwiTE9BRFwiLCBhcmdzLnBhdGgpO1xuICAgIGNvbnN0IGNvbnRlbnRzOiBzdHJpbmcgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShhcmdzLnBhdGgsIFwidXRmOFwiKTtcbiAgICBpZiAoIWlzUG90ZW50aWFsTWF0Y2goY29udGVudHMpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudHMsXG4gICAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgICAgfTtcblxuICAgIGNvbnN0IHsgbm90ZSwgY29udGVudHM6IF9jb250ZW50cyB9ID0gYXdhaXQgcHJvY2Vzcyhjb250ZW50cywgYXJncy5wYXRoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogX2NvbnRlbnRzLFxuICAgICAgZXJyb3JzOiBub3RlID8gW3sgbG9jYXRpb246IG5vdGUubG9jYXRpb24sIHRleHQ6IG5vdGUudGV4dCB9XSA6IHVuZGVmaW5lZCxcbiAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiZGVzaWduLXRpbWUtZGVjb3JhdG9yc1wiLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vblJlc29sdmUoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzKSQvIH0sXG4gICAgICAgIG9uUmVzb2x2ZURlY29yYXRvclxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZShcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHN4KSQvIH0sXG4gICAgICAgIG9uUmVzb2x2ZURlY29yYXRvclxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogL15kZWNreSQvIH0sIG9uUmVzb2x2ZVN0YXRpY0RlY29yYXRvcnMpO1xuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogL15kZWNreSQvLCBuYW1lc3BhY2U6IFwiZGVja3lcIiB9LFxuICAgICAgICBvbkxvYWRTdGF0aWNEZWNvcmF0b3JzXG4gICAgICApO1xuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0cykkLywgbmFtZXNwYWNlOiBcImRlY29yYXRvci1zdHViXCIgfSxcbiAgICAgICAgb25Mb2FkRGVjb3JhdG9yU3R1YlxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHN4KSQvLCBuYW1lc3BhY2U6IFwiZGVjb3JhdG9yLXN0dWJcIiB9LFxuICAgICAgICBvbkxvYWREZWNvcmF0b3JTdHViXG4gICAgICApO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuKHRzKSQvIH0sIG9uTG9hZFRTKTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogL1xcLih0c3gpJC8gfSwgb25Mb2FkVFNYKTtcbiAgICB9LFxuICB9O1xufVxuXG50eXBlIE9wdGlvbmFsUHJvcGVydHlEZXNjcmlwdG9yPFQ+ID0gVCBleHRlbmRzIEV4Y2x1ZGU8XG4gIChudW1iZXIgfCBzdHJpbmcpW10sXG4gIHVuZGVmaW5lZFxuPlxuICA/ICguLi5hcmdzOiBUKSA9PiBQcm9wZXJ0eURlY29yYXRvclxuICA6IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eTxUPihcbiAgY2FsbGJhY2s6IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPFQ+XG4pOiBPcHRpb25hbFByb3BlcnR5RGVzY3JpcHRvcjxUPiB7XG4gIHJldHVybiB7XG4gICAgY2FsbGJhY2ssXG4gICAgdHlwZTogRGVjb3JhdG9yVHlwZS5wcm9wZXJ0eSxcbiAgfSBhcyBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eVZvaWQoXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxuZXZlcj5cbik6IFByb3BlcnR5RGVjb3JhdG9yIHtcbiAgcmV0dXJuIHtcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLnByb3BlcnR5LFxuICB9IGFzIGFueTtcbn1cblxuZXhwb3J0IHsgcHJvcGVydHkgYXMgcCwgcHJvcGVydHlWb2lkIGFzIHBWIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBrbGFzczxUIGV4dGVuZHMgYW55W10gPSBbXT4oXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPlxuKTogKC4uLmFyZ3M6IFQpID0+IENsYXNzRGVjb3JhdG9yIHtcbiAgcmV0dXJuIDxhbnkgfCB2b2lkPntcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLmtsYXNzLFxuICB9O1xufVxuXG5leHBvcnQgeyBrbGFzcyBhcyBjIH07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZ0JBQWUsMkJBRWYsc0JBQThCO0FBa0Q5QixjQUFjO0FBQ1osU0FBTyxNQUFNO0FBQUE7QUFy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
