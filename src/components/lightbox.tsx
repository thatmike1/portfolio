import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

export type LightboxShot = {
    src: string;
    alt: string;
    /** the asset's real pixel size — the viewer never shows it larger than this */
    width: number;
    height: number;
};

const LightboxContext = createContext<((shot: LightboxShot) => void) | null>(null);

/**
 * the page's screenshot viewer, or null when there is no provider above — callers fall
 * back to their plain link in that case, so a shot is still reachable without javascript.
 */
export function useLightbox() {
    return useContext(LightboxContext);
}

/**
 * mounts the screenshot viewer once for the page and hands its opener down through context.
 * the native <dialog> does the heavy lifting: top layer, focus trap, escape to dismiss, and
 * focus handed back to whatever opened it.
 */
export function LightboxProvider({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [shot, setShot] = useState<LightboxShot | null>(null);
    const [open, setOpen] = useState(false);
    // fit-to-screen by default; the whole shot is the point, reading it is the second step
    const [actualSize, setActualSize] = useState(false);

    const openShot = useCallback((next: LightboxShot) => {
        setShot(next);
        setActualSize(false);
        setOpen(true);
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        // the shot stays mounted while it fades out; the dialog is display:none by then
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <LightboxContext.Provider value={openShot}>
            {children}
            <dialog
                className="lightbox"
                ref={dialogRef}
                aria-label="screenshot viewer"
                onClose={() => setOpen(false)}
                onClick={(event) => {
                    // only the stage itself; clicks that land on the shot or its buttons bubble here
                    if (event.target === dialogRef.current) setOpen(false);
                }}
            >
                {shot ? (
                    <div className="lightbox-stage">
                        <button
                            type="button"
                            className="lightbox-close"
                            onClick={() => setOpen(false)}
                        >
                            close
                        </button>
                        <button
                            type="button"
                            className={`lightbox-zoom${actualSize ? " lightbox-zoom--actual" : ""}`}
                            aria-label={
                                actualSize
                                    ? `${shot.alt} — fit the shot to the screen`
                                    : `${shot.alt} — view the shot at full size`
                            }
                            onClick={() => setActualSize((v) => !v)}
                        >
                            <img
                                className="lightbox-img"
                                src={shot.src}
                                alt={shot.alt}
                                width={shot.width}
                                height={shot.height}
                                // never past its own pixels, in either mode — its text stops being readable
                                style={
                                    actualSize
                                        ? { width: shot.width, maxWidth: "none" }
                                        : { maxWidth: `min(100%, ${shot.width}px)` }
                                }
                            />
                        </button>
                    </div>
                ) : null}
            </dialog>
        </LightboxContext.Provider>
    );
}
