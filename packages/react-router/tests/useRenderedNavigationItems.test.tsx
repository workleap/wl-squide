import { render, renderHook } from "@testing-library/react";
import { useCallback, type ReactNode } from "react";
import { test, vi } from "vitest";
import type { NavigationItem, RootNavigationItem } from "../src/NavigationItemRegistry.ts";
import { isNavigationLink, useRenderedNavigationItems, type NavigationLinkRenderProps, type NavigationSectionRenderProps, type RenderItemFunction, type RenderSectionFunction } from "../src/useRenderedNavigationItems.tsx";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, key: string, index: number, level: number) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, key: string, index: number, level: number) => ReactNode;

interface TestComponentProps {
    navigationItems: RootNavigationItem[];
}

// Not the prettiest mock but it's simpler than using createMemoryRouter and
// it provides an adequate testing experience when combined with snapshot tests.
function Link(props: Record<string, unknown>) {
    return (
        <div {...props} />
    );
}

function TestComponent({ navigationItems }: TestComponentProps) {
    const renderLinkItem: RenderLinkItemFunction = useCallback(({ label, linkProps, additionalProps }, key, index, level) => {
        return (
            <li key={key} {...additionalProps} data-key={key} data-index={index.toString()} data-level={level.toString()}>
                <Link {...linkProps}>
                    {label}
                </Link>
            </li>
        );
    }, []);

    const renderLinkSection: RenderSectionItemFunction = useCallback(({ label, section, additionalProps }, key, index, level) => {
        return (
            <li key={key} {...additionalProps} data-key={key} data-index={index.toString()} data-level={level.toString()}>
                {label}
                {section}
            </li>
        );
    }, []);

    const renderItem: RenderItemFunction = useCallback((item, key, index, level) => {
        if (!item.canRender || (item.canRender?.())) {
            return isNavigationLink(item) ? renderLinkItem(item, key, index, level) : renderLinkSection(item, key, index, level);
        }
    }, [renderLinkItem, renderLinkSection]);

    const renderSection: RenderSectionFunction = useCallback((elements, key, index, level) => {
        return (
            <ul key={key} data-key={key} data-index={index.toString()} data-level={level.toString()}>
                {elements}
            </ul>
        );
    }, []);

    // eslint-disable-next-line testing-library/render-result-naming-convention
    const renderedNavigationItems = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>{renderedNavigationItems}</>
    );
}

test.concurrent("highest priority goes first", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        },
        {
            $label: "Bar",
            $priority: 5,
            to: "/bar"
        },
        {
            $label: "Toto",
            $priority: 99,
            to: "/toto"
        },
        {
            $label: "Tutu",
            to: "/tutu"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("negative priority goes last", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        },
        {
            $label: "Bar",
            to: "/bar"
        },
        {
            $label: "Toto",
            $priority: -1,
            to: "/toto"
        },
        {
            $label: "Tutu",
            to: "/tutu"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("support 2 section levels", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        },
        {
            $label: "Bar",
            children: [
                {
                    $label: "Toto",
                    to: "/toto"
                },
                {
                    $label: "Tutu",
                    to: "/tutu"
                }
            ]
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("support 3 section levels", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        },
        {
            $label: "Bar",
            children: [
                {
                    $label: "Toto",
                    to: "/toto"
                },
                {
                    $label: "Tutu",
                    children: [
                        {
                            $label: "Titi",
                            to: "/titi"
                        }
                    ]
                }
            ]
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("link item additionalProps are rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $additionalProps: {
                style: { color: "red" }
            },
            to: "/foo"
        },
        {
            $label: "Bar",
            to: "/bar"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("section item additionalProps are rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ],
            $additionalProps: {
                style: { color: "red" }
            }
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("link item $meta is forwarded to the renderer and is stripped from linkProps", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $meta: {
                highlight: true
            },
            to: "/foo"
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const item = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;

    expect(item.meta).toEqual({ highlight: true });
    expect(item.linkProps).toEqual({ to: "/foo" });
});

test.concurrent("section item $meta is forwarded to the renderer", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $meta: {
                highlight: true
            },
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    // The nested link is rendered first, the section is the last call.
    const item = renderItem.mock.calls.at(-1)![0] as NavigationSectionRenderProps;

    expect(item.meta).toEqual({ highlight: true });
});

test.concurrent("when no $meta prop is provided, meta is an empty object", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const link = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;
    const section = renderItem.mock.calls.at(-1)![0] as NavigationSectionRenderProps;

    expect(link.meta).toEqual({});
    expect(section.meta).toEqual({});
});

test.concurrent("every $ prefixed prop is stripped from linkProps", ({ expect }) => {
    const navigationItems = [
        {
            $id: "foo",
            $label: "Foo",
            $priority: 10,
            $additionalProps: {
                style: { color: "red" }
            },
            $meta: {
                highlight: true
            },
            $canRender: () => true,
            // An unknown "$" prefixed prop is an excess property error on a fresh object literal,
            // but not when the item is built through a variable or a helper.
            $unknown: "should-not-leak",
            to: "/foo"
        }
    ] as unknown as RootNavigationItem[];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const item = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;

    expect(item.linkProps).toEqual({ to: "/foo" });
});

test.concurrent("every $ prefixed prop is stripped from linkProps of a nested item", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    $priority: 10,
                    $meta: {
                        highlight: true
                    },
                    to: "/bar"
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const item = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;

    expect(item.linkProps).toEqual({ to: "/bar" });
    expect(item.meta).toEqual({ highlight: true });
});

test.concurrent("link item $priority is forwarded to the renderer and is stripped from linkProps", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $priority: 10,
            to: "/foo"
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const item = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;

    expect(item.priority).toBe(10);
    expect(item.linkProps).toEqual({ to: "/foo" });
});

