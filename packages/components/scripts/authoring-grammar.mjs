/**
 * The single declaration of the Timeless authoring grammar.
 *
 * Milestone 027 first shipped this prose in four hand-written places — the `/llms.txt` preamble, the
 * agent skill, `context7.json`'s rules, and the paste-able block on the agents documentation page. All
 * four deliberately named no attribute, value, or root, so ordinary component work could not
 * invalidate them; but a change to the grammar *itself* would have silently left four copies
 * disagreeing, and nothing in the repository could have caught it.
 *
 * So the grammar is declared once, here, and every consumer is generated from it. There is no second
 * copy to update and `pnpm generate:check` fails the build the moment a generated copy drifts.
 *
 * What belongs in this file: the *shape* of the API — the two kinds of component, how each is
 * configured, and the rules that apply to both. What does not: any component name, attribute name, or
 * permitted value. Those come from `component-registry.mjs`, are proven against the stylesheets by
 * `validate-contracts.mjs`, and reach agents through `reference/contracts.md` and the per-component
 * `.md` routes. The illustrative examples below are the one exception, and they are chosen from the
 * grammar's own failure modes rather than to document a component.
 */

/** One-paragraph description of the library, used where a summary is expected. */
export const summary = `Framework-agnostic UI components built on modern web standards. Most components are plain CSS over
native HTML and need no JavaScript; the rest are Light-DOM custom elements, used only where keyboard
coordination, focus management, or state synchronisation cannot be expressed accessibly in CSS.
Targets Baseline 2025 browsers. Usable from plain HTML, React, Preact, Vue, Svelte, Solid, or Astro.`

/**
 * The two kinds of component. This distinction is the whole reason these artifacts exist: a model
 * arriving with a React prior configures both kinds the same way, and is wrong about one of them.
 */
export const kinds = [
  {
    label: 'CSS components',
    body: 'a native element carrying a `ui-*` class. Configure them with `data-ui-*` attributes. There is nothing to register and nothing to import beyond the stylesheet.',
    example: '<button class="ui-button" type="button" data-ui-variant="primary">Publish</button>',
  },
  {
    label: 'Custom elements',
    body: 'a registered `ui-*` tag wrapping your own markup. Configure them with plain attributes, never `data-ui-*`. Register each element you use.',
    example:
      '<ui-tabs orientation="vertical" activation="manual">\n  <!-- your own tablist and panels -->\n</ui-tabs>',
  },
]

/** The two ways the kinds get confused, stated as the corrections an agent needs. */
export const corrections = [
  '`<ui-button variant="primary">` is wrong twice — there is no `ui-button` element, and `variant` is not how a CSS component is configured. It is `<button class="ui-button" data-ui-variant="primary">`.',
  '`<ui-tabs data-ui-orientation="vertical">` is wrong — host configuration on a custom element uses plain attributes. It is `<ui-tabs orientation="vertical">`.',
]

/**
 * Rules that hold for both kinds.
 *
 * `rule` is the imperative one-liner: it is what `context7.json` carries and what the verification
 * checklist is built from. `detail` is the explanation, used wherever there is room for prose. Keep
 * `rule` self-contained — it has to make sense with no `detail` beside it.
 */
