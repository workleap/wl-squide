---
order: 370
label: Set Honeycomb custom attributes
---

# Set Honeycomb custom attributes

For Honeycomb traces to be useful, most application needs to set information about the current user environment on monitoring and performance traces. To help with that, Squide can integrate with the `setGlobalSpanAttributes` method of the [HoneycombInstrumentationClient](https://workleap.github.io/wl-telemetry/reference/telemetry/honeycombinstrumentationclient/).

To set information retrieved from the global data as custom attributes on Honeycomb traces, refer to the [fetch protected global data](../essentials/fetch-protected-global-data.md) essential page as a starting point and update the `BootstrappingRoute` component to retrieve the Honeycomb client instance and set the attributes:

```tsx !#25,27-33
import { AppRouter, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";
import { SubscriptionContext, ApiError } from "@sample/shared";

function BootstrappingRoute() {
    const [subscription] = useProtectedDataQueries([
        {
            queryKey: ["/api/subscription"],
            queryFn: async () => {
                const response = await fetch("/api/subscription");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                return data.status as string;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    const honeycombClient = useHoneycombInstrumentationClient();

    useEffect(() => {
        if (subscription) {
            honeycombClient.setGlobalSpanAttributes({
                "app.subscription_status": subscription.status
            });
        }
    }, [subscription]);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <SubscriptionContext.Provider value={subscription}>
            <Outlet />
        </SubscriptionContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

Now, every trace recorded **after** the session initialization will include the custom attributes `app.user_id`:

:::align-image-left
![Custom attributes](../static/honeycomb-custom-attributes.png){width=204 height=161}
:::

