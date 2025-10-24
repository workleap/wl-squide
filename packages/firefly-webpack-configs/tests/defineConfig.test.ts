import { ModuleFederationPlugin } from "@module-federation/enhanced/webpack";
import { defineBuildConfig as defineSwcBuildConfig, defineDevConfig as defineSwcDevConfig } from "@workleap/swc-configs";
import { findPlugin, matchConstructorName, type WebpackConfig } from "@workleap/webpack-configs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { describe, test } from "vitest";
import type { WebpackPluginInstance } from "webpack";
import { defineBuildHostConfig, defineBuildRemoteModuleConfig, defineDevHostConfig, defineDevRemoteModuleConfig, defineHostModuleFederationPluginOptions, defineRemoteModuleFederationPluginOptions, type ModuleFederationPluginOptions } from "../src/defineConfig.ts";

class DummyPlugin {
    _options: unknown;

    constructor(options: unknown) {
        this._options = options;
    }

    apply() {
        console.log("Apply Dummy plugin.");
    }
}

// The following options are relative to the environment running the test and breaks on CI.
function prepareModuleFederationPluginForSnapshot(plugin: WebpackPluginInstance) {
    delete (plugin._options as ModuleFederationPluginOptions)["runtimePlugins"];

    return plugin;
}

describe("defineDevHostConfig", () => {
    const SwcConfig = defineSwcDevConfig({
        chrome: "116"
    });

    test.concurrent("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, []);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("the application name is set as the output unique name", ({ expect }) => {
        const result = defineDevHostConfig(SwcConfig, 8080, []);

        expect(result.output!.uniqueName).toBe("host");
    });

    test("the port number is set as the dev server port", ({ expect }) => {
        const result = defineDevHostConfig(SwcConfig, 8080, []);

        // "devServer" does exist but webpack types are a messed.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.devServer.port).toBe(8080);
    });

    test("when no public path is provided, the default public path is \"auto\"", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, []);

        expect(config.output!.publicPath).toBe("auto");
    });

    test("when a public path is provided, use the provided public path", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            publicPath: "http://localhost:8080/"
        });

        expect(config.output!.publicPath).toBe("http://localhost:8080/");
    });

    test("the module federation plugin configuration includes the remotes", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [
            { name: "remote1", url: "http://localhost/remote1" },
            { name: "remote2", url: "http://localhost/remote2" }
        ]);

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, []);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
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

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when the router is react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            features: {
                router: "react-router"
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            features: {
                i18next: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            features: {
                honeycomb: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when environmentVariables is activated, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            features: {
                environmentVariables: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            plugins: [new DummyPlugin({})]
        });

        const result = findPlugin(config, matchConstructorName(DummyPlugin.name));

        expect(result).toBeDefined();
    });

    test("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineDevHostConfig(SwcConfig, 8080, [], {
            transformers: [(config: WebpackConfig) => {
                config.entry = "updated by the dummy transformer";

                return config;
            }]
        });

        expect(result.entry).toBe("updated by the dummy transformer");
    });

    test("when no options are provided for the html webpack plugin, add a public path option", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, []);

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        // This is an option that is relative to the environment running the test and breaks on CI.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete (result.plugin.userOptions as HtmlWebpackPlugin.Options)["template"];
        // This is an option that is relative to the environment running the test and breaks on CI.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete (result.plugin.options as HtmlWebpackPlugin.Options)["template"];

        expect(result.plugin).toMatchSnapshot();
    });

    test("when options others than the public path option are provided for the html webpack plugin, add a public path option", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            htmlWebpackPluginOptions: {
                favicon: "toto.png"
            }
        });

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        expect(result.plugin).toMatchSnapshot();
    });

    test("when a public path option is provided for the html webpack plugin, do not alter the provided public path option", ({ expect }) => {
        const config = defineDevHostConfig(SwcConfig, 8080, [], {
            htmlWebpackPluginOptions: {
                publicPath: "/toto"
            }
        });

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        expect(result.plugin).toMatchSnapshot();
    });
});

