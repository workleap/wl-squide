import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import type { RsbuildConfig, RsbuildPlugin, RsbuildPlugins } from "@rsbuild/core";
import { afterAll, beforeAll, describe, test } from "vitest";
import { __clearModuleFederationPluginFactory, __setModuleFederationPluginFactory, defineBuildHostConfig, defineBuildRemoteModuleConfig, defineDevHostConfig, defineDevRemoteModuleConfig, type ModuleFederationPluginOptions } from "../src/defineConfig.ts";

const dummyPlugin = (): RsbuildPlugin => {
    return {
        name: "dummy-plugin",
        setup: () => {
            console.log("Setup Dummy plugin.");
        }
    };
};

const pluginModuleFederationWrapper = (moduleFederationOptions: ModuleFederationPluginOptions): RsbuildPlugin => {
    const originalPlugin = pluginModuleFederation(moduleFederationOptions);

    return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        _options: moduleFederationOptions,
        ...originalPlugin
    };
};

function findPlugin(name: string, plugins: RsbuildPlugins = []) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const plugin = plugins.find(x => x!.name === name);

    if (!plugin) {
        throw new Error(`Cannot find Rspack plugin named: "${name}".`);
    }

    return plugin as RsbuildPlugin;
}

// The following options are relative to the environment running the test and breaks on CI.
function prepareModuleFederationPluginForSnapshot(plugin: RsbuildPlugin) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const options = plugin._options;

    delete (options as ModuleFederationPluginOptions)["runtimePlugins"];

    return options;
}

describe.concurrent("defineDevHostConfig", () => {
    beforeAll(() => {
        __setModuleFederationPluginFactory(pluginModuleFederationWrapper);
    });

    afterAll(() => {
        __clearModuleFederationPluginFactory();
    });

    test.concurrent("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineDevHostConfig(8080, []);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the port number is set as the dev server port", ({ expect }) => {
        const result = defineDevHostConfig(8080, []);

        expect(result.server!.port).toBe(8080);
    });

    test.concurrent("when no asset prefix is provided, the default asset prefix is \"/\"", ({ expect }) => {
        const config = defineDevHostConfig(8080, []);

        expect(config.dev!.assetPrefix).toBe("/");
    });

    test.concurrent("when an asset prefix is provided, use the provided asset prefix", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            assetPrefix: "http://localhost:8080/"
        });

        expect(config.dev!.assetPrefix).toBe("http://localhost:8080/");
    });

    test.concurrent("when no value is provided for lazy compilation, lazy compilation is disabled", ({ expect }) => {
        const config = defineDevHostConfig(8080, []);

        expect(config.dev!.lazyCompilation).toBeFalsy();
    });

    test.concurrent("when a value is provided for lazy compilation, use the provided value", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            lazyCompilation: true
        });

        expect(config.dev!.lazyCompilation).toBeTruthy();
    });

    test.concurrent("when a function is provided to override the module federation plugin, apply the function", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            moduleFederationPluginOptions: (defaultOptions: ModuleFederationPluginOptions) => {
                defaultOptions.filename = "this is a dummy test value";

                return defaultOptions;
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the remotes", ({ expect }) => {
        const config = defineDevHostConfig(8080, [
            { name: "remote1", url: "http://localhost/remote1" },
            { name: "remote2", url: "http://localhost/remote2" }
        ]);

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineDevHostConfig(8080, []);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            sharedDependencies: {
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when the router is not react-router, do not add react-router shared dependencies", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            features: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                router: "something-else"
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            features: {
                i18next: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            features: {
                honeycomb: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when environmentVariables is activated, add env-var shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            features: {
                environmentVariables: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineDevHostConfig(8080, [], {
            plugins: [dummyPlugin()]
        });

        const plugin = findPlugin("dummy-plugin", config.plugins);

        expect(plugin).toBeDefined();
    });

    test.concurrent("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineDevHostConfig(8080, [], {
            transformers: [(config: RsbuildConfig) => {
                config.source = config.source ?? {};

                config.source.entry = {
                    index: "updated by the dummy transformer"
                };

                return config;
            }]
        });

        expect(result.source!.entry!.index).toBe("updated by the dummy transformer");
    });
});

describe.concurrent("defineBuildHostConfig", () => {
    beforeAll(() => {
        __setModuleFederationPluginFactory(pluginModuleFederationWrapper);
    });

    afterAll(() => {
        __clearModuleFederationPluginFactory();
    });

    test.concurrent("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineBuildHostConfig([]);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when no asset prefix is provided, the default asset prefix is \"/\"", ({ expect }) => {
        const config = defineBuildHostConfig([]);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when an asset prefix is provided, use the provided asset prefix", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            assetPrefix: "/app/"
        });

        expect(config.output!.assetPrefix).toBe("/app/");
    });

    test.concurrent("when a function is provided to override the module federation plugin, apply the function", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            moduleFederationPluginOptions: (defaultOptions: ModuleFederationPluginOptions) => {
                defaultOptions.filename = "this is a dummy test value";

                return defaultOptions;
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the remotes", ({ expect }) => {
        const config = defineBuildHostConfig([
            { name: "remote1", url: "http://localhost/remote1" },
            { name: "remote2", url: "http://localhost/remote2" }
        ]);

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineBuildHostConfig([]);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            sharedDependencies: {
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when the router is not react-router, do not add react-router shared dependencies", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                router: "something-else"
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                i18next: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                honeycomb: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when environmentVariables is env-vars, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                environmentVariables: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            plugins: [dummyPlugin()]
        });

        const plugin = findPlugin("dummy-plugin", config.plugins);

        expect(plugin).toBeDefined();
    });

    test.concurrent("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineBuildHostConfig([], {
            transformers: [(config: RsbuildConfig) => {
                config.source = config.source ?? {};

                config.source.entry = {
                    index: "updated by the dummy transformer"
                };

                return config;
            }]
        });

        expect(result.source!.entry!.index).toBe("updated by the dummy transformer");
    });
});

