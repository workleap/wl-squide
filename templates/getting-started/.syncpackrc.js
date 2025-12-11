// @ts-check

/** @type {import("syncpack").RcFile} */
export default {
    "lintFormatting": false,
    "semverGroups": [
        {
            "packages": ["@getting-started/host", "@getting-started/local-module"],
            "dependencyTypes": ["prod", "dev"],
            "range": "",
            "label": "Should pin dependencies and devDependencies."
        },
        {
            "packages": ["@getting-started/local-module"],
            "dependencyTypes": ["peer"],
            "range": "^",
            "label": "Samples library projects should use ^ for peerDependencies."
        },
        {
            "packages": ["@getting-started/root"],
            "dependencyTypes": ["dev"],
            "range": "",
            "label": "Workspace root should pin devDependencies."
        }
    ],
    "versionGroups": [
        {
            "packages": ["**"],
            "dependencyTypes": ["prod", "dev", "peer"],
            "preferVersion": "highestSemver",
            "label": "Packages, Samples and Getting Started templates should have a single version across the repository."
        }
    ]
};