describe("defineBuildHostConfig", () => {
    const SwcConfig = defineSwcBuildConfig({
        chrome: "116"
    });

    test("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, []);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when no public path is provided, the default public path is \"auto\"", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, []);

        expect(config.output!.publicPath).toBe("auto");
    });

    test("when a public path is provided, use the provided public path", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            publicPath: "http://localhost:8080/"
        });

        expect(config.output!.publicPath).toBe("http://localhost:8080/");
    });

    test("the module federation plugin configuration includes the remotes", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [
            { name: "remote1", url: "http://localhost/remote1" },
            { name: "remote2", url: "http://localhost/remote2" }
        ]);

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, []);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
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

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when the router is react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                router: "react-router"
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                i18next: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                honeycomb: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when environmentVariables is env-vars, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                environmentVariables: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            plugins: [new DummyPlugin({})]
        });

        const result = findPlugin(config, matchConstructorName(DummyPlugin.name));

        expect(result).toBeDefined();
    });

    test("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const result = defineBuildHostConfig(SwcConfig, [], {
            transformers: [(config: WebpackConfig) => {
                config.entry = "updated by the dummy transformer";

                return config;
            }]
        });

        expect(result.entry).toBe("updated by the dummy transformer");
    });

    test("when no options are provided for the html webpack plugin, add a public path option", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, []);

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        // This is an option that is relative to the environment running the test and breaks on CI.
        delete ((result.plugin as WebpackPluginInstance).userOptions as HtmlWebpackPlugin.Options)["template"];
        // This is an option that is relative to the environment running the test and breaks on CI.
        delete ((result.plugin as WebpackPluginInstance).options as HtmlWebpackPlugin.Options)["template"];

        expect(result.plugin).toMatchSnapshot();
    });

    test("when options others than the public path option are provided for the html webpack plugin, add a public path option", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            htmlWebpackPluginOptions: {
                favicon: "toto.png"
            }
        });

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        expect(result.plugin).toMatchSnapshot();
    });

    test("when a public path option is provided for the html webpack plugin, do not alter the provided public path option", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            htmlWebpackPluginOptions: {
                publicPath: "/toto"
            }
        });

        const result = findPlugin(config, matchConstructorName(HtmlWebpackPlugin.name));

        expect(result.plugin).toMatchSnapshot();
    });
});

describe("defineDevRemoteModuleConfig", () => {
    const SwcConfig = defineSwcDevConfig({
        chrome: "116"
    });

    test("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("the application name is set as the output unique name", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);

        expect(config.output!.uniqueName).toBe("remote1");
    });

    test("the port number is set as the dev server port", ({ expect }) => {
        const result = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);

        // "devServer" does exist but webpack types are a messed.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.devServer.port).toBe(8081);
    });

    test("when no public path is provided, the default public path is \"auto\"", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);

        expect(config.output!.publicPath).toBe("auto");
    });

    test("when a public path is provided, use the provided public path", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            publicPath: "http://localhost:8081/"
        });

        expect(config.output!.publicPath).toBe("http://localhost:8081/");
    });

    test("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
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

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when the router is react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            features: {
                router: "react-router"
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            features: {
                i18next: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                honeycomb: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when environmentVariables is activated, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildHostConfig(SwcConfig, [], {
            features: {
                environmentVariables: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("access control headers are added to the dev server configuration", ({ expect }) => {
        const result = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081);

        // "devServer" does exist but webpack types are a messed.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.devServer.headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    test("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            plugins: [new DummyPlugin({})]
        });

        const result = findPlugin(config, matchConstructorName(DummyPlugin.name));

        expect(result).toBeDefined();
    });

    test("when additional configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const dummyTransformer = (config: WebpackConfig) => {
            config.entry = "updated by the dummy transformer";

            return config;
        };

        const result = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            transformers: [dummyTransformer]
        });

        expect(result.entry).toBe("updated by the dummy transformer");
    });
});

