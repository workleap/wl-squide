export function SkillsTab() {
    return (
        <>
            <h2>Skills</h2>
            <p style={{ backgroundColor: "purple", color: "white", width: "fit-content" }}>
                This tab is served by <code>@basic/remote-module</code>
            </p>
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this tab:</p>
                <ul>
                    <li>
                        The tab has a priority of <code>999</code>, which renders it as the first tab header.
                    </li>
                </ul>
            </div>
        </>
    );
}

/** @alias */
export const Component = SkillsTab;
