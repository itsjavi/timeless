import type {
  AlertVariant,
  AvatarShape,
  AvatarStatus,
  BadgeVariant,
  BreadcrumbSeparator,
  CardVariant,
  CompactDensity,
  GroupOrientation,
  LinkVariant,
  ListVariant,
  PrimitiveDensity,
  PrimitiveSize,
  SeparatorOrientation,
  SeparatorVariant,
  SkeletonShape,
  SkeletonWidth,
  SpinnerVariant,
  TableAlignment,
} from './values/primitives'
import type { ButtonSize, ButtonVariant } from './values/button'
import type {
  ChoiceGroupOrientation,
  FieldLayout,
  FormControlSize,
  FormDensity,
} from './values/forms'

/** Configuration accepted by each CSS-only component root, keyed by contract name. */
export type UIAttributeConfig = {
  button: {
    /** Visual intent. Use `primary` for the main action in a view, `secondary` for neutral actions, `outline` when the action needs a stronger edge, `ghost` for low-emphasis toolbar actions, `danger` and `danger-outline` for destructive actions, and `link` for an action that should read as inline text. */
    variant?: ButtonVariant
    /** Control height, padding, and font size. */
    size?: ButtonSize
  }
  toggle: {
    /** Visual intent, resolved by `button.css`. Author `class="ui-button ui-toggle"` so the shared button styling applies. */
    variant?: ButtonVariant
    /** Control height, padding, and font size. Resolved by `button.css`. */
    size?: ButtonSize
  }
  alert: {
    /** Status intent. This is styling only — set `role="status"` or `role="alert"` yourself to control how assistive technology announces the message. */
    variant?: AlertVariant
    /** Internal spacing. */
    density?: CompactDensity
  }
  avatar: {
    /** Avatar diameter. */
    size?: PrimitiveSize
    /** Corner treatment. */
    shape?: AvatarShape
    /** Presence indicator color. Omit the attribute to hide the indicator. The dot is decorative, so also expose the status in text. */
    status?: AvatarStatus
  }
  badge: {
    /** Status intent. */
    variant?: BadgeVariant
    /** Badge height and font size. */
    size?: PrimitiveSize
  }
  separator: {
    /** Rule direction. Also set `aria-orientation="vertical"` on an `<hr>` when you change this. */
    orientation?: SeparatorOrientation
    /** Line weight and label placement. `centered` positions the label part in the middle of the rule. */
    variant?: SeparatorVariant
  }
  card: {
    /** Background and border treatment. */
    variant?: CardVariant
    /** Internal spacing. */
    density?: CompactDensity
  }
  skeleton: {
    /** Line height for the `text` shape, diameter for `circle`. */
    size?: PrimitiveSize
    /** Placeholder geometry. */
    shape?: SkeletonShape
    /** Inline size, so a group of lines can look like real text. */
    width?: SkeletonWidth
  }
  progress: {
    /** Track thickness and label size. */
    size?: PrimitiveSize
    /** Internal spacing. */
    density?: CompactDensity
  }
  link: {
    /** Link color intent. */
    variant?: LinkVariant
  }
  kbd: {}
  code: {}
  group: {
    /** Layout direction of the grouped controls. */
    orientation?: GroupOrientation
    /** Gap between grouped controls. */
    density?: PrimitiveDensity
    /** Present to let the group wrap onto multiple lines. */
    wrap?: boolean
    /** Present to collapse the gap and join adjacent controls into one segmented control. */
    attached?: boolean
  }
  list: {
    /** Row treatment. Numbering is the element's job, not the attribute's: use `<ol class="ui-list">` for a numbered list and `<ul class="ui-list">` for an unnumbered one. */
    variant?: ListVariant
    /** Row padding. */
    density?: CompactDensity
  }
  table: {
    /** Cell padding. */
    density?: CompactDensity
    /** Cell text alignment. Set it on a `<th>` or `<td>`, not on the table. `end` also enables tabular numerals. */
    align?: TableAlignment
  }
  breadcrumb: {
    /** Which glyph is drawn between crumbs. Both are generated content rather than markup, so neither reaches the accessibility tree and neither is yours to author. For any other glyph, set `--ui-breadcrumb-separator` instead of asking for a new value here. */
    separator?: BreadcrumbSeparator
    /** Gap between a crumb and its separator. */
    density?: CompactDensity
  }
  pagination: {
    /** Cell height, padding, and font size. */
    size?: PrimitiveSize
  }
  collapsible: {
    /** Summary and content padding. */
    density?: CompactDensity
  }
  spinner: {
    /** Spinner diameter. */
    size?: PrimitiveSize
    /** Indicator color. */
    variant?: SpinnerVariant
  }
  empty: {
    /** Vertical rhythm of the empty state. */
    density?: PrimitiveDensity
  }
  meter: {}
  colorSwatch: {}
  field: {
    /** Whether the label sits above the control or beside it. */
    layout?: FieldLayout
    /** Gap between label, control, description, and error. */
    density?: FormDensity
  }
  fieldset: {
    /** Gap between grouped controls, and the padding around them. */
    density?: FormDensity
  }
  label: {}
  description: {}
  error: {}
  input: {
    /** Control height, padding, and font size. */
    size?: FormControlSize
  }
  textarea: {
    /** Control height, padding, and font size. */
    size?: FormControlSize
  }
  nativeSelect: {
    /** Control height, padding, font size, and the size of the drop-down indicator. */
    size?: FormControlSize
  }
  checkbox: {}
  radio: {}
  choice: {
    /** Gap between the control and its label. */
    density?: FormDensity
  }
  choiceGroup: {
    /** Layout direction of the choices. */
    orientation?: ChoiceGroupOrientation
    /** Gap between choices. */
    density?: FormDensity
  }
  switch: {}
  range: {
    /** Track thickness, thumb diameter, and label size. */
    size?: FormControlSize
  }
  file: {}
}