test.concurrent("section item $priority is forwarded to the renderer", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $priority: 10,
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    // The nested link is rendered first, the section is the last call.
    const item = renderItem.mock.calls.at(-1)![0] as NavigationSectionRenderProps;

    expect(item.priority).toBe(10);
});

// A nested item's "$priority" was never handed to the renderer on purpose. The hook consumed it for the
// top-level sort and stripped it before recursing, from the first version of this package until
// "stripMetadataProps" replaced that strip. The only way it ever reached a renderer was as an unfiltered
// "$priority" key inside "linkProps", which then landed on the DOM element as an invalid attribute — the leak
// "stripMetadataProps" exists to close, not a channel it broke. This pins the real one.
test.concurrent("nested $priority is forwarded to the renderer at every depth", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Level 1",
            $priority: 1,
            children: [
                {
                    $label: "Level 2",
                    $priority: 2,
                    children: [
                        {
                            $label: "Level 3",
                            $priority: 3,
                            to: "/level-3"
                        }
                    ]
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    // Depth first, so the innermost link is rendered first and its ancestors follow outwards.
    const byLevel = renderItem.mock.calls.map(([item, , , level]) => ({ level, priority: item.priority }));

    expect(byLevel).toEqual([
        { level: 2, priority: 3 },
        { level: 1, priority: 2 },
        { level: 0, priority: 1 }
    ]);
});

// "undefined" rather than 0, so a renderer can tell "nobody set a priority" from "somebody set 0". Squide's own
// top-level sort applies the 0 default, it doesn't bake it into what the renderer sees.
test.concurrent("when no $priority prop is provided, priority is undefined", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const link = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;
    const section = renderItem.mock.calls.at(-1)![0] as NavigationSectionRenderProps;

    expect(link.priority).toBeUndefined();
    expect(section.priority).toBeUndefined();
});

test.concurrent("an explicit $priority of 0 is forwarded as 0", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $priority: 0,
            to: "/foo"
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const item = renderItem.mock.calls[0][0] as NavigationLinkRenderProps;

    expect(item.priority).toBe(0);
});

// A section's items are sorted the same way a menu's top-level items are, and the priority is still forwarded
// for everything sorting does not cover.
test.concurrent("a section's items are sorted by priority, which is also forwarded", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                { $label: "Low", $priority: 1, to: "/low" },
                { $label: "High", $priority: 999, to: "/high" },
                { $label: "None", to: "/none" }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const nestedItems = renderItem.mock.calls.filter(([, , , level]) => level === 1).map(([item]) => item);

    expect(nestedItems.map(x => x.label)).toEqual(["High", "Low", "None"]);
    expect(nestedItems.map(x => x.priority)).toEqual([999, 1, undefined]);
});

// The case this exists for. Two modules nesting into a shared section through the "sectionId" option land in
// "children" in whatever order their registrations completed, which is a function of network and data timing
// since modules register concurrently. Before sorting applied here there was no lever at all: array order was
// not the author's to control and "$priority" was not consulted.
test.concurrent("a section's items are ordered by priority rather than by the order they were added", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                // As if the slowest module had registered first.
                { $label: "Third", $priority: 1, to: "/third" },
                { $label: "First", $priority: 100, to: "/first" },
                { $label: "Second", $priority: 10, to: "/second" }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const labels = renderItem.mock.calls.filter(([, , , level]) => level === 1).map(([item]) => item.label);

    expect(labels).toEqual(["First", "Second", "Third"]);
});

test.concurrent("sorting applies at every depth", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                {
                    $label: "Subsection",
                    children: [
                        { $label: "Deep low", $priority: 1, to: "/deep-low" },
                        { $label: "Deep high", $priority: 999, to: "/deep-high" }
                    ]
                }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const labels = renderItem.mock.calls.filter(([, , , level]) => level === 2).map(([item]) => item.label);

    expect(labels).toEqual(["Deep high", "Deep low"]);
});

test.concurrent("a negative priority pushes a nested item behind the unprioritized ones", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                { $label: "Negative", $priority: -10, to: "/negative" },
                { $label: "None", to: "/none" },
                { $label: "Positive", $priority: 10, to: "/positive" }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const labels = renderItem.mock.calls.filter(([, , , level]) => level === 1).map(([item]) => item.label);

    expect(labels).toEqual(["Positive", "None", "Negative"]);
});

