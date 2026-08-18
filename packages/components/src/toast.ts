import { attr, boolAttr, createUIElementClass, element, listen, watch } from '@timelessui/core'

export type ToastDismissReason = 'programmatic' | 'timeout' | 'user'
export type ToasterPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'
export type ToasterStack = 'overlap' | 'list'

export type ToastDismissDetail = {
  readonly reason: ToastDismissReason
}

export type ToastInput =
  | string
  | {
      readonly title?: string
      readonly description?: string
      readonly duration?: number
      readonly persistent?: boolean
    }

export type ToastOptions = {
  readonly description?: string
  readonly document?: Document
  readonly duration?: number
  readonly persistent?: boolean
  readonly placement?: ToasterPlacement
  readonly stack?: ToasterStack
  readonly toaster?: Element | null
}

export type ToastApiResult = HTMLElement & {
  dismiss?(reason?: ToastDismissReason): boolean
}

export type ToastDismissTarget = {
  hidden: boolean | 'until-found'
  dispatchEvent(event: Event): boolean
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  setAttribute(name: string, value: string): void
}

const DISMISS_SELECTOR = "[data-ui-part~='close']"
const DEFAULT_TOAST_DURATION = 5000
const DEFAULT_TOASTER_PLACEMENT: ToasterPlacement = 'bottom-end'
const DEFAULT_TOASTER_STACK: ToasterStack = 'overlap'
const dismissedToasts = new WeakSet<ToastDismissTarget>()
const TOAST_CLOSE_GLYPH = `<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
  <path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1"/>
</svg>`

export const toasterPlacements = [
  'top-start',
  'top-center',
  'top-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
] as const satisfies readonly ToasterPlacement[]

export const toasterStacks = ['overlap', 'list'] as const satisfies readonly ToasterStack[]

export type UIToasterElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement
}

export type UIToastElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    dismiss(reason?: ToastDismissReason): boolean
    duration: string
    persistent: boolean
  }
}

export function createToasterElementClass(targetWindow?: Window): UIToasterElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-toaster')
  class UIToasterElement extends UIElementBase {}

  return UIToasterElement as unknown as UIToasterElementConstructor
}

