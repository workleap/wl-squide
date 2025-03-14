# @squide/i18next

## 2.2.2

### Patch Changes

- [#231](https://github.com/workleap/wl-squide/pull/231) [`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Packages now includes source code and sourcemap.

- Updated dependencies [[`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6)]:
  - @squide/core@5.4.2

## 2.2.1

### Patch Changes

- [#221](https://github.com/workleap/wl-squide/pull/221) [`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix deferred registrations.

- Updated dependencies [[`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925)]:
  - @squide/core@5.4.1

## 2.2.0

### Minor Changes

- [#219](https://github.com/workleap/wl-squide/pull/219) [`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Now dispatching events to enable instrumentation packages for observability platforms.

### Patch Changes

- Updated dependencies [[`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3)]:
  - @squide/core@5.4.0

## 2.1.1

### Patch Changes

- Updated dependencies [[`8ee26fd`](https://github.com/workleap/wl-squide/commit/8ee26fd6ab7126bacf3dec900629fbd045dfd180)]:
  - @squide/core@5.3.0

## 2.1.0

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

## 2.0.2

### Patch Changes

- Updated dependencies [[`98e4839`](https://github.com/workleap/wl-squide/commit/98e48393fda27ebb2974ecc1e2f71b09f4e84953)]:
  - @squide/core@5.1.0

## 2.0.1

### Patch Changes

- [#191](https://github.com/workleap/wl-squide/pull/191) [`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated packages description.

- Updated dependencies [[`2b62c53`](https://github.com/workleap/wl-squide/commit/2b62c539b0f3123cb47475566181e0b446ea6b40)]:
  - @squide/core@5.0.1

## 2.0.0

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

## 1.1.5

### Patch Changes

- Updated dependencies [[`89ace29`](https://github.com/workleap/wl-squide/commit/89ace29b9aeadbbe83cfa71dd137b9f1a115c283)]:
  - @squide/core@4.0.0

## 1.1.4

### Patch Changes

- [#154](https://github.com/workleap/wl-squide/pull/154) [`e440515`](https://github.com/workleap/wl-squide/commit/e4405150a3c364fd4029c345399891614a434176) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Two i18next instances cannot be registered anymore with the same key.

- Updated dependencies [[`e440515`](https://github.com/workleap/wl-squide/commit/e4405150a3c364fd4029c345399891614a434176)]:
  - @squide/core@3.4.0

## 1.1.3

### Patch Changes

- [#152](https://github.com/workleap/wl-squide/pull/152) [`d27fe71`](https://github.com/workleap/wl-squide/commit/d27fe717f899e395c3f01af86aac3e015159d719) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependency versions.

- Updated dependencies [[`d27fe71`](https://github.com/workleap/wl-squide/commit/d27fe717f899e395c3f01af86aac3e015159d719)]:
  - @squide/core@3.3.2

## 1.1.2

### Patch Changes

- Updated dependencies [[`d091846`](https://github.com/workleap/wl-squide/commit/d091846502bed6b783b69ab8eff7ae36d8e25449)]:
  - @squide/core@3.3.1

## 1.1.1

### Patch Changes

- Updated dependencies [[`39d0bbe4`](https://github.com/workleap/wl-squide/commit/39d0bbe45902d54832e9aa8deb2c1949a2cf3c5f)]:
  - @squide/core@3.3.0

## 1.1.0

### Minor Changes

- [#140](https://github.com/workleap/wl-squide/pull/140) [`6eaf4ac3`](https://github.com/workleap/wl-squide/commit/6eaf4ac3f6ac88b62045ce280562a5887589026b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Now throwing an Error when an instance is registered with an existing key

## 1.0.4

### Patch Changes

- [`2f077119`](https://github.com/workleap/wl-squide/commit/2f0771194fd2034602955b8d3f72e1cc43e20e64) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Added a check to the `changeLanguage` function to prevent updating the language when the language argument value is the current language.

## 1.0.3

### Patch Changes

- Updated dependencies [[`1cda1be`](https://github.com/workleap/wl-squide/commit/1cda1be30779d1a1d5d2e21eac043baff20c0f7e)]:
  - @squide/core@3.2.1

## 1.0.2

### Patch Changes

- Updated dependencies [[`7caa44b`](https://github.com/workleap/wl-squide/commit/7caa44ba81a97d0705caf2f56e6536ae285c920d)]:
  - @squide/core@3.2.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`4c3b6f1`](https://github.com/workleap/wl-squide/commit/4c3b6f1929364844dda6c1190fc45c3b037e8df9)]:
  - @squide/core@3.1.1

## 1.0.0

### Major Changes

- [#115](https://github.com/workleap/wl-squide/pull/115) [`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4) Thanks [@patricklafrance](https://github.com/patricklafrance)! - This a new package to support [i18next](https://www.i18next.com/) for a federated application.

  It includes:

  - `i18nextPlugin`
  - `useChangeLanguage`
  - `useCurrentLanguage`
  - `useI18nextInstance`
  - `I18nextNavigationLabel`

### Patch Changes

- Updated dependencies [[`568255a`](https://github.com/workleap/wl-squide/commit/568255a50a519e7d19c8c2b03909559686cd24c4)]:
  - @squide/core@3.1.0
