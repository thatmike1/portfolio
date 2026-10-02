// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ResponsiveImage, Shot } from "../lib/responsive-image";
import { LightboxProvider, shotSizes } from "./lightbox";
import { ShowcaseImage } from "./showcase-image";

const image = (name: string): ResponsiveImage => ({
    src: `/showcase/${name}-2560.webp`,
    width: 2560,
    height: 1440,
    srcSet: `/showcase/${name}-800.webp 800w, /showcase/${name}-2560.webp 2560w`,
    placeholder: "data:image/webp;base64,AAAA",
    color: "#f5f3ef",
});

const GALLERY: Shot[] = ["one", "two", "three"].map((name) => ({
    image: image(name),
    alt: `shot ${name}`,
    caption: `caption ${name}`,
}));

// jsdom has neither a modal dialog nor a resize observer; these stand in for the parts
// the viewer uses
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
    };
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});
afterEach(cleanup);

function renderGallery(index = 0) {
    render(
        createElement(
            LightboxProvider,
            null,
            createElement(ShowcaseImage, { shots: GALLERY, index, sizes: "50vw" }),
        ),
    );
    fireEvent.click(screen.getByRole("link"));
    return document.querySelector("dialog") as HTMLDialogElement;
}

describe("shot sizes", () => {
    it("fits inside the stage without ever passing one image pixel per device pixel", () => {
        const roomy = shotSizes({ width: 1600, height: 900 }, { width: 2300, height: 1300 }, 1);
        expect(roomy).toEqual({ actual: 1600, fit: 1600, canZoom: false });

        // a 2560 capture on a 2336px screen at dpr 1.1 already fits at ~98%: nothing to zoom to
        const nearly = shotSizes({ width: 2560, height: 1440 }, { width: 2290, height: 1300 }, 1.1);
        expect(nearly.canZoom).toBe(false);

        const laptop = shotSizes({ width: 2560, height: 1440 }, { width: 1400, height: 760 }, 1);
        expect(laptop.fit).toBeCloseTo((760 * 2560) / 1440);
        expect(laptop.canZoom).toBe(true);
    });

    it("reads a phone's 3x screen as a third of the pixels in css px", () => {
        const phone = shotSizes({ width: 2560, height: 1440 }, { width: 370, height: 700 }, 3);
        expect(phone.actual).toBeCloseTo(2560 / 3);
        expect(phone.fit).toBe(370);
    });
});

describe("screenshot viewer", () => {
    it("opens from the image itself on the shot that was clicked, focused and captioned", () => {
        const dialog = renderGallery(1);
        expect(dialog.open).toBe(true);
        expect(screen.getByText("2 / 3")).toBeTruthy();
        expect(document.activeElement?.className).toBe("lightbox-zoom");
        expect(dialog.querySelector(".lightbox-caption")?.textContent).toBe("caption two");
    });

    it("steps through a project's shots with the arrow keys, wrapping at the ends", () => {
        const dialog = renderGallery(0);
        fireEvent.keyDown(dialog, { key: "ArrowLeft" });
        expect(screen.getByText("3 / 3")).toBeTruthy();
        fireEvent.keyDown(dialog, { key: "ArrowRight" });
        expect(screen.getByText("1 / 3")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "next screenshot" }));
        expect(screen.getByText("2 / 3")).toBeTruthy();
    });

    it("zooms to actual pixels and pans instead of flipping while zoomed", () => {
        const dialog = renderGallery(0);
        const zoom = dialog.querySelector(".lightbox-zoom") as HTMLButtonElement;
        expect(zoom.getAttribute("aria-pressed")).toBe("false");
        fireEvent.click(zoom);
        expect(zoom.getAttribute("aria-pressed")).toBe("true");
        expect((dialog.querySelector(".lightbox-img") as HTMLImageElement).style.width).toBe(
            "2560px",
        );
        fireEvent.keyDown(dialog, { key: "ArrowRight" });
        expect(screen.getByText("1 / 3")).toBeTruthy();
        fireEvent.keyDown(dialog, { key: "z" });
        expect(zoom.getAttribute("aria-pressed")).toBe("false");
    });

    it("closes from the backdrop but not from the shot", () => {
        const dialog = renderGallery(0);
        fireEvent.click(dialog.querySelector(".lightbox-img") as HTMLElement);
        expect(dialog.open).toBe(true);
        fireEvent.click(dialog);
        expect(dialog.open).toBe(false);
    });
});

describe("showcase image", () => {
    it("ships the ladder with honest sizes, a reserved box, and lazy loading unless it leads", () => {
        render(
            createElement("div", null, [
                createElement(ShowcaseImage, { key: "a", shots: GALLERY, sizes: "50vw" }),
                createElement(ShowcaseImage, {
                    key: "b",
                    shots: GALLERY,
                    index: 1,
                    sizes: "100vw",
                    priority: true,
                }),
            ]),
        );
        const [lazy, eager] = screen.getAllByRole("img") as HTMLImageElement[];
        expect(lazy.getAttribute("srcset")).toBe(GALLERY[0].image.srcSet);
        expect(lazy.getAttribute("sizes")).toBe("50vw");
        expect(lazy.getAttribute("width")).toBe("2560");
        expect(lazy.getAttribute("height")).toBe("1440");
        expect(lazy.getAttribute("loading")).toBe("lazy");
        expect(eager.getAttribute("loading")).toBe("eager");
        expect(eager.getAttribute("fetchpriority")).toBe("high");
    });

    it("stays a plain link to the full image when there is no viewer", () => {
        render(createElement(ShowcaseImage, { shots: GALLERY, sizes: "50vw" }));
        const link = screen.getByRole("link");
        expect(link.getAttribute("href")).toBe("/showcase/one-2560.webp");
        expect(fireEvent.click(link)).toBe(true);
    });
});
