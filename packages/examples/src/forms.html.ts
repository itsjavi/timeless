import type {
  ChoiceGroupOrientation,
  FieldLayout,
  FormControlSize,
  FormDensity,
} from '@timelessui/components'
import { escapeAttribute, escapeHtml } from './utils.ts'

type FieldBaseProps = {
  id: string
  label: string
  description?: string
  error?: string
  required?: boolean
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  size?: FormControlSize
  layout?: FieldLayout
  density?: FormDensity
}

type TextFieldProps = FieldBaseProps & {
  name: string
  type?: 'email' | 'password' | 'search' | 'text' | 'url'
  value?: string
  placeholder?: string
}

type TextareaFieldProps = FieldBaseProps & {
  name: string
  placeholder?: string
  value?: string
}

type SelectFieldProps = FieldBaseProps & {
  name: string
  options: ReadonlyArray<readonly [string, string]>
  value?: string
}

type ChoiceOption = {
  value: string
  label: string
  description?: string
  checked?: boolean
  disabled?: boolean
}

type ChoiceGroupProps = {
  legend: string
  name: string
  type: 'checkbox' | 'radio'
  options: readonly ChoiceOption[]
  description?: string
  error?: string
  invalid?: boolean
  orientation?: ChoiceGroupOrientation
  density?: FormDensity
}

type SwitchFieldProps = {
  id: string
  name: string
  label: string
  description?: string
  checked?: boolean
  disabled?: boolean
}

type RangeFieldProps = FieldBaseProps & {
  name: string
  min: number
  max: number
  value: number
  step?: number
}

type FileFieldProps = FieldBaseProps & {
  name: string
  accept?: string
}

function optionalAttribute(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value || value === defaultValue) {
    return ''
  }

  return ` ${name}="${escapeAttribute(value)}"`
}

function booleanAttribute(name: string, value: boolean | undefined): string {
  return value ? ` ${name}` : ''
}

function fieldAttributes(props: FieldBaseProps): string {
  return `${optionalAttribute('data-ui-layout', props.layout, 'stacked')}${optionalAttribute('data-ui-density', props.density, 'normal')}${props.invalid ? ' aria-invalid="true"' : ''}`
}

function descriptionId(props: FieldBaseProps): string | undefined {
  return props.description ? `${props.id}-description` : undefined
}

function errorId(props: FieldBaseProps): string | undefined {
  return props.error ? `${props.id}-error` : undefined
}

function describedBy(props: FieldBaseProps): string {
  const ids = [descriptionId(props), errorId(props)].filter(Boolean)
  return ids.length > 0 ? ` aria-describedby="${escapeAttribute(ids.join(' '))}"` : ''
}

function describedByIds(ids: readonly (string | undefined)[]): string {
  const filtered = ids.filter(Boolean)
  return filtered.length > 0 ? ` aria-describedby="${escapeAttribute(filtered.join(' '))}"` : ''
}

function fieldMessages(props: FieldBaseProps): string {
  const description = props.description
    ? `<p class="ui-description" id="${escapeAttribute(descriptionId(props) ?? '')}">${escapeHtml(props.description)}</p>`
    : ''
  const error = props.error
    ? `<p class="ui-error" id="${escapeAttribute(errorId(props) ?? '')}">${escapeHtml(props.error)}</p>`
    : ''

  return `${description}${error}`
}

export function createTextField(props: TextFieldProps): string {
  const type = props.type ?? 'text'
  const value = props.value ? ` value="${escapeAttribute(props.value)}"` : ''
  const placeholder = props.placeholder
    ? ` placeholder="${escapeAttribute(props.placeholder)}"`
    : ''
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const invalid = props.invalid ? ' aria-invalid="true"' : ''

  return `<div class="ui-field"${fieldAttributes(props)}>
  <label class="ui-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <div data-ui-part="control">
    <input class="ui-input"${size} id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" type="${escapeAttribute(type)}"${placeholder}${value}${booleanAttribute('required', props.required)}${booleanAttribute('disabled', props.disabled)}${booleanAttribute('readonly', props.readonly)}${invalid}${describedBy(props)}>
    ${fieldMessages(props)}
  </div>
</div>`
}

export function createTextareaField(props: TextareaFieldProps): string {
  const placeholder = props.placeholder
    ? ` placeholder="${escapeAttribute(props.placeholder)}"`
    : ''
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const invalid = props.invalid ? ' aria-invalid="true"' : ''

  return `<div class="ui-field"${fieldAttributes(props)}>
  <label class="ui-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <div data-ui-part="control">
    <textarea class="ui-textarea"${size} id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}"${placeholder}${booleanAttribute('required', props.required)}${booleanAttribute('disabled', props.disabled)}${booleanAttribute('readonly', props.readonly)}${invalid}${describedBy(props)}>${escapeHtml(props.value ?? '')}</textarea>
    ${fieldMessages(props)}
  </div>
</div>`
}

