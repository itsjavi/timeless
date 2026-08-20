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
  /**
   * ARIA Authoring Practices pattern slug, e.g. `tabs`. Null when the APG has no pattern for
   * this composition, in which case `patternLabel` names the contract the component documents
   * instead. Never a slug invented to fill the gap.
   */
  readonly pattern: string | null
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
  | 'fieldset'
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
  | 'contextMenu'
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
  | 'form'
  | 'rangeField'
  | 'otpField'

export const componentContracts = {
  button: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-button',
    },
    css: ['core/button.css', 'themes/atmosphere/button.css'],
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
    css: ['core/toggle.css', 'themes/atmosphere/toggle.css'],
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
    css: ['core/alert.css', 'themes/atmosphere/alert.css'],
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
    css: ['core/avatar.css', 'themes/atmosphere/avatar.css'],
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
    css: ['core/badge.css', 'themes/atmosphere/badge.css'],
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
    css: ['core/separator.css', 'themes/atmosphere/separator.css'],
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
    css: ['core/card.css', 'themes/atmosphere/card.css'],
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
    css: ['core/skeleton.css', 'themes/atmosphere/skeleton.css'],
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
    css: ['core/progress.css', 'themes/atmosphere/progress.css'],
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
    css: ['themes/atmosphere/link.css'],
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
    css: ['core/kbd.css', 'themes/atmosphere/kbd.css'],
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
    css: ['core/code.css', 'themes/atmosphere/code.css'],
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
    css: ['core/group.css', 'themes/atmosphere/group.css'],
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
    css: ['core/list.css', 'themes/atmosphere/list.css'],
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
    css: ['core/table.css', 'themes/atmosphere/table.css'],
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
    css: ['core/collapsible.css', 'themes/atmosphere/collapsible.css'],
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
    css: ['core/spinner.css', 'themes/atmosphere/spinner.css'],
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
    css: ['core/empty.css', 'themes/atmosphere/empty.css'],
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
    css: ['core/meter.css', 'themes/atmosphere/meter.css'],
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
    css: ['core/color-swatch.css', 'themes/atmosphere/color-swatch.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
  fieldset: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-fieldset',
    },
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
    attributes: [
      {
        name: 'data-ui-density',
        type: 'string',
        set: 'formDensities',
        values: ['compact', 'normal', 'spacious'],
        default: 'normal',
        description: 'Gap between grouped controls, and the padding around them.',
      },
    ],
    parts: [
      {
        name: 'legend',
        required: true,
        selector: 'legend',
        description:
          'The native `<legend>`, which names the group. Keep it the first child, because that is what makes the browser treat it as the group label.',
      },
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
        description:
          'Set `aria-invalid="true"` on the `<fieldset>` and point `aria-describedby` at the error part.',
      },
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description:
          'Native `disabled` on the `<fieldset>`, which the browser propagates to every control inside it.',
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
    attributes: [
      {
        name: 'data-ui-size',
        type: 'string',
        set: 'formControlSizes',
        values: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Control height, padding, font size, and the size of the drop-down indicator.',
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
    variables: [
      {
        name: '--ui-select-indicator',
        description:
          'Width of the drop-down indicator, which also sets the end padding reserved for it. Timeless draws the mark itself with `appearance: none`, because the platform arrow sits at a fixed engine-chosen offset no author padding moves, and WebKit drops `padding` and `min-block-size` on a UA-drawn select entirely. The mark is two gradient halves rather than an icon asset, so it follows `currentColor`; redeclare `background-image` to replace it. The drop-down list itself is still UA-drawn, which is what `color-scheme` on the control is for.',
      },
    ],
    events: [],
  },
  checkbox: {
    kind: 'css',
    root: {
      kind: 'class',
      name: 'ui-checkbox',
    },
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/range.css', 'themes/atmosphere/range.css'],
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
    css: ['core/forms.css', 'themes/atmosphere/forms.css'],
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
    css: ['core/tabs.css', 'themes/atmosphere/tabs.css'],
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
    css: ['core/dialog.css', 'themes/atmosphere/dialog.css'],
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
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title'], header > :where(h1, h2, h3)",
        description:
          "Names the dialog. Timeless points the panel's `aria-labelledby` at it, generating an id only if you left one off. A heading in the panel `<header>` counts without the token. An `aria-labelledby` you author always wins.",
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description'], header > p",
        description:
          'Supporting line under the title, wired with `aria-describedby` the same way. A `<p>` in the panel `<header>` counts without the token.',
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
        'Focus trapping, the backdrop, and the top layer all come from `showModal()`. Timeless moves initial focus into the panel and returns it to the trigger on close, and names the panel from its `title` and `description` parts. A dialog invoker gets no implicit `aria-expanded` from the platform, so Timeless keeps writing it on both the authored-command and click paths.',
    },
  },
  sheet: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-sheet',
    },
    css: ['core/sheet.css', 'themes/atmosphere/sheet.css'],
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
      {
        name: 'drag-handle',
        required: false,
        selector: "[data-ui-part~='drag-handle']",
        description:
          'Optional grab area for the swipe gesture. A swipe works anywhere on the panel that is not a scrollable region, so this is an affordance rather than a requirement — but it is the one place a drag always starts, which is what a bottom sheet over a scrolling body needs. Decorative: hide it from assistive technology and keep a real close control.',
      },
      {
        name: 'title',
        required: false,
        selector: "[data-ui-part~='title'], header > :where(h1, h2, h3)",
        description:
          "Names the sheet. Timeless points the panel's `aria-labelledby` at it, generating an id only if you left one off. A heading in the panel `<header>` counts without the token. An `aria-labelledby` you author always wins.",
      },
      {
        name: 'description',
        required: false,
        selector: "[data-ui-part~='description'], header > p",
        description:
          'Supporting line under the title, wired with `aria-describedby` the same way. A `<p>` in the panel `<header>` counts without the token.',
      },
    ],
    states: [
      {
        name: '--dragging',
        source: 'custom-state',
        public: false,
        description:
          'Set while a swipe is in progress, so the stylesheet can suspend the entry animation and the spring-back transition. Internal; do not author it.',
      },
    ],
    variables: [
      {
        name: '--ui-sheet-drag-offset',
        description:
          'How far the panel has been dragged along its own axis, written as a length while a swipe is in progress and cleared on release. The stylesheet turns it into a `translate`; setting it yourself only moves the panel.',
      },
    ],
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
          'Dispatched when the sheet closes through Escape, a backdrop click, or a swipe past the dismiss threshold, rather than through an explicit control. The detail names which. A swipe reports `swipe` and behaves exactly like a backdrop click, because that is what it is: a pointer gesture on the overlay rather than a command.',
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
        'A `modal` sheet traps focus through `showModal()`; without `modal` the page stays interactive and focus is not trapped. Timeless restores focus to the trigger either way, including after a swipe. Naming comes from the `title` and `description` parts. Swipe-to-dismiss is an addition, never the only way out: Escape and a close control both stay, so the sheet is fully operable without a pointer.',
    },
  },
  popover: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-popover',
    },
    css: ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
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
    variables: [
      {
        name: '--ui-floating-offset',
        description: 'Gap between the trigger and the surface.',
      },
    ],
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
    css: ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
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
    variables: [
      {
        name: '--ui-floating-offset',
        description: 'Gap between the anchor and the surface.',
      },
    ],
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
        'The card opens on both pointer hover and keyboard focus, so it is reachable without a mouse, and clicking the trigger toggles it. `close-delay` keeps it open while the pointer crosses the gap into the surface, so the content inside is reachable. Under `variant="tooltip"` the click toggle is dropped — a tooltip describes its trigger rather than disclosing a surface — while the gap-crossing behavior stays, because WCAG 2.2 SC 1.4.13 requires it. See [Tooltip](/docs/components/tooltip/). Never put the only copy of important content here.',
    },
  },
  tooltip: {
    kind: 'css',
    root: {
      kind: 'selector',
      name: "ui-hover-card[variant='tooltip']",
    },
    css: ['core/floating.css', 'core/popover.css', 'themes/atmosphere/popover.css'],
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
        'A tooltip names or describes its trigger and nothing else. Point the trigger at it with `aria-describedby` and give the surface `role="tooltip"`; Timeless wires relationships, never content. It opens on hover and on keyboard focus, so it is reachable without a mouse, and closes when either leaves. It is deliberately not a disclosure: clicking the trigger does not toggle the label, so a trigger that is also a button keeps its own job on click. The pointer can still be moved onto the label without it disappearing, because WCAG 2.2 SC 1.4.13 requires hover-triggered content to be hoverable — reading a label is not interacting with it. Never put the only copy of anything here — for content the user may want to read at length or click, use Hover Card instead. Both variants share one `open-delay` / `close-delay` pair, documented once on Hover Card; a tooltip that should appear faster sets the attribute rather than getting a different default, because one attribute cannot have two.',
    },
  },
  menu: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-menu',
    },
    css: ['core/floating.css', 'core/menu.css', 'themes/atmosphere/menu.css'],
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
          'One command. A menu-item role is what makes an element an item — a bare `<button>` inside the menu is not one. Use `role="menuitem"`, or `menuitemcheckbox` / `menuitemradio` for a checkable command. Timeless manages roving `tabindex`, typeahead, and `aria-checked`.',
      },
      {
        name: 'group',
        required: false,
        selector: "[data-ui-part~='group']",
        description:
          'A `role="group"` wrapper around related items. Items inside it stay navigable, and a `menuitemradio` clears only the radios in its own group.',
      },
      {
        name: 'group-label',
        required: false,
        selector: "[data-ui-part~='group-label']",
        description: 'The label for a `group`, wired to it with `aria-labelledby`.',
      },
      {
        name: 'separator',
        required: false,
        selector: "[role='separator'], hr",
        description:
          'A divider between items or groups. Navigation and typeahead skip it, because it carries no menu-item role.',
      },
      {
        name: 'submenu-trigger',
        required: false,
        selector: "[aria-haspopup='menu']",
        description:
          'An item that owns a submenu. You do not author this token: give the item `aria-controls` naming the submenu, or put the submenu immediately after it, and Timeless writes `aria-haspopup`, `aria-controls`, and `aria-expanded`.',
      },
      {
        name: 'submenu',
        required: false,
        selector: "ui-menu[popover], [role='menu'][popover]",
        description:
          'A nested menu opened from a `submenu-trigger`. Author it as a popover so it stays hidden before enhancement; Timeless adds `popover="auto"` if you leave it off.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-menu-min-inline-size',
        description: 'Minimum width of the menu surface.',
      },
    ],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<MenuCheckedDetail>',
        description:
          'Cancelable proposal dispatched before a checkable item changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<MenuCheckedDetail>',
        description: 'Dispatched after a checkable item has changed. Bubbles and is composed.',
        cancelable: false,
      },
    ],
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
          action: 'Move focus to the first or last item.',
        },
        {
          key: 'Enter / Space',
          action: 'Activate the focused item, or open its submenu.',
        },
        {
          key: 'Arrow Right',
          action:
            'Open the focused item\'s submenu and focus its first enabled item. Under `dir="rtl"` this is Arrow Left.',
        },
        {
          key: 'Arrow Left',
          action:
            'Close the submenu and return focus to the item that opened it. From a first-level submenu of a menubar, move along the bar instead. Under `dir="rtl"` this is Arrow Right.',
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
        'The menu is one tab stop. Disabled items stay reachable with the arrow keys, which is the APG treatment — a command you cannot use is easier to understand than one that is not there — but they never take the resting tab stop and never activate. Activating a `menuitemcheckbox` toggles its `aria-checked`; activating a `menuitemradio` sets it and clears the other radios in its group. Both dispatch a cancelable `ui-before-change` first, so a consumer that already owns `aria-checked` can keep owning it. Typeahead matching is locale-aware. Submenus open on the keyboard and on click; there is deliberately no hover-with-intent opening.',
    },
  },
  menuButton: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-menu-button',
    },
    css: ['core/floating.css', 'core/menu.css', 'themes/atmosphere/menu.css'],
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
    variables: [
      {
        name: '--ui-floating-offset',
        description: 'Gap between the trigger and the menu surface.',
      },
    ],
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
  contextMenu: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-context-menu',
    },
    css: [
      'core/context-menu.css',
      'core/menu.css',
      'themes/atmosphere/context-menu.css',
      'themes/atmosphere/menu.css',
    ],
    attributes: [],
    parts: [
      {
        name: 'target',
        required: true,
        selector: "[data-ui-part~='target']",
        description:
          'The region a secondary click opens the menu over. Give it a role that supports `aria-haspopup` and make it focusable — Timeless adds `tabindex="0"` when it has none, because the keyboard path cannot exist without a tab stop. It then wires `aria-haspopup`, `aria-controls`, and `aria-expanded`; the role and the accessible name stay yours.',
      },
      {
        name: 'menu',
        required: true,
        selector: "ui-menu[popover], [role='menu'][popover]",
        description:
          'The menu surface, a `ui-menu` authored as a popover. Every item, group, separator, and submenu inside it is the [Menu](/docs/components/menu/) contract, unchanged — this element only decides when and where it opens.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-context-menu-x',
        description:
          'Horizontal position the surface opens at, written at runtime from the pointer or from the focused element. The stylesheet turns it into a clamped `left`.',
      },
      {
        name: '--ui-context-menu-y',
        description:
          'Vertical position, the same way. Together these are the whole positioning input: there is no anchor element, because a pointer is not an element.',
      },
      {
        name: '--ui-context-menu-inset',
        description:
          'Minimum gap kept between the surface and the viewport edge when the coordinates would push it off screen.',
      },
    ],
    events: [
      {
        name: 'ui-open',
        type: 'CustomEvent<ContextMenuToggleDetail>',
        description: 'Dispatched after the context menu opens.',
        cancelable: false,
      },
      {
        name: 'ui-close',
        type: 'CustomEvent<ContextMenuToggleDetail>',
        description: 'Dispatched after the context menu closes.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: null,
      patternLabel: 'Context Menu',
      keys: [
        {
          key: 'Shift + F10',
          action:
            'Open the menu for the focused target. Some environments consume the shortcut before the page sees it, which is why the dedicated key below is also supported.',
        },
        {
          key: 'Context Menu key',
          action: 'Open the menu for the focused target.',
        },
        {
          key: 'Escape',
          action:
            'Close the menu and return focus to the target. Handled by the Popover API and by Menu.',
        },
      ],
      notes:
        'The APG has no context-menu pattern, so this documents a composition rather than claiming one: a [Menu](/docs/components/menu/) surface, opened by a secondary click or by the keyboard. Everything inside is the menu pattern — roving focus, typeahead, submenu keys, checkable items. Escape, light dismiss, and top-layer stacking come from the Popover API. **This is the one Timeless component with no no-JavaScript fallback**: the platform has no declarative way to open a surface at pointer coordinates, so with scripting off the browser shows its own context menu and the authored `ui-menu` stays hidden. Never put a command here that is not also reachable another way.',
    },
  },
  toolbar: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toolbar',
    },
    css: ['core/toolbar.css', 'themes/atmosphere/toolbar.css'],
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
    css: [
      'core/choice-groups.css',
      'core/forms.css',
      'themes/atmosphere/choice-groups.css',
      'themes/atmosphere/forms.css',
    ],
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
    css: [
      'core/choice-groups.css',
      'core/forms.css',
      'themes/atmosphere/choice-groups.css',
      'themes/atmosphere/forms.css',
    ],
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
    css: [
      'core/listbox.css',
      'core/options.css',
      'themes/atmosphere/listbox.css',
      'themes/atmosphere/options.css',
    ],
    attributes: [
      {
        name: 'multiple',
        type: 'boolean',
        description:
          'Present to allow more than one selected option, submitting one form entry per value under the same `name`.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Assign the `value` property for live changes; once the user commits a change the attribute stops applying, the way it does on a native input.',
      },
      {
        name: 'name',
        type: 'string',
        description:
          'Form field name. The element submits its own value through `ElementInternals`.',
      },
      {
        name: 'required',
        type: 'boolean',
        description: 'Present to block submission while nothing is selected, with `valueMissing`.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        description:
          'Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
      },
      {
        name: 'page-size',
        type: 'number',
        description:
          'Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property.',
      },
    ],
    parts: [
      {
        name: 'listbox',
        required: true,
        selector: "[role='listbox']",
        description: 'The option container, which is the host itself.',
      },
      {
        name: 'option',
        required: true,
        selector: "[role='option']",
        description:
          'One option. Its value comes from `value`, then `data-ui-value`, then its text. Its filterable label comes from `label`, then `data-ui-label`, then `aria-label`, then its text — none of which change the accessible name. Mark unavailable options `aria-disabled="true"`.',
      },
      {
        name: 'option-indicator',
        required: false,
        selector: "[data-ui-part~='option-indicator']",
        description:
          'Decorative affordance inside an option showing that it is selected. Style it from `[aria-selected="true"]`; it is hidden from assistive technology.',
      },
      {
        name: 'group',
        required: false,
        selector: "[data-ui-part~='group']",
        description:
          'A `role="group"` wrapper around related options. Options inside it stay navigable, and the group collapses when every option it holds is filtered out.',
      },
      {
        name: 'group-label',
        required: false,
        selector: "[data-ui-part~='group-label']",
        description: 'The label for a `group`, wired to it with `aria-labelledby`.',
      },
      {
        name: 'separator',
        required: false,
        selector: "[role='separator']",
        description: 'A visual divider between options. Navigation and typeahead skip it.',
      },
      {
        name: 'empty',
        required: false,
        selector: "[data-ui-part~='empty']",
        description: 'Shown when no option is visible. Hidden again as soon as one is.',
      },
      {
        name: 'status',
        required: false,
        selector: "[data-ui-part~='status']",
        description:
          'A `role="status" aria-live="polite"` region for result counts, loading, and errors.',
      },
      {
        name: 'header',
        required: false,
        selector: "[data-ui-part~='header']",
        description:
          'Optional content at the top of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'footer',
        required: false,
        selector: "[data-ui-part~='footer']",
        description:
          'Optional content at the bottom of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'pager',
        required: false,
        selector: "[data-ui-part~='pager']",
        description:
          'Wraps the page controls. Hidden unless `page-size` is set and the options span more than one page.',
      },
      {
        name: 'page-previous',
        required: false,
        selector: "[data-ui-part~='page-previous']",
        description:
          'Moves to the previous page. Stays focusable at the first page and takes `aria-disabled`, so the boundary is discoverable rather than gone.',
      },
      {
        name: 'page-next',
        required: false,
        selector: "[data-ui-part~='page-next']",
        description: 'Moves to the next page, with the same boundary behavior.',
      },
      {
        name: 'page-status',
        required: false,
        selector: "[data-ui-part~='page-status']",
        description: 'A `role="status" aria-live="polite"` region announcing the current page.',
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
    variables: [
      {
        name: '--ui-collection-surface-inline-size',
        description:
          'Minimum width of an option surface. On the anchored Select and Combobox surfaces the trigger width wins whenever it is larger.',
      },
    ],
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
      {
        name: 'ui-page',
        type: 'CustomEvent<ListboxPageDetail>',
        description: 'Dispatched after the rendered page of a paged list changes.',
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
        'Roving `tabindex` moves real focus between options, so selection follows `aria-selected` and never the focus ring. Options inside a `group` stay in one flat navigation order. `header`, `footer`, and the pager sit outside that order and are reached with `Tab`.',
    },
  },
  select: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-select',
    },
    css: [
      'core/floating.css',
      'core/options.css',
      'core/select.css',
      'themes/atmosphere/options.css',
      'themes/atmosphere/select.css',
    ],
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
        name: 'searchable',
        type: 'boolean',
        description:
          'Present to filter from a `search` field inside the surface. Focus moves into that field on open and stays there; the highlight travels through `aria-activedescendant`.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input.',
      },
      {
        name: 'align',
        type: 'string',
        set: 'collectionAlignments',
        values: ['start', 'end'],
        default: 'start',
        description:
          'Which edge of the trigger the surface aligns to. The surface is never narrower than the trigger.',
      },
      {
        name: 'filter',
        type: 'string',
        set: 'optionFilterModes',
        values: ['contains', 'starts-with', 'off'],
        default: 'contains',
        description:
          'How typed text narrows the options. `off` hands visibility to you: listen for `ui-input` and set `hidden` yourself, and navigation, the empty state, group collapse, and paging all follow.',
      },
      {
        name: 'multiple',
        type: 'boolean',
        description:
          'Present to allow more than one selected option. Selected values render as chips and submit one form entry each under the same `name`.',
      },
      {
        name: 'name',
        type: 'string',
        description:
          'Form field name. The element submits its own value through `ElementInternals`.',
      },
      {
        name: 'required',
        type: 'boolean',
        description: 'Present to block submission while nothing is selected, with `valueMissing`.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        description:
          'Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
      },
      {
        name: 'page-size',
        type: 'number',
        description:
          'Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "[data-ui-part~='trigger']",
        description:
          'Native button that opens the listbox. Timeless gives it `role="combobox"`, which the Select-Only Combobox pattern asks for; that role takes no name from its content, so give the trigger `aria-labelledby` or `aria-label` yourself.',
      },
      {
        name: 'value',
        required: false,
        selector: "[data-ui-part~='value']",
        description:
          'Element inside the trigger that shows the selected label. Timeless writes its text and nothing else.',
      },
      {
        name: 'search',
        required: false,
        selector: "[data-ui-part~='search']",
        description:
          'Text field inside the surface that filters the options under `searchable`. Left and Right move the caret rather than the highlight.',
      },
      {
        name: 'surface',
        required: false,
        selector: "[data-ui-part~='surface']",
        description:
          'The popover the listbox sits in. Author it whenever the surface also holds a `search` field, a `header`, a `footer`, or a pager: a `role="listbox"` may own only options and groups, so those siblings belong beside the listbox rather than inside it. With none of them, the `listbox` is its own surface and this part is unnecessary.',
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
          'One option. Its value comes from `value`, then `data-ui-value`, then its text. Its filterable label comes from `label`, then `data-ui-label`, then `aria-label`, then its text — none of which change the accessible name. Mark unavailable options `aria-disabled="true"`.',
      },
      {
        name: 'option-indicator',
        required: false,
        selector: "[data-ui-part~='option-indicator']",
        description:
          'Decorative affordance inside an option showing that it is selected. Style it from `[aria-selected="true"]`; it is hidden from assistive technology.',
      },
      {
        name: 'group',
        required: false,
        selector: "[data-ui-part~='group']",
        description:
          'A `role="group"` wrapper around related options. Options inside it stay navigable, and the group collapses when every option it holds is filtered out.',
      },
      {
        name: 'group-label',
        required: false,
        selector: "[data-ui-part~='group-label']",
        description: 'The label for a `group`, wired to it with `aria-labelledby`.',
      },
      {
        name: 'separator',
        required: false,
        selector: "[role='separator']",
        description: 'A visual divider between options. Navigation and typeahead skip it.',
      },
      {
        name: 'empty',
        required: false,
        selector: "[data-ui-part~='empty']",
        description: 'Shown when no option is visible. Hidden again as soon as one is.',
      },
      {
        name: 'status',
        required: false,
        selector: "[data-ui-part~='status']",
        description:
          'A `role="status" aria-live="polite"` region for result counts, loading, and errors.',
      },
      {
        name: 'header',
        required: false,
        selector: "[data-ui-part~='header']",
        description:
          'Optional content at the top of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'footer',
        required: false,
        selector: "[data-ui-part~='footer']",
        description:
          'Optional content at the bottom of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'pager',
        required: false,
        selector: "[data-ui-part~='pager']",
        description:
          'Wraps the page controls. Hidden unless `page-size` is set and the options span more than one page.',
      },
      {
        name: 'page-previous',
        required: false,
        selector: "[data-ui-part~='page-previous']",
        description:
          'Moves to the previous page. Stays focusable at the first page and takes `aria-disabled`, so the boundary is discoverable rather than gone.',
      },
      {
        name: 'page-next',
        required: false,
        selector: "[data-ui-part~='page-next']",
        description: 'Moves to the next page, with the same boundary behavior.',
      },
      {
        name: 'page-status',
        required: false,
        selector: "[data-ui-part~='page-status']",
        description: 'A `role="status" aria-live="polite"` region announcing the current page.',
      },
      {
        name: 'chips',
        required: false,
        selector: "[data-ui-part~='chips']",
        description: 'Container the selected values are rendered into under `multiple`.',
      },
      {
        name: 'chip-template',
        required: false,
        selector: "template[data-ui-part~='chip-template']",
        description:
          'A `<template>` holding the markup for one chip. Timeless clones it per selected value and fills it in, so every element and class in a chip is yours. Without it a `chips` container receives a plain comma-separated summary instead.',
      },
      {
        name: 'chip',
        required: false,
        selector: "[data-ui-part~='chip']",
        description: 'One selected value, authored inside `chip-template`.',
      },
      {
        name: 'chip-label',
        required: false,
        selector: "[data-ui-part~='chip-label']",
        description:
          'Where the selected label is written inside a chip. Omit it only when the chip has no other content.',
      },
      {
        name: 'chip-remove',
        required: false,
        selector: "[data-ui-part~='chip-remove']",
        description:
          'Removes its chip. Author it as a real button; Timeless gives it the value it removes and an accessible name naming that value, since one shared template cannot. An `aria-label` you author wins.',
      },
      {
        name: 'clear',
        required: false,
        selector: "[data-ui-part~='clear']",
        description: 'Empties the whole selection. Disabled while there is nothing to clear.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-collection-surface-inline-size',
        description:
          'Minimum width of the listbox surface. The trigger width wins whenever it is larger.',
      },
      {
        name: '--ui-floating-offset',
        description: 'Gap between the trigger and the surface.',
      },
    ],
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
      {
        name: 'ui-open',
        type: 'CustomEvent<SelectToggleDetail>',
        description: 'Dispatched after the listbox opens.',
        cancelable: false,
      },
      {
        name: 'ui-close',
        type: 'CustomEvent<SelectToggleDetail>',
        description: 'Dispatched after the listbox closes.',
        cancelable: false,
      },
      {
        name: 'ui-input',
        type: 'CustomEvent<SelectInputDetail>',
        description:
          'Dispatched when the query text changes, before options are filtered. Under `filter="off"` this is where you set `hidden` yourself.',
        cancelable: false,
      },
      {
        name: 'ui-page',
        type: 'CustomEvent<SelectPageDetail>',
        description: 'Dispatched after the rendered page of a paged list changes.',
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
          action:
            'Open the listbox from the closed trigger, or move the active option when it is already open.',
        },
        {
          key: 'Home / End',
          action: 'Move to the first or last option while the listbox is open.',
        },
        {
          key: 'Escape',
          action: 'Close the listbox without changing the value.',
        },
        {
          key: 'Printable characters',
          action:
            'Typeahead over the option labels. On a closed Select this selects a match without opening, as the native control does.',
        },
        {
          key: 'Backspace',
          action: 'In an empty `search` field under `multiple`, removes the last chip.',
        },
      ],
      notes:
        'Timeless gives the trigger `role="combobox"`, which is what the Select-Only Combobox pattern asks for and what makes `aria-activedescendant` legal on it. Your own `role` wins over that, and the relationship follows the role: set one that cannot carry `aria-activedescendant`, such as `button`, and Timeless writes no relationship rather than an invalid one, while the active option is still highlighted. That role does not take its name from its content, so the trigger needs your `aria-labelledby` or `aria-label`; `checkMarkup` reports it when missing. Focus stays on the trigger and the active option is announced through `aria-activedescendant`; under `searchable` focus moves into the `search` field instead and the same mechanism carries the highlight. The trigger carries `popovertarget`, so it opens the surface before any script runs. Light dismiss and Escape come from the Popover API. `header`, `footer`, and the pager sit outside arrow navigation and are reached with `Tab`.',
    },
  },
  combobox: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-combobox',
    },
    css: [
      'core/combobox.css',
      'core/floating.css',
      'core/options.css',
      'themes/atmosphere/combobox.css',
      'themes/atmosphere/options.css',
    ],
    attributes: [
      {
        name: 'value',
        type: 'string',
        description:
          'The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input.',
      },
      {
        name: 'align',
        type: 'string',
        set: 'collectionAlignments',
        values: ['start', 'end'],
        default: 'start',
        description:
          'Which edge of the trigger the surface aligns to. The surface is never narrower than the trigger.',
      },
      {
        name: 'filter',
        type: 'string',
        set: 'optionFilterModes',
        values: ['contains', 'starts-with', 'off'],
        default: 'contains',
        description:
          'How typed text narrows the options. `off` hands visibility to you: listen for `ui-input` and set `hidden` yourself, and navigation, the empty state, group collapse, and paging all follow.',
      },
      {
        name: 'multiple',
        type: 'boolean',
        description:
          'Present to allow more than one selected option. Selected values render as chips and submit one form entry each under the same `name`.',
      },
      {
        name: 'name',
        type: 'string',
        description:
          'Form field name. The element submits its own value through `ElementInternals`.',
      },
      {
        name: 'required',
        type: 'boolean',
        description: 'Present to block submission while nothing is selected, with `valueMissing`.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        description:
          'Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
      },
      {
        name: 'page-size',
        type: 'number',
        description:
          'Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property.',
      },
    ],
    parts: [
      {
        name: 'trigger',
        required: true,
        selector: "input[role='combobox']",
        description:
          'The native text input. It is both the trigger and the search field: Timeless wires `aria-expanded`, `aria-controls`, and `aria-activedescendant` onto it and leaves its editing behavior alone.',
      },
      {
        name: 'surface',
        required: false,
        selector: "[data-ui-part~='surface']",
        description:
          'The popover the listbox sits in. Author it whenever the surface also holds a `header`, a `footer`, or a pager: a `role="listbox"` may own only options and groups. With none of them, the `listbox` is its own surface and this part is unnecessary.',
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
          'One option. Its value comes from `value`, then `data-ui-value`, then its text. Its filterable label comes from `label`, then `data-ui-label`, then `aria-label`, then its text — none of which change the accessible name. Mark unavailable options `aria-disabled="true"`.',
      },
      {
        name: 'option-indicator',
        required: false,
        selector: "[data-ui-part~='option-indicator']",
        description:
          'Decorative affordance inside an option showing that it is selected. Style it from `[aria-selected="true"]`; it is hidden from assistive technology.',
      },
      {
        name: 'group',
        required: false,
        selector: "[data-ui-part~='group']",
        description:
          'A `role="group"` wrapper around related options. Options inside it stay navigable, and the group collapses when every option it holds is filtered out.',
      },
      {
        name: 'group-label',
        required: false,
        selector: "[data-ui-part~='group-label']",
        description: 'The label for a `group`, wired to it with `aria-labelledby`.',
      },
      {
        name: 'separator',
        required: false,
        selector: "[role='separator']",
        description: 'A visual divider between options. Navigation and typeahead skip it.',
      },
      {
        name: 'empty',
        required: false,
        selector: "[data-ui-part~='empty']",
        description: 'Shown when no option is visible. Hidden again as soon as one is.',
      },
      {
        name: 'status',
        required: false,
        selector: "[data-ui-part~='status']",
        description:
          'A `role="status" aria-live="polite"` region for result counts, loading, and errors.',
      },
      {
        name: 'header',
        required: false,
        selector: "[data-ui-part~='header']",
        description:
          'Optional content at the top of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'footer',
        required: false,
        selector: "[data-ui-part~='footer']",
        description:
          'Optional content at the bottom of the surface. Excluded from arrow navigation and reachable with `Tab`.',
      },
      {
        name: 'pager',
        required: false,
        selector: "[data-ui-part~='pager']",
        description:
          'Wraps the page controls. Hidden unless `page-size` is set and the options span more than one page.',
      },
      {
        name: 'page-previous',
        required: false,
        selector: "[data-ui-part~='page-previous']",
        description:
          'Moves to the previous page. Stays focusable at the first page and takes `aria-disabled`, so the boundary is discoverable rather than gone.',
      },
      {
        name: 'page-next',
        required: false,
        selector: "[data-ui-part~='page-next']",
        description: 'Moves to the next page, with the same boundary behavior.',
      },
      {
        name: 'page-status',
        required: false,
        selector: "[data-ui-part~='page-status']",
        description: 'A `role="status" aria-live="polite"` region announcing the current page.',
      },
      {
        name: 'chips',
        required: false,
        selector: "[data-ui-part~='chips']",
        description: 'Container the selected values are rendered into under `multiple`.',
      },
      {
        name: 'chip-template',
        required: false,
        selector: "template[data-ui-part~='chip-template']",
        description:
          'A `<template>` holding the markup for one chip. Timeless clones it per selected value and fills it in, so every element and class in a chip is yours. Without it a `chips` container receives a plain comma-separated summary instead.',
      },
      {
        name: 'chip',
        required: false,
        selector: "[data-ui-part~='chip']",
        description: 'One selected value, authored inside `chip-template`.',
      },
      {
        name: 'chip-label',
        required: false,
        selector: "[data-ui-part~='chip-label']",
        description:
          'Where the selected label is written inside a chip. Omit it only when the chip has no other content.',
      },
      {
        name: 'chip-remove',
        required: false,
        selector: "[data-ui-part~='chip-remove']",
        description:
          'Removes its chip. Author it as a real button; Timeless gives it the value it removes and an accessible name naming that value, since one shared template cannot. An `aria-label` you author wins.',
      },
      {
        name: 'clear',
        required: false,
        selector: "[data-ui-part~='clear']",
        description: 'Empties the whole selection. Disabled while there is nothing to clear.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-collection-surface-inline-size',
        description:
          'Minimum width of the listbox surface. The input width wins whenever it is larger.',
      },
      {
        name: '--ui-floating-offset',
        description: 'Gap between the input and the surface.',
      },
    ],
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
      {
        name: 'ui-open',
        type: 'CustomEvent<ComboboxToggleDetail>',
        description: 'Dispatched after the listbox opens.',
        cancelable: false,
      },
      {
        name: 'ui-close',
        type: 'CustomEvent<ComboboxToggleDetail>',
        description: 'Dispatched after the listbox closes.',
        cancelable: false,
      },
      {
        name: 'ui-input',
        type: 'CustomEvent<ComboboxInputDetail>',
        description:
          'Dispatched when the query text changes, before options are filtered. Under `filter="off"` this is where you set `hidden` yourself.',
        cancelable: false,
      },
      {
        name: 'ui-page',
        type: 'CustomEvent<ComboboxPageDetail>',
        description: 'Dispatched after the rendered page of a paged list changes.',
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
          key: 'Arrow Left / Arrow Right',
          action: 'Move the text caret. They never move the highlight.',
        },
        {
          key: 'Enter',
          action: 'Commit the active option.',
        },
        {
          key: 'Escape',
          action: 'Close the listbox, then clear the filter on a second press.',
        },
        {
          key: 'Backspace',
          action: 'In an empty input under `multiple`, removes the last chip.',
        },
      ],
      notes:
        'Focus stays in the text input at all times; the active option is exposed with `aria-activedescendant`. Filtering hides non-matching options rather than removing them, so find-in-page and the DOM still show the full authored list. `header`, `footer`, and the pager sit outside arrow navigation and are reached with `Tab`.',
    },
  },
  toaster: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-toaster',
    },
    css: ['core/toast.css', 'themes/atmosphere/toast.css'],
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
    css: ['core/toast.css', 'themes/atmosphere/toast.css'],
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
    css: ['core/toggle.css', 'themes/atmosphere/toggle.css'],
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
    css: ['core/number-stepper.css', 'themes/atmosphere/number-stepper.css'],
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
    css: ['core/color-picker.css', 'themes/atmosphere/color-picker.css'],
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
  form: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-form',
    },
    css: ['core/form.css'],
    attributes: [],
    parts: [
      {
        name: 'form',
        required: true,
        selector: 'form',
        description:
          'The native `<form>`. Submission, `method`, `action`, reset, and constraint validation are all still its job; `ui-form` only writes messages onto the fields inside it.',
      },
      {
        name: 'error',
        required: false,
        selector: "[data-ui-part~='error']",
        description:
          'The message element for one field, resolved as the single `error` part inside the nearest wrapper that holds no other named control. `.ui-field`, `.ui-choice-group`, and `.ui-fieldset` all produce that shape, so no pairing attribute is needed. `ui-form` writes its text and points the field’s `aria-describedby` at it.',
      },
    ],
    states: [],
    variables: [],
    events: [
      {
        name: 'ui-invalid',
        type: 'CustomEvent<FormInvalidDetail>',
        description:
          'Dispatched after `setErrors` has put at least one message on a control, naming the fields that matched. Clearing errors dispatches nothing.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: null,
      patternLabel: 'Form errors',
      keys: [],
      notes:
        'There is no APG pattern for server-side error mapping. `ui-form` sets `aria-invalid` on each field it marks and points `aria-describedby` at the authored error text, then moves focus to the first field that took a message — which is what makes the error reachable rather than merely visible. Everything else, including the native validation bubble, stays with the platform.',
    },
  },
  rangeField: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-range-field',
    },
    css: ['core/range-field.css', 'themes/atmosphere/range-field.css'],
    attributes: [],
    parts: [
      {
        name: 'track',
        required: true,
        selector: "[data-ui-part~='track']",
        description:
          'Wrapper around the two thumbs. It is the shared track: both inputs stack inside it, and the fill between them is drawn on it from measured bounds.',
      },
      {
        name: 'from',
        required: true,
        selector: "input[type='range']",
        description:
          'The lower thumb, a native range input. Give it its own `name`, `min`, `max`, `step`, and accessible name; it submits and resets on its own, with no JavaScript.',
      },
      {
        name: 'to',
        required: true,
        selector: "input[type='range']",
        description:
          'The upper thumb. Same contract as `from`, with its own `name` so the pair submits as two entries.',
      },
      {
        name: 'output',
        required: false,
        selector: "[data-ui-part~='output']",
        description:
          'Live readout of the pair. Timeless writes the current values into it as text, so omit the part when you want to format them yourself.',
      },
    ],
    states: [
      {
        name: 'disabled',
        source: 'native',
        public: true,
        description: 'Native `disabled` on either thumb.',
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
      {
        name: '--ui-range-fill',
        description: 'Colour of the filled span between the two thumbs.',
      },
    ],
    events: [
      {
        name: 'ui-change',
        type: 'CustomEvent<RangeFieldChangeDetail>',
        description:
          'Dispatched after either thumb moves, carrying the clamped pair and which thumb moved. Bubbles and is composed.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: 'slider-multithumb',
      patternLabel: 'Slider (Multi-Thumb)',
      keys: [
        {
          key: 'Arrow keys, Home / End, Page Up / Page Down',
          action: 'Move the focused thumb. Handled by the native range input, not by Timeless.',
        },
      ],
      notes:
        'Each thumb is a native `input[type=range]` and therefore its own tab stop, with its own accessible name and its own value announcement. Timeless only keeps the pair ordered: a thumb stops at its neighbour rather than swapping with it, so the key you are holding never starts moving the other thumb.',
    },
  },
  otpField: {
    kind: 'custom-element',
    root: {
      kind: 'element',
      name: 'ui-otp-field',
    },
    css: [
      'core/forms.css',
      'core/otp-field.css',
      'themes/atmosphere/forms.css',
      'themes/atmosphere/otp-field.css',
    ],
    attributes: [
      {
        name: 'name',
        type: 'string',
        description:
          'Form field name. The joined code submits as one entry through `ElementInternals`; the cells themselves carry no `name`.',
      },
      {
        name: 'length',
        type: 'number',
        description:
          'How many characters the code has. Defaults to the number of authored cells, and is what a partly filled field is measured against.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The code on load and after a form reset. Assign the `value` property for live changes; once the user types, the attribute stops applying, the way it does on a native input.',
      },
      {
        name: 'required',
        type: 'boolean',
        description: 'Present to block submission while the field is empty, with `valueMissing`.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        description:
          'Present to disable the field. A field inside a disabled `<fieldset>` is disabled too, and submits nothing either way.',
      },
    ],
    parts: [
      {
        name: 'cell',
        required: true,
        selector: "[data-ui-part~='cell']",
        description:
          'One native input holding one character. Author `maxlength="1"`, `inputmode="numeric"`, an accessible name naming its position, and `autocomplete="one-time-code"` on the first cell only. Give it `class="ui-input"` to pick up the shared control styling.',
      },
      {
        name: 'separator',
        required: false,
        selector: "[data-ui-part~='separator']",
        description:
          'Decorative mark between groups of cells, as in `123-456`. Hide it from assistive technology with `aria-hidden="true"`.',
      },
    ],
    states: [],
    variables: [
      {
        name: '--ui-otp-cell',
        description: 'Width of one cell.',
      },
    ],
    events: [
      {
        name: 'ui-before-change',
        type: 'CustomEvent<OtpFieldChangeDetail>',
        description:
          'Cancelable proposal dispatched before the code changes. Call `preventDefault()` to reject the transition and keep the current value.',
        cancelable: true,
      },
      {
        name: 'ui-change',
        type: 'CustomEvent<OtpFieldChangeDetail>',
        description: 'Dispatched after the code has changed. Bubbles and is composed.',
        cancelable: false,
      },
      {
        name: 'ui-complete',
        type: 'CustomEvent<OtpFieldCompleteDetail>',
        description:
          'Dispatched once every character the field expects has been entered, which is where an auto-submit belongs.',
        cancelable: false,
      },
    ],
    accessibility: {
      pattern: null,
      patternLabel: 'One-time code',
      keys: [
        {
          key: 'Printable characters',
          action: 'Fill the focused cell and move focus to the next one.',
        },
        {
          key: 'Backspace',
          action:
            'Clear the focused cell, or step back and clear the previous one when it is already empty.',
        },
        {
          key: 'Arrow keys',
          action: 'Move between cells.',
        },
        {
          key: 'Home / End',
          action: 'Move to the first or last cell.',
        },
        {
          key: 'Paste',
          action: 'Spread the pasted code across the cells from the focused one onward.',
        },
      ],
      notes:
        'There is no APG pattern for a one-time-code field, so the contract is a composition of things the platform already defines rather than invented ARIA: a named `role="group"` over native inputs, each independently tabbable and separately labelled by position. No roving `tabindex` is written, because every cell is a real tab stop. Autofill, the numeric keyboard, and paste come from the inputs themselves.',
    },
  },
} as const satisfies Readonly<Record<ComponentName, ComponentContract>>

export const componentNames: readonly ComponentName[] = Object.keys(
  componentContracts,
) as ComponentName[]

export function isComponentName(value: string): value is ComponentName {
  return Object.hasOwn(componentContracts, value)
}
