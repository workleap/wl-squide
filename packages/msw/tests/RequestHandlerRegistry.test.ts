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

test.concurrent("when the position is \"start\", the handlers are placed before the handlers registered with the \"end\" position", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const endHandler = createHandler("/api/end");
    const startHandler = createHandler("/api/start");

    registry.add([endHandler]);
    registry.add([startHandler], { position: "start" });

    expect(registry.handlers).toEqual([startHandler, endHandler]);
});

test.concurrent("when multiple registrations use the \"start\" position, their registration order is preserved", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const startHandler1 = createHandler("/api/start-1");
    const startHandler2 = createHandler("/api/start-2");
    const endHandler = createHandler("/api/end");

    registry.add([startHandler1], { position: "start" });
    registry.add([endHandler]);
    registry.add([startHandler2], { position: "start" });

    expect(registry.handlers).toEqual([startHandler1, startHandler2, endHandler]);
});

test.concurrent("when the position is \"end\", the handlers are placed after the handlers registered with the \"start\" position", ({ expect }) => {
    const registry = new RequestHandlerRegistry(new MswState());

    const startHandler = createHandler("/api/start");
    const endHandler = createHandler("/api/end");

    registry.add([startHandler], { position: "start" });
    registry.add([endHandler], { position: "end" });

    expect(registry.handlers).toEqual([startHandler, endHandler]);
});

test.concurrent("when msw is started, adding handlers with the \"start\" position throws", ({ expect }) => {
    const state = new MswState();
    const registry = new RequestHandlerRegistry(state);

    state.setAsReady();

    expect(() => registry.add([createHandler("/api/1")], { position: "start" })).toThrow(/cannot be registered once MSW is started/);
});

test.concurrent("when msw is started, adding handlers throws", ({ expect }) => {
    const state = new MswState();
    const registry = new RequestHandlerRegistry(state);

    state.setAsReady();

    expect(() => registry.add([createHandler("/api/1")])).toThrow(/cannot be registered once MSW is started/);
});
