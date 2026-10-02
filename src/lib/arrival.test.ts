// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useArrival } from "./arrival";

function Probe() {
    const [ref, arrival] = useArrival<HTMLDivElement>();
    return createElement("div", { ref, "data-arrival": arrival });
}

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

/** a hand-driven IntersectionObserver: the test says when the element is in view */
function fakeObserver() {
    const callbacks: Callback[] = [];
    const disconnect = vi.fn();
    class IO {
        constructor(cb: Callback) {
            callbacks.push(cb);
        }
        observe() {}
        disconnect = disconnect;
    }
    vi.stubGlobal("IntersectionObserver", IO);
    return { fire: (seen: boolean) => callbacks.at(-1)?.([{ isIntersecting: seen }]), disconnect };
}

function motion(reduce: boolean) {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: reduce, addEventListener() {}, removeEventListener() {} })),
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("useArrival", () => {
    it("renders settled on the server, so the page is complete without javascript", () => {
        expect(renderToString(createElement(Probe))).toContain('data-arrival="settled"');
    });

    it("stays settled under reduced motion and never observes", () => {
        motion(true);
        const io = fakeObserver();
        const { container } = render(createElement(Probe));
        expect(container.firstElementChild?.getAttribute("data-arrival")).toBe("settled");
        expect(io.disconnect).not.toHaveBeenCalled();
        act(() => io.fire(true));
        expect(container.firstElementChild?.getAttribute("data-arrival")).toBe("settled");
    });

    it("leaves an element that is already on screen alone", () => {
        motion(false);
        const io = fakeObserver();
        const { container } = render(createElement(Probe));
        act(() => io.fire(true));
        expect(container.firstElementChild?.getAttribute("data-arrival")).toBe("settled");
        expect(io.disconnect).toHaveBeenCalled();
    });

    it("waits below the fold, arrives once, and then stops watching", () => {
        motion(false);
        const io = fakeObserver();
        const { container } = render(createElement(Probe));
        act(() => io.fire(false));
        expect(container.firstElementChild?.getAttribute("data-arrival")).toBe("waiting");
        act(() => io.fire(true));
        expect(container.firstElementChild?.getAttribute("data-arrival")).toBe("arriving");
        expect(io.disconnect).toHaveBeenCalled();
    });
});
