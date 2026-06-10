---
order: 60
toc:
    depth: 2-3
---

# useCurrentLanguage

Retrieve the current language of the [i18nextPlugin](./i18nextPlugin.md) instance. This hook is reactive: the component re-renders whenever the language is changed with [useChangeLanguage](./useChangeLanguage.md) or the plugin's `changeLanguage` method.

## Reference

```ts
const language = useCurrentLanguage()
```

### Parameters

None

### Returns

The current language of the `i18nextPlugin` instance.

## Usage

```ts !#3
import { useCurrentLanguage } from "@squide/i18next";

const language = useCurrentLanguage();
```

Or with a typed language:

```ts !#4
import { useCurrentLanguage } from "@squide/i18next";
import { LanguageKey } from "@sample/shared";

const language = useCurrentLanguage() as LanguageKey;
```
