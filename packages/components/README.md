# @timelessui/components

CSS-first Timeless UI components.

The CSS ships in three tiers. `tokens.css` carries the cascade-layer order and `color-scheme`,
`core/` carries behavior and is required, and `themes/atmosphere/` carries the look and is the tier
you replace. One import gets all three:

```ts
import '@timelessui/components/css/themes/atmosphere.css'
```

Import granularly when a route renders a handful of components — tokens first, then core and the
theme per component:

```ts
import '@timelessui/components/css/tokens.css'
import '@timelessui/components/css/core/button.css'
import '@timelessui/components/css/core/dialog.css'
import '@timelessui/components/css/themes/atmosphere/tokens.css'
import '@timelessui/components/css/themes/atmosphere/button.css'
import '@timelessui/components/css/themes/atmosphere/dialog.css'
```

For a design system of your own, or for Tailwind, import `tokens.css` and `core.css` and no theme at
all.

```html
<ui-tabs value="overview">
  <div role="tablist" aria-label="Component sections">
    <button role="tab" value="overview" type="button">Overview</button>
    <button role="tab" value="usage" type="button">Usage</button>
  </div>
  <section role="tabpanel">
    <p>Overview content.</p>
  </section>
  <section role="tabpanel">
    <p>Usage content.</p>
  </section>
</ui-tabs>
<div>
  <details class="ui-collapsible" open>
    <summary>What stays native?</summary>
    <div>
      <p>
        Open state, keyboard access, and disclosure semantics stay owned by details and summary.
      </p>
    </div>
  </details>
</div>
<ui-dialog>
  <button class="ui-button" data-ui-part="trigger" type="button">Open dialog</button>
  <dialog>
    <header>
      <h2>Release checklist</h2>
      <p>Native dialog owns modality and top-layer behavior.</p>
    </header>
    <section>
      <p>Review package exports before publishing.</p>
    </section>
    <footer>
      <button class="ui-button" data-ui-part="close" type="button">Done</button>
    </footer>
  </dialog>
</ui-dialog>
<ui-popover placement="bottom">
  <button class="ui-button" data-ui-part="trigger" type="button">Open status</button>
  <div popover="auto">
    <h2>Release status</h2>
    <p>Native popover handles outside dismissal.</p>
  </div>
</ui-popover>
<button id="copy-tooltip-anchor" class="ui-button" data-ui-variant="secondary" type="button">
  Copy
</button>
<ui-hover-card id="copy-tooltip" anchor="copy-tooltip-anchor" variant="tooltip" popover="manual">
  <p>Copy package import path</p>
</ui-hover-card>
<ui-toaster placement="bottom-end" stack="overlap">
  <ui-toast duration="0" role="status">
    <div data-ui-part="content">
      <h2 data-ui-part="title">Package built</h2>
      <p data-ui-part="description">Components and docs finished without warnings.</p>
    </div>
    <button data-ui-part="close" type="button" aria-label="Dismiss notification">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
        <path
          d="m4.5 4.5 7 7m0-7-7 7"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1"
        />
      </svg>
    </button>
  </ui-toast>
</ui-toaster>
<button class="ui-button" data-ui-variant="primary">Save</button>
<section class="ui-alert" data-ui-variant="success" role="status">
  <span data-ui-part="icon" aria-hidden="true">i</span>
  <div data-ui-part="content">
    <h2 data-ui-part="title">Package published</h2>
    <p data-ui-part="description">The CSS bundle is available for consumers.</p>
  </div>
</section>
<span class="ui-avatar" data-ui-status="online" role="img" aria-label="Javier Acero, online">
  <span data-ui-part="fallback">JA</span>
  <span data-ui-part="status" aria-hidden="true"></span>
</span>
<span class="ui-badge" data-ui-variant="success">Ready</span>
<span class="ui-spinner" data-ui-variant="accent" role="status">
  <span data-ui-part="label">Loading package</span>
</span>
<label class="ui-field">
  <span class="ui-label">Email</span>
  <span data-ui-part="control">
    <input class="ui-input" name="email" type="email" required />
    <span class="ui-description">Use the address for your workspace account.</span>
  </span>
</label>
<article class="ui-card">
  <h2 data-ui-part="title">Native-first components</h2>
  <p data-ui-part="description">Timeless styles public Light DOM anatomy.</p>
</article>
```

Use `@timelessui/components/css/themes/atmosphere.css` to import the Atmosphere theme complete with
the required layer order and behavior. There is no implicit default theme: the path names the theme.

The public authoring grammar uses `.ui-*` for native component roots, contract-declared `data-ui-*`
attributes for native visual configuration, registered `<ui-*>` elements for behavior, plain host
attributes for custom-element configuration, and `data-ui-part` for authored anatomy. Native and
ARIA state remain authoritative. `data-ui-internal-*` is private and must not appear in authored
markup.

