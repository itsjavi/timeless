import {
  attr,
  boolAttr,
  createId,
  createUIElementClass,
  element,
  focusFirst,
  focusReturnTarget,
  listen,
  returnFocus,
  watch,
  type FocusTarget,
} from '@timelessui/core'
import { supportsNativeDialog } from './capabilities'
import {
  closeCommand,
  commandFromEvent,
  commandSource,
  hasAuthoredCommand,
  isOpenedByToggle,
  requestCloseCommand,
  showModalCommand,
  supportsInvokerCommands,
} from './invoker'
import { queryOwnedPart } from './parts'
import { sheetPositions } from './values/sheet'
import type { SheetPosition } from './values/sheet'

export { sheetPositions, type SheetPosition }
export type SheetDismissSource = 'close' | 'escape' | 'outside'
export type SheetEventSource = SheetDismissSource | 'api' | 'trigger'

export type SheetEventDetail = {
  readonly source: SheetEventSource
}

export type SheetElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type SheetTriggerLike = SheetElementLike

export type NativeSheetDialogLike = SheetElementLike & {
  open: boolean
  show?(): void
  showModal?(): void
  close(returnValue?: string): void
}

export type SheetEnhancementParts = {
  readonly host: SheetElementLike
  readonly trigger: SheetTriggerLike | null
  readonly panel: NativeSheetDialogLike | null
}

export type SheetEnhancementOptions = {
  readonly generatedId: string
  readonly modal?: boolean
  readonly position?: SheetPosition
  readonly supportsDialog: boolean
  readonly supportsInvokerCommands: boolean
}

/**
 * Which of the two interchangeable open paths this instance uses. `authored` means the trigger
 * carries `command="show-modal"` and the browser honours it, so the panel opens before any script
 * runs. `listener` is the click fallback.
 *
 * Only a `modal` sheet should author the command, because the platform has no built-in command for
 * the `dialog.show()` a non-modal sheet opens with. A non-modal sheet that authors `show-modal`
 * anyway still reports `authored`, and still opens — modally, which is not what its host asked for.
 * Timeless cannot correct that without leaving two open calls fighting over one trigger.
 */
export type SheetTriggerWiring = 'authored' | 'listener'

export type SheetEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly modal: boolean
      readonly panelId: string
      readonly position: SheetPosition
      readonly triggerWiring: SheetTriggerWiring
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'dialog' }

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const PANEL_SELECTOR = 'dialog'
const CLOSE_SELECTOR = "[data-ui-part~='close'], [formmethod='dialog']"

export type UISheetElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    modal: boolean
    open: boolean
    position: SheetPosition
  }
}

