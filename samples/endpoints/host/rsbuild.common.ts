import type { Features, ModuleFederationShared } from "@squide/firefly-rsbuild-configs";

export function getSharedDependencies() {
    return {
        "@endpoints/layouts": {
            singleton: true,
            eager: true
        },
        "@endpoints/shared": {
            singleton: true,
            eager: true
        }
    } as ModuleFederationShared;
}

export const features: Features = {
    i18next: true
};
