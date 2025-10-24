# @squide/module-federation

## 7.0.4

### Patch Changes

- [#332](https://github.com/workleap/wl-squide/pull/332) [`eb933a7`](https://github.com/workleap/wl-squide/commit/eb933a72514ff3e01f5d3dafa17556e1a07471f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Bumpbed dependencies

- Updated dependencies [[`eb933a7`](https://github.com/workleap/wl-squide/commit/eb933a72514ff3e01f5d3dafa17556e1a07471f6)]:
  - @squide/core@6.1.3

## 7.0.3

### Patch Changes

- [#330](https://github.com/workleap/wl-squide/pull/330) [`09ffa31`](https://github.com/workleap/wl-squide/commit/09ffa3167a82182e7f7793615402ce8b6702f77b) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Bump versions to test OIDC publishing

- Updated dependencies [[`09ffa31`](https://github.com/workleap/wl-squide/commit/09ffa3167a82182e7f7793615402ce8b6702f77b)]:
  - @squide/core@6.1.2

## 7.0.2

### Patch Changes

- [#318](https://github.com/workleap/wl-squide/pull/318) [`6bf9a65`](https://github.com/workleap/wl-squide/commit/6bf9a65f222a6201655cf1ee525e94211aabe0b7) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependency versions.

- Updated dependencies [[`6bf9a65`](https://github.com/workleap/wl-squide/commit/6bf9a65f222a6201655cf1ee525e94211aabe0b7)]:
  - @squide/core@6.1.1

## 7.0.1

### Patch Changes

- Updated dependencies [[`bea660b`](https://github.com/workleap/wl-squide/commit/bea660bf827dd123a52f6062a7be8865dc99055b)]:
  - @squide/core@6.1.0

## 7.0.0

### Major Changes

- [#311](https://github.com/workleap/wl-squide/pull/311) [`cc52e8b`](https://github.com/workleap/wl-squide/commit/cc52e8bfbe9d3d215f51d12755743f17c0c69772) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Deferred registration functions now receives a runtime instance as the first argument. This new scope runtime instance should used whenever runtime access is required within a deferred registration function scope.

  Before:

  The `runtime` argument of the registration function is used to register the navigation item.

  ```ts !#1,2,4
  export const register: ModuleRegisterFunction<
    FireflyRuntime,
    unknown,
    DeferredRegistrationData
  > = (runtime) => {
    return ({ featureFlags }, operation) => {
      if (featureFlags.featureA) {
        runtime.registerNavigationItem({
          $id: "feature-a",
          $label: operation === "register" ? "Feature A" : "Feature A updated",
          to: "/feature-a",
        });
      }
    };
  };
  ```

  After:

  The `deferredRuntime` argument of the **deferred** registration function is used to register the navigation item.

  ```ts !#2,4
  export const register: ModuleRegisterFunction<
    FireflyRuntime,
    unknown,
    DeferredRegistrationData
  > = (runtime) => {
    return (deferredRuntime, { featureFlags }, operation) => {
      if (featureFlags.featureA) {
        deferredRuntime.registerNavigationItem({
          $id: "feature-a",
          $label: operation === "register" ? "Feature A" : "Feature A updated",
          to: "/feature-a",
        });
      }
    };
  };
  ```

### Patch Changes

- Updated dependencies [[`cc52e8b`](https://github.com/workleap/wl-squide/commit/cc52e8bfbe9d3d215f51d12755743f17c0c69772)]:
  - @squide/core@6.0.0

## 6.5.0

### Minor Changes

- [#302](https://github.com/workleap/wl-squide/pull/302) [`e55c60b`](https://github.com/workleap/wl-squide/commit/e55c60b8e5a3c258a5a7d667ce990f73021f8e5d) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Improved the logging API.

### Patch Changes

- Updated dependencies [[`e55c60b`](https://github.com/workleap/wl-squide/commit/e55c60b8e5a3c258a5a7d667ce990f73021f8e5d)]:
  - @squide/core@5.7.0

## 6.4.0

### Minor Changes

- [#300](https://github.com/workleap/wl-squide/pull/300) [`8d3eae2`](https://github.com/workleap/wl-squide/commit/8d3eae2ee4dc0331f83047e3ef313c6abb15dc3f) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Improved the logging API.

### Patch Changes

- Updated dependencies [[`8d3eae2`](https://github.com/workleap/wl-squide/commit/8d3eae2ee4dc0331f83047e3ef313c6abb15dc3f)]:
  - @squide/core@5.6.0

## 6.3.0

### Minor Changes

- [#296](https://github.com/workleap/wl-squide/pull/296) [`a143988`](https://github.com/workleap/wl-squide/commit/a1439886931f773ff8e71fa8dd8b429108525717) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

### Patch Changes

- Updated dependencies [[`a143988`](https://github.com/workleap/wl-squide/commit/a1439886931f773ff8e71fa8dd8b429108525717)]:
  - @squide/core@5.5.0

## 6.2.9

### Patch Changes

- [#289](https://github.com/workleap/wl-squide/pull/289) [`ee6f7d5`](https://github.com/workleap/wl-squide/commit/ee6f7d52ff6afa8ac757770c89b39978c40a70bc) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fixed Honeycomb telemetry traces when data fetching fails and bumped dependencies versions.

- Updated dependencies [[`ee6f7d5`](https://github.com/workleap/wl-squide/commit/ee6f7d52ff6afa8ac757770c89b39978c40a70bc)]:
  - @squide/core@5.4.9

## 6.2.8

### Patch Changes

- [#271](https://github.com/workleap/wl-squide/pull/271) [`fdc2dc5`](https://github.com/workleap/wl-squide/commit/fdc2dc5acb7ebec0d3b22f1a29ff1801930f1f57) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`fdc2dc5`](https://github.com/workleap/wl-squide/commit/fdc2dc5acb7ebec0d3b22f1a29ff1801930f1f57)]:
  - @squide/core@5.4.8

## 6.2.7

### Patch Changes

- [#269](https://github.com/workleap/wl-squide/pull/269) [`d3a3fa0`](https://github.com/workleap/wl-squide/commit/d3a3fa05fe75db24a128263e8a2df57233769298) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`d3a3fa0`](https://github.com/workleap/wl-squide/commit/d3a3fa05fe75db24a128263e8a2df57233769298)]:
  - @squide/core@5.4.7

## 6.2.6

### Patch Changes

- [#256](https://github.com/workleap/wl-squide/pull/256) [`6c4ee56`](https://github.com/workleap/wl-squide/commit/6c4ee5624141a51d6eefd99dd053e81eb5b08e5c) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Update dependencies versioning to the new Workleap's internal guidelines.

- Updated dependencies [[`6c4ee56`](https://github.com/workleap/wl-squide/commit/6c4ee5624141a51d6eefd99dd053e81eb5b08e5c)]:
  - @squide/core@5.4.6

## 6.2.5

### Patch Changes

- [#249](https://github.com/workleap/wl-squide/pull/249) [`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Temporary add a dependency to the `@rspack/core` package.

- Updated dependencies [[`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f)]:
  - @squide/core@5.4.5

## 6.2.4

### Patch Changes

- [#247](https://github.com/workleap/wl-squide/pull/247) [`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - The error structure is now an instance of `Error` rather than an object literal.

- Updated dependencies [[`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6)]:
  - @squide/core@5.4.4

## 6.2.3

### Patch Changes

- [#244](https://github.com/workleap/wl-squide/pull/244) [`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b)]:
  - @squide/core@5.4.3

## 6.2.2

### Patch Changes

- [#231](https://github.com/workleap/wl-squide/pull/231) [`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Packages now includes source code and sourcemap.

- Updated dependencies [[`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6)]:
  - @squide/core@5.4.2

## 6.2.1

### Patch Changes

- [#221](https://github.com/workleap/wl-squide/pull/221) [`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix deferred registrations.

- Updated dependencies [[`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925)]:
  - @squide/core@5.4.1

## 6.2.0

### Minor Changes

- [#219](https://github.com/workleap/wl-squide/pull/219) [`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Now dispatching events to enable instrumentation packages for observability platforms.

### Patch Changes

- Updated dependencies [[`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3)]:
  - @squide/core@5.4.0

## 6.1.1

### Patch Changes

- Updated dependencies [[`8ee26fd`](https://github.com/workleap/wl-squide/commit/8ee26fd6ab7126bacf3dec900629fbd045dfd180)]:
  - @squide/core@5.3.0

## 6.1.0

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
  - @squide/core@5.2.0

## 6.0.2

### Patch Changes

- Updated dependencies [[`98e4839`](https://github.com/workleap/wl-squide/commit/98e48393fda27ebb2974ecc1e2f71b09f4e84953)]:
  - @squide/core@5.1.0

## 6.0.1

### Patch Changes

- [#191](https://github.com/workleap/wl-squide/pull/191) [`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated packages description.

- Updated dependencies [[`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40)]:
  - @squide/core@5.0.1

## 6.0.0

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

## 5.0.0

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
  - @squide/core@4.0.0
