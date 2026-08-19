export type ComponentKind = 'css' | 'custom-element'

export type ComponentRoot =
  | { readonly kind: 'class'; readonly name: `ui-${string}` }
  | { readonly kind: 'element'; readonly name: `ui-${string}` }
  /** A configuration of another component's element, named by the selector that selects it. */
  | { readonly kind: 'selector'; readonly name: `ui-${string}` }

/** One public configuration attribute, with the values the stylesheets actually implement. */
export type ComponentAttributeContract = {
  readonly name: string
  /** `boolean` attributes are presence-based: author the attribute, never a value. */
  readonly type: string
  /**
   * Name of the exported `as const` array holding these values, for example `buttonVariants`.
   * Import it from the package root to drive a control, a validator, or a test.
   */
  readonly set?: string
  /** Absent when the attribute takes free-form input such as an element id or a CSS color. */
  readonly values?: readonly string[]
  /** The value that applies when the attribute is absent. Absent when omitting it means "off". */
  readonly default?: string
  readonly description: string
}

export type ComponentPartContract = {
  readonly name: string
  readonly required: boolean
  readonly selector: string
  readonly description: string
}

export type ComponentStateContract = {
  readonly name: string
  readonly source: 'native' | 'aria' | 'custom-state' | 'internal-data'
  readonly public: boolean
  readonly description: string
}

/**
 * A CSS custom property a consumer may set to restyle the component. The global Atmosphere tokens a
 * component reads are documented once in the theming guide instead of per component.
 */
export type ComponentVariableContract = {
  readonly name: string
  readonly description: string
}

export type ComponentEventContract = {
  readonly name: string
  readonly type: string
  readonly description: string
  readonly cancelable: boolean
}

/** Keyboard and focus behavior the component implements itself. */
export type ComponentAccessibilityContract = {
  /** ARIA Authoring Practices pattern slug, e.g. `tabs`. */
  readonly pattern: string
  readonly patternLabel: string
  readonly keys: readonly { readonly key: string; readonly action: string }[]
  /** What the platform handles, and what the author still owns. */
  readonly notes: string
}

export type ComponentContract = {
  readonly kind: ComponentKind
  readonly root: ComponentRoot
  readonly css: readonly string[]
  readonly attributes: readonly ComponentAttributeContract[]
  readonly parts: readonly ComponentPartContract[]
  readonly states: readonly ComponentStateContract[]
  readonly variables: readonly ComponentVariableContract[]
  readonly events: readonly ComponentEventContract[]
  /** Present for components that implement keyboard behavior of their own. */
  readonly accessibility?: ComponentAccessibilityContract
}

export type ComponentName =
  | 'button'
  | 'toggle'
  | 'alert'
  | 'avatar'
  | 'badge'
  | 'separator'
  | 'card'
  | 'skeleton'
  | 'progress'
  | 'link'
  | 'kbd'
  | 'code'
  | 'group'
  | 'list'
  | 'table'
  | 'collapsible'
  | 'spinner'
  | 'empty'
  | 'meter'
  | 'colorSwatch'
  | 'field'
  | 'label'
  | 'description'
  | 'error'
  | 'input'
  | 'textarea'
  | 'nativeSelect'
  | 'checkbox'
  | 'radio'
  | 'choice'
  | 'choiceGroup'
  | 'switch'
  | 'range'
  | 'file'
  | 'tabs'
  | 'dialog'
  | 'sheet'
  | 'popover'
  | 'hoverCard'
  | 'tooltip'
  | 'menu'
  | 'menuButton'
  | 'toolbar'
  | 'radioGroup'
  | 'checkboxGroup'
  | 'listbox'
  | 'select'
  | 'combobox'
  | 'toaster'
  | 'toast'
  | 'toggleGroup'
  | 'numberStepper'
  | 'colorPicker'

