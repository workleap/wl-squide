import { isNil } from "@squide/core/internal";
import memoize, { memoizeClear } from "memoize";
import type { ReactNode } from "react";
import type { LinkProps } from "react-router";

export interface NavigationLink extends Omit<LinkProps, "children"> {
    $id?: string;
    $label: ReactNode;
    // Spread onto the rendered component, unlike "$meta" which is only read by the renderer.
    $additionalProps?: Record<string, unknown>;
    $meta?: Record<string, unknown>;
    $canRender?: (obj?: unknown) => boolean;
    children?: never;
}

export interface NavigationSection {
    $id?: string;
    $label: ReactNode;
    // Spread onto the rendered component, unlike "$meta" which is only read by the renderer.
    $additionalProps?: Record<string, unknown>;
    $meta?: Record<string, unknown>;
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

export interface PendingRegistrationItem {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: RootNavigationItem;
}

export interface PendingSection {
    menuId: string;
    sectionId: string;
    items: RootNavigationItem[];
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

        // The item is only buffered at this point, and the replay performed by the "complete" function can
        // still leave it pending when its section is not re-registered by the run. Reporting "registered"
        // here is therefore not always accurate, see https://github.com/workleap/wl-squide/issues/658.
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

// The section index and the pending index are keyed by the ("menuId", "sectionId") pair itself, as a Map of
// Maps, rather than by a string built from the two. Any string scheme has to pick a separator, and a separator
// that can appear inside either value makes two different pairs produce one key: ("analytics",
// "sidebar-performance") and ("analytics-sidebar", "performance") both joined to "analytics-sidebar-performance"
// under the "-" this used to use. Picking a rarer separator relocates that assumption instead of removing it.
// See ADR-0022.
function getOrCreateInner<T>(index: Map<string, Map<string, T>>, menuId: string) {
    let inner = index.get(menuId);

    if (!inner) {
        inner = new Map<string, T>();
        index.set(menuId, inner);
    }

    return inner;
}

/**
 * @deprecated The index key format is an implementation detail, and a "-" in a "menuId" or in a section "$id"
 * makes a key ambiguous: ("main-menu", "settings") and ("main", "menu-settings") both produce
 * "main-menu-settings", so the pair a key was built from cannot be recovered. Read the "menuId" and the
 * "sectionId" off the {@link PendingRegistrationItem} values returned by
 * {@link PendingNavigationItemRegistrations.getPendingRegistrationsForSection} rather than parsing a key
 * returned by {@link PendingNavigationItemRegistrations.getPendingSectionIds}. Nothing in the framework calls
 * this function anymore, it is kept until the next major to avoid a breaking removal.
 */
export function parseSectionIndexKey(indexKey: string) {
    return indexKey.split("-");
}

export class NavigationItemRegistry {
    // <menuId, RegistryItem[]>
    readonly #menusIndex: Map<string, RegistryItem[]> = new Map();

    // <menuId, <sectionId, SectionIndexItem>>
    readonly #sectionsIndex: Map<string, Map<string, SectionIndexItem>> = new Map();

    // An index of pending navigation items to register once their section is registered.
    // <menuId, <sectionId, PendingRegistrationItem[]>>
    readonly #pendingRegistrationsIndex: Map<string, Map<string, PendingRegistrationItem[]>> = new Map();

    // Since the "getItems" function is transforming the menus items from registry items to navigation items, the result of
    // the transformation is memoized to ensure the returned array is immutable and can be use in React closures.
    readonly #memoizedGetItems = memoize((menuId: string) => this.#menusIndex.get(menuId)?.map(x => x.item) ?? []);

    // Memoized grouped view of the full registry, reusing the per-menu memoized arrays so inner array references stay stable.
    readonly #memoizedGetAllItemsByMenu = memoize(() => {
        const result = new Map<string, RootNavigationItem[]>();

        for (const menuId of this.#menusIndex.keys()) {
            result.set(menuId, this.#memoizedGetItems(menuId));
        }

        return result;
    });

