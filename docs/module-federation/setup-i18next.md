---
order: 140
---

# Setup i18next

Most Workleap's application are either already bilingual or will be in the future. To help feature teams deal with localized resources, Squide provides a native [plugin](../reference/i18next/i18nextPlugin.md) designed to adapt the [i18next](https://www.i18next.com/) library for modular applications.

!!!warning
The examples in this guide load all the resources from single localized resources files. For a real Workleap application, you probably want to spread the resources into multiple files and load the files with a i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends).
!!!

## Setup the host application

:mag_right: This section is similar to the [Setup the host application section](../guides/setup-i18next.md#setup-the-host-application) from the non–Module Federation guide on developing a module in isolation. The key difference is that in a Module Federation setup, the host application's entry point is `bootstrap.tsx` instead of `index.tsx`.

## Setup a remote module

First, open a terminal at the root of the remote module application and install the following packages:

```bash
pnpm add @squide/i18next i18next i18next-browser-languagedetector react-i18next
```

### Define the localized resources

Then, create the localized resource files for the `en-US` and `fr-CA` locales:

```json !#2-7 remote-module/src/locales/en-US.json
{
    "navigationItems": {
        "page": "Remote/Page - en-US"
    },
    "Page": {
        "bodyText": "Hello from Remote/Page!"
    }
}
```

```json !#2-7 remote-module/src/locales/fr-CA.json
{
    "navigationItems": {
        "page": "Remote/Page - fr-CA"
    },
    "Page": {
        "bodyText": "Bonjour depuis Remote/Page!"
    }
}
```

Notice that this time, a standard `navigationItems` namespace has been added to the resource files. The resources in the `navigationItems` namespace will be used later on to localize the navigation items labels.

### Register an i18next instance

Then, update the remote module's register function to create and register an instance of `i18next` with the `i18nextPlugin` plugin instance. Similarly to the [host application](#register-an-i18next-instance), due to how the internals of `i18next` works, this local module requires to register its own instance of the third-party library:

```tsx !#10,12-14,16-23,26 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        // Create the instance with the language that has been detected earlier in the host application bootstrapping code.
        lng: i18nextPlugin.currentLanguage,
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    // Will associate the instance with the "remote-module" key.
    i18nextPlugin.registerInstance("remote-module", i18nextInstance);

    // --------

    runtime.registerRoute({
        path: "/remote/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $label: "Remote/Page",
        to: "/remote/page"
    });
}
```

### Localize the navigation item labels

Then, localize the navigation items labels using the [I18nextNavigationItemLabel](../reference/i18next/I18nextNavigationItemLabel.md) component. Since this example resources are in the `navigationItems` namespace, there's no need to specify a `namespace` property on the components as it will be inferred:

```tsx !#37 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin, I18nextNavigationItemLabel } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        // Create the instance with the language that has been detected earlier in the host application bootstrapping code.
        lng: i18nextPlugin.currentLanguage,
        load: "currentOnly",
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    // Will associate the instance with the "remote-module" key.
    i18nextPlugin.registerInstance("remote-module", i18nextInstance);

    // --------

    runtime.registerRoute({
        path: "/remote/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="page" />,
        to: "/remote/page"
    });
}
```

### Localize the page resources

Then, update the `Page` component to use the newly created localized resource:

```tsx !#6,7,10 remote-module/src/Page.tsx
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

export function Page() {
    // Must be the same instance key that has been used to register the i18next instance previously in the "register" function.
    const i18nextInstance = useI18nextInstance("remote-module");
    const { t } = useTranslation("Page", { i18n: useI18nextInstance });

    return (
        <div>{t("bodyText")}</div>
    );
}
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

## Integrate a backend language setting

:mag_right: This section is similar to the [Integrate a backend language setting section](../guides/setup-i18next.md#integrate-a-backend-language-setting) from the non–Module Federation guide on developing a module in isolation.

## Use the Trans component

:mag_right: This section is similar to the [Use the Trans component section](../guides/setup-i18next.md#use-the-trans-component) from the non–Module Federation guide on developing a module in isolation.

## Try it :rocket:

Start the application in a development environment using the `dev` script. The homepage and the navigation items should render the english (`en-US`) resources. Then append `?language=fr-CA` to the URL. The homepage and the navigation items should now render the french (`fr-CA`) resources.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each `i18next` instance that is being registered and another log everytime the language is changed:
    - `[squide] Registered a new i18next instance with key "remote-module".`
    - `[squide] The language has been changed to "fr-CA".`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
