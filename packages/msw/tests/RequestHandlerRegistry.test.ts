import { http, HttpResponse } from "msw";
import { test } from "vitest";
import { MswState } from "../src/MswState.ts";
import { RequestHandlerRegistry } from "../src/RequestHandlerRegistry.ts";

function createHandler(path: string) {
    return http.get(path, () => HttpResponse.json([]));
}

test.concurrent("by default, handlers are appended in registration order", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const handler1 = createHandler("/api/1");
    const handler2 = createHandler("/api/2");
    const handler3 = createHandler("/api/3");

    registry.add([handler1, handler2]);
    registry.add([handler3]);

    expect(registry.handlers).toEqual([handler1, handler2, handler3]);
});

test.concurrent("when the prepend option is set, the handlers are placed before the appended handlers", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const appendedHandler = createHandler("/api/appended");
    const prependedHandler = createHandler("/api/prepended");

    registry.add([appendedHandler]);
    registry.add([prependedHandler], { prepend: true });

    expect(registry.handlers).toEqual([prependedHandler, appendedHandler]);
});

test.concurrent("when multiple registrations use the prepend option, their registration order is preserved", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const prependedHandler1 = createHandler("/api/prepended-1");
    const prependedHandler2 = createHandler("/api/prepended-2");
    const appendedHandler = createHandler("/api/appended");

    registry.add([prependedHandler1], { prepend: true });
    registry.add([appendedHandler]);
    registry.add([prependedHandler2], { prepend: true });

    expect(registry.handlers).toEqual([prependedHandler1, prependedHandler2, appendedHandler]);
});

test.concurrent("when handlers are appended after a prepended registration, they are placed after the prepended handlers", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const prependedHandler = createHandler("/api/prepended");
    const appendedHandler = createHandler("/api/appended");

    registry.add([prependedHandler], { prepend: true });
    registry.add([appendedHandler]);

    expect(registry.handlers).toEqual([prependedHandler, appendedHandler]);
});

test.concurrent("when msw is started, adding prepended handlers throws", ({ expect }) => {
    const state = new MswState();
    const registry = new RequestHandlerRegistry(state);

    state.setAsReady();

    expect(() => registry.add([createHandler("/api/1")], { prepend: true })).toThrow(/cannot be registered once MSW is started/);
});

test.concurrent("when msw is started, adding handlers throws", ({ expect }) => {
    const state = new MswState();
    const registry = new RequestHandlerRegistry(state);

    state.setAsReady();

    expect(() => registry.add([createHandler("/api/1")])).toThrow(/cannot be registered once MSW is started/);
});
