import { useRenderedNavigationItems, useRuntimeNavigationItems, type NavigationLinkRenderProps, type RenderItemFunction, type RenderSectionFunction } from "@squide/firefly";
import { Suspense } from "react";
import { Link, Outlet } from "react-router";

export interface FederatedTabsLayoutProps {
    host?: string;
}

const renderItem: RenderItemFunction = (item, index, level) => {
    const { label, linkProps } = item as NavigationLinkRenderProps;

    return (
        <li key={`${level}-${index}`}>
            <Link {...linkProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = elements => {
    return (
        <ul style={{ listStyleType: "none", margin: 0, padding: 0, display: "flex", gap: "20px" }}>
            {elements}
        </ul>
    );
};

export function FederatedTabsLayout({ host }: FederatedTabsLayoutProps) {
    const navigationItems = useRuntimeNavigationItems({ menuId: "/federated-tabs" });
    const renderedTabs = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <h1>Tabs</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This layout is served by <code>{host}</code></p>}
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this pages:</p>
                <ul>
                    <li>This is a nested layout that renders tabs <strong>registered by distinct modules</strong>. This is what we call "Federated Tabs".</li>
                    <li>Every tab is lazy loaded with React Router.</li>
                    <li>Every tab has its own URL, allowing direct hit to the tab.</li>
                    <li>This layout takes cares of rendering a loading screen while a tab is being loaded.</li>
                </ul>
            </div>
            {renderedTabs}
            <div style={{ paddingTop: "20px" }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Outlet />
                </Suspense>
            </div>
        </>
    );
}

/** @alias */
export const Component = FederatedTabsLayout;


