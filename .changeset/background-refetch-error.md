---
"@squide/firefly": minor
---

`useProtectedDataQueries` and `usePublicDataQueries` no longer throw `GlobalDataQueriesError` when a background refetch fails after the global data was fetched. The hooks keep returning the last successful data, and the next successful refetch clears the error. Previously, a transient failure, such as a refetch on reconnect while the network isn't usable yet, unmounted the application into the root error boundary.

`GlobalDataQueriesError` is now only thrown, and `ProtectedDataFetchFailedEvent` / `PublicDataFetchFailedEvent` only dispatched, when a query fails without data: the initial fetch, or a fetch for a new query key. Edge cases:

- A root error boundary that reloads the page on `GlobalDataQueriesError` no longer recovers from failed background refetches, because they no longer reach it.
- A query with `initialData` no longer throws when its first fetch fails, since it already has data.
- A `select` that throws after the data is ready is ignored.
- To log background refetch errors, use TanStack Query's `QueryCache` `onError` callback.
