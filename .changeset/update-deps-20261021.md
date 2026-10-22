---
"@squide/firefly": major
"@squide/msw": major
"@squide/firefly-storybook": major
"@squide/firefly-module-federation": major
"@squide/firefly-rsbuild-configs": major
"@squide/core": patch
"@squide/env-vars": patch
"@squide/i18next": patch
"@squide/launch-darkly": patch
"@squide/react-router": patch
"@squide/firefly-webpack-configs": patch
---

Updated dependencies to their latest versions.

- `@squide/firefly`, `@squide/msw`, `@squide/firefly-storybook` and `@squide/firefly-module-federation` now require `msw` `^3.0.3` as a peer dependency. With MSW 3, the `worker.start()` option `onUnhandledRequest` is renamed to `onUnhandledFrame`. Since `msw-storybook-addon` 2.x only supports MSW 2, `@squide/firefly-storybook` now requires `msw-storybook-addon` `^3.0.3`:

```ts
await worker.start({
    onUnhandledFrame: "bypass"
});
```

- `@squide/firefly-rsbuild-configs` now uses `@workleap/rsbuild-configs` 5.x. When customizing HTTPS with `https: (defaults) => ({ ... })`, the `selfsignedOptions.days` option has been removed; use `selfsignedOptions.notAfterDate` instead. Self-signed certificates are now cached in `node_modules/.cache/basic-ssl`, so a new certificate is generated (and must be trusted again) on first run after upgrading.
