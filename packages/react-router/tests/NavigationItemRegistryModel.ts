import type { NavigationItem, NavigationItemRegistrationType, NavigationSection, RootNavigationItem } from "../src/NavigationItemRegistry.ts";
import { isLinkItem } from "../src/NavigationItemRegistry.ts";

// A reference implementation of the section index, written to be structurally incapable of the defect under
// test rather than to be fast or complete.
//
// The registry keys its section index and its pending index by a single string built from a "menuId" and a
// section "$id". Any such scheme has to pick a separator, and a separator that can appear inside either value
// makes two different pairs produce one key. This model keys by the pair itself, as a Map of Maps, so no
// separator exists and no collision is representable. Differences between the two are therefore attributable
// to the real implementation's key scheme, which is the whole point of comparing them.
//
// Only the behaviour the differential test asserts on is modelled: which registrations throw, what tree each
// menu ends up with, and which (menuId, sectionId) pairs are left pending. Registration results, memoization
// and logging are out of scope.
export interface ModelPendingSection {
    menuId: string;
    sectionId: string;
    items: RootNavigationItem[];
}

interface ModelSectionEntry {
    registrationType: NavigationItemRegistrationType;
    item: NavigationSection;
}

export class NavigationItemRegistryModel {
    // <menuId, <sectionId, entry>> — the pair is the key, so there is nothing to collide.
    readonly #sections: Map<string, Map<string, ModelSectionEntry>> = new Map();

    // <menuId, <sectionId, items>> — pending items, keyed the same way.
    readonly #pending: Map<string, Map<string, { registrationType: NavigationItemRegistrationType; item: RootNavigationItem }[]>> = new Map();

    readonly #menus: Map<string, { registrationType: NavigationItemRegistrationType; item: RootNavigationItem }[]> = new Map();

    #nested<T>(index: Map<string, Map<string, T>>, menuId: string) {
        let inner = index.get(menuId);

        if (!inner) {
            inner = new Map<string, T>();
            index.set(menuId, inner);
        }

        return inner;
    }

    #registerSectionsRecursively(menuId: string, registrationType: NavigationItemRegistrationType, items: NavigationItem[]) {
        items.forEach(x => {
            if (isLinkItem(x)) {
                return;
            }

            const section = x;

            if (section.$id) {
                const sections = this.#nested(this.#sections, menuId);

                if (sections.has(section.$id)) {
                    throw new Error(`[squide] A navigation section index has already been registered for the menu: "${menuId}" and section: "${section.$id}".`);
                }

                sections.set(section.$id, { registrationType, item: section });
            }

            if (section.children) {
                this.#registerSectionsRecursively(menuId, registrationType, section.children);
            }

            if (section.$id) {
                this.#drainPending(menuId, section.$id);
            }
        });
    }

    #drainPending(menuId: string, sectionId: string) {
        const pending = this.#pending.get(menuId)?.get(sectionId);

        if (!pending) {
            return;
        }

        this.#pending.get(menuId)!.delete(sectionId);

        pending.forEach(x => this.#addNested(menuId, sectionId, x.registrationType, x.item));
    }

    #addNested(menuId: string, sectionId: string, registrationType: NavigationItemRegistrationType, item: RootNavigationItem) {
        const parent = this.#sections.get(menuId)?.get(sectionId);

        if (!parent) {
            const pending = this.#nested(this.#pending, menuId);
            pending.set(sectionId, [...(pending.get(sectionId) ?? []), { registrationType, item }]);

            return;
        }

        if (parent.registrationType !== registrationType) {
            throw new Error("[squide] A nested navigation item must have the same registration type as the section it's nested under.");
        }

        if (!isLinkItem(item)) {
            this.#registerSectionsRecursively(menuId, registrationType, [item]);
        }

        parent.item.children = [...(parent.item.children ?? []), item];
    }

    add(menuId: string, registrationType: NavigationItemRegistrationType, item: RootNavigationItem, sectionId?: string) {
        if (sectionId) {
            this.#addNested(menuId, sectionId, registrationType, item);

            return;
        }

        if (!isLinkItem(item)) {
            this.#registerSectionsRecursively(menuId, registrationType, [item]);
        }

        this.#menus.set(menuId, [...(this.#menus.get(menuId) ?? []), { registrationType, item }]);
    }

    getItems(menuId: string) {
        return this.#menus.get(menuId)?.map(x => x.item) ?? [];
    }

    clearDeferredItems() {
        this.#menus.forEach((items, menuId) => {
            this.#menus.set(menuId, items.filter(x => x.registrationType !== "deferred"));
        });

        this.#sections.forEach(sections => {
            Array.from(sections.entries())
                .filter(([, entry]) => entry.registrationType === "deferred")
                .forEach(([sectionId]) => sections.delete(sectionId));
        });

        // Static pending registrations belong to the initial registration rather than to the run being
        // replayed, so they survive a clear. This mirrors the registry deliberately.
        this.#pending.forEach(pending => {
            Array.from(pending.entries()).forEach(([sectionId, items]) => {
                const remaining = items.filter(x => x.registrationType !== "deferred");

                if (remaining.length === 0) {
                    pending.delete(sectionId);
                } else {
                    pending.set(sectionId, remaining);
                }
            });
        });
    }

    getPendingSections(): ModelPendingSection[] {
        const result: ModelPendingSection[] = [];

        this.#pending.forEach((pending, menuId) => {
            pending.forEach((items, sectionId) => {
                result.push({ menuId, sectionId, items: items.map(x => x.item) });
            });
        });

        return result;
    }
}
