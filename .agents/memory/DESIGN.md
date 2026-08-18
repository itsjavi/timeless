# Design System Specification: Atmosphere

- **Theme:** Atmosphere
- **Product:** Timeless UI
- **Framework:** Web Components, with a Starlight documentation site and a StoryLite workbench
- **Styling:** Plain CSS, CSS custom properties, cascade layers
- **UI library:** First-party `@timelessui/core` and `@timelessui/components`
- **Primary color:** `#0064d8` (accessible system blue)
- **Supported color schemes:** light, dark
- **Platform:** Web (desktop-first, responsive, mobile-friendly)

## 1. Overview & Creative North Star

**Creative North Star: flat clarity with soft material presence.**

Atmosphere is Timeless UI's design language. It blends flat interface clarity with a modern, softer
neumorphic feel. The result should feel slightly old-but-modern: calm, tangible, familiar, and
practical rather than glossy, futuristic, or ornamental.

The system is not a full neumorphic system. Most UI remains flat. Depth appears where it improves
perception: buttons, inputs, selects, popovers, dialogs, dropdowns, comboboxes, sheets, and other
floating or high-interaction controls. The goal is not to make every element look pressed out of a
surface. The goal is to give important controls a quiet physical quality while keeping layouts,
content, and documentation surfaces clean.

Atmosphere should help components feel usable before they feel styled. Native elements remain the
center: buttons are buttons, links are links, inputs are inputs. The visual system should make those
elements feel considered without hiding their platform behavior.

## 2. Colors & Surface Philosophy

The palette is cool, neutral, and restrained. Blue is the primary action color, red is reserved for
destructive actions, and most surfaces are grayscale with small changes in lightness.

### Core Color Tokens

- **Page:** `--ui-bg-page`, light `#f7f7f8`, dark `#111113`.
- **Surface:** `--ui-bg-surface`, light `#ffffff`, dark `#19191d`.
- **Raised surface:** `--ui-bg-surface-raised`, light `#f1f2f4`, dark `#24242a`.
- **Text:** `--ui-fg`, light `#17171a`, dark `#f4f4f5`.
- **Muted text:** `--ui-fg-muted`, light `#666a73`, dark `#a5a7b0`.
- **Subtle line:** `--ui-line`, light `#d7d9de`, dark `#343641`.
- **Strong line:** `--ui-line-strong`, light `#b8bcc5`, dark `#505360`.
- **Accent:** `#0064d8`.
- **Accent hover:** `--ui-accent-hover`, `#0045b7`.
- **Accent active:** `--ui-accent-active`, `#005cd7`.
- **Accent fills:** `--ui-bg-accent-hover` and `--ui-bg-accent-active` mix `#0045b7` and `#0050ad`
  subtly into `#0064d8` with `color-mix()` in OKLab, rather than swapping to a flat darker blue.

### Flat First, Tactile When It Matters

Flat layout is the default. Pages, docs examples, lists, badges, static cards, tables, labels, help
text, empty states, and non-interactive wrappers should use flat surfaces, spacing, and typography.
Do not add shadows simply to make a page feel designed.

Tactile treatment is reserved for controls that the user manipulates or surfaces that float above
other content. Use it to answer "can I interact with this?" or "is this on top?" Do not use it as
general decoration.

### Surface Hierarchy

- **Page (`--ui-bg-page`):** the base canvas. It should be quiet and never compete with controls.
- **Surface (`--ui-bg-surface`):** ordinary content areas, docs examples, tables, and static cards.
- **Raised surface (`--ui-bg-surface-raised`):** flat filled controls, selected rows, hover states,
  and soft grouping.
- **Floating surface:** popovers, menus, combobox lists, tooltips, dialogs, sheets, and native
  select lookalikes. These use thin borders plus very thin shadows.
- **Accent surface:** primary actions and selected interactive states. These use blue with
  restrained inner light and outer ambient shadow.

### Dark Mode

