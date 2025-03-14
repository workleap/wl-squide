import { ModuleFederationPlugin } from "@module-federation/enhanced/webpack";
import type { SwcConfig } from "@workleap/swc-configs";
import { defineBuildConfig, defineBuildHtmlWebpackPluginConfig, defineDevConfig, defineDevHtmlWebpackPluginConfig, type DefineBuildConfigOptions, type DefineDevConfigOptions, type WebpackConfig, type WebpackConfigTransformer } from "@workleap/webpack-configs";
import merge from "deepmerge";
import type HtmlWebpackPlugin from "html-webpack-plugin";
import fs from "node:fs";
import path, { dirname } from "node:path";
import url, { fileURLToPath } from "node:url";
import type webpack from "webpack";
import { HostApplicationName } from "./shared.ts";

// Using import.meta.url instead of import.meta.dirname because Jest is throwing the following error:
// SyntaxError: Cannot use 'import.meta' outside a module
const applicationDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = url.fileURLToPath(new URL(".", import.meta.url));

// Must be similar to the module name defined in @workleap/module-federation.
const RemoteRegisterModuleName = "./register";
const RemoteEntryPoint = "remoteEntry.js";

// Webpack doesn't export ModuleFederationPlugin typings.
export type ModuleFederationPluginOptions = ConstructorParameters<typeof ModuleFederationPlugin>[0];
export type ModuleFederationRemotesOption = ModuleFederationPluginOptions["remotes"];

export type ModuleFederationRuntimePlugins = NonNullable<ModuleFederationPluginOptions["runtimePlugins"]>;
export type ModuleFederationShared = NonNullable<ModuleFederationPluginOptions["shared"]>;

