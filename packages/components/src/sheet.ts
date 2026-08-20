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
import {
  nameSurfaceFromParts,
  SURFACE_DESCRIPTION_SELECTOR,
  SURFACE_TITLE_SELECTOR,
  type SurfaceLabelLike,
} from './overlay-naming'
import { queryOwnedPart } from './parts'
import { sheetPositions } from './values/sheet'
import type { SheetPosition } from './values/sheet'

export { sheetPositions, type SheetPosition }
export type SheetDismissSource = 'close' | 'escape' | 'outside' | 'swipe'
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
  readonly title?: SurfaceLabelLike | null
  readonly description?: SurfaceLabelLike | null
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
const DRAG_HANDLE_SELECTOR = "[data-ui-part~='drag-handle']"
const DRAG_OFFSET_PROPERTY = '--ui-sheet-drag-offset'
const DRAGGING_STATE = '--dragging'

/**
 * The swipe thresholds.
 *
 * A pure distance rule, deliberately: velocity makes a fast flick dismiss from a shorter drag,
 * which feels better and is far harder to assert. Distance is predictable, and it is the part that
 * has to be right first. `SHEET_DRAG_RATIO` is measured against the panel's own extent along the
 * drag axis, so a narrow sheet and a tall one ask for the same proportion of effort;
 * `SHEET_DRAG_MINIMUM` stops a very small panel from closing on a stray few pixels.
 */
export const SHEET_DRAG_RATIO = 0.4
export const SHEET_DRAG_MINIMUM = 48

export type SheetDragAxis = 'x' | 'y'

export type SheetDragRect = {
  readonly top: number
  readonly left: number
  readonly right: number
  readonly bottom: number
}

export type SheetDragViewport = {
  readonly width: number
  readonly height: number
}

