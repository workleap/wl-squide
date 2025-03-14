import { Outlet } from "react-router";

export function RootLayout() {
    return (
        <div style={{ margin: "20px" }}>
            <Outlet />
        </div>
    );
}
