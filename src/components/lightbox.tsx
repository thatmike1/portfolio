import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
} from "react";
import type { ResponsiveImage, Shot } from "../lib/responsive-image";
import "./lightbox.css";

type OpenShot = (gallery: readonly Shot[], index: number) => void;

const LightboxContext = createContext<OpenShot | null>(null);

/**
 * the page's screenshot viewer, or null when there is no provider above: callers keep
 * their plain link to the full image in that case, so a shot is reachable without it.
 */
export function useLightbox() {
    return useContext(LightboxContext);
}

/** the point of the shot that should stay under the pointer as it zooms, as fractions */
type Anchor = { fx: number; fy: number; x: number; y: number };

/** pixels a drag has to cover before it stops counting as a click */
const DRAG_SLOP = 4;
/** how far one arrow press pans a zoomed shot */
const PAN_STEP = 96;

/**
 * a shot's two sizes in css px. actual is one image pixel per device pixel; fit is as
 * large as the stage allows without going past that, so nothing is ever upscaled into
 * mush. dpr comes in so a phone's 3x screen reads a 2560px capture at 853 css px.
 */
export function shotSizes(
    image: Pick<ResponsiveImage, "width" | "height">,
    stage: { width: number; height: number },
    dpr: number,
) {
    const actual = image.width / dpr;
    const fit = Math.min(stage.width, actual, (stage.height * image.width) / image.height);
    // a zoom that only gains a few percent reads as a jitter, not a closer look
    return { actual, fit, canZoom: actual > fit * 1.12 };
}

/**
 * mounts the viewer once and hands its opener down through context. the native <dialog>
 * does the heavy lifting: top layer, inert page, escape to close, focus handed back to
 * whatever opened it. on top of that: fit by default, click or z for actual pixels,
 * drag or arrows to pan, left/right through a project's shots, backdrop to close.
 */
