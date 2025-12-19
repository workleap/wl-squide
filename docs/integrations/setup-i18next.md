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
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
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
                        ])}
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
The examples in this guide load all the resources from single localized resources files. For a real Workleap application, you probably want to spread the resources into multiple files and load the files with a i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends).
!!!

### Localize a page resource

Next, follow the [localize resources](../essentials/localize-resources.md) essential page to use the newly created localized resource.

## Try it :rocket:

Start the application in a development environment using the `dev` script. Navigate to `/page`, the page content and the navigation item should render the english (`en-US`) resources. Then append `?language=fr-CA` to the URL. The page content and the navigation item should now render the french (`fr-CA`) resources.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each `i18next` instance that is being registered and another log everytime the language is changed:
    - `[squide] Registered a new i18next instance with key "local-module".`
    - `[squide] The language has been changed to "fr-CA".`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
