// @ts-check

/** @type {import("syncpack").RcFile} */
export default {
    semverGroups: [
        {
            // Upgrading to version "0.12.0" of both of these causes typings issues.
            packages: ["**"],
            dependencies: ["@module-federation/enhanced", "@module-federation/rsbuild-plugin"],
            isIgnored: true
        },
        {
            // "@module-federation/enhanced" 2.9.3 can't load webpack 5.112+ (https://github.com/module-federation/core/issues/5202).
            // "@workleap/webpack-configs" is pinned to the last release accepting an older webpack, and the webpack peer range is capped.
            // The hold is permanent, see agent-docs/references/development.md.
            packages: ["@squide/firefly-webpack-configs"],
            dependencies: ["@workleap/webpack-configs", "webpack"],
            dependencyTypes: ["prod", "peer"],
            isIgnored: true
        },
        {
            packages: ["@squide/*"],
            dependencyTypes: ["prod", "peer"],
            range: "^",
            label: "Packages should use ^ for dependencies and peerDependencies."
        },
        {
            packages: ["@squide/*", "@basic/*", "@endpoints/*", "@storybook/*", "@getting-started/*"],
            dependencyTypes: ["dev"],
            range: "",
            label: "Samples and Getting Started templates should pin devDependencies."
        },
        {
            packages: ["@basic/host", "@endpoints/host", "@endpoints/express-server", "@storybook/app", "@storybook/host", "@getting-started/host"],
            dependencyTypes: ["prod", "dev"],
            range: "",
            label: "Samples and Getting Started templates host applications should pin dependencies and devDependencies."
        },
        {
            packages: ["@basic/another-local-module", "@basic/local-module", "@basic/shared", "@basic/shell", "@endpoints/another-local-module", "@endpoints/i18next", "@endpoints/layouts", "@endpoints/local-module", "@endpoints/shared", "@endpoints/shell", "@storybook/app", "@storybook/host"],
            dependencyTypes: ["peer"],
            range: "^",
            label: "Samples library projects should use ^ for peerDependencies."
        },
        {
            packages: ["workspace-root"],
            dependencyTypes: ["dev"],
            range: "",
            label: "Workspace root should pin devDependencies."
        }
    ],
    versionGroups: [
        {
            // "@types/react", "react" and "react-dom" declares ranges to support React 18 and 19.
            // It's messing up with syncpack.
            packages: ["@squide/*"],
            dependencies: ["@types/react", "react", "react-dom"],
            dependencyTypes: ["peer"],
            isIgnored: true
        },
        {
            // The webpack peer range is capped, see the matching semver group.
            packages: ["@squide/firefly-webpack-configs"],
            dependencies: ["webpack"],
            dependencyTypes: ["peer"],
            isIgnored: true
        },
        {
            packages: ["@basic/*", "@endpoints/*", "@storybook/*", "@getting-started/*"],
            dependencies: ["@squide/*"],
            dependencyTypes: ["prod"],
            isIgnored: true
        },
        {
            packages: ["**"],
            dependencyTypes: ["prod", "dev", "peer"],
            preferVersion: "highestSemver",
            label: "Packages, Samples and Getting Started templates should have a single version across the repository."
        }
    ]
};
