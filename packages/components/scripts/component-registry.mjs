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

const part = (
  name,
  required = false,
  selector = `[data-ui-part~='${name}']`,
  description = '',
) => ({
  name,
  required,
  selector,
  description,
})

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
 * `pattern` is an ARIA Authoring Practices pattern slug. `keys` documents only what the component
 * itself implements — keys the platform already handles are called out in `notes` instead, because
 * "the browser does this" is the more useful fact for a progressive-enhancement library.
 */
const accessibility = (pattern, patternLabel, keys = [], notes = '') => ({
  pattern,
  patternLabel,
  keys,
  notes,
})

const key = (name, action) => ({ key: name, action })

/** Arrow, Home, End, and Page navigation shared by every roving-focus collection. */
const COLLECTION_KEYS = (subject, axis = 'orientation') => [
  key(
    'Arrow keys',
    `Move focus to the previous or next ${subject}, following the ${axis} and skipping disabled ones.`,
  ),
  key('Home / End', `Move focus to the first or last enabled ${subject}.`),
  key('Page Up / Page Down', `Jump ten ${subject}s at a time.`),
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
  css: [stylesheet],
  attributes,
  parts,
  states,
  variables,
  events: [],
  accessibility: a11y,
})

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
  css: [stylesheet],
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
    values: ['plain', 'divided', 'inset', 'ordered'],
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

