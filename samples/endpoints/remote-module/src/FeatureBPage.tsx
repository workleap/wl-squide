import { fetchJson, useTelemetryService } from "@endpoints/shared";
import { useI18nextInstance } from "@squide/i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

export function FeatureBPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("FeatureBPage", { i18n: i18nextInstance });

    const telemetryService = useTelemetryService();

    useEffect(() => {
        telemetryService?.track("Mounting FeatureBPage from remote-1.");
    }, [telemetryService]);

    const { data } = useSuspenseQuery({ queryKey: ["/api/feature-b"], queryFn: () => {
        return fetchJson("/api/feature-b");
    } });

    return (
        <>
            <h1>{t("title")}</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    components={{ code: <code /> }}
                />
            </p>
            <p dangerouslySetInnerHTML={{ __html: data.message }}></p>
        </>
    );
}

/** @alias */
export const Component = FeatureBPage;
