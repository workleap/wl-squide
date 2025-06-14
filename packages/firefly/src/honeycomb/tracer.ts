import { trace } from "@opentelemetry/api";

export function getTracer() {
    // The tracer name is used as the "library.name" attribute.
    return trace.getTracer("@squide/honeycomb");
}
