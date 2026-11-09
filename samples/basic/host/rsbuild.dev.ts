import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";
import { Remotes } from "./remotes.ts";
import { getSharedDependencies } from "./rsbuild.common.ts";

export default defineDevHostConfig(8080, Remotes, {
    overlay: false,
    sharedDependencies: getSharedDependencies(),
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
