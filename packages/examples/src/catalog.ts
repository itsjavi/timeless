import type { ComponentName } from '@timelessui/components'
import {
  createCheckboxGroup,
  createCombobox,
  createCommandPalette,
  createContextMenu,
  createCustomSelect,
  createListbox,
  createMenu,
  createMenuButton,
  createRadioGroup,
  createToolbar,
} from './collections.html.ts'
import { colorPickerPopoverScript, createColorPicker } from './color-picker.html.ts'
import { createColorPalette, createColorSwatch } from './color-swatch.html.ts'
import { createEmpty } from './empty.html.ts'
import {
  createFieldset,
  createOtpField,
  createRangeFieldPair,
  createServerErrorForm,
  serverErrorFormScript,
} from './form-fields.html.ts'
import {
  createAccountForm,
  createChoiceGroup,
  createFileField,
  createRangeField,
  createSelectField,
  createSwitchField,
  createTextField,
} from './forms.html.ts'
import { createMeter } from './meter.html.ts'
import { createNumberStepper } from './number-stepper.html.ts'
import {
  createCollapsible,
  createDialog,
  createHoverCard,
  createPopover,
  createSheet,
  createTabs,
  createToaster,
  createTooltip,
} from './overlays.html.ts'
import {
  createAlert,
  createAvatar,
  createBadge,
  createCard,
  createGroup,
  createList,
  createProgress,
  createSeparator,
  createSkeleton,
  createSpinner,
  createTable,
  createTextPrimitives,
} from './primitives.html.ts'
import { createToggle, createToggleGroup } from './toggle.html.ts'

/** Sidebar grouping in the documentation. Independent of `domain`, which is a route segment. */
export type ExampleGroup =
  | 'Foundations'
  | 'Actions'
  | 'Content'
  | 'Feedback'
  | 'Forms'
  | 'Navigation'
  | 'Overlays'
  | 'Color'

export type ExampleDomain =
  | 'foundations'
  | 'actions'
  | 'content'
  | 'feedback'
  | 'forms'
  | 'navigation'
  | 'overlays'
  | 'color'
  | 'recipes'

export type ExampleDefinition<TArgs extends object = Record<string, never>> = {
  readonly id: string
  readonly domain: ExampleDomain
  readonly component: string
  /**
   * The component contracts this example documents, in the order the reference should present them.
   * Documentation reads the API, anatomy, and state of exactly these contracts. Components the
   * example merely composes are deliberately absent, so a Popover page never presents Hover Card's
   * attributes as its own.
   */
  readonly contracts: readonly ComponentName[]
  /**
   * Documentation sidebar group. Kept separate from `domain` so the catalog can be reorganised for
   * readers without renaming StoryLite routes, which embed the domain.
   */
  readonly group?: ExampleGroup
  /** When a sibling component covers an overlapping need, say which to reach for and why. */
  readonly guidance?: string
  /**
   * Markup the consumer has to author for the component to reach its best path, when the component
   * cannot write it for them. Kept apart from `guidance`, which compares sibling components.
   */
  readonly authoring?: string
  readonly title: string
  readonly description: string
  readonly defaultArgs: TArgs
  readonly definitions: readonly string[]
  readonly styles: readonly string[]
  readonly render: (args: TArgs) => string
  /** Consumer-side wiring the example needs beyond custom-element registration. */
  readonly script?: string
  /** Extra example ids documented alongside this component. */
  readonly related?: readonly string[]
}

const PALETTE = [
  { label: 'Brand red', value: 'oklch(62% 0.18 32)' },
  { label: 'Brand amber', value: 'hwb(38 6% 8%)' },
  { label: 'Brand lime', value: 'color(display-p3 0.63 0.86 0.2)' },
  { label: 'Brand teal', value: 'lch(70% 45 190)' },
  { label: 'Brand blue', value: '#3366cc' },
  { label: 'Brand violet', value: 'oklch(52% 0.24 300)' },
] as const