export const components = [
  css(
    'button',
    'ui-button',
    'button.css',
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
    'toggle.css',
    [
      attribute('data-ui-variant', 'string', {
        set: 'buttonVariants',
        default: 'primary',
        description:
          'Visual intent, resolved by `button.css`. Author `class="ui-button ui-toggle"` so the shared button styling applies.',
      }),
      size('buttonSizes', 'Control height, padding, and font size. Resolved by `button.css`.'),
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
    'alert.css',
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
  ),
  css(
    'avatar',
    'ui-avatar',
    'avatar.css',
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
    'badge.css',
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
    'separator.css',
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
    'card.css',
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
  css('skeleton', 'ui-skeleton', 'skeleton.css', [
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
  ]),
  css(
    'progress',
    'ui-progress',
    'progress.css',
    [size('primitiveSizes', 'Track thickness and label size.'), density('compactDensities')],
    [
      part('header', false, undefined, 'Row holding the label and output.'),
      part('output', false, undefined, 'Live percentage or count. Use `<output>`.'),
      part('hint', false, undefined, 'Supporting text under the track.'),
    ],
  ),
  css('link', 'ui-link', 'link.css', [
    attribute('data-ui-variant', 'string', {
      set: 'linkVariants',
      default: 'default',
      description: 'Link color intent.',
    }),
  ]),
  css('kbd', 'ui-kbd', 'kbd.css'),
  css('code', 'ui-code', 'code.css'),
  css('group', 'ui-group', 'group.css', [
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
  ]),
  css(
    'list',
    'ui-list',
    'list.css',
    [
      attribute('data-ui-variant', 'string', {
        set: 'listVariants',
        default: 'plain',
        description:
          'Row treatment. Use `ordered` together with an `<ol>` element, not instead of one.',
      }),
      density('compactDensities', 'Row padding.'),
    ],
    [
      part('item', false, undefined, 'One row. Use `<li>`.'),
      part('title', false, undefined, 'Primary row text.'),
      part('description', false, undefined, 'Secondary row text.'),
    ],
  ),
  css(
    'table',
    'ui-table',
    'table.css',
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
  css('disclosure', 'ui-disclosure', 'disclosure.css', [
    density('compactDensities', 'Summary and content padding.'),
  ]),
  css('collapsible', 'ui-collapsible', 'collapsible.css', [
    density('compactDensities', 'Summary and content padding.'),
  ]),
  css(
    'spinner',
    'ui-spinner',
    'spinner.css',
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
    'empty.css',
    [density('primitiveDensities', 'Vertical rhythm of the empty state.')],
    [
      part('art', false, undefined, 'Decorative illustration or icon.'),
      part('actions', false, undefined, 'Container for the one clear next action.'),
    ],
  ),
  css(
    'meter',
    'ui-meter-field',
    'meter.css',
    [],
    [part('hint', false, undefined, 'Supporting text under the meter.')],
  ),
  css(
    'colorSwatch',
    'ui-color-swatch',
    'color-swatch.css',
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
    'forms.css',
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
  css('label', 'ui-label', 'forms.css'),
  css('description', 'ui-description', 'forms.css'),
  css('error', 'ui-error', 'forms.css'),
  css(
    'input',
    'ui-input',
    'forms.css',
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
    'forms.css',
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
    'forms.css',
    [size('formControlSizes')],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'checkbox',
    'ui-checkbox',
    'forms.css',
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
    'forms.css',
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
    'forms.css',
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
    'forms.css',
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
    'forms.css',
    [],
    [],
    [
      state('invalid', 'native', true, 'Native `:invalid`, or `aria-invalid="true"`.'),
      state('disabled', 'native', true, 'Native `disabled`.'),
    ],
  ),
  css(
    'range',
    'ui-range',
    'range.css',
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
    'forms.css',
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
    'tabs.css',
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
    'dialog.css',
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
      'Focus trapping, the backdrop, and the top layer all come from `showModal()`. Timeless moves initial focus into the panel and returns it to the trigger on close. Give the panel an accessible name with `aria-labelledby`. A dialog invoker gets no implicit `aria-expanded` from the platform, so Timeless keeps writing it on both the authored-command and click paths.',
    ),
  ),
  customElement(
    'sheet',
    'ui-sheet',
    'sheet',
    'UISheetElement',
    'createSheetElementClass',
    'defineSheetElement',
    'sheet.css',
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
    ],
    [],
    [],
    [
      ...overlayEvents('sheet', 'SheetEventDetail'),
      event(
        'ui-dismiss',
        'CustomEvent<SheetEventDetail>',
        'Dispatched when the sheet closes through Escape or a backdrop click rather than an explicit control.',
      ),
    ],
    accessibility(
      'dialog-modal',
      'Modal Dialog',
      [key('Escape', 'Close the sheet. Handled by the native `<dialog>` element.')],
      'A `modal` sheet traps focus through `showModal()`; without `modal` the page stays interactive and focus is not trapped. Timeless restores focus to the trigger either way.',
    ),
  ),
  customElement(
    'popover',
    'ui-popover',
    'popover',
    'UIPopoverElement',
    'createPopoverElementClass',
    'definePopoverElement',
    'popover.css',
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
    [],
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
    'popover.css',
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
    [],
    [],
    accessibility(
      'tooltip',
      'Tooltip',
      [key('Escape', 'Close the surface while the trigger has focus.')],
      'The card opens on both pointer hover and keyboard focus, so it is reachable without a mouse. `close-delay` keeps it open while the pointer crosses the gap into the surface. Never put the only copy of important content here.',
    ),
  ),
  customElement(
    'menu',
    'ui-menu',
    'menu',
    'UIMenuElement',
    'createMenuElementClass',
    'defineMenuElement',
    'menu.css',
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
        'One command. Use `role="menuitem"`, or `menuitemcheckbox` / `menuitemradio` with `aria-checked`. Timeless manages roving `tabindex` and typeahead.',
      ),
    ],
    [],
    [],
    [],
    accessibility(
      'menubar',
      'Menu and Menubar',
      [
        key('Arrow keys', 'Move focus between items along the `orientation` axis.'),
        key('Home / End', 'Move focus to the first or last enabled item.'),
        key('Enter / Space', 'Activate the focused item.'),
        key('Escape', 'Close the menu and return focus to whatever opened it.'),
        key(
          'Printable characters',
          'Typeahead: jump to the next item whose label starts with what you typed.',
        ),
      ],
      'The menu is one tab stop and disabled items are skipped. Typeahead matching is locale-aware.',
    ),
  ),
  customElement(
    'menuButton',
    'ui-menu-button',
    'menu-button',
    'UIMenuButtonElement',
    'createMenuButtonElementClass',
    'defineMenuButtonElement',
    'menu.css',
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
    [],
    overlayEvents('menu', 'MenuButtonToggleDetail'),
    accessibility(
      'menu-button',
      'Menu Button',
      [
        key('Enter / Space / Arrow Down', 'Open the menu and focus its first item.'),
        key('Escape', 'Close the menu and return focus to the trigger.'),
      ],
      'Escape and outside-click dismissal come from the Popover API rather than from Timeless. The trigger carries `aria-haspopup="menu"` and `aria-expanded`.',
    ),
  ),
  customElement(
    'toolbar',
    'ui-toolbar',
    'toolbar',
    'UIToolbarElement',
    'createToolbarElementClass',
    'defineToolbarElement',
    'toolbar.css',
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
      'The whole toolbar is one tab stop. Timeless manages roving `tabindex` so Tab moves past the group rather than through every control.',
    ),
  ),
  customElement(
    'radioGroup',
    'ui-radio-group',
    'choice-group',
    'UIRadioGroupElement',
    'createRadioGroupElementClass',
    'defineRadioGroupElement',
    'choice-group.css',
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
    'choice-group.css',
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
      COLLECTION_KEYS('checkbox'),
      'Space toggles the focused checkbox natively. Every box remains independently reachable and submits its own value.',
    ),
  ),
  customElement(
    'listbox',
    'ui-listbox',
    'listbox',
    'UIListboxElement',
    'createListboxElementClass',
    'defineListboxElement',
    'listbox.css',
    [
      attribute('multiple', 'boolean', {
        description:
          'Present to allow more than one selected option. The `value` property then reads and writes an array.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes.',
      }),
    ],
    [
      part('listbox', true, "[role='listbox']", 'The option container.'),
      part(
        'option',
        true,
        "[role='option']",
        'One option. Its value comes from `value`, then `data-ui-value`, then the element id. Mark unavailable options `aria-disabled="true"`.',
      ),
    ],
    [state('selected', 'aria', true, '`aria-selected="true"` on selected options.')],
    [],
    transitionEvents('the selection', 'ListboxChangeDetail'),
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
      'Selection follows `aria-selected`, and the active option is tracked with `aria-activedescendant` so focus stays on the listbox.',
    ),
  ),
  customElement(
    'select',
    'ui-select',
    'select',
    'UISelectElement',
    'createSelectElementClass',
    'defineSelectElement',
    'select.css',
    [
      attribute('open', 'boolean', {
        description: 'Present to render the listbox open on load.',
      }),
      attribute('placement', 'string', {
        set: 'floatingPlacements',
        default: 'bottom',
        description: 'Preferred side of the trigger for the listbox surface.',
      }),
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Mirror it onto a hidden input to submit with a form.',
      }),
    ],
    [
      part('trigger', true, undefined, 'Native button that opens the listbox.'),
      part('listbox', true, "[role='listbox']", 'The option container and popover surface.'),
      part(
        'option',
        true,
        "[role='option']",
        'One option. Its value comes from `value`, then `data-ui-value`, then the element id.',
      ),
      part('label', false, undefined, 'Element inside the trigger that shows the selected label.'),
    ],
    [],
    [],
    transitionEvents('the selected option', 'SelectChangeDetail'),
    accessibility(
      'combobox',
      'Select-Only Combobox',
      [
        key(
          'Enter / Space',
          'Open the listbox, or commit the active option when it is already open.',
        ),
        key('Arrow keys', 'Move the active option while the listbox is open.'),
        key('Escape', 'Close the listbox without changing the value.'),
        key('Printable characters', 'Typeahead over the option labels.'),
      ],
      'The trigger keeps focus and the active option is announced through `aria-activedescendant`. Light dismiss comes from the Popover API. Mirror `value` onto a hidden input to submit with a form.',
    ),
  ),
  customElement(
    'combobox',
    'ui-combobox',
    'combobox',
    'UIComboboxElement',
    'createComboboxElementClass',
    'defineComboboxElement',
    'combobox.css',
    [
      attribute('value', 'string', {
        property: valueProperty,
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes.',
      }),
    ],
    [
      part(
        'input',
        true,
        "[role='combobox']",
        'The native text input. Timeless wires `aria-expanded`, `aria-controls`, and `aria-activedescendant`.',
      ),
      part('listbox', true, "[role='listbox']", 'The option container.'),
      part(
        'option',
        true,
        "[role='option']",
        'One option. Its value comes from `value`, then `data-ui-value`, then the element id. Filtering hides non-matching options.',
      ),
    ],
    [],
    [],
    transitionEvents('the selected option', 'ComboboxChangeDetail'),
    accessibility(
      'combobox',
      'Combobox',
      [
        key('Arrow Down / Arrow Up', 'Open the listbox, then move the active option.'),
        key('Home / End', 'Move to the first or last matching option.'),
        key('Enter', 'Commit the active option.'),
        key('Escape', 'Close the listbox, then clear the filter on a second press.'),
      ],
      'Focus stays in the text input at all times; the active option is exposed with `aria-activedescendant`. Filtering hides non-matching options rather than removing them.',
    ),
  ),
  customElement(
    'toaster',
    'ui-toaster',
    'toast',
    'UIToasterElement',
    'createToasterElementClass',
    'defineToasterElement',
    'toast.css',
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
  ),
  customElement(
    'toast',
    'ui-toast',
    'toast',
    'UIToastElement',
    'createToastElementClass',
    'defineToastElement',
    'toast.css',
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
  ),
  customElement(
    'toggleGroup',
    'ui-toggle-group',
    'toggle-group',
    'UIToggleGroupElement',
    'createToggleGroupElementClass',
    'defineToggleGroupElement',
    'toggle.css',
    [
      attribute('attached', 'boolean', {
        property: false,
        description:
          'Present to join the buttons into one segmented control. Styling only, resolved by `toggle.css`.',
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
      'button',
      'Button',
      COLLECTION_KEYS('button'),
      'Each button keeps native activation, and `aria-pressed` carries the state. With `selection="single"` pressing one button releases the others.',
    ),
  ),
  customElement(
    'numberStepper',
    'ui-number-stepper',
    'number-stepper',
    'UINumberStepperElement',
    'createNumberStepperElementClass',
    'defineNumberStepperElement',
    'number-stepper.css',
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
  ),
  customElement(
    'colorPicker',
    'ui-color-picker',
    'color-picker',
    'UIColorPickerElement',
    'createColorPickerElementClass',
    'defineColorPickerElement',
    'color-picker.css',
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
  ),
]

export const elements = components.filter((component) => component.kind === 'custom-element')
