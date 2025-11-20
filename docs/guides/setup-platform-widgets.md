---
order: 740
visibility: hidden
---

# Setup platform widgets

The Workleap platform widgets library provides native integration with Squide Firefly, allowing the two libraries to share configuration and integrate seamlessly during bootstrap.

First, open a terminal at the root of the solution and install the `@worleap-widgets/squide-firefly` package:

```bash
pnpm add @workleap-widgets/squide-firefly
```

Then, import the `initializeWidgets` function from `@workleap-widgets/squide-firefly` in the host application, and call it with a Squide Firefly [runtime](../reference/runtime/FireflyRuntime.md) instance to initialize the widgets:

```tsx host/src/index.tsx
import { initializeWidgets } from "@workleap-widgets/squide-firefly";
import { initializeFirefly } from "@squide/firefly";

const fireflyRuntime = initializeFirefly();

const widgetsRuntime = initializeWidgets(fireflyRuntime, "wlp", "development", {
    colorScheme: "light",
    language: "en-US",
    widgets: {
        fte: {
            invitationModal: true
        }
    }
});
```

Finally, import the `isBootstrapping` hook from `@workleap-widgets/squide-firefly` to show a loading animation until the widgets are ready:

```tsx !#1,6
import { useIsBootstrapping } from "@workleap-widgets/squide-firefly";

function BootstrappingRoute() {
    // ...

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return // ...
}
```

!!!tip
The `useIsBootstrapping` hook from `@workleap-widgets/squide-firefly` wraps the `useIsBootstrapping` hook from `@squide/firefly`. As a result, if the host application is already fetching [global data](fetch-global-data.md), the application will wait until both the widgets **and** the global data are ready.
!!!

For additional information, refer to the [official documentation](https://dev.azure.com/workleap/WorkleapPlatform/_git/workleap-platform-widgets?path=/README.md&_a=preview) of the platform widgets.
