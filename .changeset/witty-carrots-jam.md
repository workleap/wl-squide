---
"@squide/core": minor
"@squide/react-router": minor
"@squide/firefly": minor
---

A deferred registration update run now reports the real outcome of its registrations, and the navigation items are validated again once it completes.

An update run buffers every registration and replays it when the run completes, but a buffered registration was reported as `registered` before the replay had happened. A nested item whose section was not re-registered by that run stayed pending, and the replay logged nothing at all, so a menu could silently lose a link while the console showed a green success.

- `registerNavigationItem` now reports a buffered registration as `buffered`, and the replay reports whether each item ended up registered or pending. `NavigationItemRegistrationStatus` gained a `"buffered"` value.
- `useStrictRegistrationMode` re-runs the navigation item validation after every completed deferred registration update, throwing in development and logging in production, exactly as it does once the modules are ready. Validation previously ran only once, so a section lost by an update run surfaced only after a page reload. `strictMode={false}` on `AppRouter` remains the opt-out.
- `_validateRegistrations` accepts a new `includeRoutes` option. Routes are frozen after the initial registration phase and cannot become pending during an update run, so they are not re-validated.

Applications that were silently losing navigation items on a feature flag flip will start throwing in development. That is the intended outcome, it surfaces misconfigurations that were previously invisible.
