// @vitest-environment jsdom
import { act, createElement } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectCollection } from "./project-collection";

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(cleanup);

describe("project collection", () => {
    it("moves keyboard focus and selection together, wraps, and leaves the preview reachable", () => {
        render(createElement(ProjectCollection));
        const tabs = screen.getAllByRole("tab");
        tabs[0].focus();
        fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
        expect(document.activeElement).toBe(tabs.at(-1));
        expect(tabs.at(-1)?.getAttribute("aria-selected")).toBe("true");
        expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
        fireEvent.keyDown(document.activeElement ?? tabs[0], { key: "Home" });
        expect(document.activeElement).toBe(tabs[0]);
        fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
        expect(window.location.hash).toBe("#font-tinder");
        expect(screen.getByRole("tabpanel").id).toBe("font-tinder");
        expect(tabs.filter((tab) => tab.tabIndex === 0)).toEqual([tabs[1]]);
    });

    it("opens a project permalink and follows browser history without stealing focus", () => {
        window.history.replaceState(null, "", "/#model-map");
        render(createElement(ProjectCollection));
        expect(screen.getByRole("tabpanel").id).toBe("model-map");
        fireEvent.click(screen.getByRole("tab", { name: /tally/ }));
        expect(window.location.hash).toBe("#tally");
        act(() => {
            window.history.replaceState(null, "", "/#model-map");
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(screen.getByRole("tabpanel").id).toBe("model-map");
        act(() => {
            window.history.replaceState(null, "", "/#say-hi");
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(screen.getByRole("tabpanel").id).toBe("model-map");
    });

    it("keeps the full collection and outbound links available without javascript", () => {
        const html = renderToString(createElement(ProjectCollection));
        expect(html).toContain('id="beadside"');
        expect(html).toContain('id="model-map"');
        expect(html).toContain('id="t3-code"');
        expect(html).toContain('href="https://models.thatmike1.dev/"');
        expect(html).not.toContain(' hidden=""');
    });
});
