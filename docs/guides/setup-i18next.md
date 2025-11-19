---
order: 800
---

# Setup i18next

Most Workleap's application are either already bilingual or will be in the future. To help feature teams deal with localized resources, Squide provides a native [plugin](../reference/i18next/i18nextPlugin.md) designed to adapt the [i18next](https://www.i18next.com/) library for modular applications.

!!!warning
The examples in this guide load all the resources from single localized resources files. For a real Workleap application, you probably want to spread the resources into multiple files and load the files with a i18next [backend plugin](https://www.i18next.com/overview/plugins-and-utils#backends).
!!!

## Setup the host application

Let's start by configuring the host application. First, open a terminal at the root of the host application and install the following packages:

```bash
pnpm add @squide/i18next i18next i18next-browser-languagedetector react-i18next
```

### Register the i18nextPlugin

Then, update the host application boostrapping code to register an instance of the [i18nextplugin](../reference/i18next/i18nextPlugin.md) with the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance:

```tsx !#10-19 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { i18nextPlugin } from "@squide/i18next";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";
import { registerShell } from "@sample/shell";

const runtime = initializeFirefly(runtime, {
    localModules: [registerShell, registerHost],
    plugins: [x => {
        // In this example:
        // - The supported languages are "en-US" and "fr-CA"
        // - The fallback language is "en-US"
        // - The URL querystring parameter to detect the current language is "language"
        const i18nextPlugin = new i18nextPlugin(["en-US", "fr-CA"], "en-US", "language", undefined, x);

        // Always detect the user language early on.
        i18nextPlugin.detectUserLanguage();
    }]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

In the previous code sample, upon creating an `i18nextPlugin` instance, the user language is automatically detected using the `plugin.detectUserLanguage` function. Applications **should always** detect the user language at bootstrapping, even if the current language is expected to be overriden by a preferred language setting once the user session has been loaded.

### Define the localized resources

Next, create the localized resource files for the `en-US` and `fr-CA` locales:

```json !#2-4 host/src/locales/en-US.json
{
    "HomePage": {
        "bodyText": "Hello from the Home page!"
    }
}
```

```json !#2-4 host/src/locales/fr-CA.json
{
    "HomePage": {
        "bodyText": "Bonjour depuis la page d'accueil!"
    }
}
```

### Register an i18next instance

Then, update the host application local module's register function to create and register an `i18next` instance with the retrieved `i18nextPlugin` instance. Due to how the internals of `i18next` works, each module (including the host application) must create its own instance of the third-party library. `i18nextPlugin` will handle synchronizing the language changes across all `i18next` instances:

```tsx !#12-14,16-23,26 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import { HomePage } from "./HomePage.tsx";
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

    // Will associate the instance with the "host" key.
    i18nextPlugin.registerInstance("host", i18nextInstance);

    // --------

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
```

In the previous code sample, notice that the `i18next` instance has been initialized with the current language of the `i18nextPlugin` instance by providing the `lng` option. If the user language has been detected during bootstrapping, the `i18next` instance will then be initialized with the user language which has been deduced from either a `?language` querystring parameter or the user navigator language settings. Otherwise, the application instance will be initialized with the fallback language, which is `en-US` for this guide.

### Localize the home page resources

Then, update the `HomePage` component to use the newly created localized resource:

```tsx !#6-7,10 host/src/HomePage.tsx
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

export function HomePage() {
    // Must be the same instance key that has been used to register the i18next instance previously in the "register" function.
    const i18nextInstance = useI18nextInstance("host");
    const { t } = useTranslation("HomePage", { i18n: i18nextInstance });

    return (
        <div>{t("bodyText")}</div>
    );
}
```

## Setup a module

First, open a terminal at the root of the local module application and install the following packages:

```bash
pnpm add @squide/i18next i18next i18next-browser-languagedetector react-i18next
```

### Define the localized resources

Then, create the localized resource files for the `en-US` and `fr-CA` locales:

```json !#2-7 local-module/src/locales/en-US.json
{
    "navigationItems": {
        "page": "Local Module/Page - en-US"
    },
    "Page": {
        "bodyText": "Hello from Local Module/Page!"
    }
}
```

```json !#2-7 local-module/src/locales/fr-CA.json
{
    "navigationItems": {
        "page": "Local Module/Page - fr-CA"
    },
    "Page": {
        "bodyText": "Bonjour depuis Local Module/Page!"
    }
}
```

Notice that this time, a standard `navigationItems` namespace has been added to the resource files. The resources in the `navigationItems` namespace will be used later on to localize the navigation items labels.

### Register an i18next instance

Then, update the local module's register function to create and register an instance of `i18next` with the `i18nextPlugin` plugin instance. Similarly to the [host application](#register-an-i18next-instance), due to how the internals of `i18next` works, this local module requires to register its own instance of the third-party library:

```tsx !#10,12-14,16-23,26 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        // Create the instance with the language that has been detected earlier in the host application bootstrapping code.
        lng: i18nextPlugin.currentLanguage,
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    // Will associate the instance with the "local-module" key.
    i18nextPlugin.registerInstance("local-module", i18nextInstance);

    // --------

    runtime.registerRoute({
        path: "/local-module/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $label: "Local Module/Page",
        to: "/local-module/page"
    });
}
```

### Localize the navigation item labels

Then, localize the navigation items labels using the [I18nextNavigationItemLabel](../reference/i18next/I18nextNavigationItemLabel.md) component. Since this example resources are in the `navigationItems` namespace, there's no need to specify a `namespace` property on the components as it will be inferred:

```tsx !#37 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin, I18nextNavigationItemLabel } from "@squide/i18next";
import { Page } from "./Page.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n
        .createInstance()
        .use(initReactI18next);

    i18nextInstance.init({
        // Create the instance with the language that has been detected earlier in the host application bootstrapping code.
        lng: i18nextPlugin.currentLanguage,
        load: "currentOnly",
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    // Will associate the instance with the "local-module" key.
    i18nextPlugin.registerInstance("local-module", i18nextInstance);

    // --------

    runtime.registerRoute({
        path: "/local-module/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="page" />,
        to: "/local-module/page"
    });
}
```

### Localize the page resources

Then, update the `Page` component to use the newly created localized resource:

```tsx !#6,7,10 local-module/src/Page.tsx
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

export function Page() {
    // Must be the same instance key that has been used to register the i18next instance previously in the "register" function.
    const i18nextInstance = useI18nextInstance("local-module");
    const { t } = useTranslation("Page", { i18n: useI18nextInstance });

    return (
        <div>{t("bodyText")}</div>
    );
}
```

## Integrate a backend language setting

For many applications, the displayed language is expected to be derived from an application specific user "preferred language" setting stored in a remote database. Therefore, the frontend remains unaware of this setting value until the user session is loaded.

Hence, the strategy to select the displayed language should be as follow:

1. Use the language detected at bootstrapping for anonymous users (with the [detectUserLanguage](../reference/i18next/i18nextPlugin.md#detect-the-user-language) function).
2. Upon user authentication and session loading, if a "preferred language" setting is available from the session data, update the displayed language to reflect this preference.

This strategy can be implemented with the help of the [useChangeLanguage](../reference/i18next/useChangeLanguage.md) and [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hooks:

```tsx !#7-28,30,36 host/src/App.tsx
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

!!!info
The previous code sample assumes that your `@sample/shared` project includes the primitives created in the [Add authentication](./add-authentication.md) guide as well as the session Mock Server Worker request handlers.
!!!

## Use the Trans component

The [Trans](https://react.i18next.com/latest/trans-component) component is useful for scenarios involving interpolation to render a localized resources. To use the `Trans` component with Squide, pair it with an `i18next` instance retrieved from [useI18nextInstance](../reference/i18next/useI18nextInstance.md) hook:

```tsx !#5,9,11
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

The `Trans` component can also be used without the `t` function by including a namespace to the `i18nKey` property value:

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

## Try it :rocket:

Start the application in a development environment using the `dev` script. The homepage and the navigation items should render the english (`en-US`) resources. Then append `?language=fr-CA` to the URL. The homepage and the navigation items should now render the french (`fr-CA`) resources.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each `i18next` instance that is being registered and another log everytime the language is changed:
    - `[squide] Registered a new i18next instance with key "local-module".`
    - `[squide] The language has been changed to "fr-CA".`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
