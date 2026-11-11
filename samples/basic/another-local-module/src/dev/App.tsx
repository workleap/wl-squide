import { BackgroundColorContext } from "@basic/shared";
import { AppRouter } from "@basic/shell";

export function App() {
    return (
        <BackgroundColorContext.Provider value="blue">
            <AppRouter />
        </BackgroundColorContext.Provider>
    );
}
