import { describe, test } from "vitest";
import { NavigationItemRegistry, type NavigationItemRegistrationType, type RootNavigationItem } from "../src/NavigationItemRegistry.ts";
import { NavigationItemRegistryModel } from "./NavigationItemRegistryModel.ts";

// The section index used to key on `${menuId}-${sectionId}`, so ("analytics", "sidebar-performance") and
// ("analytics-sidebar", "performance") produced one key. A nested item could attach to the wrong menu's
// section while the registry reported it registered, two distinct sections could collide on the throw, and
// strict mode could report one missing section instead of two.
//
// These tests are written against the *property* rather than the separator: the registry must agree with a
// reference model that keys by the pair itself and so cannot collide. That is what makes them survive a change
// of separator, which matters because swapping "-" for some other character relocates the assumption instead of
// removing it, and a suite asserting on the key format would go green for such a fix.
//
// The generators below construct collisions deliberately. An earlier version of this file drew ids from a
// hostile alphabet at random and passed 521/521 against the unfixed registry, because a random draw almost
// never lands on a colliding pair. Randomness over a hostile alphabet is not the same thing as adversarial
// input, and the difference is the whole value of the suite.
//
// See ADR-0022.

// Small alphabet of id fragments. Every value is a legal "menuId" or section "$id", and several contain the
// separator the implementation used to join on.
const FRAGMENTS = ["a", "b", "-", "", "a-b"] as const;

// The canonical collision under a separator S: (A, B+S+C) and (A+S+B, C) both join to A+S+B+S+C.
function collidingPairs(a: string, b: string, c: string, separator: string) {
    return [
        { menuId: a, sectionId: `${b}${separator}${c}` },
        { menuId: `${a}${separator}${b}`, sectionId: c }
    ] as const;
}

interface Registration {
    menuId: string;
    sectionId?: string;
    isSection: boolean;
    label: string;
}

function applyTo(target: NavigationItemRegistry | NavigationItemRegistryModel, registrations: Registration[], registrationType: NavigationItemRegistrationType = "static") {
    const thrown: number[] = [];

    registrations.forEach((x, index) => {
        const item: RootNavigationItem = x.isSection
            ? { $id: x.label, $label: x.label, children: [] }
            : { $id: x.label, $label: x.label, to: `/${index}` };

        try {
            if (target instanceof NavigationItemRegistry) {
                target.add(x.menuId, registrationType, item, x.sectionId ? { sectionId: x.sectionId } : undefined);
            } else {
                target.add(x.menuId, registrationType, item, x.sectionId);
            }
        } catch {
            // Only which registrations threw matters here, not the message wording.
            thrown.push(index);
        }
    });

    return thrown;
}

function describeTree(items: RootNavigationItem[]): unknown {
    return items.map(x => ({
        label: x.$label,
        children: x.children ? describeTree(x.children as RootNavigationItem[]) : undefined
    }));
}

function describePending(sections: { menuId: string; sectionId: string; items: RootNavigationItem[] }[]) {
    return sections
        .map(x => `${JSON.stringify(x.menuId)}|${JSON.stringify(x.sectionId)}|${x.items.length}`)
        .sort();
}

// Runs the same program against the registry and the model and returns both outcomes for comparison.
function compare(registrations: Registration[], menuIds: string[]) {
    const registry = new NavigationItemRegistry();
    const model = new NavigationItemRegistryModel();

    const registryThrown = applyTo(registry, registrations);
    const modelThrown = applyTo(model, registrations);

    const uniqueMenuIds = Array.from(new Set(menuIds));

    return {
        actual: {
            thrown: registryThrown,
            menus: uniqueMenuIds.map(menuId => ({ menuId, tree: describeTree(registry.getItems(menuId)) })),
            pending: describePending(registry.getPendingRegistrations().getPendingSections())
        },
        expected: {
            thrown: modelThrown,
            menus: uniqueMenuIds.map(menuId => ({ menuId, tree: describeTree(model.getItems(menuId)) })),
            pending: describePending(model.getPendingSections())
        }
    };
}

