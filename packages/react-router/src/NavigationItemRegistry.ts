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
export type NavigationItemRegistrationStatus = "pending" | "registered" | "buffered" | "deduplicated";
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

export interface PendingRegistrationItem {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: RootNavigationItem;
}

interface RegistrationItem {
    id: number;
    // The registration this one is nested under, once its section is registered. "undefined" together with a
    // "sectionId" is what "pending" reports.
    parentId?: number;
    // The section this item was declared in, when it was declared inline rather than with the "sectionId"
    // option. Unlike "parentId" this never changes, which is what lets a clear rebuild the registry.
    inlineParentId?: number;
    menuId: string;
    registrationType: NavigationItemRegistrationType;
    sectionId?: string;
    item: NavigationItem;
}

interface AddRegistrationOptions {
    inlineParentId?: number;
    isInlineParentRegistered?: boolean;
    sectionId?: string;
}

export interface DuplicateSectionDeclaration {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: NavigationSection & { $priority?: number };
    // The section this declaration asked to be nested under, which is how a section declared in two different
    // places is told apart from one declared twice in the same place.
    parentSectionId?: string;
    // Whether the declaration was written in the "children" of another item rather than registered on its own.
    // An inline declaration always loses something: it is dropped from the position it was written in, together
    // with everything declared under it, which a declaration registered on its own doesn't lose.
    isInlineDeclaration: boolean;
    // The "$id" of the section this declaration was written in. A section declared inline doesn't have to be
    // identified, therefore the section holding it cannot always be named.
    inlineParentSectionId?: string;
    // Whether this declaration's label differs from the one of the section that owns the identifier.
    hasConflictingLabel: boolean;
    // Whether the declaration is itself registered. A declaration that found the section already registered
    // contributes nothing and is not, but a section that was waiting for its own section only competes for
    // the identifier once it becomes reachable, and by then it holds a place in the menu that it keeps.
    isRegistered: boolean;
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

// The registry builds the navigation item tree from the registrations rather than storing it, therefore the
// "children" array of a registered section is never written to. Copying the property descriptors rather than
// spreading preserves the prototype chain and keeps accessor properties lazy, so a section backed by a class
// instance or by a "$label" getter still behaves. ECMAScript private fields are the exception: they are slots
// rather than properties, so they cannot be copied, and an accessor reading one throws on the copy.
// TypeScript's "private" compiles to an ordinary property and is unaffected. See ADR-0023.
function resolveNavigationSection(item: NavigationSection, children: NavigationItem[]): NavigationSection {
    const descriptors = Object.getOwnPropertyDescriptors(item);

    // Replacing the "children" descriptor rather than assigning to the copy afterwards. A frozen section, or
    // one exposing "children" through a getter, would throw on assignment.
    descriptors.children = {
        value: children,
        writable: true,
        enumerable: true,
        configurable: true
    };

    return Object.create(Object.getPrototypeOf(item), descriptors) as NavigationSection;
}

// Two modules declaring a shared section render its label through their own element, therefore comparing
// "$label" values is only meaningful when both are strings. Comparing the others would report every correctly
// shared section, since a "ReactNode" is rebuilt on every registration and never equals the previous one.
function hasConflictingLabel(registeredItem: NavigationItem, item: NavigationItem) {
    return typeof registeredItem.$label === "string"
        && typeof item.$label === "string"
        && registeredItem.$label !== item.$label;
}

export class NavigationItemRegistry {
    // The registrations, in registration order. Every index below is derived from this array, which is what
    // allows "clearDeferredItems" to rebuild the whole registry from it.
    #registrations: RegistrationItem[] = [];

    // <registration id, RegistrationItem>
    readonly #registrationsIndex: Map<number, RegistrationItem> = new Map();

    // The items sitting at the root of a menu. A menu key is added when its first root item is registered and
    // is kept afterwards, even when a clear empties the menu.
    // <menuId, RegistrationItem[]>
    readonly #menusIndex: Map<string, RegistrationItem[]> = new Map();

