import type { Features, ModuleFederationShared } from "@squide/firefly-rsbuild-configs";

export function getSharedDependencies(isHost: boolean) {
    return {
        "@endpoints/layouts": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@endpoints/shared": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    } satisfies ModuleFederationShared;
}

export const features: Features = {
    i18next: true
};
