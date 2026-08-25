import { describe, test } from "vitest";
import { NavigationItemDeferredRegistrationScope, NavigationItemDeferredRegistrationTransactionalScope, NavigationItemRegistry, parseSectionIndexKey, type NavigationSection } from "../src/NavigationItemRegistry.ts";

describe.concurrent("add", () => {
    test.concurrent("should add a single deferred item", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        expect(registry.getItems("foo")[0]).toBeDefined();
        expect(registry.getItems("foo")[0].$label).toBe("1");
        expect(registry.getItems("foo")[0].to).toBe("/1");
    });

    test.concurrent("should add a single static item", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        expect(registry.getItems("foo")[0]).toBeDefined();
        expect(registry.getItems("foo")[0].$label).toBe("1");
        expect(registry.getItems("foo")[0].to).toBe("/1");
    });

    test.concurrent("should add multiple items", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        });

        expect(registry.getItems("foo").length).toBe(2);
    });

    test.concurrent("should add items for different menus", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        });

        registry.add("bar", "deferred", {
            $label: "3",
            to: "/3"
        });

        expect(registry.getItems("foo").length).toBe(2);
        expect(registry.getItems("bar").length).toBe(1);
    });

    test.concurrent("when a root link is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a root identified section is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $id: "1",
            $label: "1",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a root anonymous section is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $label: "1",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested link is pending for registration, return the \"pending\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("pending");
        expect(result.menuId).toBe("foo");
        expect(result.sectionId).toBe("bar");
    });

    test.concurrent("when a nested identified section is pending for registration, return the \"pending\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $id: "1",
            $label: "1",
            children: []
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("pending");
        expect(result.menuId).toBe("foo");
        expect(result.sectionId).toBe("bar");
    });

    test.concurrent("when a nested anonymous section is pending for registration, return the \"pending\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $label: "1",
            children: []
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("pending");
    });

    test.concurrent("when a nested link is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result2 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested identified section is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result2 = registry.add("foo", "static", {
            $id: "toto",
            $label: "toto",
            children: []
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested anonymous section is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result2 = registry.add("foo", "static", {
            $label: "toto",
            children: []
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a root identified section is added and complete the pending registration of nested items, add the registered items to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "bar"
        });

        const result3 = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(2);
        expect(result3.completedPendingRegistrations[0]).toBe(result1.item);
        expect(result3.completedPendingRegistrations[1]).toBe(result2.item);
    });

    test.concurrent("when a root identified section is added for another section and do not complete any pending registration, return an empty \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "bar"
        });

        const result3 = registry.add("foo", "static", {
            $id: "toto",
            $label: "toto",
            children: []
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(0);
    });

    test.concurrent("when a root identified section is added for another menu and do not complete any pending registration, return an empty \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "bar"
        });

        const result3 = registry.add("toto", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(0);
    });

    test.concurrent("when a root anonymous section is added, return an empty \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "bar"
        });

        const result3 = registry.add("foo", "static", {
            $label: "section",
            children: []
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(0);
    });

    test.concurrent("when a root link is added, return an empty \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        expect(result.registrationStatus).toBe("registered");
        expect(result.completedPendingRegistrations.length).toBe(0);
    });

    test.concurrent("when a deeply nested link is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "root",
            children: [
                {
                    $label: "nested",
                    children: [
                        {
                            $id: "bar",
                            $label: "bar",
                            children: []
                        }
                    ]
                }
            ]
        });

        const result2 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a deeply nested section is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "root",
            children: [
                {
                    $label: "nested",
                    children: [
                        {
                            $id: "bar",
                            $label: "bar",
                            children: []
                        }
                    ]
                }
            ]
        });

        const result2 = registry.add("foo", "static", {
            $label: "1",
            children: []
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a deeply nested section registered as a single block is added and complete the pending registration of nested items, add the registered items to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "root",
            children: [
                {
                    $label: "nested-1",
                    children: [
                        {
                            $id: "bar",
                            $label: "bar",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("registered");
        expect(result2.completedPendingRegistrations.length).toBe(1);
        expect(result2.completedPendingRegistrations[0]).toBe(result1.item);
    });

    test.concurrent("when registering a multiple sections as a single block complete pending registrations at multiple nesting level, add all the registered items to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "toto"
        });

        const result3 = registry.add("foo", "static", {
            $label: "root",
            children: [
                {
                    $id: "toto",
                    $label: "toto",
                    children: [
                        {
                            $id: "bar",
                            $label: "bar",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(2);
        expect(result3.completedPendingRegistrations[0]).toBe(result2.item);
        expect(result3.completedPendingRegistrations[1]).toBe(result1.item);
    });

    test.concurrent("when registering a root item trigger a chain reaction of pending registrations completion, add all the registered items to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result1 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.add("foo", "static", {
            $id: "bar",
            $label: "2",
            children: []
        }, {
            sectionId: "toto"
        });

        const result3 = registry.add("foo", "static", {
            $label: "root",
            children: [
                {
                    $label: "nested",
                    children: [
                        {
                            $id: "toto",
                            $label: "toto",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result1.registrationStatus).toBe("pending");
        expect(result2.registrationStatus).toBe("pending");
        expect(result3.registrationStatus).toBe("registered");
        expect(result3.completedPendingRegistrations.length).toBe(2);
        expect(result3.completedPendingRegistrations[0]).toBe(result2.item);
        expect(result3.completedPendingRegistrations[1]).toBe(result1.item);
    });

    test.concurrent("when a static item is nested under a deferred section, the item goes back to pending once the section is cleared", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(1);

        // The section belonged to the run being cleared. The static item is not deleted with it, it waits for
        // the section to be registered again and is reported as pending until then.
        registry.clearDeferredItems();

        expect(registry.getItems("foo").length).toBe(0);
        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(1);

        registry.add("foo", "deferred", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(1);
    });

    test.concurrent("when a deferred item is nested under a static section, the item is deleted by a clear", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(1);

        // The static section is kept, the deferred item it holds is not.
        registry.clearDeferredItems();

        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(0);
    });

    test.concurrent("when a nested item is registered under a section without a predefined children array, register the item", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const item = {
            $id: "bar",
            $label: "bar"
        };

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const result1 = registry.add("foo", "static", item);

        const result2 = registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result1.registrationStatus).toBe("registered");
        expect(result2.registrationStatus).toBe("registered");
    });

    test.concurrent("when a menu id and a section id would collide once concatenated, both sections can be registered", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // The "analytics" menu with the "sidebar-performance" section and the "analytics-sidebar" menu with the
        // "performance" section used to produce the same section index key, which rejected the second one as a
        // duplicate registration.
        registry.add("analytics", "static", {
            $id: "sidebar-performance",
            $label: "Performance",
            children: []
        });

        expect(() => {
            registry.add("analytics-sidebar", "static", {
                $id: "performance",
                $label: "Performance",
                children: []
            });
        }).not.toThrow();

        expect(registry.getItems("analytics").length).toBe(1);
        expect(registry.getItems("analytics-sidebar").length).toBe(1);
    });

    test.concurrent("when a section is waiting for its own section, it doesn't take the identifier from a section registered afterward", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // The section is waiting for a section that is never registered, therefore it holds nothing and must
        // not take the "bar" identifier from the section registered below.
        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        }, {
            sectionId: "missing"
        });

        const result = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");
        expect(registry.getItems("foo").length).toBe(1);
    });

    test.concurrent("when a section is waiting for its own section, the sections declared in it don't take pending items", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // The outer section is waiting for the section declared inside of it, which is reachable from nowhere.
        // Registering the inner section as if it was would nest the outer section under its own child.
        const result = registry.add("foo", "static", {
            $id: "outer",
            $label: "Outer",
            children: [{
                $id: "inner",
                $label: "Inner",
                children: []
            }]
        }, {
            sectionId: "inner"
        });

        expect(result.registrationStatus).toBe("pending");
        expect(registry.getItems("foo").length).toBe(0);
    });

    test.concurrent("when a section is waiting for its own section, the items nested under it stay pending", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "inner"
        });

        const result = registry.add("foo", "static", {
            $id: "outer",
            $label: "Outer",
            children: [{
                $id: "inner",
                $label: "Inner",
                children: []
            }]
        }, {
            sectionId: "missing"
        });

        // Nothing is reachable from the menu, therefore nothing has been completed and both registrations are
        // still reported as pending.
        expect(result.completedPendingRegistrations.length).toBe(0);
        expect(registry.getItems("foo").length).toBe(0);
        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(2);
    });

    test.concurrent("when a section holds inline children, they come before the pending items it takes", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "pending",
            $label: "Pending",
            to: "/pending"
        }, {
            sectionId: "bar"
        });

        // The children declared in a section are registered before the section takes the items that were
        // waiting for it, which is the order the previous implementation appended them in.
        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: [{
                $id: "inline",
                $label: "Inline",
                to: "/inline"
            }]
        });

        const section = registry.getItems("foo")[0] as NavigationSection;

        expect(section.children.map(x => x.$id)).toEqual(["inline", "pending"]);
    });

    test.concurrent("when a section is declared twice for a menu, the second declaration is deduplicated", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const first = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "From the first module",
            children: []
        });

        const second = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "From the second module",
            children: []
        });

        registry.add("foo", "deferred", { $label: "1", to: "/1" }, { sectionId: "bar" });
        registry.add("foo", "deferred", { $label: "2", to: "/2" }, { sectionId: "bar" });

        expect(first.registrationStatus).toBe("registered");
        expect(second.registrationStatus).toBe("deduplicated");
        expect(registry.getItems("foo").length).toBe(1);
        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(2);
    });

    test.concurrent("when a section is declared twice and the second declaration is waiting for a missing section, the declaration is pending", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        // The declaration only competes for the identifier once it would take its place in the menu, otherwise
        // the section it is waiting for would stop being reported as missing.
        const result = registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        }, {
            sectionId: "missing"
        });

        expect(result.registrationStatus).toBe("pending");
        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(1);
    });
});