export const componentContracts = {
  button: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-button',
    },
    css: ['button.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'buttonVariants',
        values: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'danger-outline', 'link'],
        default: 'primary',
        description:
          'Visual intent. Use `primary` for the main action in a view, `secondary` for neutral actions, `outline` when the action needs a stronger edge, `ghost` for low-emphasis toolbar actions, `danger` and `danger-outline` for destructive actions, and `link` for an action that should read as inline text.',
      },
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'buttonSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, and font size.',
      },
    ],
    parts: [],
    states: [
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`, or `aria-disabled` on an anchor.',
      },
    ],
    variables: [
      {
        name: '--ui-button-bg',
        description: 'Resting background.',
      },
      {
        name: '--ui-button-bg-hover',
        description: 'Hover background.',
      },
      {
        name: '--ui-button-bg-active',
        description: 'Active background.',
      },
      {
        name: '--ui-button-fg',
        description: 'Label color.',
      },
      {
        name: '--ui-button-fg-hover',
        description: 'Hover label color.',
      },
      {
        name: '--ui-button-border',
        description: 'Border color.',
      },
      {
        name: '--ui-button-shadow',
        description: 'Resting shadow.',
      },
      {
        name: '--ui-button-shadow-hover',
        description: 'Hover shadow.',
      },
      {
        name: '--ui-button-shadow-active',
        description: 'Active shadow.',
      },
      {
        name: '--ui-button-height',
        description: 'Minimum block size.',
      },
      {
        name: '--ui-button-padding-x',
        description: 'Inline padding.',
      },
      {
        name: '--ui-button-gap',
        description: 'Gap between icon and label.',
      },
      {
        name: '--ui-button-radius',
        description: 'Corner radius.',
      },
    ],
    events: [],
  },
  toggle: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-toggle',
    },
    css: ['toggle.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'buttonVariants',
        values: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'danger-outline', 'link'],
        default: 'primary',
        description:
          'Visual intent, resolved by `button.css`. Author `class="ui-button ui-toggle"` so the shared button styling applies.',
      },
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'buttonSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, and font size. Resolved by `button.css`.',
      },
    ],
    parts: [],
    states: [
      {
        name: 'pressed',
        source: 'aria',
        public: true,
        description: 'Author `aria-pressed="true"` or `"false"`; never omit it.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  alert: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-alert',
    },
    css: ['alert.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'alertVariants',
        values: ['neutral', 'accent', 'success', 'warning', 'danger'],
        default: 'neutral',
        description:
          'Status intent. This is styling only — set `role="status"` or `role="alert"` yourself to control how assistive technology announces the message.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Internal spacing.',
      },
    ],
    parts: [
      {
        name: 'icon',
        required: false,
        selector: "[data-ui-part~='icon']",
        description: 'Decorative status icon. Mark it `aria-hidden="true"`.',
      },
      {
        name: 'content',
        required: false,
        selector: "[data-ui-part~='content']",
        description: 'Wrapper for the title and description.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title']",
        description: 'Short summary line.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Supporting detail.',
      },
      {
        name: 'actions',
        required: false,
        selector: "[data-ui-part~='actions']",
        description: 'Container for one or two follow-up actions.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  avatar: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-avatar',
    },
    css: ['avatar.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'primitiveSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Avatar diameter.',
      },
      {
        name: 'data-ui-shape',
        type: 'string',
        set: 'avatarShapes',
        values: ['circle', 'rounded', 'square'],
        default: 'circle',
        description: 'Corner treatment.',
      },
      {
        name: 'data-ui-status',
        type: 'string',
        set: 'avatarStatuses',
        values: ['online', 'away', 'busy', 'offline'],
        description:
          'Presence indicator color. Omit the attribute to hide the indicator. The dot is decorative, so also expose the status in text.',
      },
    ],
    parts: [
      {
        name: 'image',
        required: false,
        selector: "[data-ui-part~='image']",
        description: 'The `<img>`. Give it an empty `alt` when a label follows.',
      },
      {
        name: 'fallback',
        required: false,
        selector: "[data-ui-part~='fallback']",
        description: 'Initials or icon shown when no image loads.',
      },
      {
        name: 'status',
        required: false,
        selector: "[data-ui-part~='status']",
        description: 'Presence dot. Decorative; keep it `aria-hidden="true"`.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  badge: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-badge',
    },
    css: ['badge.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'badgeVariants',
        values: ['neutral', 'accent', 'success', 'warning', 'danger', 'outline'],
        default: 'neutral',
        description: 'Status intent.',
      },
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'primitiveSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Badge height and font size.',
      },
    ],
    parts: [
      {
        name: 'dot',
        required: false,
        selector: "[data-ui-part~='dot']",
        description: 'Leading status dot. Decorative.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  separator: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-separator',
    },
    css: ['separator.css'],
    attributes: [
      {
        name: 'data-ui-orientation',
        type: 'string',
        set: 'separatorOrientations',
        values: ['horizontal', 'vertical'],
        default: 'horizontal',
        description:
          'Rule direction. Also set `aria-orientation="vertical"` on an `<hr>` when you change this.',
      },
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'separatorVariants',
        values: ['default', 'strong', 'centered'],
        default: 'default',
        description:
          'Line weight and label placement. `centered` positions the label part in the middle of the rule.',
      },
    ],
    parts: [
      {
        name: 'label',
        required: false,
        selector: "[data-ui-part~='label']",
        description: 'Optional inline label rendered over the rule.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  card: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-card',
    },
    css: ['card.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'cardVariants',
        values: ['surface', 'filled', 'ghost'],
        default: 'surface',
        description: 'Background and border treatment.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Internal spacing.',
      },
    ],
    parts: [
      {
        name: 'header',
        required: false,
        selector: "[data-ui-part~='header']",
        description: 'Top region, usually the title and meta.',
      },
      {
        name: 'body',
        required: false,
        selector: "[data-ui-part~='body']",
        description: 'Main content region.',
      },
      {
        name: 'footer',
        required: false,
        selector: "[data-ui-part~='footer']",
        description: 'Bottom region, usually actions.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title']",
        description: 'Card heading. Use a real heading element.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Supporting copy under the title.',
      },
      {
        name: 'meta',
        required: false,
        selector: "[data-ui-part~='meta']",
        description: 'Secondary metadata such as a category or date.',
      },
      {
        name: 'actions',
        required: false,
        selector: "[data-ui-part~='actions']",
        description: 'Container for card actions.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  skeleton: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-skeleton',
    },
    css: ['skeleton.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'primitiveSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Line height for the `text` shape, diameter for `circle`.',
      },
      {
        name: 'data-ui-shape',
        type: 'string',
        set: 'skeletonShapes',
        values: ['text', 'circle', 'media'],
        default: 'text',
        description: 'Placeholder geometry.',
      },
      {
        name: 'data-ui-width',
        type: 'string',
        set: 'skeletonWidths',
        values: ['full', 'medium', 'short'],
        default: 'full',
        description: 'Inline size, so a group of lines can look like real text.',
      },
    ],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  progress: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-progress',
    },
    css: ['progress.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'primitiveSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Track thickness and label size.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Internal spacing.',
      },
    ],
    parts: [
      {
        name: 'header',
        required: false,
        selector: "[data-ui-part~='header']",
        description: 'Row holding the label and output.',
      },
      {
        name: 'output',
        required: false,
        selector: "[data-ui-part~='output']",
        description: 'Live percentage or count. Use `<output>`.',
      },
      {
        name: 'hint',
        required: false,
        selector: "[data-ui-part~='hint']",
        description: 'Supporting text under the track.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  link: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-link',
    },
    css: ['link.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'linkVariants',
        values: ['default', 'muted', 'danger'],
        default: 'default',
        description: 'Link color intent.',
      },
    ],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  kbd: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-kbd',
    },
    css: ['kbd.css'],
    attributes: [],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  code: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-code',
    },
    css: ['code.css'],
    attributes: [],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  group: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-group',
    },
    css: ['group.css'],
    attributes: [
      {
        name: 'data-ui-orientation',
        type: 'string',
        set: 'groupOrientations',
        values: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Layout direction of the grouped controls.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'primitiveDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Gap between grouped controls.',
      },
      {
        name: 'data-ui-wrap',
        type: 'boolean',
        description: 'Present to let the group wrap onto multiple lines.',
      },
      {
        name: 'data-ui-attached',
        type: 'boolean',
        description:
          'Present to collapse the gap and join adjacent controls into one segmented control.',
      },
    ],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  list: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-list',
    },
    css: ['list.css'],
    attributes: [
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'listVariants',
        values: ['plain', 'divided', 'inset'],
        default: 'plain',
        description:
          'Row treatment. Numbering is the element\'s job, not the attribute\'s: use `<ol class="ui-list">` for a numbered list and `<ul class="ui-list">` for an unnumbered one.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Row padding.',
      },
    ],
    parts: [
      {
        name: 'item',
        required: false,
        selector: "[data-ui-part~='item']",
        description: 'One row. Use `<li>`.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title']",
        description: 'Primary row text.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Secondary row text.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-list-gap',
        description: 'Gap between rows. `divided` collapses it to zero.',
      },
      {
        name: '--ui-list-item-padding-block',
        description: 'Block padding of a `divided` row.',
      },
      {
        name: '--ui-list-item-padding-inline',
        description: 'Inline padding of a `divided` row.',
      },
    ],
    events: [],
  },
  table: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-table',
    },
    css: ['table.css'],
    attributes: [
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Cell padding.',
      },
      {
        name: 'data-ui-align',
        type: 'string',
        set: 'tableAlignments',
        values: ['start', 'end'],
        default: 'start',
        description:
          'Cell text alignment. Set it on a `<th>` or `<td>`, not on the table. `end` also enables tabular numerals.',
      },
    ],
    parts: [
      {
        name: 'caption',
        required: false,
        selector: "[data-ui-part~='caption']",
        description: 'Table name. Use `<caption>`.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Supporting copy inside the caption.',
      },
      {
        name: 'empty',
        required: false,
        selector: "[data-ui-part~='empty']",
        description: 'Row shown in place of data when the table has none.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  collapsible: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-collapsible',
    },
    css: ['collapsible.css'],
    attributes: [
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'compactDensities',
        values: ['compact', 'normal'],
        default: 'normal',
        description: 'Summary and content padding.',
      },
    ],
    parts: [],
    states: [],
    variables: [
      {
        name: '--ui-collapsible-line',
        description: 'Divider color between rows.',
      },
      {
        name: '--ui-collapsible-trigger-min-block-size',
        description: 'Minimum summary height.',
      },
      {
        name: '--ui-collapsible-trigger-padding-block',
        description: 'Block padding inside the summary.',
      },
      {
        name: '--ui-collapsible-trigger-gap',
        description: 'Gap between the summary text and the indicator.',
      },
      {
        name: '--ui-collapsible-panel-padding-block-end',
        description: 'Block-end padding below the panel.',
      },
      {
        name: '--ui-collapsible-icon-size',
        description: 'Size of the chevron indicator.',
      },
      {
        name: '--ui-collapsible-duration',
        description: 'Indicator and panel transition duration.',
      },
    ],
    events: [],
    accessibility: {
      pattern: 'disclosure',
      patternLabel: 'Disclosure',
      keys: [],
      notes:
        'Every key comes from native `<details>` and `<summary>`: Enter and Space toggle, Tab reaches the summary, and find-in-page opens a closed panel to reveal a match. Timeless adds no script and no ARIA, because the platform already exposes the button, its expanded state, and the region it controls. For an accordion where only one panel is open at a time, give every `<details>` in the stack the same `name`; the browser closes the previously open one, with no JavaScript involved.',
    },
  },
  spinner: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-spinner',
    },
    css: ['spinner.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'primitiveSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Spinner diameter.',
      },
      {
        name: 'data-ui-variant',
        type: 'string',
        set: 'spinnerVariants',
        values: ['neutral', 'accent', 'success', 'warning', 'danger'],
        default: 'neutral',
        description: 'Indicator color.',
      },
    ],
    parts: [
      {
        name: 'label',
        required: false,
        selector: "[data-ui-part~='label']",
        description: 'Visible or screen-reader-only description of the wait.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  empty: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-empty',
    },
    css: ['empty.css'],
    attributes: [
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'primitiveDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Vertical rhythm of the empty state.',
      },
    ],
    parts: [
      {
        name: 'art',
        required: false,
        selector: "[data-ui-part~='art']",
        description: 'Decorative illustration or icon.',
      },
      {
        name: 'actions',
        required: false,
        selector: "[data-ui-part~='actions']",
        description: 'Container for the one clear next action.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  meter: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-meter-field',
    },
    css: ['meter.css'],
    attributes: [],
    parts: [
      {
        name: 'hint',
        required: false,
        selector: "[data-ui-part~='hint']",
        description: 'Supporting text under the meter.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  colorSwatch: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-color-swatch',
    },
    css: ['color-swatch.css'],
    attributes: [],
    parts: [
      {
        name: 'chip',
        required: false,
        selector: "[data-ui-part~='chip']",
        description: 'The color area. Set the color through `--ui-swatch-color`.',
      },
      {
        name: 'label',
        required: false,
        selector: "[data-ui-part~='label']",
        description: 'Human-readable color name.',
      },
      {
        name: 'value',
        required: false,
        selector: "[data-ui-part~='value']",
        description: 'The raw CSS color value.',
      },
      {
        name: 'warning',
        required: false,
        selector: "[data-ui-part~='warning']",
        description: 'Out-of-gamut or contrast warning.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  field: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-field',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-layout',
        type: 'string',
        set: 'fieldLayouts',
        values: ['stacked', 'inline'],
        default: 'stacked',
        description: 'Whether the label sits above the control or beside it.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'formDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Gap between label, control, description, and error.',
      },
    ],
    parts: [
      {
        name: 'control',
        required: false,
        selector: "[data-ui-part~='control']",
        description: 'Wrapper around the native control when one is needed.',
      },
    ],
    states: [
      {
        name: 'invalid',
        source: 'aria',
        public: true,
        description:
          'Set `aria-invalid="true"` on the control and point `aria-describedby` at the error part.',
      },
    ],
    variables: [],
    events: [],
  },
  label: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-label',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  description: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-description',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  error: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-error',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [],
    variables: [],
    events: [],
  },
  input: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-input',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'formControlSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, and font size.',
      },
    ],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  textarea: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-textarea',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'formControlSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, and font size.',
      },
    ],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  nativeSelect: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-select',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'formControlSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, and font size.',
      },
    ],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  checkbox: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-checkbox',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  radio: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-radio',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  choice: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-choice',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'formDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Gap between the control and its label.',
      },
    ],
    parts: [
      {
        name: 'body',
        required: false,
        selector: "[data-ui-part~='body']",
        description: 'Wrapper for the title and description beside the control.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title']",
        description: 'The choice label text.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Supporting copy under the choice label.',
      },
    ],
    states: [],
    variables: [],
    events: [],
  },
  choiceGroup: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-choice-group',
    },
    css: ['forms.css'],
    attributes: [
      {
        name: 'data-ui-orientation',
        type: 'string',
        set: 'choiceGroupOrientations',
        values: ['vertical', 'horizontal'],
        default: 'vertical',
        description: 'Layout direction of the choices.',
      },
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'formDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Gap between choices.',
      },
    ],
    parts: [
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Group-level help text under the legend.',
      },
      {
        name: 'error',
        required: false,
        selector: "[data-ui-part~='error']",
        description: 'Group-level validation message.',
      },
    ],
    states: [
      {
        name: 'invalid',
        source: 'aria',
        public: true,
        description: 'Set `aria-invalid="true"` on the `<fieldset>` and describe the error.',
      },
    ],
    variables: [],
    events: [],
  },
  switch: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-switch',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  range: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-range',
    },
    css: ['range.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'formControlSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Track thickness, thumb diameter, and label size.',
      },
    ],
    parts: [
      {
        name: 'hint',
        required: false,
        selector: "[data-ui-part~='hint']",
        description: 'Supporting text or the live `<output>` value.',
      },
    ],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [
      {
        name: '--ui-range-track',
        description: 'Track thickness.',
      },
      {
        name: '--ui-range-thumb',
        description: 'Thumb diameter.',
      },
    ],
    events: [],
  },
  file: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-file',
    },
    css: ['forms.css'],
    attributes: [],
    parts: [],
    states: [
      {
        name: 'invalid',
        source: 'native',
        public: true,
        description: 'Native `:invalid`, or `aria-invalid="true"`.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled`.',
      },
    ],
    variables: [],
    events: [],
  },
  tabs: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-tabs',
    },
    css: ['tabs.css'],
    attributes: [
      {
        name: 'activation',
        type: 'string',
        set: 'tabsActivations',
        values: ['automatic', 'manual'],
        default: 'automatic',
        description:
          'Whether moving focus with the arrow keys selects the tab immediately (`automatic`) or waits for Enter or Space (`manual`). Use `manual` when selecting a tab is expensive.',
      },
      {
        name: 'orientation',
        type: 'string',
        set: 'tabsOrientations',
        values: ['horizontal', 'vertical'],
        default: 'horizontal',
        description:
          'Arrow-key axis. Mirrored onto `aria-orientation` on the tablist during enhancement.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The tab selected on load and after a form reset. Match a tab’s `value` attribute. Assign the `value` property for live changes.',
      },
    ],
    parts: [
      {
        name: 'tablist',
        required: true,
        selector: "[role='tablist']",
        description: 'Container for the tabs.',
      },
      {
        name: 'tab',
        required: true,
        selector: "[role='tab']",
        description:
          'One tab. Use `<button type="button">` and give it a `value`; Timeless wires `id`, `aria-controls`, `aria-selected`, and `tabindex`.',
      },
      {
        name: 'tabpanel',
        required: true,
        selector: "[role='tabpanel']",
        description:
          'One panel per tab, in the same order. Timeless wires `id`, `aria-labelledby`, and `hidden`.',
      },
    ],
    states: [
      {
        name: 'selected',
        source: 'aria',
        public: true,
        description: '`aria-selected="true"` on the active tab.',
      },
    ],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<TabsChangeDetail>',
        description:
          'Cancelable proposal dispatched before the selected tab changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<TabsChangeDetail>',
        description: 'Dispatched after the selected tab has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'tabs',
      patternLabel: 'Tabs',
      keys: [
        {
          key: 'Arrow keys',
          action: 'Move focus between tabs along the `orientation` axis.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last tab.',
        },
        {
          key: 'Enter / Space',
          action:
            'Select the focused tab. Only needed when `activation` is `manual`; with `automatic` the arrow keys select as they move.',
        },
      ],
      notes:
        'The tablist is one tab stop: Tab moves into the selected tab, then out to the panel. Timeless manages roving `tabindex`, `aria-selected`, and panel `hidden`.',
    },
  },
  dialog: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-dialog',
    },
    css: ['dialog.css'],
    attributes: [
      {
        name: 'kind',
        type: 'string',
        set: 'dialogKinds',
        values: ['dialog', 'alert'],
        default: 'dialog',
        description:
          'Whether the panel is a regular dialog or an alert dialog. `alert` resolves to `role="alertdialog"`, for a destructive confirmation the user must answer.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description:
          'Native button that opens the dialog. Add `command="show-modal"` and `commandfor` naming the panel id to open it from markup, before any script runs. Timeless reads those attributes and stands down; it never writes them, because a generated attribute would only work once the bundle had loaded.',
      },
      {
        name: 'panel',
        required: true,
        selector: 'dialog',
        description:
          'The native `<dialog>` element. Author it, do not generate it. Give it an explicit `id` when a trigger or close button invokes it, since an invoker can only name an id the author wrote.',
      },
      {
        name: 'close',
        required: false,
        selector: "[data-ui-part~='close']",
        description:
          'Optional explicit close button inside the panel. Add `command="close"` and `commandfor` to close it from markup; the platform then also copies the button `value` into `returnValue`.',
      },
    ],
    states: [],
    variables: [],
    events: [],
    accessibility: {
      pattern: 'dialog-modal',
      patternLabel: 'Modal Dialog',
      keys: [
        {
          key: 'Escape',
          action: 'Close the dialog. Handled by the native `<dialog>` element, not by Timeless.',
        },
      ],
      notes:
        'Focus trapping, the backdrop, and the top layer all come from `showModal()`. Timeless moves initial focus into the panel and returns it to the trigger on close. Give the panel an accessible name with `aria-labelledby`. A dialog invoker gets no implicit `aria-expanded` from the platform, so Timeless keeps writing it on both the authored-command and click paths.',
    },
  },
  sheet: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-sheet',
    },
    css: ['sheet.css'],
    attributes: [
      {
        name: 'modal',
        type: 'boolean',
        description:
          'Present to open the sheet as a modal, trapping focus and blocking the page behind it. Omit for a non-modal sheet the user can interact around.',
      },
      {
        name: 'open',
        type: 'boolean',
        description: 'Present to render the sheet open on load.',
      },
      {
        name: 'position',
        type: 'string',
        set: 'sheetPositions',
        values: ['top', 'right', 'bottom', 'left'],
        default: 'right',
        description: 'Which viewport edge the sheet slides in from.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description:
          'Native button that opens the sheet. On a `modal` sheet, add `command="show-modal"` and `commandfor` naming the panel id to open it from markup, before any script runs. A non-modal sheet has no declarative equivalent: the platform has no built-in command for `dialog.show()`, so its trigger stays on the click listener.',
      },
      {
        name: 'panel',
        required: true,
        selector: 'dialog',
        description:
          'The native `<dialog>` element. Give it an explicit `id` when a trigger or close button invokes it, since an invoker can only name an id the author wrote.',
      },
      {
        name: 'close',
        required: false,
        selector: "[data-ui-part~='close']",
        description:
          'Optional explicit close button. Add `command="close"` and `commandfor` to close it from markup, on modal and non-modal sheets alike; the platform then also copies the button `value` into `returnValue`.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-open',
        type: 'CustomEvent<SheetEventDetail>',
        description: 'Dispatched after the sheet opens.',
        cancelable: false,
      },
      {
        name: 'ui-close',
        type: 'CustomEvent<SheetEventDetail>',
        description: 'Dispatched after the sheet closes.',
        cancelable: false,
      },
      {
        name: 'ui-dismiss',
        type: 'CustomEvent<SheetEventDetail>',
        description:
          'Dispatched when the sheet closes through Escape or a backdrop click rather than an explicit control.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'dialog-modal',
      patternLabel: 'Modal Dialog',
      keys: [
        {
          key: 'Escape',
          action: 'Close the sheet. Handled by the native `<dialog>` element.',
        },
      ],
      notes:
        'A `modal` sheet traps focus through `showModal()`; without `modal` the page stays interactive and focus is not trapped. Timeless restores focus to the trigger either way.',
    },
  },
  popover: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-popover',
    },
    css: ['popover.css'],
    attributes: [
      {
        name: 'placement',
        type: 'string',
        set: 'floatingPlacements',
        values: ['bottom', 'top', 'right', 'left'],
        default: 'bottom',
        description:
          'Preferred side of the trigger. Positioning uses CSS anchor positioning, so the browser may flip the surface to keep it on screen.',
      },
      {
        name: 'role',
        type: 'string',
        set: 'popoverRoles',
        values: ['dialog', 'menu', 'listbox', 'tooltip'],
        default: 'dialog',
        description:
          'Semantics applied to the surface, and the `aria-haspopup` value set on the trigger. Choose it from the interaction, not the appearance.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description: 'Native button that opens the surface.',
      },
      {
        name: 'content',
        required: true,
        selector: '[popover]',
        description:
          'The surface. Author the `popover` attribute so it stays hidden before enhancement.',
      },
    ],
    states: [],
    variables: [],
    events: [],
    accessibility: {
      pattern: 'disclosure',
      patternLabel: 'Disclosure',
      keys: [
        {
          key: 'Escape',
          action: 'Close the surface. Handled by the Popover API, not by Timeless.',
        },
      ],
      notes:
        'Light dismiss, Escape, and top-layer stacking come from the Popover API. Timeless wires `popovertarget`, `aria-controls`, `aria-expanded`, and `aria-haspopup`, and gives the surface the `role` you asked for. Name the surface yourself when it is a dialog.',
    },
  },
  hoverCard: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-hover-card',
    },
    css: ['popover.css'],
    attributes: [
      {
        name: 'anchor',
        type: 'string',
        description:
          'Id of an element to anchor against instead of the trigger. Use it when the visual anchor differs from the control that opens the card.',
      },
      {
        name: 'variant',
        type: 'string',
        set: 'hoverCardVariants',
        values: ['tooltip'],
        description:
          'Set `tooltip` for the compact tooltip treatment. Omit for the roomier hover-card surface.',
      },
      {
        name: 'placement',
        type: 'string',
        set: 'floatingPlacements',
        values: ['bottom', 'top', 'right', 'left'],
        default: 'bottom',
        description: 'Preferred side of the anchor.',
      },
      {
        name: 'open-delay',
        type: 'number',
        default: '180',
        description:
          'Milliseconds of hover or focus intent before opening. The resolved number is available on the read-only `openDelay` property.',
      },
      {
        name: 'close-delay',
        type: 'number',
        default: '100',
        description:
          'Milliseconds after the pointer leaves before closing, so the user can cross the gap into the surface. The resolved number is available on the read-only `closeDelay` property.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description: 'Element that receives hover and focus intent.',
      },
      {
        name: 'content',
        required: true,
        selector: '[popover]',
        description: 'The surface.',
      },
    ],
    states: [],
    variables: [],
    events: [],
    accessibility: {
      pattern: 'tooltip',
      patternLabel: 'Tooltip',
      keys: [
        {
          key: 'Escape',
          action: 'Close the surface while the trigger has focus.',
        },
      ],
      notes:
        'The card opens on both pointer hover and keyboard focus, so it is reachable without a mouse. `close-delay` keeps it open while the pointer crosses the gap into the surface. Never put the only copy of important content here.',
    },
  },
  tooltip: {
    kind: 'css',
    root: {
      kind: 'selector',
      name: "ui-hover-card[variant='tooltip']",
    },
    css: ['popover.css'],
    attributes: [],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description: 'Control the label describes. Point its `aria-describedby` at the surface.',
      },
      {
        name: 'content',
        required: true,
        selector: '[popover]',
        description: 'The label. One short, non-interactive line; give it `role="tooltip"`.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-tooltip-bg',
        description: 'Surface background. Inverted against the page by default.',
      },
      {
        name: '--ui-tooltip-fg',
        description: 'Label color, and the border tint is mixed from it.',
      },
    ],
    events: [],
    accessibility: {
      pattern: 'tooltip',
      patternLabel: 'Tooltip',
      keys: [
        {
          key: 'Escape',
          action: 'Close the label while the trigger has focus.',
        },
      ],
      notes:
        'A tooltip names or describes its trigger and nothing else. Point the trigger at it with `aria-describedby` and give the surface `role="tooltip"`; Timeless wires relationships, never content. It opens on hover and on keyboard focus, so it is reachable without a mouse. Because it holds no interactive content and cannot be reached by Tab, never put the only copy of anything here — for content the user may want to read at length or click, use Hover Card instead.',
    },
  },
  menu: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-menu',
    },
    css: ['menu.css'],
    attributes: [
      {
        name: 'orientation',
        type: 'string',
        set: 'menuOrientations',
        values: ['horizontal', 'vertical'],
        default: 'vertical',
        description:
          'Arrow-key axis. Defaults to `horizontal` when the menu part is `role="menubar"`.',
      },
    ],
    parts: [
      {
        name: 'menu',
        required: true,
        selector: "[role='menu']",
        description:
          'The menu container. Use `role="menubar"` for a persistent horizontal menu bar.',
      },
      {
        name: 'item',
        required: true,
        selector: "[role^='menuitem']",
        description:
          'One command. Use `role="menuitem"`, or `menuitemcheckbox` / `menuitemradio` with `aria-checked`. Timeless manages roving `tabindex` and typeahead.',
      },
    ],
    states: [],
    variables: [],
    events: [],
    accessibility: {
      pattern: 'menubar',
      patternLabel: 'Menu and Menubar',
      keys: [
        {
          key: 'Arrow keys',
          action: 'Move focus between items along the `orientation` axis.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled item.',
        },
        {
          key: 'Enter / Space',
          action: 'Activate the focused item.',
        },
        {
          key: 'Escape',
          action: 'Close the menu and return focus to whatever opened it.',
        },
        {
          key: 'Printable characters',
          action: 'Typeahead: jump to the next item whose label starts with what you typed.',
        },
      ],
      notes:
        'The menu is one tab stop and disabled items are skipped. Typeahead matching is locale-aware.',
    },
  },
  menuButton: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-menu-button',
    },
    css: ['menu.css'],
    attributes: [
      {
        name: 'open',
        type: 'boolean',
        description: 'Present to render the menu open on load.',
      },
      {
        name: 'placement',
        type: 'string',
        set: 'floatingPlacements',
        values: ['bottom', 'top', 'right', 'left'],
        default: 'bottom',
        description: 'Preferred side of the trigger.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description: 'Native button that opens the menu.',
      },
      {
        name: 'content',
        required: true,
        selector: '[popover]',
        description: 'The popover surface holding a `ui-menu`.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-open',
        type: 'CustomEvent<MenuButtonToggleDetail>',
        description: 'Dispatched after the menu opens.',
        cancelable: false,
      },
      {
        name: 'ui-close',
        type: 'CustomEvent<MenuButtonToggleDetail>',
        description: 'Dispatched after the menu closes.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'menu-button',
      patternLabel: 'Menu Button',
      keys: [
        {
          key: 'Enter / Space / Arrow Down',
          action: 'Open the menu and focus its first item.',
        },
        {
          key: 'Escape',
          action: 'Close the menu and return focus to the trigger.',
        },
      ],
      notes:
        'Escape and outside-click dismissal come from the Popover API rather than from Timeless. The trigger carries `aria-haspopup="menu"` and `aria-expanded`.',
    },
  },
  toolbar: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toolbar',
    },
    css: ['toolbar.css'],
    attributes: [
      {
        name: 'orientation',
        type: 'string',
        set: 'toolbarOrientations',
        values: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Arrow-key axis across the toolbar controls.',
      },
    ],
    parts: [
      {
        name: 'item',
        required: true,
        selector: 'button, a, input, select, textarea',
        description:
          'Any focusable control in the toolbar. Timeless makes the group one tab stop and moves focus with the arrow keys.',
      },
    ],
    states: [],
    variables: [],
    events: [],
    accessibility: {
      pattern: 'toolbar',
      patternLabel: 'Toolbar',
      keys: [
        {
          key: 'Arrow keys',
          action:
            'Move focus to the previous or next control, following the orientation and skipping disabled ones.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled control.',
        },
        {
          key: 'Page Up / Page Down',
          action: 'Jump ten controls at a time.',
        },
      ],
      notes:
        'The whole toolbar is one tab stop. Timeless manages roving `tabindex` so Tab moves past the group rather than through every control.',
    },
  },
  radioGroup: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-radio-group',
    },
    css: ['choice-group.css'],
    attributes: [
      {
        name: 'orientation',
        type: 'string',
        set: 'choiceGroupOrientations',
        values: ['vertical', 'horizontal'],
        default: 'vertical',
        description: 'Layout and arrow-key axis.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The radio checked on load and after a form reset. Match one input’s `value`. Assign the `value` property for live changes.',
      },
    ],
    parts: [
      {
        name: 'choice',
        required: true,
        selector: "input[type='radio']",
        description:
          'One native radio input, sharing a `name` with the rest. Native form submission and reset keep working.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<RadioGroupChangeDetail>',
        description:
          'Cancelable proposal dispatched before the checked radio changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<RadioGroupChangeDetail>',
        description: 'Dispatched after the checked radio has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'radio',
      patternLabel: 'Radio Group',
      keys: [
        {
          key: 'Arrow keys',
          action:
            'Move focus to the previous or next radio, following the orientation and skipping disabled ones.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled radio.',
        },
        {
          key: 'Page Up / Page Down',
          action: 'Jump ten radios at a time.',
        },
      ],
      notes:
        'Native radio semantics do the rest: one tab stop per group, checked state, form submission, and reset. Timeless adds roving focus and change events without replacing the inputs.',
    },
  },
  checkboxGroup: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-checkbox-group',
    },
    css: ['choice-group.css'],
    attributes: [
      {
        name: 'orientation',
        type: 'string',
        set: 'choiceGroupOrientations',
        values: ['vertical', 'horizontal'],
        default: 'vertical',
        description: 'Layout and arrow-key axis.',
      },
    ],
    parts: [
      {
        name: 'choice',
        required: true,
        selector: "input[type='checkbox']",
        description:
          'One native checkbox input. Author `checked` for the initial state; the group reports every checked value.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<CheckboxGroupChangeDetail>',
        description:
          'Cancelable proposal dispatched before the set of checked boxes changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<CheckboxGroupChangeDetail>',
        description:
          'Dispatched after the set of checked boxes has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'checkbox',
      patternLabel: 'Checkbox',
      keys: [
        {
          key: 'Arrow keys',
          action:
            'Move focus to the previous or next checkbox, following the orientation and skipping disabled ones.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled checkbox.',
        },
        {
          key: 'Page Up / Page Down',
          action: 'Jump ten checkboxs at a time.',
        },
      ],
      notes:
        'Space toggles the focused checkbox natively. Every box remains independently reachable and submits its own value.',
    },
  },
  listbox: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-listbox',
    },
    css: ['listbox.css'],
    attributes: [
      {
        name: 'multiple',
        type: 'boolean',
        description:
          'Present to allow more than one selected option. The `value` property then reads and writes an array.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes.',
      },
    ],
    parts: [
      {
        name: 'listbox',
        required: true,
        selector: "[role='listbox']",
        description: 'The option container.',
      },
      {
        name: 'option',
        required: true,
        selector: "[role='option']",
        description:
          'One option. Its value comes from `value`, then `data-ui-value`, then the element id. Mark unavailable options `aria-disabled="true"`.',
      },
    ],
    states: [
      {
        name: 'selected',
        source: 'aria',
        public: true,
        description: '`aria-selected="true"` on selected options.',
      },
    ],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<ListboxChangeDetail>',
        description:
          'Cancelable proposal dispatched before the selection changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<ListboxChangeDetail>',
        description: 'Dispatched after the selection has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'listbox',
      patternLabel: 'Listbox',
      keys: [
        {
          key: 'Arrow keys',
          action:
            'Move focus to the previous or next option, following the orientation and skipping disabled ones.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled option.',
        },
        {
          key: 'Page Up / Page Down',
          action: 'Jump ten options at a time.',
        },
        {
          key: 'Enter / Space',
          action: 'Select the focused option, or toggle it when `multiple` is present.',
        },
        {
          key: 'Printable characters',
          action: 'Typeahead: jump to the next option whose text starts with what you typed.',
        },
      ],
      notes:
        'Selection follows `aria-selected`, and the active option is tracked with `aria-activedescendant` so focus stays on the listbox.',
    },
  },
  select: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-select',
    },
    css: ['select.css'],
    attributes: [
      {
        name: 'open',
        type: 'boolean',
        description: 'Present to render the listbox open on load.',
      },
      {
        name: 'placement',
        type: 'string',
        set: 'floatingPlacements',
        values: ['bottom', 'top', 'right', 'left'],
        default: 'bottom',
        description: 'Preferred side of the trigger for the listbox surface.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Mirror it onto a hidden input to submit with a form.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description: 'Native button that opens the listbox.',
      },
      {
        name: 'listbox',
        required: true,
        selector: "[role='listbox']",
        description: 'The option container and popover surface.',
      },
      {
        name: 'option',
        required: true,
        selector: "[role='option']",
        description:
          'One option. Its value comes from `value`, then `data-ui-value`, then the element id.',
      },
      {
        name: 'label',
        required: false,
        selector: "[data-ui-part~='label']",
        description: 'Element inside the trigger that shows the selected label.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<SelectChangeDetail>',
        description:
          'Cancelable proposal dispatched before the selected option changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<SelectChangeDetail>',
        description: 'Dispatched after the selected option has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'combobox',
      patternLabel: 'Select-Only Combobox',
      keys: [
        {
          key: 'Enter / Space',
          action: 'Open the listbox, or commit the active option when it is already open.',
        },
        {
          key: 'Arrow keys',
          action: 'Move the active option while the listbox is open.',
        },
        {
          key: 'Escape',
          action: 'Close the listbox without changing the value.',
        },
        {
          key: 'Printable characters',
          action: 'Typeahead over the option labels.',
        },
      ],
      notes:
        'The trigger keeps focus and the active option is announced through `aria-activedescendant`. Light dismiss comes from the Popover API. Mirror `value` onto a hidden input to submit with a form.',
    },
  },
  combobox: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-combobox',
    },
    css: ['combobox.css'],
    attributes: [
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes.',
      },
    ],
    parts: [
      {
        name: 'input',
        required: true,
        selector: "[role='combobox']",
        description:
          'The native text input. Timeless wires `aria-expanded`, `aria-controls`, and `aria-activedescendant`.',
      },
      {
        name: 'listbox',
        required: true,
        selector: "[role='listbox']",
        description: 'The option container.',
      },
      {
        name: 'option',
        required: true,
        selector: "[role='option']",
        description:
          'One option. Its value comes from `value`, then `data-ui-value`, then the element id. Filtering hides non-matching options.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<ComboboxChangeDetail>',
        description:
          'Cancelable proposal dispatched before the selected option changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<ComboboxChangeDetail>',
        description: 'Dispatched after the selected option has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'combobox',
      patternLabel: 'Combobox',
      keys: [
        {
          key: 'Arrow Down / Arrow Up',
          action: 'Open the listbox, then move the active option.',
        },
        {
          key: 'Home / End',
          action: 'Move to the first or last matching option.',
        },
        {
          key: 'Enter',
          action: 'Commit the active option.',
        },
        {
          key: 'Escape',
          action: 'Close the listbox, then clear the filter on a second press.',
        },
      ],
      notes:
        'Focus stays in the text input at all times; the active option is exposed with `aria-activedescendant`. Filtering hides non-matching options rather than removing them.',
    },
  },
  toaster: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toaster',
    },
    css: ['toast.css'],
    attributes: [
      {
        name: 'placement',
        type: 'string',
        set: 'toasterPlacements',
        values: [
          'top-start',
          'top-center',
          'top-end',
          'bottom-start',
          'bottom-center',
          'bottom-end',
        ],
        default: 'bottom-end',
        description: 'Corner or edge of the viewport the toasts stack against.',
      },
      {
        name: 'stack',
        type: 'string',
        set: 'toasterStacks',
        values: ['overlap', 'list'],
        default: 'overlap',
        description:
          'Whether queued toasts overlap into a deck (`overlap`) or lay out as a full list (`list`).',
      },
    ],
    parts: [],
    states: [],
    variables: [
      {
        name: '--ui-toaster-gap',
        description: 'Gap between toasts in `list` mode.',
      },
      {
        name: '--ui-toaster-overlap',
        description: 'Offset between stacked toasts in `overlap` mode.',
      },
    ],
    events: [],
  },
  toast: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toast',
    },
    css: ['toast.css'],
    attributes: [
      {
        name: 'duration',
        type: 'number',
        default: '5000',
        description:
          'Milliseconds before the toast dismisses itself. `0` keeps it open until dismissed.',
      },
      {
        name: 'persistent',
        type: 'boolean',
        description: 'Present to disable auto-dismiss regardless of `duration`.',
      },
    ],
    parts: [
      {
        name: 'content',
        required: false,
        selector: "[data-ui-part~='content']",
        description: 'Wrapper for the title and description.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title']",
        description: 'Short summary line.',
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description']",
        description: 'Supporting detail.',
      },
      {
        name: 'close',
        required: false,
        selector: "[data-ui-part~='close']",
        description: 'Dismiss button. Give it an accessible name.',
      },
    ],
    states: [
      {
        name: '--closed',
        source: 'custom-state',
        public: false,
        description: 'Set while the toast plays its exit transition. Internal; do not author it.',
      },
    ],
    variables: [],
    events: [
      {
        name: 'ui-dismiss',
        type: 'CustomEvent<ToastDismissDetail>',
        description:
          'Dispatched when the toast is dismissed. The detail names the reason: a timeout, the close control, or the imperative API.',
        cancelable: false,
      },
    ],
  },
  toggleGroup: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toggle-group',
    },
    css: ['toggle.css'],
    attributes: [
      {
        name: 'attached',
        type: 'boolean',
        description:
          'Present to join the buttons into one segmented control. Styling only, resolved by `toggle.css`.',
      },
      {
        name: 'orientation',
        type: 'string',
        set: 'toggleGroupOrientations',
        values: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Layout and arrow-key axis.',
      },
      {
        name: 'selection',
        type: 'string',
        set: 'toggleGroupSelections',
        values: ['single', 'multiple'],
        default: 'single',
        description:
          'Whether pressing one button releases the others (`single`) or toggles independently (`multiple`).',
      },
    ],
    parts: [
      {
        name: 'item',
        required: true,
        selector: 'button[aria-pressed]',
        description:
          'One toggle button. Author `value` and `aria-pressed`; Timeless keeps the pressed set in sync.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<ToggleGroupChangeDetail>',
        description:
          'Cancelable proposal dispatched before the pressed set changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<ToggleGroupChangeDetail>',
        description: 'Dispatched after the pressed set has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'button',
      patternLabel: 'Button',
      keys: [
        {
          key: 'Arrow keys',
          action:
            'Move focus to the previous or next button, following the orientation and skipping disabled ones.',
        },
        {
          key: 'Home / End',
          action: 'Move focus to the first or last enabled button.',
        },
        {
          key: 'Page Up / Page Down',
          action: 'Jump ten buttons at a time.',
        },
      ],
      notes:
        'Each button keeps native activation, and `aria-pressed` carries the state. With `selection="single"` pressing one button releases the others.',
    },
  },
  numberStepper: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-number-stepper',
    },
    css: ['number-stepper.css'],
    attributes: [],
    parts: [
      {
        name: 'input',
        required: true,
        selector: "input[type='number']",
        description:
          'The native number input. `min`, `max`, and `step` come from it, and native validation keeps working.',
      },
      {
        name: 'decrement',
        required: true,
        selector: "[data-ui-part~='decrement']",
        description: 'Button that steps down. Give it an accessible name.',
      },
      {
        name: 'increment',
        required: true,
        selector: "[data-ui-part~='increment']",
        description: 'Button that steps up. Give it an accessible name.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'input',
        type: 'Event',
        description: 'Native `input` event dispatched on the inner number input after each step.',
        cancelable: false,
      },
      {
        name: 'change',
        type: 'Event',
        description: 'Native `change` event dispatched on the inner number input.',
        cancelable: false,
      },
    ],
  },
  colorPicker: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-color-picker',
    },
    css: ['color-picker.css'],
    attributes: [
      {
        name: 'format',
        type: 'string',
        set: 'colorPickerFormats',
        values: ['oklch', 'oklab', 'lch', 'lab', 'hex', 'rgb', 'hsl', 'hwb', 'p3', 'rec2020'],
        default: 'oklch',
        description:
          'Color space the channel controls edit and the raw input round-trips through. The picker converts the current value when this changes.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'Initial and form-reset color, in any CSS color syntax. Unlike the collection elements, the picker reflects one `value` property rather than a separate authored default.',
      },
    ],
    parts: [
      {
        name: 'preview',
        required: false,
        selector: "[data-ui-part~='preview']",
        description: 'Region holding the format select, gamut controls, and readout.',
      },
      {
        name: 'preview-bar',
        required: false,
        selector: "[data-ui-part~='preview-bar']",
        description: 'Row above the readout.',
      },
      {
        name: 'format-field',
        required: false,
        selector: "[data-ui-part~='format-field']",
        description: 'Label wrapper around the format select.',
      },
      {
        name: 'format',
        required: true,
        selector: 'select',
        description: 'Native `<select>` listing the supported color formats.',
      },
      {
        name: 'gamut-bar',
        required: false,
        selector: "[data-ui-part~='gamut-bar']",
        description: 'Row holding the clamp buttons.',
      },
      {
        name: 'clamp',
        required: false,
        selector: "[data-ui-part~='clamp']",
        description:
          'Button that clamps an out-of-gamut color into sRGB or P3. Shown only when needed.',
      },
      {
        name: 'readout',
        required: false,
        selector: "[data-ui-part~='readout']",
        description: 'Row holding the swatch, raw input, and copy button.',
      },
      {
        name: 'gamut',
        required: false,
        selector: "[data-ui-part~='gamut']",
        description: 'Current-color swatch. Decorative.',
      },
      {
        name: 'input',
        required: true,
        selector: "input[type='text']",
        description: 'Raw CSS color value, editable as text.',
      },
      {
        name: 'input-label',
        required: false,
        selector: "[data-ui-part~='input-label']",
        description: 'Screen-reader label for the raw input or format select.',
      },
      {
        name: 'copy',
        required: false,
        selector: "[data-ui-part~='copy']",
        description: 'Copies the raw value to the clipboard.',
      },
      {
        name: 'copy-icon',
        required: false,
        selector: "[data-ui-part~='copy-icon']",
        description: 'Idle state of the copy button. Decorative.',
      },
      {
        name: 'copied-icon',
        required: false,
        selector: "[data-ui-part~='copied-icon']",
        description: 'Confirmed state of the copy button. Decorative.',
      },
      {
        name: 'channels',
        required: false,
        selector: "[data-ui-part~='channels']",
        description: 'Container for the per-channel rows.',
      },
      {
        name: 'channel',
        required: true,
        selector: "[data-ui-part~='channel']",
        description:
          'One channel row. The picker rewrites the rows when `format` changes, so author one row per channel of the widest format you support.',
      },
      {
        name: 'channel-label',
        required: false,
        selector: "[data-ui-part~='channel-label']",
        description: 'Channel name. Written by the picker; decorative.',
      },
      {
        name: 'channel-range',
        required: true,
        selector: "input[type='range']",
        description: 'Slider for one channel.',
      },
      {
        name: 'channel-input',
        required: true,
        selector: "input[type='number']",
        description: 'Numeric entry for one channel.',
      },
      {
        name: 'warning',
        required: false,
        selector: "[data-ui-part~='warning']",
        description: 'Out-of-gamut or unparsable-value message.',
      },
      {
        name: 'trigger',
        required: false,
        selector: "[data-ui-part~='trigger']",
        description: 'Optional button when the picker lives inside a popover.',
      },
      {
        name: 'content',
        required: false,
        selector: "[data-ui-part~='content']",
        description: 'Optional popover surface wrapping the picker.',
      },
    ],
    states: [
      {
        name: '--contextual',
        source: 'custom-state',
        public: false,
        description:
          'Set while the picker renders inside a popover surface. Internal; do not author it.',
      },
      {
        name: '--copied',
        source: 'custom-state',
        public: false,
        description: 'Set briefly after the value is copied. Internal; do not author it.',
      },
    ],
    variables: [],
    events: [
      {
        name: 'input',
        type: 'Event',
        description: 'Native `input` event dispatched while the color is being edited.',
        cancelable: false,
      },
      {
        name: 'change',
        type: 'Event',
        description: 'Native `change` event dispatched when the edit is committed.',
        cancelable: false,
      },
    ],
  },
} as const satisfies Readonly<Record<ComponentName, ComponentContract>>

export const componentNames: readonly ComponentName[] = Object.keys(
  componentContracts,
) as ComponentName[]

export function isComponentName(value: string): value is ComponentName {
  return Object.hasOwn(componentContracts, value)
}
