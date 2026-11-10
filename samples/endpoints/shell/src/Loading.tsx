import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

export function Loading() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("AppRouter", { i18n: i18nextInstance });

    return <div>{t("loadingMessage")}</div>;
}