export type SheetScrollableLike = {
  readonly clientHeight: number
  readonly clientWidth: number
  readonly scrollHeight: number
  readonly scrollWidth: number
}

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
    /**
     * Where the gesture that produced the next `click` started.
     *
     * A backdrop dismissal is a click that both began and ended on the panel element itself. Without
     * the first half, any drag inside the panel dismisses it: the browser fires `click` on the
     * nearest common ancestor of the press and the release, which for a drag from the header to the
     * body — or a swipe that ends past the panel edge — is the `<dialog>`.
     */
    #pointerDownTarget: EventTarget | null = null
    #drag: {
      readonly axis: SheetDragAxis
      readonly direction: 1 | -1
      readonly extent: number
      readonly origin: number
      readonly pointerId: number
      progress: number
    } | null = null

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    protected override disconnected(): void {
      this.#openedByCommand = false
      this.#returnFocusTarget = null
    }

    private enhance(signal: AbortSignal): void {
      this.#supportsInvokerCommands = supportsInvokerCommands(this.ownerDocument.defaultView)
      const panel = this.panel
      const result = enhanceSheetParts(
        {
          host: this,
          trigger: this.trigger,
          panel,
          title: panel ? queryOwnedPart<HTMLElement>(panel, SURFACE_TITLE_SELECTOR) : null,
          description: panel
            ? queryOwnedPart<HTMLElement>(panel, SURFACE_DESCRIPTION_SELECTOR)
            : null,
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
      this.on(this.panel, 'pointerdown', this.handlePointerDown, { signal })
      this.on(this.panel, 'pointermove', this.handlePointerMove, { signal })
      this.on(this.panel, 'pointerup', this.handlePointerUp, { signal })
      this.on(this.panel, 'pointercancel', this.handlePointerCancel, { signal })
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

      if (this.modal && event.target === panel && this.#pointerDownTarget === panel) {
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

    /**
     * Swipe-to-dismiss.
     *
     * The gesture is a touch idiom, so a mouse only starts one from the `drag-handle` part — a
     * mouse-down anywhere else in the panel is far more likely to be a text selection. Either way
     * it is an addition: Escape and the close control are untouched, so the sheet stays fully
     * operable without a pointer and with scripting off.
     */
    private handlePointerDown = (event: Event): void => {
      const pointerEvent = asPointerEvent(event, this.ownerDocument.defaultView)
      const panel = this.panel
      if (!pointerEvent || !panel) return
      this.#pointerDownTarget = pointerEvent.target
      if (!panel.open || this.#drag) return
      if (!pointerEvent.isPrimary || pointerEvent.button > 0) return

      const target = pointerEvent.target
      const onHandle = closestOwnedElement(panel, target, DRAG_HANDLE_SELECTOR) !== null
      if (!onHandle && pointerEvent.pointerType === 'mouse') return

      const axis = sheetDragAxis(resolveSheetPosition(this.position))
      if (!onHandle && this.startedInScrollableRegion(panel, target, axis)) return

      const rect = panel.getBoundingClientRect()
      const view = this.ownerDocument.defaultView
      this.#drag = {
        axis,
        direction: sheetDismissDirection(axis, rect, {
          height: view?.innerHeight ?? 0,
          width: view?.innerWidth ?? 0,
        }),
        extent: axis === 'x' ? rect.width : rect.height,
        origin: axis === 'x' ? pointerEvent.clientX : pointerEvent.clientY,
        pointerId: pointerEvent.pointerId,
        progress: 0,
      }
      this.setCustomState(DRAGGING_STATE, true)
      try {
        panel.setPointerCapture(pointerEvent.pointerId)
      } catch {
        // Capture is an optimisation; the listeners are on the panel either way.
      }
    }

    private handlePointerMove = (event: Event): void => {
      const pointerEvent = asPointerEvent(event, this.ownerDocument.defaultView)
      const drag = this.#drag
      const panel = this.panel
      if (!pointerEvent || !drag || !panel || pointerEvent.pointerId !== drag.pointerId) return

      const position = drag.axis === 'x' ? pointerEvent.clientX : pointerEvent.clientY
      drag.progress = sheetDragProgress(position - drag.origin, drag.direction)
      // The one visual value JavaScript writes. The stylesheet decides what a length means here.
      panel.style.setProperty(DRAG_OFFSET_PROPERTY, `${drag.progress * drag.direction}px`)
    }

    private handlePointerUp = (event: Event): void => {
      const pointerEvent = asPointerEvent(event, this.ownerDocument.defaultView)
      const drag = this.#drag
      if (!pointerEvent || !drag || pointerEvent.pointerId !== drag.pointerId) return

      const dismiss = shouldDismissSheetDrag(drag.progress, drag.extent)
      this.endDrag()
      if (dismiss) {
        this.dismissAndClose('swipe')
      }
    }

    private handlePointerCancel = (event: Event): void => {
      const pointerEvent = asPointerEvent(event, this.ownerDocument.defaultView)
      if (pointerEvent && this.#drag && pointerEvent.pointerId !== this.#drag.pointerId) return
      this.endDrag()
    }

    /** Clears the gesture, letting the stylesheet spring the panel back to its edge. */
    private endDrag(): void {
      const drag = this.#drag
      this.#drag = null
      if (!drag) return

      const panel = this.panel
      try {
        panel?.releasePointerCapture(drag.pointerId)
      } catch {
        // Already released, which is the normal case after `pointerup`.
      }
      // The state goes first: the spring-back transition is read from the style the change lands in.
      this.setCustomState(DRAGGING_STATE, false)
      panel?.style.removeProperty(DRAG_OFFSET_PROPERTY)
    }

    private startedInScrollableRegion(
      panel: HTMLElement,
      target: EventTarget | null,
      axis: SheetDragAxis,
    ): boolean {
      const ElementConstructor = this.ownerDocument.defaultView?.Element
      let node =
        ElementConstructor && target instanceof ElementConstructor ? (target as Element) : null
      while (node && node !== panel) {
        if (canScrollInAxis(node, axis) && isScrollableInAxis(node, axis)) return true
        node = node.parentElement
      }
      return false
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
      this.endDrag()
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
  nameSurfaceFromParts(panel, parts, panel.id)
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

/** Which physical axis a sheet in this position is dragged along. */
export function sheetDragAxis(position: SheetPosition): SheetDragAxis {
  return position === 'top' || position === 'bottom' ? 'y' : 'x'
}

/**
 * Which sign of pointer movement closes the sheet, read from where the panel actually sits.
 *
 * A sheet is flush against one viewport edge and closes by moving toward it. Deriving that from the
 * measured rect rather than from `position` is what makes the gesture correct under `dir="rtl"`,
 * where `position="right"` puts the panel against the physical left edge.
 */
export function sheetDismissDirection(
  axis: SheetDragAxis,
  rect: SheetDragRect,
  viewport: SheetDragViewport,
): 1 | -1 {
  const startGap = axis === 'x' ? rect.left : rect.top
  const endGap = axis === 'x' ? viewport.width - rect.right : viewport.height - rect.bottom
  return startGap <= endGap ? -1 : 1
}

/**
 * How far the panel has travelled toward its closing edge.
 *
 * Movement the other way is absorbed rather than applied: dragging a sheet off the edge it is
 * anchored to would open a gap the stylesheet has no way to fill.
 */
export function sheetDragProgress(delta: number, direction: 1 | -1): number {
  return Math.max(0, delta * direction)
}

/** Whether a released drag has gone far enough to dismiss. */
export function shouldDismissSheetDrag(progress: number, extent: number): boolean {
  return progress >= Math.max(SHEET_DRAG_MINIMUM, extent * SHEET_DRAG_RATIO)
}

/**
 * Whether an element can scroll along the drag axis, in which case the gesture belongs to it.
 * A sheet that stole the scroll of its own body would be unusable on touch.
 */
export function canScrollInAxis(element: SheetScrollableLike, axis: SheetDragAxis): boolean {
  return axis === 'x'
    ? element.scrollWidth > element.clientWidth
    : element.scrollHeight > element.clientHeight
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

function asPointerEvent(
  event: Event,
  targetWindow: (Window & typeof globalThis) | null,
): PointerEvent | null {
  const PointerEventConstructor = targetWindow?.PointerEvent
  return PointerEventConstructor && event instanceof PointerEventConstructor ? event : null
}

/** Whether the element's own overflow makes it a scroll container along the axis. */
function isScrollableInAxis(element: Element, axis: SheetDragAxis): boolean {
  const view = element.ownerDocument.defaultView
  if (!view) return false
  const computed = view.getComputedStyle(element)
  const overflow = axis === 'x' ? computed.overflowX : computed.overflowY
  return overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay'
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
