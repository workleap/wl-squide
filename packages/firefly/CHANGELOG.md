# @squide/firefly

## 12.0.0

### Major Changes

- [#249](https://github.com/workleap/wl-squide/pull/249) [`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f) Thanks [@patricklafrance](https://github.com/patricklafrance)! - - Replace the `bootstrap` function by a new `initializeFirefly` function that takes care of creating the `FireflyRuntime` instance.
  - The `FireflyRuntime` instance now expose a new `BootstrappingStore` instance.

### Patch Changes

- Updated dependencies [[`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f), [`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f)]:
  - @squide/module-federation@6.2.5
  - @squide/core@5.4.5
  - @squide/msw@3.2.5
  - @squide/react-router@7.0.3

## 11.0.0

### Major Changes

- [#247](https://github.com/workleap/wl-squide/pull/247) [`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - The `bootstrap` function is not async anymore.

### Patch Changes

- Updated dependencies [[`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6), [`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6)]:
  - @squide/core@5.4.4
  - @squide/module-federation@6.2.4
  - @squide/msw@3.2.4
  - @squide/react-router@7.0.2

## 10.0.1

### Patch Changes

- [#244](https://github.com/workleap/wl-squide/pull/244) [`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b)]:
  - @squide/module-federation@6.2.3
  - @squide/react-router@7.0.1
  - @squide/core@5.4.3
  - @squide/msw@3.2.3

## 10.0.0

### Major Changes

- [#240](https://github.com/workleap/wl-squide/pull/240) [`9a85d23`](https://github.com/workleap/wl-squide/commit/9a85d23b03584e9d98c28d504f5cef3e62b298db) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies to React Router v7.

### Patch Changes

- Updated dependencies [[`9a85d23`](https://github.com/workleap/wl-squide/commit/9a85d23b03584e9d98c28d504f5cef3e62b298db)]:
  - @squide/react-router@7.0.0

## 9.3.4

### Patch Changes

- Updated dependencies [[`84cf5d0`](https://github.com/workleap/wl-squide/commit/84cf5d071164465cfc8e8e1d15369d781eea8f3f)]:
  - @squide/react-router@6.4.4

## 9.3.3

### Patch Changes

- [#231](https://github.com/workleap/wl-squide/pull/231) [`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Packages now includes source code and sourcemap.

- Updated dependencies [[`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6)]:
  - @squide/module-federation@6.2.2
  - @squide/react-router@6.4.3
  - @squide/core@5.4.2
  - @squide/msw@3.2.2

## 9.3.2

### Patch Changes

- Updated dependencies [[`4eb46d6`](https://github.com/workleap/wl-squide/commit/4eb46d69283804a5809494f7275f9d447022a97d)]:
  - @squide/react-router@6.4.2

## 9.3.1

### Patch Changes

- [#221](https://github.com/workleap/wl-squide/pull/221) [`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix deferred registrations.

- Updated dependencies [[`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925)]:
  - @squide/module-federation@6.2.1
  - @squide/react-router@6.4.1
  - @squide/core@5.4.1
  - @squide/msw@3.2.1

## 9.3.0

### Minor Changes

- [#219](https://github.com/workleap/wl-squide/pull/219) [`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Now dispatching events to enable instrumentation packages for observability platforms.

### Patch Changes

- Updated dependencies [[`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3)]:
  - @squide/module-federation@6.2.0
  - @squide/react-router@6.4.0
  - @squide/core@5.4.0
  - @squide/msw@3.2.0

## 9.2.1

### Patch Changes

- Updated dependencies [[`8ee26fd`](https://github.com/workleap/wl-squide/commit/8ee26fd6ab7126bacf3dec900629fbd045dfd180)]:
  - @squide/react-router@6.3.0
  - @squide/core@5.3.0
  - @squide/module-federation@6.1.1
  - @squide/msw@3.1.1

## 9.2.0

### Minor Changes

- [#204](https://github.com/workleap/wl-squide/pull/204) [`d3f7b9c`](https://github.com/workleap/wl-squide/commit/d3f7b9c6aa80249cd898916f6315ea27c4526812) Thanks [@patricklafrance](https://github.com/patricklafrance)! - The `registerNavigationItem` function now accepts a `sectionId` option to nest the item under a specific navigation section:

  ```ts
  runtime.registerNavigationItem(
    {
      $id: "link",
      $label: "Link",
      to: "/link",
    },
    {
      sectionId: "some-section",
    }
  );
  ```

### Patch Changes

- Updated dependencies [[`d3f7b9c`](https://github.com/workleap/wl-squide/commit/d3f7b9c6aa80249cd898916f6315ea27c4526812)]:
  - @squide/module-federation@6.1.0
  - @squide/react-router@6.2.0
  - @squide/core@5.2.0
  - @squide/msw@3.1.0

## 9.1.1

### Patch Changes

- [#197](https://github.com/workleap/wl-squide/pull/197) [`0c43a84`](https://github.com/workleap/wl-squide/commit/0c43a8441d3079e0206c9c0ebbc11c6401de82ae) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix useProtectedDataQueries isReady result value.

## 9.1.0

### Minor Changes

- [#195](https://github.com/workleap/wl-squide/pull/195) [`98e4839`](https://github.com/workleap/wl-squide/commit/98e48393fda27ebb2974ecc1e2f71b09f4e84953) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Replaced the `ManagedRoutes` placeholder by the `PublicRoutes` and `ProtectedRoutes` placeholder.

  Before:

  ```tsx
  import {
    ManagedRoutes,
    type ModuleRegisterFunction,
    type FireflyRuntime,
  } from "@squide/firefly";
  import { RootLayout } from "./RootLayout.tsx";

  export const registerHost: ModuleRegisterFunction<FireflyRuntime> = (
    runtime
  ) => {
    runtime.registerRoute(
      {
        element: <RootLayout />,
        children: [ManagedRoutes],
      },
      {
        hoist: true,
      }
    );
  };
  ```

  Now:

  ```tsx
  import {
    PublicRoutes,
    ProtectedRoutes,
    type ModuleRegisterFunction,
    type FireflyRuntime,
  } from "@squide/firefly";
  import { RootLayout } from "./RootLayout.tsx";

  export const registerHost: ModuleRegisterFunction<FireflyRuntime> = (
    runtime
  ) => {
    runtime.registerRoute(
      {
        element: <RootLayout />,
        children: [PublicRoutes, ProtectedRoutes],
      },
      {
        hoist: true,
      }
    );
  };
  ```

  Or:

  ```tsx
  import {
    PublicRoutes,
    ProtectedRoutes,
    type ModuleRegisterFunction,
    type FireflyRuntime,
  } from "@squide/firefly";
  import { RootLayout } from "./RootLayout.tsx";

  export const registerHost: ModuleRegisterFunction<FireflyRuntime> = (
    runtime
  ) => {
    runtime.registerRoute(
      {
        element: <RootLayout />,
        children: [
          PublicRoutes,
          {
            element: <AuthenticationBoundary />,
            children: [
              {
                element: <AuthenticatedLayout />,
                children: [ProtectedRoutes],
              },
            ],
          },
        ],
      },
      {
        hoist: true,
      }
    );
  };
  ```

  This release also includes a new `runtime.registerPublicRoute()` function.

### Patch Changes

- Updated dependencies [[`98e4839`](https://github.com/workleap/wl-squide/commit/98e48393fda27ebb2974ecc1e2f71b09f4e84953)]:
  - @squide/react-router@6.1.0
  - @squide/core@5.1.0
  - @squide/module-federation@6.0.2
  - @squide/msw@3.0.2

## 9.0.1

### Patch Changes

- [#191](https://github.com/workleap/wl-squide/pull/191) [`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40) Thanks [@patricklafrance](https://github.com/patricklafrance)! - `useNavigationItems` now accepts `useRuntimeNavigationItems` options.

- Updated dependencies [[`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40)]:
  - @squide/react-router@6.0.1
  - @squide/core@5.0.1
  - @squide/module-federation@6.0.1
  - @squide/msw@3.0.1

## 9.0.0

### Major Changes

- [#182](https://github.com/workleap/wl-squide/pull/182) [`58cf066`](https://github.com/workleap/wl-squide/commit/58cf066e87e23611510c254cca96016bd2bad08a) Thanks [@patricklafrance](https://github.com/patricklafrance)! - ## Firefly v9

  This major version of @squide/firefly introduces TanStack Query as the official library for fetching the global data of a Squide's application and features a complete rewrite of the AppRouter component, which now uses a state machine to manage the application's bootstrapping flow.

  Prior to v9, Squide applications couldn't use TanStack Query to fetch global data, making it challenging for Workleap's applications to keep their global data in sync with the server state. With v9, applications can now leverage custom wrappers of the useQueries hook to fetch and keep their global data up-to-date with the server state. Additionally, the new deferred registrations update feature allows applications to even keep their conditional navigation items in sync with the server state.

  Finally, with v9, Squide's philosophy has evolved. We used to describe Squide as a shell for federated applications. Now, we refer to Squide as a shell for modular applications. After playing with Squide's local module feature for a while, we discovered that Squide offers significant value even for non-federated applications, which triggered this shift in philosophy.

  > For a full breakdown of the changres and a migration procedure, read the following [documentation](https://workleap.github.io/wl-squide/guides/migrate-to-firefly-v9/).

  ## Breaking changes

  - The `useAreModulesRegistered` hook has been removed, use the `useIsBootstrapping` hook instead.
  - The `useAreModulesReady` hook has been removed, use the `useIsBootstrapping` hook instead.
  - The `useIsMswStarted` hook has been removed, use the `useIsBootstrapping` hook instead.
  - The `completeModuleRegistrations` function as been removed use the `useDeferredRegistrations` hook instead.
  - The `completeLocalModulesRegistrations` function has been removed use the `useDeferredRegistrations` hook instead.
  - The `completeRemoteModuleRegistrations` function has been removed use the `useDeferredRegistrations` hook instead.
  - The `useSession` hook has been removed, define your own React context instead.
  - The `useIsAuthenticated` hook has been removed, define your own React context instead.
  - The `sessionAccessor` option has been removed from the `FireflyRuntime` options, define your own React context instead.
  - Removed supports for deferred routes.
  - Plugin's constructor now requires a runtime instance argument.
  - Plugins now registers with a factory function.
  - Full rewrite of the `AppRouter` component.

  ## Renamed

  - The `setMswAsStarted` function has been renamed to `setMswIsReady`.

  ## Others

  - The `@squide/firefly` package now takes a peerDependency on `@tanstack/react-query`.
  - The `@squide/firefly` package doesn't takes a peerDependency on `react-error-boundary` anymore.

  ## New hooks and functions

  - A new `useIsBoostrapping` hook is now available.
  - A new `useDeferredRegistrations` hook is now available.
  - A new `usePublicDataQueries` hook is now available.
  - A new `useProtectedDataQueries` hook is now available.
  - A new `isGlobalDataQueriesError` function is now available.

  ## Improvements

  - Deferred registration functions now always receive a `data` argument.
  - Deferred registration functions now receives a new `operation` argument.
  - Navigation items now include a `$canRender` option, enabling modules to control whether a navigation item should be rendered.
  - New `$key` option for navigation items.

  For more details about the changes and a migration procedure, read the following [documentation](https://workleap.github.io/wl-squide/guides/migrate-to-firefly-v9/).

### Patch Changes

- Updated dependencies [[`58cf066`](https://github.com/workleap/wl-squide/commit/58cf066e87e23611510c254cca96016bd2bad08a)]:
  - @squide/core@5.0.0
  - @squide/module-federation@6.0.0
  - @squide/msw@3.0.0
  - @squide/react-router@6.0.0

## 8.0.0

### Major Changes

- [#168](https://github.com/workleap/wl-squide/pull/168) [`89ace29`](https://github.com/workleap/wl-squide/commit/89ace29b9aeadbbe83cfa71dd137b9f1a115c283) Thanks [@patricklafrance](https://github.com/patricklafrance)! - This release Migrates Squide from Webpack Module Federation to [Module Federation 2.0](https://module-federation.io/guide/start/quick-start.html).

  This release deprecates the following packages:

  - `@squide/webpack-module-federation`, use `@squide/module-federation` instead.
  - `@squide/firefly-configs`, use `@squide/firefly-webpack-configs` instead.

  And introduce a few changes to existing API:

  - The `FireflyRuntime` nows accept a `useMsw` option and expose a new `isMswEnabled` getter:

  ```ts
  // bootstrap.tsx

  import { FireflyRuntime } from "@squide/firefly";

  const runtime = new FireflyRuntime({
    useMsw: true,
  });

  // Use the runtime to determine if MSW handlers should be registered.
  if (runtime.isMswEnabled) {
    // ...
  }
  ```

  - The `registerRemoteModules` function doesn't accept the remotes URL anymore. The remotes URL should be configured in the webpack configuration files.

  Previously:

  ```ts
  // bootstrap.tsx

  import {
    registerRemoteModules,
    type RemoteDefinition,
  } from "@squide/firefly";

  const Remotes: RemoteDefinition = [
    {
      name: "remote1",
      url: "http://localhost:8081",
    },
  ];

  await registerRemoteModules(Remotes, runtime);
  ```

  ```js
  // webpack.dev.js

  import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
  import { swcConfig } from "./swc.dev.js";

  export default defineDevHostConfig(swcConfig, 8080, {
    overlay: false,
  });
  ```

  Now:

  ```ts
  // bootstrap.tsx

  import {
    registerRemoteModules,
    type RemoteDefinition,
  } from "@squide/firefly";

  const Remotes: RemoteDefinition = [
    {
      name: "remote1",
    },
  ];

  await registerRemoteModules(Remotes, runtime);
  ```

  ```js
  // webpack.dev.js

  import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
  import { swcConfig } from "./swc.dev.js";

  /**
   * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition}[]
   */
  export const Remotes = [
    {
      name: "remote1",
      url: "http://localhost:8081",
    },
  ];

  export default defineDevHostConfig(swcConfig, 8080, Remotes, {
    overlay: false,
  });
  ```

  To migrate:

  1. Replace the `@squide/webpack-module-federation` dependency by `@squide/module-federation`.

  2. Replace the `@squide/firefly-configs` dependency by `@squide/firefly-webpack-configs`.

  3. Move the remotes URL from the `bootstrap.tsx` file to the `webpack.*.js` files.

  4. Integrate the new `useMsw` and `isMswEnabled` props.

### Patch Changes

- Updated dependencies [[`89ace29`](https://github.com/workleap/wl-squide/commit/89ace29b9aeadbbe83cfa71dd137b9f1a115c283)]:
  - @squide/module-federation@5.0.0
  - @squide/react-router@5.0.0
  - @squide/core@4.0.0
  - @squide/msw@2.0.14

## 7.0.0

### Major Changes

- [#158](https://github.com/workleap/wl-squide/pull/158) [`b8d5ea4`](https://github.com/workleap/wl-squide/commit/b8d5ea42c23c3291e428c9ff907a7cff2f3211eb) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Cleaned up dependencies.

### Patch Changes

- Updated dependencies [[`b8d5ea4`](https://github.com/workleap/wl-squide/commit/b8d5ea42c23c3291e428c9ff907a7cff2f3211eb)]:
  - @squide/webpack-module-federation@4.0.0

## 6.0.4

### Patch Changes

- [#154](https://github.com/workleap/wl-squide/pull/154) [`e440515`](https://github.com/workleap/wl-squide/commit/e4405150a3c364fd4029c345399891614a434176) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated packages.

- Updated dependencies [[`e440515`](https://github.com/workleap/wl-squide/commit/e4405150a3c364fd4029c345399891614a434176), [`e440515`](https://github.com/workleap/wl-squide/commit/e4405150a3c364fd4029c345399891614a434176)]:
  - @squide/webpack-module-federation@3.0.8
  - @squide/react-router@4.1.3
  - @squide/msw@2.0.13
  - @squide/core@3.4.0

## 6.0.3

### Patch Changes

- [#152](https://github.com/workleap/wl-squide/pull/152) [`d27fe71`](https://github.com/workleap/wl-squide/commit/d27fe717f899e395c3f01af86aac3e015159d719) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependency versions.

- Updated dependencies [[`d27fe71`](https://github.com/workleap/wl-squide/commit/d27fe717f899e395c3f01af86aac3e015159d719)]:
  - @squide/webpack-module-federation@3.0.7
  - @squide/react-router@4.1.2
  - @squide/core@3.3.2
  - @squide/msw@2.0.12

## 6.0.2

### Patch Changes

- Updated dependencies [[`d091846`](https://github.com/workleap/wl-squide/commit/d091846502bed6b783b69ab8eff7ae36d8e25449)]:
  - @squide/core@3.3.1
  - @squide/msw@2.0.11
  - @squide/react-router@4.1.1
  - @squide/webpack-module-federation@3.0.6

## 6.0.1

### Patch Changes

- [#148](https://github.com/workleap/wl-squide/pull/148) [`a448347`](https://github.com/workleap/wl-squide/commit/a4483478bb8b7ef1f24513244e8c2410bdb86bc1) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Internal changes.

- Updated dependencies [[`a448347`](https://github.com/workleap/wl-squide/commit/a4483478bb8b7ef1f24513244e8c2410bdb86bc1)]:
  - @squide/react-router@4.1.0

## 6.0.0

### Major Changes

- [#144](https://github.com/workleap/wl-squide/pull/144) [`39d0bbe4`](https://github.com/workleap/wl-squide/commit/39d0bbe45902d54832e9aa8deb2c1949a2cf3c5f) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Moved the webpack define functions to the new `@squide/firefly-configs` package.

### Patch Changes

- Updated dependencies [[`39d0bbe4`](https://github.com/workleap/wl-squide/commit/39d0bbe45902d54832e9aa8deb2c1949a2cf3c5f), [`39d0bbe4`](https://github.com/workleap/wl-squide/commit/39d0bbe45902d54832e9aa8deb2c1949a2cf3c5f)]:
  - @squide/core@3.3.0
  - @squide/react-router@4.0.4
  - @squide/msw@2.0.10
  - @squide/webpack-module-federation@3.0.5

## 5.0.0

### Patch Changes

- [#140](https://github.com/workleap/wl-squide/pull/140) [`6eaf4ac3`](https://github.com/workleap/wl-squide/commit/6eaf4ac3f6ac88b62045ce280562a5887589026b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Internal changes

- Updated dependencies [[`6eaf4ac3`](https://github.com/workleap/wl-squide/commit/6eaf4ac3f6ac88b62045ce280562a5887589026b)]:
  - @squide/webpack-configs@1.2.0

## 4.0.3

### Patch Changes

- [#137](https://github.com/workleap/wl-squide/pull/137) [`2f5946f9`](https://github.com/workleap/wl-squide/commit/2f5946f9c51740dc0d207d53085b143d9f1e407c) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Improved the no custom 404 route handling.

- Updated dependencies [[`2f5946f9`](https://github.com/workleap/wl-squide/commit/2f5946f9c51740dc0d207d53085b143d9f1e407c)]:
  - @squide/react-router@4.0.3

## 4.0.2

### Patch Changes

- [#135](https://github.com/workleap/wl-squide/pull/135) [`8e73083`](https://github.com/workleap/wl-squide/commit/8e73083bb90a6f23495ac6a8dca0245862ee2c9a) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fixing a remaining issue with deferred registrations that depends on protected data.

- Updated dependencies [[`8e73083`](https://github.com/workleap/wl-squide/commit/8e73083bb90a6f23495ac6a8dca0245862ee2c9a)]:
  - @squide/react-router@4.0.2

## 4.0.1

### Patch Changes

- [#133](https://github.com/workleap/wl-squide/pull/133) [`1cda1be`](https://github.com/workleap/wl-squide/commit/1cda1be30779d1a1d5d2e21eac043baff20c0f7e) Thanks [@patricklafrance](https://github.com/patricklafrance)! - - To prevent the consumer from always handling the AbortSignal error, a default catch has been added to the `AppRouter` component. The consumer can still handler the AbortSignal error if he needs to.

  - When a user makes a direct hit to a deferred route that depends on protected data, the protected data was undefined. The reason was that by default, an unregistered route was considered as a public route. The code has been updated to consider an uregistered route as a protected route. The upside is that deferred routes can now depends on protected data. The downside is that a public deferred route will trigger the loading of the protected data. As we don't expect to have public deferred route at the moment it doesn't seems like an issue.

- Updated dependencies [[`1cda1be`](https://github.com/workleap/wl-squide/commit/1cda1be30779d1a1d5d2e21eac043baff20c0f7e), [`1cda1be`](https://github.com/workleap/wl-squide/commit/1cda1be30779d1a1d5d2e21eac043baff20c0f7e), [`1cda1be`](https://github.com/workleap/wl-squide/commit/1cda1be30779d1a1d5d2e21eac043baff20c0f7e)]:
  - @squide/webpack-module-federation@3.0.4
  - @squide/react-router@4.0.1
  - @squide/core@3.2.1
  - @squide/webpack-configs@1.1.3
  - @squide/msw@2.0.9

## 4.0.0

### Major Changes

- [#131](https://github.com/workleap/wl-squide/pull/131) [`7caa44b`](https://github.com/workleap/wl-squide/commit/7caa44ba81a97d0705caf2f56e6536ae285c920d) Thanks [@patricklafrance](https://github.com/patricklafrance)! - - The `AppRouter` component now requires to define a `RouterProvider` as a child. This change has been made to provide more flexibility on the consumer side about the definition of the React Router router.

  Before:

  ```tsx
  <AppRouter
      fallbackElement={...}
      errorElement={...}
      waitForMsw={...}
   />
  ```

  Now:

  ```tsx
  <AppRouter
      fallbackElement={...}
      errorElement={...}
      waitForMsw={...}
  >
      {(routes, providerProps) => (
          <RouterProvider router={createBrowserRouter(routes)} {...providerProps} />
      )}
  </AppRouter>
  ```

  - When in development and using React strict mode, the public and protected handler can be called twice. This issue highlighted that the `AppRouter` component doesn't equipe correctly the handlers to dispose of previous HTTP requests if they are called multiple times because of re-renders. Therefore, the handlers now receives an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that should be forwared to the HTTP client initiating the fetch request.
  - The fix also requires the consumer to provide new properties (`isPublicDataLoaded` and `isProtectedDataLoaded`) indicating whether or not the public and/or protected data has been loaded.

  ```tsx
  async function fetchPublicData(setFeatureFlags: (featureFlags: FeatureFlags) => void, signal: AbortSignal) {
      try {
          const response = await fetch("/api/feature-flags", {
              signal
          });

          if (response.ok) {
              const data = await response.json();

              setFeatureFlags(data);
          }
      } catch (error: unknown) {
          if (!signal.aborted) {
              throw error;
          }
      }
  }

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>();

  const handleLoadPublicData = useCallback((signal: AbortSignal) => {
      return fetchPublicData(setFeatureFlags, signal);
  }, []);

  <AppRouter
      onLoadPublicData={handleLoadPublicData}
      isPublicDataLoaded={!!featureFlags}
      fallbackElement={...}
      errorElement={...}
      waitForMsw={...}
  >
      {(routes, providerProps) => (
          <RouterProvider router={createBrowserRouter(routes)} {...providerProps} />
      )}
  </AppRouter>
  ```

  - Fixed an issue where the deferred registrations could be completed before the protected data has been loaded.

### Patch Changes

- Updated dependencies [[`7caa44b`](https://github.com/workleap/wl-squide/commit/7caa44ba81a97d0705caf2f56e6536ae285c920d), [`7caa44b`](https://github.com/workleap/wl-squide/commit/7caa44ba81a97d0705caf2f56e6536ae285c920d)]:
  - @squide/core@3.2.0
  - @squide/react-router@4.0.0
  - @squide/msw@2.0.8
  - @squide/webpack-module-federation@3.0.3
  - @squide/webpack-configs@1.1.2

## 3.0.3

### Patch Changes

- [#128](https://github.com/workleap/wl-squide/pull/128) [`4c3b6f1`](https://github.com/workleap/wl-squide/commit/4c3b6f1929364844dda6c1190fc45c3b037e8df9) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Internally changed the usage of `setInterval` for `useSyncExternalStore`.

- Updated dependencies [[`4c3b6f1`](https://github.com/workleap/wl-squide/commit/4c3b6f1929364844dda6c1190fc45c3b037e8df9)]:
  - @squide/core@3.1.1
  - @squide/msw@2.0.7
  - @squide/webpack-module-federation@3.0.2
  - @squide/react-router@3.0.2
  - @squide/webpack-configs@1.1.1

## 3.0.2

### Patch Changes

- [#122](https://github.com/workleap/wl-squide/pull/122) [`cda7873`](https://github.com/workleap/wl-squide/commit/cda7873dcffbf424a625cf40c56a12eacbb2632e) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Internal minor changes

- Updated dependencies [[`cda7873`](https://github.com/workleap/wl-squide/commit/cda7873dcffbf424a625cf40c56a12eacbb2632e)]:
  - @squide/msw@2.0.6

## 3.0.1

### Patch Changes

- [#118](https://github.com/workleap/wl-squide/pull/118) [`4864d30`](https://github.com/workleap/wl-squide/commit/4864d30764021a91d5827abb5b3ae7a4b4302c31) Thanks [@tjosepo](https://github.com/tjosepo)! - Omit "router" from routerProviderProps

## 3.0.0

### Minor Changes

- [#115](https://github.com/workleap/wl-squide/pull/115) [`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4) Thanks [@patricklafrance](https://github.com/patricklafrance)! - - A new `features` option is now available with the `defineConfig` functions to add the `@squide/i18next` package to the shared dependencies.

### Patch Changes

- Updated dependencies [[`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4), [`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4), [`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4)]:
  - @squide/msw@2.0.5
  - @squide/core@3.1.0
  - @squide/webpack-configs@1.1.0
  - @squide/react-router@3.0.1
  - @squide/webpack-module-federation@3.0.1

## 2.0.0

### Minor Changes

- [#112](https://github.com/workleap/wl-squide/pull/112) [`a9dda1c`](https://github.com/workleap/wl-squide/commit/a9dda1c3b010f616556fc3313c1934e20a26bc11) Thanks [@patricklafrance](https://github.com/patricklafrance)! - - Added a new `FireflyRuntime` class. This class should be used by all consumer applications rather than the previous `Runtime` class from `@squide/react-router`.
  - The `FireflyRuntime` class has a `registerRequestHandlers` function and a `requestHandlers` getter. Consumer applications should use these instead of the `MSwPlugin`.
  - Added a new layer of define functions (`defineDevHostConfig`, `defineBuildHostConfig`, `defineDevRemoteModuleConfig`, `defineBuildRemoteModuleConfig`). These functions should be used by all consumer applications rather than the previous define functions from `@squide/wbepack-module-federation`.
  - Forward every exports from `@squide/core`, `@squide/react-router`, `@squide/webpack-module-federation`, `@squide/webpack-configs` and `@squide/msw`. Consumer applications should now import everything from `@squide/firefly` except the fakes implementations that should still be imported from `@squide/fakes`.

### Patch Changes

- Updated dependencies [[`a9dda1c`](https://github.com/workleap/wl-squide/commit/a9dda1c3b010f616556fc3313c1934e20a26bc11), [`a9dda1c`](https://github.com/workleap/wl-squide/commit/a9dda1c3b010f616556fc3313c1934e20a26bc11), [`a9dda1c`](https://github.com/workleap/wl-squide/commit/a9dda1c3b010f616556fc3313c1934e20a26bc11), [`a9dda1c`](https://github.com/workleap/wl-squide/commit/a9dda1c3b010f616556fc3313c1934e20a26bc11)]:
  - @squide/webpack-configs@1.0.0
  - @squide/webpack-module-federation@3.0.0
  - @squide/core@3.0.0
  - @squide/react-router@3.0.0
  - @squide/msw@2.0.4

## 1.0.1

### Patch Changes

- Updated dependencies [[`58097a2`](https://github.com/workleap/wl-squide/commit/58097a2fbaa7e5942cbe6f9b765fe471d52758d8)]:
  - @squide/msw@2.0.3

## 1.0.0

### Major Changes

- [#103](https://github.com/workleap/wl-squide/pull/103) [`b72fca3`](https://github.com/workleap/wl-squide/commit/b72fca38385ddacbcd80376c9afd0c9485658d90) Thanks [@patricklafrance](https://github.com/patricklafrance)! - This is a new package that offer a base `AppRouter` component for the "firefly" stack: React Router + MSW + Webpack

  Basic usage of the new base `AppRouter` component:

  ```tsx
  import { AppRouter as FireflyAppRouter } from "@squide/firefly";

  function Loading() {
    return <div>Loading...</div>;
  }

  function BootstrappingErrorBoundary() {
    return <div>An error occured while bootstrapping the application.</div>;
  }

  export function AppRouter() {
    return (
      <FireflyAppRouter
        fallbackElement={<Loading />}
        errorElement={<BootstrappingErrorBoundary />}
        waitForMsw={false}
      />
    );
  }
  ```

  Advanced usage with public data, protected data, MSW and deferred registrations:

  ```tsx
  export function AppRouter({
    waitForMsw,
    sessionManager,
    telemetryService,
  }: AppRouterProps) {
    // Could be done with a ref (https://react.dev/reference/react/useRef) to save a re-render but for this sample
    // it seemed unnecessary. If your application loads a lot of data at bootstrapping, it should be considered.
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>();
    const [subscription, setSubscription] = useState<Subscription>();

    const logger = useLogger();
    const runtime = useRuntime();

    const handleLoadPublicData = useCallback(
      (signal: AbortSignal) => {
        return fetchPublicData(setFeatureFlags, logger, signal);
      },
      [logger]
    );

    const handleLoadProtectedData = useCallback(
      (signal: AbortSignal) => {
        const setSession = (session: Session) => {
          sessionManager.setSession(session);
        };

        return fetchProtectedData(setSession, setSubscription, logger, signal);
      },
      [logger, sessionManager]
    );

    const handleCompleteRegistration = useCallback(() => {
      return completeModuleRegistrations(runtime, {
        featureFlags,
      });
    }, [runtime, featureFlags]);

    return (
      <FeatureFlagsContext.Provider value={featureFlags}>
        <SubscriptionContext.Provider value={subscription}>
          <TelemetryServiceContext.Provider value={telemetryService}>
            <FireflyAppRouter
              fallbackElement={<Loading />}
              errorElement={<BootstrappingErrorBoundary />}
              waitForMsw={waitForMsw}
              onLoadPublicData={handleLoadPublicData}
              onLoadProtectedData={handleLoadProtectedData}
              onCompleteRegistration={handleCompleteRegistration}
            />
          </TelemetryServiceContext.Provider>
        </SubscriptionContext.Provider>
      </FeatureFlagsContext.Provider>
    );
  }
  ```

### Patch Changes

- Updated dependencies [[`b72fca3`](https://github.com/workleap/wl-squide/commit/b72fca38385ddacbcd80376c9afd0c9485658d90), [`b72fca3`](https://github.com/workleap/wl-squide/commit/b72fca38385ddacbcd80376c9afd0c9485658d90), [`b72fca3`](https://github.com/workleap/wl-squide/commit/b72fca38385ddacbcd80376c9afd0c9485658d90)]:
  - @squide/react-router@2.0.2
  - @squide/webpack-module-federation@2.2.0
  - @squide/msw@2.0.2
