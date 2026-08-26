import type { ReactRouterRuntime } from "../src/ReactRouterRuntime.ts";
import type { RegisterNavigationItemOptions } from "@squide/core";
import type { RootNavigationItem } from "../src/NavigationItemRegistry.ts";

// Type-level tests for "registerNavigationItem".
//
// The change these pin is entirely type-level, so the behavioural suite cannot see it. Without this file a
// later widening of "RefuseNestedPriority", or a reordering of the overloads, silently reverts the whole thing
// while every other test still passes.
//
// It exists because the first version of the change was wrong in a way no behavioural test could catch. The
// nested overload took an item whose "$priority" was typed "never", which rejects *every* variable declared as
// "RootNavigationItem" — the property is optional in that type, so its type is "number | undefined" whether or
// not a priority was ever set, and "number | undefined" is not assignable to "undefined". Four ordinary
// patterns stopped compiling. The repository's own samples only ever pass object literals, so CI was green.
//
// Both halves are asserted here: what must be refused, and what must keep compiling. The second half is the
// one that was missing.
//
// "@ts-expect-error" fails the build when the line below it compiles, so a refusal that stops working is a
// type error in this file rather than a silent hole.
//
// There are no runtime assertions and no vitest test here on purpose: the assertions are the directives, and
// the checker is the "typecheck" task. The filename deliberately stays outside the test glob — "tsconfig.json"
// includes the whole "tests" folder, so this is still type checked, it just is not run.

// Exported so nothing here reads as dead code. It is never called.
export function registerNavigationItemTypeContract(runtime: ReactRouterRuntime) {
    // ---------------------------------------------------------------------
    // Refused: a "$priority" written alongside a "sectionId".
    // ---------------------------------------------------------------------

    // @ts-expect-error -- "$priority" does nothing on a nested item.
    runtime.registerNavigationItem({ $id: "a", $label: "A", to: "/a", $priority: 10 }, { sectionId: "settings" });

    // @ts-expect-error -- same, with a "menuId" alongside.
    runtime.registerNavigationItem({ $id: "b", $label: "B", to: "/b", $priority: 10 }, { menuId: "sidebar", sectionId: "settings" });

    // @ts-expect-error -- a section, nested, carrying a priority.
    runtime.registerNavigationItem({ $id: "c", $label: "C", children: [], $priority: 10 }, { sectionId: "settings" });

    // @ts-expect-error -- a negative priority is just as meaningless.
    runtime.registerNavigationItem({ $id: "d", $label: "D", to: "/d", $priority: -10 }, { sectionId: "settings" });

    // @ts-expect-error -- inside a "children" literal, caught by the excess-property check.
    runtime.registerNavigationItem({ $id: "e", $label: "E", children: [{ $id: "e-child", $label: "E child", to: "/e-child", $priority: 10 }] });

    // ---------------------------------------------------------------------
    // Must keep compiling: top level, where "$priority" is honored.
    // ---------------------------------------------------------------------

    runtime.registerNavigationItem({ $id: "f", $label: "F", to: "/f", $priority: 10 });
    runtime.registerNavigationItem({ $id: "g", $label: "G", to: "/g", $priority: 10 }, { menuId: "sidebar" });
    runtime.registerNavigationItem({ $id: "h", $label: "H", children: [], $priority: 10 }, { menuId: "sidebar" });

    // ---------------------------------------------------------------------
    // Must keep compiling: nested, with no priority in sight. These are the
    // cases the first implementation broke.
    // ---------------------------------------------------------------------

    runtime.registerNavigationItem({ $id: "i", $label: "I", to: "/i" }, { sectionId: "settings" });
    runtime.registerNavigationItem({ $id: "j", $label: "J", to: "/j" }, { menuId: "sidebar", sectionId: "settings" });
    runtime.registerNavigationItem({ $id: "k", $label: "K", children: [] }, { sectionId: "settings" });

    // A variable declared as "RootNavigationItem" carries an optional "$priority" in its type. It must still be
    // accepted for a nested registration: the type says a priority is possible, not that one is set.
    const viaVariable: RootNavigationItem = { $id: "l", $label: "L", to: "/l" };
    runtime.registerNavigationItem(viaVariable, { sectionId: "settings" });

    // The loop form, which is how a module registers a computed set of items.
    const many: RootNavigationItem[] = [{ $id: "m", $label: "M", to: "/m" }];
    many.forEach(x => runtime.registerNavigationItem(x, { sectionId: "settings" }));

    // A "sectionId" that is neither definitely present nor definitely absent.
    const isNested = Math.random() > 0.5;
    runtime.registerNavigationItem(viaVariable, { sectionId: isNested ? "settings" : undefined });

    // A wrapper forwarding a caller's options bag, which ADR-0023 lists as supported.
    function wrapper(item: RootNavigationItem, options: RegisterNavigationItemOptions) {
        runtime.registerNavigationItem(item, options);
    }

    wrapper(viaVariable, {});
    wrapper(viaVariable, { sectionId: "settings" });

    // Even a variable that *does* carry a priority stays accepted for a nested registration. The type cannot
    // tell it apart from one that does not, and rejecting it would reject every "RootNavigationItem" variable.
    // This is the documented limit of the check, asserted so it is a known gap rather than a surprise.
    const withPriority: RootNavigationItem = { $id: "n", $label: "N", to: "/n", $priority: 10 };
    runtime.registerNavigationItem(withPriority, { sectionId: "settings" });
}
