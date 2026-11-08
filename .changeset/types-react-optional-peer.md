---
"@squide/core": patch
"@squide/firefly": patch
"@squide/firefly-storybook": patch
"@squide/react-router": patch
---

Declare `@types/react` as an optional peer dependency, so the React types in the package declarations resolve under installs that link packages from outside the project, such as pnpm's global virtual store.
