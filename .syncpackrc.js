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
            "packages": ["@squide/*"],
            "dependencyTypes": ["prod", "peer"],
            "range": "^",
            "label": "Packages should use ^ for dependencies and peerDependencies."
        },
        {
            "packages": ["@squide/*"],
            "dependencyTypes": ["dev"],
            "range": "",
            "label": "Packages should pin devDependencies."
        },
        {
            "packages": ["@basic/*", "@basic-mix/*", "@basic-webpack/*", "@endpoints/*", "@getting-started/*"],
            "dependencyTypes": ["prod", "dev"],
            "range": "",
            "label": "Samples and Getting Started templates should pin dependencies and devDependencies."
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
            "packages": ["**"],
            "dependencyTypes": ["prod", "dev"],
            "preferVersion": "highestSemver",
            "label": "Packages, Samples and Getting Started templates should have a single version across the repository."
        }
    ]
};