Progressive custom elements are registered from an explicit entrypoint so the package root remains
side-effect free:

```ts
import { defineTimelessElements } from '@timelessui/components/define'

defineTimelessElements()
```

Importing a class does not register it. Register only the element that an application needs when a
smaller dependency boundary matters:

```ts
import { UIComboboxElement } from '@timelessui/components/combobox'
import { defineComboboxElement } from '@timelessui/components/define/ui-combobox'
import '@timelessui/components/css/core/combobox.css'
import '@timelessui/components/css/themes/atmosphere/combobox.css'

defineComboboxElement()
```

Selection elements treat the `value` attribute as initial and reset state. Their `value` property is
live state, so property assignments update selection without rewriting the authored attribute or
dispatching change events. User transitions first dispatch cancelable `ui-before-change`, then
dispatch non-cancelable `ui-change` after commit. Both events bubble, cross the composed boundary,
and expose `value`, `previousValue`, `source`, `reason`, and `originalEvent`.

```ts
const listbox = document.querySelector('ui-listbox')!

listbox.addEventListener('ui-before-change', (event) => {
  if (!canSelect(event.detail.value)) event.preventDefault()
})

listbox.value = 'ready'
```

Shared domain composition utilities have side-effect-free subpaths:

```ts
import {
  collectionTextMatches,
  gridCollectionNavigationTarget,
} from '@timelessui/components/collection'
import type { UITransitionDetail } from '@timelessui/components/events'
import { ValueState } from '@timelessui/components/value-state'
```

React 19 consumers can opt into intrinsic element and custom event types without a runtime wrapper:

```ts
import '@timelessui/components/react'
```

Package tooling can read the public-only Custom Elements Manifest from the standard `customElements`
package field.

Standalone toggles use native pressed buttons. The application owns changes to `aria-pressed`:

```html
<button class="ui-button ui-toggle" type="button" aria-pressed="false">Bold</button>
```

Use `ui-toggle-group` when Timeless should own grouped selection and roving focus. Its children stay
native buttons:

```html
<ui-toggle-group selection="single" attached aria-label="Text alignment">
  <button class="ui-button ui-toggle" type="button" value="left" aria-pressed="true">Left</button>
  <button class="ui-button ui-toggle" type="button" value="center" aria-pressed="false">
    Center
  </button>
</ui-toggle-group>
```

Color parsing, serialization, conversion, gamut, and contrast utilities are a library rather than a
component, so they ship as their own package. `ui-color-picker` depends on it, and you can install
it alone:

```ts
import { inGamut, parseCssColor, serializeCssColor } from '@timelessui/color'
```

For application-triggered toasts, import the thin helper and point it at an authored toaster:

```ts
import { toast } from '@timelessui/components'

const toaster = document.querySelector('ui-toaster')

toast('Preview queued', {
  description: 'The toast() API appends an authored ui-toast item.',
  stack: 'overlap',
  toaster,
})
```

`ui-toaster` is a document-level fixed viewport container, not a trigger-anchored popover. Keep it
as static markup near the app or story root, then use `placement` to choose `top-start`,
`top-center`, `top-end`, `bottom-start`, `bottom-center`, or `bottom-end`. Use `stack="overlap"` for
the default card-pile effect, or `stack="list"` for a regular spaced list.

## Typed authoring

Every attribute, its permitted values, and every event detail type are declared once and generated
into the type system, the Custom Elements Manifest, and the editor data. Import the framework
declarations you need once in your application types — each is types-only and adds no runtime code
and no dependency on that framework:

```ts
import '@timelessui/components/react' // React 19
import '@timelessui/components/preact' // Preact
import '@timelessui/components/solid' // Solid
import '@timelessui/components/vue' // Vue
import '@timelessui/components/svelte' // Svelte
```

With one imported, `ui-*` tags are known elements and their values are checked:

```tsx
<ui-tabs orientation="vertical" activation="manual" />
```

Permitted values are also exported as `as const` arrays with matching union types —
`buttonVariants`, `sheetPositions`, `colorPickerFormats`, and the rest — for controls, validators,
and tests.

CSS-only components are a root class plus `data-ui-*` on a native tag, which no editor can complete
per element. Use the typed helper:

```ts
import { uiAttributes } from '@timelessui/components/attributes'

uiAttributes('button', { variant: 'primary', size: 'lg' })
// { class: 'ui-button', 'data-ui-variant': 'primary', 'data-ui-size': 'lg' }
```

For plain HTML and CSS, the package ships `vscode.html-custom-data.json`,
`vscode.css-custom-data.json`, and `web-types.json`. Registering the first two gives tag, attribute,
and value completion in any `.html` file; JetBrains IDEs read `web-types.json` automatically. In
development, `@timelessui/components/validate` reports authored `data-ui-*` values that no contract
permits.
