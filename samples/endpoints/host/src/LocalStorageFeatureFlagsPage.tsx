import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { i18NextInstanceKey } from "./i18next.ts";

const featureFlagsClient = createLocalStorageLaunchDarklyClient({
    "enable-log-rocket": true,
    "enable-honeycomb": true,
    "register-local-module": true,
    "register-remote-module": true,
    "show-characters": true
});

let featureFlags = featureFlagsClient.allFlags();

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

function subscribeToFeatureFlags(callback: () => void) {
    const handleChange = () => {
        // HACK: to support "useSyncExternalStore" a new reference must be created everytime the
        // feature flags are updated.
        featureFlags = { ...featureFlagsClient.allFlags() };

        callback();
    };

    featureFlagsClient.on("change", handleChange);

    return () => {
        featureFlagsClient.off("change", handleChange);
    };
};

export function LocalStorageFeatureFlagsPage() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("LocalStorageFeatureFlagsPage", { i18n: i18nextInstance });

    const allFlags = useSyncExternalStore(subscribeToFeatureFlags, () => featureFlags);

    return (
        <div>
            <h2>{t("title")}</h2>
            {Object.keys(allFlags).map(x => (
                <FeatureFlagEntry key={x} id={x} value={allFlags[x]} />
            ))}
        </div>
    );
}
