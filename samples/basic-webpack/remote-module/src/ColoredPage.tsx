import { useBackgroundColor } from "@basic-webpack/shared";
import { Link } from "react-router";

export function ColoredPage() {
    const backgroundColor = useBackgroundColor();

    return (
        <>
            <h1>Colored page</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This page is served by <code>@basic/remote-module</code></p>
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this page:</p>
                <ul>
                    <li>This page demonstrates that a React context defined in an host application can be overried in a remote module.</li>
                    {/* eslint-disable-next-line max-len */}
                    <li>The host application React context define that background color as <span style={{ backgroundColor: "blue", color: "white" }}>blue</span> and the nested React context in the remote module override the background color to be <span style={{ backgroundColor: "red", color: "white" }}>red</span>.</li>
                    <li>Toggle between the <Link to="/context-override">Context override</Link> and <Link to="/no-context-override">No context override</Link> pages to view the difference.</li>
                </ul>
            </div>
            <div style={{ backgroundColor, width: "fit-content" }}>
                <p>The background color is "{backgroundColor}"</p>
            </div>
        </>
    );
}

/** @alias */
export const Component = ColoredPage;
