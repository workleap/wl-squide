import { test } from "vitest";
import { resolveRouteSegments } from "../src/resolveRouteSegments.ts";

test.concurrent("when there's no match, return the original route", ({ expect }) => {
    const to = "/page/:arg1";

    const values = {
        args2: "value-2"
    };

    const result = resolveRouteSegments(to, values);

    expect(result).toBe(result);
});

test.concurrent("when there's a single match, return the resolved route", ({ expect }) => {
    const to = "/page/:arg1";

    const values = {
        arg1: "value-1"
    };

    const result = resolveRouteSegments(to, values);

    expect(result).toBe("/page/value-1");
});

test.concurrent("when there's multiple matches, return the resolved route", ({ expect }) => {
    const to = "/page/:arg1/:arg2";

    const values = {
        arg1: "value-1",
        arg2: "value-2"
    };

    const result = resolveRouteSegments(to, values);

    expect(result).toBe("/page/value-1/value-2");
});

test.concurrent("when there's partial matches, return the partially resolved route", ({ expect }) => {
    const to = "/page/:arg1/:arg2";

    const values = {
        arg2: "value-2"
    };

    const result = resolveRouteSegments(to, values);

    expect(result).toBe("/page/:arg1/value-2");
});
