import type {
  CollectionAlignment,
  FloatingPlacement,
  MenuOrientation,
  OptionFilterMode,
  SelectionGroupOrientation,
  ToolbarOrientation,
} from '@timelessui/components'
import { escapeAttribute, escapeHtml } from './utils.ts'

export type MenuItem = {
  readonly label: string
  readonly disabled?: boolean
  readonly checked?: boolean
  readonly children?: readonly MenuItem[]
  /**
   * A checkable command. `checkbox` stands alone; `radio` clears the other radios in its group, and
   * `aria-checked` on all of them is Timeless's to write from here on.
   */
  readonly checkable?: 'checkbox' | 'radio'
  /** Renders a divider before this item. */
  readonly separatorBefore?: boolean
}

/** A `role="group"` of related items, named by its `group-label`. */
export type MenuGroup = {
  readonly label: string
  readonly items: readonly MenuItem[]
}

export type MenuButtonProps = {
  readonly id: string
  readonly label: string
  readonly items?: readonly MenuItem[]
  readonly groups?: readonly MenuGroup[]
  readonly placement?: FloatingPlacement
}

export type MenuProps = {
  readonly label: string
  readonly items?: readonly MenuItem[]
  readonly groups?: readonly MenuGroup[]
  readonly orientation?: MenuOrientation
  readonly role?: 'menu' | 'menubar'
}

export type ContextMenuProps = {
  readonly id: string
  readonly label: string
  readonly targetLabel: string
  readonly items?: readonly MenuItem[]
  readonly groups?: readonly MenuGroup[]
}

export type ToolbarProps = {
  readonly label: string
  readonly orientation?: ToolbarOrientation
}

/**
 * One option. `value` defaults to the label slugified, and `search` is the short filterable label
 * for an option whose visible content is not its searchable text.
 */
export type OptionItem = {
  readonly label: string
  readonly disabled?: boolean
  readonly selected?: boolean
  readonly search?: string
  readonly value?: string
}

export type OptionGroup = {
  readonly label: string
  readonly options: readonly OptionItem[]
}

/**
 * The anatomy every option collection shares.
 *
 * `groups` and `options` compose: a surface can hold loose options, grouped options, or both. The
 * optional parts are opt-in because each one is markup a consumer has to author and style.
 */
export type CollectionSurfaceProps = {
  readonly empty?: string
  readonly footer?: string
  readonly groups?: readonly OptionGroup[]
  readonly header?: string
  readonly options?: readonly OptionItem[]
  readonly pageSize?: number
  readonly status?: string
}

export type CustomSelectProps = CollectionSurfaceProps & {
  readonly id: string
  readonly label: string
  readonly align?: CollectionAlignment
  readonly clear?: boolean
  readonly filter?: OptionFilterMode
  readonly hiddenInput?: boolean
  readonly multiple?: boolean
  readonly name?: string
  readonly placeholder?: string
  readonly required?: boolean
  readonly searchable?: boolean
  readonly value?: string
}

export type ComboboxProps = CollectionSurfaceProps & {
  readonly id: string
  readonly label: string
  readonly align?: CollectionAlignment
  readonly clear?: boolean
  readonly filter?: OptionFilterMode
  readonly multiple?: boolean
  readonly name?: string
  readonly placeholder?: string
  readonly required?: boolean
  readonly value?: string
}

export type ChoiceGroupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  readonly options: readonly MenuItem[]
  readonly orientation?: SelectionGroupOrientation
  readonly value?: string
  readonly values?: readonly string[]
}

export type ListboxProps = CollectionSurfaceProps & {
  readonly id: string
  readonly label: string
  readonly multiple?: boolean
  readonly name?: string
  readonly required?: boolean
  readonly value?: string
}

function optionalAttribute(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value || value === defaultValue) {
    return ''
  }

  return ` ${name}="${escapeAttribute(value)}"`
}

export function createMenuButton(props: MenuButtonProps): string {
  const placement = optionalAttribute('placement', props.placement, 'bottom')

  return `<ui-menu-button${placement}>
  <button class="ui-button" data-ui-part="trigger" type="button">${escapeHtml(props.label)}</button>
  <ui-menu id="${escapeAttribute(props.id)}" role="menu" popover="auto" aria-label="${escapeAttribute(
    props.label,
  )}">
    ${createMenuContents(props, '    ')}
  </ui-menu>
</ui-menu-button>`
}