export function createSelectField(props: SelectFieldProps): string {
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const invalid = props.invalid ? ' aria-invalid="true"' : ''

  return `<div class="ui-field"${fieldAttributes(props)}>
  <label class="ui-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <div data-ui-part="control">
    <select class="ui-select"${size} id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}"${booleanAttribute('required', props.required)}${booleanAttribute('disabled', props.disabled)}${invalid}${describedBy(props)}>
      ${props.options
        .map(
          ([value, label]) =>
            `<option value="${escapeAttribute(value)}"${value === props.value ? ' selected' : ''}>${escapeHtml(label)}</option>`,
        )
        .join('\n      ')}
    </select>
    ${fieldMessages(props)}
  </div>
</div>`
}

export function createChoiceGroup(props: ChoiceGroupProps): string {
  const orientation = optionalAttribute('data-ui-orientation', props.orientation, 'vertical')
  const density = optionalAttribute('data-ui-density', props.density, 'normal')
  const invalid = props.invalid ? ' aria-invalid="true"' : ''
  const descriptionId = props.description ? `${props.name}-description` : undefined
  const errorId = props.error ? `${props.name}-error` : undefined
  const description = props.description
    ? `<p id="${escapeAttribute(descriptionId ?? '')}" data-ui-part="description">${escapeHtml(props.description)}</p>`
    : ''
  const error = props.error
    ? `<p id="${escapeAttribute(errorId ?? '')}" data-ui-part="error">${escapeHtml(props.error)}</p>`
    : ''

  return `<fieldset class="ui-choice-group"${orientation}${density}${invalid}${describedByIds([descriptionId, errorId])}>
  <legend class="ui-label">${escapeHtml(props.legend)}</legend>
  ${description}
  ${props.options.map((option) => createChoice(props, option)).join('\n  ')}
  ${error}
</fieldset>`
}

function createChoice(group: ChoiceGroupProps, option: ChoiceOption): string {
  const id = `${group.name}-${option.value}`
  const inputClass = group.type === 'checkbox' ? 'ui-checkbox' : 'ui-radio'

  return `<label class="ui-choice" for="${escapeAttribute(id)}">
    <input class="${inputClass}" id="${escapeAttribute(id)}" name="${escapeAttribute(group.name)}" type="${group.type}" value="${escapeAttribute(option.value)}"${booleanAttribute('checked', option.checked)}${booleanAttribute('disabled', option.disabled)}${group.invalid ? ' aria-invalid="true"' : ''}>
    <span data-ui-part="body">
      <span data-ui-part="title">${escapeHtml(option.label)}</span>
      ${option.description ? `<span data-ui-part="description">${escapeHtml(option.description)}</span>` : ''}
    </span>
  </label>`
}

export function createSwitchField(props: SwitchFieldProps): string {
  const descriptionId = props.description ? `${props.id}-description` : undefined

  return `<label class="ui-choice" for="${escapeAttribute(props.id)}">
  <input class="ui-switch" id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" type="checkbox" role="switch"${booleanAttribute('checked', props.checked)}${booleanAttribute('disabled', props.disabled)}${describedByIds([descriptionId])}>
  <span data-ui-part="body">
    <span data-ui-part="title">${escapeHtml(props.label)}</span>
    ${props.description ? `<span id="${escapeAttribute(descriptionId ?? '')}" data-ui-part="description">${escapeHtml(props.description)}</span>` : ''}
  </span>
</label>`
}

export function createRangeField(props: RangeFieldProps): string {
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const invalid = props.invalid ? ' aria-invalid="true"' : ''
  const step = typeof props.step === 'number' ? ` step="${props.step}"` : ''
  const description = props.description
    ? `<span class="ui-description" id="${escapeAttribute(descriptionId(props) ?? '')}" data-ui-part="hint">${escapeHtml(props.description)}</span>`
    : ''

  return `<div class="ui-range"${size}>
  <label for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <output for="${escapeAttribute(props.id)}">${props.value}</output>
  <input id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" type="range" min="${props.min}" max="${props.max}" value="${props.value}"${step}${booleanAttribute('disabled', props.disabled)}${invalid}${describedBy(props)}>
  ${description}
</div>`
}

export function createFileField(props: FileFieldProps): string {
  const accept = props.accept ? ` accept="${escapeAttribute(props.accept)}"` : ''
  const invalid = props.invalid ? ' aria-invalid="true"' : ''

  return `<div class="ui-field"${fieldAttributes(props)}>
  <label class="ui-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <div data-ui-part="control">
    <input class="ui-file" id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" type="file"${accept}${booleanAttribute('required', props.required)}${booleanAttribute('disabled', props.disabled)}${invalid}${describedBy(props)}>
    ${fieldMessages(props)}
  </div>
</div>`
}

export function createAccountForm(): string {
  return `<form class="ui-form-demo-stack" action="#form" method="post">
  ${createTextField({
    id: 'account-email',
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    description: 'Use the address for your workspace account.',
    required: true,
  })}
  ${createTextField({
    id: 'account-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    description: 'Use at least 12 characters.',
    required: true,
  })}
  ${createSelectField({
    id: 'account-role',
    name: 'role',
    label: 'Role',
    value: 'maintainer',
    options: [
      ['reader', 'Reader'],
      ['maintainer', 'Maintainer'],
      ['admin', 'Admin'],
    ],
  })}
  <div class="ui-form-demo-actions">
    <button class="ui-button" type="submit">Create account</button>
    <button class="ui-button" data-ui-variant="secondary" type="reset">Reset</button>
  </div>
</form>`
}
