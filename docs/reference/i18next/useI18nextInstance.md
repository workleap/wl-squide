---
order: 50
toc:
    depth: 2-3
---

# useI18nextInstance

Retrieve a registered [i18next](https://www.i18next.com/) instance from the [i18nextPlugin](./i18nextPlugin.md) instance.

## Reference

```tsx
const instance = useI18nextInstance(key)
```

### Parameters

- `key`: An instance key.

### Returns

An `i18next` instance.

## Usage

### Retrieve an instance

```tsx !#3
import { useI18nextInstance } from "@squide/i18next";

const instance = useI18nextInstance("an-instance-key");
```

### Use with the useTranslation hook

```tsx !#4,7
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

const instance = useI18nextInstance("an-instance-key");

const { t } = useTranslation("a-namespace", {
    i18n: instance 
});
```

### Use with the Trans component

```tsx !#4,5,9,11
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

Or without the `t` function:

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
