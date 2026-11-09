import { isApiError } from "@endpoints/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                if (isApiError(error) && (error.status === 401 || error.status === 403)) {
                    return false;
                }

                return failureCount <= 2;
            },
            refetchInterval: 5 * 60 * 1000
        }
    }
});

export function QueryProvider({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
