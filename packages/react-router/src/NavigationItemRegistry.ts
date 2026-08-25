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

// "buffered" is only returned by the transactional scope used by deferred registration update runs. The item is
// held until the scope completes, and the replay performed at that point reports the real outcome. See ADR-0022.
export type NavigationItemRegistrationStatus = "pending" | "registered" | "buffered";
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

    complete(): NavigationItemRegistrationResult[] {
        // This scope writes straight through to the registry, every item has already been reported by
        // "registerNavigationItem" and there is nothing left to replay.
        return [];
    }
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

        // The item is only buffered at this point. The replay performed by the "complete" function is what
        // actually registers it, and that replay can still leave it pending when its section is not
        // re-registered by the run, so the real outcome is reported from there rather than guessed here.
        return {
            registrationStatus: "buffered",
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

        // The replay is the only place where the real outcome of a buffered registration is known. The results
        // are returned so that the runtime can report them, since adding to the registry directly bypasses the
        // logging done by "registerNavigationItem".
        const results: NavigationItemRegistrationResult[] = [];

        this.#ItemsIndex.forEach(items => {
            items.forEach(x => {
                results.push(this._registry.add(x.menuId, x.registrationType, x.item, x.options));
            });
        });

        this.#ItemsIndex.clear();

        return results;
    }
}

// The separator between the two halves of a section index key. Joining with a "-" made a key
// ambiguous: ("main-menu", "settings") and ("main", "menu-settings") both produced "main-menu-settings", which
// resolved two distinct sections of two distinct menus to the same index entry.
const SectionIndexKeySeparator = "\u0000";

function createSectionIndexKey(menuId: string, sectionId: string) {
    // The menu id is length-prefixed rather than merely separated from the section id. Nothing constrains a
    // "menuId" or a section "$id" to exclude the separator, so a separator on its own would only move the
    // collision instead of removing it. Prefixing the length keeps the split unambiguous whatever the ids hold.
    return `${menuId.length}${SectionIndexKeySeparator}${menuId}${sectionId}`;
}

/**
 * @deprecated The index key format is an implementation detail that is not part of the public contract, and the
 * separator a key is built with is deliberately undocumented. Read the "menuId" and the "sectionId" off the
 * {@link PendingRegistrationItem} values returned by
 * {@link PendingNavigationItemRegistrations.getPendingRegistrationsForSection} instead. Nothing in the framework
 * calls this function anymore, it is kept until the next major to avoid a breaking removal.
 */
export function parseSectionIndexKey(indexKey: string) {
    const separatorIndex = indexKey.indexOf(SectionIndexKeySeparator);
    const menuIdStart = separatorIndex + SectionIndexKeySeparator.length;
    const menuIdEnd = menuIdStart + Number(indexKey.slice(0, separatorIndex));

    return [indexKey.slice(menuIdStart, menuIdEnd), indexKey.slice(menuIdEnd)];
}

// The registry attaches a nested item by mutating the "children" array of the section it indexes. Cloning the
// items on ingestion keeps that mutation away from the objects owned by the registering module, which would
// otherwise accumulate children across deferred registration update runs. See ADR-0023.
function cloneNavigationItem<T extends NavigationItem>(item: T): T {
    if (isLinkItem(item)) {
        return item;
    }

    // Copying the property descriptors rather than spreading preserves the prototype chain and keeps accessor
    // properties lazy, so a section backed by a class instance or by a "$label" getter still behaves.
    // ECMAScript private fields are the exception: they are slots rather than properties, so they cannot be
    // copied, and an accessor reading one throws on the clone. TypeScript's "private" compiles to an ordinary
    // property and is unaffected. See ADR-0023.
    const descriptors = Object.getOwnPropertyDescriptors(item);

    // Replacing the "children" descriptor rather than assigning to the clone afterwards. A frozen section, or
    // one exposing "children" through a getter, would throw on assignment.
    descriptors.children = {
        value: item.children?.map(x => cloneNavigationItem(x)) ?? [],
        writable: true,
        enumerable: true,
        configurable: true
    };

    return Object.create(Object.getPrototypeOf(item), descriptors) as T;
}

