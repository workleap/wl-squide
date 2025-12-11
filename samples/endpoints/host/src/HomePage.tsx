import { fetchJson } from "@endpoints/shared";
import { useEnvironmentVariable, useFeatureFlag } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

interface Character {
    id: number;
    name: string;
    species: string;
}

export function HomePage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("HomePage", { i18n: i18nextInstance });

    const showCharacters = useFeatureFlag("show-characters", true);
    const rickAndMortyApiBaseUrl = useEnvironmentVariable("rickAndMortyApiBaseUrl");

    const { data: characters } = useSuspenseQuery({ queryKey: [`${rickAndMortyApiBaseUrl}character/1,2`], queryFn: () => {
        return fetchJson(`${rickAndMortyApiBaseUrl}character/1,2`);
    } });

    return (
        <div>
            <h2>{t("title")}</h2>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    components={{ code: <code /> }}
                />
            </p>
            {showCharacters && (
                <div>
                    {characters.map((x: Character) => {
                        return (
                            <div key={x.id}>
                                <span>{t("idLabel")}: {x.id}</span>
                                <span> - </span>
                                <span>{t("nameLabel")}: {x.name}</span>
                                <span> - </span>
                                <span>{t("speciesLabel")}: {x.species}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
