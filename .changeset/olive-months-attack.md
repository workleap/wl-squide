---
"@squide/react-router": minor
"@squide/firefly": minor
---

Navigation item registration validation messages now report the actual menu id and section id of a pending registration. They were previously parsed back out of an internal index key by splitting on `-`, which produced incorrect names whenever a `menuId` or a section `$id` contained a dash.

- `PendingRegistrationItem` is now exported. `PendingNavigationItemRegistrations` was typed as holding `RegistryItem` values while it actually holds `PendingRegistrationItem` values, which carry the `menuId` and `sectionId` a registration is waiting for.
- `parseSectionIndexKey` is deprecated. A key cannot be parsed reliably, since a `-` in a `menuId` or in a section `$id` makes it ambiguous. Read the `menuId` and the `sectionId` off the `PendingRegistrationItem` values returned by `PendingNavigationItemRegistrations.getPendingRegistrationsForSection` rather than parsing a key returned by `getPendingSectionIds`. It is kept until the next major to avoid a breaking removal.
