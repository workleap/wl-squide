import { test } from "vitest";
import { toRemoteModuleDefinitions } from "../src/RemoteModuleRegistry.ts";

test.concurrent("filter undefined modules", ({ expect }) => {
    const result = toRemoteModuleDefinitions([{ name: "module-1" }, undefined, { name: "module-2" }]);

    expect(result.length).toBe(2);
});
