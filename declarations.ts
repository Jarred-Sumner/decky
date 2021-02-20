import * as esbuild from "esbuild";
import fs from "fs";
import glob from "fast-glob";
import path from "path";

export enum DecoratorType {
  property = 0,
  klass = 1,
}

export async function build(
  decoratorGlob = "./**/*.{decorator.ts,dec.ts,decorators.ts,decky.ts}",
  additionalConfig: Partial<esbuild.BuildOptions> = {}
) {
  const entryPoints = !additionalConfig?.entryPoints?.length
    ? await glob(decoratorGlob)
    : additionalConfig.entryPoints;

  console.log({ entryPoints });
  await esbuild.build({
    minify: false,
    minifySyntax: true,
    format: "cjs",
    sourcemap: "both",
    outdir: ".",
    outbase: ".",
    ...additionalConfig,
    platform: "node",
    entryPoints,
    bundle: false,
  });
}
