import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";

export default defineDevHostConfig(8080, [], {
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    },
    overlay: false,
    sharedDependencies: {
        "@basic/shared": {
            singleton: true,
            eager: true
        }
    },
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
