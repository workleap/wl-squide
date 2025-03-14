import { isNil } from "@squide/core";
import memoize, { memoizeClear } from "memoize";
import type { ReactNode } from "react";
import type { LinkProps } from "react-router";

export interface NavigationLink extends Omit<LinkProps, "children"> {
    $id?: string;
    $label: ReactNode;
    $additionalProps?: Record<string, unknown>;
    $canRender?: (obj?: unknown) => boolean;
    children?: never;
}

export interface NavigationSection {
    $id?: string;
    $label: ReactNode;
    $additionalProps?: Record<string, unknown>;
    $canRender?: (obj?: unknown) => boolean;
    children: NavigationItem[];
    to?: never;
}

export type NavigationItem = NavigationLink | NavigationSection;

// Will be exposed externally but is only expected to be used internally.
export function isLinkItem(item: NavigationItem): item is NavigationLink {
    return !isNil((item as NavigationLink).to);
}

export type RootNavigationItem = NavigationItem & {
    // Highest priority is rendered first.
    $priority?: number;
};

export interface AddNavigationItemOptions {
    sectionId?: string;
}

export type NavigationItemRegistrationStatus = "pending" | "registered";
export type NavigationItemRegistrationType = "static" | "deferred";

export interface NavigationItemRegistrationResult {
    registrationStatus: NavigationItemRegistrationStatus;
    completedPendingRegistrations: NavigationItem[];
    registrationType: NavigationItemRegistrationType;
    item: RootNavigationItem;
    menuId: string;
    sectionId?: string;
}

interface RegistryItem {
    menuId: string;
    registrationType: NavigationItemRegistrationType;
    item: RootNavigationItem;
}

interface SectionIndexItem {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: NavigationSection;
}

interface PendingRegistrationItem {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: RootNavigationItem;
}

interface DeferredRegistrationTransactionalScopeItem extends RegistryItem {
    options?: AddNavigationItemOptions;
}

export class NavigationItemDeferredRegistrationScope {
    readonly _registry: NavigationItemRegistry;

    constructor(registry: NavigationItemRegistry) {
        this._registry = registry;
    }

    addItem(menuId: string, navigationItem: NavigationItem, options?: AddNavigationItemOptions) {
        return this._registry.add(menuId, "deferred", navigationItem, options);
    }

    getItems(menuId: string) {
        return this._registry.getItems(menuId);
    }

    complete() {}
}

export class NavigationItemDeferredRegistrationTransactionalScope extends NavigationItemDeferredRegistrationScope {
    readonly #ItemsIndex: Map<string, DeferredRegistrationTransactionalScopeItem[]> = new Map();

    addItem(menuId: string, navigationItem: NavigationItem, options: AddNavigationItemOptions = {}): NavigationItemRegistrationResult {
        this.#ItemsIndex.set(menuId, [
            ...(this.#ItemsIndex.get(menuId) ?? []),
            {
                menuId,
                registrationType: "deferred",
                item: navigationItem,
                options
            }
        ]);

        // This scope is only for updates, meaning that we know there will not be any pending registrations
        // so we can safely return that an item is registered even if it's only buffered.
        return {
            registrationStatus: "registered",
            completedPendingRegistrations: [],
            registrationType: "deferred",
            item: navigationItem,
            menuId,
            sectionId: options.sectionId
        };
    }

    getItems(menuId: string) {
        return this.#ItemsIndex.get(menuId)?.map(x => x.item) ?? [];
    }

    complete() {
        this._registry.clearDeferredItems();

        this.#ItemsIndex.forEach(items => {
            items.forEach(x => {
                this._registry.add(x.menuId, x.registrationType, x.item, x.options);
            });
        });

        this.#ItemsIndex.clear();
    }
}

function createSectionIndexKey(menuId: string, sectionId: string) {
    return `${menuId}-${sectionId}`;
}

export function parseSectionIndexKey(indexKey: string) {
    return indexKey.split("-");
}

export class NavigationItemRegistry {
    // <menuId, RegistryItem[]>
    readonly #menusIndex: Map<string, RegistryItem[]> = new Map();

    // <menuId-sectionId, SectionIndexItem>
    readonly #sectionsIndex: Map<string, SectionIndexItem> = new Map();

