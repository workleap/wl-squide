---
order: 10
---

# Deploy

The deployment process for a modular application can vary depending on various factors, including the chosen hosting provider. Therefore, we do not recommend any specific deployment setup.

However, there are a few essential configurations that need to be made regardless of your architectural and deployment choices.

## Add a default redirect

To enable support for direct page hits, add the following redirect rule to your host application's hosting provider:

```
/* /index.html 200
```

For [Netlify](https://www.netlify.com/), it can either be with a `netlify.toml` file at the root of project:

```netlify.toml
[[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
```

Or by adding a `_redirects` file into the Netlify publish directory:

```_redirects
/* /index.html 200
```

## Set the remote URL

If your modular applications includes [remote modules](../reference/registration/registerRemoteModules.md), configure the remote modules production URL:

```js
// @ts-check

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes: RemoteDefinition[] = [
    {
        name: "remote1",
        url: process.env.isNetlify ? "https://squide-remote-module.netlify.app" : "http://localhost:8081"
    }
];
```

## Update the runtime mode

Don't forget to change the [FireflyRuntime mode](../reference/runtime/runtime-class.md#change-the-runtime-mode) to `production`:

```ts
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    mode: process.env.isNetlify ? "production" : "development"
});
```

## Remove the console logger

Remove the [ConsoleLogger](../reference/logging/ConsoleLogger.md) from the production build:

```ts
import { ConsoleLogger, FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    loggers: process.env.isNetlify ? [] : [x => new ConsoleLogger(x)]
});
```