const options = [
  { label: 'Draft', value: 'draft' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
] as const

function example(definition: Omit<ExampleDefinition, 'defaultArgs'>): ExampleDefinition {
  return { ...definition, defaultArgs: {} }
}

export const examples = [
  example({
    id: 'separator',
    domain: 'foundations',
    group: 'Foundations',
    contracts: ['separator'],
    component: 'Separator',
    title: 'Separator',
    description: 'Separate related regions with native semantics.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'separator.css'],
    render: () => createSeparator(),
  }),
  example({
    id: 'text-and-code',
    domain: 'foundations',
    group: 'Foundations',
    contracts: ['link', 'kbd', 'code'],
    component: 'Text and Code',
    title: 'Text and Code',
    description: 'Readable links, keyboard hints, and code treatments.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'link.css', 'kbd.css', 'code.css'],
    render: () => createTextPrimitives(),
  }),
  example({
    id: 'button',
    domain: 'actions',
    group: 'Actions',
    contracts: ['button'],
    component: 'Button',
    title: 'Button',
    description: 'Tactile native actions with clear variants.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css'],
    render: () => '<button class="ui-button" type="button">Publish component</button>',
  }),
  example({
    id: 'toggle',
    domain: 'actions',
    guidance:
      'Use Toggle for a button that stays pressed, such as bold in a toolbar. Use [Switch](/docs/components/switch/) for a setting that applies immediately, which is a checkbox rather than a button.',
    group: 'Actions',
    contracts: ['toggle'],
    component: 'Toggle',
    title: 'Toggle',
    description: 'A pressed-state button using native button behavior.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'toggle.css'],
    render: () => createToggle({ label: 'Bold', pressed: true }),
  }),
  example({
    id: 'toggle-group',
    domain: 'actions',
    group: 'Actions',
    contracts: ['toggleGroup', 'toggle'],
    component: 'Toggle Group',
    title: 'Toggle Group',
    description: 'Coordinate single or multiple pressed controls.',
    definitions: ['ui-toggle-group'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'toggle.css'],
    render: () =>
      createToggleGroup({
        label: 'Text alignment',
        attached: true,
        items: [
          { label: 'Left', value: 'left', pressed: true },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      }),
  }),
  example({
    id: 'avatar',
    domain: 'content',
    group: 'Content',
    contracts: ['avatar'],
    component: 'Avatar',
    title: 'Avatar',
    description: 'Identity fallback and presence indicators.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'avatar.css'],
    render: () => createAvatar({ label: 'Avery Stone', initials: 'AS', status: 'online' }),
  }),
  example({
    id: 'card',
    domain: 'content',
    group: 'Content',
    contracts: ['card'],
    component: 'Card',
    title: 'Card',
    description: 'Flat structured content with public anatomy.',
    definitions: [],
    styles: [
      'tokens.css',
      'theme-atmosphere.css',
      'button.css',
      'badge.css',
      'card.css',
      'link.css',
    ],
    render: () =>
      createCard({
        title: 'Component contract',
        description: 'Review the public anatomy before publishing.',
        meta: 'Reference',
      }),
  }),
  example({
    id: 'group',
    domain: 'content',
    group: 'Content',
    contracts: ['group'],
    component: 'Group',
    title: 'Group',
    description: 'Arrange related controls with density and attachment options.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'group.css'],
    render: () => createGroup({ attached: true }),
  }),
  example({
    id: 'list',
    domain: 'content',
    group: 'Content',
    contracts: ['list'],
    component: 'List',
    title: 'List',
    description: 'Structured lists with titles and descriptions.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'list.css'],
    render: () => createList(),
  }),
  example({
    id: 'table',
    domain: 'content',
    group: 'Content',
    contracts: ['table'],
    component: 'Table',
    title: 'Table',
    description: 'Responsive native tables with readable density.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'badge.css', 'table.css'],
    render: () => createTable(),
  }),
  example({
    id: 'alert',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['alert'],
    component: 'Alert',
    title: 'Alert',
    description: 'Communicate status without replacing native live-region semantics.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'alert.css', 'link.css'],
    render: () =>
      createAlert({
        title: 'Package published',
        description: 'The component is available to downstream apps.',
        variant: 'success',
        role: 'status',
      }),
  }),
  example({
    id: 'badge',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['badge'],
    component: 'Badge',
    title: 'Badge',
    description: 'Compact status and metadata labels.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'badge.css'],
    render: () => createBadge({ label: 'Stable', variant: 'success', dot: true }),
  }),
  example({
    id: 'empty',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['empty'],
    component: 'Empty',
    title: 'Empty',
    description: 'Explain an empty state and offer one clear next action.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'empty.css'],
    render: () =>
      createEmpty({
        id: 'empty-projects',
        title: 'No projects yet',
        description: 'Create a project to start composing your interface.',
      }),
  }),
  example({
    id: 'meter',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['meter'],
    component: 'Meter',
    title: 'Meter',
    description: 'Display a scalar measurement within a known range.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'meter.css'],
    render: () =>
      createMeter({
        id: 'quality',
        label: 'Release readiness',
        value: 82,
        max: 100,
        low: 40,
        high: 80,
        optimum: 100,
      }),
  }),
  example({
    id: 'progress',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['progress'],
    component: 'Progress',
    title: 'Progress',
    description: 'Expose determinate or indeterminate task progress.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'progress.css'],
    render: () =>
      createProgress({
        label: 'Documentation build',
        value: 68,
        hint: 'Generating component references.',
      }),
  }),
  example({
    id: 'skeleton',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['skeleton'],
    component: 'Skeleton',
    title: 'Skeleton',
    description: 'Reserve stable space while content loads.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'skeleton.css'],
    render: () => createSkeleton({ width: 'medium' }),
  }),
  example({
    id: 'spinner',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['spinner'],
    component: 'Spinner',
    title: 'Spinner',
    description: 'Indicate a short operation without changing layout.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'spinner.css'],
    render: () => createSpinner({ label: 'Loading preview' }),
  }),
  example({
    id: 'toast',
    domain: 'feedback',
    group: 'Feedback',
    contracts: ['toaster', 'toast'],
    component: 'Toast',
    title: 'Toast',
    description: 'Announce transient status from an explicit toaster.',
    definitions: ['ui-toaster', 'ui-toast'],
    styles: ['tokens.css', 'core/toast.css', 'theme-atmosphere.css', 'toast.css'],
    render: () =>
      createToaster([
        { title: 'Preview ready', description: 'The static example finished building.' },
      ]),
  }),
  example({
    id: 'field',
    domain: 'forms',
    group: 'Forms',
    contracts: ['field', 'label', 'input', 'description', 'error'],
    component: 'Field',
    title: 'Field',
    description: 'Connect labels, descriptions, errors, and native controls.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css'],
    render: () =>
      createTextField({
        id: 'email',
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
        description: 'Used for release notifications.',
      }),
  }),
  example({
    id: 'fieldset',
    domain: 'forms',
    guidance:
      'Use Fieldset to group controls that are not one field — an address block, a billing section. For a set of radios or checkboxes that answer one question, [Checkbox Group](/docs/components/checkbox-group/) and [Radio Group](/docs/components/radio-group/) sit on `.ui-choice-group`, which strips the native chrome because the set reads as a single field.',
    authoring:
      'Keep the `<legend>` the first child: that is what makes the browser treat it as the group name, and no ARIA substitutes for it. Native `disabled` on the `<fieldset>` disables and un-submits everything inside it, including form-associated custom elements, which is why the group needs no disabled attribute of its own.',
    group: 'Forms',
    contracts: ['fieldset', 'field', 'label', 'input', 'description'],
    component: 'Fieldset',
    title: 'Fieldset',
    description: 'Group unrelated controls under one native legend.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css'],
    render: () =>
      createFieldset({
        id: 'billing',
        legend: 'Billing address',
        description: 'Used on every invoice for this workspace.',
        children: [
          createTextField({
            id: 'billing-street',
            name: 'street',
            label: 'Street',
            placeholder: '12 Copperfield Way',
          }),
          createTextField({ id: 'billing-city', name: 'city', label: 'City' }),
        ].join('\n  '),
      }),
  }),
  example({
    id: 'form',
    domain: 'forms',
    guidance:
      'Reach for Form only when errors arrive from somewhere the browser cannot see — a server response, an async uniqueness check. Everything a `required`, a `type="email"`, or a `pattern` can decide is already decided by native constraint validation, and adding Form does not change it.',
    authoring:
      'Author an empty `error` part inside each field wrapper. Form resolves it as the single `error` part in the nearest wrapper holding no other named control, which is the shape `.ui-field`, `.ui-choice-group`, and `.ui-fieldset` already produce, then writes the message and points the field’s `aria-describedby` at it. A field with no wrapper gets no error element rather than someone else’s.',
    group: 'Forms',
    contracts: ['form', 'field', 'label', 'input', 'description', 'error'],
    component: 'Form',
    title: 'Form',
    description: 'Put server-side errors back onto the fields they came from.',
    definitions: ['ui-form'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css', 'form.css', 'button.css'],
    render: () => createServerErrorForm(),
    script: serverErrorFormScript,
  }),
  example({
    id: 'otp-field',
    domain: 'forms',
    authoring:
      'Author every cell. `autocomplete="one-time-code"` goes on the first cell only, so the platform offers the SMS code once rather than per cell; every cell needs `maxlength="1"`, `inputmode="numeric"` for the numeric keyboard, and an accessible name naming its position. The cells carry no `name` — the joined code submits under the host `name`.',
    guidance:
      'Without JavaScript the cells are still usable native inputs, but only the enhanced field submits the code, because the joined value belongs to the host. That is the same bar [Select](/docs/components/select/) and [Combobox](/docs/components/combobox/) meet.',
    group: 'Forms',
    contracts: ['otpField', 'field', 'label', 'input', 'description'],
    component: 'OTP Field',
    title: 'OTP Field',
    description: 'A one-time code across native single-character inputs.',
    definitions: ['ui-otp-field'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css', 'otp-field.css'],
    render: () =>
      createOtpField({
        id: 'signin-code',
        name: 'code',
        label: 'Verification code',
        length: 6,
        groupAfter: [3],
        description: 'Paste the whole code — it spreads across the cells.',
      }),
  }),
  example({
    id: 'range-field',
    domain: 'forms',
    guidance:
      'Use Range Field when the value is a span. For a single value, [Range](/docs/components/range/) is CSS over one native input and needs no JavaScript at all.',
    authoring:
      'Both thumbs are native range inputs with their own `name`, so the pair submits as two entries and resets natively with scripting off. Give each one its own accessible name saying which end it is; nothing else can tell them apart in a screen reader.',
    group: 'Forms',
    contracts: ['rangeField', 'field', 'label', 'description'],
    component: 'Range Field',
    title: 'Range Field',
    description: 'Two native thumbs on one track, kept in order.',
    definitions: ['ui-range-field'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css', 'range-field.css'],
    render: () =>
      createRangeFieldPair({
        id: 'budget',
        name: 'budget',
        label: 'Monthly budget',
        min: 0,
        max: 500,
        step: 10,
        from: 120,
        to: 380,
        description: 'A thumb stops at its neighbour rather than swapping with it.',
      }),
  }),
  example({
    id: 'file-input',
    domain: 'forms',
    group: 'Forms',
    contracts: ['file', 'field', 'label', 'description'],
    component: 'File Input',
    title: 'File Input',
    description: 'A native file input with consistent field anatomy.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css'],
    render: () =>
      createFileField({
        id: 'manifest',
        name: 'manifest',
        label: 'Component manifest',
        accept: '.json',
        description: 'Upload a Custom Elements Manifest.',
      }),
  }),
  example({
    id: 'native-select',
    domain: 'forms',
    guidance:
      'Prefer Native Select. It is the platform control, so it needs no JavaScript and behaves correctly on every device. Choose [Select](/docs/components/select/) only when you need option markup the native control cannot render.',
    group: 'Forms',
    contracts: ['nativeSelect', 'field', 'label'],
    component: 'Native Select',
    title: 'Native Select',
    description: 'Style a native select while preserving platform behavior.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css'],
    render: () =>
      createSelectField({
        id: 'channel',
        name: 'channel',
        label: 'Release channel',
        value: 'stable',
        options: [
          ['preview', 'Preview'],
          ['stable', 'Stable'],
        ],
      }),
  }),
  example({
    id: 'number-stepper',
    domain: 'forms',
    group: 'Forms',
    contracts: ['numberStepper'],
    component: 'Number Stepper',
    title: 'Number Stepper',
    description: 'Enhance a native number input with increment controls.',
    definitions: ['ui-number-stepper'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'number-stepper.css'],
    render: () =>
      createNumberStepper({ id: 'quantity', label: 'Quantity', value: 2, min: 1, max: 10 }),
  }),
  example({
    id: 'range',
    domain: 'forms',
    group: 'Forms',
    contracts: ['range'],
    component: 'Range',
    title: 'Range',
    description: 'A readable native range control with an output.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'range.css'],
    render: () =>
      createRangeField({
        id: 'density',
        name: 'density',
        label: 'Density',
        value: 60,
        min: 0,
        max: 100,
      }),
  }),
  example({
    id: 'switch',
    domain: 'forms',
    guidance:
      'Use Switch for a setting that applies immediately. Use [Toggle](/docs/components/toggle/) when the control is a button whose pressed state is part of a toolbar.',
    group: 'Forms',
    contracts: ['switch', 'choice'],
    component: 'Switch',
    title: 'Switch',
    description: 'A native checkbox exposed as an immediate on or off setting.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css'],
    render: () =>
      createSwitchField({
        id: 'dark-mode',
        name: 'dark-mode',
        label: 'Dark mode',
        description: 'Follow the documentation theme.',
        checked: true,
      }),
  }),
  example({
    id: 'checkbox-group',
    domain: 'navigation',
    guidance:
      'One component, two levels of behavior. `<ui-checkbox-group>` adds roving focus and a single change event over the group; the plain `<fieldset class="ui-choice-group">` below it is the same markup with no custom element, and it submits, resets, and takes keyboard input on its own. The element is an addition to native checkboxes, not a replacement for them, so it is never a choice between a CSS version and a JavaScript version.',
    group: 'Forms',
    contracts: ['checkboxGroup', 'choiceGroup', 'choice', 'checkbox'],
    component: 'Checkbox Group',
    title: 'Checkbox Group',
    description: 'Coordinate a group of native checkboxes.',
    definitions: ['ui-checkbox-group'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css', 'choice-groups.css'],
    render: () =>
      [
        createCheckboxGroup({
          id: 'features',
          name: 'features',
          label: 'Features',
          values: ['documentation'],
          options: [{ label: 'Documentation' }, { label: 'Playground' }],
        }),
        createChoiceGroup({
          legend: 'Notifications',
          name: 'notifications',
          type: 'checkbox',
          options: [
            { value: 'product', label: 'Product updates', checked: true },
            { value: 'security', label: 'Security notices', checked: true },
          ],
        }),
      ].join('\n'),
  }),
  example({
    id: 'combobox',
    domain: 'navigation',
    group: 'Forms',
    contracts: ['combobox'],
    component: 'Combobox',
    title: 'Combobox',
    description: 'Filter an authored listbox from a native text input.',
    authoring:
      'The input is both the trigger and the search field: Timeless wires `aria-expanded`, `aria-controls`, and `aria-activedescendant` onto it and leaves its editing behavior alone. Filtering sets `hidden` on non-matching options rather than removing them, which is also the extension point — set `filter="off"` and Timeless filters nothing, emits `ui-input` with the query, and lets you set `hidden` yourself. Navigation, the empty state, group collapse, and paging all keep working, because every one of them reads `hidden`.',
    guidance:
      'Combobox and [Select](/docs/components/select/) are the same ARIA pattern over the same option core, differing only in where you type. Reach for Combobox when the user should be able to type free text or filter from the control itself, and for a `searchable` Select when the trigger should stay a button that shows the chosen value.',
    definitions: ['ui-combobox'],
    styles: [
      'tokens.css',
      'core/combobox.css',
      'core/floating.css',
      'core/options.css',
      'theme-atmosphere.css',
      'button.css',
      'combobox.css',
      'options.css',
    ],
    render: () =>
      createCombobox({
        id: 'component-search',
        label: 'Component',
        name: 'component',
        placeholder: 'Type to filter…',
        options,
        empty: 'No component matches that filter.',
      }),
  }),
  example({
    id: 'listbox',
    domain: 'navigation',
    group: 'Forms',
    contracts: ['listbox'],
    component: 'Listbox',
    title: 'Listbox',
    description: 'Keyboard selection over authored options.',
    authoring:
      'The host carries `role="listbox"` and scrolls its own options. Add an `empty` region, a `status` region, or a pager and those cannot sit inside it — a listbox may own only options and groups — so wrap the options in an inner `listbox` part and let the host be the frame around it.',
    guidance:
      'Listbox is the inline core [Select](/docs/components/select/) and [Combobox](/docs/components/combobox/) compose: the same option semantics, selection, groups, typeahead, and paging, without a trigger or a popover. Use it directly when the choices should always be visible, and reach for one of the other two when they should not.',
    definitions: ['ui-listbox'],
    styles: [
      'tokens.css',
      'core/listbox.css',
      'core/options.css',
      'theme-atmosphere.css',
      'listbox.css',
      'options.css',
    ],
    render: () =>
      createListbox({
        id: 'status-list',
        label: 'Status',
        name: 'status',
        value: 'ready',
        options,
      }),
  }),
  example({
    id: 'menu',
    domain: 'navigation',
    group: 'Navigation',
    authoring:
      'Wrap related items in a `group` with a `group-label` and Timeless writes the `role="group"` and the `aria-labelledby` between them. Checkable items need only the role and a starting `aria-checked`: activating a `menuitemcheckbox` toggles it, and activating a `menuitemradio` clears the other radios in its group. Both dispatch a cancelable `ui-before-change` first, so a consumer already writing `aria-checked` from its own state can keep doing exactly that.',
    contracts: ['menu'],
    component: 'Menu',
    title: 'Menu',
    description: 'Roving keyboard navigation for commands.',
    definitions: ['ui-menu'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/menu.css',
      'theme-atmosphere.css',
      'button.css',
      'menu.css',
    ],
    render: () =>
      createMenu({
        label: 'Editor commands',
        items: [{ label: 'Duplicate' }, { label: 'Archive' }, { label: 'Delete', disabled: true }],
        groups: [
          {
            label: 'View',
            items: [
              { label: 'Show grid', checkable: 'checkbox', checked: true },
              { label: 'Show rulers', checkable: 'checkbox' },
            ],
          },
          {
            label: 'Density',
            items: [
              { label: 'Comfortable', checkable: 'radio', checked: true },
              { label: 'Compact', checkable: 'radio' },
            ],
          },
        ],
      }),
  }),
  example({
    id: 'context-menu',
    domain: 'navigation',
    group: 'Navigation',
    guidance:
      'A context menu is the same surface as [Menu](/docs/components/menu/), opened by a secondary click over a region instead of by a control. Reach for [Menu Button](/docs/components/menu-button/) when the commands should have a visible trigger — a context menu is discoverable only by trying it, so it belongs to shortcuts for things reachable another way.',
    authoring:
      'This is the one Timeless component with no markup-only path: the platform cannot open a surface at pointer coordinates without script, so with JavaScript off the browser shows its own context menu and the authored `ui-menu` stays hidden. Never put a command here that is not also reachable elsewhere. Give the `target` a role that supports `aria-haspopup` and an accessible name — in real markup it is usually something that already has both, like a table row or a treeitem — and Timeless adds the tab stop, the relationships, and the `Shift+F10` and Context Menu key routes in.',
    contracts: ['contextMenu', 'menu'],
    component: 'Context Menu',
    title: 'Context Menu',
    description: 'Open a menu at the pointer, or from the keyboard.',
    definitions: ['ui-context-menu', 'ui-menu'],
    styles: [
      'tokens.css',
      'core/context-menu.css',
      'core/floating.css',
      'core/menu.css',
      'theme-atmosphere.css',
      'button.css',
      'menu.css',
      'context-menu.css',
    ],
    render: () =>
      createContextMenu({
        id: 'asset-context-menu',
        label: 'Asset commands',
        targetLabel: 'hero-banner.avif',
        items: [{ label: 'Open' }, { label: 'Rename' }],
        groups: [
          {
            label: 'Share',
            items: [{ label: 'Copy link' }, { label: 'Invite reviewer' }],
          },
        ],
      }),
  }),
  example({
    id: 'menu-button',
    domain: 'navigation',
    group: 'Navigation',
    contracts: ['menuButton', 'menu'],
    component: 'Menu Button',
    title: 'Menu Button',
    description: 'Connect a command trigger to a native popover menu.',
    definitions: ['ui-menu-button', 'ui-menu'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/menu.css',
      'theme-atmosphere.css',
      'button.css',
      'menu.css',
      'popover.css',
    ],
    render: () =>
      createMenuButton({
        id: 'actions',
        label: 'Actions',
        items: [{ label: 'Duplicate' }, { label: 'Archive' }],
      }),
  }),
  example({
    id: 'radio-group',
    domain: 'navigation',
    guidance:
      'One component, two levels of behavior. `<ui-radio-group>` adds roving focus and a single change event over the group; the plain `<fieldset class="ui-choice-group">` below it is the same markup with no custom element, and native radios already give it arrow-key selection and one-of-many semantics. The element is an addition, not a replacement, so it is never a choice between a CSS version and a JavaScript version.',
    group: 'Forms',
    contracts: ['radioGroup', 'choiceGroup', 'choice', 'radio'],
    component: 'Radio Group',
    title: 'Radio Group',
    description: 'Coordinate a roving native radio group.',
    definitions: ['ui-radio-group'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'forms.css', 'choice-groups.css'],
    render: () =>
      [
        createRadioGroup({
          id: 'theme',
          name: 'theme',
          label: 'Theme',
          value: 'system',
          options: [{ label: 'System' }, { label: 'Light' }, { label: 'Dark' }],
        }),
        createChoiceGroup({
          legend: 'Deploy target',
          name: 'deploy-target',
          type: 'radio',
          options: [
            { value: 'preview', label: 'Preview', checked: true },
            { value: 'production', label: 'Production' },
          ],
        }),
      ].join('\n'),
  }),
  example({
    id: 'select',
    domain: 'navigation',
    authoring:
      'The trigger carries `popovertarget` naming the surface, so it opens, light-dismisses, and closes on Escape before any script loads. Give the surface an explicit `id` for it to name. Focus stays on the trigger and the active option travels through `aria-activedescendant`; add `searchable` to move that focus into a `search` field inside the surface instead. A surface that holds a search field, a header, a footer, or a pager needs a `surface` part around the `listbox`, because a `role="listbox"` may own only options and groups.',
    guidance:
      'Select and [Combobox](/docs/components/combobox/) are the same ARIA pattern over the same option core; they differ only in where you type. A Select types into a `search` field inside its surface, or not at all; a Combobox types into the trigger and accepts free text. Both replace the native control and cost JavaScript, so if plain text options are enough, [Native Select](/docs/components/native-select/) is still the better default.',
    group: 'Forms',
    contracts: ['select'],
    component: 'Select',
    title: 'Select',
    description: 'Enhance authored trigger, value, and listbox anatomy.',
    definitions: ['ui-select'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/options.css',
      'core/select.css',
      'theme-atmosphere.css',
      'button.css',
      'select.css',
      'options.css',
    ],
    render: () =>
      createCustomSelect({
        id: 'release-status',
        name: 'status',
        label: 'Release status',
        value: 'ready',
        options,
      }),
  }),
  example({
    id: 'toolbar',
    domain: 'navigation',
    group: 'Navigation',
    contracts: ['toolbar'],
    component: 'Toolbar',
    title: 'Toolbar',
    description: 'Arrow-key navigation across a group of commands.',
    definitions: ['ui-toolbar'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'toolbar.css'],
    render: () => createToolbar({ label: 'Formatting' }),
  }),
  example({
    id: 'collapsible',
    domain: 'overlays',
    guidance:
      'One expandable region or a whole stack of them: both are `<details>` with `.ui-collapsible`, so there is no second component to choose. Give every `<details>` in a stack the same `name` to get an accordion where only one panel is open at a time — the browser closes the previous one, so no script is involved. Omit `name` and the panels open independently.',
    group: 'Content',
    contracts: ['collapsible'],
    component: 'Collapsible',
    title: 'Collapsible',
    description: 'Style native disclosure groups without replacing details.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'collapsible.css'],
    render: () =>
      createCollapsible({
        name: 'catalog-collapsible',
        items: [
          {
            title: 'What ships?',
            content: 'CSS, explicit element definitions, and public types.',
            open: true,
          },
          {
            title: 'Does it need JavaScript?',
            content:
              'No. Native details and summary own the open state, the keyboard, and find-in-page.',
          },
        ],
      }),
  }),
  example({
    id: 'dialog',
    domain: 'overlays',
    authoring:
      'The trigger and the close buttons carry `command` and `commandfor`, so the dialog opens, closes, and reports a `returnValue` before any script runs. Those attributes are yours to write: Timeless reads them and leaves the invocation to the platform, because a generated `commandfor` would only work once the bundle had loaded. Give the `<dialog>` an explicit `id` for them to name — an invoker cannot reference a generated one. Where [Invoker Commands](/docs/reference/browser-support/) are missing, the component falls back to a click listener that does the same work, so the same markup is correct in every browser.',
    group: 'Overlays',
    contracts: ['dialog'],
    component: 'Dialog',
    title: 'Dialog',
    description: 'Enhance an authored native dialog with focus management.',
    definitions: ['ui-dialog'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'dialog.css'],
    render: () =>
      createDialog({
        id: 'release-dialog',
        title: 'Publish release?',
        description: 'Confirm the public package.',
        body: 'Package checks have passed.',
      }),
  }),
  example({
    id: 'hover-card',
    domain: 'overlays',
    guidance:
      'Use Hover Card for a surface holding content worth reading or clicking. For a single short label on hover or focus, [Tooltip](/docs/components/tooltip/) is the same element with `variant="tooltip"` and a box sized for one line.',
    group: 'Overlays',
    contracts: ['hoverCard'],
    component: 'Hover Card',
    title: 'Hover Card',
    description: 'Open supporting content from pointer or keyboard intent.',
    definitions: ['ui-hover-card'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/popover.css',
      'theme-atmosphere.css',
      'button.css',
      'popover.css',
    ],
    render: () =>
      createHoverCard({
        id: 'hover-reference',
        triggerLabel: 'Component contract',
        title: 'Public contract',
        description: 'Stable anatomy, attributes, and events.',
      }),
  }),
  example({
    id: 'popover',
    domain: 'overlays',
    guidance:
      'Popover opens from a click and can hold interactive content. For hover or focus intent, use [Hover Card](/docs/components/hover-card/); for a modal that blocks the page, use [Dialog](/docs/components/dialog/).',
    group: 'Overlays',
    contracts: ['popover'],
    component: 'Popover',
    title: 'Popover',
    description: 'Connect an authored trigger to a native popover.',
    definitions: ['ui-popover'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/popover.css',
      'theme-atmosphere.css',
      'button.css',
      'popover.css',
    ],
    render: () =>
      createPopover({
        id: 'release-popover',
        triggerLabel: 'Release status',
        title: 'Ready to publish',
        description: 'All required package checks passed.',
      }),
  }),
  example({
    id: 'sheet',
    domain: 'overlays',
    authoring:
      'A `modal` sheet opens from markup: put `command="show-modal"` and `commandfor` on the trigger, naming the explicit `id` you gave the `<dialog>`. A non-modal sheet cannot, because the platform has no built-in command for `dialog.show()`, so leave `command` off that trigger and the click listener opens it. Close buttons take `command="close"` on either kind, and the platform copies the button `value` into `returnValue`. Timeless reads these attributes and never writes them, so a modal sheet still opens with JavaScript disabled.',
    group: 'Overlays',
    contracts: ['sheet'],
    component: 'Sheet',
    title: 'Sheet',
    description: 'Present an authored native dialog from a viewport edge.',
    definitions: ['ui-sheet'],
    styles: [
      'tokens.css',
      'core/sheet.css',
      'theme-atmosphere.css',
      'button.css',
      'sheet.css',
      'dialog.css',
    ],
    render: () =>
      createSheet({
        id: 'settings-sheet',
        title: 'Settings',
        description: 'Configure this preview.',
        body: 'Changes apply immediately.',
        modal: true,
      }),
  }),
  example({
    id: 'tabs',
    domain: 'overlays',
    group: 'Navigation',
    contracts: ['tabs'],
    component: 'Tabs',
    title: 'Tabs',
    description: 'Associate tabs and panels with native keyboard behavior.',
    definitions: ['ui-tabs'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'tabs.css'],
    render: () =>
      createTabs({
        id: 'package-tabs',
        label: 'Package details',
        items: [
          { id: 'install', label: 'Install', content: 'Install from the workspace package.' },
          { id: 'usage', label: 'Usage', content: 'Author native Light DOM anatomy.' },
        ],
      }),
  }),
  example({
    id: 'tooltip',
    domain: 'overlays',
    guidance:
      'Tooltip and [Hover Card](/docs/components/hover-card/) are one custom element with two boxes. `variant="tooltip"` gives a short non-interactive label that sizes to its content and never scrolls; omit it for a roomier surface holding content worth reading or clicking. Because both are `<ui-hover-card>`, the host attributes — `anchor`, `placement`, `open-delay`, `close-delay` — are the same for each and are documented once, on [Hover Card](/docs/components/hover-card/#attributes).',
    group: 'Overlays',
    contracts: ['tooltip'],
    component: 'Tooltip',
    title: 'Tooltip',
    description: 'A concise tooltip built on the hover-card controller.',
    definitions: ['ui-hover-card'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/popover.css',
      'theme-atmosphere.css',
      'button.css',
      'popover.css',
    ],
    render: () =>
      createTooltip({
        id: 'copy-tooltip',
        triggerLabel: 'Copy',
        description: 'Copy canonical markup',
      }),
  }),
  example({
    id: 'color-picker',
    domain: 'color',
    group: 'Color',
    contracts: ['colorPicker'],
    component: 'Color Picker',
    title: 'Color Picker',
    description: 'Edit modern color formats through authored controls.',
    definitions: ['ui-color-picker'],
    styles: ['tokens.css', 'theme-atmosphere.css', 'color-picker.css'],
    related: ['popover-color-picker'],
    render: () =>
      createColorPicker({ id: 'brand-color', label: 'Brand color', value: 'oklch(62% 0.18 32)' }),
  }),
  example({
    id: 'color-swatch',
    domain: 'color',
    group: 'Color',
    contracts: ['colorSwatch'],
    component: 'Color Swatch',
    title: 'Color Swatch',
    description: 'Display and select a named color value.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'color-swatch.css'],
    related: ['color-palette'],
    render: () => createColorSwatch({ label: 'Brand red', value: 'oklch(62% 0.18 32)' }),
  }),
  example({
    id: 'color-palette',
    domain: 'recipes',
    contracts: ['colorSwatch'],
    component: 'Color Palette',
    title: 'Color Palette',
    description: 'Lay several swatches out as a selectable grid across CSS color formats.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'color-swatch.css'],
    render: () => createColorPalette({ colors: PALETTE, selected: '#3366cc' }),
  }),
  example({
    id: 'command-palette',
    domain: 'recipes',
    contracts: ['select', 'dialog'],
    component: 'Command Palette',
    title: 'Command Palette',
    description: 'Compose a searchable Select inside a dialog. No command element required.',
    definitions: ['ui-select', 'ui-dialog'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/options.css',
      'core/select.css',
      'theme-atmosphere.css',
      'button.css',
      'dialog.css',
      'select.css',
      'options.css',
    ],
    render: () =>
      createCommandPalette({
        id: 'command-palette',
        label: 'Commands',
        commands: [
          { label: 'Go to file' },
          { label: 'Go to symbol' },
          { label: 'Toggle terminal' },
          { label: 'Run build task' },
          { label: 'Reload window' },
        ],
      }),
  }),
  example({
    id: 'team-presence',
    domain: 'recipes',
    contracts: ['list', 'avatar', 'badge'],
    component: 'Team Presence',
    title: 'Team Presence',
    description: 'Compose avatars, badges, and lists for a team roster.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'avatar.css', 'badge.css', 'list.css'],
    render: () =>
      `<ul class="ui-list" aria-label="Team presence"><li data-ui-part="item">${createAvatar({ label: 'Avery Stone', initials: 'AS', status: 'online' })}<span data-ui-part="title">Avery Stone</span>${createBadge({ label: 'Online', variant: 'success', dot: true })}</li><li data-ui-part="item">${createAvatar({ label: 'Morgan Lee', initials: 'ML', status: 'busy' })}<span data-ui-part="title">Morgan Lee</span>${createBadge({ label: 'Busy', variant: 'warning', dot: true })}</li></ul>`,
  }),
  example({
    id: 'account-form',
    domain: 'recipes',
    contracts: ['field', 'input', 'label', 'button'],
    component: 'Account Form',
    title: 'Account Form',
    description: 'Compose fields, controls, and actions into an account form.',
    definitions: [],
    styles: ['tokens.css', 'theme-atmosphere.css', 'button.css', 'forms.css'],
    render: () => createAccountForm(),
  }),
  example({
    id: 'popover-color-picker',
    domain: 'recipes',
    contracts: ['colorPicker', 'popover'],
    component: 'Popover Color Picker',
    title: 'Popover Color Picker',
    description: 'Compose Color Picker and Popover.',
    definitions: ['ui-color-picker', 'ui-popover'],
    styles: [
      'tokens.css',
      'core/floating.css',
      'core/popover.css',
      'theme-atmosphere.css',
      'popover.css',
      'color-picker.css',
      'color-swatch.css',
    ],
    script: colorPickerPopoverScript,
    render: () =>
      createColorPicker({
        id: 'popover-brand-color',
        label: 'Brand color',
        value: 'oklch(62% 0.18 32)',
        popover: true,
      }),
  }),
] as const satisfies readonly ExampleDefinition[]

export type TimelessExample = (typeof examples)[number]

export function getExample(id: string): TimelessExample | undefined {
  return examples.find((item) => item.id === id)
}

export function renderExample(exampleDefinition: ExampleDefinition): string {
  return exampleDefinition.render(exampleDefinition.defaultArgs)
}