describe.concurrent("defineDevRemoteModuleConfig", () => {
    beforeAll(() => {
        __setModuleFederationPluginFactory(pluginModuleFederationWrapper);
    });

    afterAll(() => {
        __clearModuleFederationPluginFactory();
    });

    test.concurrent("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the port number is set as the dev server port", ({ expect }) => {
        const result = defineDevRemoteModuleConfig("remote1", 8081);

        expect(result.server!.port).toBe(8081);
    });

    test.concurrent("when no asset prefix is provided, the default asset prefix is \"auto\"", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081);

        expect(config.dev!.assetPrefix).toBe("auto");
    });

    test.concurrent("when an asset prefix is provided, use the provided asset prefix", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            assetPrefix: "http://localhost:8081/"
        });

        expect(config.dev!.assetPrefix).toBe("http://localhost:8081/");
    });

    test.concurrent("when no value is provided for lazy compilation, lazy compilation is disabled", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081);

        expect(config.dev!.lazyCompilation).toBeFalsy();
    });

    test.concurrent("when a value is provided for lazy compilation, use the provided value", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            lazyCompilation: true
        });

        expect(config.dev!.lazyCompilation).toBeTruthy();
    });

    test.concurrent("when a function is provided to override the module federation plugin, apply the function", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            moduleFederationPluginOptions: (defaultOptions: ModuleFederationPluginOptions) => {
                defaultOptions.filename = "this is a dummy test value";

                return defaultOptions;
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081);
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            sharedDependencies: {
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when the router is not react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            features: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                router: "something-else"
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            features: {
                i18next: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                honeycomb: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when environmentVariables is activated, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig([], {
            features: {
                environmentVariables: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            plugins: [dummyPlugin()]
        });

        const plugin = findPlugin("dummy-plugin", config.plugins);

        expect(plugin).toBeDefined();
    });

    test.concurrent("when additional configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineDevRemoteModuleConfig("remote1", 8081, {
            transformers: [(config: RsbuildConfig) => {
                config.source = config.source ?? {};

                config.source.entry = {
                    index: "updated by the dummy transformer"
                };

                return config;
            }]
        });

        expect(result.source!.entry!.index).toBe("updated by the dummy transformer");
    });
});

describe.concurrent("defineBuildRemoteModuleConfig", () => {
    beforeAll(() => {
        __setModuleFederationPluginFactory(pluginModuleFederationWrapper);
    });

    afterAll(() => {
        __clearModuleFederationPluginFactory();
    });

    test.concurrent("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1");
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when no asset prefix is provided, the default asset prefix is \"auto\"", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1");

        expect(config.output!.assetPrefix).toBe("auto");
    });

    test.concurrent("when an asset prefix is provided, use the provided asset prefix", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            assetPrefix: "http://localhost:8080/"
        });

        expect(config.output!.assetPrefix).toBe("http://localhost:8080/");
    });

    test.concurrent("when a function is provided to override the module federation plugin, apply the function", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            moduleFederationPluginOptions: (defaultOptions: ModuleFederationPluginOptions) => {
                defaultOptions.filename = "this is a dummy test value";

                return defaultOptions;
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1");
        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            sharedDependencies: {
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when the router is not react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            features: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                router: "something-else"
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            features: {
                i18next: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            features: {
                honeycomb: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when environmentVariables is activated, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig("remote1", 8081, {
            features: {
                environmentVariables: true
            }
        });

        const plugin = findPlugin("rsbuild:module-federation-enhanced", config.plugins);

        expect(plugin).toBeDefined();
        expect(prepareModuleFederationPluginForSnapshot(plugin)).toMatchSnapshot();
    });

    test.concurrent("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig("remote1", {
            plugins: [dummyPlugin()]
        });

        const plugin = findPlugin("dummy-plugin", config.plugins);

        expect(plugin).toBeDefined();
    });

    test.concurrent("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineBuildRemoteModuleConfig("remote1", {
            transformers: [(config: RsbuildConfig) => {
                config.source = config.source ?? {};

                config.source.entry = {
                    index: "updated by the dummy transformer"
                };

                return config;
            }]
        });

        expect(result.source!.entry!.index).toBe("updated by the dummy transformer");
    });
});
