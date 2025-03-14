import { useApplicationEventBusListener, useSessionManager } from "@basic/shared";
import { isNavigationLink, useNavigationItems, useRenderedNavigationItems, type NavigationLinkRenderProps, type NavigationSectionRenderProps, type RenderItemFunction, type RenderSectionFunction } from "@squide/firefly";
import { Suspense, useCallback, type MouseEvent, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Loading } from "./Loading.tsx";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, key: string) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, key: string) => ReactNode;

const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, additionalProps: { highlight, ...additionalProps } }, key) => {
    return (
        <li key={key} style={{ fontWeight: highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSectionItem: RenderSectionItemFunction = ({ label, section }, key) => {
    return (
        <li key={key} style={{ display: "flex", gap: "5px" }}>
            {label}
            <div style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                ({section})
            </div>
        </li>
    );
};

const renderItem: RenderItemFunction = (item, key) => {
    return isNavigationLink(item) ? renderLinkItem(item, key) : renderSectionItem(item, key);
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key} style={{ display: "flex", gap: "10px", padding: 0, listStyleType: "none" }}>
            {elements}
        </ul>
    );
};

export function AuthenticatedLayout() {
    const sessionManager = useSessionManager();
    const session = sessionManager?.getSession();

    const navigate = useNavigate();

    const handleModulesMessage = useCallback((data: unknown) => {
        console.log("[sample] Message received from a module: ", data);
    }, []);

    useApplicationEventBusListener("write-to-host", handleModulesMessage);

    const handleDisconnect = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        sessionManager?.clearSession();

        navigate("/logout");
    }, [navigate, sessionManager]);

    const navigationItems = useNavigationItems();
    const renderedNavigationItems = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <div style={{ display: "flex", alignItems: "center" }}>
                <nav style={{ width: "100%" }}>
                    {renderedNavigationItems}
                </nav>
                <div style={{ whiteSpace: "nowrap", marginRight: "20px" }}>
                    (User: <span style={{ fontWeight: "bold" }}>{session?.user?.name}</span>)
                </div>
                <div>
                    <button type="button" onClick={handleDisconnect}>Disconnect</button>
                </div>
            </div>
            <Suspense fallback={<Loading />}>
                <Outlet />
            </Suspense>
        </>
    );
}
