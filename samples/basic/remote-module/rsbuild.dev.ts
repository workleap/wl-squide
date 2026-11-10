import { defineDevHostConfig, defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";
import { getSharedDependencies } from "./rsbuild.common.ts";

let config;

if (!process.env.ISOLATED) {
    config = defineDevRemoteModuleConfig("remote1", 8081, {
        sharedDependencies: getSharedDependencies(false),
        environmentVariables: {
            NETLIFY: process.env.NETLIFY === "true"
        }
    });
} else {
    config = defineDevHostConfig(8080, [], {
        entry: {
            index: path.resolve("./src/dev/index.tsx")
        },
        overlay: false,
        sharedDependencies: getSharedDependencies(true),
        environmentVariables: {
            NETLIFY: process.env.NETLIFY === "true"
        }
    });
}

export default config;
