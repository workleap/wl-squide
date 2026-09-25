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

This strategy is implemented with a [deferred registration](../essentials/register-deferred-nav-items.md): the host module returns a deferred registration function that awaits the [changeLanguage](../reference/i18next/i18nextPlugin.md#change-the-current-language) method of the plugin with the preferred language carried by the session. Squide awaits the deferred registration functions before the modules become ready, therefore the switch, including the load of the [lazy](#lazy-load-the-resources) resources, completes before the first protected page renders:

```tsx !#8,10-15 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import type { DeferredRegistrationData } from "@sample/shared";

export const registerHost: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Register the routes, the navigation items and the i18next instance of the host application...

    const i18nextPlugin = getI18nextPlugin(runtime);

    // When the session has been retrieved, update the language to match the user preferred language.
    // On an update run with an unchanged language, the call resolves without notifying anyone.
    return async (deferredRuntime, data) => {
        await i18nextPlugin.changeLanguage(data.session?.user.preferredLanguage ?? i18nextPlugin.currentLanguage);
    };
};
```

Then, forward the session to the deferred registrations with the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook. When the resources of the preferred language fail to load, `changeLanguage` rejects with an [I18nextResourcesLoadError](../reference/i18next/i18nextPlugin.md#handle-a-failed-resources-load) and the language is left unchanged. The rejection reaches the `onError` callback of the hook as the `cause` of a `ModuleRegistrationError`:

```tsx !#9-31,33-40,42-44,46-48
import { AppRouter, useProtectedDataQueries, useIsBootstrapping, useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "@squide/firefly";
import { isI18nextResourcesLoadError } from "@squide/i18next";
import { useCallback, useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, isApiError, type DeferredRegistrationData, type Session } from "@sample/shared";

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
                        preferredLanguage: data.preferredLanguage
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

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
export type LanguageKey = "en-US" | "fr-CA";

export interface User {
    name: string;
    preferredLanguage: LanguageKey;
}

export interface Session {
    user: User;
}

export interface DeferredRegistrationData {
    session?: Session;
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

### Lazy-load the resources

With the previous code sample, the resources of every supported language land in the initial chunk. To ship only the active language, initialize the instance with an empty `resources` object and provide a [loadResources](../reference/i18next/i18nextPlugin.md#lazy-load-resources-per-language) function when registering the instance. The plugin loads the resources of the current language right away, and the resources of any other language before switching to it:

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

!!!info
The examples in this guide load all the resources of a language from a single file. For a real Workleap application, group the resources of a language in a single chunk per module and lazy-load them with `loadResources` rather than with an i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends): the plugin fills the instance store before the language is applied, which keeps the runtime semantics of static resources and never suspends the components.
!!!

### Localize a page resource

Next, follow the [localize resources](../essentials/localize-resources.md) essential page to use the newly created localized resource.

## Try it :rocket:

Start the application in a development environment using the `dev` script. Navigate to `/page`, the page content and the navigation item should render the english (`en-US`) resources. Then append `?language=fr-CA` to the URL. The page content and the navigation item should now render the french (`fr-CA`) resources.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each `i18next` instance that is being registered, one for each lazy-loaded language and another log everytime the language is changed:
    - `[squide] Registered a new i18next instance with key "local-module".`
    - `[squide] Loaded the "fr-CA" resources of the i18next instance with key "local-module".`
    - `[squide] The language has been changed to "fr-CA".`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
