---
order: 100
toc:
    depth: 2-3
---

# i18nextPlugin

A plugin to faciliate the integration of [i18next](https://www.i18next.com/) in a modular application.

## Reference

```ts
const plugin = new i18nextPlugin(runtime, supportedLanguages: [], fallbackLanguage, queryStringKey, options?: { detection? })
```

### Parameters

- `runtime`: A runtime instance.
- `supportedLanguages`: An array of languages supported by the application.
- `fallbackLanguage`: The language to default to if none of the detected user's languages match any supported language.
- `queryStringKey`: The querystring parameter lookup when detecting the user's language.
- `options`: An optional object literal of options:
    - `detection`: An optional object literal accepting any [LanguageDetector](https://github.com/i18next/i18next-browser-languageDetector#detector-options) options.

## Usage

### Register the plugin

```ts !#5-10
import { i18nextPlugin } from "@squide/i18next";
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => {
        const i18nextPlugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");
        i18nextPlugin.detectUserLanguage();

        return i18nextPlugin;
    }]
});
```

### Retrieve the plugin instance

```ts !#3
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;
```

[!ref Prefer using `getI18nextPlugin` when possible](./getI18nextPlugin.md)

### Register a i18next instance

```ts !#15
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";
import i18n from "./i18next";
import resourcesEn from "./locales/en.json";
import resourcesFr from "./locales/fr.json";

const instance = i18n.createInstance({
    resources: {
        "en-US": resourcesEn,
        "fr-CA": resourcesFr
    }
});

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

plugin.registerInstance("an-instance-key", instance);
```

An instance must be registered from a module's [register function](../registration/initializeFirefly.md). Once the modules are registered, `registerInstance` throws.

### Lazy-load resources per language

Static resources land in the initial chunk for every supported language. To ship only the active language, provide a `loadResources` function when registering the instance. The plugin calls it with a language and expects a promise resolving to a map of namespace to resource bundle, the same shape as a single language entry of the i18next `resources` option:

```ts !#8-12,18-20,23-25
import { getI18nextPlugin, type LoadResourcesFunction } from "@squide/i18next";
import i18n from "i18next";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const plugin = getI18nextPlugin(runtime);

    // Each dynamic import becomes a chunk, only the active language is downloaded.
    const loadResources: LoadResourcesFunction = async language => {
        const module = await import(`./locales/${language}.json`, { with: { type: "json" } });

        return module.default;
    };

    const instance = i18n.createInstance();

    instance.init({
        lng: plugin.currentLanguage,
        // A lazy instance must be initialized with an empty "resources" object: i18next then initializes
        // synchronously and creates the store that the plugin fills with the loaded bundles.
        resources: {}
    });

    plugin.registerInstance("an-instance-key", instance, {
        loadResources
    });
};
```

[!ref Lazy-load the resources](../../integrations/setup-i18next.md#lazy-load-the-resources)

### Retrieve a i18next instance

```ts !#6
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

// If no instance match the specified key, an error will be thrown.
const instance = plugin.getInstance("an-instance-key");
```

### Detect the user language

Whenever a plugin instance is created, the user's language should always be detected immediatly using the `detectUserLanguage` function.

```ts !#9
import { i18nextPlugin } from "@squide/i18next";
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => {
        const i18nextPlugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");

        // If no detected languages match any of the supported languages, the fallback language will be applied.
        i18nextPlugin.detectUserLanguage();

        return i18nextPlugin;
    }]
});
```

### Retrieve the current language

```ts !#6
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

// If the language hasn't been changed nor detected before getting the current language, an error will be thrown.
const language = plugin.currentLanguage;
```

### Change the current language

`changeLanguage` returns a promise. It first loads the resources of the requested language into every [lazy](#lazy-load-resources-per-language) instance that doesn't hold them, then switches every registered instance, updates the [current language](#retrieve-the-current-language) and notifies the [language changed listeners](#listen-for-language-changes). Always `await` it, or handle the returned promise.

```ts !#6
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

// If the language isn't included in the "supportedLanguages" array, the promise rejects.
await plugin.changeLanguage("fr-CA");
```

### Listen for language changes

```ts !#9,12
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

const listener = () => {
    console.log("The language changed to", plugin.currentLanguage);
};

plugin.registerLanguageChangedListener(listener);

// When the listener is not needed anymore.
plugin.removeLanguageChangedListener(listener);
```

### Handle a failed resources load

A failed load never blocks the rendering of the application: the affected instance renders what i18next renders for a missing language, which is the resource key or the `fallbackLng` value when one is configured. Every failure is:

- Logged with the runtime [logger](../logging/useLogger.md).
- Dispatched on the [event bus](../messaging/useEventBusListener.md) as an `I18nextResourcesLoadFailedEvent`, with a `{ key, language, error }` payload.
- Rejected from the [changeLanguage](#change-the-current-language) promise as an `I18nextResourcesLoadError`, exposing the `key` of the instance, the `language` and the `cause`. The language is left unchanged.

```ts !#4-6,11-13
import { I18nextResourcesLoadFailedEvent, isI18nextResourcesLoadError } from "@squide/i18next";
import { useEventBusListener } from "@squide/firefly";

useEventBusListener(I18nextResourcesLoadFailedEvent, ({ key, language, error }) => {
    console.error(`The "${language}" resources of the "${key}" instance failed to load.`, error);
});

try {
    await plugin.changeLanguage("fr-CA");
} catch (error: unknown) {
    if (isI18nextResourcesLoadError(error)) {
        console.error(`The "${error.language}" resources of the "${error.key}" instance failed to load.`, error.cause);
    }
}
```

When `changeLanguage` is called from a React effect, handle the rejection to avoid an unhandled promise.

### Change the language detection order

By default, the detection of the user's language is done first from the specified URL querystring parameter (`?language` in this example), then from the user's [navigator language settings](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language). The detection order can be changed by specifying a new value for the [order](https://github.com/i18next/i18next-browser-languageDetector#detector-options) detection option:

```ts !#4
const plugin = new i18nextPlugin(["en-US", "fr-CA"], "en-US", "language", {
    detection: {
        // Change the detection order to lookup the user browser default languages before the querystring parameter.
        order: ["navigator", "querystring"]
    }
});
```

### Add an additional detection source

```ts !#6,9
const plugin = new i18nextPlugin(["en-US", "fr-CA"], "en-US", "language", {
    detection: {
        order: [
            "querystring",
            // Will look for a language in the local storage before detecting the language from the user browser defaults.
            "localStorage",
            "navigator",
        ],
        lookupLocalStorage: "my-local-storage-key"
    }
});
```
