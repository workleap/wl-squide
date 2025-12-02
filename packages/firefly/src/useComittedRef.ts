import { RefObject, useEffect, useRef } from "react";

export function useCommittedRef<T = unknown>(value: T): RefObject<T> {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}
