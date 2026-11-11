import { AppRouter } from "@endpoints/shell";
import { QueryProvider } from "../QueryProvider.tsx";

export function App() {
    return (
        <QueryProvider>
            <AppRouter />
        </QueryProvider>
    );
}