export function createToastElementClass(targetWindow?: Window): UIToastElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-toast')
  class UIToastElement extends UIElementBase {
    @attr accessor duration = ''
    @boolAttr accessor persistent = false

    #dismissTimer: number | null = null

    protected override connected(): void {
      this.setCustomState('--closed', false)
    }

    protected override disconnected(): void {
      this.clearDismissTimer()
    }

    dismiss(reason: ToastDismissReason = 'programmatic'): boolean {
      this.clearDismissTimer()
      const dismissed = dismissToast(this, reason)
      if (dismissed) this.setCustomState('--closed', true)
      return dismissed
    }

    @listen('click')
    handleClick(event: Event): void {
      const closeControl = closestOwnedElement(this, event.target, DISMISS_SELECTOR)
      if (!closeControl) return
      this.dismiss('user')
    }

    @watch(['duration', 'persistent'], { immediate: true })
    restartDismissTimer(): void {
      this.clearDismissTimer()

      const duration = readToastDuration(this.duration)
      if (duration <= 0 || this.persistent) {
        return
      }

      this.#dismissTimer = this.ownerWindow.setTimeout(() => this.dismiss('timeout'), duration)
    }

    private clearDismissTimer(): void {
      if (this.#dismissTimer === null) return
      this.ownerWindow.clearTimeout(this.#dismissTimer)
      this.#dismissTimer = null
    }

    private get ownerWindow(): Window {
      return this.ownerDocument.defaultView ?? window
    }
  }

  return UIToastElement as unknown as UIToastElementConstructor
}

export const UIToasterElement = createToasterElementClass()
export type UIToasterElement = InstanceType<typeof UIToasterElement>

export const UIToastElement = createToastElementClass()
export type UIToastElement = InstanceType<typeof UIToastElement>

export function toast(input: ToastInput, options: ToastOptions = {}): ToastApiResult {
  const ownerDocument = resolveToastDocument(options)
  const toaster = resolveToaster(ownerDocument, options)
  const toastElement = createToastItem(ownerDocument, input, options)

  toaster.append(toastElement)
  return toastElement as ToastApiResult
}

export function dismissToast(
  toast: ToastDismissTarget,
  reason: ToastDismissReason = 'programmatic',
): boolean {
  if (dismissedToasts.has(toast)) {
    return false
  }

  dismissedToasts.add(toast)
  toast.hidden = true
  toast.dispatchEvent(
    new CustomEvent<ToastDismissDetail>('ui-dismiss', {
      bubbles: true,
      composed: true,
      detail: { reason },
    }),
  )
  return true
}

export function readToastDuration(value: string | null): number {
  if (value === null || value.trim() === '') return DEFAULT_TOAST_DURATION
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_TOAST_DURATION
}

export function isToasterPlacement(value: string): value is ToasterPlacement {
  return toasterPlacements.includes(value as ToasterPlacement)
}

export function isToasterStack(value: string): value is ToasterStack {
  return toasterStacks.includes(value as ToasterStack)
}

function createToastItem(
  ownerDocument: Document,
  input: ToastInput,
  options: ToastOptions,
): HTMLElement {
  const normalized = normalizeToastInput(input, options)
  const toastElement = ownerDocument.createElement('ui-toast')
  toastElement.setAttribute('role', 'status')

  if (normalized.duration !== undefined) {
    toastElement.setAttribute('duration', String(normalized.duration))
  }
  if (normalized.persistent) {
    toastElement.setAttribute('persistent', '')
  }

  const content = ownerDocument.createElement('div')
  content.setAttribute('data-ui-part', 'content')

  const title = ownerDocument.createElement('h2')
  title.setAttribute('data-ui-part', 'title')
  title.textContent = normalized.title
  content.append(title)

  if (normalized.description) {
    const description = ownerDocument.createElement('p')
    description.setAttribute('data-ui-part', 'description')
    description.textContent = normalized.description
    content.append(description)
  }

  const close = ownerDocument.createElement('button')
  close.setAttribute('data-ui-part', 'close')
  close.setAttribute('type', 'button')
  close.setAttribute('aria-label', 'Dismiss notification')
  close.innerHTML = TOAST_CLOSE_GLYPH

  toastElement.append(content, close)
  return toastElement
}

function normalizeToastInput(
  input: ToastInput,
  options: ToastOptions,
): {
  readonly description: string
  readonly duration: number | undefined
  readonly persistent: boolean
  readonly title: string
} {
  if (typeof input === 'string') {
    return {
      title: input,
      description: options.description ?? '',
      duration: options.duration,
      persistent: Boolean(options.persistent),
    }
  }

  return {
    title: input.title ?? '',
    description: input.description ?? options.description ?? '',
    duration: input.duration ?? options.duration,
    persistent: Boolean(input.persistent ?? options.persistent),
  }
}

function resolveToaster(ownerDocument: Document, options: ToastOptions): Element {
  if (options.toaster) {
    configureToaster(options.toaster, options, false)
    return options.toaster
  }

  const existing = ownerDocument.querySelector('ui-toaster')
  if (existing) {
    configureToaster(existing, options, false)
    return existing
  }

  const toaster = ownerDocument.createElement('ui-toaster')
  configureToaster(toaster, options, true)
  ownerDocument.body.append(toaster)
  return toaster
}

function configureToaster(toaster: Element, options: ToastOptions, isNewToaster: boolean): void {
  const placement = options.placement ?? (isNewToaster ? DEFAULT_TOASTER_PLACEMENT : undefined)
  const stack = options.stack ?? (isNewToaster ? DEFAULT_TOASTER_STACK : undefined)

  if (placement) {
    toaster.setAttribute('placement', placement)
  }
  if (stack) {
    toaster.setAttribute('stack', stack)
  }
  if (!toaster.hasAttribute('role')) {
    toaster.setAttribute('role', 'region')
  }
  if (!toaster.hasAttribute('aria-label') && !toaster.hasAttribute('aria-labelledby')) {
    toaster.setAttribute('aria-label', 'Notifications')
  }
}

function resolveToastDocument(options: ToastOptions): Document {
  const ownerDocument = options.toaster?.ownerDocument ?? options.document ?? globalDocument()
  if (ownerDocument) {
    return ownerDocument
  }

  throw new Error('toast() requires a browser document or an explicit toaster option.')
}

function globalDocument(): Document | undefined {
  return (globalThis as { document?: Document }).document
}

function closestOwnedElement(
  root: Element,
  target: EventTarget | null,
  selector: string,
): HTMLElement | null {
  const ElementConstructor = root.ownerDocument.defaultView?.Element
  const element = ElementConstructor && target instanceof ElementConstructor ? target : null
  const match = element?.closest<HTMLElement>(selector) ?? null
  return match && root.contains(match) ? match : null
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-toaster': UIToasterElement
    'ui-toast': UIToastElement
  }
}
