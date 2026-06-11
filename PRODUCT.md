# Product

## Register

brand

## Users

Whoever lands on Mike's personal link: other devs, potential freelance collaborators, friends. They're here out of curiosity, not to evaluate a CV. The job to be done is "get who this guy is in 30 seconds and leave grinning."

## Product Purpose

Michal "Mike" Pšenčík's personal site (github.com/thatmike1). Explicitly NOT a job-hunting portfolio and not a client pitch. The brief in his own words: "this is me and i make cool shit and i like doing it." Success = a visitor plays with the page, reads two project blurbs, and remembers the site.

## Brand Personality

Hand-built, playful, stubborn. The voice is his actual GitHub bio: "i do stuff, sometimes it works and sometimes it doesn't, but give me enough time and i'll make it work. probably haha." All-lowercase copy (matches his commit style and bio), honest to a fault (an abandoned project is labeled abandoned), specifics over adjectives.

## Anti-references

- Dark terminal-themed dev portfolios (matrix green, monospace everything, fake CLI)
- CV-shaped portfolios: skills bars, "passionate about clean code," testimonial carousels
- Template identical-card project grids with icon + title + description
- Corporate SaaS landing language of any kind

## Design Principles

1. **Practice what you preach.** The site itself must be a "cool thing he made": the hero is a working falling-sand toy, an homage to his own powder-lab.
2. **His words, not marketing words.** Copy is lowercase, first-person, concrete. Real numbers, real tricks ("the noita trick"), real admissions.
3. **One loud color, used with commitment.** Raspberry on pure white. Not a safe dev-blue, not a dark theme.
4. **Specifics are the flex.** Every project blurb names one genuinely clever implementation detail instead of three adjectives.
5. **Honesty included.** Day-job work is NDA-bound, so it's described without names. Abandoned projects say so.

## Accessibility & Inclusion

- WCAG AA contrast minimum everywhere (body ≥4.5:1)
- The sand toy is decorative: real heading/text content exists in HTML, canvas has an aria-label, all info is readable without JS or pointer
- Full prefers-reduced-motion alternative: the simulation stays frozen, no autonomous animation
- Touch scrolling must not be hijacked by the canvas (touch-action: pan-y)