describe.concurrent("getItems", () => {
    test.concurrent("an empty array is returned when there's no registered items for the specified menu id", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        });

        registry.add("bar", "deferred", {
            $label: "3",
            to: "/3"
        });

        expect(Array.isArray(registry.getItems("toto"))).toBeTruthy();
        expect(registry.getItems("toto").length).toBe(0);
    });

    test.concurrent("the returned items are immutable", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        const result1 = registry.getItems("foo");
        const result2 = registry.getItems("foo");

        expect(result1).toBe(result2);

        registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        });

        const result3 = registry.getItems("foo");

        expect(result1).not.toBe(result3);
        expect(result2).not.toBe(result3);
    });

    test.concurrent("when a nested item is registered, a new instance of the array is returned", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result1 = registry.getItems("foo");

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = registry.getItems("foo");

        expect(result1).not.toBe(result2);
    });

    test.concurrent("a section that didn't change keeps its identity when another section is updated", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", { $id: "left", $label: "Left", children: [] });
        registry.add("foo", "static", { $id: "right", $label: "Right", children: [] });

        const before = registry.getItems("foo");

        expect(registry.getItems("foo")).toBe(before);

        registry.add("foo", "static", { $label: "1", to: "/1" }, { sectionId: "left" });

        const after = registry.getItems("foo");

        // Only the section the item landed in is rebuilt.
        expect(after).not.toBe(before);
        expect(after[0]).not.toBe(before[0]);
        expect(after[1]).toBe(before[1]);
    });
});

