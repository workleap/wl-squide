import { defineBuildConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

export default defineBuildConfig({
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    },
    environmentVariables: {
        ISOLATED: process.env.ISOLATED === "true",
        USE_MSW: process.env.USE_MSW === "true"
    }
});
