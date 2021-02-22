const { build, transform } = require("esbuild");
const path = require("path");
const rimraf = require("rimraf");
const fs = require("fs");

const defaultExternals = Object.keys(require("./package.json").dependencies)
  .concat(Object.keys(require("./package.json").devDependencies))
  .concat(Object.keys(require("./package.json").optionalDependencies));

if (defaultExternals.includes("es-module-lexer")) {
  defaultExternals.splice(defaultExternals.indexOf("es-module-lexer"), 1);
}

const indexExternals = [...defaultExternals];
const decoratorsExternals = [...defaultExternals];

async function run() {
  console.log("Starting...");
  rimraf.sync("./index.js");
  rimraf.sync("./index.mjs");
  rimraf.sync("./decorators.js");
  rimraf.sync("./decorators.mjs");
  rimraf.sync("./*.map");
  rimraf.sync("./*.d.ts");

  const index = path.join(__dirname, "index.ts");
  const dec = path.join(__dirname, "index.ts");
  await build({
    platform: "node",
    entryPoints: [index],

    minify: false,
    minifySyntax: true,
    outfile: "index.js",
    format: "cjs",
    bundle: true,
    sourcemap: "both",
    external: indexExternals,
  });
  console.log("Built index.js");

  await build({
    platform: "node",
    entryPoints: [index],
    outfile: "index.mjs",
    minify: false,
    minifySyntax: true,
    format: "esm",
    bundle: true,
    external: indexExternals,
    outExtension: {
      ".js": ".mjs",
    },
    sourcemap: "both",
  });
  console.log("Built index.mjs");

  await build({
    platform: "node",
    entryPoints: [dec],
    outfile: "decorators.js",
    minify: false,
    bundle: true,
    minifySyntax: true,
    external: decoratorsExternals,
    format: "cjs",
    sourcemap: "both",
  });

  console.log("Built decorators.js");

  await build({
    platform: "node",
    bundle: true,
    entryPoints: [dec],
    outfile: "decorators.mjs",
    external: decoratorsExternals,
    minify: false,
    minifySyntax: true,
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    sourcemap: "both",
  });

  console.log("Built decorators.mjs");
  console.log("Built decky lib!");
  // process.env.DECKY_VERBOSE = false;
  process.env.DECKY_TIMINGS = "true";
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
    let test = entryPoint.replace(".ts", ".js");
    await build({
      platform: "node",
      entryPoints: [entryPoint],
      outfile: test,
      minify: false,
      minifySyntax: true,
      format: "cjs",
      sourcemap: "both",
      plugins: [plugin],
    });
    let snapshot = entryPoint.replace(".ts", ".orig.js");
    await build({
      platform: "node",
      entryPoints: [entryPoint.replace(".ts", ".orig.ts")],
      outfile: snapshot,
      minify: false,
      minifySyntax: true,
      format: "cjs",
      sourcemap: "both",
      plugins: [],
    });

    const testCode = (
      await transform(await fs.promises.readFile(test, "utf8"), {
        minify: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      })
    ).code;
    const snapshotCode = (
      await transform(await fs.promises.readFile(snapshot, "utf8"), {
        minify: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      })
    ).code;

    console.assert(
      testCode === snapshotCode,
      "expected snapshot to match test for",
      entryPoint,
      "but received",
      { testCode, snapshotCode }
    );
  }
}

run();
