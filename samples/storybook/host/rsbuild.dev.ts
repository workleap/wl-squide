import { loadEnv } from "@rsbuild/core";
import { defineDevConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

const { parsed } = loadEnv({
    cwd: path.resolve("../../..")
});

export default defineDevConfig({
    environmentVariables: {
        ...parsed
    }
});
