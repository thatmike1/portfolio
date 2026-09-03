# Design

## Theme

Raspberry on white, with three times of day. The hero is a pixel weather sim (cloud deck, rain, lake, falls) and the theme picker is its sky: **noon** (`light`) is a toy on a clean desk, pure white page, blue sky, pixel sun. **dusk** is the in-between: peach-to-plum sky, warm ambient light on the grains, and a dark warm page (plum-brown, not black) so it reads as dim, not night. **night** (`dark`) is near-black, navy sky, crescent moon, stars, the grains moonlit rather than luminous. Picking a look pours a puff of that look's dust from under the button and wakes the sand, so the theme switch is a move in the toy, not a settings change. The lab's `/lab/weather` is the same component with the soak tool and drop counter left on.

Raspberry is the accent, not a flood: links, grains, selection, small fills. The footer is an ink block, NOT a raspberry drench (tried it, Mike vetoed the wall of raspberry; the color works grainy, not flat).

## Color palette (OKLCH only)

| Token | Value | Use |
|---|---|---|
| `--bg` | `oklch(1 0 0)` | page background, pure white, no hidden warmth |
| `--surface` | `oklch(0.955 0.008 357)` | interlude bands, chip bar |
| `--ink` | `oklch(0.18 0.015 357)` | body text, headings (≥13:1 on bg) |
| `--muted` | `oklch(0.45 0.02 357)` | secondary text (≥7:1 on bg) |
| `--rasp` | `oklch(0.55 0.21 357)` | brand fills, selection. White text on it |
| `--rasp-deep` | `oklch(0.49 0.2 357)` | link text on white (≥5:1) |
| `--accent` | `oklch(0.42 0.15 265)` | indigo, rare: water chip, small details |
| `--footer-bg` / `--footer-ink` | ink block / near-white | footer is dark in both themes |

Dark theme overrides live under `:root[data-theme='dark']`: bg `oklch(0.13 0.01 357)`, ink flips near-white, `--rasp-deep` lightens to `oklch(0.74 0.17 357)` for contrast on dark. Dusk lives under `:root[data-theme='dusk']` and is a dark theme with the hue pulled warm: bg `oklch(0.31 0.04 25)`, surface `oklch(0.36 0.04 25)`, ink `oklch(0.95 0.018 70)` (11.5:1), muted `oklch(0.78 0.03 55)` (6.6:1), `--rasp-deep` `oklch(0.8 0.15 5)` (6.7:1); `--rasp` stays a fill colour, never text. Selectors that mean "not the white page" match both: `:root:is([data-theme='dark'], [data-theme='dusk'])`. `src/lib/theme.ts` owns the `Theme` union, read/apply, and `paletteFor()` which maps dusk onto the dark sand palette. Theme is set pre-paint by an inline head script (localStorage `theme`, falls back to `prefers-color-scheme`); `<html>` needs `suppressHydrationWarning`.

Strategy: **Committed via the sand.** Raspberry carries identity through the hero word/dunes and links. No gradients anywhere. No flat raspberry surfaces.

Canvas sand palettes (grain shades, oklch strings fed to canvas):
- raspberry sand: L 0.54–0.66, C ~0.21, H 357
- amber sand: L 0.72–0.82, C ~0.14, H 75
- water: L 0.60–0.68, C ~0.13, H 250
- wall/ink grains: L 0.2–0.3, C 0.01, H 357

## Typography

- **Sora Variable** (100–800) for everything: display at 800 with -0.03em tracking, body at 400. Single family with hard weight contrast is the system. (Easter egg: Sora is also his dog's name; the footer says so.)
- **Martian Mono Variable** for tiny metadata only: stack lists, toolbar labels, the colophon. Never for body copy.
- Scale: h1 `clamp(2.6rem, 6.5vw, 5rem)`, h2 `clamp(1.9rem, 4.5vw, 3.1rem)`, project names `clamp(1.7rem, 3.2vw, 2.5rem)`, body `1.0625rem/1.65`.
- All copy is lowercase by design (brand voice), including headings.
- `text-wrap: balance` on headings, `pretty` on prose. Body max 62ch.

## Components

- **weather-hero**: full-bleed canvas band (`clamp(380px, 62vh, 640px)`), falling-sand engine under a pixel weather sim. "mike" stamped in raspberry+amber sand on a rock island in a lake. The word is kinetic sand: every grain is packed (a flag bit the automaton never moves) so hovering does nothing to it, the brush digs it loose in a ring around the pour, and a grain whose support is dug out lets go, so an undermined letter collapses upward the way sand does instead of floating. Rain erodes it: a drop landing on the word has an 8% chance to wash the grain under it off to an adjacent air cell, a puddle sitting on it 0.04% per tick, so edges nibble first and dunes form at the letters' feet. Water standing over sand (packed, or the loose grains washed into the crook of the k) drinks away at 0.6% per cell per tick, so a downpour leaves a wet crook and not a lake; only water over the rock floor is the lake. The erosion odds scale with the word's height so a phone's small word weathers at about the same pace. Pace at desktop: roughly a quarter of the word gone after three minutes of weather. Birds: a small flock (`src/lib/flock.ts`), six at noon, three at dusk, none at night, fewer under heavy cloud, drawn last as three- or five-cell silhouettes with a four-frame wing cycle and the odd glide. Now and then one lands on a letter (at most two sitting at once), head bobbing, and takes off at a raindrop, lightning, or the brush coming within twelve cells. Clouds are fbm noise quantised to three tones with a Bayer dither; dense cells rain, rain fills the lake, the lake spills off both ends of the island and falls past the intro copy (water is a conserved budget, so it cycles). Material chips (raspberry / amber / water / rock / cloud / erase) + reset in a pill bottom-left (cloud paints into the deck instead of the sand: a soft disc of density that drifts with the weather, rains through the shower gate on its own, and spends itself with every drop, so a stroke is about a minute of local shower); the three looks in a pill top-right (swatches only under 720px); a mono readout pill bottom-right: "touch the sand" until woken, then humidity and cloud cover (under 720px the readout moves top-left and shows only the nudge until the first touch, then only the numbers). The pills are frosted glass: half-transparent page background over a 14px backdrop blur, hairline edge at 16% ink, a thin highlight along the top, so each look tints them and the clouds smear through. Solid page background where backdrop-filter is unsupported. The island dissolves into the page over its last 12 rows with a two-tone dither whose tones sink toward the page together, so the seam is a texture and never a checkerboard on white. No glow pass: night grains are moonlit by an ambient multiply, not bloomed.
- **project rows**: NOT cards. Full-width rows separated by 1px hairlines, asymmetric 2fr/3fr grid: big lowercase name link + mono stack left, specific prose right. Stacks to one column under 720px.
- **interlude band**: surface-tinted full-width strip, one centered sentence about the day job.
- **footer**: ink block, near-white text, big "say hi", direct links, colophon in mono. Dark in both themes.

## Layout

- Container `min(100% - 3rem, 68rem)`.
- Fluid section spacing `clamp(3.5rem, 9vw, 7rem)`; tighter inside groupings.
- No nav bar (single page), no scroll-reveal animations: the sand toy is the motion budget, micro-interactions only elsewhere (link arrows translate, underline offsets).

## Motion

- The simulation is the centerpiece motion; runs only after user touch, pauses off-screen via IntersectionObserver.
- `prefers-reduced-motion`: simulation never runs; clicking stamps sand statically.
- Micro-interactions: 160–220ms, ease-out only.
