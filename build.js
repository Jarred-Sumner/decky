const { build } = require("esbuild");

build({
  platform: "node",
  entryPoints: ["./index"],
  outdir: ".",
  minify: false,
  minifySyntax: true,
  format: "cjs",
  sourcemap: "both",
})
  .then(() => {
    return build({
      platform: "node",
      entryPoints: ["./decorators"],
      outdir: ".",
      minify: false,
      minifySyntax: true,
      format: "cjs",
      sourcemap: "both",
    });
  })
  .then(async (output) => {
    console.log("Built decky lib!");
    output.warnings.forEach((w) => console.warn(w));
    require("rimraf").sync("./examples/**.js");
    require("rimraf").sync("./examples/**.json");
    const { plugin } = require("./index.js");
    const { decorators: buildDecorators } = require("./decorators");

    console.log("Building example decorators...");
    await buildDecorators();

    for (let entryPoint of ["./examples/JSONSchema.ts"]) {
      const outfile = require("path").join(
        process.cwd(),
        entryPoint.replace(".ts", ".decorator.js")
      );

      const { decorators } = require(outfile);
      await build({
        platform: "node",
        entryPoints: [entryPoint],
        outfile: entryPoint.replace(".ts", ".js"),
        minify: false,
        minifySyntax: true,
        format: "cjs",
        sourcemap: "both",
        plugins: [plugin(decorators)],
      });
      await build({
        platform: "node",
        entryPoints: [entryPoint.replace(".ts", ".orig.ts")],
        outfile: entryPoint.replace(".ts", ".orig.js"),
        minify: false,
        minifySyntax: true,
        format: "cjs",
        sourcemap: "both",
        plugins: [],
      });
    }
  });
