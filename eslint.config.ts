import { defineMonorepoWorkspaceConfig } from "@workleap/eslint-configs";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores([
        "packages",
        "samples",
        "templates",
        "docs",
        "skills-lock.json",
        // A git worktree checked out inside the repo. The ignores above are anchored at the repo root, so a
        // worktree's own "packages" and "skills-lock.json" escape them and get linted against the root config,
        // which fails on rules the packages configure for themselves.
        ".claude/worktrees"
    ]),
    defineMonorepoWorkspaceConfig(import.meta.dirname)
]);
