import type { HoneycombSdkOptions } from "./honeycombTypes.ts";

export type HoneycombSdkOptionsTransformer = (options: HoneycombSdkOptions) => HoneycombSdkOptions;

// Must specify the return type, otherwise we get a TS4058: Return type of exported function has or is using name X from external module "XYZ" but cannot be named.
export function applyTransformers(options: HoneycombSdkOptions, transformers: HoneycombSdkOptionsTransformer[]): HoneycombSdkOptions {
    return transformers.reduce((acc, transformer) => transformer(acc), options);
}


