---
"@squide/firefly": patch
---

The Honeycomb fetch request hook no longer logs the fetch request, which could include the request headers and body. The Honeycomb `data-fetch` span is now removed from the active spans when a protected data query returns a 401 or when an unmanaged error is reported. Previously, the span stayed active and every subsequent fetch request of the session was nested under the bootstrapping trace.
