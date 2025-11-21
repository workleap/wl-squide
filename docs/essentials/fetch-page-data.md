---
order: 440
label: Fetch page data
---

# Fetch page data

There are several approaches to fetching data for pages. We prefer using a backend-for-frontend (BFF) with a **dedicated endpoint for each page**, returning a data structure **tailored** to that **page**. We rely on server state as our single source and [TanStack Query](https://tanstack.com/query/latest) is used to handle data fetching and caching.

## Fetch data

:point_right: There are two key steps to fetch page data:

- Fetch the data using the [useSuspenseQuery]() hook.
- Define a fallback element in the layout component using the [Suspense]() component

```tsx !#9-13
import { useSuspenseQuery } from "@tanstack/react-query";

interface Character {
    name: string;
    species: string;
}

export function Page() {
    const { data: characters } = useSuspenseQuery({ queryKey: ["/api/characters"], queryFn: () => {
        const response = await fetch("/api/characters");
        
        return await response.json();
    }});

    return (
        <div>
            {characters.map((x: Character) => {
                return (
                    <div key={x.name}>
                        <span>Name: {x.name}</span>
                        <span>Species: {x.species}</span>
                    </div>
                );
            })}
        </div>
    );
}
```

```tsx !#6,8
import { Suspense } from "react";
import { Outlet } from "react-router/dom";

export function RootLayout() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
        </Suspense>
    );
}
```

==- Setup the MSW handler used in the example
First, define an MSW request handler that returns the number of times it has been fetched:

```ts
import { HttpResponse, http, type HttpHandler } from "msw";

export const requestHandlers: HttpHandler[] = [
    http.get("/api/characters", () => {
        return HttpResponse.json([{
            "name": "Rick Sanchez",
            "species": "Human"
        }, {
            "name": "Morty Smith",
            "species": "Human"
        }]);
    })
];
```

Then, register the request handler using the module registration function:

```ts
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly"; 

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW code to the production bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
}
```
===

## Setup TanStack Query

Refer to the [Setup TanStack Query](../integrations/setup-tanstack-query.md) integration guide.

