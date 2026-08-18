import { escapeAttribute, escapeHtml } from './utils.ts'

export function createEmpty(props: {
  id: string
  title: string
  description: string
  density?: 'compact' | 'normal' | 'spacious'
}): string {
  return `<section class="ui-empty"${props.density && props.density !== 'normal' ? ` data-ui-density="${props.density}"` : ''} aria-labelledby="${escapeAttribute(props.id)}-title">
  <div data-ui-part="art" aria-hidden="true">◇</div>
  <h2 id="${escapeAttribute(props.id)}-title">${escapeHtml(props.title)}</h2>
  <p>${escapeHtml(props.description)}</p>
  <div data-ui-part="actions">
    <button class="ui-button" data-ui-variant="secondary" type="button">Create project</button>
  </div>
</section>`
}
