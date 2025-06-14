// Creates the trace context id based on the following opentelemetry-js implementation: https://github.com/open-telemetry/opentelemetry-js/blob/main/packages/opentelemetry-core/src/trace/W3CTraceContextPropagator.ts

const VERSION = "00";

enum TraceFlags {
    NONE = 0x0,
    SAMPLED = 0x1 << 0
}

export function createTraceContextId(traceId: string, spanId: string, traceFlags: number) {
    return `${VERSION}-${traceId}-${spanId}-0${Number(traceFlags || TraceFlags.NONE).toString(16)}`;
}
