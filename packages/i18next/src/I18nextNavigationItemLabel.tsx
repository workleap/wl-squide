import type { i18n } from "i18next";
import { useTranslation } from "react-i18next";

export interface I18nextNavigationItemLabelProps {
    i18next: i18n;
    namespace?: string;
    resourceKey: string;
}

export function I18nextNavigationItemLabel(props: I18nextNavigationItemLabelProps) {
    const { i18next, namespace = "navigationItems", resourceKey } = props;

    const { t } = useTranslation(namespace, { i18n: i18next });

    return t(resourceKey);
}
