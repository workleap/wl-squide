import { loadEnv } from "@rsbuild/core";
import { defineDevHostConfig, defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";
import { features, getSharedDependencies } from "./rsbuild.common.ts";

let config;

if (!process.env.ISOLATED) {
    config = defineDevRemoteModuleConfig("remote1", 8081, {
        features,
        sharedDependencies: getSharedDependencies(false),
        environmentVariables: {
            "NETLIFY": process.env.NETLIFY === "true",
            "ISOLATED": process.env.ISOLATED === "true",
            "USE_MSW": process.env.USE_MSW === "true"
        }
    });
} else {
    const { parsed } = loadEnv({
        cwd: path.resolve("../../..")
    });

    config = defineDevHostConfig(8080, [], {
        overlay: false,
        entry: {
            index: path.resolve("./src/dev/index.tsx")
        },
        features,
        sharedDependencies: getSharedDependencies(true),
        environmentVariables: {
            "ISOLATED": process.env.ISOLATED === "true",
            "USE_MSW": process.env.USE_MSW === "true",
            ...parsed
        }
    });
}

export default config;

