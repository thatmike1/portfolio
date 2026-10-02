/**
 * one screenshot as scripts/showcase-images.mjs ships it: a webp ladder, its intrinsic
 * size, and what holds its place until the pixels arrive
 */
export type ResponsiveImage = {
    /** the top rung of the ladder: what a plain link opens and the lightbox shows at actual size */
    src: string;
    /** intrinsic pixel size of `src` */
    width: number;
    height: number;
    /** every rung, as `path 480w, path 800w, …` */
    srcSet: string;
    /** a ~24px blurred webp of the shot itself, inlined as a data uri */
    placeholder: string;
    /** the shot's average colour, painted under the placeholder */
    color: string;
};

/** a screenshot with the words that go with it, wherever it shows: page, /hire, viewer */
export type Shot = {
    image: ResponsiveImage;
    alt: string;
    caption?: string;
};
