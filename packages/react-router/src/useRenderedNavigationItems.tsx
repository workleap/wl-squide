import { isNil } from "@squide/core/internal";
import { useMemo, type ReactNode } from "react";
import type { LinkProps } from "react-router";
import { isLinkItem, type NavigationItem, type NavigationLink, type NavigationSection, type RootNavigationItem } from "./NavigationItemRegistry.ts";

export interface NavigationLinkRenderProps {
    label: ReactNode;
    linkProps: Omit<LinkProps, "children">;
    additionalProps: Record<string, unknown>;
    meta: Record<string, unknown>;
    canRender?: (obj?: unknown) => boolean;
}

export interface NavigationSectionRenderProps {
    label: ReactNode;
    section: ReactNode;
    additionalProps: Record<string, unknown>;
    meta: Record<string, unknown>;
    canRender?: (obj?: unknown) => boolean;
}

export type NavigationItemRenderProps = NavigationLinkRenderProps | NavigationSectionRenderProps;

export function isNavigationLink(item: NavigationItemRenderProps): item is NavigationLinkRenderProps {
    return !isNil((item as NavigationLinkRenderProps).linkProps);
}

export type RenderItemFunction = (item: NavigationItemRenderProps, key: string, index: number, level: number) => ReactNode;

export type RenderSectionFunction = (elements: ReactNode[], key: string, index: number, level: number) => ReactNode;

// A "$" prefixed prop is Squide metadata and must never reach the react-router Link component,
// otherwise it ends up as an invalid attribute on the rendered DOM element.
function stripMetadataProps<T>(props: T): T {
    return Object.fromEntries(
        Object.entries(props as Record<string, unknown>).filter(([key]) => !key.startsWith("$"))
    ) as T;
}

function toLinkProps({
    $label,
    $additionalProps,
    $meta,
    $canRender,
    // All the remaining props that belongs to the react-router Link component.
    ...linkProps
}: NavigationLink): NavigationLinkRenderProps {
    return {
        label: $label,
        linkProps: stripMetadataProps(linkProps),
        additionalProps: $additionalProps ?? {},
        meta: $meta ?? {},
        canRender: $canRender
    };
}

function toMenuProps({ $label, $additionalProps, $meta, $canRender }: NavigationSection, sectionElement: ReactNode): NavigationSectionRenderProps {
    return {
        label: $label,
        section: sectionElement,
        additionalProps: $additionalProps ?? {},
        meta: $meta ?? {},
        canRender: $canRender
    };
}

function renderItems(items: NavigationItem[], renderItem: RenderItemFunction, renderSection: RenderSectionFunction, key: string, index: number, level: number) {
    const itemElements = items.map((x, itemIndex) => {
        let itemElement: ReactNode;

        if (isLinkItem(x)) {
            itemElement = renderItem(toLinkProps(x), x.$id ?? `${itemIndex}-${level}`, itemIndex, level);
        } else {
            const sectionIndex = 0;
            const sectionLevel = level + 1;
            const sectionElement = renderItems(x.children, renderItem, renderSection, x.$id ?? `${sectionIndex}-${sectionLevel}`, sectionIndex, sectionLevel);

            itemElement = renderItem(toMenuProps(x, sectionElement), x.$id ?? `${itemIndex}-${level}`, itemIndex, level);
        }

        return itemElement;
    });

    // Filter out elements that are null or undefined because of the "shouldRender" prop.
    const renderedElements = itemElements.filter(x => x);

    if (renderedElements.length > 0) {
        return renderSection(renderedElements, key ?? `${index}-${level}`, index, level);
    }
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

                return xp > yp ? -1 : 1;
            });

        // "$priority" doesn't have to be omitted here, "toLinkProps" strips every "$" prefixed prop.
        return renderItems(sortedItems, renderItem, renderSection, "root", 0, 0);
    }, [navigationItems, renderItem, renderSection]);
}
