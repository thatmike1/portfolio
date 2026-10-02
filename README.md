# portfolio

personal site for [thatmike1](https://github.com/thatmike1). the hero is a tiny falling-sand toy (an homage to [powder-lab](https://github.com/thatmike1/powder-lab)) with "mike" written in raspberry sand; touch it and it crumbles.

live at [thatmike1.dev](https://thatmike1.dev). the previous `thatmike1.portfolio.ssscribe.app` address permanently redirects here, including `/hire` and other paths.

## stack

- [TanStack Start](https://tanstack.com/start) (react, ssr, file-based routing)
- hand-written css, no ui library
- sora variable + martian mono variable via fontsource

## dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build into .output/
npm test         # vitest
npm run images -- <masters-dir>   # rebuild public/showcase/ and its manifest from master screenshots
npm run facts    # re-read the board's numbers off the projects (src/lib/board-facts.json)
```

## structure

- `src/lib/sand-engine.ts` — the cellular automaton (pure ts, no react)
- `src/components/weather-hero.tsx` — canvas, weather sim, pointer input, material toolbar, theme looks
- `src/lib/theme.ts` — the three themes (light / dusk / dark), read + apply
- `src/lib/flock.ts` — the birds: a boids-lite flock that flies, perches on the word, and leaves at night
- `src/lib/moss.ts` — the living layer: seeds fall, take on rain-soaked sand, and moss spreads over the letters
- `src/lib/fireflies.ts` — fireflies that come out over the moss at night, each on its own blink
- `src/lib/snail.ts` — a snail that turns up for the moss, crawls the letters and grazes it back to sand
- `src/lib/frost.ts` — snow and ice: flakes drift down and cap the word, freeze the lake, and the noon sun melts them
- `src/lib/fish.ts` — fish for the lake: they arrive with the water, cruise the basin and now and then one leaps
- `src/lib/frog.ts` — a frog that comes for the fireflies, sits on a letter and snaps them with its tongue
- `src/routes/index.tsx` — the homepage: the masthead under the sky, then the board; `src/routes/hire.tsx` — the recruiter page
- `src/components/board.tsx` — the shelves and tiles; `sky-report.tsx` — the sky column; `pixel-charts.tsx` — the grain charts
- `src/components/minis/` — the four try-it toys, each its own lazy chunk
- `scripts/board-facts.mjs` — reads every number the board states off the projects, dated
- `src/lib/showcase.ts` — every project fact both pages show
- `scripts/showcase-images.mjs` — master screenshots in, webp ladder + `src/lib/showcase-images-generated.ts` out; commit both
- `src/components/showcase-image.tsx`, `src/components/lightbox.tsx` — a screenshot on the page, and the viewer it opens
- `src/styles.css` — design tokens + global styling; components carry their own css
- `PRODUCT.md` / `DESIGN.md` — design system context
