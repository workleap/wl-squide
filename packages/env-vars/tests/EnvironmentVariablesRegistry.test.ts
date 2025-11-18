import { describe, test } from "vitest";
import { EnvironmentVariablesRegistry } from "../src/EnvironmentVariablesRegistry.ts";

declare module "../src/EnvironmentVariablesRegistry.ts" {
    interface EnvironmentVariables {
        foo: string;
        bar: number;
        john: string;
    }
}

describe.concurrent("add", () => {
    test.concurrent("should add a new variable", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.add("foo", "bar");

        expect(registry.getVariable("foo")).toBe("bar");
    });

    test.concurrent("when a variable already exist and the value is the same, do nothing", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.add("foo", "bar");
        registry.add("foo", "bar");

        expect(registry.getVariable("foo")).toBe("bar");
    });

    test.concurrent("when a variable already exist and the value is different, throw an error", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.add("foo", "bar1");

        expect(() => registry.add("foo", "bar2")).toThrow();
    });
});

describe.concurrent("addVariables", () => {
    test.concurrent("add all variables", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.addVariables({
            foo: "1",
            bar: 2
        });

        expect(registry.getVariable("foo")).toBe("1");
        expect(registry.getVariable("bar")).toBe(2);
    });

    test.concurrent("when one of the variable already exist and the value is different, throw an error", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.add("foo", "1");

        expect(() => registry.addVariables({
            foo: "2",
            bar: 2
        })).toThrow();
    });
});

describe.concurrent("getVariable", () => {
    test.concurrent("when the key doesn't match any value, throw an error", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        expect(() => registry.getVariable("foo")).toThrow();
    });
});

describe.concurrent("getVariables", () => {
    test.concurrent("return all the variables", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.addVariables({
            "foo": "1",
            bar: 2
        });

        const variables = registry.getVariables();

        expect(Object.keys(variables).length).toBe(2);
        expect(variables["foo"]).toBe("1");
        expect(variables["bar"]).toBe(2);
    });

    test.concurrent("the returned variables object is immutable", ({ expect }) => {
        const registry = new EnvironmentVariablesRegistry();

        registry.add("foo", "1");

        const result1 = registry.getVariables();
        const result2 = registry.getVariables();

        expect(result1).toBe(result2);

        registry.add("bar", 2);

        const result3 = registry.getVariables();

        expect(result1).not.toBe(result3);
        expect(result2).not.toBe(result3);

        registry.addVariables({
            john: "doe"
        });

        const result4 = registry.getVariables();

        expect(result3).not.toBe(result4);
    });
});
