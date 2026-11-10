import { BackgroundColorContext } from "@basic-webpack/shared";
import { AppRouter } from "@basic-webpack/shell";

export function App() {
    return (
        <BackgroundColorContext.Provider value="blue">
            <AppRouter />
        </BackgroundColorContext.Provider>
    );
}
