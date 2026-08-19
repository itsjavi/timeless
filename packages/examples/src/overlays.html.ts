import type {
  FloatingPlacement,
  SheetPosition,
  TabsActivation,
  TabsOrientation,
  ToasterPlacement,
  ToasterStack,
} from '@timelessui/components'
import { escapeAttribute, escapeHtml, hiddenUnless } from './utils.ts'

export type TabItem = {
  readonly id: string
  readonly label: string
  readonly content: string
  readonly disabled?: boolean
}

export type TabsProps = {
  readonly id: string
  readonly label: string
  readonly items: readonly TabItem[]
  readonly orientation?: TabsOrientation
  readonly activation?: TabsActivation
  readonly value?: string
}

export type CollapsibleItem = {
  readonly title: string
  readonly content: string
  readonly open?: boolean
}

export type CollapsibleProps = {
  readonly items: readonly CollapsibleItem[]
  readonly density?: 'compact' | 'normal'
}

export type DialogProps = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly body: string
  readonly triggerLabel?: string
  readonly kind?: 'dialog' | 'alert'
}

export type SheetProps = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly body: string
  readonly triggerLabel?: string
  readonly modal?: boolean
  readonly open?: boolean
  readonly position?: SheetPosition
}

export type PopoverProps = {
  readonly id: string
  readonly placement?: FloatingPlacement
  readonly triggerLabel: string
  readonly title: string
  readonly description: string
}

export type HoverCardProps = {
  readonly id: string
  readonly placement?: FloatingPlacement
  readonly triggerLabel: string
  readonly title: string
  readonly description: string
  readonly openDelay?: number
  readonly closeDelay?: number
}

export type TooltipProps = {
  readonly id: string
  readonly placement?: FloatingPlacement
  readonly triggerLabel: string
  readonly description: string
}

export type ToastProps = {
  readonly title: string
  readonly description: string
  readonly duration?: number
  readonly persistent?: boolean
}

const closeGlyph = `<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1"/>
    </svg>`

function optionalAttribute(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value || value === defaultValue) {
    return ''
  }

  return ` ${name}="${escapeAttribute(value)}"`
}

export function createTabs(props: TabsProps): string {
  const orientation = optionalAttribute('orientation', props.orientation, 'horizontal')
  const activation = optionalAttribute('activation', props.activation, 'automatic')
  const value = selectedTabValue(props)
  const valueAttribute = value ? ` value="${escapeAttribute(value)}"` : ''

  return `<ui-tabs id="${escapeAttribute(props.id)}"${orientation}${activation}${valueAttribute}>
  <div role="tablist" aria-label="${escapeAttribute(
    props.label,
  )}" aria-orientation="${escapeAttribute(props.orientation ?? 'horizontal')}">
    ${props.items
      .map((item) => {
        const selected = item.id === value
        return `<button id="${escapeAttribute(props.id)}-${escapeAttribute(
          item.id,
        )}-tab" value="${escapeAttribute(item.id)}" role="tab" aria-controls="${escapeAttribute(
          props.id,
        )}-${escapeAttribute(item.id)}-panel" aria-selected="${String(selected)}" tabindex="${
          selected ? '0' : '-1'
        }" type="button"${item.disabled ? ' disabled' : ''}>${escapeHtml(item.label)}</button>`
      })
      .join('\n    ')}
  </div>
  ${props.items
    .map((item) => {
      const selected = item.id === value
      return `<section id="${escapeAttribute(props.id)}-${escapeAttribute(
        item.id,
      )}-panel" role="tabpanel" aria-labelledby="${escapeAttribute(
        props.id,
      )}-${escapeAttribute(item.id)}-tab" tabindex="0"${hiddenUnless(selected)}>
    <p>${escapeHtml(item.content)}</p>
  </section>`
    })
    .join('\n  ')}
</ui-tabs>`
}

export function createStaticTabs(props: TabsProps): string {
  const orientation = props.orientation ?? 'horizontal'
  const value = selectedTabValue(props)

  return `<ui-tabs id="${escapeAttribute(props.id)}"${optionalAttribute(
    'orientation',
    props.orientation,
    'horizontal',
  )} value="${escapeAttribute(value)}">
  <div role="tablist" aria-label="${escapeAttribute(
    props.label,
  )}" aria-orientation="${escapeAttribute(orientation)}">
    ${props.items
      .map((item) => {
        const selected = item.id === value
        return `<button id="${escapeAttribute(props.id)}-${escapeAttribute(
          item.id,
        )}-tab" value="${escapeAttribute(item.id)}" role="tab" aria-controls="${escapeAttribute(
          props.id,
        )}-${escapeAttribute(item.id)}-panel" aria-selected="${String(selected)}" tabindex="${
          selected ? '0' : '-1'
        }" type="button"${item.disabled ? ' disabled' : ''}>${escapeHtml(item.label)}</button>`
      })
      .join('\n    ')}
  </div>
  ${props.items
    .map((item) => {
      const selected = item.id === value
      return `<section id="${escapeAttribute(props.id)}-${escapeAttribute(
        item.id,
      )}-panel" role="tabpanel" aria-labelledby="${escapeAttribute(
        props.id,
      )}-${escapeAttribute(item.id)}-tab" tabindex="0"${hiddenUnless(selected)}>
    <p>${escapeHtml(item.content)}</p>
  </section>`
    })
    .join('\n  ')}
