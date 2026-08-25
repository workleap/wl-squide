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

// A registration record. The registry stores these rather than a mutated navigation item tree: the tree the
// consumers read is projected from them on demand. Every structural fact a run needs to undo lives on the
// record, at every depth, which is what makes "clearDeferredItems" a filter rather than a tree walk.
interface NavigationItemRecord {
    id: number;
    // The record this one is nested under, once resolved. "undefined" together with a "sectionId" means the
    // parent section has not been registered yet, which is what "pending" reports.
    parentId?: number;
    // The section this item was declared inside of, when it was declared inline rather than with the
    // "sectionId" option. Unlike "parentId" this never changes: it is what lets a clear rebuild the tree.
    inlineParentId?: number;
    menuId: string;
    registrationType: NavigationItemRegistrationType;
    // The section "$id" this item asked to be nested under, when it was registered with the "sectionId" option.
    sectionId?: string;
    item: NavigationItem;
}

// A section container that was declared more than once for a menu. The first declaration wins, the later ones
// are recorded here so validation can report the conflicting ones.
export interface DuplicateSectionDeclaration {
    menuId: string;
    sectionId: string;
    registrationType: NavigationItemRegistrationType;
    item: NavigationSection;
    // The section "$id" the duplicate asked to be nested under, to detect a section declared in two places.
    parentSectionId?: string;
}

// Builds the section a consumer reads. The children come from the records rather than from the registered
// object, so the registry never mutates what a module owns.
//
// Copying the property descriptors rather than spreading preserves the prototype chain and keeps accessor
// properties lazy, so a section backed by a class instance or by a "$label" getter still behaves.
// ECMAScript private fields are the exception: they are slots rather than properties, so they cannot be
// copied, and an accessor reading one throws on the projection. TypeScript's "private" compiles to an
// ordinary property and is unaffected. See ADR-0023.
function projectSection(item: NavigationSection, children: NavigationItem[]): NavigationSection {
    const descriptors = Object.getOwnPropertyDescriptors(item);

    // Replacing the "children" descriptor rather than assigning to the projection afterwards. A frozen
    // section, or one exposing "children" through a getter, would throw on assignment.
    descriptors.children = {
        value: children,
        writable: true,
        enumerable: true,
        configurable: true
    };

    return Object.create(Object.getPrototypeOf(item), descriptors) as NavigationSection;
}

export class NavigationItemRegistry {
    // The registration records, in registration order. Every other structure below is derived from this one
    // and is rebuilt from it by "clearDeferredItems".
    #records: NavigationItemRecord[] = [];
    #recordsById: Map<number, NavigationItemRecord> = new Map();
    #nextRecordId = 0;

    // <menuId, records> of the items that sit at the root of a menu, in registration order.
    #rootsByMenu: Map<string, NavigationItemRecord[]> = new Map();

    // <record id, records> of the items nested under a record. Inline children first, then the ones adopted
    // when their section was registered, which is the order the previous implementation appended them in.
    #childrenByParent: Map<number, NavigationItemRecord[]> = new Map();

    // <section index key, record id> of every identified section that has been declared, attached or not.
    // This is what makes a second declaration of the same container an ensure.
    #declaredSectionIndex: Map<string, number> = new Map();

    // <section index key, record id> of the identified sections that are reachable from a menu root. A section
    // that is itself waiting for its own parent cannot adopt anything, otherwise an item would report
    // "registered" while sitting in a subtree that no menu shows.
    #attachedSectionIndex: Map<string, number> = new Map();

    // <section index key, records> of the items waiting for a section that is not attached yet, keyed by what
    // they are waiting for. Attaching a section is then a direct lookup rather than a scan of every record.
    #waitersByKey: Map<string, NavigationItemRecord[]> = new Map();

    // <section index key, DuplicateSectionDeclaration[]>
    #duplicateDeclarations: Map<string, DuplicateSectionDeclaration[]> = new Map();

