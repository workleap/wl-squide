---
order: 90
toc:
    depth: 2-3
---

# FireflyProvider

React provider to share a `FireflyRuntime` instance between an host application and the modules.

## Reference

```tsx
<FireflyProvider runtime={runtime}>
    <App />
</FireflyProvider>
```

### Properties

- `runtime`: A `FireflyRuntime` instance.

## Usage

### Provide a runtime instance

```tsx !#9-11
import { createRoot } from "react-dom/client";
import { FireflyProvider, FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime();

const root = createRoot(document.getElementById("root"));

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Retrieve a runtime instance

```ts !#3
import { useRuntime } from "@squide/firefly";

const runtime = useRuntime();

runtime.logger.debug("Hello!");
```



