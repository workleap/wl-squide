import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Object.groupBy is not available in Node.js < 21, polyfill for test environments.
if (!Object.groupBy) {
    Object.groupBy = function<T>(items: Iterable<T>, keyFn: (item: T, index: number) => PropertyKey) {
        const result: Record<PropertyKey, T[]> = Object.create(null);
        let index = 0;
        for (const item of items) {
            const key = keyFn(item, index++);
            if (key in result) {
                result[key].push(item);
            } else {
                result[key] = [item];
            }
        }
        return result;
    };
}

afterEach(() => {
    cleanup();
});
