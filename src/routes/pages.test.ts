// @vitest-environment jsdom
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Route as HomeRoute } from "./index";
import { Route as HireRoute } from "./hire";

const PAGES = {
    home: HomeRoute.options.component,
    hire: HireRoute.options.component,
};

function markup(page: keyof typeof PAGES) {
    const component = PAGES[page];
    if (!component) throw new Error(`${page} has no component`);
    return renderToString(createElement(component));
}

describe.each(Object.keys(PAGES) as Array<keyof typeof PAGES>)("%s page", (page) => {
    // the stylesheet draws the outbound arrow on every external link, so one typed
    // into the markup as well shows up doubled
    it("leaves outbound arrows to the stylesheet", () => {
        expect(markup(page)).not.toContain("↗");
    });
});