export function createMenu(props: MenuProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'vertical')
  const role = props.role ?? 'menu'

  return `<ui-menu${orientation} role="${role}" aria-label="${escapeAttribute(props.label)}">
  ${createMenuContents(props, '  ')}
</ui-menu>`
}

/**
 * A context menu is a Menu surface plus a region to right-click. It is the one component with no
 * markup-only fallback: without JavaScript the browser shows its own menu and this one stays hidden,
 * so nothing in here may be the only way to reach a command.
 */
export function createContextMenu(props: ContextMenuProps): string {
  const id = escapeAttribute(props.id)

  // The target is a named, focusable region so the keyboard route exists. In real markup it is
  // usually something that already has a role and a name — a table row, a gridcell, a treeitem.
  return `<ui-context-menu>
  <div data-ui-part="target" role="group" aria-label="${escapeAttribute(props.targetLabel)}">
    ${escapeHtml(props.targetLabel)}
  </div>
  <ui-menu id="${id}" role="menu" popover="auto" aria-label="${escapeAttribute(props.label)}">
    ${createMenuContents(props, '    ')}
  </ui-menu>
</ui-context-menu>`
}

function createMenuContents(
  props: { readonly items?: readonly MenuItem[]; readonly groups?: readonly MenuGroup[] },
  indent: string,
): string {
  const blocks = (props.items ?? []).map((item) => createMenuItem(item, indent))
  for (const group of props.groups ?? []) {
    if (blocks.length > 0) blocks.push('<hr data-ui-part="separator" role="separator">')
    blocks.push(createMenuGroup(group, indent))
  }
  return blocks.join(`\n${indent}`)
}

function createMenuGroup(group: MenuGroup, indent: string): string {
  return `<div data-ui-part="group">
${indent}  <p data-ui-part="group-label">${escapeHtml(group.label)}</p>
${indent}  ${group.items.map((item) => createMenuItem(item, `${indent}  `)).join(`\n${indent}  `)}
${indent}</div>`
}

export function createToolbar(props: ToolbarProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'horizontal')

  return `<ui-toolbar${orientation} aria-label="${escapeAttribute(props.label)}">
  <button class="ui-button" data-ui-variant="ghost" type="button">Bold</button>
  <button class="ui-button" data-ui-variant="ghost" type="button">Italic</button>
  <button class="ui-button" data-ui-variant="ghost" type="button">Underline</button>
  <button class="ui-button" data-ui-variant="ghost" type="button" disabled>Comment</button>
</ui-toolbar>`
}

export function createCustomSelect(props: CustomSelectProps): string {
  const id = escapeAttribute(props.id)
  const value = props.value ?? ''
  const rich = hasSurfaceExtras(props) || Boolean(props.searchable)
  const surfaceId = rich ? `${id}-surface` : `${id}-listbox`

  return `<ui-select${optionalAttribute('value', value)}${optionalAttribute(
    'name',
    props.name,
  )}${optionalAttribute('align', props.align, 'start')}${optionalAttribute(
    'filter',
    props.filter,
    'contains',
  )}${pageSizeAttribute(props.pageSize)}${flagAttribute('multiple', props.multiple)}${flagAttribute(
    'searchable',
    props.searchable,
  )}${flagAttribute('required', props.required)}>
  <label id="${id}-label">${escapeHtml(props.label)}</label>${
    props.hiddenInput
      ? `\n  <input type="hidden" name="${escapeAttribute(props.name ?? '')}" value="${escapeAttribute(value)}">`
      : ''
  }${props.multiple ? createChipAnatomy() : ''}
  <button class="ui-button" data-ui-part="trigger" type="button" popovertarget="${surfaceId}" aria-labelledby="${id}-label ${id}-value">
    <span data-ui-part="value" id="${id}-value">${escapeHtml(
      selectedOptionLabel(props, value) ?? props.placeholder ?? 'Select',
    )}</span>
  </button>${props.clear ? `\n  <button class="ui-button" data-ui-variant="ghost" data-ui-part="clear" type="button">Clear</button>` : ''}
  ${createCollectionSurface(props, {
    id,
    surfaceId,
    label: props.label,
    rich,
    popover: 'auto',
    search: props.searchable
      ? `<input data-ui-part="search" type="text" autocomplete="off" placeholder="Filter…" aria-label="Filter ${escapeAttribute(props.label)} options">`
      : '',
  })}
</ui-select>`
}