describe.concurrent("clearDeferredItems", () => {
    test.concurrent("clear all deferred items", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "deferred", {
            $label: "1",
            to: "1"
        });

        registry.add("foo", "static", {
            $label: "2",
            to: "2"
        });

        registry.add("bar", "deferred", {
            $label: "3",
            to: "3"
        });

        expect(registry.getItems("foo").length).toBe(2);
        expect(registry.getItems("bar").length).toBe(1);

        registry.clearDeferredItems();

        expect(registry.getItems("foo").length).toBe(1);
        expect(registry.getItems("bar").length).toBe(0);
    });

    test.concurrent("do not clear static items", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "1"
        });

        expect(registry.getItems("foo").length).toBe(1);

        registry.clearDeferredItems();

        expect(registry.getItems("foo")[0]).toBeDefined();
        expect(registry.getItems("foo")[0].$label).toBe("1");
        expect(registry.getItems("foo")[0].to).toBe("1");
    });

    test.concurrent("when there's no deferred items to clear, do not mutate the menu arrays", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "1"
        });

        const array1 = registry.getItems("foo");

        registry.clearDeferredItems();

        const array2 = registry.getItems("foo");

        expect(array1).toBe(array2);
    });

    test.concurrent("clear the deferred pending registrations", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // The section is missing, therefore the nested item registration is pending.
        registry.add("foo", "deferred", {
            $label: "1",
            to: "1"
        }, { sectionId: "bar" });

        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(1);

        registry.clearDeferredItems();

        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(0);
    });

    test.concurrent("do not clear the static pending registrations", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "1"
        }, { sectionId: "bar" });

        registry.clearDeferredItems();

        const pendingRegistrations = registry.getPendingRegistrations();
        const pendingSectionIds = pendingRegistrations.getPendingSectionIds();

        expect(pendingSectionIds.length).toBe(1);

        // Asserting on the registration values rather than on the index key itself, the key format is an
        // implementation detail.
        const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(pendingSectionIds[0]);

        expect(pendingItems.length).toBe(1);
        expect(pendingItems[0].menuId).toBe("foo");
        expect(pendingItems[0].sectionId).toBe("bar");
    });

    test.concurrent("when a section has both static and deferred pending registrations, only clear the deferred ones", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "1"
        }, { sectionId: "bar" });

        registry.add("foo", "deferred", {
            $label: "2",
            to: "2"
        }, { sectionId: "bar" });

        registry.clearDeferredItems();

        const pendingRegistrations = registry.getPendingRegistrations();
        const pendingSectionIds = pendingRegistrations.getPendingSectionIds();

        expect(pendingSectionIds.length).toBe(1);

        const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(pendingSectionIds[0]);

        expect(pendingItems.length).toBe(1);
        expect(pendingItems[0].item.$label).toBe("1");
    });

    test.concurrent("when a deferred section is registered again after a clear, the nested item is not duplicated", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const registerSection = () => {
            registry.add("foo", "deferred", {
                $id: "bar",
                $label: "Bar",
                children: []
            });
        };

        const registerNestedItem = () => {
            registry.add("foo", "deferred", {
                $label: "1",
                to: "1"
            }, { sectionId: "bar" });
        };

        registerSection();
        registerNestedItem();

        // The section is not registered by this run, leaving the nested item registration pending.
        registry.clearDeferredItems();
        registerNestedItem();

        // The section is registered again by this run.
        registry.clearDeferredItems();
        registerSection();
        registerNestedItem();

        const items = registry.getItems("foo");

        expect(items.length).toBe(1);
        expect((items[0] as NavigationSection).children.length).toBe(1);
    });

    test.concurrent("when a section id is registered as deferred for a menu and as static for another menu, do not clear the static section index entry", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "shared",
            $label: "Shared",
            children: []
        });

        registry.add("bar", "deferred", {
            $id: "shared",
            $label: "Shared",
            children: []
        });

        registry.clearDeferredItems();

        // The static section index entry must still resolve nested item registrations.
        registry.add("foo", "static", {
            $label: "1",
            to: "1"
        }, { sectionId: "shared" });

        const items = registry.getItems("foo");

        expect(items.length).toBe(1);
        expect((items[0] as NavigationSection).children.length).toBe(1);
        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(0);
    });

    test.concurrent("a static section cannot accumulate deferred children across a clear", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        // The deferred items are deleted at every depth, therefore replaying the same registration run after
        // run cannot make the children of a static section grow.
        const counts: number[] = [];

        for (let i = 0; i < 3; i++) {
            registry.clearDeferredItems();

            registry.add("foo", "deferred", {
                $label: "1",
                to: "1"
            }, { sectionId: "bar" });

            counts.push((registry.getItems("foo")[0] as NavigationSection).children.length);
        }

        expect(counts).toEqual([1, 1, 1]);
    });

    test.concurrent("a section index entry cannot be orphaned, a section is only indexed once it is registered", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // The inner section duplicates the "$id" of the outer one. The outer section is registered and the
        // inner declaration is deduplicated, rather than leaving the outer section indexed for a menu that
        // doesn't hold it.
        const result = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "Bar",
            children: [{
                $id: "bar",
                $label: "Bar",
                children: []
            }]
        });

        expect(result.registrationStatus).toBe("registered");
        expect(registry.getItems("foo").length).toBe(1);
        expect((registry.getItems("foo")[0] as NavigationSection).children.length).toBe(0);

        registry.clearDeferredItems();

        expect(registry.getItems("foo").length).toBe(0);

        // Without the entry, the section can be registered again.
        registry.add("foo", "deferred", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        expect(registry.getItems("foo").length).toBe(1);
    });

    test.concurrent("when a static and a deferred pending registration would collide once concatenated, the deferred section does not pick up the static item", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // Both pending registrations used to share a single index key, so the static one survived the clear
        // under the key the deferred section is registered with, and the replay pushed it through the
        // registration type guard.
        registry.add("analytics-sidebar", "static", {
            $label: "Static",
            to: "/static"
        }, { sectionId: "performance" });

        registry.add("analytics", "deferred", {
            $label: "Deferred",
            to: "/deferred"
        }, { sectionId: "sidebar-performance" });

        registry.clearDeferredItems();

        expect(() => {
            registry.add("analytics", "deferred", {
                $id: "sidebar-performance",
                $label: "Performance",
                children: []
            });
        }).not.toThrow();

        expect((registry.getItems("analytics")[0] as NavigationSection).children.length).toBe(0);

        const pendingRegistrations = registry.getPendingRegistrations();
        const pendingSectionIds = pendingRegistrations.getPendingSectionIds();

        expect(pendingSectionIds.length).toBe(1);

        const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(pendingSectionIds[0]);

        expect(pendingItems.length).toBe(1);
        expect(pendingItems[0].menuId).toBe("analytics-sidebar");
    });

    test.concurrent("a statically duplicated declaration survives a clear", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        // A static declaration belongs to the initial registration rather than to the run being cleared.
        // Deleting it would silently swallow a misconfiguration that strict mode reports.
        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            $priority: 10,
            children: []
        });

        registry.clearDeferredItems();

        const declarations = registry.getDuplicateSectionDeclarations();

        expect(declarations.getDuplicatedSectionIds().length).toBe(1);
        expect(declarations.getDeclarationsForSection(declarations.getDuplicatedSectionIds()[0]).length).toBe(1);
    });

    test.concurrent("when a run only declared a duplicated section, the declaration is still deleted", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        // Declaring a duplicated section doesn't add a registration, therefore a run that only declared one
        // has nothing deferred to delete and would keep the declaration of every run otherwise.
        for (let i = 0; i < 5; i++) {
            registry.clearDeferredItems();

            registry.add("foo", "deferred", {
                $id: "bar",
                $label: "Bar",
                $priority: 10,
                children: []
            });
        }

        const declarations = registry.getDuplicateSectionDeclarations();
        const total = declarations.getDuplicatedSectionIds()
            .reduce((acc, x) => acc + declarations.getDeclarationsForSection(x).length, 0);

        expect(total).toBe(1);
    });

    test.concurrent("a registered duplicated declaration is not recorded again by every clear", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        // Waiting for the "holder" section, therefore it only finds the "bar" identifier taken once that
        // section is registered below. That declaration is recorded while the section is being indexed rather
        // than by the registration that declared it, and the rebuild indexes it again on every clear.
        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        }, {
            sectionId: "holder"
        });

        registry.add("foo", "static", {
            $id: "holder",
            $label: "Holder",
            children: []
        });

        const countDeclarations = () => {
            const declarations = registry.getDuplicateSectionDeclarations();

            return declarations.getDuplicatedSectionIds()
                .reduce((acc, x) => acc + declarations.getDeclarationsForSection(x).length, 0);
        };

        for (let i = 0; i < 5; i++) {
            registry.add("foo", "deferred", {
                $label: "Deferred",
                to: "/deferred"
            });

            registry.clearDeferredItems();
        }

        expect(countDeclarations()).toBe(1);
    });

    test.concurrent("should not let consumers mutate the internal registry through the returned declarations", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            $priority: 10,
            children: []
        });

        const declarations = registry.getDuplicateSectionDeclarations();
        const indexKey = declarations.getDuplicatedSectionIds()[0];

        declarations.getDeclarationsForSection(indexKey).push({
            menuId: "foo",
            sectionId: "bar",
            registrationType: "static",
            item: { $id: "bar", $label: "Bar", children: [] },
            isInlineDeclaration: false,
            hasConflictingLabel: false,
            hasDiscardedPriority: false,
            hasDiscardedParentSectionId: false,
            isRegistered: false
        });

        expect(registry.getDuplicateSectionDeclarations().getDeclarationsForSection(indexKey).length).toBe(1);
    });

    test.concurrent("when there is nothing to clear, a registered duplicated declaration is kept", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        });

        registry.add("foo", "static", {
            $id: "bar",
            $label: "Bar",
            children: []
        }, {
            sectionId: "holder"
        });

        registry.add("foo", "static", {
            $id: "holder",
            $label: "Holder",
            children: []
        });

        // Nothing is rebuilt when there is no deferred registration to delete, therefore nothing would record
        // the declaration again and deleting it here would lose it.
        registry.clearDeferredItems();

        const declarations = registry.getDuplicateSectionDeclarations();

        expect(declarations.getDuplicatedSectionIds().length).toBe(1);
    });
});

