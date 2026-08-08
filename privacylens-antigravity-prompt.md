# Prompt for Antigravity — PrivacyLens Glassmorphic Restyle

Copy everything below into Antigravity as your build instruction.

---

This is a **visual restyle only**. Do not add, remove, rename, reorder, or restructure any existing module, component, route, prop, data source, or piece of functionality. Every module currently in the interface (connected sites, active consents, pending requests, footprint grid, request tracker, audit log, nominate guardian, guardian nomination log, etc.) must remain exactly where it is, contain the same content, and behave exactly as it does today. The task is to re-skin the existing markup/components with the visual system below — colors, surfaces, typography, spacing, borders — without touching layout order, information architecture, or logic.

Apply the iOS-style dark glassmorphic design system with an orange + deep slate blue color scheme described below to the existing components. Implement it as CSS/style changes (theme tokens, class updates, inline style updates) layered onto the current component tree — not a rebuild.

## 1. Visual system

**Background**
- Base: near-black radial gradient, `#241a12 → #0a0a0f → #000` (warm dark vignette, not flat black)
- Two soft blurred accent blobs positioned top-right and bottom-left for depth:
  - Orange blob: `rgba(255,140,60,0.18)`, 220px, blur 50px, top -60px right -40px
  - Slate blue blob: `rgba(70,110,180,0.14)`, 260px, blur 60px, bottom -80px left -60px

**Glass panel formula** (apply to every card/module)
- `background: rgba(255,255,255,0.05–0.08)` depending on emphasis
- `backdrop-filter: blur(16–24px)`
- `border: 0.5px solid rgba(255,255,255,0.10–0.15)`
- `border-radius: 12–16px`
- No drop shadows, no glow effects beyond the background blobs

**Color roles**
| Role | Color | Use |
|---|---|---|
| Primary accent | Orange `#ff9f5a` / fill `rgba(255,140,60, 0.08–0.4)` | Brand mark, hero badge, the *active* nav tab, primary CTA button |
| Secondary accent | Slate blue `rgba(70,110,180, 0.1–0.3)` / text `#a9c2ea` | Secondary tools, consents module, non-active nav items |
| Status — success | `#4ee08a` | Privacy score, "synced" indicator |
| Status — warning | `#ffb454` | Revokable consent flags |
| Text | White at varying opacity: 100% headings, 60% body, 45% section labels, 40% muted/empty states | — |

**Typography**: sentence case everywhere, no ALL CAPS except small uppercase section labels (11px, letter-spacing 0.5px, 45% white). Headings weight 500, body weight 400. No bold/700 weight anywhere.

## 2. Visual emphasis by usability tier (styling only — do not reorder or restructure modules)

Keep every module in its current position in the interface. Apply only a visual weight treatment — glass opacity, border strength, type size — so existing modules read as three implied tiers of importance, without moving, merging, or renaming anything:

**Tier 1 — Daily glance** (highest emphasis, glass opacity ~8-10%)
Whichever existing modules the user checks most often at a glance (e.g. privacy score, connected sites, active consents). Increase their glass fill opacity and border strength slightly above the baseline so they stand out first.

**Tier 2 — Tools** (medium emphasis)
Existing frequently-used navigation/section modules (e.g. footprint grid, request tracker, audit log). Keep their current position and role in the layout (nav row, tab bar, etc.) — only restyle the container using the glass formula, with the currently-active one styled in orange and inactive ones in slate blue.

**Tier 3 — Occasional** (lowest emphasis, glass opacity ~3%)
Existing rarely-used modules (e.g. nominate guardian, guardian nomination log). Keep their current position, columns, and content exactly as-is — only reduce glass opacity and border strength so they visually recede relative to Tier 1.

The goal is a visual hierarchy achieved purely through styling (opacity, contrast, size) — not a change to which modules exist, how many there are, or where they sit in the page structure.

## 3. Header (restyle existing header, do not change its content or elements)

Keep the current logo, wordmark, sync status indicator, and user avatar exactly as they are. Restyle only:
- Logo icon container: 34px rounded-square glass surface (shield-check icon, orange tint)
- Wordmark: 16px, weight 500, white
- Sync status: pill-shaped glass chip with a green live-dot
- User avatar: 24px circle, glass-styled surrounding chip

## 4. Hero panel (restyle existing hero copy, do not change the copy or add/remove elements)

Apply the full-width glass panel treatment to the existing hero section, keeping its current badge text, heading, and supporting copy unchanged:
- Existing badge → orange-tinted glass pill
- Existing H1 → white, weight 500
- Existing supporting copy → 60%-opacity white, max-width ~460px

## 5. Interaction and accessibility

- All interactive elements (buttons, active tabs) get a visible hover state: raise background opacity by ~5%
- Maintain WCAG AA contrast for all text against its glass background — verify white-on-glass text stays above 60% opacity minimum for body copy
- Icons: use a consistent outline icon set (e.g. Tabler icons) — shield-check, world, checkbox, clock/gauge, grid-dots, file-text, history, user-plus
- Component must be fully responsive: stat grid collapses to 1 column below 480px, tools row wraps, occasional section stacks to single column on mobile

## 6. Deliverable

Apply these changes as a theme/style layer on top of the existing component tree — extract the color tokens above into CSS variables or a theme object so the palette can be swapped later without touching markup or logic. Do not:
- Add, remove, or rename any module, section, route, or component
- Change any existing data, copy, prop, or functional behavior
- Reorder modules or alter the page's information architecture

Only touch: colors, backgrounds, borders, blur/glass effects, typography weight/size/case, spacing, and icon style. If a visual requirement above conflicts with preserving an existing module's structure, preserve the structure and adapt the visual treatment to fit it.
