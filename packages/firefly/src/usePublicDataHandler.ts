import { useEffect } from "react";
import { useCanFetchPublicData } from "./useCanFetchPublicData.ts";

export function usePublicDataHandler(handler: () => void) {
    const canFetchPublicData = useCanFetchPublicData();

    useEffect(() => {
        if (canFetchPublicData) {
            handler();
        }
    }, [canFetchPublicData, handler]);
}
