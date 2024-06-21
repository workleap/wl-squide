import { isNil } from "@squide/core";
import { useMemo, type ReactNode } from "react";
import type { LinkProps } from "react-router-dom";
import { isLinkItem, type NavigationItem, type NavigationLink, type NavigationSection, type RootNavigationItem } from "./navigationItemRegistry.ts";

export interface NavigationLinkRenderProps {
    key?: string;
    label: ReactNode;
    linkProps: Omit<LinkProps, "children">;
    additionalProps: Record<string, unknown>;
}

export interface NavigationSectionRenderProps {
    key?: string;
    label: ReactNode;
    section: ReactNode;
    additionalProps: Record<string, unknown>;
}

export type NavigationItemRenderProps = NavigationLinkRenderProps | NavigationSectionRenderProps;

export function isNavigationLink(item: NavigationItemRenderProps): item is NavigationLinkRenderProps {
    return !isNil((item as NavigationLinkRenderProps).linkProps);
}

export type RenderItemFunction = (item: NavigationItemRenderProps, key: string, index: number, level: number) => ReactNode;

export type RenderSectionFunction = (elements: ReactNode[], key: string, index: number, level: number) => ReactNode;

function toLinkProps({ $key, $label, $additionalProps, ...linkProps }: NavigationLink): NavigationLinkRenderProps {
    return {
        key: $key,
        label: $label,
        linkProps,
        additionalProps: $additionalProps ?? {}
    };
}

function toMenuProps({ $key, $label, $additionalProps }: NavigationSection, sectionElement: ReactNode): NavigationSectionRenderProps {
    return {
        key: $key,
        label: $label,
        section: sectionElement,
        additionalProps: $additionalProps ?? {}
    };
}

function renderItems(items: NavigationItem[], renderItem: RenderItemFunction, renderSection: RenderSectionFunction, key: string, index: number, level: number) {
    const itemElements = items.map((x, itemIndex) => {
        let itemElement: ReactNode;

        if (isLinkItem(x)) {
            itemElement = renderItem(toLinkProps(x), x.$key ? x.$key : `${itemIndex}-${level}`, itemIndex, level);
        } else {
            const sectionIndex = 0;
            const sectionLevel = level + 1;
            const sectionElement = renderItems(x.children, renderItem, renderSection, x.$key ? x.$key : `${sectionIndex}-${sectionLevel}`, sectionIndex, sectionLevel);

            itemElement = renderItem(toMenuProps(x, sectionElement), x.$key ? x.$key : `${itemIndex}-${level}`, itemIndex, level);
        }

        return itemElement;
    });

    return renderSection(itemElements, key ? key : `${index}-${level}`, index, level);
}

export function useRenderedNavigationItems(
    navigationItems: RootNavigationItem[],
    renderItem: RenderItemFunction,
    renderSection: RenderSectionFunction
) {
    return useMemo(() => {
        // Highest priority is rendered first.
        const sortedItems = [...navigationItems]
            .sort((x, y) => {
                // Default an item priority to 0 to support negative priority.
                const xp = x.$priority ?? 0;
                const yp = y.$priority ?? 0;

                if (xp === yp) {
                    return 0;
                }

                return xp! > yp! ? -1 : 1;
            })
            // priority is intentionally omitted.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ $priority, ...itemProps }) => itemProps);

        return renderItems(sortedItems, renderItem, renderSection, "root", 0, 0);
    }, [navigationItems, renderItem, renderSection]);
}
