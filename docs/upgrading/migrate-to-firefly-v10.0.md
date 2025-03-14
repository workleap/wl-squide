---
order: 940
label: Migrate to firefly v10.0
---

# Migrate to firefly v10.0

This major version introduces support for [React Router](https://reactrouter.com) `v7`. The peer dependencies for `@squide/firefly` and `@squide/react-router` have been updated from `react-router-dom@6*` to `react-router@7*` and the React Router shared dependency name has been renamed from `react-router-dom` to `react-router` for `@squide/firefly-webpack-configs` and `@squide/firefly-rsbuild-configs`.

## Breaking changes

All breaking changes in firefly `v10` are due to the migration to React Router `v7`. For official guidance on upgrading from React Router `v6` to `v7`, refer to the official [migration guide](https://reactrouter.com/upgrading/v6).

### Replace `react-router-dom` with `react-router`

In React Router `v7`, `react-router-dom` is no longer required, as the package structure has been simplified. All necessary imports are now available from either `react-router` or `react-router/dom`.

#### Update dependencies

Open a terminal at the root of the project workspace and use the following commands to remove `react-router-dom` and install `react-router@latest`:

+++ pnpm
```bash
pnpm remove react-router-dom
pnpm add react-router@latest
```
+++ yarn
```bash
yarn remove react-router-dom
yarn add react-router@latest
```
+++ npm
```bash
npm uninstall react-router-dom
npm install react-router@latest
```
+++

#### Update Imports

In your code, update all imports from `react-router-dom` to `react-router`, except for `RouterProvider`, which must be imported from `react-router/dom`.

Before:

```ts
import { Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
```

After:

```ts
import { Outlet, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
```

According to React Router [migration guide](https://reactrouter.com/upgrading/v6#upgrade-to-v7), you can use the following command to update the imports from `react-router-dom` to `react-router`:

```bash
find ./path/to/src \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -type f -exec sed -i '' 's|from "react-router-dom"|from "react-router"|g' {} +
```

### Future flags

By default, all React Router `v7` [future flags](https://reactrouter.com/upgrading/v6#update-to-latest-v6x) are enabled. To minimize breaking changes, React Router recommends activating these flags individually. For most Squide applications, deactivating the following flags should be sufficient:

- [v7_relativeSplatPath](https://reactrouter.com/upgrading/v6#v7_relativesplatpath)
- [v7_startTransition](https://reactrouter.com/upgrading/v6#v7_starttransition)
- [v7_partialHydration](https://reactrouter.com/upgrading/v6#v7_partialhydration)

Before:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ])}
    {...routerProviderProps}
/>
```

After:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ], {
        future: {
            v7_relativeSplatPath: false,
            v7_startTransition: false,
            v7_partialHydration: false
        }
    })}
    {...routerProviderProps}
/>
```

If your application uses React Router’s [Data loading](https://reactrouter.com/start/framework/data-loading) or [Actions](https://reactrouter.com/start/framework/actions) features, it is recommended to carefully evaluate all available [future flags](https://reactrouter.com/upgrading/v6#update-to-latest-v6x) to avoid breaking changes.
