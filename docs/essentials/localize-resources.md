---
order: 360
label: Localize resources
---

# Localize resources

To localize resources for a Squide application, start by following the [setup i18next](../integrations/setup-i18next.md) integration guide to configure the [i118nextPlugin](../reference/i18next/i18nextPlugin.md) and create and register an `i18next` instance for your module. Once the setup is complete, the examples below cover the most common use cases.

For more detail, refer to the `i18next` [reference](../reference/i18next/i18nextPlugin.md) documentation.

## Localize a page resource

To localize a resource within a page, first retrieve the module's `i18next` instance using the [useI18nextInstance](../reference/i18next/useI18nextInstance.md) hook. Then, use that instance with `i18next` native [useTranslation](https://react.i18next.com/latest/usetranslation-hook) hook to access the translated resources:

```tsx !#5-6,9
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

export function Page() {
    const i18nextInstance = useI18nextInstance("an-instance-key");
    const { t } = useTranslation("Page", { i18n: i18nextInstance });

    return (
        <div>{t("bodyText")}</div>
    );
}
```

==- :icon-file-code: Localized resource files used in the example
```json !#1-5 ./locales/en-US.json
{
    "Page": {
        "bodyText": "Hello from Page!"
    }
}
```

```json !#1-5 ./locales/fr-CA.json
{
    "Page": {
        "bodyText": "Bonjour depuis la page!"
    }
}
```
===

## Localize a navigation item label

A navigation item can be localized by combining the `$label` option with the [I18nextNavigationItemLabel](../reference/i18next/I18nextNavigationItemLabel.md) component:

```tsx !#35 local-module/src/register.tsx
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
        // Create the instance with the language that has been detected at bootstrapping.
        lng: i18nextPlugin.currentLanguage,
        load: "currentOnly",
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    i18nextPlugin.registerInstance("an-instance-key", i18nextInstance);

    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "page",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="page" />,
        to: "/page"
    });
}
```

==- :icon-file-code: Localized resource files used in the example
```json !#1-5 ./locales/en-US.json
{
    "navigationItems": {
        "page": "Page - en-US"
    }
}
```

```json !#1-5 ./locales/fr-CA.json
{
    "navigationItems": {
        "page": "Page - fr-CA"
    }
}
```
===

## Use the Trans component

The [Trans](https://react.i18next.com/latest/trans-component) component is useful for scenarios involving interpolation to render a localized resources. To use the `Trans` component with Squide, pair it with an `i18next` instance retrieved from [useI18nextInstance](../reference/i18next/useI18nextInstance.md) hook:

```tsx !#5,9,11
import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";

const instance = useI18nextInstance("an-instance-key");
const { t } = useTranslation("a-namespace", { i18n: instance });

return (
    <Trans
        i18n={instance}
        i18nKey="a-key"
        t={t}
    />
);
```

The `Trans` component can also be used without the `t` function by including a namespace to the `i18nKey` property value:

```tsx !#4,8,9
import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";

const instance = useI18nextInstance("an-instance-key");

return (
    <Trans
        i18n={instance}
        i18nKey="a-namespace:a-key"
    />
);
```
