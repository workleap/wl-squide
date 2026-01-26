import { useCallback, useRef } from "react";

// Not using useEffect or useLayoutEffect because this utility hook is often used to dispatch events
// and it messed with the events dispatch order.
export function useExecuteOnce(fct: () => boolean, inline: boolean = false) {
    const triggered = useRef(false);

    const onceFct = useCallback(() => {
        if (!triggered.current) {
            const result = fct();

            if (result) {
                triggered.current = true;
            }
        }
    }, [fct]);

    if (inline) {
        // eslint-disable-next-line react-hooks/refs
        onceFct();
    }

    return onceFct;
}
