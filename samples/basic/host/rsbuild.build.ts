import { defineBuildConfig } from "@workleap/rsbuild-configs";

export default defineBuildConfig({
    environmentVariables: {
        NETLIFY: process.env.NETLIFY === "true"
    }
});
