import { render, screen } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { Outlet, useMatches } from "react-router";
import { describe, test } from "vitest";
import { initializeFireflyForStorybook } from "../src/initializeFireflyForStorybook.ts";
import { withFireflyDecorator } from "../src/withFireflyDecorator.tsx";

function StoryComponent() {
    return (
        <div>story-content</div>
    );
}

// Reads the "handle" of the deepest matched route, the scenario from
// https://github.com/workleap/wl-squide/issues/619.
function HandleProbe() {
    const matches = useMatches();
    const handle = matches[matches.length - 1]?.handle as { layout?: string } | undefined;

    return (
        <div>layout:{handle?.layout ?? "none"}</div>
    );
}

function LayoutWithOutlet() {
    return (
        <div>
            shell-layout
            <Outlet />
        </div>
    );
}

describe("withFireflyDecorator", () => {
    test("renders the story at the default \"/story\" route", async ({ expect }) => {
        const runtime = await initializeFireflyForStorybook({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFireflyDecorator(runtime);

        render(
            Decorator(
                () => <StoryComponent />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            )
        );

        expect(await screen.findByText("story-content")).toBeDefined();
    });

    test("exposes a custom \"handle\" to the story through useMatches", async ({ expect }) => {
        const runtime = await initializeFireflyForStorybook({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFireflyDecorator(runtime, {
            route: ({ story }) => ({
                path: "/story",
                element: story,
                handle: { layout: "sidebar" }
            })
        });

        render(
            Decorator(
                () => <HandleProbe />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            )
        );

        expect(await screen.findByText("layout:sidebar")).toBeDefined();
    });

    test("renders child routes through an <Outlet /> when the story is a layout", async ({ expect }) => {
        const runtime = await initializeFireflyForStorybook({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFireflyDecorator(runtime, {
            route: ({ story }) => ({
                element: story,
                children: [
                    {
                        index: true,
                        element: <div>child-page</div>
                    }
                ]
            }),
            initialEntries: ["/"]
        });

        render(
            Decorator(
                () => <LayoutWithOutlet />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            )
        );

        expect(await screen.findByText("shell-layout")).toBeDefined();
        expect(await screen.findByText("child-page")).toBeDefined();
    });

    test("uses a custom \"initialEntries\" to select the mounted route", async ({ expect }) => {
        const runtime = await initializeFireflyForStorybook({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFireflyDecorator(runtime, {
            route: ({ story }) => ([
                {
                    path: "/foo",
                    element: <div>foo-page</div>
                },
                {
                    path: "/bar",
                    element: story
                }
            ]),
            initialEntries: ["/bar"]
        });

        render(
            Decorator(
                () => <StoryComponent />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            )
        );

        expect(await screen.findByText("story-content")).toBeDefined();
    });
});
