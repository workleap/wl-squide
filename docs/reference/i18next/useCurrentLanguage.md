---
order: 60
toc:
    depth: 2-3
---

# useCurrentLanguage

Retrieve the current language of the [i18nextPlugin](./i18nextPlugin.md) instance.

## Reference

```tsx
const language = useCurrentLanguage()
```

### Parameters

None

### Returns

The current language of the `i18nextPlugin` instance.

## Usage

```tsx !#3
import { useCurrentLanguage } from "@squide/i18next";

const language = useCurrentLanguage();
```

Or with a typed language:

```tsx !#4
import { useCurrentLanguage } from "@squide/i18next";
import { LanguageKey } from "@sample/shared";

const language = useCurrentLanguage() as LanguageKey;
```
