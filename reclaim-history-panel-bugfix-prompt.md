# Prompt: Fix overflow bug + restyle the "Detailed Site History" panel

## Context
This is a **third distinct UI surface** in the Reclaim extension (separate from both the toolbar popup and the top-right 30-second on-page popup already restyled). This one is a taller panel that shows a **detailed, expanded summary per visited website** (bullet points describing what the site is, what it does, and DPDP/privacy notes), stacked in reverse-chronological order with timestamps. It appears to be triggered from — or be an expanded state of — the "Recent Website Activity" list.

**First step: locate this component.** Search for the component/file responsible for rendering per-site "summary" bullet content (look for text like "Loading summary...", or logic that fetches/generates a description per domain). Confirm whether this is:
(a) a genuinely separate component/file from the other two popups, or
(b) an expanded/scrolled state of one of them that isn't being constrained correctly.
Report which it is.

## Bug #1 (functional, higher priority than styling): panel overflow makes it inaccessible
Currently, as more site summaries load/stack, the panel grows taller than the viewport and pushes downward off-screen, becoming completely inaccessible — the user can't scroll back up to reach the header, close button, or the "Open Privacy Dashboard" button/footer.

Fix required:
- The panel's outer container must have a **fixed maximum height** (e.g. `max-height: 90vh` or constrained to the visible viewport minus a small margin) and its own **internal scroll** (`overflow-y: auto`) for the list of site summaries, rather than letting the whole panel grow unbounded and push past the screen edge.
- The panel's position should stay **fixed/sticky** relative to the viewport (e.g. `position: fixed; top: ...; right: ...`) so it never scrolls away with the host page's content — right now it seems to be flowing with page scroll/content growth instead of staying anchored.
- The header (RECLAIM branding) and footer (disclaimer) should remain visible/pinned at all times; only the middle "site summaries" list should scroll internally.
- Test with many stacked site summaries (10+) to confirm the panel never exceeds the viewport and remains fully interactive (scrollable, closeable) at all times.

## Bug #2 (styling): beige theme not applied here
Same as the other two surfaces, this panel is still using the old blue/dark theme. Apply the same shared palette used across the dashboard, toolbar popup, and on-page popup:
- Primary accent (links, borders, buttons): `#8a7a5c`
- Accent hover/darker: `#6b5b3a`
- Light accent background: `#EFE8DA`
- Card/panel background: `#ffffff`
- Section background: `#F7F5EF`
- Borders/hairlines: `#e5e0d3` (replace the current blue-bordered site summary cards with this)
- Muted/secondary text: `#6b6a64`
- Placeholder/tertiary text: `#9a9890`
- Footer disclaimer text: keep neutral gray, no change
- Do not change semantic colors (if any status/badge exists here) — only brand/neutral chrome

## Constraints
- Do not change what data is shown or how summaries are generated/loaded — this is a layout + styling fix only.
- Confirm this fix doesn't regress the other two already-restyled popups (toolbar popup, on-page 30-second popup) — check all three still render correctly and are visually consistent after this change.
- If this panel shares a component/file with either of the other two popups, consolidate the fix there rather than patching duplicated code in multiple places, and note that in your summary.

## Deliverable
1. Report which file/component this panel lives in, and whether it was shared with or separate from the other popups.
2. Fix the overflow/scroll bug so the panel is always fully accessible regardless of content length.
3. Apply the beige theme to match the rest of the product.
4. List all files modified.
