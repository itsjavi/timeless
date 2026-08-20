import { escapeAttribute, escapeHtml } from './utils.ts'

const COPY_GLYPH = `<svg data-ui-part="idle" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="2" />
      <path d="M10.25 3.5A1.75 1.75 0 0 0 8.5 1.75h-4.75A1.75 1.75 0 0 0 2 3.5v6.75" />
    </svg>`

const COPIED_GLYPH = `<svg data-ui-part="copied" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M2.75 8.75 6.25 12.25 13.25 4.25" />
    </svg>`

export type CopyButtonProps = {
  /**
   * The trigger's accessible name. It stays the same before and after the copy, which is why the
   * confirmation is a separate part rather than new button text.
   */
  label: string
  /** What the `status` region announces. Required for `icons`, which has no text to fall back on. */
  copiedMessage: string
  /** A literal string to copy. Give this or `from`, not both. */
  value?: string
  /** The id of an element to copy instead. */
  from?: string
  /** `icons` is the shape that needs `copied-message`: there is no word to read the announcement off. */
  labels?: 'words' | 'icons'
  /**
   * Author the trigger `hidden` and Timeless reveals it once `navigator.clipboard` is there, so a
   * control that cannot work never renders.
   */
  hiddenUntilSupported?: boolean
}

export function createCopyButton(props: CopyButtonProps): string {
  const source =
    props.from === undefined
      ? ` value="${escapeAttribute(props.value ?? '')}"`
      : ` from="${escapeAttribute(props.from)}"`
  const labels =
    props.labels === 'icons'
      ? `${COPY_GLYPH}
    ${COPIED_GLYPH}`
      : `<span data-ui-part="idle" aria-hidden="true">Copy</span>
    <span data-ui-part="copied" aria-hidden="true">Copied</span>`

  return `<ui-copy-button${source} copied-message="${escapeAttribute(props.copiedMessage)}">
  <button class="ui-button" data-ui-variant="secondary" data-ui-part="trigger" type="button" aria-label="${escapeAttribute(props.label)}"${props.hiddenUntilSupported ? ' hidden' : ''}>
    ${labels}
  </button>
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
${createCopyButton({ from: props.id, label: props.label, copiedMessage: props.copiedMessage })}`
}