export function LightboxProvider({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const [gallery, setGallery] = useState<readonly Shot[]>([]);
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const [stage, setStage] = useState({ width: 0, height: 0 });
    const [dpr, setDpr] = useState(1);
    const anchor = useRef<Anchor | null>(null);
    const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(
        null,
    );
    // a drag ends in a click event; this swallows that one click
    const swallowClick = useRef(false);

    const shot = gallery[index] ?? null;
    const many = gallery.length > 1;

    const openShot = useCallback<OpenShot>((next, at) => {
        setGallery(next);
        setIndex(at);
        setZoomed(false);
        setDpr(window.devicePixelRatio || 1);
        setOpen(true);
    }, []);

    // a layout effect, and declared first, so the dialog is already showing when the
    // stage below gets measured
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            // the shot is what the dialog is for, so it takes focus rather than close: enter
            // zooms and the arrows flip from the first keypress. showModal alone would pick
            // the first button, and react's autofocus fires while the dialog is still hidden
            dialog.querySelector<HTMLElement>(".lightbox-zoom")?.focus();
        }
        // the shot stays mounted while it fades out; the dialog is display:none by then
        if (!open && dialog.open) dialog.close();
    }, [open]);

    // the stage's box decides the fit size, and whether zooming would change anything
    useLayoutEffect(() => {
        const node = stageRef.current;
        if (!open || !node) return;
        const measure = () => {
            setStage({ width: node.clientWidth, height: node.clientHeight });
            setDpr(window.devicePixelRatio || 1);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [open, shot]);

    const sizes = shot ? shotSizes(shot.image, stage, dpr) : null;

    // after the zoom lands, scroll so the anchored point is back under the pointer
    useLayoutEffect(() => {
        const node = stageRef.current;
        const point = anchor.current;
        if (!node || !shot || !zoomed || !point || !sizes) return;
        const box = node.getBoundingClientRect();
        const height = (sizes.actual * shot.image.height) / shot.image.width;
        node.scrollLeft = point.fx * sizes.actual - (point.x - box.left);
        node.scrollTop = point.fy * height - (point.y - box.top);
        anchor.current = null;
    }, [zoomed, shot, sizes]);

    const go = useCallback(
        (step: number) => {
            if (!many) return;
            setIndex((current) => (current + step + gallery.length) % gallery.length);
            setZoomed(false);
        },
        [many, gallery.length],
    );

    /** zoom in around a point of the shot, given in client px; the middle when there is none */
    const zoomAt = (img: HTMLElement, x?: number, y?: number) => {
        const rect = img.getBoundingClientRect();
        const px = x ?? rect.left + rect.width / 2;
        const py = y ?? rect.top + rect.height / 2;
        anchor.current = {
            fx: (px - rect.left) / rect.width,
            fy: (py - rect.top) / rect.height,
            x: px,
            y: py,
        };
        setZoomed(true);
    };

    const toggleZoom = (event: MouseEvent<HTMLButtonElement>) => {
        if (swallowClick.current) {
            swallowClick.current = false;
            return;
        }
        if (zoomed) return setZoomed(false);
        if (!sizes?.canZoom) return;
        const img = event.currentTarget.querySelector("img");
        if (!img) return;
        // a keyboard press arrives as a click with no pointer position: zoom on the middle
        const fromPointer = event.detail > 0;
        zoomAt(img, fromPointer ? event.clientX : undefined, fromPointer ? event.clientY : undefined);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
        const node = stageRef.current;
        const key = event.key;
        if (zoomed && node && key.startsWith("Arrow")) {
            // zoomed in, the arrows pan rather than flip, whatever has focus
            event.preventDefault();
            const dx = key === "ArrowLeft" ? -PAN_STEP : key === "ArrowRight" ? PAN_STEP : 0;
            const dy = key === "ArrowUp" ? -PAN_STEP : key === "ArrowDown" ? PAN_STEP : 0;
            node.scrollLeft += dx;
            node.scrollTop += dy;
            return;
        }
        if (key === "ArrowLeft" || key === "ArrowRight") {
            if (!many) return;
            event.preventDefault();
            go(key === "ArrowLeft" ? -1 : 1);
            return;
        }
        if (key === "z" || key === "+" || key === "=") {
            event.preventDefault();
            if (key === "z" && zoomed) return setZoomed(false);
            const img = node?.querySelector("img");
            if (!zoomed && sizes?.canZoom && img) zoomAt(img);
            return;
        }
        if (key === "-" || key === "0") {
            event.preventDefault();
            setZoomed(false);
        }
    };

    // a mouse drags the zoomed shot around; touch keeps its native pan and pinch
    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        const node = stageRef.current;
        if (!zoomed || !node || event.pointerType !== "mouse" || event.button !== 0) return;
        drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: node.scrollLeft,
            top: node.scrollTop,
            moved: false,
        };
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const node = stageRef.current;
        const start = drag.current;
        if (!node || !start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
        if (!start.moved) {
            start.moved = true;
            node.setPointerCapture(event.pointerId);
            node.dataset.dragging = "true";
        }
        node.scrollLeft = start.left - dx;
        node.scrollTop = start.top - dy;
    };
    const endDrag = (event: PointerEvent<HTMLDivElement>) => {
        const node = stageRef.current;
        const start = drag.current;
        drag.current = null;
        if (!node || !start?.moved) return;
        swallowClick.current = true;
        delete node.dataset.dragging;
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        // the swallowed click may never come if the drag ended off the shot
        window.setTimeout(() => {
            swallowClick.current = false;
        }, 0);
    };

    const fitWidth = sizes && sizes.fit > 0 ? sizes.fit : null;
    const imgStyle: CSSProperties | undefined = shot
        ? {
              width: zoomed && sizes ? sizes.actual : (fitWidth ?? undefined),
              aspectRatio: `${shot.image.width} / ${shot.image.height}`,
              backgroundColor: shot.image.color,
              backgroundImage: `url("${shot.image.placeholder}")`,
          }
        : undefined;

    return (
        <LightboxContext.Provider value={openShot}>
            {children}
            <dialog
                className="lightbox"
                ref={dialogRef}
                aria-label="screenshot viewer"
                onClose={() => {
                    setOpen(false);
                    setZoomed(false);
                }}
                onKeyDown={onKeyDown}
                onClick={(event) => {
                    if (swallowClick.current) {
                        swallowClick.current = false;
                        return;
                    }
                    // the room around the shot is the backdrop: the dialog's own padding and
                    // the stage's empty space both close it
                    const target = event.target;
                    if (
                        target === dialogRef.current ||
                        target === stageRef.current ||
                        (target instanceof HTMLElement && target.dataset.backdrop === "true")
                    )
                        setOpen(false);
                }}
            >
                {shot && sizes ? (
                    <>
                        <div className="lightbox-bar" data-backdrop="true">
                            {many ? (
                                <p className="lightbox-count" aria-live="polite">
                                    {index + 1} / {gallery.length}
                                </p>
                            ) : null}
                            <p className="lightbox-keys" aria-hidden="true">
                                <span className="lightbox-keys-mouse">
                                    {sizes.canZoom
                                        ? zoomed
                                            ? "drag or arrow keys to look around · click to fit"
                                            : "click for actual pixels"
                                        : "this is every pixel there is"}
                                    {many && !zoomed ? " · ← → for the others" : ""} · esc to
                                    close
                                </span>
                                <span className="lightbox-keys-touch">
                                    {sizes.canZoom
                                        ? zoomed
                                            ? "tap to fit"
                                            : "tap for actual pixels"
                                        : ""}
                                </span>
                            </p>
                            <button
                                type="button"
                                className="lightbox-close"
                                onClick={() => setOpen(false)}
                            >
                                close
                            </button>
                        </div>
                        <div
                            className="lightbox-stage"
                            ref={stageRef}
                            data-zoomed={zoomed ? "true" : undefined}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                        >
                            <button
                                type="button"
                                className="lightbox-zoom"
                                data-can-zoom={sizes.canZoom ? "true" : undefined}
                                aria-pressed={sizes.canZoom ? zoomed : undefined}
                                aria-label={
                                    sizes.canZoom
                                        ? `${shot.alt}. ${zoomed ? "fit to the screen" : "show at actual pixels"}`
                                        : shot.alt
                                }
                                onClick={toggleZoom}
                            >
                                <img
                                    // a new element per shot, so the next one starts on its own placeholder
                                    key={shot.image.src}
                                    className="lightbox-img"
                                    src={shot.image.src}
                                    srcSet={shot.image.srcSet}
                                    // the browser picks the rung for what is on screen right now
                                    // (before the stage is measured, the viewport's width is the honest bound)
                                    sizes={`${Math.ceil(zoomed ? sizes.actual : (fitWidth ?? Math.min(sizes.actual, window.innerWidth)))}px`}
                                    width={shot.image.width}
                                    height={shot.image.height}
                                    alt=""
                                    decoding="async"
                                    draggable={false}
                                    style={imgStyle}
                                />
                            </button>
                        </div>
                        <div className="lightbox-foot" data-backdrop="true">
                            {many ? (
                                <button
                                    type="button"
                                    className="lightbox-step"
                                    aria-label="previous screenshot"
                                    onClick={() => go(-1)}
                                >
                                    <span aria-hidden="true">←</span>
                                </button>
                            ) : null}
                            <p className="lightbox-caption">{shot.caption ?? shot.alt}</p>
                            {many ? (
                                <button
                                    type="button"
                                    className="lightbox-step"
                                    aria-label="next screenshot"
                                    onClick={() => go(1)}
                                >
                                    <span aria-hidden="true">→</span>
                                </button>
                            ) : null}
                        </div>
                    </>
                ) : null}
            </dialog>
        </LightboxContext.Provider>
    );
}
