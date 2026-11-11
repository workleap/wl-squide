import { defineDevConfig } from "@workleap/rsbuild-configs";

export default defineDevConfig({
    overlay: false,
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
