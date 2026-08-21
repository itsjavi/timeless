/**
 * Canonical inventory of every public Timeless component.
 *
 * This file is the single declaration of public roots, configuration attributes and their permitted
 * values, authored parts, public state, component CSS variables, and events. `generate-elements.mjs`
 * projects it into `src/values.ts`, `src/contracts.ts`, `custom-elements.json`, the define
 * entrypoints, the framework typings, and the editor data files. `validate-contracts.mjs` proves the
 * declared values against the stylesheets in both directions, so a value documented here is a value
 * the CSS actually implements.
 *
 * Permitted values live in `valueSets` below and are referenced by name, so each set is written once
 * and every consumer of it — contracts, manifest, typings, editor data, stories — reads the same
 * list. A component still chooses which set it implements: `data-ui-density` resolves to three
 * values on Field and two on Alert because that is what those stylesheets implement.
 */

/**
 * `type` describes what an author writes in HTML. `property` describes the DOM property that
 * reflects the attribute, which is not always the attribute name: `ui-popover` reflects `role`
 * through `roleValue`, and `ui-toggle-group`'s CSS-only `attached` reflects nothing at all.
 *
 * `set` names an entry in `valueSets`, which is where the permitted values themselves are written.
 * An attribute with no `set` takes free-form input such as an element id or a CSS color.
 *
 * @param {string} name
 * @param {string} type
 * @param {{
 *   set?: string,
 *   default?: string,
 *   description?: string,
 *   property?: false | { name: string, type?: string, live?: string },
 * }} [options]
 */
const attribute = (name, type, options = {}) => {
  if (options.set !== undefined && !Object.hasOwn(valueSets, options.set)) {
    throw new Error(`Attribute ${name} references the undeclared value set ${options.set}`)
  }
  return {
    name,
    type,
    ...(options.set ? { set: options.set, values: valueSets[options.set].values } : {}),
    ...(options.default === undefined ? {} : { default: options.default }),
    description: options.description ?? '',
    property: options.property === undefined ? { name } : options.property,
  }
}

/** The authored-default plus live-value property pair used by every value-bearing collection. */
const valueProperty = { name: 'defaultValue', type: 'string', live: 'value' }

/**
 * `attributes` declares what an author may write *on the part itself*, which is a different surface
 * from the root configuration in `attributes` on the component. A part attribute is per-item input
 * the behavior reads — an option's value, a tab's value — never something a stylesheet selects, so
 * `validate-contracts.mjs` keeps the two sets apart and `check-markup.mjs` checks a part's
 * attributes against the part rather than against the nearest root.
 */
const part = (
  name,
  required = false,
  selector = `[data-ui-part~='${name}']`,
  description = '',
  attributes = [],
) => ({
  name,
  required,
  selector,
  description,
  attributes,
})

/**
 * The per-item value and label every collection option accepts. Declared once because all three
 * collections resolve them through the same `options.ts` helpers, and because a consumer reading one
 * component's reference page should see the same contract as the next.
 */
const OPTION_DATA_ATTRIBUTES = () => [
  attribute('data-ui-value', 'string', {
    property: false,
    description:
      'The value this option submits, when its text is not the value. `value` wins over it, and its own text is the fallback.',
  }),
  attribute('data-ui-label', 'string', {
    property: false,
    description:
      'The text filtering and typeahead match against, when the visible content is not what a reader would type. `label` wins over it, then this, then `aria-label`, then the option text. None of the four change the accessible name.',
  }),
]

const state = (name, source, isPublic = true, description = '') => ({
  name,
  source,
  public: isPublic,
  description,
})

/**
 * A CSS custom property a consumer may set to restyle the component. Distinct from the global
 * Atmosphere tokens the component reads, which are documented once in the theming guide.
 */
const variable = (name, description) => ({ name, description })

/**
 * Keyboard and focus behavior, for the accessibility section of each component page.
 *
 * `pattern` is an ARIA Authoring Practices pattern slug, or `null` where the APG has no pattern for
 * the composition — `patternLabel` then names what the component documents instead, and `notes`
 * carries the reasoning. Inventing a slug to fill the gap would document ARIA nobody specified.
 * `keys` documents only what the component itself implements — keys the platform already handles are called out in `notes` instead, because
 * "the browser does this" is the more useful fact for a progressive-enhancement library.
 */
const accessibility = (pattern, patternLabel, keys = [], notes = '') => ({
  pattern,
  patternLabel,
  keys,
  notes,
})

const key = (name, action) => ({ key: name, action })

/**
 * Arrow, Home, and End navigation shared by every roving-focus collection.
 *
 * A `Page Up / Page Down` row used to sit here, and `collectionNavigationTarget` never implemented
 * it — five components documented a jump-ten shortcut that did nothing, in the reference pages, in
 * `contracts.ts`, in `llms-full.txt`, and in the contract table shipped inside the package's agent
 * skill. The APG asks for it in none of those patterns, so the row went rather than the behavior
 * arriving — it also read "Jump ten checkboxs at a time", because the plural was `${subject}s`.
 * `check-keyboard-contracts.mjs` is what stops the next one.
 */
const COLLECTION_KEYS = (subject, axis = 'orientation') => [
  key(
    'Arrow keys',
    `Move focus to the previous or next ${subject}, following the ${axis} and skipping disabled ones.`,
  ),
  key('Home / End', `Move focus to the first or last enabled ${subject}.`),
]

/**
 * The anatomy every option collection shares.
 *
 * Listbox, Select, and Combobox are one ARIA family over one option core, so they document one
 * vocabulary. Only the option container itself differs: on `ui-listbox` the host is the listbox, so
 * the part is required; on the two popover surfaces it is an authored child.
 *
 * `header` and `footer` sit inside the surface but outside option navigation. Arrow keys skip them
 * and `Tab` reaches them, which is stated in each accessibility note because a control inside a
 * `role="listbox"` that arrows skip otherwise reads as a bug.
 */
const COLLECTION_PARTS = () => [
  part(
    'option',
    true,
    "[role='option']",
    'One option. Its value comes from `value`, then `data-ui-value`, then its text. Mark unavailable options `aria-disabled="true"`.',
    OPTION_DATA_ATTRIBUTES(),
  ),
  part(
    'option-indicator',
    false,
    undefined,
    'Decorative affordance inside an option showing that it is selected. Style it from `[aria-selected="true"]`; it is hidden from assistive technology.',
  ),
  part(
    'group',
    false,
    undefined,
    'A `role="group"` wrapper around related options. Options inside it stay navigable, and the group collapses when every option it holds is filtered out.',
  ),
  part(
    'group-label',
    false,
    undefined,
    'The label for a `group`, wired to it with `aria-labelledby`.',
  ),
  part(
    'separator',
    false,
    "[role='separator']",
    'A visual divider between options. Navigation and typeahead skip it.',
  ),
  part(
    'empty',
    false,
    undefined,
    'Shown when no option is visible. Hidden again as soon as one is.',
  ),
  part(
    'status',
    false,
    undefined,
    'A `role="status" aria-live="polite"` region for result counts, loading, and errors.',
  ),
  part(
    'header',
    false,
    undefined,
    'Optional content at the top of the surface. Excluded from arrow navigation and reachable with `Tab`.',
  ),
  part(
    'footer',
    false,
    undefined,
    'Optional content at the bottom of the surface. Excluded from arrow navigation and reachable with `Tab`.',
  ),
  part(
    'pager',
    false,
    undefined,
    'Wraps the page controls. Hidden unless `page-size` is set and the options span more than one page.',
  ),
  part(
    'page-previous',
    false,
    undefined,
    'Moves to the previous page. Stays focusable at the first page and takes `aria-disabled`, so the boundary is discoverable rather than gone.',
  ),
  part('page-next', false, undefined, 'Moves to the next page, with the same boundary behavior.'),
  part(
    'page-status',
    false,
    undefined,
    'A `role="status" aria-live="polite"` region announcing the current page.',
  ),
]

/**
 * The two parts that give an overlay panel its accessible name and description.
 *
 * Dialog and Sheet both hand a `<dialog>` dialog semantics, and both used to delegate naming to a
 * prose note — so every consumer hand-wrote two ids and two ARIA attributes. Declaring the parts
 * means enhancement can wire the relationship and the anatomy table can say so.
 *
 * The selector accepts a heading or paragraph in the panel `<header>` without a token, because that
 * is the shape both stylesheets already draw; asking for a token as well would be a second contract
 * for the same element.
 */
const OVERLAY_NAMING_PARTS = (subject) => [
  part(
    'title',
    false,
    "[data-ui-part~='title'], header > :where(h1, h2, h3)",
    `Names the ${subject}. Timeless points the panel's \`aria-labelledby\` at it, generating an id only if you left one off. A heading in the panel \`<header>\` counts without the token. An \`aria-labelledby\` you author always wins.`,
  ),
  part(
    'description',
    false,
    "[data-ui-part~='description'], header > p",
    `Supporting line under the title, wired with \`aria-describedby\` the same way. A \`<p>\` in the panel \`<header>\` counts without the token.`,
  ),
]

/** The multiple-selection and clear anatomy the two popover surfaces share. */
const COLLECTION_TRIGGER_PARTS = () => [
  part(
    'chips',
    false,
    undefined,
    'Container the selected values are rendered into under `multiple`.',
  ),
  part(
    'chip-template',
    false,
    "template[data-ui-part~='chip-template']",
    'A `<template>` holding the markup for one chip. Timeless clones it per selected value and fills it in, so every element and class in a chip is yours. Without it a `chips` container receives a plain comma-separated summary instead.',
  ),
  part('chip', false, undefined, 'One selected value, authored inside `chip-template`.'),
  part(
    'chip-label',
    false,
    undefined,
    'Where the selected label is written inside a chip. Omit it only when the chip has no other content.',
  ),
  part(
    'chip-remove',
    false,
    undefined,
    'Removes its chip. Author it as a real button; Timeless writes the value it removes onto it as `data-ui-value` and gives it an accessible name naming that value, since one shared template cannot. An `aria-label` you author wins.',
  ),
  part(
    'clear',
    false,
    undefined,
    'Empties the whole selection. Marked `aria-disabled="true"` while there is nothing to clear, rather than `disabled`, so activating it cannot disable the control that holds focus.',
  ),
]

/** The configuration Select and Combobox share, beyond what each declares for itself. */
const COLLECTION_ATTRIBUTES = () => [
  attribute('align', 'string', {
    set: 'collectionAlignments',
    default: 'start',
    description:
      'Which edge of the trigger the surface aligns to. The surface is never narrower than the trigger.',
  }),
  attribute('filter', 'string', {
    set: 'optionFilterModes',
    default: 'contains',
    description:
      'How typed text narrows the options. `off` hands visibility to you: listen for `ui-input` and set `hidden` yourself, and navigation, the empty state, group collapse, and paging all follow.',
  }),
  attribute('multiple', 'boolean', {
    description:
      'Present to allow more than one selected option. Selected values render as chips and submit one form entry each under the same `name`.',
  }),
]

/** Form participation, identical on all three collections. */
const FORM_ATTRIBUTES = () => [
  attribute('name', 'string', {
    description: 'Form field name. The element submits its own value through `ElementInternals`.',
  }),
  attribute('required', 'boolean', {
    description: 'Present to block submission while nothing is selected, with `valueMissing`.',
  }),
  attribute('disabled', 'boolean', {
    description:
      'Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
  }),
  attribute('page-size', 'number', {
    property: { name: 'pageSize', type: 'string' },
    description:
      'Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property.',
  }),
]

const event = (name, type, description, cancelable = false) => ({
  name,
  type,
  description,
  cancelable,
})

const css = (
  name,
  root,
  stylesheet,
  attributes = [],
  parts = [],
  states = [],
  variables = [],
  a11y = null,
) => ({
  name,
  kind: 'css',
  root: { kind: 'class', name: root },
  css: [stylesheet].flat(),
  attributes,
  parts,
  states,
  variables,
  events: [],
  accessibility: a11y,
})

