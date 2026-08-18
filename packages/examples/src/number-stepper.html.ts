import { escapeAttribute, escapeHtml } from './utils.ts'

export function createNumberStepper(props: {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  step?: number
}): string {
  return `<ui-number-stepper aria-labelledby="${escapeAttribute(props.id)}-label">
  <label id="${escapeAttribute(props.id)}-label" for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <button type="button" data-ui-part="decrement" aria-label="Decrease ${escapeAttribute(props.label)}">−</button>
  <input id="${escapeAttribute(props.id)}" type="number" value="${props.value}"${props.min === undefined ? '' : ` min="${props.min}"`}${props.max === undefined ? '' : ` max="${props.max}"`}${props.step === undefined ? '' : ` step="${props.step}"`}>
  <button type="button" data-ui-part="increment" aria-label="Increase ${escapeAttribute(props.label)}">+</button>
</ui-number-stepper>`
}
