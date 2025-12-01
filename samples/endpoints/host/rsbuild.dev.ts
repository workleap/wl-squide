import { loadEnv } from "@rsbuild/core";
import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";
import { AllRemotes } from "./remotes.ts";
import { features, getSharedDependencies } from "./rsbuild.common.ts";

const { parsed } = loadEnv({
    cwd: path.resolve("../../..")
});

export default defineDevHostConfig(8080, AllRemotes, {
    overlay: false,
    features,
    sharedDependencies: getSharedDependencies(),
    environmentVariables: {
        "NETLIFY": process.env.NETLIFY === "true",
        "USE_MSW": process.env.USE_MSW === "true",
        ...parsed
    }
});
