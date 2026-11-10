import { toSubscriptionStatusLabel, useSubscription } from "@endpoints/shared";
import { useI18nextInstance } from "@squide/i18next";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

export function SubscriptionPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("SubscriptionPage", { i18n: i18nextInstance });

    const subscription = useSubscription();

    const statusLabel = toSubscriptionStatusLabel(subscription!.status, {
        trialLabel: t("trialLabel"),
        paidLabel: t("paidLabel"),
        notPaidLabel: t("notPaidLabel")
    });

    return (
        <>
            <h1>{t("title")}</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans i18n={i18nextInstance} i18nKey="servedBy" t={t} components={{ code: <code /> }} />
            </p>
            <div>
                <span>{t("companyLabel")}: </span>
                <span>{subscription?.company}</span>
            </div>
            <div>
                <span>{t("contactLabel")}: </span>
                <span>{subscription?.contact}</span>
            </div>
            <div>
                <span>{t("statusLabel")}: </span>
                <span>{statusLabel}</span>
            </div>
        </>
    );
}

/** @alias */
export const Component = SubscriptionPage;
