// @ts-check

/** @type {import("syncpack").RcFile} */
export default {
    "lintFormatting": false,
    "dependencyTypes": ["prod", "dev"],
    "semverGroups": [
        {
            "packages": ["**"],
            "dependencies": ["useless-lib"],
            "isIgnored": true
        },
        {
            "packages": ["@squide/firefly-rsbuild-configs", "@squide/firefly-webpack-configs"],
            "dependencyTypes": ["prod"],
            "dependencies": ["**"],
            "range": "^",
            "label": "Bundler shared configurations packages dependencies version should be ranged"
        },
        {
            "packages": ["**"],
            "dependencyTypes": ["prod", "dev"],
            "dependencies": ["**"],
            "range": "",
            "label": "Packages version should be pinned"
        },
    ],
    "versionGroups": [
        {
            "dependencies": ["useless-lib"],
            "packages": ["**"],
            "isIgnored": true
        },
        {
            // Temporary until dependencies are fixed.
            "packages": ["@squide/module-federation"],
            "dependencies": ["@rspack/core"],
            "isIgnored": true
        },
        {
            "packages": ["**"],
            "dependencyTypes": ["prod", "dev"],
            "dependencies": ["**"],
            "preferVersion": "highestSemver",
            "label": "Packages should have a single version across the repository"
        }
    ]
};
