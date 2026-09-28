---
order: 70
toc:
    depth: 2-3
---

# useChangeLanguage

Provide a function to change the current language of every [i18next](https://www.i18next.com/) instance registered with the [i18nextPlugin](./i18nextPlugin.md) instance.

## Reference

```ts
const changeLanguage = useChangeLanguage()
```

### Parameters

None

### Returns

A function to change the current language of an `i18nextPlugin` instance: `(newLanguage) => Promise<void>`.

## Usage

```ts !#3,5
import { useChangeLanguage } from "@squide/i18next";

const changeLanguage = useChangeLanguage();

changeLanguage("fr-CA");
```

### Lazy-loaded resources

When the modules register [lazy](./i18nextPlugin.md#lazy-load-resources-per-language) i18next instances, the promise resolves once the resources of the new language are loaded and the language is switched. It rejects with an [I18nextResourcesLoadError](./i18nextPlugin.md#handle-a-failed-resources-load) when a load fails.

```ts !#5
import { useChangeLanguage } from "@squide/i18next";

const changeLanguage = useChangeLanguage();

await changeLanguage("fr-CA");
```
