---
order: 740
---

# Integrate with platform widgets

The Workleap platform widgets library provides native integration with Squide Firefly, allowing the two libraries to share configuration and integrate seamlessly during bootstrap.

First, open a terminal at the root of the solution and install the `@worleap-widgets/squide-firefly` package:

```bash
pnpm add @workleap-widgets/squide-firefly
```

Then, import the `initializeWidgets` function from `@workleap-widgets/squide-firefly` in the host application, and call it with a Squide Firefly [runtime](../reference/runtime/runtime-class.md) instance to initialize the widgets:

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

For additional information, refer to the [official documentation](https://dev.azure.com/workleap/WorkleapPlatform/_git/workleap-platform-widgets?path=/README.md&_a=preview) of the platform widgets.