    // The items nested under a registration. Inline children come first, then the ones registered with the
    // "sectionId" option, which is the order the children were appended in.
    // <registration id, RegistrationItem[]>
    readonly #childrenIndex: Map<number, RegistrationItem[]> = new Map();

    // Only sections that are reachable from a menu root are indexed. A section waiting for its own parent
    // cannot take nested items, otherwise they would report "registered" while sitting in a subtree that no
    // menu shows, and they would stop being reported as pending.
    // <section index key, registration id>
    readonly #sectionsIndex: Map<string, number> = new Map();

    // An index of pending navigation items to registered once their section is registered.
    // <section index key, RegistrationItem[]>
    readonly #pendingRegistrationsIndex: Map<string, RegistrationItem[]> = new Map();

    // The declarations of a section that was already registered for the menu. The first declaration wins and
    // these are kept so that "_validateRegistrations" can report the ones that conflict with it.
    // <section index key, DuplicateSectionDeclaration[]>
    readonly #duplicateDeclarationsIndex: Map<string, DuplicateSectionDeclaration[]> = new Map();

    // Building a whole menu on every registration would be quadratic over a bootstrap, since the runtime reads
    // the items back after each one to log them. A section only changes when its own subtree does, therefore a
    // registration only discards the cache of the branch it lands in and every other branch keeps both its
    // value and its identity.
    // <registration id, NavigationItem>
    readonly #itemsCache: Map<number, NavigationItem> = new Map();

    #nextRegistrationId = 0;

    // Since the "getItems" function is building the menu items from the registrations, the result is memoized
    // to ensure the returned array is immutable and can be used in React closures.
    readonly #memoizedGetItems = memoize((menuId: string) => this.#getMenuItems(menuId));

    // Memoized grouped view of the full registry, reusing the per-menu memoized arrays so inner array
    // references stay stable.
    readonly #memoizedGetAllItemsByMenu = memoize(() => {
        const result = new Map<string, RootNavigationItem[]>();

        for (const menuId of this.#menusIndex.keys()) {
            result.set(menuId, this.#memoizedGetItems(menuId));
        }

        return result;
    });

