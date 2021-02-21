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
  .then(() =>
    build({
      platform: "node",
      entryPoints: ["./index"],
      outdir: ".",
      minify: false,
      minifySyntax: true,
      format: "esm",
      outExtension: {
        ".js": ".mjs",
      },
      sourcemap: "both",
    })
  )
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
  .then(() => {
    return build({
      platform: "node",
      entryPoints: ["./decorators"],
      outdir: ".",
      minify: false,
      minifySyntax: true,
      format: "esm",
      outExtension: {
        ".js": ".mjs",
      },
      sourcemap: "both",
    });
  })
  .then(async (output) => {
    console.log("Built decky lib!");
    output.warnings.forEach((w) => console.warn(w));
    require("rimraf").sync("./examples/**.js");
    require("rimraf").sync("./examples/**.json");
    const { load } = require("./index.js");
    console.log("Building example decorators...");
    const plugin = await load();

    for (let entryPoint of [
      "./examples/JSONSchema.ts",
      "./examples/Person-GraphQL.ts",
      "./examples/debugOnlyExample.ts",
    ]) {
      await build({
        platform: "node",
        entryPoints: [entryPoint],
        outfile: entryPoint.replace(".ts", ".js"),
        minify: false,
        minifySyntax: true,
        format: "cjs",
        sourcemap: "both",
        plugins: [plugin],
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
