import type { Span } from "@opentelemetry/api";
import { isPlainObject } from "@squide/core/internal";
import type { Logger } from "@workleap/logging";
import { v4 as uuidv4 } from "uuid";
import { createTraceContextId } from "./createTraceContextId.ts";

export type ActiveSpanId = string;

export interface ActiveSpan {
    id: ActiveSpanId;
    name: string;
    instance: Span;
}

// Using a stack because we want a Last In First Out implementation for this.
// https://github.com/open-telemetry/opentelemetry-js/issues/5084
// https://github.com/open-telemetry/opentelemetry-js/issues/3558#issuecomment-1760680244
class ActiveSpanStack {
    readonly #stack: ActiveSpan[] = [];

    push(span: ActiveSpan) {
        this.#stack.push(span);
    }

    pop(span: ActiveSpan) {
        const head = this.#stack.pop();

        if (!head) {
            throw new Error("[squide] Unexpected pop, the active Honeycomb span stack is empty.");
        }

        if (head.id !== span.id) {
            throw new Error(`[squide] The active Honeycomb span is not the expected span. Expected to pop span with name and id "${span.name} / ${span.id}" but found "${head.name} / ${head.id}". Did you forget to end an active span?`);
        }

        return head;
    }

    peek() {
        if (this.#stack.length === 0) {
            return undefined;
        }

        return this.#stack[this.#stack.length - 1];
    }
}

const GlobalActiveSpanStackVariableName = "__SQUIDE_HONEYCOMB_ACTIVE_SPAN_STACK__";

export function registerActiveSpanStack() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (globalThis[GlobalActiveSpanStackVariableName]) {
        throw new Error(`[squide] An ActiveSpanStack instance has already been registered to globalThis.${GlobalActiveSpanStackVariableName}. Did you register the Honeycomb instrumentation twice?`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis[GlobalActiveSpanStackVariableName] = new ActiveSpanStack();
}

function getActiveSpanStack() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return globalThis[GlobalActiveSpanStackVariableName] as ActiveSpanStack;
}

function getActiveSpan() {
    const stack = getActiveSpanStack();

    if (stack) {
        return stack.peek();
    }
}

export function setActiveSpan(name: string, span: Span) {
    const activeSpan: ActiveSpan = {
        id: uuidv4(),
        name: name,
        instance: span
    };

    const stack = getActiveSpanStack();

    if (stack) {
        stack.push(activeSpan);
    }

    return activeSpan;
}

export function popActiveSpan(span: ActiveSpan) {
    const stack = getActiveSpanStack();

    if (stack) {
        stack.pop(span);
    }
}

export function createOverrideFetchRequestSpanWithActiveSpanContext(logger: Logger) {
    return (span: Span, request: Request | RequestInit) => {
        const activeSpan = getActiveSpan();

        if (activeSpan) {
            const activeSpanContext = activeSpan.instance.spanContext();
            const requestSpanContext = span.spanContext();

            if (activeSpanContext) {
                logger
                    .withText("[squide] Found a Honeycomb active context to apply to the following fetch request:")
                    .withLineChange()
                    .withText("Request span context:")
                    .withObject(requestSpanContext)
                    .withLineChange()
                    .withText("Active span context:")
                    .withObject(activeSpanContext)
                    .withLineChange()
                    .withText("Request:")
                    .withObject(request)
                    .debug();

                span.setAttribute("trace.trace_id", activeSpanContext.traceId);
                span.setAttribute("trace.parent_id", activeSpanContext.spanId);

                const traceParent = createTraceContextId(activeSpanContext.traceId, requestSpanContext.spanId, requestSpanContext.traceFlags);

                if (request instanceof Request) {
                    request.headers.set("traceparent", traceParent);
                } else if (isPlainObject(request.headers)) {
                    request.headers["traceparent"] = traceParent;
                }

                // Indicates to not propagate the requests to the subsequent hooks.
                return true;
            }
        }
    };
}