    add(menuId: string, registrationType: NavigationItemRegistrationType, navigationItem: RootNavigationItem, { sectionId }: AddNavigationItemOptions = {}): NavigationItemRegistrationResult {
        const completedPendingRegistrations: RootNavigationItem[] = [];

        const { registration, isDuplicate } = this.#recursivelyAddRegistrations(menuId, registrationType, navigationItem, completedPendingRegistrations, { sectionId });

        memoizeClear(this.#memoizedGetItems);
        memoizeClear(this.#memoizedGetAllItemsByMenu);

        let registrationStatus: NavigationItemRegistrationStatus;

        if (isDuplicate) {
            registrationStatus = "deduplicated";
        } else if (sectionId && registration.parentId === undefined) {
            registrationStatus = "pending";
        } else {
            registrationStatus = "registered";
        }

        const result: NavigationItemRegistrationResult = {
            registrationStatus,
            completedPendingRegistrations,
            registrationType,
            item: navigationItem,
            menuId
        };

        if (sectionId) {
            result.sectionId = sectionId;
        } else if (!isLinkItem(navigationItem)) {
            // A section registered at the root of a menu identifies itself, matching what the previous
            // implementation reported for it.
            result.sectionId = navigationItem.$id;
        }

        return result;
    }

    #recursivelyAddRegistrations(menuId: string, registrationType: NavigationItemRegistrationType, item: NavigationItem, completedPendingRegistrations: RootNavigationItem[], { inlineParentId, isInlineParentRegistered, sectionId }: AddRegistrationOptions = {}): { registration: RegistrationItem; isDuplicate: boolean } {
        let parentId = inlineParentId;

        if (parentId === undefined && sectionId) {
            parentId = this.#sectionsIndex.get(createSectionIndexKey(menuId, sectionId));
        }

        // Whether this item is reachable from a menu root. An inline child is only reachable when the section
        // it was declared in is, which is why it cannot be derived from "parentId": an inline child always has
        // a parent, including when that parent is itself waiting for a section that was never registered.
        const isRegistered = inlineParentId !== undefined
            ? isInlineParentRegistered === true
            : (!sectionId || parentId !== undefined);

        // The declaration is only a duplicate once it would actually take its place in a menu. A section
        // waiting for its own section stays pending, exactly as it did before, so that the section it is
        // waiting for is still reported as missing.
        if (isRegistered && !isLinkItem(item) && item.$id) {
            const indexKey = createSectionIndexKey(menuId, item.$id);
            const registeredSectionId = this.#sectionsIndex.get(indexKey);
            const registeredSection = registeredSectionId !== undefined ? this.#registrationsIndex.get(registeredSectionId) : undefined;

            if (registeredSection) {
                // Declaring a section that is already registered for the menu is an ensure, not an error: the
                // first declaration wins and this one contributes nothing. Merging its inline children into the
                // registered section would attach them to a container owned by another registration, which a
                // clear could not undo. A module contributing to a shared section nests its items under it with
                // the "sectionId" option.
                this.#addDuplicateDeclaration(indexKey, {
                    menuId,
                    sectionId: item.$id,
                    registrationType,
                    item,
                    parentSectionId: sectionId,
                    isInlineDeclaration: inlineParentId !== undefined,
                    inlineParentSectionId: this.#getInlineParentSectionId(inlineParentId),
                    hasConflictingLabel: hasConflictingLabel(registeredSection.item, item),
                    isRegistered: false
                });

                return { registration: registeredSection, isDuplicate: true };
            }
        }

        const registration: RegistrationItem = {
            id: this.#nextRegistrationId++,
            parentId,
            inlineParentId,
            menuId,
            registrationType,
            sectionId,
            item
        };

        this.#registrations.push(registration);
        this.#registrationsIndex.set(registration.id, registration);

        if (parentId !== undefined) {
            this.#addChild(parentId, registration);
        } else if (sectionId) {
            this.#addPendingRegistration(createSectionIndexKey(menuId, sectionId), registration);
        } else {
            this.#addRootItem(menuId, registration);
        }