export function createCombobox(props: ComboboxProps): string {
  const id = escapeAttribute(props.id)
  const rich = hasSurfaceExtras(props)
  const surfaceId = rich ? `${id}-surface` : `${id}-listbox`

  return `<ui-combobox${optionalAttribute('value', props.value)}${optionalAttribute(
    'name',
    props.name,
  )}${optionalAttribute('align', props.align, 'start')}${optionalAttribute(
    'filter',
    props.filter,
    'contains',
  )}${pageSizeAttribute(props.pageSize)}${flagAttribute('multiple', props.multiple)}${flagAttribute(
    'required',
    props.required,
  )}>
  <label for="${id}">${escapeHtml(props.label)}</label>${props.multiple ? createChipAnatomy() : ''}
  <input id="${id}" role="combobox" type="text" aria-autocomplete="list"${
    props.placeholder ? ` placeholder="${escapeAttribute(props.placeholder)}"` : ''
  }>${props.clear ? `\n  <button class="ui-button" data-ui-variant="ghost" data-ui-part="clear" type="button">Clear</button>` : ''}
  ${createCollectionSurface(props, {
    id,
    surfaceId,
    label: props.label,
    rich,
    popover: 'manual',
    search: '',
  })}
</ui-combobox>`
}

type SurfaceOptions = {
  readonly id: string
  readonly label: string
  readonly popover: 'auto' | 'manual'
  readonly rich: boolean
  readonly search: string
  readonly surfaceId: string
}

/**
 * The popover and the listbox inside it.
 *
 * They are one element in the simple shape and two whenever the surface also holds a search field, a
 * header, a footer, or a pager: a `role="listbox"` may own only options and groups, so anything else
 * has to be its sibling.
 */
function createCollectionSurface(props: CollectionSurfaceProps, options: SurfaceOptions): string {
  const listbox = `<div id="${options.id}-listbox" data-ui-part="listbox" role="listbox" aria-label="${escapeAttribute(
    options.label,
  )}">
      ${createOptionList(props, 6)}
    </div>`

  if (!options.rich) {
    return `<div id="${options.surfaceId}" data-ui-part="listbox" role="listbox" popover="${options.popover}" aria-label="${escapeAttribute(
      options.label,
    )}">
    ${createOptionList(props, 4)}
  </div>`
  }

  return `<div id="${options.surfaceId}" data-ui-part="surface" popover="${options.popover}">
    ${[
      options.search,
      props.header ? `<div data-ui-part="header">${escapeHtml(props.header)}</div>` : '',
      listbox,
      props.empty === undefined
        ? ''
        : `<p data-ui-part="empty" hidden>${escapeHtml(props.empty)}</p>`,
      props.status === undefined ? '' : `<p data-ui-part="status">${escapeHtml(props.status)}</p>`,
      props.pageSize ? createPager() : '',
      props.footer ? `<div data-ui-part="footer">${props.footer}</div>` : '',
    ]
      .filter(Boolean)
      .join('\n    ')}
  </div>`
}

/**
 * The chips container plus the template Timeless clones into it, one clone per selected value.
 *
 * The template is what keeps chip markup author-owned: every element and class here is yours, and
 * Timeless only fills in the label, the value, and the remove button's accessible name.
 */
function createChipAnatomy(): string {
  return `
  <div data-ui-part="chips"></div>
  <template data-ui-part="chip-template">
    <span data-ui-part="chip">
      <span data-ui-part="chip-label"></span>
      <button data-ui-part="chip-remove" type="button">&times;</button>
    </span>
  </template>`
}

/** Boundary buttons stay focusable and take `aria-disabled`, so the boundary is discoverable. */
function createPager(): string {
  return `<div data-ui-part="pager" hidden>
      <button class="ui-button" data-ui-variant="ghost" data-ui-size="sm" data-ui-part="page-previous" type="button">Previous</button>
      <span data-ui-part="page-status"></span>
      <button class="ui-button" data-ui-variant="ghost" data-ui-size="sm" data-ui-part="page-next" type="button">Next</button>
    </div>`
}

