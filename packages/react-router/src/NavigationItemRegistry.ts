import { isNil } from "@squide/core/internal";
import memoize, { memoizeClear } from "memoize";
import type { ReactNode } from "react";
import type { LinkProps } from "react-router";

export interface NavigationLink extends Omit<LinkProps, "children"> {
    $id?: string;
    $label: ReactNode;
    // Highest priority is rendered first, among an item's siblings and at every depth. A missing priority
    // defaults to 0, so a negative one sits behind the unprioritized siblings, and ties keep declaration
    // order. Also forwarded to the code rendering the menu, for what ordering does not cover.
    $priority?: number;
    // Spread onto the rendered component, unlike "$context" which is only read by the renderer.
    $additionalProps?: Record<string, unknown>;
    // Unrelated to the module registration context and to React context: this is per-item data for the
    // code rendering the menu.
    $context?: Record<string, unknown>;
    $canRender?: (obj?: unknown) => boolean;
    children?: never;
}

export interface NavigationSection {
    $id?: string;
    $label: ReactNode;
    // Highest priority is rendered first. See NavigationLink's "$priority".
    $priority?: number;
    // Spread onto the rendered component, unlike "$context" which is only read by the renderer.
    $additionalProps?: Record<string, unknown>;
    // See NavigationLink's "$context".
    $context?: Record<string, unknown>;
    $canRender?: (obj?: unknown) => boolean;
    children: NavigationItem[];
    to?: never;
}

export type NavigationItem = NavigationLink | NavigationSection;

// Will be exposed externally but is only expected to be used internally.
export function isLinkItem(item: NavigationItem): item is NavigationLink {
    return !isNil((item as NavigationLink).to);
}

/**
 * A menu's top-level item.
 *
 * "$priority" used to be declared here rather than on {@link NavigationItem}, which made it impossible to
 * write one inside a "children" literal even though the registry has always carried a nested item's
 * "$priority" through verbatim. It now lives on the item types themselves, and this stays as an alias so the
 * many signatures and consumers naming it keep expressing "the root of a menu".
 */
export type RootNavigationItem = NavigationItem;

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

// A "-" separator makes the key ambiguous, since both halves are consumer-provided and either can contain
// one: ("main-menu", "settings") and ("main", "menu-settings") both produce "main-menu-settings". Two distinct
// sections then share an index entry, which is how a nested item ends up in the wrong menu.
const SectionIndexKeySeparator = "\u0000";

function createSectionIndexKey(menuId: string, sectionId: string) {
    // The menu id is length-prefixed rather than merely separated from the section id. Nothing constrains a
    // "menuId" or a section "$id" to exclude whichever separator is chosen, so a separator on its own would
    // only move the collision instead of removing it. The length prefix keeps the split unambiguous whatever
    // the ids hold, which is why the separator only has to delimit the digits.
    return `${menuId.length}${SectionIndexKeySeparator}${menuId}${sectionId}`;
}

/**
 * @deprecated The index key format is an implementation detail that is not part of the public contract, and the
 * separator a key is built with is deliberately undocumented. Read the "menuId" and the "sectionId" off the
 * {@link PendingRegistrationItem} values returned by
 * {@link PendingNavigationItemRegistrations.getPendingRegistrationsForSection} rather than parsing a key
 * returned by {@link PendingNavigationItemRegistrations.getPendingSectionIds}. Nothing in the framework calls
 * this function anymore, it is kept until the next major to avoid a breaking removal.
 */
export function parseSectionIndexKey(indexKey: string) {
    // The separator delimits the length prefix, so the first occurrence is always the right one even when an
    // id contains one too.
    const separatorIndex = indexKey.indexOf(SectionIndexKeySeparator);

    if (separatorIndex < 0) {
        // Not a key this function produced, an old-format one included, so there is no pair to recover. Worth
        // stating outright: without this branch the arithmetic below reads "slice(0, -1)" as the length prefix
        // and leans on NaN propagating through both slices, which happens to yield ["", indexKey] for most
        // inputs but returns a plausible-looking ["1", "2"] for "12".
        return ["", indexKey];
    }

    const menuIdStart = separatorIndex + SectionIndexKeySeparator.length;
    const menuIdEnd = menuIdStart + Number(indexKey.slice(0, separatorIndex));

    return [indexKey.slice(menuIdStart, menuIdEnd), indexKey.slice(menuIdEnd)];
}

export class NavigationItemRegistry {
    // <menuId, RegistryItem[]>
    readonly #menusIndex: Map<string, RegistryItem[]> = new Map();

    // <createSectionIndexKey(menuId, sectionId), SectionIndexItem>
    readonly #sectionsIndex: Map<string, SectionIndexItem> = new Map();

    // An index of pending navigation items to registered once their section is registered.
    // <createSectionIndexKey(menuId, sectionId), PendingRegistrationItem[]>
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
        // keyed by a section index key rather than by menu, so they are cleaned in a single pass rather than
        // once per menu.
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

    getPendingSectionIds() {
        return Array.from(this.#pendingRegistrationsIndex.keys());
    }

    getPendingRegistrationsForSection(indexKey: string) {
        return this.#pendingRegistrationsIndex.get(indexKey) ?? [];
    }
}
