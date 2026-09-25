---
order: 840
---

# Lazy-load the i18next resources

!!!warning
Before going forward with this recipe, make sure that you complete the [Setup i18next](../integrations/setup-i18next.md) guide.
!!!

With the setup described in the [Setup i18next](../integrations/setup-i18next.md) guide, every module creates its `i18next` instance with the resources of every supported language, which all land in the module's initial chunk. For an application with many modules and languages, the resources of the languages the user will never see can weigh a significant part of the initial download.

The [i18nextPlugin](../reference/i18next/i18nextPlugin.md) can instead load the resources of a language on demand: the current language when the instance is registered, then any other language before switching to it. The application only downloads the active language, and [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) stays `true` until the resources of the current language are loaded, so a page never renders raw resource keys.

## Register a lazy instance

Initialize the instance with an empty `resources` object and provide a [loadResources](../reference/i18next/i18nextPlugin.md#lazy-load-resources-per-language) function when registering the instance. The function receives a language and resolves to a map of namespace to resource bundle, the same shape as a single language entry of the i18next `resources` option:

```tsx !#7-12,23-25,28-30 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin, type LoadResourcesFunction } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Each dynamic import becomes a chunk, only the active language is downloaded.
const loadResources: LoadResourcesFunction = async language => {
    const module = await import(`./locales/${language}/resources.json`, { with: { type: "json" } });

    return module.default;
};

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        lng: i18nextPlugin.currentLanguage,
        // A lazy instance must be initialized with an empty "resources" object so that i18next initializes
        // synchronously and creates the store filled by the plugin.
        resources: {}
    });

    i18nextPlugin.registerInstance("local-module", i18nextInstance, {
        loadResources
    });

    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });
};
```

!!!warning
The empty `resources` object is required. Without a `resources` option, `i18next` defers its initialization to a timer and `react-i18next` suspends the components rendering the instance until it fires. `registerInstance` throws when a lazy instance is initialized without it.
!!!

An instance can be hybrid: initialize it with the static resources of one language and provide a `loadResources` function for the others. The plugin only loads a language the instance doesn't hold. A module can also keep static resources while the other modules lazy-load theirs, the plugin handles both.

For a [remote module](../module-federation/setup-i18next.md), each dynamic import becomes a chunk of the remote, served by the remote through Module Federation like any other chunk of that module.

## Apply the preferred language before the first render

The [Setup i18next](../integrations/setup-i18next.md#integrate-a-backend-language-setting) guide switches to the user preferred language from a deferred registration. With lazy resources, that switch downloads the resources of the preferred language, and the download can fail. `changeLanguage` then rejects with an [I18nextResourcesLoadError](../reference/i18next/i18nextPlugin.md#handle-a-failed-resources-load) and the language is left unchanged. The rejection reaches the `onError` callback of [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) as the `cause` of a `ModuleRegistrationError`:

```tsx !#13-20,26-28 host/src/App.tsx
import { AppRouter, useProtectedDataQueries, useIsBootstrapping, useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "@squide/firefly";
import { isI18nextResourcesLoadError } from "@squide/i18next";
import { useCallback, useMemo } from "react";
import { Outlet } from "react-router";
import { isApiError, type DeferredRegistrationData } from "@sample/shared";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries(
        [getSessionQuery],
        error => isApiError(error) && error.status === 401
    );

    const handleDeferredRegistrationErrors = useCallback<DeferredRegistrationsErrorCallback>(errors => {
        errors.forEach(x => {
            if (isI18nextResourcesLoadError(x.cause)) {
                // The application still renders with the previous language, an error page is optional.
                console.error(`The "${x.cause.language}" resources of the "${x.cause.key}" instance failed to load.`, x.cause);
            }
        });
    }, []);

    const data: DeferredRegistrationData = useMemo(() => ({
        session
    }), [session]);

    useDeferredRegistrations(data, {
        onError: handleDeferredRegistrationErrors
    });

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```

A failed load never blocks the rendering of the application: the affected instance renders what `i18next` renders for a missing language, which is the resource key or the `fallbackLng` value when one is configured. Every failure is also logged and dispatched on the event bus as an `I18nextResourcesLoadFailedEvent`, refer to the [reference](../reference/i18next/i18nextPlugin.md#handle-a-failed-resources-load) for the details.

## Storybook

The Storybook decorator renders a story as soon as the modules are registered, it doesn't wait for the resources to be loaded. Await the `changeLanguage` method of the plugin from a Storybook loader, as described in the [initializeFireflyForStorybook](../reference/storybook/initializeFireflyForStorybook.md#initialize-with-i18next) reference.

## Try it :rocket:

Start the application in a development environment using the `dev` script. Open the network tab of the [DevTools](https://developer.chrome.com/docs/devtools/): a single resources chunk per module is downloaded, for the `en-US` language. Then append `?language=fr-CA` to the URL: the `fr-CA` chunks are downloaded instead, and the page renders the french resources.

### Troubleshoot issues

If you are experiencing issues with this recipe:

- Open the DevTools console. You'll find a log entry for each language loaded into an instance, and another once every instance holds the current language:
    - `[squide] Loaded the "fr-CA" resources of the i18next instance with key "local-module".`
    - `[squide] Plugins are ready.`
- Block the URL of a resources chunk in the network tab and reload: the application still renders and the console shows the failed load:
    - `[squide] An error occurred while loading the "fr-CA" resources of the i18next instance with key "local-module":`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
