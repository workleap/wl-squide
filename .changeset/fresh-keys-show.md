---
"@squide/firefly": patch
---

Fix Honeycomb integration. Previously `globalThis.__WLP_HONEYCOMB_REGISTER_DYNAMIC_FETCH_REQUEST_HOOK` was exposed by `@workleap/honeycomb` instead of `globalThis.__WLP_HONEYCOMB_REGISTER_DYNAMIC_FETCH_REQUEST_HOOK__`.

This PR support both until every application migrate to a new version of this package and `@workleap/honeycomb`.
