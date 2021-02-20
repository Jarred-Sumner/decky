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
  klass: () => klass,
  plugin: () => plugin,
  property: () => property
});
var import_fs = __toModule(require("fs")), import_path = __toModule(require("path")), import_declarations = __toModule(require("./declarations"));
function trim(input) {
  return input.trim();
}
function buildDecoratorProcessor(decorators) {
  const decoratorKeys = Object.keys(decorators).sort().reverse(), decoratorPrefixes = decoratorKeys.map((a) => a.toString()), decoratorFunctions = new Array(decoratorKeys.length), flattenedFuncs = decoratorKeys.map((a) => decorators[a].callback);
  for (let i = 0; i < decoratorKeys.length; i++) {
    const key = decoratorKeys[i], prefix = decoratorPrefixes[i], length = key.length, decoratorFunc = flattenedFuncs[i], processDecorator = async (prefixStart, result) => {
      let code = result.code, prefixEnd = prefixStart + length, argStart = prefixEnd, lineEnd = code.indexOf(`
`, prefixStart), argEnd = -1, argList;
      if (code[argStart++] === "(") {
        if (argStart++, argEnd = code.indexOf(")", argStart), argEnd--, argEnd < 0)
          throw `Missing ) for ${prefix} at ${import_path.default.basename(result.filePath)}:${result.code.substring(0, prefixStart).split(`
`).length}`;
        argList = code.substring(argStart, argEnd).split(",").map(trim);
      } else
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
        return code;
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
          let _code = result.code;
          await decoratorFunctions[prefixI](result.startIndex, result) ? result.startIndex > -1 && result.stopIndex > -1 && (result.code = _code.substring(0, result.startIndex) + result.code + _code.substring(result.stopIndex)) : result.code = _code.substring(0, result.startIndex - 1) + _code.substring(_code.indexOf(`
`, result.startIndex)), result.startIndex = result.stopIndex = -1;
        }
        for (prefixI = -1, _prefixI = 0; _prefixI < decoratorPrefixes.length && (symbolI = result.code.lastIndexOf("@"), symbolI !== -1); _prefixI++)
          if (result.startIndex = result.code.indexOf(decoratorPrefixes[_prefixI], symbolI), result.startIndex > -1) {
            prefixI = _prefixI;
            break;
          }
      }
      return console.log(result.code), result.code;
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
    const contents = await import_fs.default.promises.readFile(args.path, "utf8");
    return isPotentialMatch(contents) ? {
      contents: await process(contents, args.path),
      loader: "tsx"
    } : {
      contents,
      loader: "tsx"
    };
  }
  async function onLoadTS(args) {
    console.log("LOAD", args.path);
    const contents = await import_fs.default.promises.readFile(args.path, "utf8");
    return isPotentialMatch(contents) ? {
      contents: await process(contents, args.path),
      loader: "ts"
    } : {
      contents,
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
function klass(callback) {
  return {
    callback,
    type: import_declarations.DecoratorType.klass
  };
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBEZWNvcmF0b3JUeXBlIH0gZnJvbSBcIi4vZGVjbGFyYXRpb25zXCI7XG5cbnR5cGUgUXVhbGlmaWVyID0gXCJwdWJsaWNcIiB8IFwicHJpdmF0ZVwiIHwgXCJwcm90ZWN0ZWRcIiB8IG51bGw7XG5cbnR5cGUgRGVzaWduVGltZVByb3BlcnR5PFQgPSBhbnlbXT4gPSB7XG4gIGtleTogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICBhcmdzPzogVDtcbiAgaXNTdGF0aWM/OiBib29sZWFuO1xuICBxdWFsaWZpZXI/OiBRdWFsaWZpZXI7XG4gIG1ldGFkYXRhPzogRGVjb3JhdG9yUmVzdWx0O1xufTtcblxudHlwZSBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPiA9IChcbiAgcHJvcGVydHk6IERlc2lnblRpbWVQcm9wZXJ0eTxUPlxuKSA9PiB2b2lkIHwgYW55O1xuXG5leHBvcnQgdHlwZSBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3I8VD4gPSAoXG4gIC4uLmFyZ3M6IHN0cmluZ1tdXG4pID0+IERlc2lnblRpbWVQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uPFQ+O1xuXG50eXBlIERlc2lnblRpbWVDbGFzczxUID0gYW55W10+ID0ge1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgYXJncz86IFQ7XG4gIG1ldGFkYXRhPzogRGVjb3JhdG9yUmVzdWx0O1xufTtcblxudHlwZSBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPiA9IChrbGFzczogRGVzaWduVGltZUNsYXNzPFQ+KSA9PiB2b2lkIHwgYW55O1xuXG5leHBvcnQgdHlwZSBEZXNpZ25UaW1lQ2xhc3NEZWNvcmF0b3I8VD4gPSAoKSA9PiBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPjtcblxuZXhwb3J0IHR5cGUgRGVjb3JhdG9yc01hcCA9IHtcbiAgW25hbWU6IHN0cmluZ106XG4gICAgfCBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3I8YW55PlxuICAgIHwgRGVzaWduVGltZUNsYXNzRGVjb3JhdG9yPGFueT47XG59O1xuXG5pbnRlcmZhY2UgRGVjb3JhdG9yUmVzdWx0IHtcbiAgcmVhZG9ubHkgY29kZTogc3RyaW5nO1xuICByZWFkb25seSBvcmlnaW5hbFNvdXJjZTogc3RyaW5nO1xuICByZWFkb25seSBmaWxlUGF0aDogc3RyaW5nO1xuICByZWFkb25seSBzdGFydEluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IHN0b3BJbmRleDogbnVtYmVyO1xufVxuXG50eXBlIERlY29yYXRvclByb2Nlc3NvciA9IChcbiAgcHJlZml4U3RhcnQ6IG51bWJlcixcbiAgcmVzdWx0OiBEZWNvcmF0b3JSZXN1bHRcbikgPT4gYm9vbGVhbjtcblxuZnVuY3Rpb24gdHJpbShpbnB1dDogc3RyaW5nKSB7XG4gIHJldHVybiBpbnB1dC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGVjb3JhdG9yUHJvY2Vzc29yKGRlY29yYXRvcnM6IERlY29yYXRvcnNNYXApIHtcbiAgY29uc3QgZGVjb3JhdG9yS2V5cyA9IE9iamVjdC5rZXlzKGRlY29yYXRvcnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gIGNvbnN0IGRlY29yYXRvclByZWZpeGVzID0gZGVjb3JhdG9yS2V5cy5tYXAoKGEpID0+IGEudG9TdHJpbmcoKSk7XG4gIGNvbnN0IGRlY29yYXRvckZ1bmN0aW9uczogQXJyYXk8RGVjb3JhdG9yUHJvY2Vzc29yPiA9IG5ldyBBcnJheShcbiAgICBkZWNvcmF0b3JLZXlzLmxlbmd0aFxuICApO1xuICBjb25zdCBmbGF0dGVuZWRGdW5jcyA9IGRlY29yYXRvcktleXMubWFwKFxuICAgIChhKSA9PiAoZGVjb3JhdG9yc1thXSBhcyBhbnkpLmNhbGxiYWNrXG4gICk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWNvcmF0b3JLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gZGVjb3JhdG9yS2V5c1tpXTtcbiAgICBjb25zdCBwcmVmaXggPSBkZWNvcmF0b3JQcmVmaXhlc1tpXTtcbiAgICBjb25zdCBsZW5ndGggPSBrZXkubGVuZ3RoO1xuICAgIGNvbnN0IGRlY29yYXRvckZ1bmM6XG4gICAgICB8IERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPGFueT5cbiAgICAgIHwgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PiA9IGZsYXR0ZW5lZEZ1bmNzW2ldO1xuXG4gICAgY29uc3QgcHJvY2Vzc0RlY29yYXRvcjogRGVjb3JhdG9yUHJvY2Vzc29yID0gYXN5bmMgKFxuICAgICAgcHJlZml4U3RhcnQsXG4gICAgICByZXN1bHRcbiAgICApID0+IHtcbiAgICAgIGxldCBjb2RlID0gcmVzdWx0LmNvZGU7XG4gICAgICBsZXQgcHJlZml4RW5kID0gcHJlZml4U3RhcnQgKyBsZW5ndGg7XG4gICAgICBsZXQgYXJnU3RhcnQgPSBwcmVmaXhFbmQ7XG4gICAgICBsZXQgbGluZUVuZCA9IGNvZGUuaW5kZXhPZihcIlxcblwiLCBwcmVmaXhTdGFydCk7XG4gICAgICBsZXQgYXJnRW5kID0gLTE7XG4gICAgICBsZXQgYXJnTGlzdDtcbiAgICAgIGlmIChjb2RlW2FyZ1N0YXJ0KytdID09PSBcIihcIikge1xuICAgICAgICBhcmdTdGFydCsrO1xuICAgICAgICBhcmdFbmQgPSBjb2RlLmluZGV4T2YoXCIpXCIsIGFyZ1N0YXJ0KTtcbiAgICAgICAgYXJnRW5kLS07XG4gICAgICAgIGlmIChhcmdFbmQgPCAwKVxuICAgICAgICAgIHRocm93IGBNaXNzaW5nICkgZm9yICR7cHJlZml4fSBhdCAke3BhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKX06JHtcbiAgICAgICAgICAgIHJlc3VsdC5jb2RlLnN1YnN0cmluZygwLCBwcmVmaXhTdGFydCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoXG4gICAgICAgICAgfWA7XG5cbiAgICAgICAgYXJnTGlzdCA9IGNvZGUuc3Vic3RyaW5nKGFyZ1N0YXJ0LCBhcmdFbmQpLnNwbGl0KFwiLFwiKS5tYXAodHJpbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmdTdGFydCA9IC0xO1xuICAgICAgICBhcmdMaXN0ID0gW107XG4gICAgICB9XG4gICAgICBsZXQgbmV4dExpbmVTdGFydCA9IGxpbmVFbmQgKyAxO1xuICAgICAgbGV0IG5leHRMaW5lRW5kID0gY29kZS5pbmRleE9mKFwiXFxuXCIsIG5leHRMaW5lU3RhcnQpO1xuICAgICAgY29uc3Qgb3JpZ2luYWxMaW5lID0gY29kZS5zdWJzdHJpbmcobmV4dExpbmVTdGFydCwgbmV4dExpbmVFbmQpLnRyaW0oKTtcbiAgICAgIGxldCBuZXh0TGluZSA9IG9yaWdpbmFsTGluZTtcbiAgICAgIGxldCBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgbGV0IHF1YWxpZmllcjogUXVhbGlmaWVyID0gbnVsbDtcblxuICAgICAgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJleHBvcnQgXCIpKSB7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwiZXhwb3J0IFwiLmxlbmd0aCkudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV4dExpbmUuc3RhcnRzV2l0aChcInB1YmxpYyBcIikpIHtcbiAgICAgICAgcXVhbGlmaWVyID0gXCJwdWJsaWNcIjtcbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5zdWJzdHJpbmcoXCJwdWJsaWNcIi5sZW5ndGgpO1xuICAgICAgfSBlbHNlIGlmIChuZXh0TGluZS5zdGFydHNXaXRoKFwicHJpdmF0ZSBcIikpIHtcbiAgICAgICAgcXVhbGlmaWVyID0gXCJwcml2YXRlXCI7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJpdmF0ZVwiLmxlbmd0aCk7XG4gICAgICB9IGVsc2UgaWYgKG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJwcm90ZWN0ZWQgXCIpKSB7XG4gICAgICAgIHF1YWxpZmllciA9IFwicHJvdGVjdGVkXCI7XG4gICAgICAgIG5leHRMaW5lID0gbmV4dExpbmUuc3Vic3RyaW5nKFwicHJvdGVjdGVkXCIubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS50cmltKCk7XG4gICAgICBsZXQgaXNDbGFzcyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJjbGFzcyBcIik7XG5cbiAgICAgIGlmICghaXNDbGFzcykge1xuICAgICAgICBpc1N0YXRpYyA9IG5leHRMaW5lLnN0YXJ0c1dpdGgoXCJzdGF0aWMgXCIpO1xuICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICBuZXh0TGluZS5zdWJzdHJpbmcoXCJzdGF0aWMgXCIubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNDbGFzcykge1xuICAgICAgICBuZXh0TGluZSA9IG5leHRMaW5lLnN1YnN0cmluZyhcImNsYXNzIFwiLmxlbmd0aCk7XG4gICAgICAgIC8vIFRPRE86IG9iamVjdCBwb29saW5nXG4gICAgICAgIGF3YWl0IChkZWNvcmF0b3JGdW5jIGFzIERlc2lnblRpbWVDbGFzc0Z1bmN0aW9uPGFueT4pKHtcbiAgICAgICAgICBjbGFzc05hbWU6IG5leHRMaW5lLnN1YnN0cmluZygwLCBuZXh0TGluZS5pbmRleE9mKFwiIFwiKSksXG4gICAgICAgICAgYXJnczogYXJnTGlzdCxcbiAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0LFxuICAgICAgICB9IGFzIERlc2lnblRpbWVDbGFzcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGxldCBjb2xvblxuICAgICAgICBsZXQgdHlwZVNlcGFyYXRvckluZGV4ID0gbmV4dExpbmUuaW5kZXhPZihcIjpcIik7XG4gICAgICAgIGxldCBrZXkgPSBuZXh0TGluZS5zdWJzdHJpbmcoMCwgdHlwZVNlcGFyYXRvckluZGV4KS50cmltKCk7XG4gICAgICAgIGxldCB0eXBlTmFtZSA9IG5leHRMaW5lLnN1YnN0cmluZyh0eXBlU2VwYXJhdG9ySW5kZXggKyAxKS50cmltKCk7XG5cbiAgICAgICAgbGV0IHNlbWljb2xvbkluZGV4ID0gdHlwZU5hbWUuaW5kZXhPZihcIjtcIik7XG4gICAgICAgIGlmIChzZW1pY29sb25JbmRleCA+IC0xKSB7XG4gICAgICAgICAgdHlwZU5hbWUgPSB0eXBlTmFtZS5zdWJzdHJpbmcoMCwgc2VtaWNvbG9uSW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBjb2RlO1xuICAgICAgICAvLyBUT0RPOiBvYmplY3QgcG9vbGluZ1xuICAgICAgICBjb25zdCBuZXdDb2RlID0gYXdhaXQgKGRlY29yYXRvckZ1bmMgYXMgRGVzaWduVGltZVByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb248YW55PikoXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICBhcmdzOiBhcmdMaXN0LFxuICAgICAgICAgICAgaXNTdGF0aWMsXG4gICAgICAgICAgICBxdWFsaWZpZXIsXG4gICAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFuZXdDb2RlKSB7XG4gICAgICAgICAgKHJlc3VsdC5zdGFydEluZGV4IGFzIGFueSkgPSBwcmVmaXhTdGFydDtcbiAgICAgICAgICAocmVzdWx0LnN0b3BJbmRleCBhcyBhbnkpID0gcHJlZml4RW5kO1xuICAgICAgICAgIChyZXN1bHQuY29kZSBhcyBhbnkpID0gbmV3Q29kZSB8fCBcIlwiO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIChyZXN1bHQuc3RhcnRJbmRleCBhcyBhbnkpID0gcHJlZml4U3RhcnQ7XG4gICAgICAgIChyZXN1bHQuc3RvcEluZGV4IGFzIGFueSkgPSBuZXh0TGluZUVuZDtcbiAgICAgICAgKHJlc3VsdC5jb2RlIGFzIGFueSkgPSBuZXdDb2RlIHx8IFwiXCI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBkZWNvcmF0b3JGdW5jdGlvbnNbaV0gPSBwcm9jZXNzRGVjb3JhdG9yO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwcm9jZXNzOiBhc3luYyAoY29kZTogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgc3RhcnRJbmRleCA9IC0xO1xuICAgICAgbGV0IHN5bWJvbEkgPSBjb2RlLmxhc3RJbmRleE9mKFwiQFwiKSAtIDE7XG4gICAgICBsZXQgX3ByZWZpeEkgPSAtMTtcbiAgICAgIGlmIChzeW1ib2xJIDwgLTEpIHJldHVybiBjb2RlO1xuICAgICAgaWYgKHN5bWJvbEkgPCAwKSBzeW1ib2xJID0gMDtcblxuICAgICAgbGV0IHJlc3VsdCA9IHtcbiAgICAgICAgY29kZSxcbiAgICAgICAgb3JpZ2luYWxTb3VyY2U6IGNvZGUsXG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBzdGFydEluZGV4OiAtMSxcbiAgICAgICAgc3RvcEluZGV4OiAtMSxcbiAgICAgIH07XG5cbiAgICAgIGxldCBwcmVmaXhJID0gLTE7XG4gICAgICBmb3IgKF9wcmVmaXhJID0gMDsgX3ByZWZpeEkgPCBkZWNvcmF0b3JQcmVmaXhlcy5sZW5ndGg7IF9wcmVmaXhJKyspIHtcbiAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSBjb2RlLmluZGV4T2YoZGVjb3JhdG9yUHJlZml4ZXNbX3ByZWZpeEldLCBzeW1ib2xJKTtcbiAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICBwcmVmaXhJID0gX3ByZWZpeEk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IHByZWZpeCA9IFwiXCI7XG5cbiAgICAgIHdoaWxlIChwcmVmaXhJID4gLTEpIHtcbiAgICAgICAgcHJlZml4ID0gZGVjb3JhdG9yUHJlZml4ZXNbcHJlZml4SV07XG4gICAgICAgIGlmIChyZXN1bHQuc3RhcnRJbmRleCA+IC0xKSB7XG4gICAgICAgICAgbGV0IF9jb2RlID0gcmVzdWx0LmNvZGU7XG4gICAgICAgICAgaWYgKGF3YWl0IGRlY29yYXRvckZ1bmN0aW9uc1twcmVmaXhJXShyZXN1bHQuc3RhcnRJbmRleCwgcmVzdWx0KSkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEgJiYgcmVzdWx0LnN0b3BJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5jb2RlID1cbiAgICAgICAgICAgICAgICBfY29kZS5zdWJzdHJpbmcoMCwgcmVzdWx0LnN0YXJ0SW5kZXgpICtcbiAgICAgICAgICAgICAgICByZXN1bHQuY29kZSArXG4gICAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKHJlc3VsdC5zdG9wSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuY29kZSA9XG4gICAgICAgICAgICAgIF9jb2RlLnN1YnN0cmluZygwLCByZXN1bHQuc3RhcnRJbmRleCAtIDEpICtcbiAgICAgICAgICAgICAgX2NvZGUuc3Vic3RyaW5nKF9jb2RlLmluZGV4T2YoXCJcXG5cIiwgcmVzdWx0LnN0YXJ0SW5kZXgpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXN1bHQuc3RhcnRJbmRleCA9IHJlc3VsdC5zdG9wSW5kZXggPSAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZpeEkgPSAtMTtcbiAgICAgICAgZm9yIChfcHJlZml4SSA9IDA7IF9wcmVmaXhJIDwgZGVjb3JhdG9yUHJlZml4ZXMubGVuZ3RoOyBfcHJlZml4SSsrKSB7XG4gICAgICAgICAgc3ltYm9sSSA9IHJlc3VsdC5jb2RlLmxhc3RJbmRleE9mKFwiQFwiKTtcbiAgICAgICAgICBpZiAoc3ltYm9sSSA9PT0gLTEpIGJyZWFrO1xuXG4gICAgICAgICAgcmVzdWx0LnN0YXJ0SW5kZXggPSByZXN1bHQuY29kZS5pbmRleE9mKFxuICAgICAgICAgICAgZGVjb3JhdG9yUHJlZml4ZXNbX3ByZWZpeEldLFxuICAgICAgICAgICAgc3ltYm9sSVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHJlc3VsdC5zdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHByZWZpeEkgPSBfcHJlZml4STtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHQuY29kZSk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNvZGU7XG4gICAgfSxcbiAgICBwcmVmaXhlczogZGVjb3JhdG9yUHJlZml4ZXMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG9uUmVzb2x2ZURlY29yYXRvcihhcmdzKSB7XG4gIGNvbnNvbGUubG9nKFwiREVDT1JBVE9SXCIpO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICBuYW1lc3BhY2U6IFwiZGVjb3JhdG9yLXN0dWJcIixcbiAgfTtcbn1cblxuZnVuY3Rpb24gb25SZXNvbHZlU3RhdGljRGVjb3JhdG9ycyhhcmdzKSB7XG4gIGNvbnNvbGUubG9nKFwiREVDT1JBVE9SXCIpO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICBuYW1lc3BhY2U6IFwiZGVja3lcIixcbiAgfTtcbn1cblxuY29uc3Qgc3RhdGljRGVjb3JhdG9yQ29kZSA9IFtwcm9wZXJ0eSwga2xhc3NdXG4gIC5tYXAoXG4gICAgKHN0dWIpID0+XG4gICAgICBgLyogQF9fUFVSRV9fICovXFxuZXhwb3J0IGZ1bmN0aW9uICR7c3R1Yn0oLi4uYXJncyl7cmV0dXJuIGFyZ3M7fVxcbmBcbiAgKVxuICAuam9pbihcIlxcblwiKTtcblxuZnVuY3Rpb24gb25Mb2FkU3RhdGljRGVjb3JhdG9ycyhhcmdzKSB7XG4gIHJldHVybiB7XG4gICAgY29udGVudHM6IHN0YXRpY0RlY29yYXRvckNvZGUsXG4gICAgbG9hZGVyOiBcImpzXCIsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwbHVnaW4oZGVjb3JhdG9yczogRGVjb3JhdG9yc01hcCwgZGlzYWJsZSA9IGZhbHNlKSB7XG4gIGNvbnN0IHsgcHJlZml4ZXMsIHByb2Nlc3MgfSA9IGJ1aWxkRGVjb3JhdG9yUHJvY2Vzc29yKGRlY29yYXRvcnMpO1xuXG4gIGZ1bmN0aW9uIGlzUG90ZW50aWFsTWF0Y2goY29udGVudDogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgcHJlZml4IG9mIHByZWZpeGVzKSB7XG4gICAgICBpZiAoY29udGVudC5pbmNsdWRlcyhwcmVmaXgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvbkxvYWREZWNvcmF0b3JTdHViKGFyZ3MpIHtcbiAgICBjb25zdCBzdHViID0gcmVxdWlyZShhcmdzLnBhdGgpLmRlY29yYXRvcnM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IE9iamVjdC5rZXlzKHN0dWIpXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKHN0dWIpID0+XG4gICAgICAgICAgICBgLyogQF9fUFVSRV9fICovXFxuZXhwb3J0IGZ1bmN0aW9uICR7c3R1Yn0oLi4uYXJncyl7cmV0dXJuIGFyZ3M7fVxcbmBcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBvbkxvYWRUU1goYXJncykge1xuICAgIGNvbnN0IGNvbnRlbnRzOiBzdHJpbmcgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShhcmdzLnBhdGgsIFwidXRmOFwiKTtcbiAgICBpZiAoIWlzUG90ZW50aWFsTWF0Y2goY29udGVudHMpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudHMsXG4gICAgICAgIGxvYWRlcjogXCJ0c3hcIixcbiAgICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IGF3YWl0IHByb2Nlc3MoY29udGVudHMsIGFyZ3MucGF0aCksXG4gICAgICBsb2FkZXI6IFwidHN4XCIsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uTG9hZFRTKGFyZ3MpIHtcbiAgICBjb25zb2xlLmxvZyhcIkxPQURcIiwgYXJncy5wYXRoKTtcbiAgICBjb25zdCBjb250ZW50czogc3RyaW5nID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoYXJncy5wYXRoLCBcInV0ZjhcIik7XG4gICAgaWYgKCFpc1BvdGVudGlhbE1hdGNoKGNvbnRlbnRzKSlcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgICBsb2FkZXI6IFwidHNcIixcbiAgICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHM6IGF3YWl0IHByb2Nlc3MoY29udGVudHMsIGFyZ3MucGF0aCksXG4gICAgICBsb2FkZXI6IFwidHNcIixcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImRlc2lnbi10aW1lLWRlY29yYXRvcnNcIixcbiAgICBzZXR1cChidWlsZCkge1xuICAgICAgYnVpbGQub25SZXNvbHZlKFxuICAgICAgICB7IGZpbHRlcjogL1xcLihkZWNvcmF0b3J8ZGVjKVxcLih0cykkLyB9LFxuICAgICAgICBvblJlc29sdmVEZWNvcmF0b3JcbiAgICAgICk7XG4gICAgICBidWlsZC5vblJlc29sdmUoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzeCkkLyB9LFxuICAgICAgICBvblJlc29sdmVEZWNvcmF0b3JcbiAgICAgICk7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eZGVja3kkLyB9LCBvblJlc29sdmVTdGF0aWNEZWNvcmF0b3JzKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9eZGVja3kkLywgbmFtZXNwYWNlOiBcImRlY2t5XCIgfSxcbiAgICAgICAgb25Mb2FkU3RhdGljRGVjb3JhdG9yc1xuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgeyBmaWx0ZXI6IC9cXC4oZGVjb3JhdG9yfGRlYylcXC4odHMpJC8sIG5hbWVzcGFjZTogXCJkZWNvcmF0b3Itc3R1YlwiIH0sXG4gICAgICAgIG9uTG9hZERlY29yYXRvclN0dWJcbiAgICAgICk7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIHsgZmlsdGVyOiAvXFwuKGRlY29yYXRvcnxkZWMpXFwuKHRzeCkkLywgbmFtZXNwYWNlOiBcImRlY29yYXRvci1zdHViXCIgfSxcbiAgICAgICAgb25Mb2FkRGVjb3JhdG9yU3R1YlxuICAgICAgKTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogL1xcLih0cykkLyB9LCBvbkxvYWRUUyk7XG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9cXC4odHN4KSQvIH0sIG9uTG9hZFRTWCk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5PFQgZXh0ZW5kcyBhbnlbXSB8IHVuZGVmaW5lZD4oXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbjxUPlxuKTogKC4uLmFyZ3M6IFQpID0+IFByb3BlcnR5RGVjb3JhdG9yIHtcbiAgcmV0dXJuIDxhbnkgfCB2b2lkPntcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLnByb3BlcnR5LFxuICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGtsYXNzPFQgZXh0ZW5kcyBhbnlbXSB8IHVuZGVmaW5lZD4oXG4gIGNhbGxiYWNrOiBEZXNpZ25UaW1lQ2xhc3NGdW5jdGlvbjxUPlxuKTogKC4uLmFyZ3M6IFQpID0+IENsYXNzRGVjb3JhdG9yIHtcbiAgcmV0dXJuIDxhbnkgfCB2b2lkPntcbiAgICBjYWxsYmFjayxcbiAgICB0eXBlOiBEZWNvcmF0b3JUeXBlLmtsYXNzLFxuICB9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxnQkFBZSwyQkFDZixjQUFpQiw2QkFDakIsc0JBQThCO0FBa0Q5QixjQUFjO0FBQ1osU0FBTyxNQUFNO0FBQUE7QUFHZixpQ0FBaUM7QUFDL0IsUUFBTSxnQkFBZ0IsT0FBTyxLQUFLLFlBQVksT0FBTyxXQUMvQyxvQkFBb0IsY0FBYyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQy9DLHFCQUFnRCxJQUFJLE1BQ3hELGNBQWMsU0FFVixpQkFBaUIsY0FBYyxJQUNuQyxDQUFDLE1BQU8sV0FBVyxHQUFXO0FBR2hDLFdBQVMsSUFBSSxHQUFHLElBQUksY0FBYyxRQUFRO0FBQ3hDLFVBQU0sTUFBTSxjQUFjLElBQ3BCLFNBQVMsa0JBQWtCLElBQzNCLFNBQVMsSUFBSSxRQUNiLGdCQUV5QyxlQUFlLElBRXhELG1CQUF1QyxPQUMzQyxhQUNBO0FBRUEsVUFBSSxPQUFPLE9BQU8sTUFDZCxZQUFZLGNBQWMsUUFDMUIsV0FBVyxXQUNYLFVBQVUsS0FBSyxRQUFRO0FBQUEsR0FBTSxjQUM3QixTQUFTLElBQ1Q7QUFDSixVQUFJLEtBQUssZ0JBQWdCO0FBSXZCLFlBSEEsWUFDQSxTQUFTLEtBQUssUUFBUSxLQUFLLFdBQzNCLFVBQ0ksU0FBUztBQUNYLGdCQUFNLGlCQUFpQixhQUFhLG9CQUFLLFNBQVMsT0FBTyxhQUN2RCxPQUFPLEtBQUssVUFBVSxHQUFHLGFBQWEsTUFBTTtBQUFBLEdBQU07QUFHdEQsa0JBQVUsS0FBSyxVQUFVLFVBQVUsUUFBUSxNQUFNLEtBQUssSUFBSTtBQUFBO0FBRTFELG1CQUFXLElBQ1gsVUFBVTtBQUVaLFVBQUksZ0JBQWdCLFVBQVUsR0FDMUIsY0FBYyxLQUFLLFFBQVE7QUFBQSxHQUFNLGdCQUVq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
