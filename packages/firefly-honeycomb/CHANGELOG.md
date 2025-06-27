# @squide/firefly-honeycomb

## 3.0.4

### Patch Changes

- Updated dependencies [[`f0ed2f2`](https://github.com/workleap/wl-squide/commit/f0ed2f2f226e5e614fab05b8affdcebb94dd2755)]:
  - @squide/firefly@13.0.3

## 3.0.3

### Patch Changes

- [#289](https://github.com/workleap/wl-squide/pull/289) [`ee6f7d5`](https://github.com/workleap/wl-squide/commit/ee6f7d52ff6afa8ac757770c89b39978c40a70bc) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fixed Honeycomb telemetry traces when data fetching fails and bumped dependencies versions.

- Updated dependencies [[`ee6f7d5`](https://github.com/workleap/wl-squide/commit/ee6f7d52ff6afa8ac757770c89b39978c40a70bc)]:
  - @squide/firefly@13.0.2
  - @squide/core@5.4.9

## 3.0.2

### Patch Changes

- Updated dependencies [[`9d15afc`](https://github.com/workleap/wl-squide/commit/9d15afc8b75c69dc3f0239876fb25a1d72ed9b29)]:
  - @squide/firefly@13.0.1

## 3.0.1

### Patch Changes

- [#276](https://github.com/workleap/wl-squide/pull/276) [`e46df52`](https://github.com/workleap/wl-squide/commit/e46df52956a32e2487cf113bdc383033aac7a023) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Internal house keeping.

- Updated dependencies [[`e46df52`](https://github.com/workleap/wl-squide/commit/e46df52956a32e2487cf113bdc383033aac7a023)]:
  - @squide/firefly@13.0.0

## 3.0.0

### Major Changes

- [#274](https://github.com/workleap/wl-squide/pull/274) [`bc5d9d9`](https://github.com/workleap/wl-squide/commit/bc5d9d9e4af36d452ae64c66fc877fcd6ede9667) Thanks [@patricklafrance](https://github.com/patricklafrance)! - A namespace is now required to register the Honeycomb instrumentation.

  Before:

  ```ts
  registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g], {
    proxy: "https://my-proxy.com",
  });
  ```

  Now:

  ```ts
  registerHoneycombInstrumentation(
    runtime,
    "sample",
    "squide-sample",
    [/.+/g],
    {
      proxy: "https://my-proxy.com",
    }
  );
  ```

## 2.0.11

### Patch Changes

- [#271](https://github.com/workleap/wl-squide/pull/271) [`fdc2dc5`](https://github.com/workleap/wl-squide/commit/fdc2dc5acb7ebec0d3b22f1a29ff1801930f1f57) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`fdc2dc5`](https://github.com/workleap/wl-squide/commit/fdc2dc5acb7ebec0d3b22f1a29ff1801930f1f57)]:
  - @squide/firefly@12.0.4
  - @squide/core@5.4.8

## 2.0.10

### Patch Changes

- [#269](https://github.com/workleap/wl-squide/pull/269) [`d3a3fa0`](https://github.com/workleap/wl-squide/commit/d3a3fa05fe75db24a128263e8a2df57233769298) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`d3a3fa0`](https://github.com/workleap/wl-squide/commit/d3a3fa05fe75db24a128263e8a2df57233769298)]:
  - @squide/firefly@12.0.3
  - @squide/core@5.4.7

## 2.0.9

### Patch Changes

- [#259](https://github.com/workleap/wl-squide/pull/259) [`1004631`](https://github.com/workleap/wl-squide/commit/100463113603e8d76ea0f573d5197cdfb5efd7ba) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Added back @opentelemetry/api as a peerDependency

## 2.0.8

### Patch Changes

- [#256](https://github.com/workleap/wl-squide/pull/256) [`6c4ee56`](https://github.com/workleap/wl-squide/commit/6c4ee5624141a51d6eefd99dd053e81eb5b08e5c) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Update dependencies versioning to the new Workleap's internal guidelines.

- Updated dependencies [[`6c4ee56`](https://github.com/workleap/wl-squide/commit/6c4ee5624141a51d6eefd99dd053e81eb5b08e5c)]:
  - @squide/firefly@12.0.2
  - @squide/core@5.4.6

## 2.0.7

### Patch Changes

- Updated dependencies [[`470252f`](https://github.com/workleap/wl-squide/commit/470252f11efe5d84a40e9c60c3bfc13d9f3bf049)]:
  - @squide/firefly@12.0.1

## 2.0.6

### Patch Changes

- Updated dependencies [[`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f), [`9429e98`](https://github.com/workleap/wl-squide/commit/9429e98382f054ed560297aa8a1e54caba40db4f)]:
  - @squide/firefly@12.0.0
  - @squide/core@5.4.5

## 2.0.5

### Patch Changes

- [#247](https://github.com/workleap/wl-squide/pull/247) [`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated to the new error format propagate by the local and remote modules registration.

- Updated dependencies [[`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6), [`ddcb106`](https://github.com/workleap/wl-squide/commit/ddcb106a6b3522e09d1ab92c417725185ffc64e6)]:
  - @squide/core@5.4.4
  - @squide/firefly@11.0.0

## 2.0.4

### Patch Changes

- [#244](https://github.com/workleap/wl-squide/pull/244) [`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Updated dependencies.

- Updated dependencies [[`5d13eb0`](https://github.com/workleap/wl-squide/commit/5d13eb038a724b499b820d7e1dc864c87954510b)]:
  - @squide/firefly@10.0.1
  - @squide/core@5.4.3

## 2.0.3

### Patch Changes

- [#240](https://github.com/workleap/wl-squide/pull/240) [`9a85d23`](https://github.com/workleap/wl-squide/commit/9a85d23b03584e9d98c28d504f5cef3e62b298db) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fixed Squide boostrapping tracing.

- Updated dependencies [[`9a85d23`](https://github.com/workleap/wl-squide/commit/9a85d23b03584e9d98c28d504f5cef3e62b298db)]:
  - @squide/firefly@10.0.0

## 2.0.2

### Patch Changes

- Updated dependencies []:
  - @squide/firefly@9.3.4

## 2.0.1

### Patch Changes

- [#231](https://github.com/workleap/wl-squide/pull/231) [`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Packages now includes source code and sourcemap.

- Updated dependencies [[`3c6bce0`](https://github.com/workleap/wl-squide/commit/3c6bce0cd559d0b8517d644661b6fb2b818ab2f6)]:
  - @squide/firefly@9.3.3

## 2.0.0

### Major Changes

- [#225](https://github.com/workleap/wl-squide/pull/225) [`4eb46d6`](https://github.com/workleap/wl-squide/commit/4eb46d69283804a5809494f7275f9d447022a97d) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Added "@opentelemetry/instrumentation-fetch" and "@opentelemetry/sdk-trace-web" as peerDependencies.

### Patch Changes

- Updated dependencies []:
  - @squide/firefly@9.3.2

## 1.0.2

### Patch Changes

- [#223](https://github.com/workleap/wl-squide/pull/223) [`8cd47f4`](https://github.com/workleap/wl-squide/commit/8cd47f4eafe7e9ee83fdeaf8cc4a87b1361c0551) Thanks [@patricklafrance](https://github.com/patricklafrance)! - This package is now a wrapper around `@workleap/honeycomb`.

## 1.0.1

### Patch Changes

- [#221](https://github.com/workleap/wl-squide/pull/221) [`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925) Thanks [@patricklafrance](https://github.com/patricklafrance)! - Fix deferred registrations.

- Updated dependencies [[`8411080`](https://github.com/workleap/wl-squide/commit/8411080dfd0df6d0eafb01888298154fa5e5d925)]:
  - @squide/firefly@9.3.1

## 1.0.0

### Major Changes

- [#219](https://github.com/workleap/wl-squide/pull/219) [`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3) Thanks [@patricklafrance](https://github.com/patricklafrance)! - New package instrumentating Squide for [Honeycomb](https://www.honeycomb.io/).

  This packages includes:

  - [registerHoneycombInstrumentation](https://workleap.github.io/wl-squide/reference/honeycomb/registerhoneycombinstrumentation/)
  - [setGlobalSpanAttributes](https://workleap.github.io/wl-squide/reference/honeycomb/setglobalspanattributes/)

  A [migration guide](https://workleap.github.io/wl-squide/upgrading/migrate-to-firefly-v9.3) is available to update a Squide application to v9.3 and use Honeycomb observability.

### Patch Changes

- Updated dependencies [[`25cb482`](https://github.com/workleap/wl-squide/commit/25cb482779ee280f3f7109de4607b92dcfeef7f3)]:
  - @squide/firefly@9.3.0
