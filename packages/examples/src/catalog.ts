import type { ComponentName } from '@timelessui/components'
import {
  createCheckboxGroup,
  createCombobox,
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
  createDisclosure,
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
    styles: ['tokens.css', 'separator.css'],
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
    styles: ['tokens.css', 'link.css', 'kbd.css', 'code.css'],
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
    styles: ['tokens.css', 'button.css'],
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
    styles: ['tokens.css', 'button.css', 'toggle.css'],
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
    styles: ['tokens.css', 'button.css', 'toggle.css'],
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
    styles: ['tokens.css', 'avatar.css'],
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
    styles: ['tokens.css', 'button.css', 'badge.css', 'card.css', 'link.css'],
    render: () =>
      createCard({
        title: 'Component contract',
        description: 'Review the public anatomy before publishing.',
        meta: 'Reference',
      }),
  }),
  example({
    id: 'disclosure',
    domain: 'content',
    guidance:
      'Use Disclosure for a single expandable region. Use [Collapsible](/docs/components/collapsible/) when several regions sit together as a stack, such as an FAQ or a settings accordion.',
    group: 'Content',
    contracts: ['disclosure'],
    component: 'Disclosure',
    title: 'Disclosure',
    description: 'Native details and summary with stable styling hooks.',
    definitions: [],
    styles: ['tokens.css', 'disclosure.css'],
    render: () => createDisclosure(),
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
    styles: ['tokens.css', 'button.css', 'group.css'],
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
    styles: ['tokens.css', 'list.css'],
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
    styles: ['tokens.css', 'badge.css', 'table.css'],
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
    styles: ['tokens.css', 'alert.css', 'link.css'],
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
    styles: ['tokens.css', 'badge.css'],
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
    styles: ['tokens.css', 'button.css', 'empty.css'],
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
    styles: ['tokens.css', 'meter.css'],
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
    styles: ['tokens.css', 'progress.css'],
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
    styles: ['tokens.css', 'skeleton.css'],
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
    styles: ['tokens.css', 'spinner.css'],
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
    styles: ['tokens.css', 'toast.css'],
    render: () =>
      createToaster([
        { title: 'Preview ready', description: 'The static example finished building.' },
      ]),
  }),
  example({
    id: 'choice-group',
    domain: 'forms',
    guidance:
      'Choice Group is CSS only: it styles a native `<fieldset>` of checkboxes or radios and needs no JavaScript. Reach for [Checkbox Group](/docs/components/checkbox-group/) or [Radio Group](/docs/components/radio-group/) when you also need coordinated keyboard navigation and change events.',
    group: 'Forms',
    contracts: ['choiceGroup', 'choice', 'checkbox', 'radio'],
    component: 'Choice Group',
    title: 'Choice Group',
    description: 'Style native checkbox and radio fieldsets.',
    definitions: [],
    styles: ['tokens.css', 'forms.css', 'choice-group.css'],
    render: () =>
      createChoiceGroup({
        legend: 'Notifications',
        name: 'notifications',
        type: 'checkbox',
        options: [
          { value: 'product', label: 'Product updates', checked: true },
          { value: 'security', label: 'Security notices', checked: true },
        ],
      }),
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
    styles: ['tokens.css', 'forms.css'],
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
    id: 'file-input',
    domain: 'forms',
    group: 'Forms',
    contracts: ['file', 'field', 'label', 'description'],
    component: 'File Input',
    title: 'File Input',
    description: 'A native file input with consistent field anatomy.',
    definitions: [],
    styles: ['tokens.css', 'forms.css'],
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
    styles: ['tokens.css', 'forms.css'],
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
    styles: ['tokens.css', 'number-stepper.css'],
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
    styles: ['tokens.css', 'range.css'],
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
    styles: ['tokens.css', 'forms.css'],
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
      'Checkbox Group adds keyboard coordination and change events to native checkboxes. If you only need the styling, [Choice Group](/docs/components/choice-group/) does that with no JavaScript.',
    group: 'Forms',
    contracts: ['checkboxGroup'],
    component: 'Checkbox Group',
    title: 'Checkbox Group',
    description: 'Coordinate a group of native checkboxes.',
    definitions: ['ui-checkbox-group'],
    styles: ['tokens.css', 'choice-group.css'],
    render: () =>
      createCheckboxGroup({
        id: 'features',
        name: 'features',
        label: 'Features',
        values: ['documentation'],
        options: [{ label: 'Documentation' }, { label: 'Playground' }],
      }),
  }),
  example({
    id: 'combobox',
    domain: 'navigation',
    group: 'Forms',
    contracts: ['combobox'],
    component: 'Combobox',
    title: 'Combobox',
    description: 'Filter an authored listbox from a native text input.',
    definitions: ['ui-combobox'],
    styles: ['tokens.css', 'combobox.css', 'listbox.css', 'popover.css'],
    render: () => createCombobox({ id: 'component-search', label: 'Component', options }),
  }),
  example({
    id: 'listbox',
    domain: 'navigation',
    group: 'Forms',
    contracts: ['listbox'],
    component: 'Listbox',
    title: 'Listbox',
    description: 'Keyboard selection over authored options.',
    definitions: ['ui-listbox'],
    styles: ['tokens.css', 'listbox.css'],
    render: () => createListbox({ id: 'status-list', label: 'Status', value: 'ready', options }),
  }),
  example({
    id: 'menu',
    domain: 'navigation',
    group: 'Navigation',
    contracts: ['menu'],
    component: 'Menu',
    title: 'Menu',
    description: 'Roving keyboard navigation for commands.',
    definitions: ['ui-menu'],
    styles: ['tokens.css', 'button.css', 'menu.css'],
    render: () =>
      createMenu({
        label: 'Editor commands',
        items: [{ label: 'Duplicate' }, { label: 'Archive' }, { label: 'Delete', disabled: true }],
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
    styles: ['tokens.css', 'button.css', 'menu.css', 'popover.css'],
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
      'Radio Group adds roving focus and change events to native radios. If you only need the styling, [Choice Group](/docs/components/choice-group/) does that with no JavaScript.',
    group: 'Forms',
    contracts: ['radioGroup'],
    component: 'Radio Group',
    title: 'Radio Group',
    description: 'Coordinate a roving native radio group.',
    definitions: ['ui-radio-group'],
    styles: ['tokens.css', 'choice-group.css'],
    render: () =>
      createRadioGroup({
        id: 'theme',
        name: 'theme',
        label: 'Theme',
        value: 'system',
        options: [{ label: 'System' }, { label: 'Light' }, { label: 'Dark' }],
      }),
  }),
  example({
    id: 'select',
    domain: 'navigation',
    guidance:
      'Select replaces the native control with an authored trigger and listbox, which costs JavaScript. If plain text options are enough, [Native Select](/docs/components/native-select/) is the better default.',
    group: 'Forms',
    contracts: ['select'],
    component: 'Select',
    title: 'Select',
    description: 'Enhance authored trigger, value, and listbox anatomy.',
    definitions: ['ui-select'],
    styles: ['tokens.css', 'button.css', 'select.css', 'listbox.css', 'popover.css'],
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
    styles: ['tokens.css', 'button.css', 'toolbar.css'],
    render: () => createToolbar({ label: 'Formatting' }),
  }),
  example({
    id: 'collapsible',
    domain: 'overlays',
    guidance:
      'Use Collapsible for a stack of expandable regions. For one standalone region, [Disclosure](/docs/components/disclosure/) is the same `<details>` element with lighter styling.',
    group: 'Content',
    contracts: ['collapsible'],
    component: 'Collapsible',
    title: 'Collapsible',
    description: 'Style native disclosure groups without replacing details.',
    definitions: [],
    styles: ['tokens.css', 'collapsible.css'],
    render: () =>
      createCollapsible({
        items: [
          {
            title: 'What ships?',
            content: 'CSS, explicit element definitions, and public types.',
            open: true,
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
    styles: ['tokens.css', 'button.css', 'dialog.css'],
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
      'Use Hover Card for a richer preview surface. For a single short label on hover or focus, [Tooltip](/docs/components/tooltip/) is the same element with tighter styling.',
    group: 'Overlays',
    contracts: ['hoverCard'],
    component: 'Hover Card',
    title: 'Hover Card',
    description: 'Open supporting content from pointer or keyboard intent.',
    definitions: ['ui-hover-card'],
    styles: ['tokens.css', 'button.css', 'popover.css'],
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
    styles: ['tokens.css', 'button.css', 'popover.css'],
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
    styles: ['tokens.css', 'button.css', 'sheet.css', 'dialog.css'],
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
    styles: ['tokens.css', 'tabs.css'],
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
      'Tooltip is Hover Card configured as `variant="tooltip"` with `role="tooltip"`: one short, non-interactive label. Use [Hover Card](/docs/components/hover-card/) when the surface holds richer content the user may want to read or click.',
    group: 'Overlays',
    contracts: ['hoverCard'],
    component: 'Tooltip',
    title: 'Tooltip',
    description: 'A concise tooltip built on the hover-card controller.',
    definitions: ['ui-hover-card'],
    styles: ['tokens.css', 'button.css', 'popover.css'],
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
    styles: ['tokens.css', 'color-picker.css'],
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
    styles: ['tokens.css', 'color-swatch.css'],
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
    styles: ['tokens.css', 'color-swatch.css'],
    render: () => createColorPalette({ colors: PALETTE, selected: '#3366cc' }),
  }),
  example({
    id: 'team-presence',
    domain: 'recipes',
    contracts: ['list', 'avatar', 'badge'],
    component: 'Team Presence',
    title: 'Team Presence',
    description: 'Compose avatars, badges, and lists for a team roster.',
    definitions: [],
    styles: ['tokens.css', 'avatar.css', 'badge.css', 'list.css'],
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
    styles: ['tokens.css', 'button.css', 'forms.css'],
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
    styles: ['tokens.css', 'popover.css', 'color-picker.css', 'color-swatch.css'],
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
