// @ts-check

import { isNetlify } from "@basic/shared";
import { defineDevHostConfig } from "@squide/firefly-configs";
import { Remotes } from "./remotes.js";
import { swcConfig } from "./swc.dev.js";
import { getSharedDependencies } from "./webpack.common.js";

export default defineDevHostConfig(swcConfig, "host", 8080, Remotes, {
    overlay: false,
    sharedDependencies: getSharedDependencies(),
    environmentVariables: {
        "NETLIFY": isNetlify
    }
});
