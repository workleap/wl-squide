// @ts-check

import { defineBuildHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineBuildHostConfig(swcConfig, Remotes);
