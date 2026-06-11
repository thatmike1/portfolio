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
- `src/components/sand-hero.tsx` — canvas, pointer input, material toolbar
- `src/routes/index.tsx` — the whole page
- `src/styles.css` — design tokens + all styling
- `PRODUCT.md` / `DESIGN.md` — design system context
