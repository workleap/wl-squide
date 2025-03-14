import type { Span } from "@opentelemetry/api";
import type { FetchRequestHookFunction } from "@opentelemetry/instrumentation-fetch";
import { isPlainObject } from "@squide/core";
import type { RuntimeLogger } from "@squide/firefly";
import { v4 as uuidv4 } from "uuid";
import { createTraceContextId } from "./createTraceContextId.ts";

declare global {
    interface Window { __SQUIDE_HONEYCOMB_ACTIVE_SPAN_STACK__: ActiveSpanStack }
}

const GlobalActiveSpanStackVariableName = "__SQUIDE_HONEYCOMB_ACTIVE_SPAN_STACK__";

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
            throw new Error("[honeycomb] Unexpected pop, the active span stack is empty.");
        }

        if (head.id !== span.id) {
            throw new Error(`[honeycomb] The active span is not the expected span. Expected to pop span with name and id "${span.name} / ${span.id}" but found "${head.name} / ${head.id}". Did you forget to end an active span?`);
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

export function registerActiveSpanStack() {
    if (window[GlobalActiveSpanStackVariableName]) {
        throw new Error(`[honeycomb] An ActiveSpanStack instance has already been registered to window.${GlobalActiveSpanStackVariableName}. Did you register the Honeycomb instrumentation twice?`);
    }

    window[GlobalActiveSpanStackVariableName] = new ActiveSpanStack();
}

function getActiveSpanStack() {
    return window[GlobalActiveSpanStackVariableName] as ActiveSpanStack;
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

let overrideFetchRequestSpanWithActiveSpanContextMock: FetchRequestHookFunction | undefined;

// This function should only be used by tests.
export function __setOverrideFetchRequestSpanWithActiveSpanContextMock(fct: FetchRequestHookFunction) {
    overrideFetchRequestSpanWithActiveSpanContextMock = fct;
}

// This function should only be used by tests.
export function __clearOverrideFetchRequestSpanWithActiveSpanContextMock() {
    overrideFetchRequestSpanWithActiveSpanContextMock = undefined;
}

export function createOverrideFetchRequestSpanWithActiveSpanContext(logger: RuntimeLogger) {
    if (overrideFetchRequestSpanWithActiveSpanContextMock) {
        return overrideFetchRequestSpanWithActiveSpanContextMock;
    }

    const fct: FetchRequestHookFunction = (span, request) => {
        const activeSpan = getActiveSpan();

        if (activeSpan) {
            const activeSpanContext = activeSpan.instance.spanContext();
            const requestSpanContext = span.spanContext();

            if (activeSpanContext) {
                logger.debug(
                    "[squide] Found a Honeycomb active context to apply to the following fetch request: \r\n",
                    "Request span context: ", requestSpanContext, "\r\n",
                    "Active span context: ", activeSpanContext, "\r\n",
                    "Request: ", request, "\r\n"
                );

                span.setAttribute("trace.trace_id", activeSpanContext.traceId);
                span.setAttribute("trace.parent_id", activeSpanContext.spanId);

                const traceParent = createTraceContextId(activeSpanContext.traceId, requestSpanContext.spanId, requestSpanContext.traceFlags);

                if (request instanceof Request) {
                    request.headers.set("traceparent", traceParent);
                } else if (isPlainObject(request.headers)) {
                    request.headers["traceparent"] = traceParent;
                }
            }
        }
    };

    return fct;
}
