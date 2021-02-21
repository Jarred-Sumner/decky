import * as esbuild from "esbuild";
import glob from "fast-glob";
var DecoratorType;
(function(DecoratorType2) {
  DecoratorType2[DecoratorType2.property = 0] = "property", DecoratorType2[DecoratorType2.klass = 1] = "klass";
})(DecoratorType || (DecoratorType = {}));
async function decorators(decoratorGlob = "./**/*.{decorator.ts,dec.ts,decorators.ts,decky.ts}", additionalConfig = {}) {
  const entryPoints = additionalConfig?.entryPoints?.length ? additionalConfig.entryPoints : await glob(decoratorGlob);
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
export {
  DecoratorType,
  decorators
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZGVjb3JhdG9ycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgZXNidWlsZCBmcm9tIFwiZXNidWlsZFwiO1xuaW1wb3J0IGdsb2IgZnJvbSBcImZhc3QtZ2xvYlwiO1xuXG5leHBvcnQgZW51bSBEZWNvcmF0b3JUeXBlIHtcbiAgcHJvcGVydHkgPSAwLFxuICBrbGFzcyA9IDEsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNvcmF0b3JzKFxuICBkZWNvcmF0b3JHbG9iID0gXCIuLyoqLyoue2RlY29yYXRvci50cyxkZWMudHMsZGVjb3JhdG9ycy50cyxkZWNreS50c31cIixcbiAgYWRkaXRpb25hbENvbmZpZzogUGFydGlhbDxlc2J1aWxkLkJ1aWxkT3B0aW9ucz4gPSB7fVxuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBlbnRyeVBvaW50cyA9ICFhZGRpdGlvbmFsQ29uZmlnPy5lbnRyeVBvaW50cz8ubGVuZ3RoXG4gICAgPyBhd2FpdCAoZ2xvYiBhcyBhbnkpKGRlY29yYXRvckdsb2IpXG4gICAgOiBhZGRpdGlvbmFsQ29uZmlnLmVudHJ5UG9pbnRzO1xuXG4gIGF3YWl0IGVzYnVpbGQuYnVpbGQoe1xuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgbWluaWZ5U3ludGF4OiB0cnVlLFxuICAgIGZvcm1hdDogXCJjanNcIixcbiAgICBzb3VyY2VtYXA6IFwiYm90aFwiLFxuICAgIG91dGRpcjogXCIuXCIsXG4gICAgb3V0YmFzZTogXCIuXCIsXG4gICAgLi4uYWRkaXRpb25hbENvbmZpZyxcbiAgICBwbGF0Zm9ybTogXCJub2RlXCIsXG4gICAgZW50cnlQb2ludHMsXG4gICAgYnVuZGxlOiBmYWxzZSxcbiAgfSk7XG5cbiAgcmV0dXJuIGVudHJ5UG9pbnRzO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFDQTtBQUVPLElBQUs7QUFBTCxVQUFLO0FBQ1YsMkNBQVcsS0FBWCxZQUNBLHNDQUFRLEtBQVI7QUFBQSxHQUZVO0FBS1osMEJBQ0UsZ0JBQWdCLHVEQUNoQixtQkFBa0Q7QUFFbEQsUUFBTSxjQUFjLEFBQUMsa0JBQWtCLGFBQWEsU0FFaEQsaUJBQWlCLGNBRGpCLE1BQU8sS0FBYTtBQUd4QixlQUFNLFFBQVEsTUFBTTtBQUFBLElBQ2xCLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxPQUNOO0FBQUEsSUFDSCxVQUFVO0FBQUEsSUFDVjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BR0g7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
