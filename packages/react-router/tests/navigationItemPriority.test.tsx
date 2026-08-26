import { renderHook } from "@testing-library/react";
import { describe, test } from "vitest";
import type { RootNavigationItem } from "../src/NavigationItemRegistry.ts";
import { isNavigationLink, useRenderedNavigationItems, type RenderItemFunction, type RenderSectionFunction } from "../src/useRenderedNavigationItems.tsx";

// The documentation's rules for "$priority", asserted as tests at every depth.
//
// The docs promised for a long time that "$priority" ordered a navigation item, without saying where. It only
// ever ordered a menu's top-level items: "useRenderedNavigationItems" sorts the array it receives, then
// recurses into a section's "children" untouched. Nothing pinned either half, so the contradiction survived in
// four documentation locations and in the skill until it was corrected.
//
// These are the rules as the docs now state them. Depth 0 sorts; depth 1 and deeper render in array order. The
// point of covering the depths that do *not* sort is that "$priority" is deliberately scoped rather than
// unfinished, so a future change that starts sorting "children" has to come here and say so on purpose. That
// would silently reorder a production menu with no consumer opt-in, which is why it is not being done.

// Collects the rendered labels in render order, keeping the tree shape, so a level's ordering is observable.
interface RenderedNode {
    label: string;
    level: number;
    items?: RenderedNode[];
}

function useRenderedTree(navigationItems: RootNavigationItem[]) {
    const renderItem: RenderItemFunction = (item, key, _index, level) => {
        const node: RenderedNode = {
            label: String(isNavigationLink(item) ? item.label : item.label),
            level
        };

        if (!isNavigationLink(item)) {
            node.items = (item.section as unknown as RenderedNode[]) ?? [];
        }

        return node as unknown as ReturnType<RenderItemFunction>;
    };

    const renderSection: RenderSectionFunction = elements => elements as unknown as ReturnType<RenderSectionFunction>;

    return useRenderedNavigationItems(navigationItems, renderItem, renderSection) as unknown as RenderedNode[];
}

function collectTree(navigationItems: RootNavigationItem[]) {
    const { result } = renderHook(() => useRenderedTree(navigationItems));

    return result.current;
}

function labelsAt(nodes: RenderedNode[]): string[] {
    return nodes.map(x => x.label);
}

// Walks "depth" levels into a single-section tree. Throws rather than asserting, so the caller's expectation
// stays the only assertion in the test and a mis-shaped tree fails loudly instead of silently comparing [].
function descend(nodes: RenderedNode[], depth: number): RenderedNode[] {
    let current = nodes;

    for (let level = 0; level < depth; level++) {
        if (current.length !== 1) {
            throw new Error(`Expected exactly one section at level ${level}, found ${current.length}.`);
        }

        current = current[0].items ?? [];
    }

    return current;
}

// Builds a section nesting "depth" levels deep, whose innermost children carry the given priorities.
function nestToDepth(depth: number, leaves: { label: string; priority?: number }[]): RootNavigationItem {
    const children = leaves.map(x => ({
        $id: x.label,
        $label: x.label,
        to: `/${x.label}`,
        // Deliberately set on a nested item. The type refuses this through "registerNavigationItem", but
        // "useRenderedNavigationItems" accepts whatever array it is handed, which is what is under test.
        ...(x.priority === undefined ? {} : { $priority: x.priority })
    })) as RootNavigationItem[];

    let current: RootNavigationItem = {
        $id: `section-${depth}`,
        $label: `Section ${depth}`,
        children
    };

    for (let level = depth - 1; level >= 1; level--) {
        current = {
            $id: `section-${level}`,
            $label: `Section ${level}`,
            children: [current]
        };
    }

    return current;
}

