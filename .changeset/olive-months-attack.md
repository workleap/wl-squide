---
"@squide/react-router": minor
---

Navigation item registration validation messages now report the actual menu id and section id of a pending registration. They were previously parsed back out of an internal index key by splitting on `-`, which produced incorrect names whenever a `menuId` or a section `$id` contained a dash.

- `PendingRegistrationItem` is now exported. `PendingNavigationItemRegistrations` was typed as holding `RegistryItem` values while it actually holds `PendingRegistrationItem` values, which carry the `menuId` and `sectionId` a registration is waiting for.
- `parseSectionIndexKey` is deprecated. Read the `menuId` and `sectionId` properties of the items returned by `getPendingRegistrationsForSection` instead.
