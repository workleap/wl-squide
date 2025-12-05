import { http, HttpResponse } from "msw";
import { test } from "vitest";
import { MswState } from "../src/MswState.ts";
import { RequestHandlerRegistry } from "../src/RequestHandlerRegistry.ts";

/*

- can add an handler when msw is not ready

- when an handler is added after msw is ready, an error is thrown

*/

test.concurrent.only("can add an handler when msw is not ready", ({ expect }) => {
    const state = new MswState();
    const registry = new RequestHandlerRegistry(state);

    registry.add([
        http.get("/foo", () => HttpResponse.json()),
        http.get("/bar", () => HttpResponse.json())
    ]);

    expect(registry.handlers.length).toBe(2);
});