describe.concurrent("NavigationItemDeferredRegistrationScope", () => {
    test.concurrent("should add a single item", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        scope.addItem("foo", {
            $label: "Bar",
            to: "/bar"
        });

        expect(scope.getItems("foo")[0]).toBeDefined();
        expect(scope.getItems("foo")[0].$label).toBe("Bar");
        expect(scope.getItems("foo")[0].to).toBe("/bar");
    });

    test.concurrent("should add multiple items", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        scope.addItem("foo", {
            $label: "2",
            to: "/2"
        });

        scope.addItem("foo", {
            $label: "3",
            to: "/3"
        });

        expect(scope.getItems("foo").length).toBe(3);
    });

    test.concurrent("should add items for different menus", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        scope.addItem("bar", {
            $label: "2",
            to: "/2"
        });

        expect(scope.getItems("foo").length).toBe(1);
        expect(scope.getItems("bar").length).toBe(1);
    });

    test.concurrent("adding an item also add the item to the registry", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        expect(registry.getItems("foo").length).toBe(0);

        scope.addItem("foo", {
            $label: "Bar",
            to: "/bar"
        });

        expect(registry.getItems("foo").length).toBe(1);
    });

    test.concurrent("completing the scope doesn't alter the registry items", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        registry.add("bar", "deferred", {
            $label: "2",
            to: "/2"
        });

        expect(registry.getItems("foo").length).toBe(1);
        expect(registry.getItems("bar").length).toBe(1);

        scope.addItem("foo", {
            $label: "3",
            to: "/3"
        });

        scope.complete();

        expect(registry.getItems("foo").length).toBe(2);
        expect(registry.getItems("bar").length).toBe(1);
        expect(registry.getItems("foo")[0].$label).toBe("1");
    });

    test.concurrent("when an item is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested item is pending, return the \"pending\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("pending");
    });

    test.concurrent("when a nested item is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        scope.addItem("foo", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested section is added and complete the pending registration of nested items, add the registered items to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        const result1 = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const result2 = scope.addItem("foo", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result2.registrationStatus).toBe("registered");
        expect(result2.completedPendingRegistrations.length).toBe(1);
        expect(result2.completedPendingRegistrations[0]).toBe(result1.item);
    });
});

