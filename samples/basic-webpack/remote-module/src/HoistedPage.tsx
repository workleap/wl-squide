import { Link } from "react-router";

export function HoistedPage() {
    return (
        <>
            <h2>Hoisted</h2>
            <p style={{ backgroundColor: "purple", color: "white", width: "fit-content" }}>This page is served by <code>@basic/remote-module</code></p>
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this page:</p>
                <ul>
                    <li>This page is using Squide hoist feature, meaning that it doesn't inherit from the root layout and error boundary.</li>
                    <li>This page navigation item's label is defined with a custom component, allowing the navigation item color to be rendered green.</li>
                </ul>
            </div>
            <p>This is an hoisted page!</p>
            <Link to="/">Go back to home</Link>
        </>
    );
}

/** @alias */
export const Component = HoistedPage;
