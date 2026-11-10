import { defineBuildRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";
import { getSharedDependencies } from "./rsbuild.common.ts";

export default defineBuildRemoteModuleConfig("remote2", {
    sharedDependencies: getSharedDependencies(false),
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
