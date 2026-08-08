# Prompt: Redesign PrivacyLens dashboard UI

## Context
This project is a dashboard called "PrivacyLens" (DPDP Shield). I want to redesign the sidebar and dashboard layout to match a specific reference design — a clean SaaS dashboard style ("OrangeFarm") — but with the accent color changed from orange to a warm **beige/tan** palette instead.

Before making changes: inspect the current codebase structure — identify the tech stack (React/Vue/plain HTML), the styling approach (Tailwind config, CSS variables, styled-components, or inline styles), and where global colors/theme tokens are currently defined. Reuse that existing system rather than introducing a new one.

## Target color palette (beige theme)
Replace all current accent/brand colors (currently purple/blue gradient) with this palette:
- Primary accent (active states, highlights): `#8a7a5c`
- Sidebar active item background: `#EFE8DA`
- Sidebar active item text: `#6b5b3a`
- Light card/section background: `#F7F5EF`
- Badge - low risk background: `#E4DCC5` / text `#6b5b3a`
- Badge - medium risk background: `#F0E4C6` / text `#7a5f1f`
- Borders/hairlines: `#e5e0d3`
- Page/card background: `#ffffff` (not gray — keep it white/light, matching current app)
- Muted/secondary text: `#6b6a64`, placeholder text: `#9a9890`
- **Do not** recolor semantic/status colors (e.g. success or trend charts that are currently green, error states that are red) — only the brand/accent purple-blue should become beige. Keep functional color meaning (success=green, warning=amber, danger=red) untouched.

## Layout changes
Restructure the sidebar and dashboard to follow this pattern (adapt to existing components/data, don't invent new features):

1. **Sidebar** (left, ~210-240px wide, white background, right hairline border):
   - Top: logo + product name
   - Search input below logo
   - Nav list: icon + label per item, current/active page gets the beige highlighted pill background (`#EFE8DA`) with rounded corners (~8px), inactive items plain text
   - Bottom: user avatar (initials in beige circle), name, role badge, settings/logout links

2. **Top stat row**: 3-4 metric cards in a horizontal grid, each with a small muted label, a large number/value, and a short caption. Use `#F7F5EF` background, no border, ~8px radius.

3. **Main content grid** below: 2-column layout with cards (white background, thin `#e5e0d3` border, 12px radius, padding ~16px) — e.g. a list/table card (like a customers or connected-sites list, each row with an entity name + a colored risk/status badge) alongside a chart card (line/area chart, keep its color semantic — green for growth/positive trend, not beige).

## Constraints
- Keep all existing functionality, data bindings, routes, and component logic intact — this is a **visual/styling change only**, not a rebuild.
- Match existing responsive breakpoints and accessibility (contrast, focus states) already in the app.
- If the project uses Tailwind, add the beige palette as named tokens in `tailwind.config` (e.g. `beige-50` through `beige-900`) rather than hardcoding hex values inline.
- If the project uses CSS variables, update the root theme variables (e.g. `--accent`, `--accent-bg`, `--accent-text`) rather than editing each component's inline styles.
- After changes, verify no leftover purple/blue/orange accent classes remain unused or conflicting.

## Deliverable
Apply these changes directly to the relevant sidebar, dashboard, and theme/config files in this repo, and list which files were modified.
