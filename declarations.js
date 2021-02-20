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
  build: () => build
});
var esbuild = __toModule(require("esbuild")), import_fast_glob = __toModule(require("fast-glob")), DecoratorType;
(function(DecoratorType2) {
  DecoratorType2[DecoratorType2.property = 0] = "property", DecoratorType2[DecoratorType2.klass = 1] = "klass";
})(DecoratorType || (DecoratorType = {}));
async function build(decoratorGlob = "./**/*.{decorator.ts,dec.ts,decorators.ts,decky.ts}", additionalConfig = {}) {
  const entryPoints = additionalConfig?.entryPoints?.length ? additionalConfig.entryPoints : await import_fast_glob.default(decoratorGlob);
  console.log({entryPoints}), await esbuild.build({
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
  });
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZGVjbGFyYXRpb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBlc2J1aWxkIGZyb20gXCJlc2J1aWxkXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgZ2xvYiBmcm9tIFwiZmFzdC1nbG9iXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5leHBvcnQgZW51bSBEZWNvcmF0b3JUeXBlIHtcbiAgcHJvcGVydHkgPSAwLFxuICBrbGFzcyA9IDEsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZChcbiAgZGVjb3JhdG9yR2xvYiA9IFwiLi8qKi8qLntkZWNvcmF0b3IudHMsZGVjLnRzLGRlY29yYXRvcnMudHMsZGVja3kudHN9XCIsXG4gIGFkZGl0aW9uYWxDb25maWc6IFBhcnRpYWw8ZXNidWlsZC5CdWlsZE9wdGlvbnM+ID0ge31cbikge1xuICBjb25zdCBlbnRyeVBvaW50cyA9ICFhZGRpdGlvbmFsQ29uZmlnPy5lbnRyeVBvaW50cz8ubGVuZ3RoXG4gICAgPyBhd2FpdCBnbG9iKGRlY29yYXRvckdsb2IpXG4gICAgOiBhZGRpdGlvbmFsQ29uZmlnLmVudHJ5UG9pbnRzO1xuXG4gIGNvbnNvbGUubG9nKHsgZW50cnlQb2ludHMgfSk7XG4gIGF3YWl0IGVzYnVpbGQuYnVpbGQoe1xuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgbWluaWZ5U3ludGF4OiB0cnVlLFxuICAgIGZvcm1hdDogXCJjanNcIixcbiAgICBzb3VyY2VtYXA6IFwiYm90aFwiLFxuICAgIG91dGRpcjogXCIuXCIsXG4gICAgb3V0YmFzZTogXCIuXCIsXG4gICAgLi4uYWRkaXRpb25hbENvbmZpZyxcbiAgICBwbGF0Zm9ybTogXCJub2RlXCIsXG4gICAgZW50cnlQb2ludHMsXG4gICAgYnVuZGxlOiBmYWxzZSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQUF5QixnQ0FFekIsbUJBQWlCLGtDQUdMO0FBQUwsVUFBSztBQUNWLDJDQUFXLEtBQVgsWUFDQSxzQ0FBUSxLQUFSO0FBQUEsR0FGVTtBQUtaLHFCQUNFLGdCQUFnQix1REFDaEIsbUJBQWtEO0FBRWxELFFBQU0sY0FBYyxBQUFDLGtCQUFrQixhQUFhLFNBRWhELGlCQUFpQixjQURqQixNQUFNLHlCQUFLO0FBR2YsVUFBUSxJQUFJLENBQUUsZUFDZCxNQUFNLFFBQVEsTUFBTTtBQUFBLElBQ2xCLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxPQUNOO0FBQUEsSUFDSCxVQUFVO0FBQUEsSUFDVjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
