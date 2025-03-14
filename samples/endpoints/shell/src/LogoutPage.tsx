import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { i18NextInstanceKey } from "./i18next.ts";

export interface LogoutPageProps {
    host?: string;
}

export function LogoutPage({ host }: LogoutPageProps) {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LogoutPage", { i18n: i18nextInstance });

    return (
        <>
            <h1>{t("title")}</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    shouldUnescape
                    values={{ host }}
                    components={{ code: <code /> }}
                />
            </p>}
            <div>{t("message")}</div>
            <Link to="/login">{t("loginButtonLabel")}</Link>
        </>
    );
}

/** @alias */
export const Component = LogoutPage;
