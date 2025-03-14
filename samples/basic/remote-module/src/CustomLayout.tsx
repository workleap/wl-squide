import { Outlet } from "react-router";

export function CustomLayout() {
    return (
        <div style={{ margin: "20px" }}>
            <h1>Custom layout</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This layout is served by <code>@basic/remote-module</code></p>
            <Outlet />
        </div>
    );
}

/** @alias */
export const Component = CustomLayout;