export type UIAttributeComponent = keyof UIAttributeConfig

/** Attributes ready to spread onto a native element, in any framework or template language. */
export type UIAttributeResult = { class: string } & Record<`data-ui-${string}`, string>

/**
 * The root class and the declared attribute defaults, inlined at generation time. Reading the two
 * out of `componentContracts` pulled the whole contract registry into the browser for a helper that
 * emits strings, which made the typed convenience API the most expensive import in the package.
 * `componentContracts` stays where it belongs: `validate.ts` and genuine introspection.
 */
const roots: Readonly<
  Record<
    UIAttributeComponent,
    { readonly class: string; readonly defaults: Readonly<Record<string, string>> }
  >
> = {
  button: { class: 'ui-button', defaults: { 'data-ui-variant': 'primary', 'data-ui-size': 'md' } },
  toggle: { class: 'ui-toggle', defaults: { 'data-ui-variant': 'primary', 'data-ui-size': 'md' } },
  alert: {
    class: 'ui-alert',
    defaults: { 'data-ui-variant': 'neutral', 'data-ui-density': 'normal' },
  },
  avatar: { class: 'ui-avatar', defaults: { 'data-ui-size': 'md', 'data-ui-shape': 'circle' } },
  badge: { class: 'ui-badge', defaults: { 'data-ui-variant': 'neutral', 'data-ui-size': 'md' } },
  separator: {
    class: 'ui-separator',
    defaults: { 'data-ui-orientation': 'horizontal', 'data-ui-variant': 'default' },
  },
  card: {
    class: 'ui-card',
    defaults: { 'data-ui-variant': 'surface', 'data-ui-density': 'normal' },
  },
  skeleton: {
    class: 'ui-skeleton',
    defaults: { 'data-ui-size': 'md', 'data-ui-shape': 'text', 'data-ui-width': 'full' },
  },
  progress: {
    class: 'ui-progress',
    defaults: { 'data-ui-size': 'md', 'data-ui-density': 'normal' },
  },
  link: { class: 'ui-link', defaults: { 'data-ui-variant': 'default' } },
  kbd: { class: 'ui-kbd', defaults: {} },
  code: { class: 'ui-code', defaults: {} },
  group: {
    class: 'ui-group',
    defaults: { 'data-ui-orientation': 'horizontal', 'data-ui-density': 'normal' },
  },
  list: { class: 'ui-list', defaults: { 'data-ui-variant': 'plain', 'data-ui-density': 'normal' } },
  table: { class: 'ui-table', defaults: { 'data-ui-density': 'normal', 'data-ui-align': 'start' } },
  breadcrumb: {
    class: 'ui-breadcrumb',
    defaults: { 'data-ui-separator': 'chevron', 'data-ui-density': 'normal' },
  },
  pagination: { class: 'ui-pagination', defaults: { 'data-ui-size': 'md' } },
  collapsible: { class: 'ui-collapsible', defaults: { 'data-ui-density': 'normal' } },
  spinner: {
    class: 'ui-spinner',
    defaults: { 'data-ui-size': 'md', 'data-ui-variant': 'neutral' },
  },
  empty: { class: 'ui-empty', defaults: { 'data-ui-density': 'normal' } },
  meter: { class: 'ui-meter-field', defaults: {} },
  colorSwatch: { class: 'ui-color-swatch', defaults: {} },
  field: {
    class: 'ui-field',
    defaults: { 'data-ui-layout': 'stacked', 'data-ui-density': 'normal' },
  },
  fieldset: { class: 'ui-fieldset', defaults: { 'data-ui-density': 'normal' } },
  label: { class: 'ui-label', defaults: {} },
  description: { class: 'ui-description', defaults: {} },
  error: { class: 'ui-error', defaults: {} },
  input: { class: 'ui-input', defaults: { 'data-ui-size': 'md' } },
  textarea: { class: 'ui-textarea', defaults: { 'data-ui-size': 'md' } },
  nativeSelect: { class: 'ui-select', defaults: { 'data-ui-size': 'md' } },
  checkbox: { class: 'ui-checkbox', defaults: {} },
  radio: { class: 'ui-radio', defaults: {} },
  choice: { class: 'ui-choice', defaults: { 'data-ui-density': 'normal' } },
  choiceGroup: {
    class: 'ui-choice-group',
    defaults: { 'data-ui-orientation': 'vertical', 'data-ui-density': 'normal' },
  },
  switch: { class: 'ui-switch', defaults: {} },
  range: { class: 'ui-range', defaults: { 'data-ui-size': 'md' } },
  file: { class: 'ui-file', defaults: {} },
}

