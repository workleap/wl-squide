---
order: 140
---

### Update the webpack configurations

Finally, update the webpack development and build configurations to activate the `i18next` feature. Enabling this feature will configure the `i18next` libraries as [shared dependencies](./add-a-shared-dependency.md):

```js !#7-9 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, [], {
    features: {
        i18next: true
    },
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            eager: true
        }
    }
});
```

```js !#7-9 host/webpack.build.js
// @ts-check

import { defineBuildHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildHostConfig(swcConfig, [], {
    features: {
        i18next: true
    },
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            eager: true
        }
    }
});
```

### Update the webpack configurations

Finally, update the webpack development and build configurations to activate the `i18next` feature. Enabling this feature will configure the `i18next` libraries as [shared dependencies](./add-a-shared-dependency.md):

```js !#7-9 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081, {
    features: {
        i18next: true
    },
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```

```js !#7-9 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    features: {
        i18next: true
    },
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```
