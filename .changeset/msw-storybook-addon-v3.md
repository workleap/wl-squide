---
"@squide/firefly-storybook": major
---

The documented Storybook integration moved to `msw-storybook-addon` v3. Applications must update their `.storybook/preview.tsx` when they upgrade the addon — see the migration below.

This ships as a major release deliberately, to put the migration in front of every consumer, rather than because the package's own code changed. `@squide/firefly-storybook` never imports the addon: the integration is `runtime.requestHandlers` fed through `parameters.msw`, and that contract is identical across both addon majors. `msw-storybook-addon` is therefore declared as an **optional peer** spanning the range actually supported, `^2.0.7 || ^3.0.0`. Applications already on v2 keep working and are not warned about an addon they installed correctly, and it is optional because the addon belongs to the Storybook application, which is not necessarily the package depending on `@squide/firefly-storybook`.

## Why

v3 removed the `initialize` export and moved `mswLoader` to the `msw-storybook-addon/csf3` subpath, where it became a factory. With v3 installed, a `preview.tsx` written against the v2 API throws while the preview module is being evaluated:

```
TypeError: (0, msw_storybook_addon.initialize) is not a function
```

Because a broken `preview.js` aborts the whole preview, this blanks **every** story in the Storybook — including trivial ones that use neither MSW nor Squide — which makes the cause hard to spot.

## Migration

Update `.storybook/preview.tsx`:

```diff
-import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
+import { setupWorker } from "msw/browser";
+import { mswLoader } from "msw-storybook-addon/csf3";

-initializeMsw({
-    onUnhandledRequest: "bypass"
-});
+async function startMswWorker() {
+    const worker = setupWorker();
+
+    await worker.start({
+        onUnhandledRequest: "bypass"
+    });
+
+    return worker;
+}

 const preview: Preview = {
     // ...
-    loaders: [mswLoader]
+    loaders: [mswLoader(startMswWorker)]
 };
```

If the application augments Storybook's `Parameters` interface, the `MswParameters` type has been replaced by `MswParameter`:

```diff
-import type { MswParameters } from "msw-storybook-addon";
+import type { MswParameter } from "msw-storybook-addon/csf3";

 declare module "storybook-react-rsbuild" {
     interface Parameters {
-        msw?: MswParameters["msw"];
+        msw?: MswParameter;
     }
 }
```

The setup function is optional and only needed to preserve `onUnhandledRequest: "bypass"`. Without one, v3 creates and starts the worker itself, warning on unhandled requests while filtering common asset and Storybook-internal URLs. Handler reset semantics and both `parameters.msw` shapes (`[...]` and `{ handlers }`) are unchanged.

## Two traps to watch for

- **`mswLoader` is a factory and must be called.** Leaving the v2 shape `loaders: [mswLoader]` still type checks, but Storybook invokes it with the loader context and treats the returned function as loaded data, so handlers are never applied and mocking **silently** stops with no error.
- **The worker now starts lazily**, inside the first loader, i.e. after story modules are evaluated. v2 started it at preview-module evaluation. Requests issued from the top level of a story file, before the first story renders, are no longer intercepted.

Stay on the CSF 3.0 API shown above. v3's newer `addonMsw()` (CSF Next) does not read `parameters.msw` at all, so adopting it would silently disable mocking in every story that relies on the `msw` parameter — including the `runtime.requestHandlers` pattern this package documents.
