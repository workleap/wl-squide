export function isNull(value: unknown): value is null {
    return value == null;
}

export function isUndefined(value: unknown): value is undefined {
    return typeof value === "undefined" || value === undefined;
}

export function isDefined(value: unknown) {
    return typeof value !== "undefined" && value !== undefined;
}

export function isNil(value: unknown): value is null | undefined {
    return isNull(value) || isUndefined(value);
}

export function isNilOrEmpty(value: unknown): value is null | undefined | "" {
    return isNil(value) || value === "";
}

// Using "unknown" loses the typings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(value: unknown): value is (...args: any[]) => any {
    return typeof value === "function";
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (Object.prototype.toString.call(value) !== "[object Object]") {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return prototype === null || prototype === Object.prototype;
}