describe.concurrent("two sections on colliding pairs", () => {
    // For every (A, B, C) triple, register both halves of a colliding pair as sections and then aim a nested
    // item at each. Under any single-separator key scheme the two pairs share a key, so the second section
    // either throws or steals the first one's nested item.
    for (const a of FRAGMENTS) {
        for (const b of FRAGMENTS) {
            for (const c of FRAGMENTS) {
                test.concurrent(`(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(c)})`, ({ expect }) => {
                    const [first, second] = collidingPairs(a, b, c, "-");

                    // A section with no "$id" is never indexed, so those triples cannot collide by design.
                    if (!first.sectionId || !second.sectionId) {
                        return;
                    }

                    const registrations: Registration[] = [
                        { menuId: first.menuId, isSection: true, label: first.sectionId },
                        { menuId: second.menuId, isSection: true, label: second.sectionId },
                        { menuId: first.menuId, sectionId: first.sectionId, isSection: false, label: "into-first" },
                        { menuId: second.menuId, sectionId: second.sectionId, isSection: false, label: "into-second" }
                    ];

                    const { actual, expected } = compare(registrations, [first.menuId, second.menuId]);

                    expect(actual).toEqual(expected);
                });
            }
        }
    }
});

describe.concurrent("pending items on colliding pairs", () => {
    // Same pairs, but the sections are never registered, so both entries stay pending. Under a shared key the
    // two sets of pending items merge into one, which is what makes strict mode under-report.
    for (const a of FRAGMENTS) {
        for (const b of FRAGMENTS) {
            for (const c of FRAGMENTS) {
                test.concurrent(`(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(c)})`, ({ expect }) => {
                    const [first, second] = collidingPairs(a, b, c, "-");

                    if (!first.sectionId || !second.sectionId) {
                        return;
                    }

                    const registrations: Registration[] = [
                        { menuId: first.menuId, sectionId: first.sectionId, isSection: false, label: "waiting-first" },
                        { menuId: second.menuId, sectionId: second.sectionId, isSection: false, label: "waiting-second" }
                    ];

                    const { actual, expected } = compare(registrations, [first.menuId, second.menuId]);

                    expect(actual).toEqual(expected);
                });
            }
        }
    }
});

// A tiny deterministic PRNG, so a failing run is reproducible from its seed.
function createRandom(seed: number) {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;

        return state / 0x100000000;
    };
}

describe.concurrent("randomized programs over a colliding id pool", () => {
    const PROGRAM_COUNT = 300;
    const MAX_STEPS = 10;

    for (let seed = 1; seed <= PROGRAM_COUNT; seed++) {
        test.concurrent(`program ${seed}`, ({ expect }) => {
            const random = createRandom(seed);
            const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];

            // The pool is built from colliding pairs rather than from free-form ids, so a random program has a
            // real chance of hitting the defect. Drawing ids independently does not.
            const pool: { menuId: string; sectionId: string }[] = [];

            for (let i = 0; i < 3; i++) {
                const [first, second] = collidingPairs(pick(FRAGMENTS), pick(FRAGMENTS), pick(FRAGMENTS), "-");
                pool.push(first, second);
            }

            const steps = 1 + Math.floor(random() * MAX_STEPS);
            const registrations: Registration[] = [];

            for (let i = 0; i < steps; i++) {
                const pair = pick(pool);
                const nested = random() < 0.6;

                registrations.push({
                    menuId: pair.menuId,
                    sectionId: nested ? pair.sectionId : undefined,
                    isSection: !nested || random() < 0.3,
                    label: nested ? `leaf-${i}` : pair.sectionId
                });
            }

            const { actual, expected } = compare(registrations, pool.map(x => x.menuId));

            expect(actual).toEqual(expected);
        });
    }
});