describe("defineBuildRemoteModuleConfig", () => {
    const SwcConfig = defineSwcBuildConfig({
        chrome: "116"
    });

    test("the application name is set as the federation plugin application name", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1");
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when no public path is provided, the default public path is \"auto\"", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1");

        expect(config.output!.publicPath).toBe("auto");
    });

    test("when a public path is provided, use the provided public path", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            publicPath: "http://localhost:8080/"
        });

        expect(config.output!.publicPath).toBe("http://localhost:8080/");
    });

    test("the module federation plugin configuration includes the default shared dependencies", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1");
        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional shared dependencies are provided, add the dependencies to the module federation plugin configuration", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
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

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional options are provided for an existing default shared dependency, add the consumer options to the default options", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            sharedDependencies: {
                "react": {
                    requiredVersion: "1.2.3"
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when overriding options are provided for a default shared dependency, use the consumer option", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            sharedDependencies: {
                "react": {
                    eager: false,
                    singleton: false
                }
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when the router is react-router, add react-router shared dependencies", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            features: {
                router: "react-router"
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when i18next is activated, add i18next shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            features: {
                i18next: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when honeycomb is activated, add honeycomb shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            features: {
                honeycomb: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when environmentVariables is activated, add env-vars shared dependency and requiredVersion: false to the react shared dependency definition", ({ expect }) => {
        const config = defineDevRemoteModuleConfig(SwcConfig, "remote1", 8081, {
            features: {
                environmentVariables: true
            }
        });

        const result = findPlugin(config, matchConstructorName(ModuleFederationPlugin.name));

        expect(prepareModuleFederationPluginForSnapshot(result.plugin as WebpackPluginInstance)).toMatchSnapshot();
    });

    test("when additional plugins are provided, the plugins are added to the configuration", ({ expect }) => {
        const config = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            plugins: [new DummyPlugin({})]
        });

        const result = findPlugin(config, matchConstructorName(DummyPlugin.name));

        expect(result).toBeDefined();
    });

    test("when configuration transformers are provided, the transformers are applied to the configuration", ({ expect }) => {
        const dummyTransformer = (config: WebpackConfig) => {
            config.entry = "updated by the dummy transformer";

            return config;
        };

        const result = defineBuildRemoteModuleConfig(SwcConfig, "remote1", {
            transformers: [dummyTransformer]
        });

        expect(result.entry).toBe("updated by the dummy transformer");
    });
});

describe("defineHostModuleFederationPluginOptions", () => {
    test("merge the default options with the provided options", ({ expect }) => {
        const result = defineHostModuleFederationPluginOptions([], {
            runtime: "a-custom-runtime-name"
        });

        expect(result.runtime).toBe("a-custom-runtime-name");
    });

    test("merge the shared dependencies with the default shared dependencies", ({ expect }) => {
        const result = defineHostModuleFederationPluginOptions([], {
            shared: {
                "react": {
                    singleton: false,
                    requiredVersion: "1.2.3"
                },
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react.singleton).toBeFalsy();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react.requiredVersion).toBe("1.2.3");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.first).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.second).toBeDefined();
    });
});

describe("defineRemoteModuleFederationPluginOptions", () => {
    test("merge the default options with the provided options", ({ expect }) => {
        const result = defineRemoteModuleFederationPluginOptions("remote1", {
            runtime: "a-custom-runtime-name"
        });

        expect(result.runtime).toBe("a-custom-runtime-name");
    });

    test("merge the shared dependencies with the default shared dependencies", ({ expect }) => {
        const result = defineRemoteModuleFederationPluginOptions("remote1", {
            shared: {
                "react": {
                    singleton: false,
                    requiredVersion: "1.2.3"
                },
                "first": {
                    singleton: true
                },
                "second": {
                    eager: true,
                    singleton: true
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react.singleton).toBeFalsy();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.react.requiredVersion).toBe("1.2.3");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.first).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.shared.second).toBeDefined();
    });

    test("should provide additional \"exposes\"", ({ expect }) => {
        const result = defineRemoteModuleFederationPluginOptions("remote1", {
            exposes: {
                "custom-file.js": "./src/custom-file.js"
            }
        });

        expect(Object.keys(result.exposes!).length).toBe(2);
        expect(Object.values(result.exposes!)[1]).toBe("./src/custom-file.js");
    });
});