/**
 * Builds the root class and `data-ui-*` attributes for a CSS-only component.
 *
 * ```ts
 * uiAttributes('button', { variant: 'primary', size: 'lg' })
 * // { class: 'ui-button', 'data-ui-variant': 'primary', 'data-ui-size': 'lg' }
 * ```
 *
 * Boolean attributes are presence-based, so `true` emits an empty value and `false` omits the
 * attribute entirely. Extra classes are appended after the root class, never in place of it.
 */
export function uiAttributes<TComponent extends UIAttributeComponent>(
  component: TComponent,
  config: UIAttributeConfig[TComponent] & { class?: string } = {} as UIAttributeConfig[TComponent],
): UIAttributeResult {
  const { class: extraClass, ...values } = config as Record<string, unknown>
  const result: UIAttributeResult = {
    class: [roots[component].class, extraClass].filter(Boolean).join(' '),
  }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === false) continue
    result[`data-ui-${key}`] = value === true ? '' : String(value)
  }
  return result
}

export type UIAttributeStringOptions = {
  /**
   * Omit any value that equals the contract default, because the default is the stylesheet's base
   * rule and needs no attribute. Keeps generated markup as short as hand-authored markup. Defaults
   * to `true`.
   */
  readonly omitDefaults?: boolean
}

/**
 * The same attributes, serialized for a template literal.
 *
 * ```ts
 * `<button ${uiAttributeString('button', { variant: 'danger' })} type="button">Delete</button>`
 * // <button class="ui-button" data-ui-variant="danger" type="button">Delete</button>
 * ```
 *
 * Defaults are dropped by default, so the contract owns which values are worth writing down and a
 * template never restates them.
 */
export function uiAttributeString<TComponent extends UIAttributeComponent>(
  component: TComponent,
  config: UIAttributeConfig[TComponent] & { class?: string } = {} as UIAttributeConfig[TComponent],
  options: UIAttributeStringOptions = {},
): string {
  const defaults = roots[component].defaults
  const entries = Object.entries(uiAttributes(component, config)).filter(
    ([name, value]) => options.omitDefaults === false || defaults[name] !== value,
  )
  return entries.map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(' ')
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}