    #addSectionIndex(menuId: string, registrationType: NavigationItemRegistrationType, sectionItem: NavigationSection) {
        // Only add sections with an identifier.
        if (sectionItem.$id) {
            const sections = getOrCreateInner(this.#sectionsIndex, menuId);

            if (sections.has(sectionItem.$id)) {
                throw new Error(`[squide] A navigation section index has already been registered for the menu: "${menuId}" and section: "${sectionItem.$id}". Did you register two navigation sections with similar "$id" option for the same menu?`);
            }

            sections.set(sectionItem.$id, {
                menuId,
                sectionId: sectionItem.$id,
                registrationType,
                item: sectionItem
            });

            return sectionItem.$id;
        }
    }

    #recursivelyRegisterSections(menuId: string, registrationType: NavigationItemRegistrationType, items: NavigationItem[]) {
        const completedPendingRegistrations: NavigationItem[] = [];

        items.forEach(x => {
            if (!isLinkItem(x)) {
                // Add index entries to speed up the registration of future nested navigation items.
                const sectionId = this.#addSectionIndex(menuId, registrationType, x);

                if (x.children) {
                    // Recursively go through the children.
                    const result = this.#recursivelyRegisterSections(menuId, registrationType, x.children);
                    completedPendingRegistrations.push(...result);
                }

                // A section is only indexed when it has an "$id", and only an indexed section can have items
                // waiting on it.
                if (sectionId !== undefined) {
                    const result = this.#tryRegisterPendingItems(menuId, sectionId);
                    completedPendingRegistrations.unshift(...result);
                }
            }
        });

        return completedPendingRegistrations;
    }

    #tryRegisterPendingItems(menuId: string, sectionId: string) {
        const completedPendingRegistrations: RootNavigationItem[] = [];
        const pendingRegistrationsForMenu = this.#pendingRegistrationsIndex.get(menuId);
        const pendingRegistrations = pendingRegistrationsForMenu?.get(sectionId);

        if (pendingRegistrations) {
            completedPendingRegistrations.push(...(pendingRegistrations.map(x => x.item)));

            pendingRegistrations.forEach(x => {
                // Register the pending navigation items.
                const result = this.#addNestedItem(x.menuId, x.sectionId, x.registrationType, x.item);
                completedPendingRegistrations.push(...result.completedPendingRegistrations);
            });

            // Delete the pending registrations for the section.
            pendingRegistrationsForMenu!.delete(sectionId);

            if (pendingRegistrationsForMenu!.size === 0) {
                this.#pendingRegistrationsIndex.delete(menuId);
            }
        }

