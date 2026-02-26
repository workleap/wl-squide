import { defineMonorepoWorkspaceConfig } from "@workleap/eslint-configs";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores([
        "packages",
        "samples",
        "templates",
        "docs",
        "skills-lock.json"
    ]),
    defineMonorepoWorkspaceConfig(import.meta.dirname)
]);
