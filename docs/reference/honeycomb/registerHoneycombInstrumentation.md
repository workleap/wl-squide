---
toc:
    depth: 2-3
---

# registerHoneycombInstrumentation

Initialize an instance of [Honeycomb Web SDK](https://docs.honeycomb.io/send-data/javascript-browser/honeycomb-distribution) and registers custom instrumentation to monitor the performance of a Squide application.

!!!info
This function serves as a wrapper around the [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) library. Before using it, read the documentation for the [registerHoneycombInstrumentation](https://gsoft-inc.github.io/wl-honeycomb-web/reference/registerhoneycombinstrumentation) function provided by `@workleap/honeycomb`.
!!!

## Reference

```ts
registerHoneycombInstrumentation(runtime, serviceName, apiServiceUrls: [string | Regex], options?: {})
```

### Parameters

- `runtime`: A `FireflyRuntime` instance.
- `serviceName`: Honeycomb application service name.
- `apiServiceUrls`: A `RegExp` or `string` that matches the URLs of the application's backend services. If unsure, use the temporary regex `/.+/g,` to match all URLs.
- `options`: An optional object literal of options:
    - Accepts most of the predefined options of the [registerHoneycombInstrumentation](https://gsoft-inc.github.io/wl-honeycomb-web/reference/registerhoneycombinstrumentation) function provided by `@workleap/honeycomb`.
    - `debug`: An optional `boolean` value indicating whether or not to log debug information to the console. `true` by default when the [runtime](../runtime/runtime-class.md) mode is set to `development`.

### Returns

Nothing

## Usage

### Register instrumentation

```ts !#6-8
import { FireflyRuntime } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

const runtime = new FireflyRuntime();

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});
```

### Use an API key

!!!warning
Prefer using an [OpenTelemetry collector](https://docs.honeycomb.io/send-data/opentelemetry/collector/) over an ingestion [API key](https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/#create-api-key), as API keys can expose Workleap to potential attacks. To use a collector, instead of an `apiKey` option, set the `proxy` option with your collector's proxy address.
!!!

```ts !#4
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    apiKey: "xyz123"
});
```

### Customize backend URLs

!!!warning
Avoid using `/.+/g,` in production as it could expose customer data to third parties.
!!!

Specify values for the `apiServiceUrls` argument that matches your application's backend URLs. For example, if your backend services are hosted at `https://workleap.com/api`:

```ts !#5
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(
    runtime, "squide-sample", 
    [/https:\/\/workleap.com\/api\.*/], 
    { proxy: "https://my-proxy.com" }
);
```

### Register custom instrumentation

```ts !#6-8
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";
import { LongTaskInstrumentation } from "@opentelemetry/instrumentation-long-task";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    instrumentations: [
        new LongTaskInstrumentation()
    ]
});
```

### Register a span processor

```ts CustomSpanPressor.ts
export class CustomSpanProcessor implements SpanProcessor {
    onStart(span: Span): void {
        span.setAttributes({
            "processor.name": "CustomSpanPressor"
        });
    }

    onEnd(): void {}

    forceFlush() {
        return Promise.resolve();
    }

    shutdown() {
        return Promise.resolve();
    }
}
```

```ts !#6-8
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";
import { CustomSpanProcessor } from "./CustomSpanProcessor.ts";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    spanProcessors: [
        new CustomSpanProcessor()
    ]
});
```

### Customize fetch instrumentation

To extend or replace the default [@opentelemetry/instrumentation-fetch](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/opentelemetry-instrumentation-fetch) options, provide a function that returns an object literal with the desired options. This function will receive an object literal containing the default options, which you can either extend or replace.

```ts !#5-10
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    fetchInstrumentation: (defaultOptions) => {
        return {
            ...defaultOptions,
            ignoreNetworkEvents: false
        }
    }
});
```

### Disable fetch instrumentation

```ts !#5
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    fetchInstrumentation: false
});
```

### Customize DOM instrumentation

To extend or replace the default [@opentelemetry/instrumentation-document-load](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/web/opentelemetry-instrumentation-document-load#document-load-instrumentation-options) options, provide a function that returns an object literal with the desired options. This function will receive an object literal containing the default options, which you can either extend or replace.

```ts !#5-10
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    documentLoadInstrumentation: (defaultOptions) => {
        return {
            ...defaultOptions,
            ignoreNetworkEvents: false
        }
    }
});
```

### Disable DOM instrumentation

```ts !#5
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    documentLoadInstrumentation: false
});
```

### Enable XHR instrumentation

By default, [@opentelemetry/instrumentation-xml-http-request](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/opentelemetry-instrumentation-xml-http-request) is disabled. To enable this instrumentation, provide a function that returns an object literal with the desired options. This function will receive an object literal of default options, which you can extend or replace as needed.

```ts !#5-10
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    xmlHttpRequestInstrumentation: (defaultOptions) => {
        return {
            ...defaultOptions,
            ignoreNetworkEvents: false
        }
    }
});
```

### Enable user interactions instrumentation

By default, [@opentelemetryinstrumentation-user-interaction](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/web/opentelemetry-instrumentation-user-interaction) is disabled. To enable this instrumentation, provide a function that returns an object literal with the desired options. This function will receive an object literal of default options, which you can extend or replace as needed.

```ts !#5-10
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    userInteractionInstrumentation: (defaultOptions) => {
        return {
            ...defaultOptions,
            eventNames: ["submit", "click", "keypress"]
        }
    }
});
```

## Configuration transformers

!!!warning
We do not guarantee that your configuration transformers won't break after an update. It's your responsibility to keep them up to date with new releases.
!!!

The [predefined options](#parameters) are useful to quickly customize the default configuration of the [Honeycomb Web SDK](https://docs.honeycomb.io/send-data/javascript-browser/honeycomb-distribution), but only covers a subset of the [options](https://docs.honeycomb.io/send-data/javascript-browser/honeycomb-distribution/#advanced-configuration). If you need full control over the configuration, you can provide configuration transformer functions through the `transformers` option of the `registerHoneycombInstrumentation` function. Remember, **no locked in** :heart::v:.

To view the default configuration of `registerHoneycombInstrumentation`, have a look at the [registerHoneycombInstrumentation.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/firefly-honeycomb/src/registerHoneycombInstrumentation.ts) file on GitHub.

### Transformers

```ts
transformer(options: HoneycombSdkOptions, runtime: FireflyRuntime) => HoneycombSdkOptions;
```

```tsx !#3-7,11
import { registerHoneycombInstrumentation, type HoneycombSdkOptionsTransformer } from "@squide/firefly-honeycomb";

const skipOptionsValidationTransformer: HoneycombSdkOptionsTransformer = config => {
    config.skipOptionsValidation = true;

    return config;
}

registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com",
    transformers: [skipOptionsValidationTransformer]
});
```

### Execution context

Generic transformers can use the `runtime` argument to gather additional information about their execution context, like the `mode` they are operating in:

```ts !#4 transformer.js
import type { HoneycombSdkOptionsTransformer } from "@squide/firefly-honeycomb";

const skipOptionsValidationTransformer: HoneycombSdkOptionsTransformer = (config, runtime) => {
    if (runtime.mode === "development") {
        config.skipOptionsValidation = true;
    }

    return config;
}
```