        if (!isLinkItem(item)) {
            // Add the index entry before going through the children to speed up the registration of future
            // nested navigation items.
            if (isRegistered) {
                this.#addSectionIndex(registration);
            }

            const childrenCompletedPendingRegistrations: RootNavigationItem[] = [];

            // Recursively go through the children. They are registered before this section takes its pending
            // items so that an inline child comes first in the children array.
            item.children?.forEach(x => {
                this.#recursivelyAddRegistrations(menuId, registrationType, x, childrenCompletedPendingRegistrations, {
                    inlineParentId: registration.id,
                    isInlineParentRegistered: isRegistered
                });
            });

            const ownCompletedPendingRegistrations: RootNavigationItem[] = [];

            if (isRegistered) {
                this.#tryRegisterPendingItems(registration, ownCompletedPendingRegistrations);
            }

            // A section reports the items it completed before the ones its children completed.
            completedPendingRegistrations.push(...ownCompletedPendingRegistrations, ...childrenCompletedPendingRegistrations);
        }

        return { registration, isDuplicate: false };
    }

    #addSectionIndex(registration: RegistrationItem) {
        // Only sections with an identifier are indexed.
        if (isLinkItem(registration.item) || !registration.item.$id) {
            return;
        }

        const sectionId = registration.item.$id;

        const indexKey = createSectionIndexKey(registration.menuId, sectionId);

        const registeredSectionId = this.#sectionsIndex.get(indexKey);

        if (registeredSectionId !== undefined) {
            const registeredSection = this.#registrationsIndex.get(registeredSectionId);

            // Another section took the identifier while this one was waiting for its own section. It keeps the
            // place it was registered in, but it does not take the identifier from the section that owns it.
            this.#addDuplicateDeclaration(indexKey, {
                menuId: registration.menuId,
                sectionId,
                registrationType: registration.registrationType,
                item: registration.item,
                parentSectionId: registration.sectionId,
                isInlineDeclaration: registration.inlineParentId !== undefined,
                inlineParentSectionId: this.#getInlineParentSectionId(registration.inlineParentId),
                hasConflictingLabel: !isNil(registeredSection) && hasConflictingLabel(registeredSection.item, registration.item),
                isRegistered: true
            });

            return;
        }

        this.#sectionsIndex.set(indexKey, registration.id);
    }

    #tryRegisterPendingItems(registration: RegistrationItem, completedPendingRegistrations: RootNavigationItem[]) {
        if (isLinkItem(registration.item) || !registration.item.$id) {
            return;
        }

        const indexKey = createSectionIndexKey(registration.menuId, registration.item.$id);

        // Another section owns the identifier, the pending items belong to it rather than to this one.
        if (this.#sectionsIndex.get(indexKey) !== registration.id) {
            return;
        }

        const pendingRegistrations = this.#pendingRegistrationsIndex.get(indexKey);

        if (!pendingRegistrations) {
            return;
        }

        // Delete the pending registrations for the section.
        this.#pendingRegistrationsIndex.delete(indexKey);

        pendingRegistrations.forEach(x => {
            x.parentId = registration.id;

            this.#addChild(registration.id, x);
            completedPendingRegistrations.push(x.item);
        });

        pendingRegistrations.forEach(x => {
            this.#recursivelyRegisterPendingItems(x, completedPendingRegistrations);
        });
    }

    // A navigation item that has just been registered is reachable from a menu root, therefore the sections it
    // holds can be indexed and take their own pending items in turn.
    #recursivelyRegisterPendingItems(registration: RegistrationItem, completedPendingRegistrations: RootNavigationItem[]) {
        if (isLinkItem(registration.item)) {
            return;
        }

        // Taking the children before the pending items are registered, since those are appended to the same
        // array and are already gone through by "#tryRegisterPendingItems".
        const children = this.#childrenIndex.get(registration.id)?.slice() ?? [];

        this.#addSectionIndex(registration);
        this.#tryRegisterPendingItems(registration, completedPendingRegistrations);

        children.forEach(x => {
            this.#recursivelyRegisterPendingItems(x, completedPendingRegistrations);
        });
    }

    #addChild(parentId: number, registration: RegistrationItem) {
        this.#deleteCachedItems(parentId);

        const children = this.#childrenIndex.get(parentId);

        if (children) {
            children.push(registration);
        } else {
            this.#childrenIndex.set(parentId, [registration]);
        }
    }

    #addRootItem(menuId: string, registration: RegistrationItem) {
        const items = this.#menusIndex.get(menuId);

        if (items) {
            items.push(registration);
        } else {
            this.#menusIndex.set(menuId, [registration]);
        }
    }

    #addPendingRegistration(indexKey: string, registration: RegistrationItem) {
        const pendingRegistrations = this.#pendingRegistrationsIndex.get(indexKey);

        if (pendingRegistrations) {
            pendingRegistrations.push(registration);
        } else {
            this.#pendingRegistrationsIndex.set(indexKey, [registration]);
        }
    }

    // The section a declaration was written in is only named when the identifier it answers to resolves back
    // to it. A section declared inline doesn't have to be identified, and one that lost its own identifier
    // carries an "$id" that reaches another section, so naming it would point the report at the wrong place.
    #getInlineParentSectionId(inlineParentId?: number) {
        if (inlineParentId === undefined) {
            return undefined;
        }

        const inlineParent = this.#registrationsIndex.get(inlineParentId);

        if (!inlineParent || isLinkItem(inlineParent.item) || !inlineParent.item.$id) {
            return undefined;
        }

        const indexKey = createSectionIndexKey(inlineParent.menuId, inlineParent.item.$id);

        return this.#sectionsIndex.get(indexKey) === inlineParentId ? inlineParent.item.$id : undefined;
    }

    #addDuplicateDeclaration(indexKey: string, declaration: DuplicateSectionDeclaration) {
        const declarations = this.#duplicateDeclarationsIndex.get(indexKey);

        if (declarations) {
            declarations.push(declaration);
        } else {
            this.#duplicateDeclarationsIndex.set(indexKey, [declaration]);
        }
    }

    // Discards the cached items of a registration and of the sections holding it, which are the only ones its
    // subtree changed. The walk stops at the first registration that is not cached anymore: an item is only
    // cached while building the section holding it, therefore an uncached registration cannot be held by a
    // cached one.
    #deleteCachedItems(registrationId?: number) {
        let currentId = registrationId;

        while (currentId !== undefined) {
            if (!this.#itemsCache.delete(currentId)) {
                break;
            }

            currentId = this.#registrationsIndex.get(currentId)?.parentId;
        }
    }

    #getMenuItems(menuId: string): RootNavigationItem[] {
        return (this.#menusIndex.get(menuId) ?? []).map(x => this.#getItem(x));
    }

    #getItem(registration: RegistrationItem): NavigationItem {
        if (isLinkItem(registration.item)) {
            return registration.item;
        }

        const cachedItem = this.#itemsCache.get(registration.id);

        if (cachedItem) {
            return cachedItem;
        }

        const children = (this.#childrenIndex.get(registration.id) ?? []).map(x => this.#getItem(x));
        const item = resolveNavigationSection(registration.item, children);

        this.#itemsCache.set(registration.id, item);

        return item;
    }

    getItems(menuId: string) {
        return this.#memoizedGetItems(menuId);
    }

    getAllItemsByMenu() {
        return this.#memoizedGetAllItemsByMenu();
    }

    clearDeferredItems() {
        // A declaration that isn't registered doesn't add a registration, therefore nothing below would delete
        // it and a run that only declared duplicates would keep them forever, reporting them again after every
        // run. The static ones belong to the initial registration rather than to the run being replayed, and
        // deleting them would swallow a misconfiguration that strict mode reports.
        this.#deleteDuplicateDeclarations(x => !x.isRegistered && x.registrationType === "deferred");

        if (!this.#registrations.some(x => x.registrationType === "deferred")) {
            // Keep the "getItems" function immutable by only rebuilding if the registrations actually changed.
            return;
        }

        // A declaration that is registered is recorded by "#addSectionIndex" rather than by the registration
        // that declared it, and the rebuild below goes through that function again for every section it
        // reaches, whatever its registration type. Keeping these would append the same declaration once per
        // update run for the life of the session. The ones whose registration doesn't survive the clear, or
        // stops being reachable from a menu root, are simply not recorded again. This deletion has to stay
        // after the early return: nothing is rebuilt on that path, therefore nothing would record them again.
        this.#deleteDuplicateDeclarations(x => x.isRegistered);

        // An inline child is registered with the registration type of the item it was declared in, therefore a
        // section and the children declared in it are always kept or deleted together.
        this.#registrations = this.#registrations.filter(x => x.registrationType !== "deferred");

        this.#registrationsIndex.clear();
        this.#childrenIndex.clear();
        this.#sectionsIndex.clear();
        this.#pendingRegistrationsIndex.clear();
        this.#itemsCache.clear();

        // The menus themselves are kept, an emptied menu stays a known menu.
        this.#menusIndex.forEach((_, menuId) => {
            this.#menusIndex.set(menuId, []);
        });

        this.#registrations.forEach(x => {
            this.#registrationsIndex.set(x.id, x);

            // Only the inline nesting is intrinsic to an item. An item registered under a section with the
            // "sectionId" option goes back to waiting for it, which is what keeps it reported as pending when
            // the run being cleared is what had registered that section.
            x.parentId = x.inlineParentId;
        });

        this.#registrations.forEach(x => {
            if (x.inlineParentId !== undefined) {
                this.#addChild(x.inlineParentId, x);
            } else if (x.sectionId) {
                this.#addPendingRegistration(createSectionIndexKey(x.menuId, x.sectionId), x);
            } else {
                this.#addRootItem(x.menuId, x);
            }
        });

        // Everything held by a menu is registered, and registering a section takes back the pending items that
        // survived the clear.
        const completedPendingRegistrations: RootNavigationItem[] = [];

        this.#menusIndex.forEach(items => {
            items.forEach(x => {
                this.#recursivelyRegisterPendingItems(x, completedPendingRegistrations);
            });
        });

        memoizeClear(this.#memoizedGetItems);
        memoizeClear(this.#memoizedGetAllItemsByMenu);
    }

    #deleteDuplicateDeclarations(shouldDelete: (declaration: DuplicateSectionDeclaration) => boolean) {
        const keysToDelete: string[] = [];

        this.#duplicateDeclarationsIndex.forEach((declarations, key) => {
            const remainingDeclarations = declarations.filter(x => !shouldDelete(x));

            if (remainingDeclarations.length === 0) {
                keysToDelete.push(key);
            } else if (remainingDeclarations.length !== declarations.length) {
                this.#duplicateDeclarationsIndex.set(key, remainingDeclarations);
            }
        });

        keysToDelete.forEach(x => this.#duplicateDeclarationsIndex.delete(x));
    }

    getPendingRegistrations() {
        const index = new Map<string, PendingRegistrationItem[]>();

        this.#pendingRegistrationsIndex.forEach((registrations, indexKey) => {
            // A registration only lands in this index through the "sectionId" option, therefore it always
            // carries the section it is waiting for.
            index.set(indexKey, registrations.map(x => ({
                menuId: x.menuId,
                sectionId: x.sectionId!,
                registrationType: x.registrationType,
                item: x.item
            })));
        });

        return new PendingNavigationItemRegistrations(index);
    }

    getDuplicateSectionDeclarations() {
        const index = new Map<string, DuplicateSectionDeclaration[]>();

        // Copying rather than handing out the index, matching "getPendingRegistrations". The arrays are pushed
        // into by "#addDuplicateDeclaration" and replaced by "#deleteDuplicateDeclarations", so a wrapper held
        // across an update run would otherwise change underneath the code holding it.
        this.#duplicateDeclarationsIndex.forEach((declarations, indexKey) => {
            index.set(indexKey, [...declarations]);
        });

        return new DuplicateNavigationSectionDeclarations(index);
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

export class DuplicateNavigationSectionDeclarations {
    readonly #duplicateDeclarationsIndex: Map<string, DuplicateSectionDeclaration[]> = new Map();

    constructor(duplicateDeclarationsIndex: Map<string, DuplicateSectionDeclaration[]> = new Map()) {
        this.#duplicateDeclarationsIndex = duplicateDeclarationsIndex;
    }

    /**
     * Returns the index key of every section that has been declared more than once for a menu. The keys are
     * opaque, only use them to look a section up with {@link getDeclarationsForSection}. To identify a section,
     * read the "menuId" and the "sectionId" off the returned {@link DuplicateSectionDeclaration} values.
     */
    getDuplicatedSectionIds() {
        return Array.from(this.#duplicateDeclarationsIndex.keys());
    }

    getDeclarationsForSection(indexKey: string) {
        return this.#duplicateDeclarationsIndex.get(indexKey) ?? [];
    }
}
