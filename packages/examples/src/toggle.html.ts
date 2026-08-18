import { escapeAttribute, escapeHtml } from './utils.ts'

export function createToggle(props: { label: string; pressed?: boolean; value?: string }): string {
  return `<button class="ui-button ui-toggle" type="button"${props.value ? ` value="${escapeAttribute(props.value)}"` : ''} aria-pressed="${String(props.pressed ?? false)}">${escapeHtml(props.label)}</button>`
}

export function createToggleGroup(props: {
  label: string
  selection?: 'single' | 'multiple'
  orientation?: 'horizontal' | 'vertical'
  attached?: boolean
  items: readonly { label: string; value: string; pressed?: boolean; disabled?: boolean }[]
}): string {
  return `<ui-toggle-group selection="${props.selection ?? 'single'}" orientation="${props.orientation ?? 'horizontal'}"${props.attached ? ' attached' : ''} aria-label="${escapeAttribute(props.label)}">
  ${props.items.map((item) => `<button class="ui-button ui-toggle" type="button" value="${escapeAttribute(item.value)}" aria-pressed="${String(item.pressed ?? false)}"${item.disabled ? ' disabled' : ''}>${escapeHtml(item.label)}</button>`).join('\n  ')}
</ui-toggle-group>`
}
