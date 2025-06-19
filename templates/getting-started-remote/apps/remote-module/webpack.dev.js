// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