export function createSheetElementClass(targetWindow?: Window): UISheetElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-sheet')
  class UISheetElement extends UIElementBase {
    @attr accessor position: SheetPosition = 'right'
    @boolAttr accessor modal = false
    @boolAttr accessor open = false
    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get panel(): HTMLDialogElement | null {
      return queryOwnedPart(this, PANEL_SELECTOR)
    }

    #closeSource: SheetEventSource = 'api'
    #commandDismiss = false
    #openedByCommand = false
    #returnFocusTarget: FocusTarget | null = null
    #supportsInvokerCommands = false
    #syncingOpen = false

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    protected override disconnected(): void {
      this.#openedByCommand = false
      this.#returnFocusTarget = null
    }

    private enhance(signal: AbortSignal): void {
      this.#supportsInvokerCommands = supportsInvokerCommands(this.ownerDocument.defaultView)
      const result = enhanceSheetParts(
        {
          host: this,
          trigger: this.trigger,
          panel: this.panel,
        },
        {
          generatedId: nextAvailableSheetInstanceId(this.ownerDocument),
          modal: this.modal,
          position: resolveSheetPosition(this.position),
          supportsDialog: supportsNativeDialog(this.ownerDocument.defaultView),
          supportsInvokerCommands: this.#supportsInvokerCommands,
        },
      )

      if (result.status !== 'enhanced' || !this.panel) {
        return
      }

      this.on(this.panel, 'cancel', this.handleCancel, { signal })
      this.on(this.panel, 'close', this.handleClose, { signal })
      this.on(this.panel, 'command', this.handlePanelCommand, { signal })
      this.on(this.panel, 'toggle', this.handlePanelToggle, { signal })
      this.syncOpenState(this.panel.open || this.open)
      if (this.open && !this.panel.open) {
        this.openSheet('api')
      }
    }

    @watch('modal')
    syncModal(): void {
      if (!this.panel) return
      syncSheetModal(this.panel, this.modal)
    }

    @watch('open')
    syncOpen(): void {
      if (this.#syncingOpen) return

      if (this.open) {
        this.openSheet('api')
        return
      }

      this.closeSheet('api')
    }

    @watch('position')
    syncPosition(): void {
      if (!isSheetPosition(this.position)) {
        this.position = 'right'
      }
    }

    @listen('click')
    handleClick(event: Event): void {
      const trigger = closestOwnedElement(this, event.target, TRIGGER_SELECTOR)
      if (trigger === this.trigger) {
        this.handleTriggerClick()
        return
      }

      this.handlePanelClick(event)
    }

    private handleTriggerClick(): void {
      if (!this.trigger || isDisabledControl(this.trigger)) {
        return
      }

      // `show-modal` opens the panel whatever Timeless does, and on a non-modal sheet calling
      // `show()` first would make the platform's `showModal()` throw, so an authored open command
      // always wins the trigger.
      if (this.usesAuthoredCommand(this.trigger, showModalCommand)) {
        return
      }

      this.#returnFocusTarget = returnTargetForTrigger(this.ownerDocument, this.trigger)
      this.openSheet('trigger')
    }

    private handlePanelClick(event: Event): void {
      const panel = this.panel
      if (!panel || !panel.open) {
        return
      }

      if (this.modal && event.target === panel) {
        this.dismissAndClose('outside')
        return
      }

      const closeControl = closestOwnedElement(panel, event.target, CLOSE_SELECTOR)
      if (!closeControl) {
        return
      }

      // The platform closes an authored close control itself, including the button's `value` as
      // the panel's `returnValue`. `handlePanelCommand` keeps the emitted events identical.
      if (this.usesAuthoredCommand(closeControl, closeCommand, requestCloseCommand)) {
        return
      }

      this.dismissAndClose('close', closeValue(closeControl, this.ownerDocument.defaultView))
    }

    private handlePanelCommand = (event: Event): void => {
      const panel = this.panel
      if (!panel || event.target !== panel) return

      const command = commandFromEvent(event)
      if (command === showModalCommand) {
        const source = commandSource(event, this.ownerDocument.defaultView)
        // The platform refuses a `disabled` invoker but not an `aria-disabled` one, which the click
        // path treats as inert. Cancelling keeps the two paths indistinguishable.
        if (source && isDisabledControl(source)) {
          event.preventDefault()
          return
        }

        // `command` fires before the platform opens the panel, so only the focus-return target can
        // be read here — it depends on where focus was at invocation. The rest waits for `toggle`.
        const invoker = source ?? this.trigger
        this.#returnFocusTarget = invoker
          ? returnTargetForTrigger(this.ownerDocument, invoker)
          : null
        this.#openedByCommand = true
        return
      }

      if (command !== closeCommand && command !== requestCloseCommand) return

      // Emitted before the platform closes, which is the order `dismissAndClose` produces on the
      // click path. `request-close` runs the cancel algorithm, so without this flag `handleCancel`
      // would report a button-initiated close as an Escape dismissal.
      this.#commandDismiss = true
      this.#closeSource = 'close'
      this.emitDismiss('close')
    }

    private handlePanelToggle = (event: Event): void => {
      if (!this.#openedByCommand || !isOpenedByToggle(event)) return

      // The click path already did this inside `openSheet`, synchronously and without depending on
      // toggle events. This is the authored path, where no Timeless code ran to open the panel.
      this.#openedByCommand = false
      const panel = this.panel
      if (!panel) return
      this.syncOpenState(true)
      focusInitialSheetTarget(panel)
      this.emit<SheetEventDetail>('ui-open', { source: 'trigger' })
    }

    private handleCancel = (): void => {
      if (this.#commandDismiss) {
        this.#commandDismiss = false
        return
      }

      this.#closeSource = 'escape'
      this.emitDismiss('escape')
    }

    private handleClose = (): void => {
      const source = this.#closeSource
      this.#commandDismiss = false
      this.#openedByCommand = false
      this.syncOpenState(false)
      returnFocus(this.#returnFocusTarget ?? this.trigger)
      this.#returnFocusTarget = null
      this.emit<SheetEventDetail>('ui-close', { source })
      this.#closeSource = 'api'
    }

    private openSheet(source: SheetEventSource): void {
      const panel = this.panel
      if (!panel || !this.trigger) {
        this.syncOpenState(false)
        return
      }

      this.#openedByCommand = false
      if (!panel.open) {
        if (this.modal) {
          panel.showModal?.()
        } else {
          panel.show?.()
        }
      }

      this.syncOpenState(true)
      focusInitialSheetTarget(panel)
      this.emit<SheetEventDetail>('ui-open', { source })
    }

    private closeSheet(source: SheetEventSource, returnValue?: string): void {
      const panel = this.panel
      if (!panel) {
        this.syncOpenState(false)
        return
      }

      this.#closeSource = source
      if (panel.open) {
        panel.close(returnValue)
        return
      }

      this.syncOpenState(false)
    }

    private dismissAndClose(source: SheetDismissSource, returnValue?: string): void {
      this.emitDismiss(source)
      this.closeSheet(source, returnValue)
    }

    private emitDismiss(source: SheetDismissSource): void {
      this.emit<SheetEventDetail>('ui-dismiss', { source })
    }

    private usesAuthoredCommand(control: HTMLElement, ...commands: readonly string[]): boolean {
      return (
        this.#supportsInvokerCommands &&
        hasAuthoredCommand(control, this.panel?.id ?? '', ...commands)
      )
    }

    private syncOpenState(open: boolean): void {
      this.#syncingOpen = true
      try {
        this.open = open
      } finally {
        this.#syncingOpen = false
      }
      syncSheetExpanded(this.trigger, open)
    }
  }

  return UISheetElement as unknown as UISheetElementConstructor
}

export const UISheetElement = createSheetElementClass()
export type UISheetElement = InstanceType<typeof UISheetElement>

export function enhanceSheetParts(
  parts: SheetEnhancementParts,
  options: SheetEnhancementOptions,
): SheetEnhancementResult {
  const missing = invalidSheetParts(parts)

  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  if (!options.supportsDialog) {
    return { status: 'unsupported', feature: 'dialog' }
  }

  const trigger = parts.trigger!
  const panel = parts.panel!
  if (!panel.id) {
    panel.id = options.generatedId
  }

  const modal = options.modal ?? false
  const position = options.position ?? 'right'
  panel.setAttribute('role', 'dialog')
  syncSheetModal(panel, modal)
  // A dialog invoker gets no implicit `aria-expanded` from the platform the way a popover trigger
  // does, so these stay written on both paths.
  trigger.setAttribute('aria-controls', panel.id)
  trigger.setAttribute('aria-haspopup', 'dialog')
  syncSheetExpanded(trigger, panel.open)

  return {
    status: 'enhanced',
    modal,
    panelId: panel.id,
    position,
    triggerWiring:
      options.supportsInvokerCommands && hasAuthoredCommand(trigger, panel.id, showModalCommand)
        ? 'authored'
        : 'listener',
  }
}

export function isSheetPosition(value: string): value is SheetPosition {
  return sheetPositions.includes(value as SheetPosition)
}

export function resolveSheetPosition(value: string | null): SheetPosition {
  return value && isSheetPosition(value) ? value : 'right'
}

export function syncSheetExpanded(trigger: SheetTriggerLike | null, open: boolean): void {
  trigger?.setAttribute('aria-expanded', String(open))
}

export function syncSheetModal(panel: SheetElementLike, modal: boolean): void {
  if (modal) {
    panel.setAttribute('aria-modal', 'true')
    return
  }

  panel.removeAttribute('aria-modal')
}

export function focusInitialSheetTarget(panel: HTMLElement): boolean {
  if (focusFirst(panel)) {
    return true
  }

  if (!panel.hasAttribute('tabindex')) {
    panel.setAttribute('tabindex', '-1')
  }
  panel.focus({ preventScroll: true })
  return true
}

function invalidSheetParts(parts: SheetEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.panel) missing.push('panel')
  return missing
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

function closeValue(
  element: HTMLElement,
  targetWindow: (Window & typeof globalThis) | null,
): string | undefined {
  const HTMLButtonElementConstructor = targetWindow?.HTMLButtonElement
  if (HTMLButtonElementConstructor && element instanceof HTMLButtonElementConstructor) {
    return element.value || undefined
  }

  return undefined
}

function isDisabledControl(control: HTMLElement): boolean {
  return control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true'
}

function returnTargetForTrigger(ownerDocument: Document, trigger: HTMLElement): FocusTarget {
  const activeElement = ownerDocument.activeElement
  if (activeElement === ownerDocument.body || activeElement === ownerDocument.documentElement) {
    return trigger
  }
  return focusReturnTarget(activeElement) ?? trigger
}

function nextAvailableSheetInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-sheet', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-sheet': UISheetElement
  }
}
