import type { FormDensity } from '@timelessui/components'
import { uiAttributeString } from '@timelessui/components/attributes'
import { escapeAttribute, escapeHtml } from './utils.ts'

export type FieldsetProps = {
  legend: string
  children: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  density?: FormDensity
  id?: string
}

export type OtpFieldProps = {
  id: string
  name: string
  label: string
  length: number
  value?: string
  description?: string
  required?: boolean
  disabled?: boolean
  /** Cells after which a decorative separator is drawn, as in `123-456`. */
  groupAfter?: readonly number[]
}

export type RangeFieldPairProps = {
  id: string
  label: string
  name: string
  min: number
  max: number
  from: number
  to: number
  step?: number
  description?: string
  disabled?: boolean
}

function booleanAttribute(name: string, value: boolean | undefined): string {
  return value ? ` ${name}` : ''
}

/**
 * A standalone group of controls. Unlike a choice group it makes no assumption about what is inside
 * it, so the children are authored by the caller.
 */
export function createFieldset(props: FieldsetProps): string {
  const root = uiAttributeString('fieldset', { density: props.density })
  const id = props.id ?? 'fieldset'
  const descriptionId = props.description ? `${id}-description` : undefined
  const errorId = props.error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean)

  return `<fieldset ${root}${booleanAttribute('disabled', props.disabled)}${
    props.invalid ? ' aria-invalid="true"' : ''
  }${describedBy.length > 0 ? ` aria-describedby="${escapeAttribute(describedBy.join(' '))}"` : ''}>
  <legend>${escapeHtml(props.legend)}</legend>
  ${
    props.description
      ? `<p id="${escapeAttribute(descriptionId ?? '')}" data-ui-part="description">${escapeHtml(props.description)}</p>`
      : ''
  }
  ${props.children}
  ${
    props.error
      ? `<p id="${escapeAttribute(errorId ?? '')}" data-ui-part="error">${escapeHtml(props.error)}</p>`
      : ''
  }
</fieldset>`
}

/**
 * The cells are authored, not generated: `autocomplete="one-time-code"` goes on the first cell only,
 * every cell carries `maxlength="1"`, a numeric keyboard hint, and a name saying which position it
 * is. Without JavaScript this is still a usable row of inputs; the joined code submits under the
 * host `name` once `ui-otp-field` registers.
 */
export function createOtpField(props: OtpFieldProps): string {
  const groupAfter = new Set(props.groupAfter ?? [])
  const value = props.value ?? ''
  const descriptionId = props.description ? `${props.id}-description` : undefined
  const cells = Array.from({ length: props.length }, (_, index) => {
    const separator = groupAfter.has(index + 1)
      ? `\n  <span data-ui-part="separator" aria-hidden="true">–</span>`
      : ''
    return `<input class="ui-input" data-ui-part="cell" id="${escapeAttribute(props.id)}-${index + 1}" type="text" inputmode="numeric" maxlength="1" autocapitalize="off" autocorrect="off" spellcheck="false"${
      index === 0 ? ' autocomplete="one-time-code"' : ' autocomplete="off"'
    } aria-label="Digit ${index + 1} of ${props.length}" value="${escapeAttribute(value[index] ?? '')}"${booleanAttribute('disabled', props.disabled)}>${separator}`
  }).join('\n  ')

  return `<div class="ui-field">
  <span class="ui-label" id="${escapeAttribute(props.id)}-label">${escapeHtml(props.label)}</span>
  <ui-otp-field id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" length="${props.length}" aria-labelledby="${escapeAttribute(props.id)}-label"${
    descriptionId ? ` aria-describedby="${escapeAttribute(descriptionId)}"` : ''
  }${booleanAttribute('required', props.required)}${booleanAttribute('disabled', props.disabled)}>
  ${cells}
  </ui-otp-field>
  ${
    props.description
      ? `<p class="ui-description" id="${escapeAttribute(descriptionId ?? '')}">${escapeHtml(props.description)}</p>`
      : ''
  }
</div>`
}

