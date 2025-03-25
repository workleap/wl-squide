# @squide/firefly-honeycomb

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
