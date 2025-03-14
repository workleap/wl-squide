import { Link } from "react-router";

export interface NoMatchPageProps {
    path: string;
    host?: string;
}

export function NoMatchPage({ path, host }: NoMatchPageProps) {
    return (
        <>
            <h1>404</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This page is served by <code>{host}</code></p>}
            <p>We can't find the path "{path}".</p>
            <Link to="/">Go back home</Link>
        </>
    );
}
