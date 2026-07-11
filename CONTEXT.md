# Space Portfolio

Bruce Cheng's personal portfolio site. Being redesigned from a VSCode-editor theme to a space / black-hole theme: simple, premium, motion-driven. (Redesign decided 2026-07-10.)

## Language

**Hero**:
The pinned first act of the page — the 3D black-hole scene, camera scrubbed by scroll in three acts: approach (deep space → near framing, name fades in), settle, and the **Dive-Exit** — a sideways spiral into a decaying orbit whose horizon blackout hands off to the Content Sections. Fully reversible by scrolling back.
_Avoid_: intro, landing, splash

**Dive-Exit**:
The scroll-scrubbed spiral (added 2026-07-10) that replaces any seam decoration between Hero and content: lateral glide → tightening orbit → gravitational dimming → blackout. Distinct from the deleted autoplay dive-to-C64.

**Content Sections**:
The scrollable portfolio sections below the Hero — all six survive the redesign: About, Experience, Work, Stack, Life, Contact. "Simple/premium" is achieved through visual density and typography, not by cutting sections.
_Avoid_: vsc-content, editor panes

**Top Bar**:
The site's only navigation — a minimal bar (monogram left, small-caps section links + Resume right), transparent over the Hero, gaining a dark backdrop after scroll. Revives the dormant `Nav.tsx` active-tracking logic. Replaces VSCodeLayout's tab/activity bars.
_Avoid_: tab bar, activity bar

**Wedding Page**:
The `app/wedding` photo-gallery subpage. Out of scope for the space redesign; keeps its current look.

**Space Theme**:
The new site-wide visual language, editorial-elegant: near-black background, dim-gold accents (accretion disk), blazing-white display-serif headings (photon ring), restrained sans body, generous whitespace, hairline gold dividers — no boxes, no cards, no HUD decoration. Typography: Fraunces (display) + Inter (body). Replaces the VSCode theme entirely.

**Motion Vocabulary**:
The approved set of dynamic effects in the Content Sections: per-section fade-up reveals with gold hairline draws (each section owns its own reveal), animated stat counters, a gold-dot custom cursor, and a 2–3 layer transform-only parallax CSS starfield. Motion serves reading rhythm; nothing steals the show.

**VSCode Theme (deprecated)**:
The old editor-chrome look (`VSCodeLayout`, `vsc-*` classes, C64 terminal metaphor). Being removed, not restyled.

**Loader**:
The first-load gate — pure-black screen, serif name, hairline gold progress bar bound to the real glb download progress; fades out when the Hero scene is ready. Replaces PixelLoader's pixel aesthetic but reuses the LoaderContext mechanism.
_Avoid_: pixel loader, splash screen

## Relationships

- The page is one long scroll: **Loader** → **Hero** → **Content Sections**.
- The **Hero** owns the 3D canvas; when it leaves the viewport the render loop **pauses** (resumes on re-entry). The **Content Sections** sit on a static CSS starfield — no WebGL below the Hero.
- Every **Content Section** uses the **Space Theme**; none keep VSCode chrome.
- The **Top Bar** is transparent over the **Hero** and gains a dark backdrop once scrolled into the **Content Sections**.

- On phones the **Hero** stays real 3D but downgraded (pixelRatio ~1.3, reduced bloom, halved stars) with a portrait-specific camera framing (hole above, name below) via `gsap.matchMedia`; a static poster is the fallback for reduced-motion / WebGL failure only.

## Example dialogue

> **Dev:** "Does the black-hole canvas keep rendering while I read the **Work** section?"
> **Bruce:** "No — the **Hero** is pinned and scroll-scrubbed, but once you're past it the scene fades down; the **Content Sections** just sit on a dark starfield."

## Flagged ambiguities

- "intro" previously meant the whole `SpaceIntro` experience including the dive and C64 terminal scenes — resolved (2026-07-10): the dive and C64 scenes are **deleted** (recoverable from git history); the black-hole scene alone is the **Hero** of the single-page portfolio.