function createOptionList(props: CollectionSurfaceProps, indent: number): string {
  const separator = `\n${' '.repeat(indent)}`
  return [
    ...(props.options ?? []).map(createOption),
    ...(props.groups ?? []).map((group) => createOptionGroup(group, indent)),
  ].join(separator)
}

function createOptionGroup(group: OptionGroup, indent: number): string {
  const groupId = `group-${slug(group.label)}`
  return `<div data-ui-part="group" role="group" aria-labelledby="${groupId}">
${' '.repeat(indent + 2)}<div data-ui-part="group-label" id="${groupId}">${escapeHtml(group.label)}</div>
${' '.repeat(indent + 2)}${group.options.map(createOption).join(`\n${' '.repeat(indent + 2)}`)}
${' '.repeat(indent)}</div>`
}

export function createRadioGroup(props: ChoiceGroupProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'vertical')

  return `<ui-radio-group${orientation} value="${escapeAttribute(props.value ?? '')}" aria-labelledby="${escapeAttribute(
    props.id,
  )}-label">
  <span id="${escapeAttribute(props.id)}-label">${escapeHtml(props.label)}</span>
  ${props.options.map((item) => createRadioChoice(props.name, item, props.value)).join('\n  ')}
</ui-radio-group>`
}

export function createCheckboxGroup(props: ChoiceGroupProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'vertical')
  const values = new Set(props.values ?? [])

  return `<ui-checkbox-group${orientation} aria-labelledby="${escapeAttribute(props.id)}-label">
  <span id="${escapeAttribute(props.id)}-label">${escapeHtml(props.label)}</span>
  ${props.options.map((item) => createCheckboxChoice(props.name, item, values)).join('\n  ')}
</ui-checkbox-group>`
}

export function createListbox(props: ListboxProps): string {
  const id = escapeAttribute(props.id)
  const label = escapeAttribute(props.label)
  const host = `<ui-listbox id="${id}"${flagAttribute('multiple', props.multiple)}${optionalAttribute(
    'value',
    props.value,
  )}${optionalAttribute('name', props.name)}${pageSizeAttribute(props.pageSize)}${flagAttribute(
    'required',
    props.required,
  )}`

  // A `role="listbox"` may own only options and groups, so anything else moves the role inwards.
  if (!hasSurfaceExtras(props)) {
    return `${host} role="listbox" aria-label="${label}">
  ${createOptionList(props, 2)}
</ui-listbox>`
  }

  return `${host}>
  ${[
    `<div data-ui-part="listbox" role="listbox" aria-label="${label}">
    ${createOptionList(props, 4)}
  </div>`,
    props.empty === undefined
      ? ''
      : `<p data-ui-part="empty" hidden>${escapeHtml(props.empty)}</p>`,
    props.status === undefined ? '' : `<p data-ui-part="status">${escapeHtml(props.status)}</p>`,
    props.pageSize ? createPager() : '',
  ]
    .filter(Boolean)
    .join('\n  ')}
</ui-listbox>`
}

function createMenuItem(item: MenuItem, indent = ''): string {
  const disabled = item.disabled ? ' disabled' : ''
  const role = ` role="${menuItemRole(item)}"`
  const checked = item.checkable || item.checked ? ` aria-checked="${item.checked === true}"` : ''
  const separator = item.separatorBefore
    ? `<hr data-ui-part="separator" role="separator">\n${indent}`
    : ''

  if (item.children?.length) {
    const submenuId = `submenu-${item.label.toLocaleLowerCase().replace(/\s+/g, '-')}`

    // `aria-haspopup`, `aria-controls`, and `aria-expanded` are Timeless's to write; the trigger
    // only has to name its submenu, or sit immediately before it.
    return `${separator}<button${role} type="button"${disabled} aria-controls="${escapeAttribute(
      submenuId,
    )}">${escapeHtml(item.label)}</button>
${indent}<ui-menu id="${escapeAttribute(submenuId)}" popover="auto" aria-label="${escapeAttribute(
      item.label,
    )}">
${indent}  ${item.children.map((child) => createMenuItem(child, `${indent}  `)).join(`\n${indent}  `)}
${indent}</ui-menu>`
  }

  return `${separator}<button${role} type="button"${disabled}${checked}>${escapeHtml(item.label)}</button>`
}