// Generally, only the host application should have eager dependencies.
// For more informations about shared dependencies refer to: https://github.com/patricklafrance/wmf-versioning
function getDefaultSharedDependencies(features: Features, isHost: boolean): ModuleFederationShared {
    return {
        "react": {
            singleton: true,
            eager: isHost ? true : undefined,
            // Fixed the warning when `react-i18next` is imported in any remote modules.
            // For more information, refer to: https://github.com/i18next/react-i18next/issues/1697#issuecomment-1821748226.
            requiredVersion: features.i18next ? false : undefined
        },
        "react-dom": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@squide/core": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@squide/module-federation": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

export type Router = "react-router";

export interface Features {
    router?: Router;
    msw?: boolean;
    i18next?: boolean;
    environmentVariables?: boolean;
    honeycomb?: boolean;
}

// Generally, only the host application should have eager dependencies.
// For more informations about shared dependencies refer to: https://github.com/patricklafrance/wmf-versioning
function getReactRouterSharedDependencies(isHost: boolean): ModuleFederationShared {
    return {
        "react-router": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@squide/react-router": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

function getMswSharedDependency(isHost: boolean): ModuleFederationShared {
    return {
        "@squide/msw": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

function getI18nextSharedDependency(isHost: boolean): ModuleFederationShared {
    return {
        "i18next": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        // Not adding as a shared dependency for the moment because it causes the following error:
        // Uncaught (in promise) TypeError: i18next_browser_languagedetector__WEBPACK_IMPORTED_MODULE_3__ is not a constructor
        // "i18next-browser-languagedetector": {
        //     singleton: true,
        //     eager: isHost ? true : undefined
        // },
        "react-i18next": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@squide/i18next": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

function getEnvironmentVariablesSharedDependencies(isHost: boolean): ModuleFederationShared {
    return {
        "@squide/env-vars": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

function getHoneycombSharedDependencies(isHost: boolean): ModuleFederationShared {
    return {
        "@honeycombio/opentelemetry-web": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@opentelemetry/api": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@opentelemetry/auto-instrumentations-web": {
            singleton: true,
            eager: isHost ? true : undefined
        },
        "@squide/firefly-honeycomb": {
            singleton: true,
            eager: isHost ? true : undefined
        }
    };
}

function getFeaturesDependencies(features: Features, isHost: boolean) {
    const {
        router = "react-router",
        msw = true,
        i18next,
        environmentVariables,
        honeycomb
    } = features;

    return {
        ...(router === "react-router" ? getReactRouterSharedDependencies(isHost) : {}),
        ...(msw ? getMswSharedDependency(isHost) : {}),
        ...(i18next ? getI18nextSharedDependency(isHost) : {}),
        ...(environmentVariables ? getEnvironmentVariablesSharedDependencies(isHost) : {}),
        ...(honeycomb ? getHoneycombSharedDependencies(isHost) : {})
    };
}

function resolveDefaultSharedDependencies(features: Features, isHost: boolean) {
    return {
        ...getDefaultSharedDependencies(features, isHost),
        ...getFeaturesDependencies(features, isHost)
    };
}

const forceNamedChunkIdsTransformer: WebpackConfigTransformer = (config: WebpackConfig) => {
    config.optimization = {
        ...(config.optimization ?? {}),
        // Without named chunk ids, there are some Webpack features that do not work
        // when used with Module Federation. One of these feature is using a dynamic import in
        // a remote module.
        chunkIds: "named"
    };

    return config;
};

function createSetUniqueNameTransformer(uniqueName: string) {
    const transformer: WebpackConfigTransformer = (config: WebpackConfig) => {
        config.output = {
            ...(config.output ?? {}),
            // Every host and remotes must have a "uniqueName" for React Refresh to work
            // with Module Federation.
            uniqueName
        };

        return config;
    };

    return transformer;
}

function resolveEntryFilePath(entryPaths: string[]) {
    for (const entryPath in entryPaths) {
        if (fs.existsSync(path.resolve(applicationDirectory, entryPath))) {
            return entryPath;
        }
    }

    return entryPaths[0];
}

////////////////////////////  Host  /////////////////////////////

export interface RemoteDefinition {
    // The name of the remote module.
    name: string;
    // The URL of the remote, ex: http://localhost:8081.
    url: string;
}

const HostEntryFilePaths = [
    "./src/index.ts",
    "./src/index.tsx"
];

export interface DefineHostModuleFederationPluginOptions extends ModuleFederationPluginOptions {
    features?: Features;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineHostModuleFederationPluginOptions(remotes: RemoteDefinition[], options: DefineHostModuleFederationPluginOptions): ModuleFederationPluginOptions {
    const {
        features = {},
        shared = {},
        runtimePlugins = [],
        ...rest
    } = options;

    const defaultSharedDependencies = resolveDefaultSharedDependencies(features, true);

    return {
        name: HostApplicationName,
        // Since Squide modules are only exporting a register function with a standardized API
        // it doesn't requires any typing.
        dts: false,
        // Currently only supporting .js remotes.
        manifest: false,
        remotes: remotes.reduce((acc, x) => {
            // Object reduce are always a mess for typings.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            acc[x.name] = `${x.name}@${x.url}/${RemoteEntryPoint}`;

            return acc;
        }, {}) as ModuleFederationRemotesOption,
        // Deep merging the default shared dependencies with the provided shared dependencies
        // to allow the consumer to easily override a default option of a shared dependency
        // without extending the whole default shared dependencies object.
        shared: merge.all([
            defaultSharedDependencies,
            shared
        ]) as ModuleFederationShared,
        runtimePlugins: [
            path.resolve(packageDirectory, "./sharedDependenciesResolutionPlugin.js"),
            path.resolve(packageDirectory, "./nonCacheableRemoteEntryPlugin.js"),
            ...runtimePlugins
        ],
        // Commented because it doesn't seems to work, the runtime is still embedded into remotes.
        // experiments: {
        //     // The runtime is 100kb minified.
        //     federationRuntime: "hoisted"
        // },
        ...rest
    };
}

// Fixing HMR and page reloads when using `publicPath: auto` either in the host or remotes webpack configuration.
// Otherwise, when a nested page that belongs to a remote module is reloaded, an "Unexpected token" error will be thrown.
function trySetHtmlWebpackPluginPublicPath(options: HtmlWebpackPlugin.Options) {
    if (!options.publicPath) {
        options.publicPath = "/";
    }

    return options;
}

export interface DefineDevHostConfigOptions extends Omit<DefineDevConfigOptions, "htmlWebpackPlugin" | "port"> {
    htmlWebpackPluginOptions?: HtmlWebpackPlugin.Options;
    features?: Features;
    sharedDependencies?: ModuleFederationShared;
    runtimePlugins?: ModuleFederationRuntimePlugins;
    moduleFederationPluginOptions?: ModuleFederationPluginOptions;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineDevHostConfig(swcConfig: SwcConfig, port: number, remotes: RemoteDefinition[], options: DefineDevHostConfigOptions = {}): webpack.Configuration {
    const {
        entry = resolveEntryFilePath(HostEntryFilePaths),
        publicPath = "auto",
        cache,
        plugins = [],
        htmlWebpackPluginOptions,
        transformers = [],
        features,
        sharedDependencies,
        runtimePlugins,
        moduleFederationPluginOptions = defineHostModuleFederationPluginOptions(remotes, { features, shared: sharedDependencies, runtimePlugins }),
        ...webpackOptions
    } = options;

    return defineDevConfig(swcConfig, {
        entry,
        port,
        publicPath,
        cache,
        htmlWebpackPlugin: trySetHtmlWebpackPluginPublicPath(htmlWebpackPluginOptions ?? defineBuildHtmlWebpackPluginConfig()),
        plugins: [
            ...plugins,
            new ModuleFederationPlugin(moduleFederationPluginOptions)
        ],
        ...webpackOptions,
        transformers: [
            createSetUniqueNameTransformer(HostApplicationName),
            ...transformers
        ]
    });
}

export interface DefineBuildHostConfigOptions extends Omit<DefineBuildConfigOptions, "htmlWebpackPlugin"> {
    htmlWebpackPluginOptions?: HtmlWebpackPlugin.Options;
    features?: Features;
    sharedDependencies?: ModuleFederationShared;
    runtimePlugins?: ModuleFederationRuntimePlugins;
    moduleFederationPluginOptions?: ModuleFederationPluginOptions;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineBuildHostConfig(swcConfig: SwcConfig, remotes: RemoteDefinition[], options: DefineBuildHostConfigOptions = {}): webpack.Configuration {
    const {
        entry = resolveEntryFilePath(HostEntryFilePaths),
        publicPath = "auto",
        plugins = [],
        htmlWebpackPluginOptions,
        transformers = [],
        features,
        sharedDependencies,
        runtimePlugins,
        moduleFederationPluginOptions = defineHostModuleFederationPluginOptions(remotes, { features, shared: sharedDependencies, runtimePlugins }),
        ...webpackOptions
    } = options;

    return defineBuildConfig(swcConfig, {
        entry,
        publicPath,
        htmlWebpackPlugin: trySetHtmlWebpackPluginPublicPath(htmlWebpackPluginOptions ?? defineDevHtmlWebpackPluginConfig()),
        plugins: [
            ...plugins,
            new ModuleFederationPlugin(moduleFederationPluginOptions)
        ],
        transformers: [
            forceNamedChunkIdsTransformer,
            createSetUniqueNameTransformer(HostApplicationName),
            ...transformers
        ],
        ...webpackOptions
    });
}

////////////////////////////  Remote  /////////////////////////////

const RemoteEntryFilePaths = [
    "./src/register.tsx",
    "./src/register.ts"
];

export interface DefineRemoteModuleFederationPluginOptions extends ModuleFederationPluginOptions {
    features?: Features;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineRemoteModuleFederationPluginOptions(applicationName: string, options: DefineRemoteModuleFederationPluginOptions): ModuleFederationPluginOptions {
    const {
        features = {},
        exposes = {},
        shared = {},
        runtimePlugins = [],
        ...rest
    } = options;

    const defaultSharedDependencies = resolveDefaultSharedDependencies(features, false);

    return {
        name: applicationName,
        // Since Squide modules are only exporting a register function with a standardized API
        // it doesn't requires any typing.
        dts: false,
        // Currently only supporting .js remotes.
        manifest: false,
        filename: RemoteEntryPoint,
        exposes: {
            [RemoteRegisterModuleName]: "./src/register",
            ...exposes
        },
        // Deep merging the default shared dependencies with the provided shared dependencies
        // to allow the consumer to easily override a default option of a shared dependency
        // without extending the whole default shared dependencies object.
        shared: merge.all([
            defaultSharedDependencies,
            shared
        ]) as ModuleFederationShared,
        runtimePlugins: [
            path.resolve(packageDirectory, "./sharedDependenciesResolutionPlugin.js"),
            path.resolve(packageDirectory, "./nonCacheableRemoteEntryPlugin.js"),
            ...runtimePlugins
        ],
        // Commented because it doesn't seems to work, the runtime is still embedded into remotes.
        // experiments: {
        //     // The runtime is 100kb minified.
        //     federationRuntime: "hoisted"
        // },
        ...rest
    };
}

const devRemoteModuleTransformer: WebpackConfigTransformer = (config: WebpackConfig) => {
    // "config.devServer" does exist but webpack types are a messed. It could probably be solved by importing "webpack-dev-server"
    // but I would prefer not adding it as a project dependency.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config.devServer.headers = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...(config.devServer.headers ?? {}),
        // Otherwise hot reload in the host failed with a CORS error.
        "Access-Control-Allow-Origin": "*"
    };

    return config;
};

export interface DefineDevRemoteModuleConfigOptions extends Omit<DefineDevConfigOptions, "port" | "overlay"> {
    features?: Features;
    sharedDependencies?: ModuleFederationShared;
    runtimePlugins?: ModuleFederationRuntimePlugins;
    moduleFederationPluginOptions?: ModuleFederationPluginOptions;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineDevRemoteModuleConfig(swcConfig: SwcConfig, applicationName: string, port: number, options: DefineDevRemoteModuleConfigOptions = {}): webpack.Configuration {
    const {
        entry = resolveEntryFilePath(RemoteEntryFilePaths),
        publicPath = "auto",
        cache,
        plugins = [],
        htmlWebpackPlugin = false,
        transformers = [],
        features,
        sharedDependencies,
        runtimePlugins,
        moduleFederationPluginOptions = defineRemoteModuleFederationPluginOptions(applicationName, { features, shared: sharedDependencies, runtimePlugins }),
        ...webpackOptions
    } = options;

    return defineDevConfig(swcConfig, {
        entry,
        port,
        publicPath,
        cache,
        htmlWebpackPlugin,
        // Disable the error overlay by default for remotes as otherwise every remote module's error overlay will be
        // stack on top of the host application's error overlay.
        overlay: false,
        plugins: [
            ...plugins,
            new ModuleFederationPlugin(moduleFederationPluginOptions)
        ],
        transformers: [
            devRemoteModuleTransformer,
            createSetUniqueNameTransformer(applicationName),
            ...transformers
        ],
        ...webpackOptions
    });
}

export interface DefineBuildRemoteModuleConfigOptions extends DefineBuildConfigOptions {
    features?: Features;
    sharedDependencies?: ModuleFederationShared;
    runtimePlugins?: ModuleFederationRuntimePlugins;
    moduleFederationPluginOptions?: ModuleFederationPluginOptions;
}

// The function return type is mandatory, otherwise we got an error TS4058.
export function defineBuildRemoteModuleConfig(swcConfig: SwcConfig, applicationName: string, options: DefineBuildRemoteModuleConfigOptions = {}): webpack.Configuration {
    const {
        entry = resolveEntryFilePath(RemoteEntryFilePaths),
        publicPath = "auto",
        plugins = [],
        htmlWebpackPlugin = false,
        transformers = [],
        features,
        sharedDependencies,
        runtimePlugins,
        moduleFederationPluginOptions = defineRemoteModuleFederationPluginOptions(applicationName, { features, shared: sharedDependencies, runtimePlugins }),
        ...webpackOptions
    } = options;

    return defineBuildConfig(swcConfig, {
        entry,
        publicPath,
        htmlWebpackPlugin,
        plugins: [
            ...plugins,
            new ModuleFederationPlugin(moduleFederationPluginOptions)
        ],
        transformers: [
            forceNamedChunkIdsTransformer,
            createSetUniqueNameTransformer(applicationName),
            ...transformers
        ],
        ...webpackOptions
    });
}