    // <record id, projected item>. Projecting a whole menu on every registration would be quadratic over a
    // bootstrap, and the runtime reads the items back after each one to log them. A record's projection only
    // changes when its own subtree does, so a change invalidates the record and its ancestors and leaves every
    // untouched branch alone. Unchanged branches also keep their identity across a mutation, which is what a
    // React reconciliation wants.
    #projectionCache: Map<number, NavigationItem> = new Map();

    // Menus are remembered even when every record for them has been cleared, matching the previous behaviour
    // of "#menusIndex", whose keys survived "clearDeferredItems".
    readonly #menuIds: Set<string> = new Set();

    // The projection is memoized to ensure the returned array is immutable and can be used in React closures.
    // The memoized value only changes when the records change, which is what "useSyncExternalStore" consumers
    // rely on.
    readonly #memoizedGetItems = memoize((menuId: string) => this.#projectMenu(menuId));

    // Memoized grouped view of the full registry, reusing the per-menu memoized arrays so inner array
    // references stay stable.
    readonly #memoizedGetAllItemsByMenu = memoize(() => {
        const result = new Map<string, RootNavigationItem[]>();

        this.#menuIds.forEach(menuId => {
            result.set(menuId, this.#memoizedGetItems(menuId));
        });

        return result;
    });

    #invalidate() {
        memoizeClear(this.#memoizedGetItems);
        memoizeClear(this.#memoizedGetAllItemsByMenu);
    }

    #invalidateBranch(recordId: number | undefined) {
        let current = recordId;

        while (current !== undefined) {
            if (!this.#projectionCache.delete(current)) {
                // The ancestors of an already invalidated record are invalidated too.
                break;
            }

            current = this.#recordsById.get(current)?.parentId;
        }
    }

    add(menuId: string, registrationType: NavigationItemRegistrationType, navigationItem: RootNavigationItem, { sectionId }: AddNavigationItemOptions = {}): NavigationItemRegistrationResult {
        this.#menuIds.add(menuId);

        const completedPendingRegistrations: RootNavigationItem[] = [];
        const { record, isDuplicate } = this.#createRecords(menuId, registrationType, navigationItem, undefined, sectionId, completedPendingRegistrations);

        this.#invalidate();

        let registrationStatus: NavigationItemRegistrationStatus;

        if (isDuplicate) {
            registrationStatus = "deduplicated";
        } else if (sectionId && record.parentId === undefined) {
            registrationStatus = "pending";
        } else {
            registrationStatus = "registered";
        }

        return {
            registrationStatus,
            completedPendingRegistrations,
            registrationType,
            item: navigationItem,
            menuId,
            sectionId
        };
    }

    // Decomposes a registered item into records, recursively. An inline child becomes a record parented by its
    // enclosing section, so nesting declared inline and nesting declared with the "sectionId" option produce
    // the same shape and are undone by the same filter.
    #createRecords(menuId: string, registrationType: NavigationItemRegistrationType, item: NavigationItem, inlineParentId: number | undefined, sectionId: string | undefined, completed: RootNavigationItem[]): { record: NavigationItemRecord; isDuplicate: boolean } {
        if (!isLinkItem(item) && item.$id) {
            const indexKey = createSectionIndexKey(menuId, item.$id);
            const existingRecordId = this.#declaredSectionIndex.get(indexKey);

            if (existingRecordId !== undefined) {
                // A section container declared more than once for a menu is an ensure, not an error. The first
                // declaration wins and the later one contributes nothing: merging its inline children here
                // would attach them to a container registered by another run, which the clear could not undo.
                // A module contributing children to a shared section nests them with the "sectionId" option.
                const declarations = this.#duplicateDeclarations.get(indexKey) ?? [];

                declarations.push({
                    menuId,
                    sectionId: item.$id,
                    registrationType,
                    item,
                    parentSectionId: sectionId
                });

                this.#duplicateDeclarations.set(indexKey, declarations);

                return { record: this.#recordsById.get(existingRecordId)!, isDuplicate: true };
            }
        }

        let parentId = inlineParentId;

        if (parentId === undefined && sectionId) {
            parentId = this.#attachedSectionIndex.get(createSectionIndexKey(menuId, sectionId));
        }

        const record: NavigationItemRecord = {
            id: this.#nextRecordId++,
            parentId,
            inlineParentId,
            menuId,
            registrationType,
            sectionId,
            item
        };

        this.#records.push(record);
        this.#recordsById.set(record.id, record);

        if (parentId !== undefined) {
            this.#addChild(parentId, record);
        } else if (sectionId) {
            this.#addWaiter(createSectionIndexKey(menuId, sectionId), record);
        } else {
            this.#addRoot(menuId, record);
        }

        if (!isLinkItem(item)) {
            if (item.$id) {
                this.#declaredSectionIndex.set(createSectionIndexKey(menuId, item.$id), record.id);
            }

            // The inline children are decomposed rather than kept on the item, so a section's children are
            // always the records parented by it and never a mix of the two. They are created before this
            // section adopts, so that they come first in the children array.
            const childCompleted: RootNavigationItem[] = [];

            item.children?.forEach(x => {
                this.#createRecords(menuId, registrationType, x, record.id, undefined, childCompleted);
            });

            const ownCompleted: RootNavigationItem[] = [];

            if (item.$id && (parentId !== undefined || !sectionId)) {
                this.#adopt(record, ownCompleted);
            }

            // A section reports its own completions before the ones its descendants unblocked, which is what
            // the previous recursive implementation produced by unshifting them in front.
            completed.push(...ownCompleted, ...childCompleted);
        }

        return { record, isDuplicate: false };
    }

    // Marks an identified, reachable section as attached and adopts everything waiting for it. An adopted item
    // that is itself an identified section becomes reachable in turn, so the adoption cascades.
    #adopt(record: NavigationItemRecord, completed: RootNavigationItem[]) {
        const indexKey = createSectionIndexKey(record.menuId, (record.item as NavigationSection).$id!);

        this.#attachedSectionIndex.set(indexKey, record.id);

        const waiters = this.#waitersByKey.get(indexKey);

        if (!waiters) {
            return;
        }

        this.#waitersByKey.delete(indexKey);

        waiters.forEach(x => {
            x.parentId = record.id;
            this.#addChild(record.id, x);
            completed.push(x.item);
        });

        waiters.forEach(x => {
            this.#cascadeAdoption(x, completed);
        });
    }

    #cascadeAdoption(record: NavigationItemRecord, completed: RootNavigationItem[]) {
        if (isLinkItem(record.item)) {
            return;
        }

        const children = this.#childrenByParent.get(record.id);
        // Snapshot the length before adopting: "#adopt" appends the newly adopted records and cascades them
        // itself, so walking past this point would visit them twice.
        const inlineCount = children?.length ?? 0;

        if (record.item.$id) {
            this.#adopt(record, completed);
        }

        for (let i = 0; i < inlineCount; i++) {
            this.#cascadeAdoption(children![i], completed);
        }
    }

    #addChild(parentId: number, record: NavigationItemRecord) {
        this.#invalidateBranch(parentId);

        const children = this.#childrenByParent.get(parentId);

        if (children) {
            children.push(record);
        } else {
            this.#childrenByParent.set(parentId, [record]);
        }
    }

    #addRoot(menuId: string, record: NavigationItemRecord) {
        const roots = this.#rootsByMenu.get(menuId);

        if (roots) {
            roots.push(record);
        } else {
            this.#rootsByMenu.set(menuId, [record]);
        }
    }

    #addWaiter(indexKey: string, record: NavigationItemRecord) {
        const waiters = this.#waitersByKey.get(indexKey);

        if (waiters) {
            waiters.push(record);
        } else {
            this.#waitersByKey.set(indexKey, [record]);
        }
    }

    #projectMenu(menuId: string): RootNavigationItem[] {
        return (this.#rootsByMenu.get(menuId) ?? []).map(x => this.#projectRecord(x));
    }

    #projectRecord(record: NavigationItemRecord): NavigationItem {
        if (isLinkItem(record.item)) {
            return record.item;
        }

        const cached = this.#projectionCache.get(record.id);

        if (cached) {
            return cached;
        }

        const children = (this.#childrenByParent.get(record.id) ?? []).map(x => this.#projectRecord(x));
        const projection = projectSection(record.item, children);

        this.#projectionCache.set(record.id, projection);

        return projection;
    }

    getItems(menuId: string) {
        return this.#memoizedGetItems(menuId);
    }

    getAllItemsByMenu() {
        return this.#memoizedGetAllItemsByMenu();
    }

    clearDeferredItems() {
        if (!this.#records.some(x => x.registrationType === "deferred")) {
            // Keep the projection immutable by only rebuilding when something actually changed.
            return;
        }

        // An inline child carries the registration type of the item it was declared in, so a subtree is always
        // removed or kept whole.
        const survivors = this.#records.filter(x => x.registrationType !== "deferred");

        this.#records = survivors;
        this.#recordsById = new Map();
        this.#projectionCache = new Map();
        this.#rootsByMenu = new Map();
        this.#childrenByParent = new Map();
        this.#declaredSectionIndex = new Map();
        this.#attachedSectionIndex = new Map();
        this.#waitersByKey = new Map();

        survivors.forEach(x => {
            this.#recordsById.set(x.id, x);

            // Only the inline linkage is intrinsic. A record attached through the "sectionId" option goes back
            // to waiting, which is the case the previous implementation could not express: a static item
            // nested under a deferred section was consumed once and then lost, with nothing left to report.
            x.parentId = x.inlineParentId;

            if (!isLinkItem(x.item) && x.item.$id) {
                this.#declaredSectionIndex.set(createSectionIndexKey(x.menuId, x.item.$id), x.id);
            }
        });

        survivors.forEach(x => {
            if (x.inlineParentId !== undefined) {
                this.#addChild(x.inlineParentId, x);
            } else if (x.sectionId) {
                this.#addWaiter(createSectionIndexKey(x.menuId, x.sectionId), x);
            } else {
                this.#addRoot(x.menuId, x);
            }
        });

        // Everything reachable from a root is attached, and attaching adopts whatever survived waiting for it.
        const completed: RootNavigationItem[] = [];

        this.#rootsByMenu.forEach(roots => {
            roots.forEach(x => {
                this.#cascadeAdoption(x, completed);
            });
        });

        this.#deleteDeferredDuplicateDeclarations();

        this.#invalidate();
    }

    #deleteDeferredDuplicateDeclarations() {
        const keysToDelete: string[] = [];

        this.#duplicateDeclarations.forEach((declarations, key) => {
            // A duplicate declared by the run being cleared is gone with it. Keeping it would re-report the
            // same conflict after every update run.
            const remaining = declarations.filter(x => x.registrationType !== "deferred");

            if (remaining.length === 0) {
                keysToDelete.push(key);
            } else if (remaining.length !== declarations.length) {
                this.#duplicateDeclarations.set(key, remaining);
            }
        });

        keysToDelete.forEach(x => this.#duplicateDeclarations.delete(x));
    }

    getPendingRegistrations() {
        const index = new Map<string, PendingRegistrationItem[]>();

        this.#waitersByKey.forEach((waiters, indexKey) => {
            index.set(indexKey, waiters.map(x => ({
                menuId: x.menuId,
                sectionId: x.sectionId!,
                registrationType: x.registrationType,
                item: x.item
            })));
        });

        return new PendingNavigationItemRegistrations(index);
    }

    getDuplicateSectionDeclarations() {
        return this.#duplicateDeclarations;
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