describe.concurrent("$priority at depth 0", () => {
    test.concurrent("orders the top-level items, highest first", ({ expect }) => {
        const rendered = collectTree([
            { $id: "low", $label: "Low", to: "/low", $priority: 1 },
            { $id: "high", $label: "High", to: "/high", $priority: 999 },
            { $id: "mid", $label: "Mid", to: "/mid", $priority: 500 }
        ]);

        expect(labelsAt(rendered)).toEqual(["High", "Mid", "Low"]);
    });

    test.concurrent("defaults a missing priority to 0, so a negative priority sorts after it", ({ expect }) => {
        const rendered = collectTree([
            { $id: "negative", $label: "Negative", to: "/negative", $priority: -10 },
            { $id: "none", $label: "None", to: "/none" },
            { $id: "positive", $label: "Positive", to: "/positive", $priority: 10 }
        ]);

        expect(labelsAt(rendered)).toEqual(["Positive", "None", "Negative"]);
    });

    // The comparator returns 0 for equal priorities and relies on the sort being stable. That is true of every
    // engine Squide supports, but nothing asserted it, so a comparator rewrite could quietly reorder ties.
    test.concurrent("keeps registration order among equal priorities", ({ expect }) => {
        const rendered = collectTree([
            { $id: "first", $label: "First", to: "/first", $priority: 10 },
            { $id: "second", $label: "Second", to: "/second", $priority: 10 },
            { $id: "third", $label: "Third", to: "/third", $priority: 10 },
            { $id: "fourth", $label: "Fourth", to: "/fourth", $priority: 10 }
        ]);

        expect(labelsAt(rendered)).toEqual(["First", "Second", "Third", "Fourth"]);
    });

    test.concurrent("keeps registration order among items with no priority at all", ({ expect }) => {
        const rendered = collectTree([
            { $id: "a", $label: "A", to: "/a" },
            { $id: "b", $label: "B", to: "/b" },
            { $id: "c", $label: "C", to: "/c" }
        ]);

        expect(labelsAt(rendered)).toEqual(["A", "B", "C"]);
    });

    // Negative ties are the case that a "?? -Infinity" default would break: every unprioritized item would
    // collapse to the same bucket as the negatives and the relative order would change.
    test.concurrent("keeps registration order among equal negative priorities, distinct from unprioritized items", ({ expect }) => {
        const rendered = collectTree([
            { $id: "neg-a", $label: "Neg A", to: "/neg-a", $priority: -5 },
            { $id: "plain", $label: "Plain", to: "/plain" },
            { $id: "neg-b", $label: "Neg B", to: "/neg-b", $priority: -5 }
        ]);

        expect(labelsAt(rendered)).toEqual(["Plain", "Neg A", "Neg B"]);
    });
});

describe.concurrent("$priority below depth 0 is ignored, as documented", () => {
    for (const depth of [1, 2, 3]) {
        test.concurrent(`depth ${depth} renders in array order regardless of priority`, ({ expect }) => {
            const section = nestToDepth(depth, [
                { label: "declared-first", priority: 1 },
                { label: "declared-second", priority: 999 },
                { label: "declared-third" }
            ]);

            const rendered = collectTree([section]);

            expect(labelsAt(descend(rendered, depth))).toEqual(["declared-first", "declared-second", "declared-third"]);
        });
    }

    test.concurrent("a high priority on a nested item does not lift it above its siblings", ({ expect }) => {
        const rendered = collectTree([
            {
                $id: "section",
                $label: "Section",
                children: [
                    { $id: "a", $label: "A", to: "/a" },
                    // 999 would put this first if children were sorted.
                    { $id: "b", $label: "B", to: "/b", $priority: 999 } as RootNavigationItem
                ]
            }
        ]);

        expect(labelsAt(rendered[0].items ?? [])).toEqual(["A", "B"]);
    });

    test.concurrent("sorting the top level does not disturb the order inside a section", ({ expect }) => {
        const rendered = collectTree([
            {
                $id: "second-section",
                $label: "Second section",
                $priority: 1,
                children: [
                    { $id: "x", $label: "X", to: "/x" },
                    { $id: "y", $label: "Y", to: "/y" }
                ]
            },
            {
                $id: "first-section",
                $label: "First section",
                $priority: 999,
                children: [
                    { $id: "m", $label: "M", to: "/m" },
                    { $id: "n", $label: "N", to: "/n" }
                ]
            }
        ]);

        // Top level is reordered by priority.
        expect(labelsAt(rendered)).toEqual(["First section", "Second section"]);

        // Each section's own children are untouched.
        expect(labelsAt(rendered[0].items ?? [])).toEqual(["M", "N"]);
        expect(labelsAt(rendered[1].items ?? [])).toEqual(["X", "Y"]);
    });
});
