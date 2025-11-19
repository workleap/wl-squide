---
order: 40
toc:
    depth: 2-3
---

# I18nextNavigationItemLabel

A React component to localize the label of Squide [navigation items](../runtime/FireflyRuntime.md#register-navigation-items).

## Reference

```tsx
<I18nextNavigationItemLabel i18next={} namespace="" resourceKey="" />
```

### Properties

- `i18next`: An `i18next` instance.
- `namespace`: An optional namespace for the localized resource. If no namespace is provided, the default namespace is `"navigationItems"`.
- `resourceKey`: A localized resource key.

## Usage

```tsx !#7 remote-module/src/register.tsx
import type { FireflyRuntime } from "@squide/firefly";
import { I18nextNavigationItemLabel } from "@squide/i18next";
import i18n from "i18next";

function registerRoutes(runtime: FireflyRuntime, i18nextInstance: i18n) {
    runtime.registerNavigationItem({
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="aboutPage"  />
        to: "/about"
    });
}
```

Or with a difference resources namespace:

```tsx !#7 remote-module/src/register.tsx
import type { FireflyRuntime } from "@squide/firefly";
import { I18nextNavigationItemLabel } from "@squide/i18next";
import i18n from "i18next";

function registerRoutes(runtime: FireflyRuntime, i18nextInstance: i18n) {
    runtime.registerNavigationItem({
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} namespace="another-namespace" resourceKey="aboutPage"  />
        to: "/about"
    });
}
```
