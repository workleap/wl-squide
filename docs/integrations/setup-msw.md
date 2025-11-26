---
order: 500
label: Setup MSW
---

# Setup MSW

Squide includes built-in support for [Mock Service Worker](https://mswjs.io/) (MSW) to speed up frontend development and promote an [API first](https://swagger.io/resources/articles/adopting-an-api-first-approach/) approach. Modules can dynamically register their own mock request handlers, and Squide composes them into a unified set.

## Configure the host application

### Initialize MSW

First, [initialize](https://mswjs.io/docs/cli/init/) MSW by executing the following command at the root of the host application:

```bash
pnpx msw init ./public
```

### Create a start function

Then, create a function to start MSW with the modules request handlers:

```ts !#4-10
import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export async function startMsw(moduleRequestHandlers: RequestHandler[]) {
    const worker = setupWorker(...moduleRequestHandlers);

    await worker.start({
        onUnhandledRequest: "bypass"
    });
}
```

### Update the bootstrapping code

Finally, refer to the [create an host application](../introduction/create-host.md) guide as a starting point and update the bootstrapping code to conditionally enable MSW based on an environment variable, and call the `startMsw` function when MSW is active:

```tsx !#7,9-13 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHost } from "./register.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW
    localModules: [registerHost],
    startMsw: async x => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        return (await import("../mocks/browser.ts")).startMsw(x.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

==- :icon-file-code: Define the `USE_MSW` environment variable
First open a terminal at the root of the host application and install the [cross-env](https://www.npmjs.com/package/cross-env) package:

```bash
pnpm add -D cross-env
```

Then, update the `dev` PNPM script to define with `cross-env` an `USE_MSW` environment variable:

```json !#3
{
    "scripts": {
        "dev": "cross-env USE_MSW=true rsbuild dev --config ./rsbuild.dev.ts"
    }
}
```

Finally, update the development [Rsbuild](https://rsbuild.dev/) configuration file to include the `USE_MSW` environment variable into the application bundles:

```js !#5
import { defineDevConfig } from "@squide/firefly-webpack-configs";

export default defineDevConfig({
    environmentVariables: {
        "USE_MSW": process.env.USE_MSW === "true"
    }
});
```

!!!tip
For additional information about the `environmentVariables` predefined option, refer to the [Rsbuild configuration documentation](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/#define-environment-variables).
!!!

!!!tip
Make sure to define the `USE_MSW` environment variable for the build configuration as well.
!!!
===

## Fetch the handler data

Next, follow the [fetch page data](../essentials/fetch-page-data.md) essential page to register an MSW handler and fetch its data from a page using [TanStack Query](https://tanstack.com/query/latest).

## Try it :rocket:

Start the application in development mode using the `dev` script. You should notice that the data has been fetched from the request handler.

> In Chrome [devtools](https://developer.chrome.com/docs/devtools/), the status code for a successful network call that has been handled by an MSW request handler will be `200 OK (from service worker)`.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each request handlers registration that occurs and error messages if something went wrong:
    - `[squide] The following MSW request handlers has been registered: [...]`
    - `[squide] MSW is ready.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.