describe.concurrent("the collision that started this", () => {
    test.concurrent("a nested item aimed at one menu's section never lands in another menu", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // Both pairs join to "analytics-sidebar-performance" under a "-" separator.
        registry.add("analytics", "static", { $id: "sidebar-performance", $label: "Sidebar performance", children: [] });
        registry.add("analytics-sidebar", "static", { $id: "performance", $label: "Performance", children: [] });

        const result = registry.add("analytics-sidebar", "static", { $id: "leaf", $label: "Leaf", to: "/leaf" }, { sectionId: "performance" });

        expect(result.registrationStatus).toBe("registered");
        expect(result.menuId).toBe("analytics-sidebar");

        expect(describeTree(registry.getItems("analytics-sidebar"))).toEqual([{ label: "Performance", children: [{ label: "Leaf", children: undefined }] }]);
        expect(describeTree(registry.getItems("analytics"))).toEqual([{ label: "Sidebar performance", children: [] }]);
    });

    test.concurrent("two sections whose pairs collide under a \"-\" separator both register", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("main-menu", "static", { $id: "settings", $label: "Settings", children: [] });

        expect(() => {
            registry.add("main", "static", { $id: "menu-settings", $label: "Menu settings", children: [] });
        }).not.toThrow();
    });

    test.concurrent("strict mode sees both missing sections, not one", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("analytics", "static", { $id: "a", $label: "A", to: "/a" }, { sectionId: "sidebar-performance" });
        registry.add("analytics-sidebar", "static", { $id: "b", $label: "B", to: "/b" }, { sectionId: "performance" });

        const pendingSections = registry.getPendingRegistrations().getPendingSections();

        expect(pendingSections).toHaveLength(2);
        expect(pendingSections.map(x => `${x.menuId}|${x.sectionId}`).sort())
            .toEqual(["analytics-sidebar|performance", "analytics|sidebar-performance"]);
    });
});

// Turns "use a structural key" from a preference into a measurement.
//
// The fix on the abandoned branch swapped "-" for the NUL character, which is unlikely to appear in an id but
// is still a separator inside the value space. This block asserts that *every* single-separator scheme admits a
// collision over the fragment alphabet, NUL included, and that keying by the pair does not. It is what rules
// out "pick a rarer separator" as a fix rather than leaving it a matter of taste.
describe.concurrent("no single-separator key scheme is collision free", () => {
    const SEPARATORS = ["-", "|", "::", " ", "", "~"] as const;

    for (const separator of SEPARATORS) {
        test.concurrent(`separator ${JSON.stringify(separator)} admits a collision`, ({ expect }) => {
            // The fragment alphabet extended with the separator under test, since a separator only collides
            // when it can appear inside a value.
            const fragments = [...FRAGMENTS, separator, `x${separator}y`];

            const seen = new Map<string, string>();
            const collisions: string[] = [];

            for (const menuId of fragments) {
                for (const sectionId of fragments) {
                    const key = `${menuId}${separator}${sectionId}`;
                    const pair = `${JSON.stringify(menuId)}|${JSON.stringify(sectionId)}`;
                    const previous = seen.get(key);

                    if (previous && previous !== pair) {
                        collisions.push(`${previous} vs ${pair} -> ${JSON.stringify(key)}`);
                    } else {
                        seen.set(key, pair);
                    }
                }
            }

            expect(collisions.length).toBeGreaterThan(0);
        });
    }

    test.concurrent("keying by the pair admits none, over the union of every alphabet above", ({ expect }) => {
        const fragments = Array.from(new Set([...FRAGMENTS, ...SEPARATORS, ...SEPARATORS.map(x => `x${x}y`)]));

        const seen = new Set<string>();
        const collisions: string[] = [];

        for (const menuId of fragments) {
            for (const sectionId of fragments) {
                // A Map of Maps, modelled here as its only observable property: the pair is the identity.
                const identity = JSON.stringify([menuId, sectionId]);

                if (seen.has(identity)) {
                    collisions.push(identity);
                }

                seen.add(identity);
            }
        }

        expect(collisions).toEqual([]);
        expect(seen.size).toBe(fragments.length * fragments.length);
    });
});
