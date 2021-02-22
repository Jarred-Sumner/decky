import * as esbuild from "esbuild";
import glob from "fast-glob";

export enum DecoratorType {
  property = 0,
  klass = 1,
}

export async function decorators(
  decoratorGlob = "./**/*.{decorator.ts,dec.ts,decorators.ts,decky.ts,decorator.tsx,dec.tsx,decorators.tsx,decky.tsx}",
  additionalConfig: Partial<esbuild.BuildOptions> = {}
): Promise<string[]> {
  const entryPoints = !additionalConfig?.entryPoints?.length
    ? await (glob as any)(decoratorGlob)
    : additionalConfig.entryPoints;

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

  return entryPoints;
}
