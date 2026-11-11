import { loadEnv } from "@rsbuild/core";
import { defineDevConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

const { parsed } = loadEnv({
    cwd: path.resolve("../../..")
});

export default defineDevConfig({
    overlay: false,
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    },
    environmentVariables: {
        ISOLATED: process.env.ISOLATED === "true",
        USE_MSW: process.env.USE_MSW === "true",
        ...parsed
    }
});
