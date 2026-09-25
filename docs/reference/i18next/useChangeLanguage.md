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

A function to change the current language of an `i18nextPlugin` instance: `(newLanguage) => Promise<void>`. The promise resolves once the resources of the new language are loaded into every [lazy](./i18nextPlugin.md#lazy-load-resources-per-language) instance and the language is switched. It rejects with an [I18nextResourcesLoadError](./i18nextPlugin.md#handle-a-failed-resources-load) when a load fails, and with a plain `Error` when the language isn't part of the supported languages. See [change the current language](./i18nextPlugin.md#change-the-current-language) for the details.

## Usage

```ts !#3,5
import { useChangeLanguage } from "@squide/i18next";

const changeLanguage = useChangeLanguage();

await changeLanguage("fr-CA");
```

!!!warning
When the function is executed from a React effect, use a block body. A concise arrow function would return the promise to React, which is not allowed: `useEffect(() => { changeLanguage("fr-CA"); }, [changeLanguage]);`.
!!!
