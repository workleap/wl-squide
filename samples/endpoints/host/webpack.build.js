// @ts-check

import { isNetlify } from "@endpoints/shared";
import { defineBuildHostConfig } from "@squide/firefly-configs";
import { Remotes } from "./remotes.js";
import { swcConfig } from "./swc.build.js";
import { features, getSharedDependencies } from "./webpack.common.js";

export default defineBuildHostConfig(swcConfig, "host", Remotes, {
    features,
    sharedDependencies: getSharedDependencies(),
    environmentVariables: {
        "NETLIFY": isNetlify,
        "USE_MSW": process.env.USE_MSW === "true"
    }
});

