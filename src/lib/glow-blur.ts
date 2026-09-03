/**
 * the dark-mode glow, computed on the cpu at grid resolution.
 *
 * a box blur run twice per axis, which is a close match for a gaussian of
 * sigma = radius. it works in premultiplied space so the transparent
 * surroundings don't drag colours toward black, and it bakes in the saturation
 * boost and the opacity the css used to apply, so the glow canvas needs no
 * css filter and no opacity at all. that matters: firefox runs canvas filters
 * in software, and with hardware acceleration off (a common linux state) every
 * css filter on an element that changes each frame is a full-surface pass per
 * frame, measured at 45fps against 110fps without it on a 2560px dark hero.
 */
export type GlowBlur = {
    /** blur `src` rgba bytes (width × height) into `dst`; both non-premultiplied */
    (src: Uint8ClampedArray, dst: Uint8ClampedArray): void;
};

export type GlowOptions = {
    /** blur radius in cells; the result approximates a gaussian of this sigma */
    radius: number;
    /** css `saturate()` amount to bake in, 1 leaves colours alone */
    saturate?: number;
    /** overall alpha multiplier, 1 leaves it alone */
    alpha?: number;
};

export function createGlowBlur(width: number, height: number, opts: GlowOptions): GlowBlur {
    const { radius, saturate = 1, alpha = 1 } = opts;
    const n = width * height;
    // premultiplied working buffers, ping-ponged between passes
    let a = new Float32Array(n * 4);
    let b = new Float32Array(n * 4);
    const window = radius * 2 + 1;

    // the w3c saturate() colour matrix
    const s = saturate;
    const m00 = 0.213 + 0.787 * s;
    const m01 = 0.715 - 0.715 * s;
    const m02 = 0.072 - 0.072 * s;
    const m10 = 0.213 - 0.213 * s;
    const m11 = 0.715 + 0.285 * s;
    const m12 = 0.072 - 0.072 * s;
    const m20 = 0.213 - 0.213 * s;
    const m21 = 0.715 - 0.715 * s;
    const m22 = 0.072 + 0.928 * s;

    /** one box pass along one axis, zero-padded so the glow fades at the edges */
    const pass = (src: Float32Array, dst: Float32Array, lines: number, len: number, lineStride: number, step: number) => {
        for (let line = 0; line < lines; line++) {
            const base = line * lineStride;
            for (let c = 0; c < 4; c++) {
                let sum = 0;
                for (let k = 0; k < radius && k < len; k++) sum += src[base + k * step + c];
                for (let i = 0; i < len; i++) {
                    const lead = i + radius;
                    if (lead < len) sum += src[base + lead * step + c];
                    dst[base + i * step + c] = sum / window;
                    const trail = i - radius;
                    if (trail >= 0) sum -= src[base + trail * step + c];
                }
            }
        }
    };

    return (src, dst) => {
        // straight rgba bytes -> saturated, premultiplied floats
        for (let i = 0, p = 0; i < n; i++, p += 4) {
            const al = src[p + 3];
            if (al === 0) {
                a[p] = a[p + 1] = a[p + 2] = a[p + 3] = 0;
                continue;
            }
            const r = src[p];
            const g = src[p + 1];
            const bl = src[p + 2];
            const f = (al / 255) * alpha;
            a[p] = (m00 * r + m01 * g + m02 * bl) * f;
            a[p + 1] = (m10 * r + m11 * g + m12 * bl) * f;
            a[p + 2] = (m20 * r + m21 * g + m22 * bl) * f;
            a[p + 3] = al * alpha;
        }
        for (let rep = 0; rep < 2; rep++) {
            pass(a, b, height, width, width * 4, 4); // rows
            pass(b, a, width, height, 4, width * 4); // columns
        }
        // back to straight alpha bytes
        for (let i = 0, p = 0; i < n; i++, p += 4) {
            const al = a[p + 3];
            if (al < 0.5) {
                dst[p] = dst[p + 1] = dst[p + 2] = dst[p + 3] = 0;
                continue;
            }
            const inv = 255 / al;
            dst[p] = a[p] * inv;
            dst[p + 1] = a[p + 1] * inv;
            dst[p + 2] = a[p + 2] * inv;
            dst[p + 3] = al;
        }
    };
}
