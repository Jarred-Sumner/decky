import { BuildOptions } from "esbuild";
declare type Qualifier = "public" | "private" | "protected" | null;
declare type DesignTimeProperty<T = any[]> = {
    key: string;
    type?: string;
    args?: T;
    isStatic?: boolean;
    qualifier?: Qualifier;
    metadata?: DecoratorResult;
    defaultValue?: string | number | null;
};
declare type DesignTimePropertyDecoratorFunction<T> = (property: DesignTimeProperty<T>) => void | any;
export declare type DesignTimePropertyDecorator<T> = (...args: string[]) => DesignTimePropertyDecoratorFunction<T>;
declare type DesignTimeClass<T = any[]> = {
    className: string;
    args?: T;
    metadata?: DecoratorResult;
};
declare type DesignTimeClassFunction<T> = (klass: DesignTimeClass<T>) => void | any;
export declare type DesignTimeClassDecorator<T> = () => DesignTimeClassFunction<T>;
export declare type DecoratorsMap = {
    [modulePath: string]: {
        [name: string]: DesignTimePropertyDecorator<any> | DesignTimeClassDecorator<any>;
    };
};
interface DecoratorResult {
    readonly code: string;
    readonly originalSource: string;
    readonly filePath: string;
    readonly startIndex: number;
    readonly stopIndex: number;
}
export declare function plugin(decorators: DecoratorsMap): {
    name: string;
    setup(build: any): void;
};
declare type OptionalPropertyDescriptor<T> = T extends Exclude<(number | string)[], undefined> ? (...args: T) => PropertyDecorator : void;
export declare function property<T>(callback: DesignTimePropertyDecoratorFunction<T>): OptionalPropertyDescriptor<T>;
export declare function propertyVoid(callback: DesignTimePropertyDecoratorFunction<never>): PropertyDecorator;
export declare function klass<T extends any[] = []>(callback: DesignTimeClassFunction<T>): (...args: T) => ClassDecorator;
export declare function klassVoid(callback: DesignTimeClassFunction<never>): ClassDecorator;
export { property as p, propertyVoid as pV };
export { klass as c, klassVoid as cV };
export declare function load(decoratorsGlob?: string, additionalConfig?: Partial<BuildOptions>): Promise<{
    name: string;
    setup(build: any): void;
}>;
