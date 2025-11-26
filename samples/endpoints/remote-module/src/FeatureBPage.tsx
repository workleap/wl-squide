import { fetchJson } from "@endpoints/shared";
import { useEnvironmentVariable } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

export function FeatureBPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("FeatureBPage", { i18n: i18nextInstance });

    const featureApiBaseUrl = useEnvironmentVariable("featureApiBaseUrl");

    const { data } = useSuspenseQuery({ queryKey: [`${featureApiBaseUrl}getFeatureB`], queryFn: () => {
        return fetchJson(`${featureApiBaseUrl}getFeatureB`);
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
