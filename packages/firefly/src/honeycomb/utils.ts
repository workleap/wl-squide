import { type Context, type Exception, context as otelContext, trace as otelTrace, type Span, SpanKind, type SpanOptions, SpanStatusCode, type TimeInput } from "@opentelemetry/api";
import { type ActiveSpan, popActiveSpan, setActiveSpan } from "./activeSpan.ts";

export type StartSpanFactory = (options?: SpanOptions, context?: Context) => Span;

export function startSpan(factory: StartSpanFactory) {
    return factory({ kind: SpanKind.CLIENT });
}

export type StartChildSpanFactory = (options?: SpanOptions, context?: Context) => Span;

export function startChildSpan(parent: Span, factory: StartChildSpanFactory) {
    const context = otelTrace.setSpan(otelContext.active(), parent);

    return factory({ kind: SpanKind.CLIENT }, context);
}

export interface StartActiveSpanFactoryReturn {
    name: string;
    span: Span;
}

export type StartActiveSpanFactory = (options?: SpanOptions, context?: Context) => StartActiveSpanFactoryReturn;

export function startActiveSpan(factory: StartActiveSpanFactory) {
    const { name, span } = factory({ kind: SpanKind.CLIENT });

    return setActiveSpan(name, span);
}

export interface StartActiveChildSpanFactoryReturn {
    name: string;
    span: Span;
}

export type StartActiveChildSpanFactory = (options?: SpanOptions, context?: Context) => StartActiveChildSpanFactoryReturn;

export function startActiveChildSpan(parent: Span, factory: StartActiveChildSpanFactory) {
    const context = otelTrace.setSpan(otelContext.active(), parent);

    const { name, span } = factory({ kind: SpanKind.CLIENT }, context);

    return setActiveSpan(name, span);
}

export function endActiveSpan(span: ActiveSpan) {
    span.instance.end();

    popActiveSpan(span);
}

export interface TraceErrorOptions {
    time?: TimeInput;
}

export function traceError(span: Span, error: Exception, options: TraceErrorOptions = {}) {
    const { time } = options;

    span.recordException(error, time);

    span.setStatus({
        code: SpanStatusCode.ERROR
    });
}
