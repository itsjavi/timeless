import { escapeAttribute, escapeHtml } from './utils.ts'

/**
 * The two label parts are `aria-hidden` and the name comes from `aria-label`, which is the whole point
 * of the split: the visible confirmation changes and the accessible name does not.
 */
function createTrigger(props: { label: string; idle: string; copied: string }): string {
  return `<button class="ui-button" data-ui-variant="secondary" data-ui-part="trigger" type="button" aria-label="${escapeAttribute(props.label)}">
    <span data-ui-part="idle" aria-hidden="true">${escapeHtml(props.idle)}</span>
    <span data-ui-part="copied" aria-hidden="true">${escapeHtml(props.copied)}</span>
  </button>`
}

/** A button that copies a string the author already has. */
export function createCopyButton(props: {
  label: string
  value: string
  copiedMessage: string
  idle?: string
  copied?: string
}): string {
  return `<ui-copy-button value="${escapeAttribute(props.value)}" copied-message="${escapeAttribute(props.copiedMessage)}">
  ${createTrigger({ label: props.label, idle: props.idle ?? 'Copy', copied: props.copied ?? 'Copied' })}
  <span data-ui-part="status" role="status"></span>
</ui-copy-button>`
}

/**
 * A snippet on the page plus a button that copies it, which is the shape that earns `from`: the text
 * exists once, in the markup the reader is looking at, rather than twice.
 */
export function createCopySnippet(props: {
  id: string
  label: string
  snippet: string
  copiedMessage: string
}): string {
  return `<code class="ui-code" id="${escapeAttribute(props.id)}">${escapeHtml(props.snippet)}</code>
<ui-copy-button from="${escapeAttribute(props.id)}" copied-message="${escapeAttribute(props.copiedMessage)}">
  ${createTrigger({ label: props.label, idle: 'Copy', copied: 'Copied' })}
  <span data-ui-part="status" role="status"></span>
</ui-copy-button>`
}