Dark mode is not an inversion filter. It is a parallel palette. Dark surfaces should feel like
charcoal material, not pure black glass. Use `#111113` as the page base, `#19191d` and `#24242a` for
surfaces, and avoid large blocks of saturated color.

Depth in dark mode comes mostly from edge contrast and inner highlights. Shadows should be present
but subtle; a dark component should not look like it has a black glow around it.

## 3. Typography

Atmosphere uses system sans-serif typography by default. The type should feel product-grade and
legible, not editorial or decorative.

- **Interface and body:** Inter when available, then `ui-sans-serif`, `system-ui`, `-apple-system`,
  BlinkMacSystemFont, `Segoe UI`, sans-serif.
- **Headings:** the same family, heavier weight, no negative letter spacing.
- **Labels and metadata:** smaller size, higher weight, muted color. Uppercase is allowed for
  section labels in docs examples and compact component anatomy, but not as a general UI voice.
- **Buttons and controls:** medium-to-strong weight. Keep labels concise. Do not use oversized type
  inside compact controls.

Text should fit the control. Do not scale font size with viewport width. Use wrapping and sensible
container constraints instead.

## 4. Iconography

Icons are functional symbols. They should clarify controls, not decorate surfaces.

- **Style:** outlined icons.
- **Source:** use the project's chosen icon library when one exists. For standalone components,
  expose slots or allow user-authored SVG rather than shipping arbitrary icon opinions.
- **Default size:** 16px in compact controls, 18px to 20px in ordinary controls, 24px only for large
  icon-only actions.
- **Stroke:** visually consistent, usually around 1.75px to 2px for Lucide-style icons.
- **Color:** inherit `currentColor`.
- **Placement:** icon plus label for commands where meaning benefits from reinforcement; icon-only
  only when the action is common and has an accessible label.

Do not mix filled, duotone, and outlined icon styles inside the same component family.

## 5. Elevation & Depth

Atmosphere depth is thin, close to the surface, and mostly quiet. It combines:

- a soft outer shadow,
- a restrained inner top highlight,
- an inner lower edge shade,
- and a thin border only when it improves edge definition.

### Shadow Rules

- **Default flat surfaces:** no shadow.
- **Flat filled controls:** no shadow and no border.
- **Tactile buttons:** very thin outer shadow plus inner highlight/shade.
- **Outline controls:** thin border plus subtle shadow, never a heavy card shadow.
- **Floating overlays:** thin border plus a soft ambient shadow. They may look more tactile than a
  card, because they are actually above the page.
- **Pressed state:** prefer slight inset shadow and a tiny background shift. Avoid dramatic
  translation or deep inset wells.

Suggested starting values:

```css
--ui-shadow-control:
  0 1px 1px rgb(0 0 0 / 10%), 0 2px 5px rgb(0 0 0 / 8%), inset 0 1px 0 rgb(255 255 255 / 20%),
  inset 0 -1px 0 rgb(0 0 0 / 12%);

--ui-shadow-floating: 0 1px 1px rgb(0 0 0 / 10%), 0 8px 24px rgb(0 0 0 / 10%);
```

Use these as a direction, not an excuse to add shadows everywhere.

## 6. Components

### Buttons

- **Visuals:** buttons may be tactile, but they are not the entire design system. Primary and
  destructive buttons can use inner/outer shadows. Secondary and ghost are flat.
- **Primary:** blue `#0064d8`, white text, subtle hover and active mixes toward `#0045b7` and
  `#0050ad`.
- **Secondary:** flat filled neutral surface, no border, no shadow.
- **Outline:** border plus thin tactile shadow.
- **Ghost:** transparent by default; on hover it uses the same flat fill family as secondary.
- **Link:** underlined text with the same focus radius as other buttons.
- **States:** cursor remains `default`. Focus is visible. Disabled lowers opacity but keeps layout.

### Inputs, Textareas, Native Selects

- **Visuals:** inputs should feel lightly inset or softly framed, not boxed in by heavy borders. Use
  a flat fill plus a thin edge and, where needed, a very small inner shadow.
