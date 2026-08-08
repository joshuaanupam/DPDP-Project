# Prompt: Restyle the "Reclaim" browser extension to match the PrivacyLens dashboard theme

## Context
This is a browser extension called "Reclaim" that shows a privacy/exposure score popup. We've already redesigned our main dashboard ("PrivacyLens") to use a warm beige/tan accent theme instead of blue/purple/orange. This extension needs to be restyled to match that same design system so the extension and dashboard feel like one cohesive product.

Before making changes: inspect the extension's codebase (popup HTML/CSS/JS, or React/Vue component if applicable) and find where colors are currently defined — inline styles, a CSS file, or a theme/tokens file. Reuse that structure; don't introduce a new styling approach.

## Shared color palette (same as dashboard — keep in sync)
- Primary accent (buttons, highlights, active/brand elements): `#8a7a5c`
- Accent hover/darker: `#6b5b3a`
- Light accent background (chips, highlighted sections): `#EFE8DA`
- Card background: `#ffffff`
- Section/subtle background: `#F7F5EF`
- Borders/hairlines: `#e5e0d3`
- Muted/secondary text: `#6b6a64`
- Placeholder/tertiary text: `#9a9890`

**Keep semantic status colors unchanged** — these communicate meaning, not brand, so do not recolor them:
- "Clean" / low-risk badge: keep green
- "High risk" number/badge: keep red
- Warning/exposure alerts: keep amber/orange if currently used for warnings specifically (not as brand color)

## Specific elements to update

1. **Header bar** ("RECLAIM" + shield icon + score pill):
   - Currently dark navy/black — change to the beige-dark palette, e.g. background `#6b5b3a` or a deep neutral brown-black that reads as premium/dark but warm, not navy.
   - Score pill border/text: if score is "good," keep it green (semantic), just adjust the pill's neutral background to fit the new dark header tone.

2. **"Current site" card**: white background, no change to layout. Update any blue/purple accent icons or links to the beige accent (`#8a7a5c`). Keep the "Clean" badge green.

3. **"Website brief" card**: the `[REFRESH]` link — currently blue/purple — change to beige accent color `#8a7a5c`. Globe icon and body text stay neutral gray, no change needed.

4. **"Child Safe Mode (§9)" card**: it currently has a purple left border accent — change that left border to the beige accent (`#8a7a5c`). Toggle switch, when off, stays neutral gray; when on, should use the beige accent instead of its current color.

5. **"Digital Exposure Overview" stat grid** (Websites / Exposures / High Risk):
   - "Websites" and "Exposures" numbers currently blue — change to the beige accent `#8a7a5c` (these are neutral counts, not risk indicators).
   - "High Risk" number stays **red** — this is a semantic risk indicator, do not change.

6. **"Open Privacy Dashboard" button**: currently blue — change to the beige accent `#8a7a5c` background with white text, matching the dashboard's primary button style. Hover/active state should darken to `#6b5b3a`.

7. **"Recent Website Activity" list**: no color change needed beyond ensuring link/hover states (if any) use the beige accent instead of blue.

8. **Footer disclaimer**: keep as-is (neutral gray text with the lock/shield icon).

## Constraints
- This is a visual/styling change only — do not alter functionality, data, copy, or layout structure.
- Match spacing, border-radius, and font sizing already used in the extension; only update colors (and the header's dark tone) per above.
- If the extension has a manifest-level theme color (e.g. for the browser toolbar icon or `theme_color` in manifest.json), update it to align with the new header color too.
- Confirm the same beige token names/values are used here as in the dashboard's theme file, if the two share a design-tokens package or repo.

## Deliverable
Apply these changes directly to the extension's popup UI files, and list which files were modified.