describe.concurrent("NavigationItemDeferredRegistrationTransactionalScope", () => {
    test.concurrent("should add a single item", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "Bar",
            to: "/bar"
        });

        expect(scope.getItems("foo")[0]).toBeDefined();
        expect(scope.getItems("foo")[0].$label).toBe("Bar");
        expect(scope.getItems("foo")[0].to).toBe("/bar");
    });

    test.concurrent("should add multiple items", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        scope.addItem("foo", {
            $label: "2",
            to: "/2"
        });

        scope.addItem("foo", {
            $label: "3",
            to: "/3"
        });

        expect(scope.getItems("foo").length).toBe(3);
    });

    test.concurrent("should add items for different menus", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        scope.addItem("bar", {
            $label: "2",
            to: "/2"
        });

        expect(scope.getItems("foo").length).toBe(1);
        expect(scope.getItems("bar").length).toBe(1);
    });

    test.concurrent("adding an item doesn't add the item to the registry", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        expect(registry.getItems("foo").length).toBe(0);

        scope.addItem("foo", {
            $label: "bar",
            to: "/bar"
        });

        expect(registry.getItems("foo").length).toBe(0);
    });

    test.concurrent("when there's no items for the provided menu id, return an empty array", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "bar",
            to: "/bar"
        });

        expect(Array.isArray(registry.getItems("toto"))).toBeTruthy();
        expect(registry.getItems("toto").length).toBe(0);
    });

    test.concurrent("completing the scope add all the active items to the registry", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        expect(registry.getItems("foo").length).toBe(0);

        scope.addItem("foo", {
            $label: "Bar",
            to: "/bar"
        });

        scope.complete();

        expect(registry.getItems("foo").length).toBe(1);
    });

    test.concurrent("completing the scope clears the previously registered deferred items", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        registry.add("foo", "deferred", {
            $label: "1",
            to: "/1"
        });

        registry.add("bar", "deferred", {
            $label: "2",
            to: "/2"
        });

        expect(registry.getItems("foo").length).toBe(1);
        expect(registry.getItems("bar").length).toBe(1);

        scope.addItem("foo", {
            $label: "3",
            to: "3"
        });

        scope.complete();

        expect(registry.getItems("foo").length).toBe(1);
        expect(registry.getItems("bar").length).toBe(0);
        expect(registry.getItems("foo")[0].$label).toBe("3");
    });

    test.concurrent("completing the scope clears the scope active items", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        scope.addItem("bar", {
            $label: "2",
            to: "/2"
        });

        scope.complete();

        expect(scope.getItems("foo").length).toBe(0);
        expect(scope.getItems("bar").length).toBe(0);
    });

    test.concurrent("when an item is added, return the \"buffered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        expect(result.registrationStatus).toBe("buffered");
    });

    test.concurrent("when a nested item is added, return the \"buffered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("buffered");
    });

    test.concurrent("when a nested item whose section is missing is added, return the \"buffered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        // This one used to report "registered" even though the replay leaves it pending, which is the
        // inaccuracy ADR-0022 is about.
        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("buffered");
    });

    test.concurrent("when the scope is completed, return the registration result of every replayed item", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const results = scope.complete();

        expect(results.length).toBe(2);
        expect(results[0].registrationStatus).toBe("registered");
        expect(results[1].registrationStatus).toBe("registered");
    });

    test.concurrent("when the scope is completed and a section is not re-registered, the replay reports the nested item as pending", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        // The section is never registered by this run, so the replay cannot resolve the nested item. The
        // buffered status returned by "addItem" is not the outcome, this is.
        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        const results = scope.complete();

        expect(results.length).toBe(1);
        expect(results[0].registrationStatus).toBe("pending");
        expect(results[0].menuId).toBe("foo");
        expect(results[0].sectionId).toBe("bar");
    });

    test.concurrent("when a non transactional scope is completed, no registration result is returned", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        expect(scope.complete().length).toBe(0);
    });

    test.concurrent("when there \"should\" be pending registrations, the scope can be completed", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        scope.addItem("foo", {
            $label: "2",
            to: "/2"
        }, {
            sectionId: "bar"
        });

        scope.addItem("foo", {
            $id: "bar",
            $label: "bat",
            children: []
        }, {
            sectionId: "toto"
        });

        scope.addItem("foo", {
            $id: "toto",
            $label: "toto",
            children: []
        });

        scope.complete();

        expect(registry.getPendingRegistrations().getPendingSectionIds().length).toBe(0);
    });
});