        return completedPendingRegistrations;
    }

    #setItems(menuId: string, items: RegistryItem[]) {
        this.#menusIndex.set(menuId, items);

        memoizeClear(this.#memoizedGetItems);
        memoizeClear(this.#memoizedGetAllItemsByMenu);
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
        const parentSection = this.#sectionsIndex.get(menuId)?.get(sectionId);

        if (!parentSection) {
            const registryItem = {
                menuId,
                sectionId,
                registrationType,
                item: item
            };

            const pendingRegistrationsForMenu = getOrCreateInner(this.#pendingRegistrationsIndex, menuId);
            const pendingRegistration = pendingRegistrationsForMenu.get(sectionId);

            if (pendingRegistration) {
                pendingRegistration.push(registryItem);
            } else {
                pendingRegistrationsForMenu.set(sectionId, [registryItem]);
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
        memoizeClear(this.#memoizedGetAllItemsByMenu);

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

    getAllItemsByMenu() {
        return this.#memoizedGetAllItemsByMenu();
    }

    clearDeferredItems() {
        const keys = this.#menusIndex.keys();

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
        }

        // Keep the section index and the pending registrations in sync with the menu index.
        this.#deleteDeferredSectionIndexEntries();
        this.#deleteDeferredPendingRegistrations();
    }

    #deleteDeferredSectionIndexEntries() {
        const emptyMenuIds: string[] = [];

        this.#sectionsIndex.forEach((sections, menuId) => {
            const sectionIdsToDelete: string[] = [];

            sections.forEach((x, sectionId) => {
                if (x.registrationType === "deferred") {
                    sectionIdsToDelete.push(sectionId);
                }
            });

            sectionIdsToDelete.forEach(x => sections.delete(x));

            if (sections.size === 0) {
                emptyMenuIds.push(menuId);
            }
        });

        emptyMenuIds.forEach(x => this.#sectionsIndex.delete(x));
    }

    #deleteDeferredPendingRegistrations() {
        const emptyMenuIds: string[] = [];

        this.#pendingRegistrationsIndex.forEach((pendingRegistrations, menuId) => {
            const sectionIdsToDelete: string[] = [];

            pendingRegistrations.forEach((items, sectionId) => {
                // Static pending registrations belong to the initial registration rather than to the run being
                // replayed. Deleting them would silently swallow a misconfiguration that strict mode reports.
                const remainingItems = items.filter(x => x.registrationType !== "deferred");

                if (remainingItems.length === 0) {
                    sectionIdsToDelete.push(sectionId);
                } else if (remainingItems.length !== items.length) {
                    pendingRegistrations.set(sectionId, remainingItems);
                }
            });

            sectionIdsToDelete.forEach(x => pendingRegistrations.delete(x));

            if (pendingRegistrations.size === 0) {
                emptyMenuIds.push(menuId);
            }
        });

        emptyMenuIds.forEach(x => this.#pendingRegistrationsIndex.delete(x));
    }

    getPendingRegistrations() {
        return new PendingNavigationItemRegistrations(this.#pendingRegistrationsIndex);
    }
}

export class PendingNavigationItemRegistrations {
    // <menuId, <sectionId, PendingRegistrationItem[]>>
    readonly #pendingRegistrationsIndex: Map<string, Map<string, PendingRegistrationItem[]>> = new Map();

    constructor(pendingRegistrationsIndex: Map<string, Map<string, PendingRegistrationItem[]>> = new Map()) {
        this.#pendingRegistrationsIndex = pendingRegistrationsIndex;
    }

    /**
     * The sections that have navigation items waiting on them, each identified by the "menuId" and "sectionId"
     * pair the items were registered for.
     */
    getPendingSections(): PendingSection[] {
        const result: PendingSection[] = [];

        this.#pendingRegistrationsIndex.forEach((pendingRegistrations, menuId) => {
            pendingRegistrations.forEach((items, sectionId) => {
                result.push({
                    menuId,
                    sectionId,
                    items: items.map(x => x.item)
                });
            });
        });

        return result;
    }

    // The legacy accessors below speak in index keys. The registry no longer builds one, so they synthesize the
    // historical `${menuId}-${sectionId}` format on demand. That format is ambiguous, which is the reason it was
    // replaced: two distinct pairs can synthesize the same key, and this view merges their items rather than
    // losing one. Registration itself is unaffected, only these two deprecated readers.
    #legacyIndex() {
        const result = new Map<string, PendingRegistrationItem[]>();

        this.#pendingRegistrationsIndex.forEach((pendingRegistrations, menuId) => {
            pendingRegistrations.forEach((items, sectionId) => {
                const indexKey = `${menuId}-${sectionId}`;

                result.set(indexKey, [...(result.get(indexKey) ?? []), ...items]);
            });
        });

        return result;
    }

    /**
     * @deprecated An index key cannot identify a section on its own, since a "-" in a "menuId" or in a section
     * "$id" makes two distinct pairs produce the same key. Use {@link getPendingSections} instead, which
     * returns the "menuId" and "sectionId" pair directly. Kept until the next major to avoid a breaking
     * removal.
     */
    getPendingSectionIds() {
        return Array.from(this.#legacyIndex().keys());
    }

    /**
     * @deprecated Takes an index key, whose format is an implementation detail rather than part of the public
     * contract, so a key built by a consumer is not guaranteed to match. Use {@link getPendingSections}
     * instead, which returns each pending section together with its items. Kept until the next major to avoid
     * a breaking removal.
     */
    getPendingRegistrationsForSection(indexKey: string) {
        return this.#legacyIndex().get(indexKey) ?? [];
    }
}
