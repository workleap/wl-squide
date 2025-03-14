---
order: 80
toc:
    depth: 2-3
---

# isGlobalDataQueriesError

Indicates whether or not an error is an instance of [GlobalDataQueriesError](#globaldataquerieserror).

!!!info
`GlobalDataQueriesError` errors are thrown by either the [usePublicDataQueries](./usePublicDataQueries.md) hook or the [useProtectedDataQueries](./useProtectedDataQueries.md) hook and should usually be handled by an error boundary.
!!!

## Reference

```ts
const result = isGlobalDataQueriesError(error);
```

### Parameters

- `error`: An `Error` instance.

### Returns

A `boolean` value indicating whether or not the error is an instance of [GlobalDataQueriesError](#globaldataquerieserror).

## Usage

### Handle within an error boundary

```tsx
import { isGlobalDataQueriesError } from "@squide/firefly";
import { useLocation, useRouteError } from "react-router/dom";

export function ErrorBoundary() {
    const error = useRouteError() as Error;
    const location = useLocation();

    useEffect(() => {
        if (isGlobalDataQueriesError(error)) {
            // ...
        }
    }, [location.pathname, error]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred and the application is broken, try refreshing your browser.</p>
        </div>
    );
}
```

### Handle with a try/catch

```ts
import { isGlobalDataQueriesError } from "@squide/firefly";

try {
    // ...
} catch (error: unknown) {
    if (isGlobalDataQueriesError(error)) {
        // ...
    }
}
```

## GlobalDataQueriesError

- `message`: The error message.
- `errors`: An array of `Error` instances.
