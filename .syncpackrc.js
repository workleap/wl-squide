// @ts-check

/** @type {import("syncpack").RcFile} */
export default {
    "lintFormatting": false,
    "semverGroups": [
        {
            "packages": ["**"],
            "dependencies": ["useless-lib"],
            "isIgnored": true
        },
        {
            // Upgrading to version "0.12.0" of both of these causes typings issues.
            "packages": ["**"],
            "dependencies": ["@module-federation/enhanced", "@module-federation/rsbuild-plugin"],
            "isIgnored": true
        },
        {
            "packages": ["@squide/*"],
            "dependencyTypes": ["prod", "peer"],
            "range": "^",
            "label": "Packages should use ^ for dependencies and peerDependencies."
        },
        {
            "packages": ["@squide/*", "@basic/*", "@basic-mix/*", "@basic-webpack/*", "@endpoints/*", "@getting-started/*", "@getting-started-remote/*"],
            "dependencyTypes": ["dev"],
            "range": "",
            "label": "Samples and Getting Started templates should pin devDependencies."
        },
        {
            "packages": [
                "@basic/host", "@basic/remote-module", "@basic/another-remote-module",
                "@basic-mix/host", "@basic-mix/remote-module", "@basic-mix/another-remote-module",
                "@basic-webpack/host", "@basic-webpack/remote-module", "@basic-webpack/another-remote-module",
                "@endpoints/host", "@endpoints/remote-module", "@endpoints/express-server",
                "@getting-started/host",
                "@getting-started-remote/host"
            ],
            "dependencyTypes": ["prod", "dev"],
            "range": "",
            "label": "Samples and Getting Started templates host applications and remote-modules should pin dependencies and devDependencies."
        },
        {
            "packages": ["workspace-root"],
            "dependencyTypes": ["dev"],
            "range": "",
            "label": "Workspace root should pin devDependencies."
        }
    ],
    "versionGroups": [
        {
            "packages": ["**"],
            "dependencies": ["useless-lib"],
            "isIgnored": true
        },
        {
            // "react" and "react-dom" declares ranges to support React 18 and 19.
            // It's messing up with syncpack.
            "packages": ["@squide/*"],
            "dependencies": ["react", "react-dom"],
            "dependencyTypes": ["peer"],
            "isIgnored": true
        },
        {
            "packages": ["**"],
            "dependencyTypes": ["prod", "dev", "peer"],
            "preferVersion": "highestSemver",
            "label": "Packages, Samples and Getting Started templates should have a single version across the repository."
        }
    ]
};
