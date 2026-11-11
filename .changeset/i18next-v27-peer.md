---
"@squide/i18next": major
---

`@squide/i18next` now requires `i18next` `^27.0.1`, `react-i18next` `^18.0.1` and `i18next-browser-languagedetector` `^8.3.0` as peer dependencies. The `@squide/i18next` API is unchanged, but `i18next` and `react-i18next` ship breaking changes of their own. The most likely to affect an application:

- `i18next` 27: `fallbackLng` now defaults to `false` (was `["dev"]`) and `returnEmptyString` now defaults to `false`. See the [i18next migration guide](https://www.i18next.com/misc/migration-guide#v26.x.x-to-v27.0.0).
- `react-i18next` 18: requires React 18 or later. The `react` init options stay on the instance they are set on and are no longer shared with other instances, so set them on every module's instance. `<Trans>` always decodes HTML entities, so the `shouldUnescape` prop is ignored and should be removed. See the [react-i18next migration guide](https://react.i18next.com/latest/migrating-v17-to-v18).