</ui-tabs>`
}

function selectedTabValue(props: TabsProps): string {
  const requested = props.value
    ? props.items.find((item) => item.id === props.value && !item.disabled)
    : undefined
  return requested?.id ?? props.items.find((item) => !item.disabled)?.id ?? props.items[0]?.id ?? ''
}

export function createCollapsible(props: CollapsibleProps): string {
  const density = optionalAttribute('data-ui-density', props.density, 'normal')

  return `<div>
  ${props.items
    .map(
      (item) => `<details class="ui-collapsible"${density}${item.open ? ' open' : ''}>
    <summary>${escapeHtml(item.title)}</summary>
    <div>
      <p>${escapeHtml(item.content)}</p>
    </div>
  </details>`,
    )
    .join('\n  ')}
</div>`
}

/**
 * `command` and `commandfor` are the author's, not Timeless's. They make the trigger and the close
 * buttons work before the bundle runs, and the platform copies the confirm button's `value` into
 * `dialog.returnValue`. Where the browser lacks them the component's click listener does the same
 * work instead, so this markup is correct either way.
 */
export function createDialog(props: DialogProps): string {
  const kind = optionalAttribute('kind', props.kind, 'dialog')
  const titleId = `${props.id}-title`
  const descriptionId = `${props.id}-description`
  const invokes = `commandfor="${escapeAttribute(props.id)}"`

  return `<ui-dialog${kind}>
  <button class="ui-button" data-ui-part="trigger" type="button" command="show-modal" ${invokes}>${escapeHtml(
    props.triggerLabel ?? 'Open dialog',
  )}</button>
  <dialog id="${escapeAttribute(props.id)}" aria-labelledby="${escapeAttribute(titleId)}" aria-describedby="${escapeAttribute(descriptionId)}">
    <header>
      <h2 id="${escapeAttribute(titleId)}">${escapeHtml(props.title)}</h2>
      <p id="${escapeAttribute(descriptionId)}">${escapeHtml(props.description)}</p>
    </header>
    <section>
      <p>${escapeHtml(props.body)}</p>
    </section>
    <footer>
      <button class="ui-button" data-ui-variant="secondary" data-ui-part="close" type="button" command="close" ${invokes} value="cancel">Cancel</button>
      <button class="ui-button" data-ui-part="close" type="button" command="close" ${invokes} value="confirm">Confirm</button>
    </footer>
  </dialog>
</ui-dialog>`
}

/**
 * The close buttons invoke the panel on every sheet, but only a `modal` sheet gets `show-modal` on
 * its trigger. `show-modal` calls `showModal()` on the target whatever `ui-sheet` intended, so
 * emitting it unconditionally would open a non-modal sheet modally. There is no built-in command
 * for `dialog.show()`, which is why a non-modal trigger stays on the click listener.
 */
export function createSheet(props: SheetProps): string {
  const position = optionalAttribute('position', props.position, 'right')
  const modal = props.modal ? ' modal' : ''
  const open = props.open ? ' open' : ''
  const titleId = `${props.id}-title`
  const descriptionId = `${props.id}-description`
  const invokes = `commandfor="${escapeAttribute(props.id)}"`
  const opens = props.modal ? ` command="show-modal" ${invokes}` : ''

  return `<ui-sheet${position}${modal}${open}>
  <button class="ui-button" data-ui-part="trigger" type="button"${opens}>${escapeHtml(
    props.triggerLabel ?? 'Open sheet',
  )}</button>
  <dialog id="${escapeAttribute(props.id)}" aria-labelledby="${escapeAttribute(titleId)}" aria-describedby="${escapeAttribute(descriptionId)}">
    <header>
      <h2 id="${escapeAttribute(titleId)}">${escapeHtml(props.title)}</h2>
      <button class="ui-button" data-ui-variant="ghost" data-ui-size="sm" data-ui-part="close" type="button" aria-label="Close sheet" command="close" ${invokes}>
        ${closeGlyph}
      </button>
      <p id="${escapeAttribute(descriptionId)}">${escapeHtml(props.description)}</p>
    </header>
    <section>
      <p>${escapeHtml(props.body)}</p>
    </section>
    <footer>
      <button class="ui-button" data-ui-variant="secondary" data-ui-part="close" type="button" command="close" ${invokes} value="cancel">Cancel</button>
      <button class="ui-button" data-ui-part="close" type="button" command="close" ${invokes} value="done">Done</button>
    </footer>
  </dialog>
