# Squide Overview and Getting Started

## Table of Contents
- [What Squide Is](#what-squide-is)
- [Problems It Solves](#problems-it-solves)
- [Modular Design Principles](#modular-design-principles)
- [Create an Application from Scratch](#create-an-application-from-scratch)
- [Add a Local Module](#add-a-local-module)

## What Squide Is

Squide is a React modular application shell tailored for Workleap's web applications. It enforces the architectural patterns Workleap deems necessary to write scalable and maintainable web applications.

"Modular application" means the application is organized as a collection of independent modules, each responsible for a specific domain or subdomain — much like a backend system:

```
monorepo
├── apps
├────── host
├────── storybook
├── packages
├────── components
├────── core
├── modules
├────── user-profile
├────── checkout
├────── inventory
```

Squide supports both **local modules** (a sibling package in a monorepo, a standalone package, or a folder in the host) and **remote modules** (Module Federation) in hybrid mode. Products typically start with local modules and migrate them to remote modules one by one, without changing the application's core code.

Squide provides built-in mechanisms for the cross-cutting functionalities of a web application: modular routing, modular navigation, authentication, global data fetching, public and protected pages, localization, observability, logging, error handling, messaging, environment variables, feature flags, and API request mocking.

| Concern | Underlying library |
|---------|--------------------|
| Modular routing & navigation | React Router (extended with modular registration) |
| Public/protected pages & global data | TanStack Query (Squide orchestrates the bootstrapping flow) |
| Localization | i18next |
| Observability | Honeycomb (via `@workleap/telemetry`) |
| Logging | `@workleap/logging` |
| API request mocking | MSW |
| Feature flags | LaunchDarkly |
| Stories | Storybook |

## Problems It Solves

Every frontend application must implement most of the cross-cutting functionalities above. Doing it well typically takes senior or staff developers a few months of full-time work, slowing product teams and delaying releases. Squide replaces that with a reusable, well-tested and documented shell:

- **Encourages modularity** — clear boundaries, independent teams, explicit ownership.
- **Stops reinventing the wheel** — cross-cutting concerns are provided out of the box.
- **Lowers operating costs** — no dedicated staff developers to build and maintain a custom shell.
- **Boosts development velocity and time to market.**
- **Improves local tooling and CI performance** — combined with a build system such as Turborepo, unchanged modules are skipped and cache hits are leveraged, which also lowers third-party costs (e.g. Chromatic).
- **Enhances quality and maintainability** — application shell code is often poorly understood, untested and undocumented by product teams.

The alternative — a tightly coupled architecture — tends to become a "big ball of mud": unclear internal structure, weak boundaries, high coupling, low cohesion. As it grows it becomes harder to understand, raises the cost of change and the risk of regressions, slows onboarding and releases, increases cross-team coordination, blurs ownership, and accumulates accidental complexity.

## Modular Design Principles

These are the principles Squide's API was designed around. Diverging occasionally is fine, but adhering to them makes the experience considerably better:

- A module should correspond to a **domain or subdomain** of the application.
- A module should be **autonomous**.
- A module should **not directly reference other modules**. To coordinate with other modules, including the host, a module should always use the Squide Runtime API.
- A modular application should **feel cohesive**. Different parts should be able to communicate and react to changes outside their boundaries — without taking a hard reference on each other (this is what the event bus is for).
- **Data and state should never be shared** between modules. Even if two modules need the same data, they load, store and manage it independently.

## Create an Application from Scratch

### Scaffold from a template

The fastest path — a working host + local module setup:

```bash
pnpx degit https://github.com/workleap/wl-squide/templates/getting-started
```

### Or build the host manually

Install the packages:

```bash
pnpm add -D @workleap/rsbuild-configs @workleap/browserslist-config @rsbuild/core @rspack/core browserslist typescript @types/react @types/react-dom
pnpm add @squide/firefly @tanstack/react-query react react-dom react-router msw launchdarkly-js-client-sdk
```

Create the following files:

```
host
├── public
├──── index.html
├── src
├──── App.tsx           # AppRouter + BootstrappingRoute
├──── RootLayout.tsx    # Renders the navigation items
├──── HomePage.tsx
├──── NotFoundPage.tsx
├──── index.tsx         # initializeFirefly + FireflyProvider
├──── register.tsx      # Hoisted root layout, homepage, not-found route
├── .browserslistrc
├── rsbuild.dev.ts
├── rsbuild.build.ts
├── package.json
```

Set `"type": "module"` in `package.json` — Squide applications are ESM.

> For the contents of `index.tsx`, `App.tsx` and `register.tsx`, see the Host Application Setup section of `SKILL.md`. For rendering the navigation items in `RootLayout.tsx`, see the Navigation Rendering section.

Configure Rsbuild:

```html
<!-- host/public/index.html -->
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

```
# host/.browserslistrc
extends @workleap/browserslist-config
```

```ts
// host/rsbuild.dev.ts
import { defineDevConfig } from "@workleap/rsbuild-configs";

export default defineDevConfig();
```

```ts
// host/rsbuild.build.ts
import { defineBuildConfig } from "@workleap/rsbuild-configs";

export default defineBuildConfig();
```

Add the CLI scripts:

```json
{
    "scripts": {
        "dev": "rsbuild dev --config ./rsbuild.dev.ts",
        "build": "rsbuild build --config rsbuild.build.ts"
    }
}
```

### Verify the bootstrapping flow

The console logs one entry per registration — use them to diagnose a setup:

```
[squide] Found 1 local module to register.
[squide] 1/1 Registering local module.
[squide] 1/1 Local module registration completed.
[squide] The following route has been registered.
[squide] The following static navigation item has been registered to the "root" menu for a total of 2 static items.
```

## Add a Local Module

Install the dev dependencies and create the files:

```bash
pnpm add -D typescript @types/react @types/react-dom
```

```
local-module
├── src
├──── register.tsx
├──── Page.tsx
├── package.json
```

Make the package shareable as a Just-In-Time package — `exports` points straight at the source, so there is no build step:

```json
{
    "name": "@my-app/local-module",
    "version": "0.0.1",
    "type": "module",
    "exports": "./src/register.tsx",
    "peerDependencies": {
        "@opentelemetry/api": "^x.x.x",
        "@squide/firefly": "^x.x.x",
        "@tanstack/react-query": "^x.x.x",
        "launchdarkly-js-client-sdk": "^x.x.x",
        "msw": "^x.x.x",
        "react": "^x.x.x",
        "react-dom": "^x.x.x",
        "react-router": "^x.x.x"
    }
}
```

Add it as a dependency of the host (`"workspace:*"` in a monorepo), then register it:

```tsx
// host/src/index.tsx
import { register as registerMyLocalModule } from "@my-app/local-module";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule]
});
```

> For the module registration function itself, see `references/patterns.md`.