export class NavigationItemRegistry {
    // <menuId, RegistryItem[]>
    readonly #menusIndex: Map<string, RegistryItem[]> = new Map();

    // <section index key, SectionIndexItem>
    readonly #sectionsIndex: Map<string, SectionIndexItem> = new Map();

    // An index of pending navigation items to registered once their section is registered.
    // <section index key, PendingRegistrationItem[]>
    readonly #pendingRegistrationsIndex: Map<string, PendingRegistrationItem[]> = new Map();

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
        memoizeClear(this.#memoizedGetAllItemsByMenu);
    }

    add(menuId: string, registrationType: NavigationItemRegistrationType, navigationItem: RootNavigationItem, { sectionId }: AddNavigationItemOptions = {}): NavigationItemRegistrationResult {
        // Only the deferred path is cloned. "#addNestedItem" enforces that a nested item has the same
        // registration type as its section, and the static phase runs exactly once per runtime, so a static
        // section cannot accumulate children across runs. Cloning it would be pure risk, see ADR-0023.
        const item = registrationType === "deferred" ? cloneNavigationItem(navigationItem) : navigationItem;

        if (sectionId) {
            return this.#addNestedItem(menuId, sectionId, registrationType, item);
        }

        if (isLinkItem(item)) {
            return this.#addRootLink(menuId, registrationType, item);
        }

        return this.#addRootSection(menuId, registrationType, item);
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

        // Keep the section index and the pending registrations in sync with the menu index. Both indexes are
        // keyed by a composite of the menu id and the section id rather than by menu, so they are cleaned in a
        // single pass rather than once per menu.
        this.#deleteDeferredSectionIndexEntries();
        this.#deleteDeferredPendingRegistrations();
    }

    #deleteDeferredSectionIndexEntries() {
        const keysToDelete: string[] = [];

        this.#sectionsIndex.forEach((x, key) => {
            if (x.registrationType === "deferred") {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(x => this.#sectionsIndex.delete(x));
    }

    #deleteDeferredPendingRegistrations() {
        const keysToDelete: string[] = [];

        this.#pendingRegistrationsIndex.forEach((items, key) => {
            // Static pending registrations belong to the initial registration rather than to the run being
            // replayed. Deleting them would silently swallow a misconfiguration that strict mode reports.
            const remainingItems = items.filter(x => x.registrationType !== "deferred");

            if (remainingItems.length === 0) {
                keysToDelete.push(key);
            } else if (remainingItems.length !== items.length) {
                this.#pendingRegistrationsIndex.set(key, remainingItems);
            }
        });

        keysToDelete.forEach(x => this.#pendingRegistrationsIndex.delete(x));
    }

    getPendingRegistrations() {
        return new PendingNavigationItemRegistrations(this.#pendingRegistrationsIndex);
    }
}

export class PendingNavigationItemRegistrations {
    readonly #pendingRegistrationsIndex: Map<string, PendingRegistrationItem[]> = new Map();

    constructor(pendingRegistrationsIndex: Map<string, PendingRegistrationItem[]> = new Map()) {
        this.#pendingRegistrationsIndex = pendingRegistrationsIndex;
    }

    /**
     * Returns the index key of every section that has pending registrations. The keys are opaque, only use them
     * to look a section up with {@link getPendingRegistrationsForSection}. To identify a section, read the
     * "menuId" and the "sectionId" off the returned {@link PendingRegistrationItem} values.
     */
    getPendingSectionIds() {
        return Array.from(this.#pendingRegistrationsIndex.keys());
    }

    getPendingRegistrationsForSection(indexKey: string) {
        return this.#pendingRegistrationsIndex.get(indexKey) ?? [];
    }
}
