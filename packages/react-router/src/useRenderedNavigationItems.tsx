import { isNil } from "@squide/core/internal";
import { useMemo, type ReactNode } from "react";
import type { LinkProps } from "react-router";
import { isLinkItem, type NavigationItem, type NavigationLink, type NavigationSection, type RootNavigationItem } from "./NavigationItemRegistry.ts";

export interface NavigationLinkRenderProps {
    label: ReactNode;
    linkProps: Omit<LinkProps, "children">;
    // Forwarded as declared, "undefined" included, so the renderer can tell an unset priority from an explicit
    // 0. The menu arrives sorted at every depth without the renderer doing anything, so this is here for what
    // ordering does not cover: grouping, badging, or a comparator of the renderer's own.
    priority?: number;
    additionalProps: Record<string, unknown>;
    context: Record<string, unknown>;
    canRender?: (obj?: unknown) => boolean;
}

export interface NavigationSectionRenderProps {
    label: ReactNode;
    section: ReactNode;
    // See NavigationLinkRenderProps' "priority".
    priority?: number;
    additionalProps: Record<string, unknown>;
    context: Record<string, unknown>;
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
    $priority,
    $additionalProps,
    $context,
    $canRender,
    // All the remaining props that belongs to the react-router Link component.
    ...linkProps
}: NavigationLink): NavigationLinkRenderProps {
    return {
        label: $label,
        linkProps: stripMetadataProps(linkProps),
        priority: $priority,
        additionalProps: $additionalProps ?? {},
        context: $context ?? {},
        canRender: $canRender
    };
}

function toMenuProps({ $label, $priority, $additionalProps, $context, $canRender }: NavigationSection, sectionElement: ReactNode): NavigationSectionRenderProps {
    return {
        label: $label,
        section: sectionElement,
        priority: $priority,
        additionalProps: $additionalProps ?? {},
        context: $context ?? {},
        canRender: $canRender
    };
}

// Highest priority is rendered first. A missing priority defaults to 0 so a negative priority can push an
// item behind the unprioritized ones. Equal priorities return 0 and rely on the sort being stable, which keeps
// declaration order among ties.
function byPriority(x: NavigationItem, y: NavigationItem) {
    const xp = x.$priority ?? 0;
    const yp = y.$priority ?? 0;

    if (xp === yp) {
        return 0;
    }

    return xp > yp ? -1 : 1;
}

function renderItems(items: NavigationItem[], renderItem: RenderItemFunction, renderSection: RenderSectionFunction, key: string, index: number, level: number) {
    // Copied before sorting. For a nested section this array is the registry's own "children", handed over by
    // reference, so sorting in place would reorder the registry itself.
    const itemElements = [...items].sort(byPriority).map((x, itemIndex) => {
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
        // Sorting lives in "renderItems" so that it applies at every level rather than only to this array.
        //
        // "$priority" is forwarded to the renderer as "priority" rather than reaching the Link component:
        // "toLinkProps" destructures it out, and "stripMetadataProps" would drop it regardless.
        return renderItems(navigationItems, renderItem, renderSection, "root", 0, 0);
    }, [navigationItems, renderItem, renderSection]);
}