describe.concurrent("getAllItemsByMenu", () => {
    test.concurrent("should return an empty Map when no items have been registered", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.getAllItemsByMenu();

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
    });

    test.concurrent("should return items grouped by menu id", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        registry.add("foo", "static", {
            $label: "2",
            to: "/2"
        });

        registry.add("bar", "deferred", {
            $label: "3",
            to: "/3"
        });

        const result = registry.getAllItemsByMenu();

        expect(result.size).toBe(2);
        expect(result.get("foo")!.map(x => x.to)).toEqual(["/1", "/2"]);
        expect(result.get("bar")!.map(x => x.to)).toEqual(["/3"]);
    });

    test.concurrent("should reflect both static and deferred items", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "static",
            to: "/static"
        });

        registry.add("foo", "deferred", {
            $label: "deferred",
            to: "/deferred"
        });

        const result = registry.getAllItemsByMenu();

        expect(result.get("foo")!.length).toBe(2);
        expect(result.get("foo")!.map(x => x.to)).toEqual(["/static", "/deferred"]);
    });

    test.concurrent("should reflect items added under a section via sectionId", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "section",
            $label: "Section",
            children: []
        });

        registry.add("foo", "static", {
            $label: "Nested",
            to: "/nested"
        }, {
            sectionId: "section"
        });

        const result = registry.getAllItemsByMenu();

        expect(result.get("foo")!.length).toBe(1);
        expect(result.get("foo")![0].children![0].to).toBe("/nested");
    });

    test.concurrent("should return the same Map reference across successive calls", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        const first = registry.getAllItemsByMenu();
        const second = registry.getAllItemsByMenu();

        expect(first).toBe(second);
    });

    test.concurrent("should return a new Map reference after a new item is added", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        const first = registry.getAllItemsByMenu();

        registry.add("bar", "static", {
            $label: "2",
            to: "/2"
        });

        const second = registry.getAllItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.size).toBe(2);
    });

    test.concurrent("should return a new Map reference after a nested item is added under an existing section", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $id: "section",
            $label: "Section",
            children: []
        });

        const first = registry.getAllItemsByMenu();

        registry.add("foo", "static", {
            $label: "Nested",
            to: "/nested"
        }, {
            sectionId: "section"
        });

        const second = registry.getAllItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.get("foo")![0].children![0].to).toBe("/nested");
    });

    test.concurrent("should return a new Map reference after deferred items are cleared", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "static",
            to: "/static"
        });

        registry.add("foo", "deferred", {
            $label: "deferred",
            to: "/deferred"
        });

        const first = registry.getAllItemsByMenu();

        expect(first.get("foo")!.length).toBe(2);

        registry.clearDeferredItems();

        const second = registry.getAllItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.get("foo")!.length).toBe(1);
        expect(second.get("foo")![0].to).toBe("/static");
    });

    test.concurrent("inner arrays share the same reference as getItems(menuId)", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        });

        const byMenu = registry.getAllItemsByMenu();

        expect(byMenu.get("foo")).toBe(registry.getItems("foo"));
    });

    test.concurrent("a menu that only received pending registrations is not included", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("foo", "static", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "missing"
        });

        // A menu is known once it holds an item, otherwise a menu that never rendered anything would be
        // returned as an empty one.
        expect(registry.getAllItemsByMenu().size).toBe(0);

        registry.add("foo", "static", {
            $id: "missing",
            $label: "Missing",
            children: []
        });

        expect(registry.getAllItemsByMenu().size).toBe(1);
    });
});

