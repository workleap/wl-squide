import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

const featureFlags = new Map([
    ["feature-a", true],
    ["feature-b", true],
    ["feature-c", true],
    ["feature-d", true]
] as const);

const featureFlagsClient = createLocalStorageLaunchDarklyClient("endpoints-sample-feature-flags", featureFlags);

interface FeatureFlagEntryProps {
    id: string;
    value: boolean;
}

function FeatureFlagEntry(props: FeatureFlagEntryProps) {
    const {
        id,
        value
    } = props;

    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LocalStorageFeatureFlagsPage", { i18n: i18nextInstance });

    const handleToggle = useCallback(() => {
        featureFlagsClient.setFeatureFlags({
            [id]: !value
        });
    }, [id, value]);

    return (
        <div>
            <span>{id}</span>
            <span style={{ marginLeft: "10px", marginRight: "10px" }}>|</span>
            <span>{value ? "true" : "false"}</span>
            <button type="button" onClick={handleToggle} style={{ marginLeft: "10px" }}>{t("toggleButtonLabel")}</button>
        </div>
    );
}

const subscribeToFeatureFlags = (callback: () => void) => {
    featureFlagsClient.on("change", callback);

    return () => {
        featureFlagsClient.off("change", callback);
    };
};

export function LocalStorageFeatureFlagsPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LocalStorageFeatureFlagsPage", { i18n: i18nextInstance });

    const allFlags = useSyncExternalStore(subscribeToFeatureFlags, () => featureFlagsClient.allFlags());

    return (
        <div>
            <h2>{t("title")}</h2>
            {Object.keys(allFlags).map(x => (
                <FeatureFlagEntry key={x} id={x} value={allFlags[x]} />
            ))}
        </div>
    );
}
