import { describe, test } from "vitest";
import { NavigationItemDeferredRegistrationScope, NavigationItemDeferredRegistrationTransactionalScope, NavigationItemRegistry } from "../src/NavigationItemRegistry.ts";

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

    test.concurrent("when a static item is nested under a deferred section, throw an error", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "deferred", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");

        expect(() => {
            registry.add("foo", "static", {
                $label: "1",
                to: "/1"
            }, {
                sectionId: "bar"
            });
        }).toThrow();
    });

    test.concurrent("when a deferred item is nested under a static section, throw an error", ({ expect }) => {
        const registry = new NavigationItemRegistry();

        const result = registry.add("foo", "static", {
            $id: "bar",
            $label: "bar",
            children: []
        });

        expect(result.registrationStatus).toBe("registered");

        expect(() => {
            registry.add("foo", "deferred", {
                $label: "1",
                to: "/1"
            }, {
                sectionId: "bar"
            });
        }).toThrow();
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

    test.concurrent("when an item is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested item is added, return the \"registered\" registration status", ({ expect }) => {
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

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested item that \"should\" be pending is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new NavigationItemRegistry();
        const scope = new NavigationItemDeferredRegistrationTransactionalScope(registry);

        const result = scope.addItem("foo", {
            $label: "1",
            to: "/1"
        }, {
            sectionId: "bar"
        });

        expect(result.registrationStatus).toBe("registered");
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
