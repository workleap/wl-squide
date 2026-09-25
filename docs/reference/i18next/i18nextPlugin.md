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

An instance must be registered from a module's [register function](../registration/initializeFirefly.md). Once the modules are registered, `registerInstance` throws, which means an instance cannot be registered from a [deferred registration function](../registration/useDeferredRegistrations.md).

```ts !#19
import { getI18nextPlugin } from "@squide/i18next";
import i18n from "i18next";
import resourcesEn from "./locales/en.json";
import resourcesFr from "./locales/fr.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const plugin = getI18nextPlugin(runtime);

    const instance = i18n.createInstance();

    instance.init({
        lng: plugin.currentLanguage,
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    plugin.registerInstance("an-instance-key", instance);
};
```

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

When an instance is registered with a `loadResources` function, the plugin:

- Loads the resources of the [current language](#retrieve-the-current-language) right away, unless the instance already holds them. The plugin reports itself as [not ready](#wait-for-the-resources-to-be-ready) until that load settles, which keeps [useIsBootstrapping](../routing/useIsBootstrapping.md) `true`.
- Adds the loaded bundles to the instance with [addResourceBundle](https://www.i18next.com/overview/api#addresourcebundle) and re-applies the language so the mounted components render the new resources.
- Loads the resources of any language the instance doesn't hold yet [when the language changes](#change-the-current-language), before switching.

An instance can be hybrid: initialize it with the static resources of one language and provide a `loadResources` function for the others. The plugin only loads a language the instance doesn't hold, so the static language is never requested. An empty bundle counts as a loaded language.

Registering a lazy instance requires the user language to be [detected](#detect-the-user-language) and the instance to be initialized. Otherwise, `registerInstance` throws.

!!!info
No i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends) is involved. Because the instance has no backend, `react-i18next` never suspends: the runtime semantics are the same as with static resources, the plugin simply fills the store before the language is applied.
!!!

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

A few rules apply:

- When no instance needs to load resources, the switch happens synchronously, before the promise resolves.
- **Latest call wins.** When a more recent call is made while a previous one is still loading, the previous call resolves without switching once its loads settle.
- Called with the **current language**, it waits for the pending loads of that language and resolves without switching nor notifying the listeners. It's the way to wait until the initial resources are loaded, for example from a [Storybook loader](../storybook/initializeFireflyForStorybook.md#initialize-with-i18next).
- When a load **fails**, the promise rejects with an [I18nextResourcesLoadError](#handle-a-failed-resources-load) and the language is left unchanged on every instance. The failed load isn't cached: a later call invokes `loadResources` again.

!!!warning
A React effect written as a concise arrow function now returns the promise to React, which is not allowed. Use a block body: `useEffect(() => { changeLanguage(language); }, [language]);`.
!!!

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

### Wait for the resources to be ready

The plugin implements the [readiness surface](../plugins/Plugin.md#report-readiness) of `Plugin`: `isReady`, `registerReadyListener` and `removeReadyListener`. It becomes ready once the modules are registered and every registered instance has settled the load of the current language resources, either by holding them or by failing to load them. [useIsBootstrapping](../routing/useIsBootstrapping.md) waits for it, so the application never renders raw resource keys while the initial resources are loading.

Readiness is a one-way latch: a later language change never resets it, the pending loads of that change are awaited through the promise returned by [changeLanguage](#change-the-current-language) instead.

```ts !#5,7-9
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;

if (!plugin.isReady()) {
    // A listener registered once the plugin is ready is never executed, always read "isReady" first.
    plugin.registerReadyListener(() => {
        console.log("The resources of the current language are loaded.");
    });
}
```

### Handle a failed resources load

A failed load never blocks the rendering of the application: the readiness latch treats a failed load as settled, and the affected instance renders what i18next renders for a missing language, which is the resource key or the `fallbackLng` value when one is configured. Every failure is:

- Logged with the runtime [logger](../logging/useLogger.md).
- Dispatched on the [event bus](../messaging/useEventBusListener.md) as an `I18nextResourcesLoadFailedEvent`, with a `{ key, language, error }` payload.
- Rejected from the [changeLanguage](#change-the-current-language) promise as an `I18nextResourcesLoadError`, exposing the `key` of the instance, the `language` and the `cause`.

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

When `changeLanguage` is awaited from a [deferred registration function](../registration/useDeferredRegistrations.md#await-a-bootstrap-side-effect), the rejection reaches the `onError` callback of `useDeferredRegistrations` as the `cause` of a `ModuleRegistrationError`. Turning a failed load into an error page is left to the application.

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
