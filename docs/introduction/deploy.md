---
order: 10
---

# Deploy

The deployment process for a modular application can vary depending on various factors, including the chosen hosting provider. Therefore, we do not recommend any specific deployment setup.

However, there are a few essential configurations that need to be made regardless of your architectural and deployment choices.

## Add a default redirect

To enable support for direct page hits, add the following redirect rule to your host application's hosting provider:

```!#1
/* /index.html 200
```

For [Netlify](https://www.netlify.com/), it can either be with a `netlify.toml` file at the root of project:

```!#1-4 netlify.toml
[[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
```

Or by adding a `_redirects` file into the Netlify publish directory:

```!#1 _redirects
/* /index.html 200
```

## Set the remote URL

If your modular applications includes [remote modules](../reference/registration/registerRemoteModules.md), configure the remote modules production URL:

```js !#4
const Remotes = [
    {
        name: "remote1",
        url: process.env.isNetlify ? "https://squide-remote-module.netlify.app" : "http://localhost:8081"
    }
];
```

## Update the runtime mode

Don't forget to change the [runtime mode](../reference/runtime/runtime-class.md#change-the-runtime-mode) to `production`:

```ts !#4
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: process.env.isNetlify ? "production" : "development"
});
```

## Register a LogRocket logger

If your application uses [LogRocket](https://logrocket.com/), register a [LogRocketLogger](https://workleap.github.io/wl-telemetry/logrocket/reference/logrocketlogger/) instance to capture log entries in LogRocket session replays:

```ts !#6
import { initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/logrocket";

const runtime = initializeFirefly({
    loggers: [process.env.isNetlify ? new LogRocketLogger({ logLevel: LogLevel.information }) : new BrowserConsoleLogger()]
});
```
