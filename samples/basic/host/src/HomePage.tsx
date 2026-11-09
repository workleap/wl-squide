export function HomePage() {
    return (
        <>
            <h1>Home Page</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                This page is served by <code>@basic/host</code>
            </p>
            <p>Hey! Welcome to this basic sample showcasing a few features of Squide.</p>
        </>
    );
}

/** @alias */
export const Component = HomePage;