- **Focus:** focus should make the control clearer, not louder. Use `--ui-focus`, a blue edge, or a
  subtle outline offset. Do not remove visible focus.
- **Invalid:** combine red text/edge with message text. Do not rely on red alone.
- **Density:** keep enough height for native editing comfort. Compact inputs still need usable hit
  areas.

### Selects, Dropdowns, Menus, Comboboxes

- **Visuals:** triggers follow the same rules as buttons or inputs depending on their role. Floating
  content uses a raised surface, thin border, and thin ambient shadow.
- **Interaction:** hover states are flat neutral fills. Selected states may use accent-soft
  backgrounds and text/icon reinforcement.
- **Keyboard:** follow ARIA APG behavior for roving focus, active descendant, typeahead, Escape,
  Enter, Home, End, and disabled item skipping.
- **Composition:** reuse Popover and list primitives; do not create one-off floating behavior.

### Popovers, Tooltips, Dialogs, Sheets

- **Visuals:** these are allowed to be more atmospheric than flat content. Use rounded surfaces,
  thin borders, and soft floating shadows. Avoid large blurred shadows.
- **Dialogs:** clear title, compact actions, focus trap, Escape close, focus return.
- **Sheets:** similar to dialogs but anchored to an edge. Use stronger separation from the page than
  a card, but keep the shadow thin.
- **Tooltips:** small, crisp, and readable. Avoid theatrical animation or decorative arrows unless
  they solve positioning clarity.

### Cards, Panels, Lists, Tables

- **Visuals:** flat by default. Use background, spacing, and typography for structure.
- **Cards:** only individual repeated items should look card-like. Page sections should not become
  floating cards.
- **Tables:** favor density, alignment, and readable row states. Hover can use a flat neutral fill.
- **Lists:** row separators may use subtle lines or spacing, depending on density.

### Badges, Status, Feedback

- **Visuals:** flat. Badges should be small text/status surfaces, not tactile pills.
- **Danger/warning:** use both color and text. Keep destructive red for destructive action or
  critical state.
- **Loading:** use stable dimensions. Loading labels and spinners must not resize controls.

### Documentation Website (`apps/web`)

- This app owns the reference documentation. Attribute values, defaults, anatomy, public state, CSS
  custom properties, events, and keyboard behavior are all rendered from the component registry, so
  they are never hand-written here.
- To change what a component page says about its API, change
  `packages/components/scripts/component-registry.mjs`. The build proves declared attribute values
  against the stylesheets in both directions and fails on placeholder descriptions.
- Prose pages cover setup, styling, frameworks, and concepts. Keep component-specific API facts out
  of them; link to the component page instead.

### StoryLite Workbench (`apps/stories`)

- Use StoryLite for what generated reference pages cannot show: variant and state matrices compared
  side by side, interactive controls, no-JavaScript and unsupported-capability scenarios, and
  performance scenarios.
- Do not restate anatomy, attribute values, CSS imports, or package usage in stories. That is
  generated on the website, and a second copy drifts.
- Stories should show public consumer markup, not internal implementation details.
- Include light and dark examples when component behavior or appearance differs materially.
- Add controls for useful story arguments, but do not create noisy controls for fixed anatomy
  examples. Size stories, for example, should not control size when their purpose is comparing
  sizes.

### Components Package (`packages/components`)

- This package owns public CSS contracts and public component types.
- Prefer CSS-only components and native HTML first.
- Use `.ui-*` class hooks for native CSS component identity.
- Use registered `<ui-*>` elements only when behavior, lifecycle, properties, or events are needed.
- Use contract-declared `data-ui-*` attributes for native visual configuration, and declare every
  attribute's permitted values and default in the registry. A value the stylesheets do not implement
  fails the build, and so does an attribute nothing implements.
- Use `data-ui-part` for authored Light DOM anatomy, native and ARIA state where available,
  `:state()` for private host state, and `data-ui-internal-*` only for unavoidable runtime hooks.
