import { defineDevConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

export default defineDevConfig({
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    },
    overlay: false,
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