test.concurrent("nested items with equal priorities keep their declaration order", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                { $label: "First", $priority: 10, to: "/first" },
                { $label: "Second", $priority: 10, to: "/second" },
                { $label: "Third", $priority: 10, to: "/third" },
                { $label: "Fourth", $priority: 10, to: "/fourth" }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const labels = renderItem.mock.calls.filter(([, , , level]) => level === 1).map(([item]) => item.label);

    expect(labels).toEqual(["First", "Second", "Third", "Fourth"]);
});

test.concurrent("a section with no priorities anywhere keeps its declaration order", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Section",
            children: [
                { $label: "A", to: "/a" },
                { $label: "B", to: "/b" },
                { $label: "C", to: "/c" }
            ]
        }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    const labels = renderItem.mock.calls.filter(([, , , level]) => level === 1).map(([item]) => item.label);

    expect(labels).toEqual(["A", "B", "C"]);
});

// The registry hands "children" to the hook by reference, so sorting a copy rather than the array itself is
// load-bearing. Sorting in place would reorder the registry and leak the render order into every other
// consumer of "getNavigationItems".
test.concurrent("sorting does not mutate the items it was given", ({ expect }) => {
    const children: RootNavigationItem[] = [
        { $label: "Low", $priority: 1, to: "/low" },
        { $label: "High", $priority: 999, to: "/high" }
    ];

    const navigationItems: RootNavigationItem[] = [
        { $label: "Section", children }
    ];

    const renderItem = vi.fn<RenderItemFunction>(() => <div>Item</div>);
    const renderSection = vi.fn<RenderSectionFunction>(() => <div>Section</div>);

    renderHook(() => useRenderedNavigationItems(navigationItems, renderItem, renderSection));

    expect(children.map(x => x.$label)).toEqual(["Low", "High"]);
    expect(navigationItems.map(x => x.$label)).toEqual(["Section"]);
});

test.concurrent("link item $meta is not rendered on the link component", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            $meta: {
                highlight: true
            },
            to: "/foo"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("link item custom keys are rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $id: "foo",
            $label: "Foo",
            $additionalProps: {
                style: { color: "red" }
            },
            to: "/foo"
        },
        {
            $id: "bar",
            $label: "Bar",
            to: "/bar"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("section item custom keys are rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $id: "foo",
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ],
            $additionalProps: {
                style: { color: "red" }
            }
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("nested item custom keys are rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $id: "bar",
                    $label: "Bar",
                    to: "/bar"
                }
            ],
            $additionalProps: {
                style: { color: "red" }
            }
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("when a link item canRender prop return false, the item is not rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $canRender: () => false,
            $label: "Foo",
            to: "/foo"
        },
        {
            $label: "Bar",
            to: "/bar"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("when a section item canRender prop return false, the item is not rendered", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $canRender: () => false,
            $label: "Foo",
            children: [
                {
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        },
        {
            $label: "acme",
            to: "/acme"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("when the canRender prop of all the root items return false, do not render the root section", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $canRender: () => false,
            $label: "Foo",
            to: "/foo"
        },
        {
            $canRender: () => false,
            $label: "Bar",
            to: "/bar"
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("when the canRender prop of all the items of a nested section return false, do not render the section", ({ expect }) => {
    const navigationItems: RootNavigationItem[] = [
        {
            $label: "Foo",
            children: [
                {
                    $canRender: () => false,
                    $label: "Bar",
                    to: "/bar"
                }
            ]
        },
        {
            $label: "John",
            children: [
                {
                    $label: "Doe",
                    children: [
                        {
                            $canRender: () => false,
                            $label: "Acme",
                            to: "/acme"
                        }
                    ]
                }
            ]
        }
    ];

    const tree = render(<TestComponent navigationItems={navigationItems} />).asFragment();

    expect(tree).toMatchSnapshot();
});

test.concurrent("doesn't rerender when the navigation items haven't changed", ({ expect }) => {
    const initialItems: NavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        }
    ];

    const renderItem = vi.fn(() => <div>Item</div>);
    const renderSection = vi.fn(() => <div>Section</div>);

    const { rerender } = renderHook(({ navigationItems: x }) => useRenderedNavigationItems(x, renderItem, renderSection), {
        initialProps: {
            navigationItems: initialItems
        }
    });

    rerender({
        navigationItems: initialItems
    });

    expect(renderItem).toHaveBeenCalledOnce();
    expect(renderSection).toHaveBeenCalledOnce();
});

test.concurrent("rerender when the navigation items change", ({ expect }) => {
    const initialItems: NavigationItem[] = [
        {
            $label: "Foo",
            to: "/foo"
        }
    ];

    const renderItem = vi.fn(() => <div>Item</div>);
    const renderSection = vi.fn(() => <div>Section</div>);

    const { rerender } = renderHook(({ navigationItems: x }) => useRenderedNavigationItems(x, renderItem, renderSection), {
        initialProps: {
            navigationItems: initialItems
        }
    });

    rerender({
        navigationItems: [
            {
                $label: "Bar",
                to: "/bar"
            }
        ]
    });

    expect(renderItem).toHaveBeenCalledTimes(2);
    expect(renderSection).toHaveBeenCalledTimes(2);
});
