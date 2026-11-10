import { defineBuildHostConfig } from "@squide/firefly-rsbuild-configs";
import { Remotes } from "./remotes.ts";
import { getSharedDependencies } from "./rsbuild.common.ts";

export default defineBuildHostConfig(Remotes, {
    sharedDependencies: getSharedDependencies(),
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
