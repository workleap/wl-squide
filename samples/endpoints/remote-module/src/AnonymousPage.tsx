import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { i18NextInstanceKey } from "./i18next.ts";

export function AnonymousPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("AnonymousPage", { i18n: i18nextInstance });

    return (
        <>
            <h1>{t("title")}</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    components={{
                        code: <code />
                    }}
                />
            </p>
            <Link to="/">{t("goToHomePageLinkLabel")}</Link>
        </>
    );
}

/** @alias */
export const Component = AnonymousPage;
