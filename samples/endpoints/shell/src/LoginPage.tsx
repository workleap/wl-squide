import { isApiError, postJson } from "@endpoints/shared";
import { useEnvironmentVariable } from "@squide/env-vars";
import { useI18nextInstance } from "@squide/i18next";
import { useCallback, useState, type ChangeEvent, type MouseEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

export interface LoginPageProps {
    host?: string;
}

export function LoginPage({ host }: LoginPageProps) {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LoginPage", { i18n: i18nextInstance });

    const authenticationApiBaseUrl = useEnvironmentVariable("authenticationApiBaseUrl");

    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isBusy, setIsBusy] = useState(false);

    const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        setIsBusy(true);
        setErrorMessage(undefined);

        postJson(`${authenticationApiBaseUrl}login`, { username, password })
            .then(() => {
                setIsBusy(false);

                // Reloading the whole application so the "RootRoute" component states are re-initialize.
                // If we use navigate("/") instead, since "isProtectedDataLoaded" might already be true in the case
                // of Logout -> Login, the rendering will bypass the loading of the protected data (including the session)
                // which will result in an incoherent state.
                // Anyhow, since all the Workleap apps will authenticate through a third party authentication provider, it
                // doesn't seems like a big deal as the application will be reloaded anyway after the user logged in with the third party.
                window.location.href = "/";
            })
            .catch((error: unknown) => {
                setIsBusy(false);

                if (isApiError(error) && error.status === 401) {
                    setErrorMessage(t("invalidCredentialsMessage"));
                } else {
                    throw error;
                }
            });
    }, [username, password, t, authenticationApiBaseUrl]);

    const handleUserNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    }, []);

    const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }, []);

    return (
        <>
            <h1>{t("title")}</h1>
            {host && (
                <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                    <Trans
                        i18n={i18nextInstance}
                        i18nKey="servedBy"
                        t={t}
                        shouldUnescape
                        values={{ host }}
                        components={{ code: <code /> }}
                    />
                </p>
            )}
            <form>
                <div>
                    <label htmlFor="username">{t("usernameLabel")}</label>
                    <input id="username" type="text" onChange={handleUserNameChange} />
                </div>
                <div>
                    <label htmlFor="password">{t("passwordLabel")}</label>
                    <input id="password" type="password" onChange={handlePasswordChange} />
                </div>
                <div>
                    <button type="submit" onClick={handleClick}>
                        {t("loginButtonLabel")}
                    </button>
                </div>
                <br />
                <div>{t("hintTitle")}</div>
                <div>
                    <Trans
                        i18n={i18nextInstance}
                        i18nKey="hintEnProfile"
                        t={t}
                        components={{ strong: <strong /> }}
                    />
                </div>
                <div>
                    <Trans
                        i18n={i18nextInstance}
                        i18nKey="hintFrProfile"
                        t={t}
                        components={{ strong: <strong /> }}
                    />
                </div>
                <br />
                {isBusy && <div style={{ color: "blue" }}>{t("loadingMessage")}</div>}
                {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
            </form>
        </>
    );
}

/** @alias */
export const Component = LoginPage;
