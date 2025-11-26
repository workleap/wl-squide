import { fetchJson } from "@endpoints/shared";
import { useEnvironmentVariable } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

interface Location {
    id: number;
    name: string;
    type: string;
}

export function LocationsTab() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LocationsTab", { i18n: i18nextInstance });

    const rickAndMortyApiBaseUrl = useEnvironmentVariable("rickAndMortyApiBaseUrl");

    const { data: locations } = useSuspenseQuery({ queryKey: [`${rickAndMortyApiBaseUrl}location/1,2,3`], queryFn: () => {
        return fetchJson(`${rickAndMortyApiBaseUrl}location/1,2,3`);
    } });

    return (
        <div>
            <h2>{t("title")}</h2>
            <p style={{ backgroundColor: "purple", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    components={{ code: <code /> }}
                />
            </p>
            <div>
                {locations.map((x: Location) => {
                    return (
                        <div key={x.id}>
                            <span>{t("idLabel")}: {x.id}</span>
                            <span> - </span>
                            <span>{t("nameLabel")}: {x.name}</span>
                            <span> - </span>
                            <span>{t("typeLabel")}: {x.type}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
