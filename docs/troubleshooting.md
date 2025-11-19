---
order: 50
icon: question
---

# Troubleshooting

## Set the runtime mode to development

In an effort to optimize the development experience, Squide can be bootstrapped in `development` or `production` mode. To troubleshoot a persistent issue, make sure that the runtime mode is development:

```ts
import { initializeFirefly, type LogLevel } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: "development"
});
```

## Troubleshoot a production issue

Frontend production issues are best troubleshoot using [LogRocket](https://logrocket.com/). To output log entries to LogRocket's session replay, install the `@workleap/logrocket` package and provide an instance of `LogRocket` to the `initializeFirefly` function:

For troubleshooting frontend production issues, we recommend using [LogRocket](https://logrocket.com/). To capture log entries in LogRocket session replays, install the `@workleap/logrocket` package and pass an instance of [LogRocketLogger](https://workleap.github.io/wl-telemetry/logrocket/reference/logrocketlogger/) to the `initializeFirefly` function:

```ts
import { initializeFirefly, type LogLevel } from "@squide/firefly";
import { LogRocketLogger } from "@workleap/logrocket";

const runtime = initializeFirefly({
    loggers: [new LogRocketLogger()]
});
```

## React context values are undefined

If your application utilize [remote modules](./module-federation/create-remote-module.md) and you are encountering `undefined` values when providing a React context from the host application and consuming the context in modules, it is likely due to two possible reasons: either you have two instances of React, or you have multiple instances of that React context.

To resolve this issue:

1. Ensure that the `react` and `react-dom` dependencies are shared as [singletons](https://module-federation.io/configure/shared.html#singleton) between the host application and the remote modules. A React context value cannot be shared between different parts of an application that use different instances of React.
2. Confirm that the shared React context resides in a library shared as a [singleton](https://module-federation.io/configure/shared.html#singleton).
3. If you are using [eager](https://module-federation.io/configure/shared.html#eager) shared dependencies, ensure that ONLY the host application configures these dependencies as `eager`.

If the issue persists, update your host application and remote module's webpack build configuration with the `optimize: false` option. Afterward, build the bundles and serve them. Open a web browser, access the DevTools, switch to the Network tab (ensure that JS files are listed), navigate to the application's homepage, and inspect the downloaded bundle files. The problematic React context definition should appear only once; otherwise, you may have multiple instances of the React context.

For additional information on shared dependency versioning, please refer to the [add a shared dependency guide](./module-federation/add-a-shared-dependency.md).

## Console logs

To faciliate the debugging of a Squide application bootstrapping flow, a lot of information is logged into the console. We recommend using these logs if you suspect that **something** is **wrong** with the **bootstrapping** process of your **application**.

### Local modules

- `[squide] Found 4 local modules to register.`
- `[squide] 1/4 Registering local module.`
- `[squide] 1/4 Local module registration completed.`

### Routes registration

- `[squide] The following route registration is pending until "managed-routes-placeholder" is registered.`
- `[squide] The following route has been registered as a children of the "managed-routes-placeholder" route.`
- `[squide] The following route has been registered.`

### Navigation items registration

- `[squide] The following static navigation item registration is pending until the "officevibe" section of the "root" menu is registered`
- `[squide] The following static navigation item has been registered to the "/federated-tabs" menu for a total of 2 static items.`
- `[squide] The following deferred navigation item has been registered to the "root" menu for a total of 4 deferred items.`

### Mock Service Worker registration

- `[squide] The following MSW request handlers has been registered: [...]`
- `[squide] MSW is ready.`

### AppRouter logs

- `[squide] AppRouter state updated: {...}`
- `[squide] The following action has been dispatched to the AppRouter reducer: {...}`

### i18n logs

- `[squide] Registered a new i18next instance with key "shell": {...}`
- `[squide] The language has been changed to "fr-CA".`
- `[squide] Detected "fr-CA" as user language.`

### env-vars registration

- `[squide] The following environment variables has been registered: {...}`

### Modules registration

#### Remote modules

- `[squide] Found 1 remote module to register.`
- `[squide] 1/1 Loading module "register" of remote "remote1".`
- `[squide] 1/1 Registering module "register" of remote "remote1".`
- `[squide] 1/1 The registration of the remote "remote1" is completed.`

#### Deferred registrations

- `[squide] 1/1 Registering the deferred registrations for module "register" of remote "remote1".`
- `[squide] 1/1 Registered the deferred registrations for module "register" of remote "remote1".`
- `[squide] 3/3 Updating local module deferred registration.`
- `[squide] 3/3 Updated local module deferred registration.`

#### Module federation logs

- `[squide] Module Federation shared scope is available: {...}`

### Ready

- `[squide] Modules are ready.`