function menuItemRole(item: MenuItem): string {
  if (item.checkable === 'radio') return 'menuitemradio'
  if (item.checkable === 'checkbox' || item.checked) return 'menuitemcheckbox'
  return 'menuitem'
}

function createRadioChoice(name: string, item: MenuItem, value: string | undefined): string {
  const choiceValue = itemValue(item)
  const disabled = item.disabled ? ' disabled' : ''
  const checked = value === choiceValue ? ' checked' : ''

  return `<label class="ui-choice">
  <input class="ui-radio" type="radio" name="${escapeAttribute(name)}" value="${escapeAttribute(
    choiceValue,
  )}"${checked}${disabled}>
  <span data-ui-part="body">${escapeHtml(item.label)}</span>
</label>`
}

function createCheckboxChoice(name: string, item: MenuItem, values: ReadonlySet<string>): string {
  const choiceValue = itemValue(item)
  const disabled = item.disabled ? ' disabled' : ''
  const checked = values.has(choiceValue) ? ' checked' : ''

  return `<label class="ui-choice">
  <input class="ui-checkbox" type="checkbox" name="${escapeAttribute(name)}" value="${escapeAttribute(
    choiceValue,
  )}"${checked}${disabled}>
  <span data-ui-part="body">${escapeHtml(item.label)}</span>
</label>`
}

function createOption(item: OptionItem): string {
  const disabled = item.disabled ? ' aria-disabled="true"' : ''
  const selected = item.selected ? ' aria-selected="true"' : ''
  // `data-ui-label` is the filterable label; it never becomes the accessible name.
  const search = item.search ? ` data-ui-label="${escapeAttribute(item.search)}"` : ''

  return `<div data-ui-part="option" role="option" data-ui-value="${escapeAttribute(
    optionValue(item),
  )}"${search}${selected}${disabled}>${escapeHtml(item.label)}</div>`
}

function hasSurfaceExtras(props: CollectionSurfaceProps): boolean {
  return Boolean(
    props.empty !== undefined ||
    props.status !== undefined ||
    props.header ||
    props.footer ||
    props.pageSize,
  )
}

function selectedOptionLabel(props: CollectionSurfaceProps, value: string): string | undefined {
  return allOptions(props).find((item) => optionValue(item) === value)?.label
}

function allOptions(props: CollectionSurfaceProps): readonly OptionItem[] {
  return [...(props.options ?? []), ...(props.groups ?? []).flatMap((group) => group.options)]
}

function optionValue(item: OptionItem): string {
  return item.value ?? slug(item.label)
}

function flagAttribute(name: string, present: boolean | undefined): string {
  return present ? ` ${name}` : ''
}

function pageSizeAttribute(pageSize: number | undefined): string {
  return pageSize ? ` page-size="${pageSize}"` : ''
}

function slug(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, '-')
}

function itemValue(item: MenuItem): string {
  return item.label.toLocaleLowerCase().replace(/\s+/g, '-')
}

export type CommandPaletteProps = {
  readonly id: string
  readonly label: string
  readonly commands: readonly OptionItem[]
  readonly triggerLabel?: string
}

/**
 * A command palette, composed rather than shipped.
 *
 * There is no `ui-command` element and there does not need to be: a palette is a `searchable`
 * Select rendered inline inside a `ui-dialog`. The dialog gives the modal, the focus trap, and
 * Escape; the Select gives the filtering, the keyboard map, and the accessible relationships.
 */
export function createCommandPalette(props: CommandPaletteProps): string {
  const id = escapeAttribute(props.id)

  return `<ui-dialog>
  <button class="ui-button" data-ui-part="trigger" type="button" command="show-modal" commandfor="${id}">${escapeHtml(
    props.triggerLabel ?? 'Open command palette',
  )}</button>
  <dialog id="${id}" aria-label="${escapeAttribute(props.label)}">
    ${createCustomSelect({
      id: `${id}-select`,
      label: props.label,
      name: 'command',
      searchable: true,
      placeholder: 'Run a command…',
      options: props.commands,
      empty: 'No command matches.',
    })}
    <footer>
      <button class="ui-button" data-ui-variant="secondary" data-ui-part="close" type="button" command="close" commandfor="${id}">Close</button>
    </footer>
  </dialog>
</ui-dialog>`
}
