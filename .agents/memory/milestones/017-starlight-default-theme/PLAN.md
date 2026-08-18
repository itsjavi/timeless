# Milestone 017: Starlight default theme

## Summary

Restore Starlight's complete default theme across the documentation shell under `/docs/`. Remove the
Timeless marketing palette, display fonts, custom title treatment, and other global documentation
overrides. Keep rendered component previews under `/docs/_preview/{example-id}/` isolated and
unchanged.

## Baseline

- Planning baseline commit: `89ed84db55bc987d1cec5665255727ebc2971f24`
- Audited surface: the Starlight shell and component reference pages under `/docs/`
- Excluded surface: rendered examples under `/docs/_preview/{example-id}/`
- Design direction: use Starlight's default theme and default fonts throughout the documentation
  shell
- Explicit exception: iframe preview pages keep their existing isolated light and dark canvas styles

## Evidence

The Starlight integration loads `apps/web/src/styles/docs.css` through `customCss` in
`apps/web/astro.config.mjs`. Starlight defines `customCss` as the mechanism for overriding its
default styles.

The loaded stylesheet replaces the default system font stack, light palette, dark palette, heading
fonts, brand title, focus ring, inline code, and table presentation:

- `apps/web/src/styles/docs.css:1` loads Yellowtail from Google Fonts.
- `apps/web/src/styles/docs.css:3` through line 43 replace Starlight font and color variables for
  both themes.
- `apps/web/src/styles/docs.css:45` through line 73 replace heading and site-title typography.
- `apps/web/src/styles/docs.css:75` through line 96 replace focus, tagline, code, and table styles.

Preview pages are already isolated from the shell. The static iframe route imports
`apps/web/src/styles/preview.css` directly from `apps/web/src/pages/docs/[section]/[id].astro`, and
the iframe receives only its declared component CSS. Removing the Starlight shell stylesheet does
not remove preview styling.

The `ComponentPreview` chrome uses Starlight variables in
`apps/web/src/components/docs/ComponentPreview.astro`. It will inherit the default Starlight palette
after the override is removed without requiring a replacement theme.

## Implementation

1. Remove the `customCss` entry from the Starlight configuration in `apps/web/astro.config.mjs`.
2. Delete `apps/web/src/styles/docs.css` because no documentation-shell overrides remain.
3. Do not modify `apps/web/src/styles/preview.css`, the preview route, canonical component styles,
   or preview theme switching.
4. Keep the local `ComponentPreview` layout styles. They provide preview structure while consuming
   Starlight's default variables for all shell-facing colors and typography.
5. Search `apps/web` for Yellowtail, Cooper, `--sl-font`, and custom `--sl-color-*` declarations.
   None should remain in the Starlight shell. Marketing and iframe assets remain outside this check.

## Constraints

- Use the Starlight defaults directly. Do not replace the warm palette with another custom neutral
  palette.
- Do not override Starlight's font variables or heading typography.
- Do not add a new theme package or external font dependency.
- Preserve all documentation content, navigation, search, API tables, preview controls, and iframe
  behavior.
- Preserve iframe light and dark canvases independently from the docs-shell theme.

## Verification

1. Run `pnpm -F @apps/web typecheck`.
2. Run `pnpm -F @apps/web test`.
3. Run `pnpm -F @apps/web build`.
4. Run the website Chromium suite and confirm the existing light and dark axe checks pass.
5. Inspect `/docs/` and `/docs/components/button/` in both themes. Confirm the header, sidebar,
   content, headings, code, tables, controls, focus rings, and search use Starlight defaults.
6. Confirm no request is made to Google Fonts from a documentation page.
7. Toggle the Button preview canvas between light and dark. Confirm the iframe still uses
   `preview.css`, loads granular component CSS, and remains independent from the docs shell.
8. Run `pnpm format:check` and `git diff --check`.

## Acceptance criteria

- The docs shell uses Starlight's default fonts and default light and dark theme values.
- No Timeless marketing font or warm branded palette reaches the Starlight shell.
- The docs shell has no custom Google Fonts dependency.
- Preview iframe light and dark canvases remain unchanged.
- Preview chrome remains usable and inherits the active Starlight theme.
- Type checking, docs validation, static build, accessibility checks, overflow checks, and preview
  behavior remain passing.
