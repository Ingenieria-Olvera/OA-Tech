# OA-Tech

A living research archive — one maker's independent projects across
electrical, mechanical, and software engineering. Built as a single authored
scroll: the trace line is the navigation, and information arrives when the
reader is ready for it.

## Running it

```
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Content

The projects on the page are real (ClearNote, CircuitHub production work,
Gig-E ↔ CAN FD, Project Parrot, plus the earlier-work archive), written from
the owner's project notes. Photos are still placeholder slots, and the 3D
viewer uses placeholder geometry until the real ClearNote CAD is exported.
To edit in `index.html`:

- **Copy** — each `<section class="project">` holds the prose. Keep it first
  person and specific; each section's closing `.lineage` paragraph is the
  hand-off that connects one project to the next. That lineage chain is the
  spine of the whole site — rewrite it whenever the project order changes.
- **Photos** — every `.media__ph` div is an image slot. Swap it for
  `<img src="..." alt="...">` inside the same `<figure class="media">`;
  the aspect-ratio container and caption styling carry over.
- **Specs** — the `ul.vias` lists render bullets as PCB vias. Wrap part
  numbers / values in `<span class="mono">` so they read as documentation.
- **Organizations & sponsors** — the chips under each project title
  (`.org-chip`) carry attribution: `.org-chip--org` (accent border) for a
  company/club the work was done with, plain for independent work, and
  `.org-chip--slot` (dashed) marks a reserved slot for a future sponsorship
  (e.g. PCBWay/JLCPCB on ClearNote — swap the slot chip for a real
  `.org-chip--org` chip once a sponsorship is actually confirmed).
- **3D model** — see `public/models/README.txt` for dropping the real
  ClearNote GLB into the scroll-driven exploded viewer.

## How it's built

- **Vite** (vanilla JS, no framework), **Three.js** for the featured 3D
  moment, **GSAP ScrollTrigger** for all scroll-linked motion.
- `src/js/trace.js` — the PCB trace: routed with 45° bends through anchor
  points in the markup, with an accent "current" that follows the reader
  and via markers that light as it passes.
- `src/js/viewer.js` — the pinned, scroll-scrubbed exploded assembly.
  Lazy-loaded; falls back to a static render for `prefers-reduced-motion`
  and low-power devices, and to a styled placeholder without WebGL.
- **Palette** — five colors, one palette, two readings: day work (light)
  and night work (dark). Dark-mode surfaces are alpha blends of the same
  five colors, never new hues. Type roles are strict: Unbounded for
  display, Space Grotesk for prose, JetBrains Mono for documentation data
  only.

## Deploying to GitHub Pages

`vite.config.js` uses relative asset paths, so the `dist/` output works on a
project site with no extra config. Either publish `dist/` with a
`gh-pages`-style action, or use GitHub's "Deploy from a branch" pointed at a
committed build.
