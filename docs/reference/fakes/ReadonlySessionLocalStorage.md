---
toc:
    depth: 2-3
---

# ReadonlySessionLocalStorage

Read a session object from the local storage (strictly for development purpose).

## Reference

```ts
const sessionAccessor = new ReadonlySessionLocalStorage(options?: { key? })
```

### Parameters

- `options`: An optional object literal of options:
    - `key`: An optional key identifying the session in `localStorage`.

## Usage

### Create an accessor instance

```ts !#4
import { ReadonlySessionLocalStorage } from "@squide/fakes";
import type { Session } from "@sample/share";

const sessionAccessor = new ReadonlySessionLocalStorage<Session>();
```

### Get the current session

```ts !#1
const session = sessionAccessor.getSession();
```

