import type {
  FloatingPlacement,
  MenuOrientation,
  SelectionGroupOrientation,
  ToolbarOrientation,
} from '@timelessui/components'
import { escapeAttribute, escapeHtml } from './utils.ts'

export type MenuItem = {
  readonly label: string
  readonly disabled?: boolean
  readonly checked?: boolean
  readonly children?: readonly MenuItem[]
}

export type MenuButtonProps = {
  readonly id: string
  readonly label: string
  readonly items: readonly MenuItem[]
  readonly placement?: FloatingPlacement
}

export type MenuProps = {
  readonly label: string
  readonly items: readonly MenuItem[]
  readonly orientation?: MenuOrientation
  readonly role?: 'menu' | 'menubar'
}

export type ToolbarProps = {
  readonly label: string
  readonly orientation?: ToolbarOrientation
}

export type CustomSelectProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  readonly value: string
  readonly options: readonly MenuItem[]
}

export type ComboboxProps = {
  readonly id: string
  readonly label: string
  readonly options: readonly MenuItem[]
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

export type ListboxProps = {
  readonly id: string
  readonly label: string
  readonly multiple?: boolean
  readonly options: readonly MenuItem[]
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
    ${props.items.map(createMenuItem).join('\n    ')}
  </ui-menu>
</ui-menu-button>`
}

export function createMenu(props: MenuProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'vertical')
  const role = props.role ?? 'menu'

  return `<ui-menu${orientation} role="${role}" aria-label="${escapeAttribute(props.label)}">
  ${props.items.map(createMenuItem).join('\n  ')}
</ui-menu>`
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
  return `<ui-select value="${escapeAttribute(props.value)}">
  <label id="${escapeAttribute(props.id)}-label">${escapeHtml(props.label)}</label>
  <input type="hidden" name="${escapeAttribute(props.name)}" value="${escapeAttribute(
    props.value,
  )}">
  <button class="ui-button" data-ui-part="trigger" type="button" aria-labelledby="${escapeAttribute(
    props.id,
  )}-label">
    <span data-ui-part="label">${escapeHtml(selectedLabel(props.options, props.value))}</span>
  </button>
  <div id="${escapeAttribute(props.id)}-listbox" role="listbox" popover="auto">
    ${props.options.map(createOption).join('\n    ')}
  </div>
</ui-select>`
}

export function createCombobox(props: ComboboxProps): string {
  return `<ui-combobox>
  <label for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <input id="${escapeAttribute(props.id)}" role="combobox" type="text" aria-autocomplete="list">
  <div role="listbox" popover="manual">
    ${props.options.map(createOption).join('\n    ')}
  </div>
</ui-combobox>`
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
  const multiple = props.multiple ? ' multiple' : ''

  return `<ui-listbox id="${escapeAttribute(props.id)}"${multiple} value="${escapeAttribute(
    props.value ?? '',
  )}" role="listbox" aria-label="${escapeAttribute(props.label)}">
  ${props.options.map(createOption).join('\n  ')}
</ui-listbox>`
}

function createMenuItem(item: MenuItem): string {
  const disabled = item.disabled ? ' disabled' : ''
  const role = item.checked ? ' role="menuitemcheckbox" aria-checked="true"' : ' role="menuitem"'

  if (item.children?.length) {
    const submenuId = `submenu-${item.label.toLocaleLowerCase().replace(/\s+/g, '-')}`

    return `<button${role} type="button"${disabled} aria-controls="${escapeAttribute(
      submenuId,
    )}" aria-haspopup="menu" aria-expanded="false">${escapeHtml(item.label)}</button>
<ui-menu id="${escapeAttribute(submenuId)}" popover="auto" aria-label="${escapeAttribute(
      item.label,
    )}">
  ${item.children.map(createMenuItem).join('\n  ')}
</ui-menu>`
  }

  return `<button${role} type="button"${disabled}>${escapeHtml(item.label)}</button>`
}

function createRadioChoice(name: string, item: MenuItem, value: string | undefined): string {
  const choiceValue = itemValue(item)
  const disabled = item.disabled ? ' disabled' : ''
  const checked = value === choiceValue ? ' checked' : ''

  return `<label>
  <input type="radio" name="${escapeAttribute(name)}" value="${escapeAttribute(
    choiceValue,
  )}"${checked}${disabled}>
  ${escapeHtml(item.label)}
</label>`
}

function createCheckboxChoice(name: string, item: MenuItem, values: ReadonlySet<string>): string {
  const choiceValue = itemValue(item)
  const disabled = item.disabled ? ' disabled' : ''
  const checked = values.has(choiceValue) ? ' checked' : ''

  return `<label>
  <input type="checkbox" name="${escapeAttribute(name)}" value="${escapeAttribute(
    choiceValue,
  )}"${checked}${disabled}>
  ${escapeHtml(item.label)}
</label>`
}

function createOption(item: MenuItem): string {
  const disabled = item.disabled ? ' aria-disabled="true"' : ''
  const selected = item.checked ? ' aria-selected="true"' : ''
  const value = itemValue(item)

  return `<div role="option" data-ui-value="${escapeAttribute(
    value,
  )}"${selected}${disabled}>${escapeHtml(item.label)}</div>`
}

function selectedLabel(items: readonly MenuItem[], value: string): string {
  return items.find((item) => itemValue(item) === value)?.label ?? 'Select'
}

function itemValue(item: MenuItem): string {
  return item.label.toLocaleLowerCase().replace(/\s+/g, '-')
}