    // An index of pending navigation items to registered once their section is registered.
    // <menuId-sectionId, PendingRegistrationItem[]>
    readonly #pendingRegistrationsIndex: Map<string, PendingRegistrationItem[]> = new Map();

    // Since the "getItems" function is transforming the menus items from registry items to navigation items, the result of
    // the transformation is memoized to ensure the returned array is immutable and can be use in React closures.
    readonly #memoizedGetItems = memoize((menuId: string) => this.#menusIndex.get(menuId)?.map(x => x.item) ?? []);

    #addSectionIndex(menuId: string, registrationType: NavigationItemRegistrationType, sectionItem: NavigationSection) {
        // Only add sections with an identifier.
        if (sectionItem.$id) {
            const indexKey = createSectionIndexKey(menuId, sectionItem.$id);

            if (this.#sectionsIndex.has(indexKey)) {
                throw new Error(`[squide] A navigation section index has already been registered for the menu: "${menuId}" and section: "${sectionItem.$id}". Did you register two navigation sections with similar "$id" option for the same menu?`);
            }

            this.#sectionsIndex.set(indexKey, {
                menuId,
                sectionId: sectionItem.$id,
                registrationType,
                item: sectionItem
            });

            return indexKey;
        }
    }

    #recursivelyRegisterSections(menuId: string, registrationType: NavigationItemRegistrationType, items: NavigationItem[]) {
        const completedPendingRegistrations: NavigationItem[] = [];

        items.forEach(x => {
            if (!isLinkItem(x)) {
                // Add index entries to speed up the registration of future nested navigation items.
                const indexKey = this.#addSectionIndex(menuId, registrationType, x);

                if (x.children) {
                    // Recursively go through the children.
                    const result = this.#recursivelyRegisterSections(menuId, registrationType, x.children);
                    completedPendingRegistrations.push(...result);
                }

                // If there's an index key, it means it's an identified section so there could be pending registrations.
                if (indexKey) {
                    const result = this.#tryRegisterPendingItems(indexKey);
                    completedPendingRegistrations.unshift(...result);
                }
            }
        });

        return completedPendingRegistrations;
    }

    #tryRegisterPendingItems(indexKey: string) {
        const completedPendingRegistrations: RootNavigationItem[] = [];
        const pendingRegistrations = this.#pendingRegistrationsIndex.get(indexKey);

        if (pendingRegistrations) {
            completedPendingRegistrations.push(...(pendingRegistrations.map(x => x.item)));

            pendingRegistrations.forEach(x => {
                // Register the pending navigation items.
                const result = this.#addNestedItem(x.menuId, x.sectionId, x.registrationType, x.item);
                completedPendingRegistrations.push(...result.completedPendingRegistrations);
            });

            // Delete the pending registrations for the section.
            this.#pendingRegistrationsIndex.delete(indexKey);
        }

        return completedPendingRegistrations;
    }

    #setItems(menuId: string, items: RegistryItem[]) {
        this.#menusIndex.set(menuId, items);

        memoizeClear(this.#memoizedGetItems);
    }

    add(menuId: string, registrationType: NavigationItemRegistrationType, navigationItem: RootNavigationItem, { sectionId }: AddNavigationItemOptions = {}): NavigationItemRegistrationResult {
        if (sectionId) {
            return this.#addNestedItem(menuId, sectionId, registrationType, navigationItem);
        }

        if (isLinkItem(navigationItem)) {
            return this.#addRootLink(menuId, registrationType, navigationItem);
        }

        return this.#addRootSection(menuId, registrationType, navigationItem);
    }

    #addRootLink(menuId: string, registrationType: NavigationItemRegistrationType, item: RootNavigationItem): NavigationItemRegistrationResult {
        // Create a new array so the navigation items array is immutable.
        const items = [
            ...(this.#menusIndex.get(menuId) ?? []),
            {
                menuId,
                registrationType,
                item: item
            }
        ];

        this.#setItems(menuId, items);

        return {
            registrationStatus: "registered",
            completedPendingRegistrations: [],
            registrationType,
            item,
            menuId
        };
    }

    #addRootSection(menuId: string, registrationType: NavigationItemRegistrationType, item: RootNavigationItem): NavigationItemRegistrationResult {
        const completedPendingRegistrations = this.#recursivelyRegisterSections(menuId, registrationType, [item]);

        // Create a new array so the navigation items array is immutable.
        const items = [
            ...(this.#menusIndex.get(menuId) ?? []),
            {
                menuId,
                registrationType,
                item: item
            }
        ];

        this.#setItems(menuId, items);

        return {
            registrationStatus: "registered",
            completedPendingRegistrations,
            registrationType,
            item,
            menuId,
            sectionId: item.$id
        };
    }

    #addNestedItem(menuId: string, sectionId: string, registrationType: NavigationItemRegistrationType, item: RootNavigationItem): NavigationItemRegistrationResult {
        const indexKey = createSectionIndexKey(menuId, sectionId);
        const parentSection = this.#sectionsIndex.get(indexKey);

        if (!parentSection) {
            const registryItem = {
                menuId,
                sectionId,
                registrationType,
                item: item
            };

            const pendingRegistration = this.#pendingRegistrationsIndex.get(indexKey);

            if (pendingRegistration) {
                pendingRegistration.push(registryItem);
            } else {
                this.#pendingRegistrationsIndex.set(indexKey, [registryItem]);
            }

            return {
                registrationStatus: "pending",
                completedPendingRegistrations: [],
                registrationType,
                item,
                menuId,
                sectionId
            };
        }

        // Must be the same registration type as the section to ensure
        // deferred registrations updates works properly.
        if (parentSection.registrationType !== registrationType) {
            let message = "[squide] A nested navigation item must have the same registration type as the section it's nested under.\r\n";
            message += "Did you statically (not in a deferred registration function) register the navigation section and registered the nested navigation item in a deferred registration function?\r\n";
            message += "Did you deferred the registration of the navigation section and statically (not in a deferred registration function) registered the nested navigation item?";

            throw new Error(message);
        }

        const completedPendingRegistrations: RootNavigationItem[] = [];

        // If it's a section item, add a section index entry and look for pending registrations.
        if (!isLinkItem(item)) {
            const result = this.#recursivelyRegisterSections(menuId, registrationType, [item]);
            completedPendingRegistrations.push(...result);
        }

        // Register the nested item as a children of the parent section.
        parentSection.item.children = [
            ...(parentSection.item.children ?? []),
            item
        ];

        // Clear the "getItems" memoize cache since a nested object has been updated.
        memoizeClear(this.#memoizedGetItems);

        return {
            registrationStatus: "registered",
            completedPendingRegistrations,
            registrationType,
            item,
            menuId,
            sectionId
        };
    }

    getItems(menuId: string) {
        return this.#memoizedGetItems(menuId);
    }

    clearDeferredItems() {
        const keys = this.#menusIndex.keys();

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const next = keys.next();

            if (next.done) {
                break;
            }

            const key = next.value;
            const registryItems = this.#menusIndex.get(key)!;

            // Keep the "getItems" function immutable by only updating the menu arrays if the items actually changed.
            if (registryItems.some(x => x.registrationType === "deferred")) {
                this.#setItems(key, registryItems.filter(x => x.registrationType !== "deferred"));
            }

            // Keep the section index in sync with the menu index.
            this.#deleteDeferredSectionIndexEntries(key);
        }
    }

    #deleteDeferredSectionIndexEntries(menuId: string) {
        const idsToDelete: string[] = [];

        this.#sectionsIndex.forEach(y => {
            if (y.registrationType === "deferred") {
                idsToDelete.push(y.sectionId);
            }
        });

        idsToDelete.forEach(y => this.#sectionsIndex.delete(createSectionIndexKey(menuId, y)));
    }

    getPendingRegistrations() {
        return new PendingNavigationItemRegistrations(this.#pendingRegistrationsIndex);
    }
}

export class PendingNavigationItemRegistrations {
    readonly #pendingRegistrationsIndex: Map<string, RegistryItem[]> = new Map();

    constructor(pendingRegistrationsIndex: Map<string, RegistryItem[]> = new Map()) {
        this.#pendingRegistrationsIndex = pendingRegistrationsIndex;
    }

    getPendingSectionIds() {
        return Array.from(this.#pendingRegistrationsIndex.keys());
    }

    getPendingRegistrationsForSection(indexKey: string) {
        return this.#pendingRegistrationsIndex.get(indexKey) ?? [];
    }
}
