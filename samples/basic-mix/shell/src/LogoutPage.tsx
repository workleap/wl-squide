import { Link } from "react-router";

export interface LogoutPageProps {
    host?: string;
}

export function LogoutPage({ host }: LogoutPageProps) {
    return (
        <>
            <h1>Logged out</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This page is served by <code>{host}</code></p>}
            <div>You are logged out from the application!</div>
            <Link to="/login">Log in again</Link>
        </>
    );
}

/** @alias */
export const Component = LogoutPage;