/**
 * A contract for a component that is a *configuration* of another component's element, not an
 * element of its own. The root is the selector that selects it, so the reference gets a real page
 * with its own anatomy, variables, and accessibility pattern, while the runtime keeps exactly one
 * registered element. Tooltip is Hover Card with `variant="tooltip"`; adding a `ui-tooltip` tag
 * would mean a second element, define entrypoint, and manifest declaration for the same controller.
 *
 * `kind` stays `css` because the contract declares styling over authored markup and contributes no
 * element. `uiAttributes` skips it: the root is not a class, so there is nothing to spread.
 */
const selector = (
  name,
  root,
  stylesheet,
  attributes = [],
  parts = [],
  states = [],
  variables = [],
  a11y = null,
) => ({
  name,
  kind: 'css',
  root: { kind: 'selector', name: root },
  css: [stylesheet].flat(),
  attributes,
  parts,
  states,
  variables,
  events: [],
  accessibility: a11y,
})

/**
 * `stylesheet` takes an array when a component's CSS is split across files. `validate-contracts.mjs`
 * requires the root selector to appear in *every* stylesheet a contract claims, which is what keeps
 * a shared stylesheet honest: `options.css` may be attributed to all three collection surfaces only
 * because it selects all three roots.
 */
const customElement = (
  name,
  tag,
  module,
  classExport,
  factory,
  defineExport,
  stylesheet,
  attributes = [],
  parts = [],
  states = [],
  variables = [],
  events = [],
  a11y = null,
) => ({
  name,
  kind: 'custom-element',
  root: { kind: 'element', name: tag },
  tag,
  module,
  classExport,
  factory,
  defineExport,
  css: [stylesheet].flat(),
  attributes,
  parts,
  states,
  variables,
  events,
  accessibility: a11y,
})

/**
 * Every public attribute value set, declared exactly once.
 *
 * `generate-elements.mjs` emits each entry into `src/values.ts` as an `as const` array under the key
 * used here plus a union type under `type`, and the module named by `module` re-exports both. That
 * makes this table the only place a permitted value is written: the stylesheets prove it, the
 * contracts render it, the manifest types it, the framework typings complete it, and
 * `validate-contracts.mjs` fails when the two disagree.
 *
 * Sets with identical values still get separate names when they are separate public exports.
 * `buttonSizes`, `primitiveSizes`, and `formControlSizes` are all `sm | md | lg`, and a consumer
 * importing one of them must keep getting that name back.
 */
export const valueSets = {
  buttonVariants: {
    type: 'ButtonVariant',
    module: 'button',
    values: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'danger-outline', 'link'],
  },
  buttonSizes: { type: 'ButtonSize', module: 'button', values: ['sm', 'md', 'lg'] },
  alertVariants: {
    type: 'AlertVariant',
    module: 'primitives',
    values: ['neutral', 'accent', 'success', 'warning', 'danger'],
  },
  spinnerVariants: {
    type: 'SpinnerVariant',
    module: 'primitives',
    values: ['neutral', 'accent', 'success', 'warning', 'danger'],
  },
  badgeVariants: {
    type: 'BadgeVariant',
    module: 'primitives',
    values: ['neutral', 'accent', 'success', 'warning', 'danger', 'outline'],
  },
  avatarShapes: {
    type: 'AvatarShape',
    module: 'primitives',
    values: ['circle', 'rounded', 'square'],
  },
  avatarStatuses: {
    type: 'AvatarStatus',
    module: 'primitives',
    values: ['online', 'away', 'busy', 'offline'],
  },
  cardVariants: {
    type: 'CardVariant',
    module: 'primitives',
    values: ['surface', 'filled', 'ghost'],
  },
  linkVariants: {
    type: 'LinkVariant',
    module: 'primitives',
    values: ['default', 'muted', 'danger'],
  },
  listVariants: {
    type: 'ListVariant',
    module: 'primitives',
    values: ['plain', 'divided', 'inset'],
  },
  separatorVariants: {
    type: 'SeparatorVariant',
    module: 'primitives',
    values: ['default', 'strong', 'centered'],
  },
  separatorOrientations: {
    type: 'SeparatorOrientation',
    module: 'primitives',
    values: ['horizontal', 'vertical'],
  },
  skeletonShapes: {
    type: 'SkeletonShape',
    module: 'primitives',
    values: ['text', 'circle', 'media'],
  },
  skeletonWidths: {
    type: 'SkeletonWidth',
    module: 'primitives',
    values: ['full', 'medium', 'short'],
  },
  groupOrientations: {
    type: 'GroupOrientation',
    module: 'primitives',
    values: ['horizontal', 'vertical'],
  },
  primitiveSizes: { type: 'PrimitiveSize', module: 'primitives', values: ['sm', 'md', 'lg'] },
  primitiveDensities: {
    type: 'PrimitiveDensity',
    module: 'primitives',
    values: ['compact', 'normal', 'spacious'],
  },
  compactDensities: {
    type: 'CompactDensity',
    module: 'primitives',
    values: ['compact', 'normal'],
  },
  tableAlignments: { type: 'TableAlignment', module: 'primitives', values: ['start', 'end'] },
  breadcrumbSeparators: {
    type: 'BreadcrumbSeparator',
    module: 'primitives',
    values: ['chevron', 'slash'],
  },
  formControlSizes: { type: 'FormControlSize', module: 'forms', values: ['sm', 'md', 'lg'] },
  fieldLayouts: { type: 'FieldLayout', module: 'forms', values: ['stacked', 'inline'] },
  formDensities: {
    type: 'FormDensity',
    module: 'forms',
    values: ['compact', 'normal', 'spacious'],
  },
  choiceGroupOrientations: {
    type: 'ChoiceGroupOrientation',
    module: 'forms',
    values: ['vertical', 'horizontal'],
  },
  floatingPlacements: {
    type: 'FloatingPlacement',
    module: 'floating',
    values: ['bottom', 'top', 'right', 'left'],
  },
  collectionAlignments: {
    type: 'CollectionAlignment',
    module: 'options',
    values: ['start', 'end'],
  },
  optionFilterModes: {
    type: 'OptionFilterMode',
    module: 'options',
    values: ['contains', 'starts-with', 'off'],
  },
  tabsOrientations: { type: 'TabsOrientation', module: 'tabs', values: ['horizontal', 'vertical'] },
  tabsActivations: { type: 'TabsActivation', module: 'tabs', values: ['automatic', 'manual'] },
  dialogKinds: { type: 'DialogKind', module: 'dialog', values: ['dialog', 'alert'] },
  sheetPositions: {
    type: 'SheetPosition',
    module: 'sheet',
    values: ['top', 'right', 'bottom', 'left'],
  },
  popoverRoles: {
    type: 'PopoverRole',
    module: 'popover',
    values: ['dialog', 'menu', 'listbox', 'tooltip'],
  },
  hoverCardVariants: { type: 'HoverCardVariant', module: 'hover-card', values: ['tooltip'] },
  menuOrientations: { type: 'MenuOrientation', module: 'menu', values: ['horizontal', 'vertical'] },
  toolbarOrientations: {
    type: 'ToolbarOrientation',
    module: 'toolbar',
    values: ['horizontal', 'vertical'],
  },
  toasterPlacements: {
    type: 'ToasterPlacement',
    module: 'toast',
    values: ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'],
  },
  toasterStacks: { type: 'ToasterStack', module: 'toast', values: ['overlap', 'list'] },
  toggleGroupOrientations: {
    type: 'ToggleGroupOrientation',
    module: 'toggle-group',
    values: ['horizontal', 'vertical'],
  },
  toggleGroupSelections: {
    type: 'ToggleGroupSelection',
    module: 'toggle-group',
    values: ['single', 'multiple'],
  },
  colorPickerFormats: {
    type: 'ColorPickerFormat',
    module: 'color-picker',
    values: ['oklch', 'oklab', 'lch', 'lab', 'hex', 'rgb', 'hsl', 'hwb', 'p3', 'rec2020'],
  },
}

const size = (set, description = 'Control height, padding, and font size.') =>
  attribute('data-ui-size', 'string', { set, default: 'md', description })

const density = (set, description = 'Internal spacing.') =>
  attribute('data-ui-density', 'string', { set, default: 'normal', description })

/**
 * `detail` names the element's own exported detail type rather than the shared
 * `UITransitionDetail`, so the manifest and every generated framework typing hand a consumer the
 * value type the element actually dispatches.
 */
const transitionEvents = (subject, detail) => [
  event(
    'ui-before-change',
    `CustomEvent<${detail}>`,
    `Cancelable proposal dispatched before ${subject} changes. Call \`preventDefault()\` to reject the transition and keep the current value.`,
    true,
  ),
  event(
    'ui-change',
    `CustomEvent<${detail}>`,
    `Dispatched after ${subject} has changed. Bubbles and is composed.`,
  ),
]

const overlayEvents = (subject, detail) => [
  event('ui-open', `CustomEvent<${detail}>`, `Dispatched after the ${subject} opens.`),
  event('ui-close', `CustomEvent<${detail}>`, `Dispatched after the ${subject} closes.`),
]

const pageEvent = (detail) =>
  event(
    'ui-page',
    `CustomEvent<${detail}>`,
    'Dispatched after the rendered page of a paged list changes.',
  )

/**
 * Query and paging. `ui-input` belongs only to the two surfaces that own a text field: an inline
 * listbox has nothing to type into, so declaring it there would document an event that never fires.
 */
const collectionEvents = (inputDetail, pageDetail) => [
  event(
    'ui-input',
    `CustomEvent<${inputDetail}>`,
    'Dispatched when the query text changes, before options are filtered. Under `filter="off"` this is where you set `hidden` yourself.',
  ),
  pageEvent(pageDetail),
]

