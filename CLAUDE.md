# OA-Tech — website build brief

This file is the design and engineering brief for building the OA-Tech site.
Read it in full before writing any code. It encodes real decisions, not
suggestions — follow it exactly unless something is technically impossible,
in which case flag the conflict before improvising a substitute.

## What this site is

A living research archive for OA-Tech — one maker's independent projects
across electrical, mechanical, and software engineering, framed as craft
and admiration rather than as a product catalog. It currently functions as
a personal portfolio / resume-in-the-meantime, and is designed to grow into
the public face of an R&D company. Treat every project as a piece of work
being exhibited, not a product being sold.

Core philosophy, in the owner's own words: **effortlessness and flow.**
Information should arrive exactly when the visitor is ready for it —
never before, never behind a click they have to go hunting for. The scroll
itself is the navigation. Nothing is out of place; if something stands out,
it is standing out on purpose, to draw attention to a specific project or
moment. Calm rhythm is the baseline; a deliberate break in that rhythm is
the reward for staying engaged.

The second core idea: **one maker, endless fields.** An EE can work in
mechanical design, software, whatever the project calls for — the throughline
is passion, not category. This should show up structurally, not just as a
bio sentence: prefer connecting projects by idea lineage ("this thermal
problem led into this enclosure material choice") over sorting them into
rigid discipline buckets.

## Visual identity

### Color

Primary palette (use as-is, do not substitute a warm/cream palette):

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#f3f2fd` | Page background (light mode) |
| `--surface` | `#e6e4fb` | Cards, panels |
| `--muted-accent` | `#ceccf8` | Dividers, quiet trace line, inactive states |
| `--accent` | `#afafe7` | Active accent — links, specs, the via markers, "something happened" color |
| `--ink` | `#130f34` | Text in light mode; background in dark mode |

Dark mode is the same five colors read in reverse (`--ink` becomes the page
background, `--bg` becomes the text color). Frame this as one continuous
palette, not two separate themes — conceptually it's "day work / night
work," which fits a nightlight / blue-light-filter feeling.

Default to dark mode on load if you can determine it's a reasonable default
(e.g. respect `prefers-color-scheme`, but let dark be the implied "home"
mode conceptually). Provide an explicit, easy-to-find toggle either way.

### Typography

Three roles, strictly separated — never mix which role appears where:

1. **Display / headlines — Unbounded (bold, 700+).** Project titles and
   the hero headline are the loudest thing on the page. Do not be shy
   with size or weight here. Everything else on the page should be quiet
   *specifically so the headline can be loud* — that contrast is the point.
   (Note for later: Fraunces in italic, wonky/non-optical-sized, is a
   candidate for a future "featured project" or seasonal variant — not
   for this build, but leave the type system easy to extend.)
2. **Body — a quiet grotesk sans (Space Grotesk or similar).** Never bold,
   never competes with the headline. Line height ~1.7, restrained size.
3. **Technical / mono — JetBrains Mono or IBM Plex Mono.** Used only for
   "documentation" data: eyebrows above headlines, spec rows (revision,
   year, discipline tags), dates, part numbers, coordinates. This is the
   engineering half of the "artist and engineer" duality — never use mono
   for prose, never use body sans for specs.

### Signature element — the trace line

A thin line (the "trace") runs down the page like a PCB trace, physically
threading every project together — the visual expression of "one maker,
endless fields" and of idea lineage between projects.

- Baseline state: thin (~4px), `--muted-accent`, calm, unobtrusive, runs
  continuously through normal scroll content.
- At a genuine project transition or a moment worth emphasizing: this is
  where rhythm breaks. The trace can widen, pulse to `--accent`, or fork
  into a branch. Use this break sparingly — it only reads as intentional
  if the baseline stays calm ~90% of the time. Do not break rhythm on
  every section; reserve it for real transitions.
- **Vias as bullet points.** Anywhere a bulleted list sits along or near
  the trace (spec lists, feature lists, a project's key facts), render
  the bullet markers as vias — small filled circles with a thin ring,
  in `--accent`, visually continuous with the trace line itself rather
  than a generic `<li>` dot. This should feel literal: like the trace
  is a copper path and each list item is a via drilled into it.
- Decide early whether the trace is a straight, gallery-quiet rule, or
  literally bends/branches like real PCB routing at transitions. Prefer
  attempting the literal, bending version first — it is bolder and more
  distinctive, and easier to simplify later than to add boldness after
  the fact.

### Images

Every project section needs a designated image slot — real board photos,
renders, or process shots the owner will supply. Build the layout assuming
real photography will be dropped in (proper aspect-ratio containers,
no low-res placeholder aesthetic baked into the design). Where no image
exists yet, use a clean, minimal placeholder in `--surface` with a subtle
border — never a gray box with a broken-image icon.

## The centerpiece: 3D + scroll

This is the most important interactive feature of the site and should be
treated as a first-class build task, not an add-on.

- Each project that has a 3D model (STL → convert to glTF/GLB for the
  web) gets a **scroll-driven 3D viewer**: as the visitor scrolls through
  that project's section, the camera orbits, parts explode apart to show
  assembly/layers, and callouts can appear at specific scroll positions
  to label components. This is the "cutting edge" moment of the site —
  it should feel considered and a little impressive, not gimmicky.
- Stack: **Three.js** (or React Three Fiber if the codebase is React) for
  rendering, tied to scroll progress via **GSAP ScrollTrigger** (or a
  comparably reliable scroll-linked animation approach). Keep the same
  motion language (easing, pacing) as the rest of the site's scroll
  animations so the 3D moment feels like part of the same rhythm, with
  its own break in that rhythm where it matters (see trace-line section).
- Performance matters: lazy-load 3D assets per section (don't load every
  project's model on page load), and provide a lightweight fallback
  (static image or simple rotation) on low-power devices rather than
  forcing a heavy render everywhere.
- Respect `prefers-reduced-motion`: provide a non-animated fallback path
  that still conveys the project (static images, no scroll-hijacking)
  for visitors who need it.

## Structure / interaction notes

- No traditional nav-menu-hunting. The scroll order should be authored
  deliberately per project so each section answers the question the
  previous one raised — sequence curiosity, don't just list facts.
- Prefer connecting projects laterally (by idea/discipline lineage) over
  a flat chronological or category grid, in keeping with the "one maker,
  endless fields" idea — though a chronological thread (highschool →
  college → present) can run underneath as a subtle secondary structure,
  since this archive is also implicitly a growth narrative.
- Keep copy plain, specific, and in the owner's voice — first person,
  active voice, no corporate/marketing tone. This is a craft archive,
  not a sales page.
- Motion elsewhere on the site (not the 3D viewer) should be restrained:
  calm scroll-reveals, no scattered decorative animation. Save the
  "impressive" budget for the 3D moments and the trace-line rhythm break,
  not for every element having its own entrance animation.

## Explicitly avoid

- Warm cream/off-white background with a terracotta or clay accent —
  this is the most common AI-generated-site default right now and is
  the opposite of the rare, considered palette this project has chosen.
- Numbered step markers (01 / 02 / 03) unless the content is a genuine
  ordered sequence.
- Generic gray placeholder-with-broken-icon image boxes.
- Nav menus, hamburger icons, or anything that asks the visitor to go
  looking for information instead of receiving it through scroll.

## After the site is built

Once the working site is in a good state locally, initialize and push
the repo with:

```
echo "# OA-Tech" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Ingenieria-Olvera/OA-Tech.git
git push -u origin main
```

Do not run this until the owner confirms the site is ready to push —
treat it as a final step, not something to run automatically mid-build.
