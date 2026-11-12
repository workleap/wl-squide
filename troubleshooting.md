# Troubleshooting

## Set the runtime mode to development

In an effort to optimize the development experience, Squide can be bootstrapped in `development` or `production` mode. To troubleshoot a persistent issue, make sure that the runtime mode is development:

```ts !#4
import { initializeFirefly, type LogLevel } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: "development"
});
```

## Troubleshoot a production issue

Frontend production issues are best troubleshoot using [LogRocket](https://logrocket.com/). To output log entries to LogRocket's session replay, install either the [@workleap/telemetry](https://www.npmjs.com/package/@workleap/telemetry) or [@workleap/logrocket](https://www.npmjs.com/package/@workleap/logrocket) package and provide an instance of `LogRocket` to the `initializeFirefly` function:

For troubleshooting frontend production issues, we recommend using [LogRocket](https://logrocket.com/). To capture log entries in LogRocket session replays, install the `@workleap/logrocket` package and pass an instance of [LogRocketLogger](https://workleap.github.io/wl-telemetry/reference/logrocketlogger/) to the `initializeFirefly` function:

```ts !#6
import { initializeFirefly } from "@squide/firefly";
import { LogLevel } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry/react"; // or from "@workleap/logrocket/react";

const runtime = initializeFirefly({
    loggers: [new LogRocketLogger({ logLevel: LogLevel.information })]
});
```

## Console logs

To faciliate the debugging of a Squide application bootstrapping flow, a lot of information is logged into the console. We recommend using these logs if you suspect that **something** is **wrong** with the **bootstrapping** process of your **application**.

### Local modules

- `[squide] Found 4 local modules to register.`
- `[squide] 1/4 Registering local module.`
- `[squide] Successfully registered local module.`

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

- `[squide] AppRouter state has been updated to: {...}`
- `[squide] The following action has been dispatched to the AppRouter reducer: {...}`

### i18n logs

- `[squide] Registered a new i18next instance with key "shell": {...}`
- `[squide] The language has been changed to "fr-CA".`
- `[squide] Detected "fr-CA" as user language.`

### env-vars registration

- `[squide] The following environment variables has been registered: {...}`

### Deferred registrations

- `[squide] 3/3 Updating local module deferred registration.`
- `[squide] 3/3 Updated local module deferred registration.`

### Ready

- `[squide] Modules are ready.`
