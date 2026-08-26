---
"@squide/core": minor
"@squide/react-router": minor
"@squide/firefly": minor
---

Reverts the registration reporting and navigation item correctness changes released in `@squide/firefly@18.4.0`, `@squide/react-router@9.3.0` and `@squide/core@7.2.0`.

**The three fixes that release carried are withdrawn.** If you upgraded into `18.4.0` for one of them, it is going away again in this version. The changesets being undone are `brave-moons-argue`, `tidy-pandas-repeat` and `witty-carrots-jam`.

The changes were shipped as a single bundle. One of them introduced defects in the navigation item registry that were not caught before release, and because the three were entangled in the same commit the whole bundle is coming out rather than a piece of it. The source of these packages is now identical to `@squide/firefly@18.3.0`, `@squide/react-router@9.2.0` and `@squide/core@7.1.1`.

## What is withdrawn

- **Sections are no longer copied on the deferred path.** A module that registers the same section object on more than one deferred registration run will again accumulate children on it, rendering duplicate links after repeated feature flag flips. Mutating a section after registering it once again updates the live menu.
- **The section index key returns to the `-` separator.** `menuId` and section `$id` are joined with `-` again, so `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` collide once more. A nested item can attach to the wrong menu's section, two distinct sections can throw `A navigation section index has already been registered for the menu`, and strict mode can report one missing section instead of two. The keys returned by `getPendingSectionIds` change content again — treat them as opaque.
- **Deferred registration update runs no longer report the real outcome of their registrations.** A buffered registration is again reported as `registered` before the replay happens, and the replay logs nothing, so a menu can silently lose a link while the console shows success.
- **`useStrictRegistrationMode` no longer re-validates navigation items after a completed deferred registration update.** Validation runs only once, when the modules become ready. A section lost by an update run surfaces only after a page reload. Applications that started throwing in development on a feature flag flip will stop throwing and go back to failing silently.

## Removed API

These were all added in the release being reverted and are removed again:

- `NavigationItemRegistrationStatus` loses its `"buffered"` member.
- `_validateRegistrations` loses its `includeRoutes` option.

This is released as a minor rather than a major because narrowing `NavigationItemRegistrationStatus` is only breaking for a consumer that already adopted the member, and it was published less than two days before being withdrawn with no recorded downloads. If you are pinned to `18.4.0` and reference `"buffered"` or `includeRoutes`, remove those references when you upgrade.

The section index key ambiguity is the one piece tracked for re-landing, and it will go in on its own rather than as part of a bundle.