describe.concurrent("parseSectionIndexKey", () => {
    test.concurrent("a key returned by getPendingSectionIds round-trips back to its menu id and section id", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        registry.add("analytics-sidebar", "static", {
            $label: "1",
            to: "1"
        }, { sectionId: "performance" });

        const [indexKey] = registry.getPendingRegistrations().getPendingSectionIds();

        // Nothing in the framework calls this function anymore, so only a round-trip through a real key keeps
        // it from drifting away from the key format.
        expect(parseSectionIndexKey(indexKey)).toEqual(["analytics-sidebar", "performance"]);
    });

    test.concurrent("a key round-trips even when a menu id contains the separator", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        // Nothing forbids the separator inside an id, so the key format has to stay unambiguous for one that
        // contains it. Without the length prefix this pair collided with ("a", "b\u0000c").
        registry.add("a\u0000b", "static", {
            $label: "1",
            to: "1"
        }, { sectionId: "c" });

        registry.add("a", "static", {
            $label: "2",
            to: "2"
        }, { sectionId: "b\u0000c" });

        const keys = registry.getPendingRegistrations().getPendingSectionIds();

        expect(keys).toHaveLength(2);
        expect(keys.map(x => parseSectionIndexKey(x))).toEqual([
            ["a\u0000b", "c"],
            ["a", "b\u0000c"]
        ]);
    });
});
