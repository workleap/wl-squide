import { Link } from "react-router-dom";

export function Logout() {
    return (
        <main>
            <h1>Logged out</h1>
            <div>You are logged out from the application!</div>
            <Link to="/login">Log in again</Link>
        </main>
    );
}
