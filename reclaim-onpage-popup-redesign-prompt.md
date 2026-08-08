# Prompt: Restyle the "Reclaim" on-page popup (30-second site-visit notification)

## Context
Separate from the extension's toolbar popup, this project has a **second UI surface**: a floating panel that auto-appears in the top-right corner of the page whenever the user visits a new website, stays visible for ~30 seconds, then disappears. It shows the same information as the toolbar popup (current site status, digital exposure overview, recent activity, "Open Privacy Dashboard" button) but is a **different component** — likely injected via a content script as an overlay/toast rather than the browser action popup. This is why a previous restyle of the toolbar popup did NOT affect this one — they are separate files.

**First step: locate this component specifically.** Search the extension codebase for the content script or injected overlay responsible for this floating panel (look for things like `content-script`, `overlay`, `toast`, `notification`, `injectedPanel`, or a `setTimeout`/30-second auto-dismiss logic tied to page-navigation events). Do not assume it's the same file as the toolbar popup — confirm it's a distinct component before editing, since a prior styling pass on the toolbar popup already missed this one.

## Shared color palette (must match dashboard + toolbar popup — keep in sync across all three surfaces)
- Primary accent (buttons, links, brand elements): `#8a7a5c`
- Accent hover/darker: `#6b5b3a`
- Light accent background (chips, highlighted sections): `#EFE8DA`
- Card/panel background: `#ffffff`
- Section/subtle background: `#F7F5EF`
- Borders/hairlines: `#e5e0d3`
- Muted/secondary text: `#6b6a64`
- Placeholder/tertiary text: `#9a9890`

**Keep semantic status colors unchanged** (same rule as before):
- "Clean" badge: keep green
- "High Risk" number: keep red
- Score pill: keep its current semantic color logic (e.g. green/amber/red by score range) if it has one — only restyle the neutral chrome around it

## Specific elements to update in this popup
1. **Header bar** ("RECLAIM" + shield icon + score pill + close button): currently dark navy — change to the same dark warm tone used in the toolbar popup header (`#6b5b3a`-based), for visual consistency between the two surfaces.
2. **"Current site" card**: white background stays; any blue/purple icon or link accents → `#8a7a5c`. Keep "Clean" badge green.
3. **"Digital Exposure Overview" stat grid**: "Websites" and "Exposures" numbers currently blue → change to `#8a7a5c`. "High Risk" number stays red.
4. **"Open Privacy Dashboard" button**: currently blue → change to `#8a7a5c` background, white text, hover state `#6b5b3a`.
5. **"Recent Website Activity" list**: no color change needed besides ensuring any hover/link states use `#8a7a5c` instead of blue.
6. **Footer disclaimer text**: keep neutral gray, no change.
7. **Panel shadow/border**: keep existing elevation/shadow style, just ensure the border color (if any) is `#e5e0d3` instead of a cooler gray/blue to match the new palette.

## Constraints
- Do not change the 30-second auto-dismiss timing, positioning (top-right), animation/transition behavior, or the close (×) button's function — styling only.
- Do not duplicate styles by copy-pasting from the toolbar popup file — if the two components can share a CSS/theme file or design tokens, consolidate them so future color changes only need to happen in one place. Flag this as a suggestion if the current architecture makes that non-trivial.
- Verify this popup and the toolbar popup end up visually identical in styling (same header tone, same badge colors, same button style) since they show the same data and should feel like the same feature.

## Deliverable
Apply these changes directly to the content-script/overlay popup component, confirm it is indeed a separate file from the toolbar popup (report which file it was), and list all files modified.
