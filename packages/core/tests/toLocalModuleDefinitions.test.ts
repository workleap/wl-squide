import { test } from "vitest";
import { toLocalModuleDefinitions } from "../src/registration/LocalModuleRegistry.ts";

test.concurrent("filter undefined modules", ({ expect }) => {
    const result = toLocalModuleDefinitions([() => {}, undefined, () => {}]);

    expect(result.length).toBe(2);
});
