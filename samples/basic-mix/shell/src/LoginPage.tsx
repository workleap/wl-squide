import { useIsAuthenticated, useSessionManager } from "@basic-mix/shared";
import { useCallback, useState, type ChangeEvent, type MouseEvent } from "react";
import { Navigate, useNavigate } from "react-router";

export interface LoginProps {
    host?: string;
}

export function LoginPage({ host }: LoginProps) {
    const sessionManager = useSessionManager();

    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (username === "temp" && password === "temp") {
            sessionManager?.setSession({
                user: {
                    name: username
                }
            });

            navigate("/");
        }
    }, [username, password, navigate, sessionManager]);

    const handleUserNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    }, []);

    const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }, []);

    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        return <Navigate to="/" />;
    }

    return (
        <>
            <h1>Login</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This page is served by <code>{host}</code></p>}
            <form>
                <div>
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" onChange={handleUserNameChange} />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" onChange={handlePasswordChange} />
                </div>
                <div>
                    <button type="submit" onClick={handleClick}>
                        Login
                    </button>
                </div>
                <br />
                <div>Hint: use temp/temp :)</div>
            </form>
        </>
    );
}
