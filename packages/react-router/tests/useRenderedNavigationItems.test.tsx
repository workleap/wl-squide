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

// Squide sorts the array it is handed and leaves a section's "children" in declaration order. A renderer that
// wants a section sorted has to do it itself, which is only possible because "priority" reaches it.
test.concurrent("a section's items keep their declaration order, with their priority available to the renderer", ({ expect }) => {
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

    // Squide leaves the children in the order they were declared.
    expect(nestedItems.map(x => x.label)).toEqual(["Low", "High", "None"]);

    // And the renderer has what it needs to reorder them.
    expect(nestedItems.map(x => x.priority)).toEqual([1, 999, undefined]);
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
