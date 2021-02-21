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
  DecoratorType: () => DecoratorType,
  decorators: () => decorators
});
var esbuild = __toModule(require("esbuild")), import_fast_glob = __toModule(require("fast-glob")), DecoratorType;
(function(DecoratorType2) {
  DecoratorType2[DecoratorType2.property = 0] = "property", DecoratorType2[DecoratorType2.klass = 1] = "klass";
})(DecoratorType || (DecoratorType = {}));
async function decorators(decoratorGlob = "./**/*.{decorator.ts,dec.ts,decorators.ts,decky.ts}", additionalConfig = {}) {
  const entryPoints = additionalConfig?.entryPoints?.length ? additionalConfig.entryPoints : await import_fast_glob.default(decoratorGlob);
  return await esbuild.build({
    minify: !1,
    minifySyntax: !0,
    format: "cjs",
    sourcemap: "both",
    outdir: ".",
    outbase: ".",
    ...additionalConfig,
    platform: "node",
    entryPoints,
    bundle: !1
  }), entryPoints;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZGVjb3JhdG9ycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgZXNidWlsZCBmcm9tIFwiZXNidWlsZFwiO1xuaW1wb3J0IGdsb2IgZnJvbSBcImZhc3QtZ2xvYlwiO1xuXG5leHBvcnQgZW51bSBEZWNvcmF0b3JUeXBlIHtcbiAgcHJvcGVydHkgPSAwLFxuICBrbGFzcyA9IDEsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNvcmF0b3JzKFxuICBkZWNvcmF0b3JHbG9iID0gXCIuLyoqLyoue2RlY29yYXRvci50cyxkZWMudHMsZGVjb3JhdG9ycy50cyxkZWNreS50c31cIixcbiAgYWRkaXRpb25hbENvbmZpZzogUGFydGlhbDxlc2J1aWxkLkJ1aWxkT3B0aW9ucz4gPSB7fVxuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBlbnRyeVBvaW50cyA9ICFhZGRpdGlvbmFsQ29uZmlnPy5lbnRyeVBvaW50cz8ubGVuZ3RoXG4gICAgPyBhd2FpdCBnbG9iKGRlY29yYXRvckdsb2IpXG4gICAgOiBhZGRpdGlvbmFsQ29uZmlnLmVudHJ5UG9pbnRzO1xuXG4gIGF3YWl0IGVzYnVpbGQuYnVpbGQoe1xuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgbWluaWZ5U3ludGF4OiB0cnVlLFxuICAgIGZvcm1hdDogXCJjanNcIixcbiAgICBzb3VyY2VtYXA6IFwiYm90aFwiLFxuICAgIG91dGRpcjogXCIuXCIsXG4gICAgb3V0YmFzZTogXCIuXCIsXG4gICAgLi4uYWRkaXRpb25hbENvbmZpZyxcbiAgICBwbGF0Zm9ybTogXCJub2RlXCIsXG4gICAgZW50cnlQb2ludHMsXG4gICAgYnVuZGxlOiBmYWxzZSxcbiAgfSk7XG5cbiAgcmV0dXJuIGVudHJ5UG9pbnRzO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FBeUIsZ0NBQ3pCLG1CQUFpQixrQ0FFTDtBQUFMLFVBQUs7QUFDViwyQ0FBVyxLQUFYLFlBQ0Esc0NBQVEsS0FBUjtBQUFBLEdBRlU7QUFLWiwwQkFDRSxnQkFBZ0IsdURBQ2hCLG1CQUFrRDtBQUVsRCxRQUFNLGNBQWMsQUFBQyxrQkFBa0IsYUFBYSxTQUVoRCxpQkFBaUIsY0FEakIsTUFBTSx5QkFBSztBQUdmLGVBQU0sUUFBUSxNQUFNO0FBQUEsSUFDbEIsUUFBUTtBQUFBLElBQ1IsY0FBYztBQUFBLElBQ2QsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLE9BQ047QUFBQSxJQUNILFVBQVU7QUFBQSxJQUNWO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFHSDtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
