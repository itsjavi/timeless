---
name: using-timeless-ui
description:
  Author markup with Timeless UI components — the CSS-class-plus-`data-ui-*` grammar, the registered
  `ui-*` custom elements, authored `data-ui-part` anatomy, stylesheet imports, and per-element
  registration. Use whenever writing, reviewing, or debugging markup that uses
  `@timelessui/components`, including when a component renders unstyled, an attribute appears to
  have no effect, or a custom element never upgrades.
---

# Using Timeless UI

Timeless is not a prop-based component library. It has no runtime wrapper, no `className` merge
helper, and no component functions to import. You write native HTML and add a class or a tag. Markup
copied from a React library's conventions will not work here, so read the grammar below before
writing any.

## The two kinds of component

Everything in the library is one of two things, and they are configured differently. Getting this
wrong is the single most common failure.

**CSS components** are a native element carrying a `ui-*` class. Configure them with `data-ui-*`
attributes. There is nothing to register and nothing to import beyond the stylesheet.

```html
<button class="ui-button" type="button" data-ui-variant="primary" data-ui-size="lg">Publish</button>
```

**Custom elements** are a registered `ui-*` tag wrapping your own markup. Configure them with plain
attributes, never `data-ui-*`. Register each element you use.

```html
<ui-tabs orientation="vertical" activation="manual">
  <!-- your own tablist and panels -->
</ui-tabs>
```

So:

- `<ui-button variant="primary">` is wrong twice — there is no `ui-button` element, and `variant` is
  not how a CSS component is configured. It is
  `<button class="ui-button" data-ui-variant="primary">`.
- `<ui-tabs data-ui-orientation="vertical">` is wrong — host configuration on a custom element uses
  plain attributes. It is `<ui-tabs orientation="vertical">`.

`reference/contracts.md` lists every root in the library, which kind it is, and what it accepts.
Consult it before guessing.

## Rules that apply to both kinds

**Boolean attributes are presence-based.** Author the attribute with no value, or omit it entirely.
`invalid`, `wrap`, and `attached` are booleans; `invalid="true"` and `data-ui-invalid="true"` are
not valid and will not match the stylesheet.

**Anatomy is authored, and marked with `data-ui-part`.** The value is a whitespace-separated token
list, selected with `[data-ui-part~='name']`. Parts marked required in `reference/contracts.md` must
be present for the component to work — a `ui-tabs` with no `[role='tablist']` has nothing to
coordinate.

```html
<ui-popover>
  <button class="ui-button" data-ui-part="trigger" type="button" popovertarget="status">
    Status
  </button>
  <div id="status" popover="auto">Deployed 4 minutes ago</div>
</ui-popover>
```

**`data-ui-internal-*` attributes belong to the runtime.** Never author them and never style them.
They are private and they change without notice.

**Native semantics, ARIA, and platform pseudo-classes are authoritative for state.** Style
`:disabled`, `[aria-expanded='true']`, `:state(--copied)` and the like. Do not invent your own state
classes, and do not add ARIA to replace behavior the DOM already provides — use a real `<button>`, a
real `<dialog>`, a real `popover`.

**Accessible names are always yours to supply.** Timeless wires relationships — `aria-controls`,
`aria-expanded`, `id`, `hidden` — and never writes content. A `role="dialog"` surface still needs
your `aria-labelledby`.

**The markup you author is the markup that ships.** Components are usable before JavaScript runs.
Never gate authored markup behind a loaded state, and never expect a component to generate visual
anatomy for you.

## Imports and registration

Stylesheets and element registration are separate, explicit, and per-component.

```js
import '@timelessui/components/css/tokens.css' // required once, by every component
import '@timelessui/components/css/tabs.css'
import '@timelessui/components/define/ui-tabs' // only for custom elements
```

- `tokens.css` is required by every component. Load it once.
- One stylesheet per component root — `reference/contracts.md` names them. There is also an
  aggregate stylesheet when you would rather not track them individually.
- Registration is only for custom elements. A CSS component has nothing to register, so if you are
  importing a `define/` entrypoint for one, it does not exist.
- A custom element that never upgrades is almost always a missing `define/` import.

Styling is CSS. Import order matters because Timeless ships in cascade layers (`ui.tokens`,
`ui.components`, `ui.utilities`) — consumer CSS outside those layers wins without specificity
fights, so restyle with your own selectors or the component's custom properties rather than fighting
the library.

## Finding the exact contract

`reference/contracts.md`, alongside this file, is generated from the same declaration the
stylesheets are validated against. It lists every root, its kind, its configuration attributes with
the name of each attribute's value set, its authored parts, and its stylesheets.

For the permitted values themselves, the element API, public state, custom properties, keyboard
behavior, and canonical copyable markup, fetch the component's reference page as Markdown:

```
https://timeless.build/docs/components/<component>.md
```

The index of every page, including the guides, is at `https://timeless.build/llms.txt`. Value sets
are also exported as `as const` arrays from the package root — import the array rather than retyping
a list.

## Verifying your markup

Before finishing, check the markup against `reference/contracts.md`:

1. Each root is spelled as the reference spells it, and configured the way its kind requires.
2. No `data-ui-*` on a custom-element host, and no plain configuration attribute on a class root.
3. No boolean attribute carries a value.
4. Every required part is present.
5. No `data-ui-internal-*` anywhere.
6. Every stylesheet is imported, and every custom element used is registered.
