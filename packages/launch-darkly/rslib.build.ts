import { defineBuildConfig } from "@workleap/rslib-configs";
import path from "node:path";

export default defineBuildConfig({
    tsconfigPath: path.resolve("./tsconfig.build.json")
});
