import * as esbuild from "esbuild";
export declare enum DecoratorType {
  property = 0,
  klass = 1,
}
export declare function decorators(
  decoratorGlob?: string,
  additionalConfig?: Partial<esbuild.BuildOptions>
): Promise<string[]>;
