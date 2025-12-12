import { loadEnv } from "@rsbuild/core";
import { defineBuildHostConfig, defineBuildRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";
import { features, getSharedDependencies } from "./rsbuild.common.ts";

let config;

if (!process.env.ISOLATED) {
    config = defineBuildRemoteModuleConfig("remote1", {
        features,
        sharedDependencies: getSharedDependencies(false),
        environmentVariables: {
            "NETLIFY": process.env.NETLIFY === "true",
            "USE_MSW": process.env.USE_MSW === "true"
        }
    });
} else {
    const { parsed } = loadEnv({
        cwd: path.resolve("../../..")
    });

    config = defineBuildHostConfig([], {
        entry: {
            index: path.resolve("./src/dev/index.tsx")
        },
        features,
        sharedDependencies: getSharedDependencies(true),
        environmentVariables: {
            "NETLIFY": process.env.NETLIFY === "true",
            "USE_MSW": process.env.USE_MSW === "true",
            ...parsed
        }
    });
}

export default config;
