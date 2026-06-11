# Design

## Theme

Raspberry on white, with a night mode. Light: a toy on a clean desk, pure white surface, candy-colored sand grains as the only imagery, a pixel sun in the canvas sky. Dark ("lights off"): near-black, the same grains turned luminous with a blurred glow pass, stars and a pixel moon. The theme toggle is part of the toy: it swaps sun for moon inside the hero canvas.

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

Dark theme overrides live under `:root[data-theme='dark']`: bg `oklch(0.13 0.01 357)`, ink flips near-white, `--rasp-deep` lightens to `oklch(0.74 0.17 357)` for contrast on dark. Theme is set pre-paint by an inline head script (localStorage `theme`, falls back to `prefers-color-scheme`); `<html>` needs `suppressHydrationWarning`.

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

- **sand-hero**: full-bleed canvas band (`clamp(380px, 62vh, 640px)`), falling-sand engine, "mike" stamped in raspberry+amber sand, frozen until first pointer move, then crumbles. Material chips (raspberry / amber / water / wall / erase) + reset, solid white chip bar with 1px ink border, bottom-left. Mono hint "touch the sand" until woken.
- **project rows**: NOT cards. Full-width rows separated by 1px hairlines, asymmetric 2fr/3fr grid: big lowercase name link + mono stack left, specific prose right. Stacks to one column under 720px.
- **interlude band**: surface-tinted full-width strip, one centered sentence about the day job.
- **footer**: raspberry-drenched, white text, big "say hi", direct links, colophon in mono.

## Layout

- Container `min(100% - 3rem, 68rem)`.
- Fluid section spacing `clamp(3.5rem, 9vw, 7rem)`; tighter inside groupings.
- No nav bar (single page), no scroll-reveal animations: the sand toy is the motion budget, micro-interactions only elsewhere (link arrows translate, underline offsets).

## Motion

- The simulation is the centerpiece motion; runs only after user touch, pauses off-screen via IntersectionObserver.
- `prefers-reduced-motion`: simulation never runs; clicking stamps sand statically.
- Micro-interactions: 160–220ms, ease-out only.
