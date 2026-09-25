---
order: 480
label: Setup i18next
---

# Setup i18next

[react-i18next](https://react.i18next.com/) is an internationalization library that helps applications manage translations, language detection, and localization logic. It provides a flexible API for loading translation files, formatting text, handling plurals, and switching languages at runtime.

## Install the packages

To set up `i18next`, first, open a terminal at the root of the host application and install the following packages:

 ```bash
pnpm add @squide/i18next i18next i18next-browser-languagedetector react-i18next
```

## Register the plugin

Then, refer to the [create host application](../introduction/create-host.md) guide as a starting point and update the host application boostrapping code to register an instance of the [i18nextplugin](../reference/i18next/i18nextPlugin.md) with the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance:

```tsx !#9-20
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { i18nextPlugin } from "@squide/i18next";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost],
    plugins: [x => {
        // In this example:
        // - The supported languages are "en-US" and "fr-CA"
        // - The fallback language is "en-US"
        // - The URL querystring parameter to detect the current language is "language"
        const i18nextPlugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");

        // Always detect the user language early on.
        i18nextPlugin.detectUserLanguage();

        return i18nextPlugin;
    }]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

==- :icon-light-bulb: User language detection order
By calling the [detectUserLanguage](../reference/i18next/i18nextPlugin.md#detect-the-user-language) method of the plugin instance, the user language is automatically detected. Applications should always detect the user language at bootstrapping, even if the current language is expected to be overriden by a preferred language setting once the user information has been loaded.

The language detection happens in the following order:

1. Deduce from a `?language` querystring parameter.
2. Deduce from the user navigator language settings.
3. Use the fallback language, which is `en-US` in this example.
===

## Integrate a backend language setting

For many applications, the displayed language is expected to be derived from an application specific user "preferred language" setting stored in a remote database. Therefore, the frontend remains unaware of this setting value until the user session is loaded.

Hence, the strategy to select the displayed language should be as follow:

1. Use the language detected at bootstrapping for anonymous users (with the [detectUserLanguage](../reference/i18next/i18nextPlugin.md#detect-the-user-language) method previously called).
2. Upon user authentication and session loading, if a "preferred language" setting is available from the session data, update the displayed language to reflect this preference.

This strategy can be implemented with the help of the [useChangeLanguage](../reference/i18next/useChangeLanguage.md) and [useProtectedDataQueries](../reference/global-data-fetching/useProtectedDataQueries.md) hooks:

```tsx !#7-28,30,36
import { AppRouter, useProtectedDataQueries, useIsBootstrapping, useChangeLanguage } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, isApiError, type Session } from "@sample/shared";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        name: data.username,
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    const changeLanguage = useChangeLanguage();

    useEffect(() => {
        if (session) {
            // When the session has been retrieved, update the language to match the user
            // preferred language.
            changeLanguage(session.user.preferredLanguage);
        }
    }, [session, changeLanguage]);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ], routerProps)}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

==- :icon-file-code: @sample/shared
```ts
export interface User {
    name: string;
}

export interface Session {
    user: User;
}
```

```ts
export class ApiError extends Error {
    readonly #status: number;
    readonly #statusText: string;
    readonly #stack?: string;

    constructor(status: number, statusText: string, innerStack?: string) {
        super(`${status} ${statusText}`);

        this.#status = status;
        this.#statusText = statusText;
        this.#stack = innerStack;
    }

    get status() {
        return this.#status;
    }

    get statusText() {
        return this.#statusText;
    }

    get stack() {
        return this.#stack;
    }
}

export function isApiError(error?: unknown): error is ApiError {
    return error !== undefined && error !== null && error instanceof ApiError;
}
```
===

## Configure a module

### Define a localized resource file

First, create localized resource files for the `en-US` and `fr-CA` locales:

```json !#1-8 ./locales/en-US.json
{
    "navigationItems": {
        "page": "Page - en-US"
    },
    "Page": {
        "bodyText": "Hello from Page!"
    }
}
```

```json !#1-8 ./locales/fr-CA.json
{
    "navigationItems": {
        "page": "Page - fr-CA"
    },
    "Page": {
        "bodyText": "Bonjour depuis la page!"
    }
}
```

### Register an i18next instance

Then, update the host application local module's register function to create and register an i18next instance with the `i18nextPlugin` instance. Due to how the internals of `i18next` works, each module (including the host application) must create its own instance of the third-party library. The `i18nextPlugin` instance will handle synchronizing the language changes across all `i18next` instances:

```tsx !#12-14,16-23,26
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        // Create the instance with the language that has been detected earlier in the bootstrapping code.
        lng: i18nextPlugin.currentLanguage,
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    // Will associate the instance with the "local-module" key.
    i18nextPlugin.registerInstance("local-module", i18nextInstance);

    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });
};
```

