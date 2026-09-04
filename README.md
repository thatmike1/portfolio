# portfolio

personal site for [thatmike1](https://github.com/thatmike1). the hero is a tiny falling-sand toy (an homage to [powder-lab](https://github.com/thatmike1/powder-lab)) with "mike" written in raspberry sand; touch it and it crumbles.

## stack

- [TanStack Start](https://tanstack.com/start) (react, ssr, file-based routing)
- hand-written css, no ui library
- sora variable + martian mono variable via fontsource

## dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build into dist/
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
- `src/routes/index.tsx` — the whole page
- `src/styles.css` — design tokens + all styling
- `PRODUCT.md` / `DESIGN.md` — design system context
