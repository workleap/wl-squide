export function WorkleapTab() {
    return (
        <>
            <h2>Workleap</h2>
            <p style={{ backgroundColor: "purple", color: "white", width: "fit-content" }}>
                This tab is served by <code>@basic/local-module</code>
            </p>
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this tab:</p>
                <ul>
                    <li>
                        The tab is marked as the <code>index</code>, which makes him the default tab to be showned.
                    </li>
                </ul>
            </div>
        </>
    );
}

/** @alias */
export const Component = WorkleapTab;
