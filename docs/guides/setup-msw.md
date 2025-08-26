---
order: 1000
---

# Setup Mock Service Worker

To speed up frontend development and encourage an [API first](https://swagger.io/resources/articles/adopting-an-api-first-approach/) approach, Squide has built-in support for [Mock Service Worker](https://mswjs.io/) (MSW). MSW offers an API to host fake endpoints directly in the browser. This means that unlike alternative solutions, it doesn't require running an additional process.

## Setup the host application

First, open a terminal at the root of the host application and install the [msw](https://www.npmjs.com/package/msw) package:

```bash
pnpm add -D cross-env
pnpm add msw
```

Then [initialize](https://mswjs.io/docs/cli/init/) MSW by executing the following command:

```bash
pnpx msw init ./public
```

### Add an environment variable

Then, update the `dev` PNPM script to define with [cross-env](https://www.npmjs.com/package/cross-env) an `USE_MSW` environment variable that will [conditionally include MSW code](https://mswjs.io/docs/integrations/browser#conditionally-enable-mocking) into the application bundles:

```json host/package.json
{
    "scripts": {
        "dev": "cross-env USE_MSW=true rsbuild dev --config ./rsbuild.dev.ts"
    }
}
```

Then, update the development [Rsbuild](https://rsbuild.dev/) configuration file to include the `USE_MSW` environment variable into the application bundles:

```js !#5 host/rsbuild.dev.ts
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

### Start the service

With the newly added `USE_MSW` environment variable, the host application bootstrapping code can now be updated to conditionally start MSW when all the request handlers has been registered.

First, define a function to start MSW:

```ts host/mocks/browser.ts
import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export function startMsw(moduleRequestHandlers: RequestHandler[]) {
    const worker = setupWorker(...moduleRequestHandlers);

    return worker.start({
        onUnhandledRequest: "bypass"
    });
}
```

Then, update the bootstrapping code to [start MSW](https://mswjs.io/docs/integrations/browser#setup) when it's enabled:

```tsx !#7,9-13 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly(runtime, {
    useMsw: !!process.env.USE_MSW,
    localModules: [registerHost],
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../mocks/browser.ts")).startMsw(runtime.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Setup a module

First, open a terminal at the root of the local module and install the [msw](https://www.npmjs.com/package/msw) package:

```bash
pnpm add msw
```

Then, define a [request handler](https://mswjs.io/docs/concepts/request-handler/):

```ts local-module/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

export const requestHandlers: HttpHandler[] = [
    http.get("/api/character/1", async () => {
        return HttpResponse.json([{
            "id": 1,
            "name": "Rick Sanchez",
            "status": "Alive"
        }]);
    })
];
```

Finally, register the request handler with the [FireflyRuntime](../reference/runtime/runtime-class.md) instance:

```ts !#4,7,9 relocalmote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly"; 

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the application bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
}
```

## Try it :rocket:

Update a page component code to fetch the `/api/character/1` fake API endpoint, then start the application in development mode using the `dev` script. You should notice that the data has been fetched from the request handler.

> In Chrome [devtools](https://developer.chrome.com/docs/devtools/), the status code for a successful network call that has been handled by an MSW request handler will be `200 OK (from service worker)`.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each request handlers registration that occurs and error messages if something went wrong:
    - `[squide] The following MSW request handlers has been registered: [...]`
    - `[squide] MSW is ready.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
