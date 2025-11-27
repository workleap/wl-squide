import { defineMonorepoWorkspaceConfig } from "@workleap/eslint-configs";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores([
        "storybook-static",
        "host"
    ]),
    defineMonorepoWorkspaceConfig(import.meta.dirname)
]);
