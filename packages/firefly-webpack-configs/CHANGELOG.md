# @squide/firefly-webpack-configs

## 5.1.1

### Patch Changes

- [#318](https://github.com/workleap/wl-squide/pull/318) [`6bf9a65`](https://github.com/workleap/wl-squide/commit/6bf9a65f222a6201655cf1ee525e94211aabe0b7) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependency versions.

## 5.1.0

### Minor Changes

- [#296](https://github.com/workleap/wl-squide/pull/296) [`a143988`](https://github.com/workleap/wl-squide/commit/a1439886931f773ff8e71fa8dd8b429108525717) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

## 5.0.5

### Patch Changes

- [#289](https://github.com/workleap/wl-squide/pull/289) [`ee6f7d5`](https://github.com/workleap/wl-squide/commit/ee6f7d52ff6afa8ac757770c89b39978c40a70bc) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fixed Honeycomb telemetry traces when data fetching fails and bumped dependencies versions.

## 5.0.4

### Patch Changes

- [#271](https://github.com/workleap/wl-squide/pull/271) [`fdc2dc5`](https://github.com/workleap/wl-squide/commit/fdc2dc5acb7ebec0d3b22f1a29ff1801930f1f57) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

## 5.0.3

### Patch Changes

- [#269](https://github.com/workleap/wl-squide/pull/269) [`d3a3fa0`](https://github.com/workleap/wl-squide/commit/d3a3fa05fe75db24a128263e8a2df57233769298) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

## 5.0.2

### Patch Changes

- [#256](https://github.com/workleap/wl-squide/pull/256) [`6c4ee56`](https://github.com/workleap/wl-squide/commit/6c4ee5624141a51d6eefd99dd053e81eb5b08e5c) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Update dependencies versioning to the new Workleap's internal guidelines.

## 5.0.1

### Patch Changes

- [#244](https://github.com/workleap/wl-squide/pull/244) [`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

## 5.0.0

### Major Changes

- [#240](https://github.com/workleap/wl-squide/pull/240) [`9a85d23`](https://github.com/workleap/wl-squide/commit/9a85d23b03584e9d98c28d504f5cef3e62b298db) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies to React Router v7.

## 4.2.3

### Patch Changes

- [#231](https://github.com/workleap/wl-squide/pull/231) [`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Packages now includes source code and sourcemap.

## 4.2.2

### Patch Changes

- [#225](https://github.com/workleap/wl-squide/pull/225) [`4eb46d6`](https://github.com/workleap/wl-squide/commit/4eb46d69283804a5809494f7275f9d447022a97d) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Added additional shared dependencies for Honeycomb.

## 4.2.1

### Patch Changes

- [#221](https://github.com/workleap/wl-squide/pull/221) [`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix deferred registrations.

- Updated dependencies [[`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925)]:
  - @squide/webpack-configs@4.3.1

## 4.2.0

### Minor Changes

- [#219](https://github.com/workleap/wl-squide/pull/219) [`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Now dispatching events to enable instrumentation packages for observability platforms.

### Patch Changes

- Updated dependencies [[`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3)]:
  - @squide/webpack-configs@4.3.0

## 4.1.0

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
  - @squide/webpack-configs@4.2.0

## 4.0.2

### Patch Changes

- Updated dependencies [[`52d57fc`](https://github.com/workleap/wl-squide/commit/52d57fcc8fcff7b7f6e84d7621724bad8ed9f2a9)]:
  - @squide/webpack-configs@4.1.0

## 4.0.1

### Patch Changes

- [#191](https://github.com/workleap/wl-squide/pull/191) [`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated packages description.

- Updated dependencies [[`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40)]:
  - @squide/webpack-configs@4.0.1

## 4.0.0

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
  - @squide/webpack-configs@4.0.0

## 3.0.0

### Major Changes

- [#170](https://github.com/workleap/wl-squide/pull/170) [`119570f`](https://github.com/workleap/wl-squide/commit/119570f9c93341285a24e8be879d0a468ee2b5db) Thanks [@patricklafrance](https://github.com/patricklafrance)! - The host define function doesn't accept an "applicationName" anymore as it is now hardcoded to "host".

### Patch Changes

- Updated dependencies [[`119570f`](https://github.com/workleap/wl-squide/commit/119570f9c93341285a24e8be879d0a468ee2b5db)]:
  - @squide/webpack-configs@3.0.0

## 2.0.0

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
  - @squide/webpack-configs@2.0.0