export const components = [
  css(
    'button',
    'ui-button',
    ['core/button.css', 'themes/atmosphere/button.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'buttonVariants',
        default: 'primary',
        description:
          'Visual intent. Use `primary` for the main action in a view, `secondary` for neutral actions, `outline` when the action needs a stronger edge, `ghost` for low-emphasis toolbar actions, `danger` and `danger-outline` for destructive actions, and `link` for an action that should read as inline text.',
      }),
      size('buttonSizes'),
    ],
    [],
    [state('disabled', 'native', true, 'Native `disabled`, or `aria-disabled` on an anchor.')],
    [
      variable('--ui-button-bg', 'Resting background.'),
      variable('--ui-button-bg-hover', 'Hover background.'),
      variable('--ui-button-bg-active', 'Active background.'),
      variable('--ui-button-fg', 'Label color.'),
      variable('--ui-button-fg-hover', 'Hover label color.'),
      variable('--ui-button-border', 'Border color.'),
      variable('--ui-button-shadow', 'Resting shadow.'),
      variable('--ui-button-shadow-hover', 'Hover shadow.'),
      variable('--ui-button-shadow-active', 'Active shadow.'),
      variable('--ui-button-height', 'Minimum block size.'),
      variable('--ui-button-padding-x', 'Inline padding.'),
      variable('--ui-button-gap', 'Gap between icon and label.'),
      variable('--ui-button-radius', 'Corner radius.'),
    ],
  ),
  css(
    'toggle',
    'ui-toggle',
    ['core/toggle.css', 'themes/atmosphere/toggle.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'buttonVariants',
        default: 'primary',
        description:
          'Visual intent, resolved by `themes/atmosphere/button.css`. Author `class="ui-button ui-toggle"` so the shared button styling applies.',
      }),
      size(
        'buttonSizes',
        'Control height, padding, and font size. Resolved by `themes/atmosphere/button.css`.',
      ),
    ],
    [],
    [
      state('pressed', 'aria', true, 'Author `aria-pressed="true"` or `"false"`; never omit it.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'alert',
    'ui-alert',
    ['core/alert.css', 'themes/atmosphere/alert.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'alertVariants',
        default: 'neutral',
        description:
          'Status intent. This is styling only — set `role="status"` or `role="alert"` yourself to control how assistive technology announces the message.',
      }),
      density('compactDensities'),
    ],
    [
      part('icon', false, undefined, 'Decorative status icon. Mark it `aria-hidden="true"`.'),
      part('content', false, undefined, 'Wrapper for the title and description.'),
      part('title', false, undefined, 'Short summary line.'),
      part('description', false, undefined, 'Supporting detail.'),
      part('actions', false, undefined, 'Container for one or two follow-up actions.'),
    ],
    [],
    [],
    accessibility(
      'alert',
      'Alert',
      [],
      'The role is yours to choose, and it depends on when the alert appears. Something rendered with the page is not an alert at all — give it `role="status"`, or no role and a heading, because a live region announces *changes* and there is no change on first paint. Something inserted in response to what the user just did is a live region: `role="status"` to wait its turn, `role="alert"` to interrupt, and the latter only when the message cannot wait. The `icon` part is decorative and must be hidden from assistive technology; `data-ui-variant` carries no meaning on its own, so say in the text what the colour implies.',
    ),
  ),
  css(
    'avatar',
    'ui-avatar',
    ['core/avatar.css', 'themes/atmosphere/avatar.css'],
    [
      size('primitiveSizes', 'Avatar diameter.'),
      attribute('data-ui-shape', 'string', {
        set: 'avatarShapes',
        default: 'circle',
        description: 'Corner treatment.',
      }),
      attribute('data-ui-status', 'string', {
        set: 'avatarStatuses',
        description:
          'Presence indicator color. Omit the attribute to hide the indicator. The dot is decorative, so also expose the status in text.',
      }),
    ],
    [
      part('image', false, undefined, 'The `<img>`. Give it an empty `alt` when a label follows.'),
      part('fallback', false, undefined, 'Initials or icon shown when no image loads.'),
      part('status', false, undefined, 'Presence dot. Decorative; keep it `aria-hidden="true"`.'),
    ],
  ),
  css(
    'badge',
    'ui-badge',
    ['core/badge.css', 'themes/atmosphere/badge.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'badgeVariants',
        default: 'neutral',
        description: 'Status intent.',
      }),
      size('primitiveSizes', 'Badge height and font size.'),
    ],
    [part('dot', false, undefined, 'Leading status dot. Decorative.')],
  ),
  css(
    'separator',
    'ui-separator',
    ['core/separator.css', 'themes/atmosphere/separator.css'],
    [
      attribute('data-ui-orientation', 'string', {
        set: 'separatorOrientations',
        default: 'horizontal',
        description:
          'Rule direction. Also set `aria-orientation="vertical"` on an `<hr>` when you change this.',
      }),
      attribute('data-ui-variant', 'string', {
        set: 'separatorVariants',
        default: 'default',
        description:
          'Line weight and label placement. `centered` positions the label part in the middle of the rule.',
      }),
    ],
    [part('label', false, undefined, 'Optional inline label rendered over the rule.')],
  ),
  css(
    'card',
    'ui-card',
    ['core/card.css', 'themes/atmosphere/card.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'cardVariants',
        default: 'surface',
        description: 'Background and border treatment.',
      }),
      density('compactDensities'),
    ],
    [
      part('header', false, undefined, 'Top region, usually the title and meta.'),
      part('body', false, undefined, 'Main content region.'),
      part('footer', false, undefined, 'Bottom region, usually actions.'),
      part('title', false, undefined, 'Card heading. Use a real heading element.'),
      part('description', false, undefined, 'Supporting copy under the title.'),
      part('meta', false, undefined, 'Secondary metadata such as a category or date.'),
      part('actions', false, undefined, 'Container for card actions.'),
    ],
  ),
  css(
    'skeleton',
    'ui-skeleton',
    ['core/skeleton.css', 'themes/atmosphere/skeleton.css'],
    [
      size('primitiveSizes', 'Line height for the `text` shape, diameter for `circle`.'),
      attribute('data-ui-shape', 'string', {
        set: 'skeletonShapes',
        default: 'text',
        description: 'Placeholder geometry.',
      }),
      attribute('data-ui-width', 'string', {
        set: 'skeletonWidths',
        default: 'full',
        description: 'Inline size, so a group of lines can look like real text.',
      }),
    ],
  ),
  css(
    'progress',
    'ui-progress',
    ['core/progress.css', 'themes/atmosphere/progress.css'],
    [size('primitiveSizes', 'Track thickness and label size.'), density('compactDensities')],
    [
      part('header', false, undefined, 'Row holding the label and output.'),
      part('output', false, undefined, 'Live percentage or count. Use `<output>`.'),
      part('hint', false, undefined, 'Supporting text under the track.'),
    ],
  ),
  css('link', 'ui-link', 'themes/atmosphere/link.css', [
    attribute('data-ui-variant', 'string', {
      set: 'linkVariants',
      default: 'default',
      description: 'Link color intent.',
    }),
  ]),
  css('kbd', 'ui-kbd', ['core/kbd.css', 'themes/atmosphere/kbd.css']),
  css('code', 'ui-code', ['core/code.css', 'themes/atmosphere/code.css']),
  css(
    'group',
    'ui-group',
    ['core/group.css', 'themes/atmosphere/group.css'],
    [
      attribute('data-ui-orientation', 'string', {
        set: 'groupOrientations',
        default: 'horizontal',
        description: 'Layout direction of the grouped controls.',
      }),
      density('primitiveDensities', 'Gap between grouped controls.'),
      attribute('data-ui-wrap', 'boolean', {
        description: 'Present to let the group wrap onto multiple lines.',
      }),
      attribute('data-ui-attached', 'boolean', {
        description:
          'Present to collapse the gap and join adjacent controls into one segmented control.',
      }),
    ],
  ),
  css(
    'list',
    'ui-list',
    ['core/list.css', 'themes/atmosphere/list.css'],
    [
      attribute('data-ui-variant', 'string', {
        set: 'listVariants',
        default: 'plain',
        description:
          'Row treatment. Numbering is the element\'s job, not the attribute\'s: use `<ol class="ui-list">` for a numbered list and `<ul class="ui-list">` for an unnumbered one.',
      }),
      density('compactDensities', 'Row padding.'),
    ],
    [
      part('item', false, undefined, 'One row. Use `<li>`.'),
      part('title', false, undefined, 'Primary row text.'),
      part('description', false, undefined, 'Secondary row text.'),
    ],
    [],
    [
      variable('--ui-list-gap', 'Gap between rows. `divided` collapses it to zero.'),
      variable('--ui-list-item-padding-block', 'Block padding of a `divided` row.'),
      variable('--ui-list-item-padding-inline', 'Inline padding of a `divided` row.'),
    ],
  ),
  css(
    'table',
    'ui-table',
    ['core/table.css', 'themes/atmosphere/table.css'],
    [
      density('compactDensities', 'Cell padding.'),
      attribute('data-ui-align', 'string', {
        set: 'tableAlignments',
        default: 'start',
        description:
          'Cell text alignment. Set it on a `<th>` or `<td>`, not on the table. `end` also enables tabular numerals.',
      }),
    ],
    [
      part('caption', false, undefined, 'Table name. Use `<caption>`.'),
      part('description', false, undefined, 'Supporting copy inside the caption.'),
      part('empty', false, undefined, 'Row shown in place of data when the table has none.'),
    ],
  ),
  css(
    'breadcrumb',
    'ui-breadcrumb',
    ['core/breadcrumb.css', 'themes/atmosphere/breadcrumb.css'],
    [
      attribute('data-ui-separator', 'string', {
        set: 'breadcrumbSeparators',
        default: 'chevron',
        description:
          'Which glyph is drawn between crumbs. Both are generated content rather than markup, so neither reaches the accessibility tree and neither is yours to author. For any other glyph, set `--ui-breadcrumb-separator` instead of asking for a new value here.',
      }),
      density('compactDensities', 'Gap between a crumb and its separator.'),
    ],
    [
      part(
        'item',
        false,
        undefined,
        'One crumb. Use `<li>`; the separator is drawn before every crumb but the first, so nothing is authored between them.',
      ),
      part('link', false, undefined, 'The link inside a crumb. Use `<a href>`.'),
      part(
        'current',
        false,
        undefined,
        'The final crumb, which names the page you are already on. Author it as a `<span>` rather than a link — a link to here goes nowhere — and put `aria-current="page"` on it.',
      ),
    ],
    [
      state(
        'current',
        'aria',
        true,
        'Author `aria-current="page"` on the final crumb. Timeless never writes it: which page you are on is not something a stylesheet can know.',
      ),
    ],
    [
      variable('--ui-breadcrumb-gap', 'Gap between a crumb and its separator.'),
      variable(
        '--ui-breadcrumb-separator',
        'The separator glyph, as a CSS string. Comes from `data-ui-separator`; set it directly for a glyph the attribute does not offer. Keep the `/ ""` alternative text if you redeclare `content` yourself, or the glyph starts being announced.',
      ),
    ],
    accessibility(
      'breadcrumb',
      'Breadcrumb',
      [],
      'No keyboard behavior of its own, and the APG says so too: a breadcrumb is links in a labelled landmark, and `Tab` is the traversal. Author `<nav>` with an `aria-label`, an `<ol>` inside it, and the final crumb as an unlinked `<span aria-current="page">`. The separator is a `::before` pseudo-element with empty alternative text, so it is drawn but never announced — which is why there is no separator part to author and no `aria-hidden` to remember.',
    ),
  ),
  css(
    'pagination',
    'ui-pagination',
    ['core/pagination.css', 'themes/atmosphere/pagination.css'],
    [size('primitiveSizes', 'Cell height, padding, and font size.')],
    [
      part('item', false, undefined, 'One cell wrapper. Use `<li>`.'),
      part(
        'link',
        false,
        undefined,
        'A page cell. Use `<a href>` for every page but the one you are on, and a `<span aria-current="page">` for that one.',
      ),
      part(
        'previous',
        false,
        undefined,
        'Steps back one page. Give it an accessible name that says so; `‹` alone names nothing. At the first page, render it as a `<span>` rather than a disabled link.',
      ),
      part('next', false, undefined, 'Steps forward one page, with the same two rules.'),
      part(
        'ellipsis',
        false,
        undefined,
        'Stands for the pages omitted from a long range. Mark it `aria-hidden="true"`: the gap between page 3 and page 40 is not a page.',
      ),
    ],
    [
      state(
        'current',
        'aria',
        true,
        'Author `aria-current="page"` on the cell for the page being shown. Timeless never writes it.',
      ),
    ],
    [
      variable('--ui-pagination-gap', 'Gap between cells.'),
      variable('--ui-pagination-cell-size', 'Minimum height and width of a cell.'),
    ],
    accessibility(
      null,
      'Pagination',
      [],
      'The APG has no pagination pattern, so this documents a composition: a `<nav>` with an `aria-label`, a list, and one link per page. They are links rather than buttons on purpose — a page is a URL, so it is shareable, middle-clickable, and in the back button’s history, none of which a click handler gives you. That has one consequence worth stating: **a disabled link is not a thing.** At the first or last page, render Previous or Next as a `<span>`, not an `<a aria-disabled="true">` that still navigates. Compose `<ul class="ui-group" data-ui-attached>` for a joined strip.',
    ),
  ),
  css(
    'collapsible',
    'ui-collapsible',
    ['core/collapsible.css', 'themes/atmosphere/collapsible.css'],
    [density('compactDensities', 'Summary and content padding.')],
    [],
    [],
    [
      variable('--ui-collapsible-line', 'Divider color between rows.'),
      variable('--ui-collapsible-trigger-min-block-size', 'Minimum summary height.'),
      variable('--ui-collapsible-trigger-padding-block', 'Block padding inside the summary.'),
      variable('--ui-collapsible-trigger-gap', 'Gap between the summary text and the indicator.'),
      variable('--ui-collapsible-panel-padding-block-end', 'Block-end padding below the panel.'),
      variable('--ui-collapsible-icon-size', 'Size of the chevron indicator.'),
      variable('--ui-collapsible-duration', 'Indicator and panel transition duration.'),
    ],
    accessibility(
      'disclosure',
      'Disclosure',
      [],
      'Every key comes from native `<details>` and `<summary>`: Enter and Space toggle, Tab reaches the summary, and find-in-page opens a closed panel to reveal a match. Timeless adds no script and no ARIA, because the platform already exposes the button, its expanded state, and the region it controls. For an accordion where only one panel is open at a time, give every `<details>` in the stack the same `name`; the browser closes the previously open one, with no JavaScript involved.',
    ),
  ),
  css(
    'spinner',
    'ui-spinner',
    ['core/spinner.css', 'themes/atmosphere/spinner.css'],
    [
      size('primitiveSizes', 'Spinner diameter.'),
      attribute('data-ui-variant', 'string', {
        set: 'spinnerVariants',
        default: 'neutral',
        description: 'Indicator color.',
      }),
    ],
    [part('label', false, undefined, 'Visible or screen-reader-only description of the wait.')],
  ),
  css(
    'empty',
    'ui-empty',
    ['core/empty.css', 'themes/atmosphere/empty.css'],
    [density('primitiveDensities', 'Vertical rhythm of the empty state.')],
    [
      part('art', false, undefined, 'Decorative illustration or icon.'),
      part('actions', false, undefined, 'Container for the one clear next action.'),
    ],
  ),
  css(
    'meter',
    'ui-meter-field',
    ['core/meter.css', 'themes/atmosphere/meter.css'],
    [],
    [part('hint', false, undefined, 'Supporting text under the meter.')],
  ),
  css(
    'colorSwatch',
    'ui-color-swatch',
    ['core/color-swatch.css', 'themes/atmosphere/color-swatch.css'],
    [],
    [
      part('chip', false, undefined, 'The color area. Set the color through `--ui-swatch-color`.'),
      part('label', false, undefined, 'Human-readable color name.'),
      part('value', false, undefined, 'The raw CSS color value.'),
      part('warning', false, undefined, 'Out-of-gamut or contrast warning.'),
    ],
  ),
  css(
    'field',
    'ui-field',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [
      attribute('data-ui-layout', 'string', {
        set: 'fieldLayouts',
        default: 'stacked',
        description: 'Whether the label sits above the control or beside it.',
      }),
      density('formDensities', 'Gap between label, control, description, and error.'),
    ],
    [part('control', false, undefined, 'Wrapper around the native control when one is needed.')],
    [
      state(
        'invalid',
        'aria',
        true,
        'Set `aria-invalid="true"` on the control and point `aria-describedby` at the error part.',
      ),
    ],
  ),
  css(
    'fieldset',
    'ui-fieldset',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [density('formDensities', 'Gap between grouped controls, and the padding around them.')],
    [
      part(
        'legend',
        true,
        'legend',
        'The native `<legend>`, which names the group. Keep it the first child, because that is what makes the browser treat it as the group label.',
      ),
      part('description', false, undefined, 'Group-level help text under the legend.'),
      part('error', false, undefined, 'Group-level validation message.'),
    ],
    [
      state(
        'invalid',
        'aria',
        true,
        'Set `aria-invalid="true"` on the `<fieldset>` and point `aria-describedby` at the error part.',
      ),
      state(
        'disabled',
        'native',
        true,
        'Native `disabled` on the `<fieldset>`, which the browser propagates to every control inside it.',
      ),
    ],
  ),
  css('label', 'ui-label', ['core/forms.css', 'themes/atmosphere/forms.css']),
  css('description', 'ui-description', ['core/forms.css', 'themes/atmosphere/forms.css']),
  css('error', 'ui-error', ['core/forms.css', 'themes/atmosphere/forms.css']),
  css(
    'input',
    'ui-input',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [size('formControlSizes')],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'textarea',
    'ui-textarea',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [size('formControlSizes')],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'nativeSelect',
    'ui-select',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [
      size(
        'formControlSizes',
        'Control height, padding, font size, and the size of the drop-down indicator.',
      ),
    ],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
    [
      variable(
        '--ui-select-indicator',
        'Width of the drop-down indicator, which also sets the end padding reserved for it. Timeless draws the mark itself with `appearance: none`, because the platform arrow sits at a fixed engine-chosen offset no author padding moves, and WebKit drops `padding` and `min-block-size` on a UA-drawn select entirely. The mark is two gradient halves rather than an icon asset, so it follows `currentColor`; redeclare `background-image` to replace it. The drop-down list itself is still UA-drawn, which is what `color-scheme` on the control is for.',
      ),
    ],
  ),
  css(
    'checkbox',
    'ui-checkbox',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'radio',
    'ui-radio',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'choice',
    'ui-choice',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [density('formDensities', 'Gap between the control and its label.')],
    [
      part('body', false, undefined, 'Wrapper for the title and description beside the control.'),
      part('title', false, undefined, 'The choice label text.'),
      part('description', false, undefined, 'Supporting copy under the choice label.'),
    ],
  ),
  css(
    'choiceGroup',
    'ui-choice-group',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [
      attribute('data-ui-orientation', 'string', {
        set: 'choiceGroupOrientations',
        default: 'vertical',
        description: 'Layout direction of the choices.',
      }),
      density('formDensities', 'Gap between choices.'),
    ],
    [
      part('description', false, undefined, 'Group-level help text under the legend.'),
      part('error', false, undefined, 'Group-level validation message.'),
    ],
    [
      state(
        'invalid',
        'aria',
        true,
        'Set `aria-invalid="true"` on the `<fieldset>` and describe the error.',
      ),
    ],
  ),
  css(
    'switch',
    'ui-switch',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
    [],
    accessibility(
      'switch',
      'Switch',
      [],
      'A native `input[type="checkbox"]` with `role="switch"`, which is the whole component: Tab reaches it, Space toggles it, the checked state is `:checked`, and it submits and resets with the form. `role="switch"` changes only how it is announced — on or off rather than checked or unchecked — so use it when the control takes effect immediately and leave it off when the change needs saving. Label it as you would any checkbox, and do not add `aria-checked`; the native state is authoritative and the two can disagree.',
    ),
  ),
  css(
    'range',
    'ui-range',
    ['core/range.css', 'themes/atmosphere/range.css'],
    [size('formControlSizes', 'Track thickness, thumb diameter, and label size.')],
    [part('hint', false, undefined, 'Supporting text or the live `<output>` value.')],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
    [
      variable('--ui-range-track', 'Track thickness.'),
      variable('--ui-range-thumb', 'Thumb diameter.'),
    ],
  ),
  css(
    'file',
    'ui-file',
    ['core/forms.css', 'themes/atmosphere/forms.css'],
    [],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  customElement(
    'tabs',
    'ui-tabs',
    'tabs',
    'UITabsElement',
    'createTabsElementClass',
    'defineTabsElement',
    ['core/tabs.css', 'themes/atmosphere/tabs.css'],
    [
      attribute('activation', 'string', {
        set: 'tabsActivations',
        default: 'automatic',
        description:
          'Whether moving focus with the arrow keys selects the tab immediately (`automatic`) or waits for Enter or Space (`manual`). Use `manual` when selecting a tab is expensive.',
      }),
      attribute('orientation', 'string', {
        set: 'tabsOrientations',
        default: 'horizontal',
        description:
          'Arrow-key axis. Mirrored onto `aria-orientation` on the tablist during enhancement.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The tab selected on load and after a form reset. Match a tab’s `value` attribute. Assign the `value` property for live changes.',
      }),
    ],
    [
      part('tablist', true, "[role='tablist']", 'Container for the tabs.'),
      part(
        'tab',
        true,
        "[role='tab']",
        'One tab. Use `<button type="button">` and give it a `value`; Timeless wires `id`, `aria-controls`, `aria-selected`, and `tabindex`.',
        [
          attribute('data-ui-value', 'string', {
            property: false,
            description:
              'The value this tab selects, for a tab that cannot carry a bare `value` attribute. `value` wins over it, and the tab `id` is the last fallback.',
          }),
        ],
      ),
      part(
        'tabpanel',
        true,
        "[role='tabpanel']",
        'One panel per tab, in the same order. Timeless wires `id`, `aria-labelledby`, and `hidden`.',
      ),
    ],
    [state('selected', 'aria', true, '`aria-selected="true"` on the active tab.')],
    [],
    transitionEvents('the selected tab', 'TabsChangeDetail'),
    accessibility(
      'tabs',
      'Tabs',
      [
        key('Arrow keys', 'Move focus between tabs along the `orientation` axis.'),
        key('Home / End', 'Move focus to the first or last tab.'),
        key(
          'Enter / Space',
          'Select the focused tab. Only needed when `activation` is `manual`; with `automatic` the arrow keys select as they move.',
        ),
      ],
      'The tablist is one tab stop: Tab moves into the selected tab, then out to the panel. Timeless manages roving `tabindex`, `aria-selected`, and panel `hidden`.',
    ),
  ),
  customElement(
    'dialog',
    'ui-dialog',
    'dialog',
    'UIDialogElement',
    'createDialogElementClass',
    'defineDialogElement',
    ['core/dialog.css', 'themes/atmosphere/dialog.css'],
    [
      attribute('kind', 'string', {
        set: 'dialogKinds',
        default: 'dialog',
        description:
          'Whether the panel is a regular dialog or an alert dialog. `alert` resolves to `role="alertdialog"`, for a destructive confirmation the user must answer.',
      }),
    ],
    [
      part(
        'trigger',
        true,
        undefined,
        'Native button that opens the dialog. Add `command="show-modal"` and `commandfor` naming the panel id to open it from markup, before any script runs. Timeless reads those attributes and stands down; it never writes them, because a generated attribute would only work once the bundle had loaded.',
      ),
      part(
        'panel',
        true,
        'dialog',
        'The native `<dialog>` element. Author it, do not generate it. Give it an explicit `id` when a trigger or close button invokes it, since an invoker can only name an id the author wrote.',
      ),
      part(
        'close',
        false,
        undefined,
        'Optional explicit close button inside the panel. Add `command="close"` and `commandfor` to close it from markup; the platform then also copies the button `value` into `returnValue`.',
      ),
      ...OVERLAY_NAMING_PARTS('dialog'),
    ],
    [],
    [],
    [],
    accessibility(
      'dialog-modal',
      'Modal Dialog',
      [
        key(
          'Escape',
          'Close the dialog. Handled by the native `<dialog>` element, not by Timeless.',
        ),
      ],
      'Focus trapping, the backdrop, and the top layer all come from `showModal()`. Timeless moves initial focus into the panel and returns it to the trigger on close, and names the panel from its `title` and `description` parts. A dialog invoker gets no implicit `aria-expanded` from the platform, so Timeless keeps writing it on both the authored-command and click paths.',
    ),
  ),
  customElement(
    'sheet',
    'ui-sheet',
    'sheet',
    'UISheetElement',
    'createSheetElementClass',
    'defineSheetElement',
    ['core/sheet.css', 'themes/atmosphere/sheet.css'],
    [
      attribute('modal', 'boolean', {
        description:
          'Present to open the sheet as a modal, trapping focus and blocking the page behind it. Omit for a non-modal sheet the user can interact around.',
      }),
      attribute('open', 'boolean', {
        description: 'Present to render the sheet open on load.',
      }),
      attribute('position', 'string', {
        set: 'sheetPositions',
        default: 'right',
        description: 'Which viewport edge the sheet slides in from.',
      }),
    ],
    [
      part(
        'trigger',
        true,
        undefined,
        'Native button that opens the sheet. On a `modal` sheet, add `command="show-modal"` and `commandfor` naming the panel id to open it from markup, before any script runs. A non-modal sheet has no declarative equivalent: the platform has no built-in command for `dialog.show()`, so its trigger stays on the click listener.',
      ),
      part(
        'panel',
        true,
        'dialog',
        'The native `<dialog>` element. Give it an explicit `id` when a trigger or close button invokes it, since an invoker can only name an id the author wrote.',
      ),
      part(
        'close',
        false,
        undefined,
        'Optional explicit close button. Add `command="close"` and `commandfor` to close it from markup, on modal and non-modal sheets alike; the platform then also copies the button `value` into `returnValue`.',
      ),
      part(
        'drag-handle',
        false,
        undefined,
        'Optional grab area for the swipe gesture. A swipe works anywhere on the panel that is not a scrollable region, so this is an affordance rather than a requirement — but it is the one place a drag always starts, which is what a bottom sheet over a scrolling body needs. Decorative: hide it from assistive technology and keep a real close control.',
      ),
      ...OVERLAY_NAMING_PARTS('sheet'),
    ],
    [
      state(
        '--dragging',
        'custom-state',
        false,
        'Set while a swipe is in progress, so the stylesheet can suspend the entry animation and the spring-back transition. Internal; do not author it.',
      ),
    ],
    [
      variable(
        '--ui-sheet-drag-offset',
        'How far the panel has been dragged along its own axis, written as a length while a swipe is in progress and cleared on release. The stylesheet turns it into a `translate`; setting it yourself only moves the panel.',
      ),
    ],
    [
      ...overlayEvents('sheet', 'SheetEventDetail'),
      event(
        'ui-dismiss',
        'CustomEvent<SheetEventDetail>',
        'Dispatched when the sheet closes through Escape, a backdrop click, or a swipe past the dismiss threshold, rather than through an explicit control. The detail names which. A swipe reports `swipe` and behaves exactly like a backdrop click, because that is what it is: a pointer gesture on the overlay rather than a command.',
      ),
    ],
    accessibility(
      'dialog-modal',
      'Modal Dialog',
      [key('Escape', 'Close the sheet. Handled by the native `<dialog>` element.')],
      'A `modal` sheet traps focus through `showModal()`; without `modal` the page stays interactive and focus is not trapped. Timeless restores focus to the trigger either way, including after a swipe. Naming comes from the `title` and `description` parts. Swipe-to-dismiss is an addition, never the only way out: Escape and a close control both stay, so the sheet is fully operable without a pointer.',
    ),
  ),
  customElement(
    'popover',
    'ui-popover',
    'popover',
    'UIPopoverElement',
    'createPopoverElementClass',
    'definePopoverElement',
    ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
    [
      attribute('placement', 'string', {
        set: 'floatingPlacements',
        default: 'bottom',
        description:
          'Preferred side of the trigger. Positioning uses CSS anchor positioning, so the browser may flip the surface to keep it on screen.',
      }),
      attribute('role', 'string', {
        property: { name: 'roleValue' },
        set: 'popoverRoles',
        default: 'dialog',
        description:
          'Semantics applied to the surface, and the `aria-haspopup` value set on the trigger. Choose it from the interaction, not the appearance.',
      }),
    ],
    [
      part('trigger', true, undefined, 'Native button that opens the surface.'),
      part(
        'content',
        true,
        '[popover]',
        'The surface. Author the `popover` attribute so it stays hidden before enhancement.',
      ),
    ],
    [],
    [variable('--ui-floating-offset', 'Gap between the trigger and the surface.')],
    [],
    accessibility(
      'disclosure',
      'Disclosure',
      [key('Escape', 'Close the surface. Handled by the Popover API, not by Timeless.')],
      'Light dismiss, Escape, and top-layer stacking come from the Popover API. Timeless wires `popovertarget`, `aria-controls`, `aria-expanded`, and `aria-haspopup`, and gives the surface the `role` you asked for. Name the surface yourself when it is a dialog.',
    ),
  ),
  customElement(
    'hoverCard',
    'ui-hover-card',
    'hover-card',
    'UIHoverCardElement',
    'createHoverCardElementClass',
    'defineHoverCardElement',
    ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
    [
      attribute('anchor', 'string', {
        description:
          'Id of an element to anchor against instead of the trigger. Use it when the visual anchor differs from the control that opens the card.',
      }),
      attribute('variant', 'string', {
        set: 'hoverCardVariants',
        description:
          'Set `tooltip` for the compact tooltip treatment. Omit for the roomier hover-card surface.',
      }),
      attribute('placement', 'string', {
        set: 'floatingPlacements',
        default: 'bottom',
        description: 'Preferred side of the anchor.',
      }),
      attribute('open-delay', 'number', {
        property: { name: 'openDelayValue', type: 'string' },
        default: '180',
        description:
          'Milliseconds of hover or focus intent before opening. The resolved number is available on the read-only `openDelay` property.',
      }),
      attribute('close-delay', 'number', {
        property: { name: 'closeDelayValue', type: 'string' },
        default: '100',
        description:
          'Milliseconds after the pointer leaves before closing, so the user can cross the gap into the surface. The resolved number is available on the read-only `closeDelay` property.',
      }),
    ],
    [
      part('trigger', true, undefined, 'Element that receives hover and focus intent.'),
      part('content', true, '[popover]', 'The surface.'),
    ],
    [],
    [variable('--ui-floating-offset', 'Gap between the anchor and the surface.')],
    [],
    accessibility(
      'tooltip',
      'Tooltip',
      [key('Escape', 'Close the surface while the trigger has focus.')],
      'The card opens on both pointer hover and keyboard focus, so it is reachable without a mouse, and clicking the trigger toggles it. `close-delay` keeps it open while the pointer crosses the gap into the surface, and focus moving into the surface cancels the close outright — so a link or a button inside it is reachable with `Tab`, not only with a pointer. Under `variant="tooltip"` the click toggle is dropped — a tooltip describes its trigger rather than disclosing a surface — while the gap-crossing behavior stays, because WCAG 2.2 SC 1.4.13 requires it. See [Tooltip](/docs/components/tooltip/). Never put the only copy of important content here.',
    ),
  ),
  selector(
    'tooltip',
    "ui-hover-card[variant='tooltip']",
    ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
    [],
    [
      part(
        'trigger',
        true,
        undefined,
        'Control the label describes. Point its `aria-describedby` at the surface.',
      ),
      part(
        'content',
        true,
        '[popover]',
        'The label. One short, non-interactive line; give it `role="tooltip"`.',
      ),
    ],
    [],
    [
      variable('--ui-tooltip-bg', 'Surface background. Inverted against the page by default.'),
      variable('--ui-tooltip-fg', 'Label color, and the border tint is mixed from it.'),
    ],
    accessibility(
      'tooltip',
      'Tooltip',
      [key('Escape', 'Close the label while the trigger has focus.')],
      'A tooltip names or describes its trigger and nothing else. Point the trigger at it with `aria-describedby` and give the surface `role="tooltip"`; Timeless wires relationships, never content. It opens on hover and on keyboard focus, so it is reachable without a mouse, and closes when either leaves. It is deliberately not a disclosure: clicking the trigger does not toggle the label, so a trigger that is also a button keeps its own job on click. The pointer can still be moved onto the label without it disappearing, because WCAG 2.2 SC 1.4.13 requires hover-triggered content to be hoverable — reading a label is not interacting with it. Never put the only copy of anything here — for content the user may want to read at length or click, use Hover Card instead. Both variants share one `open-delay` / `close-delay` pair, documented once on Hover Card; a tooltip that should appear faster sets the attribute rather than getting a different default, because one attribute cannot have two.',
    ),
  ),
  customElement(
    'menu',
    'ui-menu',
    'menu',
    'UIMenuElement',
    'createMenuElementClass',
    'defineMenuElement',
    ['core/floating.css', 'core/menu.css', 'themes/atmosphere/menu.css'],
    [
      attribute('orientation', 'string', {
        set: 'menuOrientations',
        default: 'vertical',
        description:
          'Arrow-key axis. Defaults to `horizontal` when the menu part is `role="menubar"`.',
      }),
    ],
    [
      part(
        'menu',
        true,
        "[role='menu']",
        'The menu container. Use `role="menubar"` for a persistent horizontal menu bar.',
      ),
      part(
        'item',
        true,
        "[role^='menuitem']",
        'One command. A menu-item role is what makes an element an item — a bare `<button>` inside the menu is not one. Use `role="menuitem"`, or `menuitemcheckbox` / `menuitemradio` for a checkable command. Timeless manages roving `tabindex`, typeahead, and `aria-checked`.',
      ),
      part(
        'group',
        false,
        undefined,
        'A `role="group"` wrapper around related items. Items inside it stay navigable, and a `menuitemradio` clears only the radios in its own group.',
      ),
      part(
        'group-label',
        false,
        undefined,
        'The label for a `group`, wired to it with `aria-labelledby`.',
      ),
      part(
        'separator',
        false,
        "[role='separator'], hr",
        'A divider between items or groups. Navigation and typeahead skip it, because it carries no menu-item role.',
      ),
      part(
        'submenu-trigger',
        false,
        "[aria-haspopup='menu']",
        'An item that owns a submenu. You do not author this token: give the item `aria-controls` naming the submenu, or put the submenu immediately after it, and Timeless writes `aria-haspopup`, `aria-controls`, and `aria-expanded`.',
      ),
      part(
        'submenu',
        false,
        "ui-menu[popover], [role='menu'][popover]",
        'A nested menu opened from a `submenu-trigger`. Author it as a popover so it stays hidden before enhancement; Timeless adds `popover="auto"` if you leave it off.',
      ),
    ],
    [],
    [variable('--ui-menu-min-inline-size', 'Minimum width of the menu surface.')],
    transitionEvents('a checkable item', 'MenuCheckedDetail'),
    accessibility(
      'menubar',
      'Menu and Menubar',
      [
        key('Arrow keys', 'Move focus between items along the `orientation` axis.'),
        key('Home / End', 'Move focus to the first or last item.'),
        key('Enter / Space', 'Activate the focused item, or open its submenu.'),
        key(
          'Arrow Right',
          'Open the focused item\'s submenu and focus its first enabled item. Under `dir="rtl"` this is Arrow Left.',
        ),
        key(
          'Arrow Left',
          'Close the submenu and return focus to the item that opened it. From a first-level submenu of a menubar, move along the bar instead. Under `dir="rtl"` this is Arrow Right.',
        ),
        key('Escape', 'Close the menu and return focus to whatever opened it.'),
        key(
          'Printable characters',
          'Typeahead: jump to the next item whose label starts with what you typed.',
        ),
      ],
      'The menu is one tab stop. Mark an unavailable command `aria-disabled="true"` rather than `disabled`: it stays reachable with the arrow keys, which is the APG treatment — a command you cannot use is easier to understand than one that is not there — while never taking the resting tab stop and never activating. An authored `disabled` item is honoured as written and simply skipped, because the platform makes it unfocusable and Timeless does not rewrite your markup. Activating a `menuitemcheckbox` toggles its `aria-checked`; activating a `menuitemradio` sets it and clears the other radios in its group. Both dispatch a cancelable `ui-before-change` first, so a consumer that already owns `aria-checked` can keep owning it. Typeahead matching is locale-aware. Submenus open on the keyboard and on click; there is deliberately no hover-with-intent opening.',
    ),
  ),
  customElement(
    'menuButton',
    'ui-menu-button',
    'menu-button',
    'UIMenuButtonElement',
    'createMenuButtonElementClass',
    'defineMenuButtonElement',
    ['core/floating.css', 'core/menu.css', 'themes/atmosphere/menu.css'],
    [
      attribute('open', 'boolean', {
        description: 'Present to render the menu open on load.',
      }),
      attribute('placement', 'string', {
        set: 'floatingPlacements',
        default: 'bottom',
        description: 'Preferred side of the trigger.',
      }),
    ],
    [
      part('trigger', true, undefined, 'Native button that opens the menu.'),
      part('content', true, '[popover]', 'The popover surface holding a `ui-menu`.'),
    ],
    [],
    [variable('--ui-floating-offset', 'Gap between the trigger and the menu surface.')],
    overlayEvents('menu', 'MenuButtonToggleDetail'),
    accessibility(
      'menu-button',
      'Menu Button',
      [
        key('Arrow Down', 'Open the menu and focus its first item.'),
        key('Arrow Up', 'Open the menu and focus its last item.'),
        key('Escape', 'Close the menu and return focus to the trigger.'),
      ],
      'Enter and Space open the menu before any script runs, because the trigger carries `popovertarget` — they are the platform\'s, which is why they are not listed above. The two arrows have no declarative equivalent, so those are the keys Timeless implements. Escape and outside-click dismissal come from the Popover API. The trigger carries `aria-haspopup="menu"` and `aria-expanded`.',
    ),
  ),
  customElement(
    'contextMenu',
    'ui-context-menu',
    'context-menu',
    'UIContextMenuElement',
    'createContextMenuElementClass',
    'defineContextMenuElement',
    [
      'core/context-menu.css',
      'core/menu.css',
      'themes/atmosphere/context-menu.css',
      'themes/atmosphere/menu.css',
    ],
    [],
    [
      part(
        'target',
        true,
        undefined,
        'The region a secondary click opens the menu over. Give it a role that supports `aria-haspopup` and make it focusable — Timeless adds `tabindex="0"` when it has none, because the keyboard path cannot exist without a tab stop. It then wires `aria-haspopup`, `aria-controls`, and `aria-expanded`; the role and the accessible name stay yours.',
      ),
      part(
        'menu',
        true,
        "ui-menu[popover], [role='menu'][popover]",
        'The menu surface, a `ui-menu` authored as a popover. Every item, group, separator, and submenu inside it is the [Menu](/docs/components/menu/) contract, unchanged — this element only decides when and where it opens.',
      ),
    ],
    [],
    [
      variable(
        '--ui-context-menu-x',
        'Horizontal position the surface opens at, written at runtime from the pointer or from the focused element. The stylesheet turns it into a clamped `left`.',
      ),
      variable(
        '--ui-context-menu-y',
        'Vertical position, the same way. Together these are the whole positioning input: there is no anchor element, because a pointer is not an element.',
      ),
      variable(
        '--ui-context-menu-inset',
        'Minimum gap kept between the surface and the viewport edge when the coordinates would push it off screen.',
      ),
    ],
    overlayEvents('context menu', 'ContextMenuToggleDetail'),
    accessibility(
      null,
      'Context Menu',
      [
        key(
          'Shift + F10',
          'Open the menu for the focused target. Some environments consume the shortcut before the page sees it, which is why the dedicated key below is also supported.',
        ),
        key('Context Menu key', 'Open the menu for the focused target.'),
        key(
          'Escape',
          'Close the menu and return focus to the target. Handled by the Popover API and by Menu.',
        ),
      ],
      'The APG has no context-menu pattern, so this documents a composition rather than claiming one: a [Menu](/docs/components/menu/) surface, opened by a secondary click or by the keyboard. Everything inside is the menu pattern — roving focus, typeahead, submenu keys, checkable items. Escape, light dismiss, and top-layer stacking come from the Popover API. **This is the one Timeless component with no no-JavaScript fallback**: the platform has no declarative way to open a surface at pointer coordinates, so with scripting off the browser shows its own context menu and the authored `ui-menu` stays hidden. Never put a command here that is not also reachable another way.',
    ),
  ),
  customElement(
    'toolbar',
    'ui-toolbar',
    'toolbar',
    'UIToolbarElement',
    'createToolbarElementClass',
    'defineToolbarElement',
    ['core/toolbar.css', 'themes/atmosphere/toolbar.css'],
    [
      attribute('orientation', 'string', {
        set: 'toolbarOrientations',
        default: 'horizontal',
        description: 'Arrow-key axis across the toolbar controls.',
      }),
    ],
    [
      part(
        'item',
        true,
        'button, a, input, select, textarea',
        'Any focusable control in the toolbar. Timeless makes the group one tab stop and moves focus with the arrow keys.',
      ),
    ],
    [],
    [],
    [],
    accessibility(
      'toolbar',
      'Toolbar',
      COLLECTION_KEYS('control'),
      'The whole toolbar is one tab stop. Timeless manages roving `tabindex` so Tab moves past the group rather than through every control. A toolbar control is a real control rather than a command, so `disabled` is the right spelling here and the arrows skip it — unlike [Menu](/docs/components/menu/), where `aria-disabled` keeps an unavailable command discoverable. Give the host an accessible name; a toolbar without one is indistinguishable from any other.',
    ),
  ),
  customElement(
    'radioGroup',
    'ui-radio-group',
    'choice-group',
    'UIRadioGroupElement',
    'createRadioGroupElementClass',
    'defineRadioGroupElement',
    [
      'core/choice-groups.css',
      'core/forms.css',
      'themes/atmosphere/choice-groups.css',
      'themes/atmosphere/forms.css',
    ],
    [
      attribute('orientation', 'string', {
        set: 'choiceGroupOrientations',
        default: 'vertical',
        description: 'Layout and arrow-key axis.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The radio checked on load and after a form reset. Match one input’s `value`. Assign the `value` property for live changes.',
      }),
    ],
    [
      part(
        'choice',
        true,
        "input[type='radio']",
        'One native radio input, sharing a `name` with the rest. Native form submission and reset keep working.',
      ),
    ],
    [],
    [],
    transitionEvents('the checked radio', 'RadioGroupChangeDetail'),
    accessibility(
      'radio',
      'Radio Group',
      COLLECTION_KEYS('radio'),
      'Native radio semantics do the rest: one tab stop per group, checked state, form submission, and reset. Timeless adds roving focus and change events without replacing the inputs.',
    ),
  ),
  customElement(
    'checkboxGroup',
    'ui-checkbox-group',
    'choice-group',
    'UICheckboxGroupElement',
    'createCheckboxGroupElementClass',
    'defineCheckboxGroupElement',
    [
      'core/choice-groups.css',
      'core/forms.css',
      'themes/atmosphere/choice-groups.css',
      'themes/atmosphere/forms.css',
    ],
    [
      attribute('orientation', 'string', {
        set: 'choiceGroupOrientations',
        default: 'vertical',
        description: 'Layout and arrow-key axis.',
      }),
    ],
    [
      part(
        'choice',
        true,
        "input[type='checkbox']",
        'One native checkbox input. Author `checked` for the initial state; the group reports every checked value.',
      ),
    ],
    [],
    [],
    transitionEvents('the set of checked boxes', 'CheckboxGroupChangeDetail'),
    accessibility(
      'checkbox',
      'Checkbox',
      [],
      'Every key comes from the native checkboxes: Tab reaches each one, Space toggles the focused box, and each box submits its own value. There is deliberately no roving `tabindex` and no arrow navigation — a checkbox group is a set of independent controls rather than one composite widget, so each being its own tab stop is the APG treatment. `ui-checkbox-group` adds only the group role, the orientation, and one change event for the set. A group that should be one tab stop is a [Listbox](/docs/components/listbox/) with `multiple`.',
    ),
  ),
  customElement(
    'listbox',
    'ui-listbox',
    'listbox',
    'UIListboxElement',
    'createListboxElementClass',
    'defineListboxElement',
    [
      'core/listbox.css',
      'core/options.css',
      'themes/atmosphere/listbox.css',
      'themes/atmosphere/options.css',
    ],
    [
      attribute('multiple', 'boolean', {
        description:
          'Present to allow more than one selected option, submitting one form entry per value under the same `name`.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes; once the user commits a change the attribute stops applying, the way it does on a native input.',
      }),
      ...FORM_ATTRIBUTES(),
    ],
    [
      part('listbox', true, "[role='listbox']", 'The option container, which is the host itself.'),
      ...COLLECTION_PARTS(),
    ],
    [state('selected', 'aria', true, '`aria-selected="true"` on selected options.')],
    [
      variable(
        '--ui-collection-surface-inline-size',
        'Minimum width of an option surface. On the anchored Select and Combobox surfaces the trigger width wins whenever it is larger.',
      ),
    ],
    [...transitionEvents('the selection', 'ListboxChangeDetail'), pageEvent('ListboxPageDetail')],
    accessibility(
      'listbox',
      'Listbox',
      [
        ...COLLECTION_KEYS('option'),
        key('Enter / Space', 'Select the focused option, or toggle it when `multiple` is present.'),
        key(
          'Printable characters',
          'Typeahead: jump to the next option whose text starts with what you typed.',
        ),
      ],
      'Roving `tabindex` moves real focus between options, so selection follows `aria-selected` and never the focus ring. Options inside a `group` stay in one flat navigation order. `header`, `footer`, and the pager sit outside that order and are reached with `Tab`.',
    ),
  ),
  customElement(
    'select',
    'ui-select',
    'select',
    'UISelectElement',
    'createSelectElementClass',
    'defineSelectElement',
    [
      'core/floating.css',
      'core/options.css',
      'core/select.css',
      'themes/atmosphere/options.css',
      'themes/atmosphere/select.css',
    ],
    [
      attribute('open', 'boolean', {
        description: 'Present to render the listbox open on load.',
      }),
      attribute('placement', 'string', {
        set: 'floatingPlacements',
        default: 'bottom',
        description: 'Preferred side of the trigger for the listbox surface.',
      }),
      attribute('searchable', 'boolean', {
        description:
          'Present to filter from a `search` field inside the surface. Focus moves into that field on open and stays there; the highlight travels through `aria-activedescendant`.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input.',
      }),
      ...COLLECTION_ATTRIBUTES(),
      ...FORM_ATTRIBUTES(),
    ],
    [
      part(
        'trigger',
        true,
        undefined,
        'Native button that opens the listbox. Timeless gives it `role="combobox"`, which the Select-Only Combobox pattern asks for; that role takes no name from its content, so give the trigger `aria-labelledby` or `aria-label` yourself.',
      ),
      part(
        'value',
        false,
        undefined,
        'Element inside the trigger that shows the selected label. Timeless writes its text and nothing else.',
      ),
      part(
        'search',
        false,
        undefined,
        'Text field inside the surface that filters the options under `searchable`. Left and Right move the caret rather than the highlight.',
      ),
      part(
        'surface',
        false,
        undefined,
        'The popover the listbox sits in. Author it whenever the surface also holds a `search` field, a `header`, a `footer`, or a pager: a `role="listbox"` may own only options and groups, so those siblings belong beside the listbox rather than inside it. With none of them, the `listbox` is its own surface and this part is unnecessary.',
      ),
      part('listbox', true, "[role='listbox']", 'The option container.'),
      ...COLLECTION_PARTS(),
      ...COLLECTION_TRIGGER_PARTS(),
    ],
    [],
    [
      variable(
        '--ui-collection-surface-inline-size',
        'Minimum width of the listbox surface. The trigger width wins whenever it is larger.',
      ),
      variable('--ui-floating-offset', 'Gap between the trigger and the surface.'),
    ],
    [
      ...transitionEvents('the selected option', 'SelectChangeDetail'),
      ...overlayEvents('listbox', 'SelectToggleDetail'),
      ...collectionEvents('SelectInputDetail', 'SelectPageDetail'),
    ],
    accessibility(
      'combobox',
      'Select-Only Combobox',
      [
        key(
          'Enter / Space',
          'Open the listbox, or commit the active option when it is already open.',
        ),
        key(
          'Arrow keys',
          'Open the listbox from the closed trigger, or move the active option when it is already open.',
        ),
        key('Home / End', 'Move to the first or last option while the listbox is open.'),
        key('Escape', 'Close the listbox without changing the value.'),
        key(
          'Printable characters',
          'Typeahead over the option labels. On a closed Select this selects a match without opening, as the native control does.',
        ),
        key('Backspace', 'In an empty `search` field under `multiple`, removes the last chip.'),
      ],
      'Timeless gives the trigger `role="combobox"`, which is what the Select-Only Combobox pattern asks for and what makes `aria-activedescendant` legal on it. Your own `role` wins over that, and the relationship follows the role: set one that cannot carry `aria-activedescendant`, such as `button`, and Timeless writes no relationship rather than an invalid one, while the active option is still highlighted — `checkMarkup` reports the role, because the degradation is otherwise silent. That role does not take its name from its content, so the trigger needs your `aria-labelledby` or `aria-label`; `checkMarkup` reports it when missing. Focus stays on the trigger and the active option is announced through `aria-activedescendant`; under `searchable` focus moves into the `search` field instead and the same mechanism carries the highlight. The trigger carries `popovertarget`, so it opens the surface before any script runs. Light dismiss and Escape come from the Popover API. `header`, `footer`, and the pager sit outside arrow navigation and are reached with `Tab`.',
    ),
  ),
  customElement(
    'combobox',
    'ui-combobox',
    'combobox',
    'UIComboboxElement',
    'createComboboxElementClass',
    'defineComboboxElement',
    [
      'core/combobox.css',
      'core/floating.css',
      'core/options.css',
      'themes/atmosphere/combobox.css',
      'themes/atmosphere/options.css',
    ],
    [
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input.',
      }),
      ...COLLECTION_ATTRIBUTES(),
      ...FORM_ATTRIBUTES(),
    ],
    [
      part(
        'trigger',
        true,
        "input[role='combobox']",
        'The native text input. It is both the trigger and the search field: Timeless wires `aria-expanded`, `aria-controls`, and `aria-activedescendant` onto it and leaves its editing behavior alone.',
      ),
      part(
        'surface',
        false,
        undefined,
        'The popover the listbox sits in. Author it whenever the surface also holds a `header`, a `footer`, or a pager: a `role="listbox"` may own only options and groups. With none of them, the `listbox` is its own surface and this part is unnecessary.',
      ),
      part('listbox', true, "[role='listbox']", 'The option container.'),
      ...COLLECTION_PARTS(),
      ...COLLECTION_TRIGGER_PARTS(),
    ],
    [],
    [
      variable(
        '--ui-collection-surface-inline-size',
        'Minimum width of the listbox surface. The input width wins whenever it is larger.',
      ),
      variable('--ui-floating-offset', 'Gap between the input and the surface.'),
    ],
    [
      ...transitionEvents('the selected option', 'ComboboxChangeDetail'),
      ...overlayEvents('listbox', 'ComboboxToggleDetail'),
      ...collectionEvents('ComboboxInputDetail', 'ComboboxPageDetail'),
    ],
    accessibility(
      'combobox',
      'Combobox',
      [
        key('Arrow Down / Arrow Up', 'Open the listbox, then move the active option.'),
        key('Home / End', 'Move to the first or last matching option.'),
        key('Arrow Left / Arrow Right', 'Move the text caret. They never move the highlight.'),
        key('Enter', 'Commit the active option.'),
        key('Escape', 'Close the listbox, then clear the filter on a second press.'),
        key('Backspace', 'In an empty input under `multiple`, removes the last chip.'),
      ],
      'Focus stays in the text input at all times; the active option is exposed with `aria-activedescendant`. Filtering hides non-matching options rather than removing them, so find-in-page and the DOM still show the full authored list. `header`, `footer`, and the pager sit outside arrow navigation and are reached with `Tab`.',
    ),
  ),
  customElement(
    'toaster',
    'ui-toaster',
    'toast',
    'UIToasterElement',
    'createToasterElementClass',
    'defineToasterElement',
    ['core/toast.css', 'themes/atmosphere/toast.css'],
    [
      attribute('placement', 'string', {
        set: 'toasterPlacements',
        default: 'bottom-end',
        description: 'Corner or edge of the viewport the toasts stack against.',
      }),
      attribute('stack', 'string', {
        set: 'toasterStacks',
        default: 'overlap',
        description:
          'Whether queued toasts overlap into a deck (`overlap`) or lay out as a full list (`list`).',
      }),
    ],
    [],
    [],
    [
      variable('--ui-toaster-gap', 'Gap between toasts in `list` mode.'),
      variable('--ui-toaster-overlap', 'Offset between stacked toasts in `overlap` mode.'),
    ],
    [],
    accessibility(
      'alert',
      'Alert',
      [],
      'The toaster is the live region, and it is yours to name — author `role="region"` with an `aria-label`, or `role="status"` when the whole surface should announce. Timeless supplies both as a default and neither as a replacement for your own. Nothing here traps focus or steals it: a toast appears without moving the user, and is reached with Tab like anything else. Choose the role by urgency, not by appearance: `role="status"` on a toast is polite and waits its turn, `role="alert"` interrupts and should be rare.',
    ),
  ),
  customElement(
    'toast',
    'ui-toast',
    'toast',
    'UIToastElement',
    'createToastElementClass',
    'defineToastElement',
    ['core/toast.css', 'themes/atmosphere/toast.css'],
    [
      attribute('duration', 'number', {
        property: { name: 'duration', type: 'string' },
        default: '5000',
        description:
          'Milliseconds before the toast dismisses itself. `0` keeps it open until dismissed.',
      }),
      attribute('persistent', 'boolean', {
        description: 'Present to disable auto-dismiss regardless of `duration`.',
      }),
    ],
    [
      part('content', false, undefined, 'Wrapper for the title and description.'),
      part('title', false, undefined, 'Short summary line.'),
      part('description', false, undefined, 'Supporting detail.'),
      part('close', false, undefined, 'Dismiss button. Give it an accessible name.'),
    ],
    [
      state(
        '--closed',
        'custom-state',
        false,
        'Set while the toast plays its exit transition. Internal; do not author it.',
      ),
    ],
    [],
    [
      event(
        'ui-dismiss',
        'CustomEvent<ToastDismissDetail>',
        'Dispatched when the toast is dismissed. The detail names the reason: a timeout, the close control, or the imperative API.',
      ),
    ],
    accessibility(
      'alert',
      'Alert',
      [],
      'Give the toast the role its urgency deserves — `role="status"` for the ordinary case, `role="alert"` only when it must interrupt — and give the close control an accessible name. SC 2.2.1 is the criterion to hold in mind: `duration` defaults to 5000ms, and the timer stops while the toast is hovered or contains focus, so nobody loses the message they are reading or the control they are reaching for. `persistent`, or `duration="0"`, removes the limit outright, which is the right choice for anything the user must act on. Dismissing a toast that holds focus hands focus to a surviving toast, or back to wherever it came from, rather than dropping it on `<body>`.',
    ),
  ),
  customElement(
    'toggleGroup',
    'ui-toggle-group',
    'toggle-group',
    'UIToggleGroupElement',
    'createToggleGroupElementClass',
    'defineToggleGroupElement',
    ['core/toggle.css', 'themes/atmosphere/toggle.css'],
    [
      attribute('attached', 'boolean', {
        property: false,
        description:
          'Present to join the buttons into one segmented control. Styling only, resolved by `themes/atmosphere/toggle.css`.',
      }),
      attribute('orientation', 'string', {
        set: 'toggleGroupOrientations',
        default: 'horizontal',
        description: 'Layout and arrow-key axis.',
      }),
      attribute('selection', 'string', {
        set: 'toggleGroupSelections',
        default: 'single',
        description:
          'Whether pressing one button releases the others (`single`) or toggles independently (`multiple`).',
      }),
    ],
    [
      part(
        'item',
        true,
        'button[aria-pressed]',
        'One toggle button. Author `value` and `aria-pressed`; Timeless keeps the pressed set in sync.',
      ),
    ],
    [],
    [],
    transitionEvents('the pressed set', 'ToggleGroupChangeDetail'),
    accessibility(
      'toolbar',
      'Toolbar',
      COLLECTION_KEYS('button'),
      'The Toolbar pattern rather than the Button pattern, which is what the host renders: `role="toolbar"`, roving `tabindex`, and the whole group as one tab stop. Each button keeps native activation, and `aria-pressed` carries the state — so an individual control is still a button, which is why the pattern link used to point there. With `selection="single"` pressing one button releases the others. Give the host an accessible name; a toolbar without one is indistinguishable from any other.',
    ),
  ),
  customElement(
    'numberStepper',
    'ui-number-stepper',
    'number-stepper',
    'UINumberStepperElement',
    'createNumberStepperElementClass',
    'defineNumberStepperElement',
    ['core/number-stepper.css', 'themes/atmosphere/number-stepper.css'],
    [],
    [
      part(
        'input',
        true,
        "input[type='number']",
        'The native number input. `min`, `max`, and `step` come from it, and native validation keeps working.',
      ),
      part('decrement', true, undefined, 'Button that steps down. Give it an accessible name.'),
      part('increment', true, undefined, 'Button that steps up. Give it an accessible name.'),
    ],
    [],
    [],
    [
      event(
        'input',
        'Event',
        'Native `input` event dispatched on the inner number input after each step.',
      ),
      event('change', 'Event', 'Native `change` event dispatched on the inner number input.'),
    ],
    accessibility(
      'spinbutton',
      'Spinbutton',
      [],
      'Every key comes from the native `input[type="number"]`, which is already a spinbutton: Arrow Up and Arrow Down step by `step`, Page Up and Page Down step further where the platform provides it, and Home and End reach `min` and `max`. Timeless adds no keyboard handling and no ARIA on top, because there is nothing missing — it writes `role="group"` on the host so the two buttons and the field read as one control, which is why the host needs your accessible name. At a bound the corresponding button takes `aria-disabled="true"` rather than `disabled`: a button that goes inert while it is being pressed would otherwise take focus to `<body>` with it, so it stays focusable and does nothing.',
    ),
  ),
  customElement(
    'colorPicker',
    'ui-color-picker',
    'color-picker',
    'UIColorPickerElement',
    'createColorPickerElementClass',
    'defineColorPickerElement',
    ['core/color-picker.css', 'themes/atmosphere/color-picker.css'],
    [
      attribute('format', 'string', {
        set: 'colorPickerFormats',
        default: 'oklch',
        description:
          'Color space the channel controls edit and the raw input round-trips through. The picker converts the current value when this changes.',
      }),
      attribute('value', 'string', {
        description:
          'Initial and form-reset color, in any CSS color syntax. Unlike the collection elements, the picker reflects one `value` property rather than a separate authored default.',
      }),
    ],
    [
      part(
        'preview',
        false,
        undefined,
        'Region holding the format select, gamut controls, and readout.',
      ),
      part('preview-bar', false, undefined, 'Row above the readout.'),
      part('format-field', false, undefined, 'Label wrapper around the format select.'),
      part('format', true, 'select', 'Native `<select>` listing the supported color formats.'),
      part('gamut-bar', false, undefined, 'Row holding the clamp buttons.'),
      part(
        'clamp',
        false,
        undefined,
        'Button that clamps an out-of-gamut color into sRGB or P3. Shown only when needed.',
      ),
      part('readout', false, undefined, 'Row holding the swatch, raw input, and copy button.'),
      part('gamut', false, undefined, 'Current-color swatch. Decorative.'),
      part('input', true, "input[type='text']", 'Raw CSS color value, editable as text.'),
      part(
        'input-label',
        false,
        undefined,
        'Screen-reader label for the raw input or format select.',
      ),
      part('copy', false, undefined, 'Copies the raw value to the clipboard.'),
      part('copy-icon', false, undefined, 'Idle state of the copy button. Decorative.'),
      part('copied-icon', false, undefined, 'Confirmed state of the copy button. Decorative.'),
      part('channels', false, undefined, 'Container for the per-channel rows.'),
      part(
        'channel',
        true,
        undefined,
        'One channel row. The picker rewrites the rows when `format` changes, so author one row per channel of the widest format you support.',
      ),
      part('channel-label', false, undefined, 'Channel name. Written by the picker; decorative.'),
      part('channel-range', true, "input[type='range']", 'Slider for one channel.'),
      part('channel-input', true, "input[type='number']", 'Numeric entry for one channel.'),
      part('warning', false, undefined, 'Out-of-gamut or unparsable-value message.'),
      part('trigger', false, undefined, 'Optional button when the picker lives inside a popover.'),
      part('content', false, undefined, 'Optional popover surface wrapping the picker.'),
    ],
    [
      state(
        '--contextual',
        'custom-state',
        false,
        'Set while the picker renders inside a popover surface. Internal; do not author it.',
      ),
      state(
        '--copied',
        'custom-state',
        false,
        'Set briefly after the value is copied. Internal; do not author it.',
      ),
    ],
    [],
    [
      event('input', 'Event', 'Native `input` event dispatched while the color is being edited.'),
      event('change', 'Event', 'Native `change` event dispatched when the edit is committed.'),
    ],
    accessibility(
      null,
      'Colour channels',
      [],
      'The APG has no colour-picker pattern, and this deliberately does not invent one: every control here is a native `input[type="range"]` or `input[type="number"]`, so each channel is its own labelled, tabbable slider or field with its own value announcement, and arrow keys, Home, End, and typing all come from the platform. Timeless names each channel from its definition and keeps the two representations of one channel in step. There is no two-dimensional saturation-value area, because that has no accessible keyboard model that a set of named channels does not already provide better. The generated swatch is decorative and hidden from assistive technology; the value the user is editing is the text of the raw field, and an unparseable draft is marked `aria-invalid` rather than being silently discarded. The channel sliders are 10px tall, which relies on SC 2.5.8 spacing rather than target size — keep the gap between them if you restyle it.',
    ),
  ),
  customElement(
    'form',
    'ui-form',
    'form',
    'UIFormElement',
    'createFormElementClass',
    'defineFormElement',
    'core/form.css',
    [],
    [
      part(
        'form',
        true,
        'form',
        'The native `<form>`. Submission, `method`, `action`, reset, and constraint validation are all still its job; `ui-form` only writes messages onto the fields inside it.',
      ),
      part(
        'error',
        false,
        undefined,
        'The message element for one field, resolved as the single `error` part inside the nearest wrapper that holds no other named control. `.ui-field`, `.ui-choice-group`, and `.ui-fieldset` all produce that shape, so no pairing attribute is needed. `ui-form` writes its text and points the field\u2019s `aria-describedby` at it.',
      ),
    ],
    [],
    [],
    [
      event(
        'ui-invalid',
        'CustomEvent<FormInvalidDetail>',
        'Dispatched after `setErrors` has put at least one message on a control, naming the fields that matched. Clearing errors dispatches nothing.',
      ),
    ],
    accessibility(
      null,
      'Form errors',
      [],
      'There is no APG pattern for server-side error mapping. `ui-form` sets `aria-invalid` on each field it marks and points `aria-describedby` at the authored error text, then moves focus to the first field that took a message \u2014 which is what makes the error reachable rather than merely visible. Everything else, including the native validation bubble, stays with the platform.',
    ),
  ),
  customElement(
    'rangeField',
    'ui-range-field',
    'range-field',
    'UIRangeFieldElement',
    'createRangeFieldElementClass',
    'defineRangeFieldElement',
    ['core/range-field.css', 'themes/atmosphere/range-field.css'],
    [],
    [
      part(
        'track',
        true,
        undefined,
        'Wrapper around the two thumbs. It is the shared track: both inputs stack inside it, and the fill between them is drawn on it from measured bounds.',
      ),
      part(
        'from',
        true,
        "input[type='range']",
        'The lower thumb, a native range input. Give it its own `name`, `min`, `max`, `step`, and accessible name; it submits and resets on its own, with no JavaScript.',
      ),
      part(
        'to',
        true,
        "input[type='range']",
        'The upper thumb. Same contract as `from`, with its own `name` so the pair submits as two entries.',
      ),
      part(
        'output',
        false,
        undefined,
        'Live readout of the pair. Timeless writes the current values into it as text, so omit the part when you want to format them yourself.',
      ),
    ],
    [state('disabled', 'native', true, 'Native `disabled` on either thumb.')],
    [
      variable('--ui-range-track', 'Track thickness.'),
      variable('--ui-range-thumb', 'Thumb diameter.'),
      variable('--ui-range-fill', 'Colour of the filled span between the two thumbs.'),
    ],
    [
      event(
        'ui-change',
        'CustomEvent<RangeFieldChangeDetail>',
        'Dispatched after either thumb moves, carrying the clamped pair and which thumb moved. Bubbles and is composed.',
      ),
    ],
    accessibility(
      'slider-multithumb',
      'Slider (Multi-Thumb)',
      [
        key(
          'Arrow keys, Home / End, Page Up / Page Down',
          'Move the focused thumb. Handled by the native range input, not by Timeless.',
        ),
      ],
      'Each thumb is a native `input[type=range]` and therefore its own tab stop, with its own accessible name and its own value announcement. Timeless only keeps the pair ordered: a thumb stops at its neighbour rather than swapping with it, so the key you are holding never starts moving the other thumb.',
    ),
  ),
  customElement(
    'otpField',
    'ui-otp-field',
    'otp-field',
    'UIOtpFieldElement',
    'createOtpFieldElementClass',
    'defineOtpFieldElement',
    [
      'core/forms.css',
      'core/otp-field.css',
      'themes/atmosphere/forms.css',
      'themes/atmosphere/otp-field.css',
    ],
    [
      attribute('name', 'string', {
        description:
          'Form field name. The joined code submits as one entry through `ElementInternals`; the cells themselves carry no `name`.',
      }),
      attribute('length', 'number', {
        property: { name: 'length', type: 'string' },
        description:
          'How many characters the code has. Defaults to the number of authored cells, and is what a partly filled field is measured against.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The code on load and after a form reset. Assign the `value` property for live changes; once the user types, the attribute stops applying, the way it does on a native input.',
      }),
      attribute('required', 'boolean', {
        description: 'Present to block submission while the field is empty, with `valueMissing`.',
      }),
      attribute('disabled', 'boolean', {
        description:
          'Present to disable the field. A field inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
      }),
    ],
    [
      part(
        'cell',
        true,
        undefined,
        'One native input holding one character. Author `maxlength="1"`, `inputmode="numeric"`, an accessible name naming its position, and `autocomplete="one-time-code"` on the first cell only. Give it `class="ui-input"` to pick up the shared control styling.',
      ),
      part(
        'separator',
        false,
        undefined,
        'Decorative mark between groups of cells, as in `123-456`. Hide it from assistive technology with `aria-hidden="true"`.',
      ),
    ],
    [],
    [variable('--ui-otp-cell', 'Width of one cell.')],
    [
      ...transitionEvents('the code', 'OtpFieldChangeDetail'),
      event(
        'ui-complete',
        'CustomEvent<OtpFieldCompleteDetail>',
        'Dispatched once every character the field expects has been entered, which is where an auto-submit belongs.',
      ),
    ],
    accessibility(
      null,
      'One-time code',
      [
        key('Printable characters', 'Fill the focused cell and move focus to the next one.'),
        key(
          'Backspace',
          'Clear the focused cell, or step back and clear the previous one when it is already empty.',
        ),
        key('Arrow keys', 'Move between cells.'),
        key('Home / End', 'Move to the first or last cell.'),
        key('Paste', 'Spread the pasted code across the cells from the focused one onward.'),
      ],
      'There is no APG pattern for a one-time-code field, so the contract is a composition of things the platform already defines rather than invented ARIA: a named `role="group"` over native inputs, each independently tabbable and separately labelled by position. No roving `tabindex` is written, because every cell is a real tab stop. Autofill, the numeric keyboard, and paste come from the inputs themselves.',
    ),
  ),
  customElement(
    'copyButton',
    'ui-copy-button',
    'copy-button',
    'UICopyButtonElement',
    'createCopyButtonElementClass',
    'defineCopyButtonElement',
    ['core/copy-button.css', 'themes/atmosphere/copy-button.css'],
    [
      attribute('value', 'string', {
        description:
          'The literal text to copy. Wins over `from` on presence rather than content, the way `value` does on an option: an explicit `value=""` is the author saying to copy nothing.',
      }),
      attribute('from', 'string', {
        description:
          'Id of the element to read instead of `value`. An `input`, `textarea`, or `select` gives its current `value`; anything else gives its text. Read at activation rather than cached, so this is the one to reach for when the text is long or changes: it stays current on its own, and nothing is duplicated into an attribute. Assigning the `value` property works too, but a long string then reflects into the DOM.',
      }),
      attribute('feedback-duration', 'number', {
        property: { name: 'feedbackDuration', type: 'string' },
        default: '1800',
        description:
          'Milliseconds the `--copied` state persists after a successful copy, and with it the text in the `status` region \u2014 the two clear together, so copying the same value twice is announced twice. `0` clears both on the next task, which is short enough that a screen reader may miss the announcement.',
      }),
      attribute('copied-message', 'string', {
        property: { name: 'copiedMessage' },
        description:
          'What the `status` region announces after a successful copy. Falls back to the `copied` part\u2019s text, so a button whose confirmation is a word needs no message at all and an icon-only one does. With neither, nothing is announced.',
      }),
    ],
    [
      part(
        'trigger',
        true,
        undefined,
        'Native button that copies. Author it as `<button type="button">` with an accessible name; the name must not change on copy, because a button renamed while it holds focus is announced inconsistently across screen readers.',
      ),
      part(
        'idle',
        false,
        undefined,
        'Shown while nothing has been copied. Decorative \u2014 hide it from assistive technology with `aria-hidden="true"`.',
      ),
      part(
        'copied',
        false,
        undefined,
        'Shown briefly after a successful copy. Decorative in the same way, and its text is the default announcement.',
      ),
      part(
        'status',
        false,
        undefined,
        'A `role="status"` region the confirmation is written into. Author it \u2014 Timeless writes text and never creates the element \u2014 and without it nothing is announced. It is clipped away by default, because the visible confirmation is the `copied` part; restyle it if you want it seen.',
      ),
    ],
    [
      state(
        '--copied',
        'custom-state',
        true,
        'Set for `feedback-duration` after a successful copy. Public: style `ui-copy-button:state(--copied)` yourself.',
      ),
    ],
    [],
    [
      event(
        'ui-before-copy',
        'CustomEvent<CopyProposalDetail>',
        "Cancelable proposal dispatched before anything is written, carrying the resolved `value`. Call `preventDefault()` to reject the copy, and no `ui-copy` follows. Or call `detail.respondWith(promise)` to perform the write yourself \u2014 which is how you copy an image, a blob, or `text/html`, since `writeText` carries a string and nothing else. The element then awaits your promise and drives `--copied`, the announcement, and `ui-copy` from its outcome, so a confirmation never claims a copy that did not happen. Call it synchronously, and call your own clipboard method synchronously too \u2014 the click\u2019s transient user activation is the same one the element depends on. `ClipboardItem` accepts a promised blob, so `new ClipboardItem({ 'image/png': blobPromise })` starts the write immediately while the data resolves.",
        true,
      ),
      event(
        'ui-copy',
        'CustomEvent<CopyDetail>',
        'Dispatched once per activation, on success and on every failure, unless a listener cancelled the proposal. The detail carries `status`, the resolved `value`, and a `reason` naming what went wrong: `empty` when nothing resolved, `unsupported` when there is no Clipboard API, `denied` when the browser refused the write, and `rejected` when a `respondWith` promise failed.',
      ),
    ],
    accessibility(
      'button',
      'Button',
      [],
      'The trigger is a native button, so activation, focus, and the accessible name are the platform\u2019s. Timeless adds only what the platform cannot: the `idle`/`copied` swap is decorative and stays hidden from assistive technology, and the confirmation reaches a screen reader through the authored `status` region rather than by renaming the button. Copying needs `navigator.clipboard`, which is absent outside a secure context; a trigger authored `hidden` is revealed only once the API is there, so a control that cannot work is never shown.',
    ),
  ),
]

export const elements = components.filter((component) => component.kind === 'custom-element')
