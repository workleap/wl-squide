import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";
import { features, getSharedDependencies } from "./rsbuild.common.ts";

export default defineDevHostConfig(8080, [], {
    overlay: false,
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    },
    features,
    sharedDependencies: getSharedDependencies(true),
    environmentVariables: {
        ISOLATED: process.env.ISOLATED === "true",
        USE_MSW: process.env.USE_MSW === "true"
    }
});
