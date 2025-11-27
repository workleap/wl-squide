import type { A11yParameters } from "@storybook/addon-a11y";
import type { ViewportMap } from "@storybook/addon-viewport";
import type { MswParameters } from "msw-storybook-addon";

// Module Augmentation of the Parameters interface.
declare module "storybook-react-rsbuild" {
    interface Parameters {
        msw?: MswParameters["msw"];
        a11y?: A11yParameters;
        // There is no typings for this one. So i copied the specs from https://storybook.js.org/docs/essentials/viewport
        viewport?: {
            defaultOrientation?: "portrait" | "landscape";
            defaultViewport?: keyof typeof viewports | (string & {});
            disable?: boolean;
            viewports?: ViewportMap;
        };
    }
}