- Do not support old `data-ti-*` or PoC selectors in the new package.
- Keep root exports side-effect free. CSS is imported explicitly.
- Do not generate visual DOM from component JavaScript unless a milestone explicitly accepts it.

### Core Package (`packages/core`)

- `@timelessui/core` is a thin authoring layer, not a styling layer.
- Core must not create visual class names or enforce Atmosphere styling.
- Core helpers may manage attributes, listeners, queries, definition, and lifecycle.
- Components built with core should still enhance author-owned Light DOM.
- Keep core tests focused on contracts and behavior. Do not add app or component UI unit tests.

## 7. Accessibility & UX Quality Bar

Atmosphere is soft, but it cannot be vague. Every component must remain inspectable, keyboard
operable, and understandable without the theme CSS.

- **Keyboard:** every interactive control is reachable and operable from the keyboard.
- **Focus:** focus rings must be visible on flat, tactile, light, and dark surfaces.
- **Contrast:** body text meets WCAG AA. Muted text must remain readable.
- **Touch targets:** target 44px minimum for touch-friendly interactive surfaces.
- **Semantics:** prefer native controls and labels. Do not replace native behavior with divs.
- **Motion:** respect `prefers-reduced-motion`. Use short transitions for feedback only.
- **Overlays:** trap focus where appropriate, restore focus to the trigger, and close on Escape.
- **State:** selected, invalid, disabled, loading, and destructive states need semantic attributes
  or text, not color alone.
- **CSS absence:** public anatomy should remain usable when Timeless CSS is not loaded.

## 8. Implementation Notes for LLMs

When generating UI for Timeless:

- Read this file before changing `apps/stories`, `packages/components`, or `packages/core`.
- Use Atmosphere as the visual direction: flat first, tactile only for controls and overlays.
- Do not make every component look like the current Button. Buttons demonstrate one tactile
  treatment; cards, badges, tables, and docs layouts should stay flatter.
- Use existing tokens from `packages/components/src/css/tokens.css` before adding new ones. A token
  added to the stylesheet must also be listed in `src/tokens.ts`, and vice versa; the build checks
  it.
- Declare public API in `packages/components/scripts/component-registry.mjs`, never in the docs app.
  Every attribute, part, state, variable, and event needs a real description — placeholders fail.
- Keep component CSS in cascade layers: `ui.tokens`, `ui.components`, and `ui.utilities`.
- Follow the unified authoring grammar. Do not introduce selector aliases or visual class names from
  JavaScript.
- Keep `@timelessui/core` visual-free. It should enable behavior, not decide appearance.
- In StoryLite, show copyable consumer markup and scenarios the generated reference cannot express.
  Avoid implementation-detail stories, and avoid duplicating generated API tables.
- Do not add app-level component/unit tests. Use package unit tests for stable public contracts and
  browser/E2E tests for real user flows where needed.
- If a rule is unclear, choose the flatter option first. Add tactile depth only when the component
  is interactive, floating, or selected.

## 9. Do's and Don'ts

### Do

- **Do** keep most layout surfaces flat so tactile controls have somewhere to stand out.
- **Do** use subtle edge definition and thin shadows for overlays and high-interaction controls.
- **Do** show light and dark examples for components whose treatment changes across color schemes.
- **Do** use native HTML and author-owned Light DOM wherever possible.
- **Do** preserve stable dimensions for buttons, inputs, menus, and loading states.

### Don't

- **Don't** turn every card, panel, row, or badge into a raised object; Atmosphere is not blanket
  neumorphism.
- **Don't** use heavy shadows, strong glows, or dramatic hover jumps.
- **Don't** hide focus rings to preserve softness.
- **Don't** add visual classes from JavaScript behavior modules.
- **Don't** introduce a second token system, icon style, or CSS naming convention.

## Director's Closing Note

Atmosphere is about restraint with presence. It should feel modern without becoming sterile, and
soft without becoming blurry. Build flat foundations, then reserve tactile depth for the places
where users touch, choose, open, edit, and commit.
