import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { i18NextInstanceKey } from "./i18next.ts";

export interface NoMatchPageProps {
    path: string;
    host?: string;
}

export function NoMatchPage({ path, host }: NoMatchPageProps) {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("NoMatchPage", { i18n: i18nextInstance });

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
            <p>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="message"
                    t={t}
                    shouldUnescape
                    values={{ path }}
                />
            </p>
            <Link to="/">{t("goBackLinkLabel")}</Link>
        </>
    );
}

/** @alias */
export const Component = NoMatchPage;
