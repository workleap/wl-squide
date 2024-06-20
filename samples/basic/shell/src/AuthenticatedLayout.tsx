import { useApplicationEventBusListener, useSessionManager } from "@basic/shared";
import { isNavigationLink, useFireflyNavigationItems, useRenderedNavigationItems, type NavigationLinkRenderProps, type NavigationSectionRenderProps, type RenderItemFunction, type RenderSectionFunction } from "@squide/firefly";
import { Suspense, useCallback, type MouseEvent, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Loading } from "./Loading.tsx";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, index: number, level: number) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, index: number, level: number) => ReactNode;

const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, additionalProps: { highlight, ...additionalProps } }, index, level) => {
    return (
        <li key={`${level}-${index}`} style={{ fontWeight: highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSectionItem: RenderSectionItemFunction = ({ label, section }, index, level) => {
    return (
        <li key={`${level}-${index}`} style={{ display: "flex", gap: "5px" }}>
            {label}
            <div style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                ({section})
            </div>
        </li>
    );
};

const renderItem: RenderItemFunction = (item, index, level) => {
    return isNavigationLink(item) ? renderLinkItem(item, index, level) : renderSectionItem(item, index, level);
};

const renderSection: RenderSectionFunction = (elements, index, level) => {
    return (
        <ul key={`${level}-${index}`} style={{ display: "flex", gap: "10px", padding: 0, listStyleType: "none" }}>
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

    const navigationItems = useFireflyNavigationItems();
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
