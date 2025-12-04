import { loadEnv } from "@rsbuild/core";
import { defineBuildConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

const { parsed } = loadEnv({
    cwd: path.resolve("../../..")
});

export default defineBuildConfig({
    environmentVariables: {
        ...parsed
    }
});
