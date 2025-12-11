// @ts-check

/** @type {import("syncpack").RcFile} */
export default {
    "lintFormatting": false,
    "semverGroups": [
        {
            "packages": ["@getting-started-remote/host", "@getting-started-remote/local-module", "@getting-started-remote/remote-module"],
            "dependencyTypes": ["prod", "dev"],
            "range": "",
            "label": "Should pin dependencies and devDependencies."
        },
        {
            "packages": ["@getting-started-remote/local-module"],
            "dependencyTypes": ["peer"],
            "range": "^",
            "label": "Samples library projects should use ^ for peerDependencies."
        },
        {
            "packages": ["@getting-started-remote/root"],
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
