import { escapeAttribute, escapeHtml } from './utils.ts'

export function createMeter(props: {
  id: string
  label: string
  value: number
  max: number
  low?: number
  high?: number
  optimum?: number
  hint?: string
}): string {
  const hintId = props.hint ? `${props.id}-hint` : ''
  return `<div class="ui-meter-field">
  <label for="${escapeAttribute(props.id)}">${escapeHtml(props.label)}</label>
  <output for="${escapeAttribute(props.id)}">${props.value} of ${props.max}</output>
  <meter id="${escapeAttribute(props.id)}" min="0" max="${props.max}" value="${props.value}"${props.low === undefined ? '' : ` low="${props.low}"`}${props.high === undefined ? '' : ` high="${props.high}"`}${props.optimum === undefined ? '' : ` optimum="${props.optimum}"`}${hintId ? ` aria-describedby="${hintId}"` : ''}>${Math.round((props.value / props.max) * 100)}%</meter>
  ${props.hint ? `<span id="${hintId}" data-ui-part="hint">${escapeHtml(props.hint)}</span>` : ''}
</div>`
}
