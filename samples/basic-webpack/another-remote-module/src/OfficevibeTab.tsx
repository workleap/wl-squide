export function OfficevibeTab() {
    return (
        <>
            <h2>Officevibe</h2>
            <p style={{ backgroundColor: "purple", color: "white", width: "fit-content" }}>
                This tab is served by <code>@basic/another-remote-module</code>
            </p>
        </>
    );
}

/** @alias */
export const Component = OfficevibeTab;
