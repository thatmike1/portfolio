import type { CSSProperties } from "react";
import type { Shot } from "../lib/responsive-image";
import { useLightbox } from "./lightbox";
import "./showcase-image.css";

type FrameStyle = CSSProperties & Record<`--${string}`, string>;

type Props = {
    /** every shot of the project, so the viewer can step through them */
    shots: readonly Shot[];
    /** which of them this figure shows */
    index?: number;
    /**
     * the width this figure takes on screen, in `sizes` syntax. it is what keeps a
     * phone on the 800px rung while a wide screen gets the 2000px one, so say it
     * honestly for the layout the figure sits in
     */
    sizes: string;
    /** the first shot a visitor sees: fetched right away instead of when scrolled near */
    priority?: boolean;
    /** the caption under the figure; the viewer shows it either way */
    showCaption?: boolean;
    className?: string;
};

/**
 * a screenshot on the page: the webp ladder with honest `sizes`, intrinsic width and
 * height so the box is right before a byte arrives, and the shot's own blurred
 * thumbnail over its average colour holding that box until it does. clicking opens
 * the viewer; without javascript (or with a modifier key) it is a plain link to the
 * full image.
 */
export function ShowcaseImage({
    shots,
    index = 0,
    sizes,
    priority = false,
    showCaption = true,
    className,
}: Props) {
    const openShot = useLightbox();
    const shot = shots[index];
    if (!shot) return null;
    const { image } = shot;

    const frameStyle: FrameStyle = {
        "--shot-color": image.color,
        "--shot-placeholder": `url("${image.placeholder}")`,
    };

    return (
        <figure className={className ? `shot ${className}` : "shot"}>
            <a
                href={image.src}
                className="shot-frame"
                style={frameStyle}
                onClick={(event) => {
                    if (
                        !openShot ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                    )
                        return;
                    event.preventDefault();
                    openShot(shots, index);
                }}
            >
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes={sizes}
                    width={image.width}
                    height={image.height}
                    alt={shot.alt}
                    loading={priority ? "eager" : "lazy"}
                    fetchPriority={priority ? "high" : undefined}
                    decoding="async"
                />
                <span className="shot-hint">
                    {shots.length > 1 ? `enlarge · ${shots.length} shots` : "enlarge"}
                </span>
            </a>
            {showCaption && shot.caption ? <figcaption>{shot.caption}</figcaption> : null}
        </figure>
    );
}