export const rules = [
  {
    rule: 'Boolean attributes are presence-based. Author the attribute with no value, or omit it.',
    detail:
      '`invalid`, `wrap`, and `attached` are booleans. `invalid="true"` and `data-ui-invalid="true"` are not valid and will not match the stylesheet.',
  },
  {
    rule: "Component anatomy is authored by you and marked with a whitespace-separated `data-ui-part` token list, selected with `[data-ui-part~='name']`.",
    detail:
      "Parts documented as required must be present for the component to work — a tab set with no `[role='tablist']` has nothing to coordinate.",
  },
  {
    rule: 'A few parts accept per-item input of their own, spelled `data-ui-*` on the part. Each component page lists them.',
    detail:
      'An option carries `data-ui-value` when its text is not the value it submits, and `data-ui-label` when its visible content is not what a reader would type to find it. A bare `value` works only on an element where HTML already defines it, which a `<div role="option">` is not.',
  },
  {
    rule: 'Never author `data-ui-internal-*`. Those are private runtime hooks.',
    detail:
      'They are written by the component, they are not styleable, and they change without notice.',
  },
  {
    rule: 'Native HTML semantics, ARIA, and platform pseudo-classes are authoritative for state. Do not add your own state classes, and do not use ARIA to replace behavior a real element provides.',
    detail:
      "Style `:disabled`, `[aria-expanded='true']`, `:state(--open)` and the like. Use a real `<button>`, a real `<dialog>`, a real `popover`.",
  },
  {
    rule: 'Accessible names are always yours to supply.',
    detail:
      'Timeless wires relationships — `aria-controls`, `aria-expanded`, `id`, `hidden` — and never writes content. A `role="dialog"` surface still needs your `aria-labelledby`.',
  },
  {
    rule: 'The markup you author is the markup that ships. Components are usable before JavaScript runs.',
    detail:
      'Never gate authored markup behind a loaded state, and never expect a component to generate visual anatomy for you.',
  },
  {
    rule: 'Import stylesheets from `@timelessui/components/css/<file>` and register custom elements from `@timelessui/components/register/<tag>`, which registers as it is imported. `tokens.css` and `core/<component>.css` are required — core is behavior, not appearance — while `themes/atmosphere/<component>.css` is the optional look. Registration is per-element and explicit.',
    detail:
      'A CSS component has nothing to register. `register/<tag>` is a side-effect import and needs no call; `define/<tag>` is the same registration as a function you call yourself, `define<Name>Element()`, for when you need to control the timing or target another window. Importing `define/<tag>` and calling nothing registers nothing, which is the usual reason a custom element never upgrades.',
  },
]

/** Where the facts this file refuses to state actually live. */
export const lookup = {
  componentUrl: 'https://timeless.build/docs/components/<component>.md',
  indexUrl: 'https://timeless.build/llms.txt',
  rule: 'Before guessing an attribute or a value, fetch the component contract rather than inferring it.',
}

/**
 * The grammar as Markdown, used verbatim by `/llms.txt`, by the agent skill, and by the paste-able
 * block on the agents documentation page.
 *
 * @param {{ heading?: number, includeExamples?: boolean, includeDetail?: boolean }} [options]
 */
export function renderGrammar({ heading = 2, includeExamples = true, includeDetail = true } = {}) {
  const h = '#'.repeat(heading)
  const sub = '#'.repeat(heading + 1)
  const lines = [
    `${h} How to author Timeless markup`,
    '',
    'Read this before writing any Timeless markup. The API is not prop-based, and guessing from React',
    'or Tailwind conventions produces markup that does not work.',
    '',
    `${sub} The two kinds of component`,
    '',
    'Everything in the library is one of two things, and they are configured differently. Getting this',
    'wrong is the single most common failure.',
    '',
  ]

  for (const kind of kinds) {
    lines.push(`**${kind.label}** are ${kind.body}`, '')
    if (includeExamples) lines.push('```html', kind.example, '```', '')
  }

  lines.push('So:', '')
  for (const correction of corrections) lines.push(`- ${correction}`)
  lines.push('')

  lines.push(`${sub} Rules that apply to both kinds`, '')
  for (const entry of rules) {
    lines.push(includeDetail ? `- **${entry.rule}** ${entry.detail}` : `- ${entry.rule}`)
  }
  lines.push('')

  lines.push(`${sub} Finding the exact contract`, '')
  lines.push(
    `${lookup.rule} Every component's full contract — permitted attributes and values, authored parts,`,
    'public state, custom properties, the element API, keyboard behavior, and canonical markup — is at',
    `\`${lookup.componentUrl}\`. The index of every page is at \`${lookup.indexUrl}\`.`,
    '',
  )

  return lines.join('\n')
}

/** The imperative one-liners, for consumers that take a list of rules rather than prose. */
export function grammarRules() {
  return [
    `Timeless has two kinds of component, configured differently. ${kinds
      .map((kind) => `${kind.label} are ${kind.body}`)
      .join(' ')}`,
    ...corrections,
    ...rules.map((entry) => entry.rule),
    `${lookup.rule} It is at \`${lookup.componentUrl}\`, indexed at \`${lookup.indexUrl}\`.`,
  ]
}
