import { useEffect } from "react";
import { useCanFetchProtectedData } from "./useCanFetchProtectedData.ts";

export function useProtectedDataHandler(handler: () => void) {
    const canFetchProtectedData = useCanFetchProtectedData();

    useEffect(() => {
        if (canFetchProtectedData) {
            handler();
        }
    }, [canFetchProtectedData, handler]);
}
