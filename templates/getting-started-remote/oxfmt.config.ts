import { defineConfig } from "oxfmt";

export default defineConfig({
    ignorePatterns: ["**/*.md", "**/mockServiceWorker.js"],
    printWidth: 300,
    tabWidth: 4,
    singleQuote: false,
    jsxSingleQuote: false,
    semi: true,
    trailingComma: "none",
    arrowParens: "avoid",
    bracketSpacing: true,
    bracketSameLine: false,
    quoteProps: "as-needed",
    sortPackageJson: {
        sortScripts: false
    },
    overrides: [
        {
            files: ["*.yml", "*.yaml"],
            options: {
                tabWidth: 2
            }
        }
    ]
});
