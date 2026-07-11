# Replace the VSCode theme with a single-page space portfolio

The portfolio was styled as a VSCode editor (VSCodeLayout chrome, C64-terminal narrative). On 2026-07-10 Bruce decided the whole site adopts the black-hole space theme instead: one long scroll page — minimal space Loader → pinned scroll-scrubbed black-hole Hero → editorial-elegant Content Sections on a CSS starfield — because the VSCode metaphor no longer matched the "simple, premium, intuitive" goal and recruiters should reach Work/Contact without passing through a narrative animation.

## Consequences

- The dive animation and C64 terminal scene (scene 2 of `SpaceIntro.tsx`, `public/models/commodore_64.glb`) are **deleted**, not parked — their narrative premise (a computer inside the singularity leading into an editor theme) died with the VSCode theme. Considerable tuning effort went into them; recover from git history (`space_intro` branch, commits ≤ f19efb3) if ever needed. (Later the same day a different, scroll-scrubbed spiral **dive-exit** was added inside the hero as the transition into the page — it shares nothing with the deleted autoplay dive.)
- Content sections are restyled in place (they already use neutral semantic classes); VSCode chrome lives almost entirely in `VSCodeLayout.tsx` + `app/globals.css` and is removed, not restyled.
- Below the Hero there is deliberately **no WebGL**: the hero render loop pauses off-viewport and sections sit on a static CSS starfield. A persistent WebGL background was rejected for GPU/battery cost on a long page.
- Rollout is skeleton-first: one pass swaps theme layer + TopBar + Loader and deletes scene 2, then sections are polished one at a time — the page is self-consistent at every step.
