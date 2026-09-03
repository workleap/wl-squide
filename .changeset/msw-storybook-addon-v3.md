---
"@squide/firefly-storybook": major
---

Added `msw-storybook-addon` as an optional peer dependency, requiring `^3.0.0`. This requirement already existed in practice — a runtime created by `initializeFireflyForStorybook` enables MSW by default, and `runtime.requestHandlers` is meant to be fed to the addon through `parameters.msw` — but it was only stated in the documentation.

It is declared as optional because the addon belongs to the Storybook application, which is not necessarily the package that depends on `@squide/firefly-storybook`. Optional keeps the half that matters: applications that install both in the same package get a version-mismatch warning while still on v2, instead of discovering the problem as a blank Storybook, and applications that keep them in separate packages are not warned about an addon they correctly installed elsewhere.

This is a breaking change for consuming applications, which must upgrade the addon to v3 and update their `.storybook/preview.tsx`.

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
