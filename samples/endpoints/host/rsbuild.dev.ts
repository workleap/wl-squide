import { loadEnv } from "@rsbuild/core";
import { defineDevConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

const { parsed } = loadEnv({
    cwd: path.resolve("../../..")
});

export default defineDevConfig({
    overlay: false,
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true",
        USE_MSW: process.env.USE_MSW === "true",
        ...parsed
    }
});