</ui-sheet>`
}

export function createPopover(props: PopoverProps): string {
  const placement = optionalAttribute('placement', props.placement, 'bottom')
  const titleId = `${props.id}-title`
  const descriptionId = `${props.id}-description`

  return `<ui-popover${placement}>
  <button class="ui-button" data-ui-part="trigger" type="button" popovertarget="${escapeAttribute(
    props.id,
  )}" aria-controls="${escapeAttribute(props.id)}" aria-expanded="false" aria-haspopup="dialog">${escapeHtml(
    props.triggerLabel,
  )}</button>
  <div id="${escapeAttribute(props.id)}" popover="auto" role="dialog" aria-labelledby="${escapeAttribute(titleId)}" aria-describedby="${escapeAttribute(descriptionId)}">
    <h2 id="${escapeAttribute(titleId)}">${escapeHtml(props.title)}</h2>
    <p id="${escapeAttribute(descriptionId)}">${escapeHtml(props.description)}</p>
  </div>
</ui-popover>`
}

export function createHoverCard(props: HoverCardProps): string {
  const placement = optionalAttribute('placement', props.placement, 'bottom')
  const titleId = `${props.id}-title`
  const descriptionId = `${props.id}-description`
  const openDelay =
    props.openDelay === undefined ? '' : ` open-delay="${escapeAttribute(String(props.openDelay))}"`
  const closeDelay =
    props.closeDelay === undefined
      ? ''
      : ` close-delay="${escapeAttribute(String(props.closeDelay))}"`

  return `<ui-hover-card${placement}${openDelay}${closeDelay}>
  <button class="ui-button" data-ui-variant="secondary" data-ui-part="trigger" type="button" aria-controls="${escapeAttribute(
    props.id,
  )}" aria-expanded="false">${escapeHtml(props.triggerLabel)}</button>
  <div id="${escapeAttribute(props.id)}" popover="manual" role="group" aria-labelledby="${escapeAttribute(titleId)}" aria-describedby="${escapeAttribute(descriptionId)}">
    <h2 id="${escapeAttribute(titleId)}">${escapeHtml(props.title)}</h2>
    <p id="${escapeAttribute(descriptionId)}">${escapeHtml(props.description)}</p>
  </div>
</ui-hover-card>`
}

export function createTooltip(props: TooltipProps): string {
  const placement = optionalAttribute('placement', props.placement, 'bottom')
  const anchorId = `${props.id}-anchor`

  return `<button id="${escapeAttribute(
    anchorId,
  )}" class="ui-button" data-ui-variant="secondary" data-ui-size="sm" type="button" aria-describedby="${escapeAttribute(
    props.id,
  )}" aria-expanded="false">${escapeHtml(props.triggerLabel)}</button>
<ui-hover-card id="${escapeAttribute(
    props.id,
  )}" anchor="${escapeAttribute(anchorId)}" variant="tooltip"${placement} open-delay="0" close-delay="80" popover="manual" role="tooltip">
  <p>${escapeHtml(props.description)}</p>
</ui-hover-card>`
}

export function createToaster(
  toasts: readonly ToastProps[],
  options: { readonly placement?: ToasterPlacement; readonly stack?: ToasterStack } = {},
): string {
  return `<ui-toaster role="region" aria-label="Notifications" placement="${escapeAttribute(options.placement ?? 'bottom-end')}" stack="${escapeAttribute(
    options.stack ?? 'overlap',
  )}">
  ${toasts
    .map((toast) => {
      const duration =
        toast.duration === undefined ? '' : ` duration="${escapeAttribute(String(toast.duration))}"`
      const persistent = toast.persistent ? ' persistent' : ''

      return `<ui-toast${duration}${persistent} role="status">
    <div data-ui-part="content">
      <h2 data-ui-part="title">${escapeHtml(toast.title)}</h2>
      <p data-ui-part="description">${escapeHtml(toast.description)}</p>
    </div>
    <button data-ui-part="close" type="button" aria-label="Dismiss notification">
      ${closeGlyph}
    </button>
  </ui-toast>`
    })
    .join('\n  ')}
</ui-toaster>`
}