!!!info
The examples in this guide load all the resources from single localized resources files. For a real Workleap application, you probably want to spread the resources into multiple files and load the files with a i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends). To download only the resources of the active language, refer to the [lazy-load the resources](#lazy-load-the-resources) section.
!!!

### Localize a page resource

Next, follow the [localize resources](../essentials/localize-resources.md) essential page to use the newly created localized resource.

## Lazy-load the resources

With the setup described so far, the resources of every supported language are bundled with the module and land in its initial chunk. The `i18nextPlugin` can instead load the resources of a language on demand: the language [detected at bootstrapping](#register-the-plugin) when the instance is registered, then any other language before switching to it. The application only downloads the active language, and [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) stays `true` until the resources of the current language are loaded, so a page never renders raw resource keys.

!!!warning
The user [preferred language](#integrate-a-backend-language-setting) is not known at registration. When it differs from the detected language, both languages are downloaded. Read [align the detected language with the preferred language](#align-the-detected-language-with-the-preferred-language) before adopting lazy loading.
!!!

### Register a lazy instance

Initialize the instance with an empty `resources` object and provide a [loadResources](../reference/i18next/i18nextPlugin.md#lazy-load-resources-per-language) function when registering the instance. The function receives a language and resolves to a map of namespace to resource bundle, the same shape as a single language entry of the i18next `resources` option:

```tsx !#7-12,23-25,28-30
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

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
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

An instance can be hybrid: initialize it with the static resources of one language and provide a `loadResources` function for the others. The plugin only loads a language the instance doesn't hold. Modules with static resources and modules with lazy resources can coexist. For a [remote module](../module-federation/setup-i18next.md), each dynamic import becomes a chunk of the remote, served through Module Federation like any other chunk of that module.

### Apply the preferred language

The effect shown in the [backend language setting](#integrate-a-backend-language-setting) section runs after the first render. With lazy resources, the page would render in the detected language while the resources of the preferred language download, then switch. Return a [deferred registration](../essentials/register-deferred-nav-items.md) function instead: Squide awaits the deferred registration functions before the modules become ready, therefore the switch, including the download, completes before the first protected page renders:

```tsx !#8,10-14 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import type { DeferredRegistrationData } from "@sample/shared";

export const registerHost: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Register the routes, the navigation items and the i18next instance of the host application...

    const i18nextPlugin = getI18nextPlugin(runtime);

    // On an update run with an unchanged language, the call resolves without notifying anyone.
    return async (deferredRuntime, data) => {
        await i18nextPlugin.changeLanguage(data.session?.user.preferredLanguage ?? i18nextPlugin.currentLanguage);
    };
};
```

Then, forward the session to the deferred registrations with the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook. When the resources of the preferred language fail to download, `changeLanguage` rejects with an [I18nextResourcesLoadError](../reference/i18next/i18nextPlugin.md#handle-a-failed-resources-load) and the language is left unchanged. The rejection reaches the `onError` callback of the hook as the `cause` of a `ModuleRegistrationError`:

```tsx !#13-20,22-28 host/src/App.tsx
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

==- :icon-file-code: @sample/shared
```ts
export interface DeferredRegistrationData {
    session?: Session;
}
```
===

A failed download never blocks the rendering of the application: the affected instance renders what `i18next` renders for a missing language, which is the resource key or the `fallbackLng` value when one is configured. Every failure is also logged and dispatched on the event bus as an `I18nextResourcesLoadFailedEvent`, refer to the [reference](../reference/i18next/i18nextPlugin.md#handle-a-failed-resources-load) for the details.

### Align the detected language with the preferred language

The modules register before any global data is fetched, therefore the plugin loads the resources of the language [detected at bootstrapping](#register-the-plugin) when an instance is registered: the querystring parameter, the navigator language or the fallback language. The login page and every public page render from these resources. The user preferred language is only known once the session is loaded, and the deferred registration then downloads its resources before the first protected page renders.

When the detected language differs from the preferred language, **both languages are downloaded**: the detected one at registration, the preferred one during the deferred registration. That is what bundling every language downloads today, so lazy loading is never worse than static resources, but the saving only materializes when both languages match. They match when the browser language is the preferred language, or when the URL carries the `?language` querystring parameter.

To make them match for every returning user, persist the preferred language in the local storage once the session is loaded, and detect it before the navigator language by adding the `localStorage` source to the plugin [detection order](../reference/i18next/i18nextPlugin.md#add-an-additional-detection-source):

```ts !#5-9 host/src/index.tsx
const runtime = initializeFirefly({
    localModules: [registerHost],
    plugins: [x => {
        const i18nextPlugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language", {
            detection: {
                // The querystring still wins, then the persisted preferred language, then the navigator language.
                order: ["querystring", "localStorage", "navigator"],
                lookupLocalStorage: "preferred-language"
            }
        });

        i18nextPlugin.detectUserLanguage();

        return i18nextPlugin;
    }]
});
```

```tsx !#7-8 host/src/register.tsx
export const registerHost: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    return async (deferredRuntime, data) => {
        const preferredLanguage = data.session?.user.preferredLanguage ?? i18nextPlugin.currentLanguage;

        // Persisted for the next visit, so the detection loads the preferred language right away.
        localStorage.setItem("preferred-language", preferredLanguage);

        await i18nextPlugin.changeLanguage(preferredLanguage);
    };
};
```

Keep the persisted value after a logout: the next session on the same browser is most likely the same user, and the login page then renders in their language. A different user of the same browser sees the previous user's language until their own session is loaded, at which point the switch above applies and updates the persisted value.

### Storybook

The Storybook decorator renders a story as soon as the modules are registered, it doesn't wait for the resources to be loaded. Await the `changeLanguage` method of the plugin from a Storybook loader, as described in the [initializeFireflyForStorybook](../reference/storybook/initializeFireflyForStorybook.md#initialize-with-i18next) reference.

## Try it :rocket:

Start the application in a development environment using the `dev` script. Navigate to `/page`, the page content and the navigation item should render the english (`en-US`) resources. Then append `?language=fr-CA` to the URL. The page content and the navigation item should now render the french (`fr-CA`) resources.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each `i18next` instance that is being registered and another log everytime the language is changed:
    - `[squide] Registered a new i18next instance with key "local-module".`
    - `[squide] The language has been changed to "fr-CA".`
- When the resources are [lazy-loaded](#lazy-load-the-resources), you'll also find a log entry for each language loaded into an instance, and an error entry for a failed load:
    - `[squide] Loaded the "fr-CA" resources of the i18next instance with key "local-module".`
    - `[squide] An error occurred while loading the "fr-CA" resources of the i18next instance with key "local-module":`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