/**
 * Two native range inputs on one track. Each carries its own `name`, so the pair submits and resets
 * with scripting off; `ui-range-field` adds the ordering, the fill, and the readout.
 */
export function createRangeFieldPair(props: RangeFieldPairProps): string {
  const step = typeof props.step === 'number' ? ` step="${props.step}"` : ''
  const descriptionId = props.description ? `${props.id}-description` : undefined
  const bounds = ` min="${props.min}" max="${props.max}"${step}`
  const described = descriptionId ? ` aria-describedby="${escapeAttribute(descriptionId)}"` : ''

  return `<div class="ui-field">
  <span class="ui-label" id="${escapeAttribute(props.id)}-label">${escapeHtml(props.label)}</span>
  <ui-range-field id="${escapeAttribute(props.id)}" aria-labelledby="${escapeAttribute(props.id)}-label">
    <span data-ui-part="track">
      <input data-ui-part="from" type="range" name="${escapeAttribute(props.name)}-from" value="${props.from}"${bounds} aria-label="${escapeAttribute(props.label)}, lower bound"${described}${booleanAttribute('disabled', props.disabled)}>
      <input data-ui-part="to" type="range" name="${escapeAttribute(props.name)}-to" value="${props.to}"${bounds} aria-label="${escapeAttribute(props.label)}, upper bound"${described}${booleanAttribute('disabled', props.disabled)}>
    </span>
    <output data-ui-part="output">${props.from} – ${props.to}</output>
  </ui-range-field>
  ${
    props.description
      ? `<p class="ui-description" id="${escapeAttribute(descriptionId ?? '')}">${escapeHtml(props.description)}</p>`
      : ''
  }
</div>`
}

/**
 * A native form wrapped in `ui-form`, with an authored `error` part per field waiting to be filled.
 * The fields validate natively and the form submits natively; `ui-form` exists only for the messages
 * a server sends back.
 */
export function createServerErrorForm(): string {
  return `<ui-form>
  <form class="ui-form-demo-stack" id="workspace-form" action="#workspace" method="post" data-ui-part="form">
    ${createTextFieldWithError({
      id: 'workspace-slug',
      name: 'slug',
      label: 'Workspace address',
      value: 'acme',
      description: 'Lowercase letters, numbers, and hyphens.',
    })}
    ${createTextFieldWithError({
      id: 'workspace-owner',
      name: 'owner',
      label: 'Owner email',
      type: 'email',
      value: 'ops@acme.test',
    })}
    <div class="ui-form-demo-actions">
      <button class="ui-button" data-ui-variant="primary" id="workspace-save" type="button">Save</button>
      <button class="ui-button" data-ui-variant="secondary" id="workspace-clear" type="button">Clear errors</button>
    </div>
  </form>
</ui-form>`
}

type TextFieldWithErrorProps = {
  id: string
  name: string
  label: string
  value?: string
  type?: string
  description?: string
}

function createTextFieldWithError(props: TextFieldWithErrorProps): string {
  const descriptionId = props.description ? `${props.id}-description` : undefined

  return `<div class="ui-field">
      <label class="ui-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
      <div data-ui-part="control">
        <input class="ui-input" id="${escapeAttribute(props.id)}" name="${escapeAttribute(props.name)}" type="${escapeAttribute(props.type ?? 'text')}" value="${escapeAttribute(props.value ?? '')}"${
          descriptionId ? ` aria-describedby="${escapeAttribute(descriptionId)}"` : ''
        }>
        ${
          props.description
            ? `<p class="ui-description" id="${escapeAttribute(descriptionId ?? '')}">${escapeHtml(props.description)}</p>`
            : ''
        }
        <p class="ui-error" data-ui-part="error"></p>
      </div>
    </div>`
}

/** Stands in for the round trip a real form would make to a server. */
export const serverErrorFormScript = `const form = document.querySelector('ui-form')
if (form) {
  document.getElementById('workspace-save')?.addEventListener('click', () => {
    form.setErrors({
      slug: 'That workspace address is already taken.',
      owner: 'No account exists for this address.',
    })
  })
  document.getElementById('workspace-clear')?.addEventListener('click', () => form.clearErrors())
}`
