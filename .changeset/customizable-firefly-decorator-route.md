---
"@squide/firefly-storybook": minor
---

Added `route` and `initialEntries` options to `FireflyDecorator` and `withFireflyDecorator` so stories can customize the route mounted under Squide's `RootRoute`. The `route` option (a `RouteObject`, an array of them, or a function receiving the story element) replaces the default `{ path: "/story", element: story }` route, which lets components that read route data — route `handle`s via `useMatches()` and `<Outlet />` children — be storied through the decorator. Existing call sites are unaffected.
