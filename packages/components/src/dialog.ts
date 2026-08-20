import {
  attr,
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
import { dialogKinds } from './values/dialog'
import type { DialogKind } from './values/dialog'

export { dialogKinds, type DialogKind }

export type DialogElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type DialogTriggerLike = DialogElementLike

export type NativeDialogLike = DialogElementLike & {
  open: boolean
  showModal?(): void
  close(returnValue?: string): void
}

export type DialogEnhancementParts = {
  readonly host: DialogElementLike
  readonly trigger: DialogTriggerLike | null
  readonly dialog: NativeDialogLike | null
  readonly title?: SurfaceLabelLike | null
  readonly description?: SurfaceLabelLike | null
}

export type DialogEnhancementOptions = {
  readonly generatedId: string
  readonly supportsDialog: boolean
  readonly supportsInvokerCommands: boolean
  readonly kind?: DialogKind
}

/**
 * Which of the two interchangeable open paths this instance uses. `authored` means the trigger
 * carries `command="show-modal"` and the browser honours it, so the dialog opens before any script
 * runs and Timeless leaves the opening to the platform. `listener` is the click fallback.
 */
export type DialogTriggerWiring = 'authored' | 'listener'

export type DialogEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly dialogId: string
      readonly role: 'dialog' | 'alertdialog'
      readonly triggerWiring: DialogTriggerWiring
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'dialog' }

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const DIALOG_SELECTOR = 'dialog'
const CLOSE_SELECTOR = "[data-ui-part~='close'], [formmethod='dialog']"

export type UIDialogElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    kind: DialogKind
  }
}

export function createDialogElementClass(targetWindow?: Window): UIDialogElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-dialog')
  class UIDialogElement extends UIElementBase {
    @attr accessor kind: DialogKind = 'dialog'
    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get dialog(): HTMLDialogElement | null {
      return queryOwnedPart(this, DIALOG_SELECTOR)
    }

    #openedByCommand = false
    #returnFocusTarget: FocusTarget | null = null
    #supportsInvokerCommands = false

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    protected override disconnected(): void {
      this.#openedByCommand = false
      this.#returnFocusTarget = null
    }

    private enhance(signal: AbortSignal): void {
      const trigger = this.trigger
      const dialog = this.dialog
      this.#supportsInvokerCommands = supportsInvokerCommands(this.ownerDocument.defaultView)
      const result = enhanceDialogParts(
        {
          host: this,
          trigger,
          dialog,
          title: dialog ? queryOwnedPart<HTMLElement>(dialog, SURFACE_TITLE_SELECTOR) : null,
          description: dialog
            ? queryOwnedPart<HTMLElement>(dialog, SURFACE_DESCRIPTION_SELECTOR)
            : null,
        },
        {
          generatedId: nextAvailableDialogInstanceId(this.ownerDocument),
          supportsDialog: supportsNativeDialog(this.ownerDocument.defaultView),
          supportsInvokerCommands: this.#supportsInvokerCommands,
          kind: resolveDialogKind(this.kind || dialog?.getAttribute('role') || null),
        },
      )

      if (result.status !== 'enhanced' || !trigger || !dialog) {
        return
      }

      this.on(dialog, 'close', this.handleDialogClose, { signal })
      this.on(dialog, 'cancel', this.handleDialogCancel, { signal })
      this.on(dialog, 'command', this.handleDialogCommand, { signal })
      this.on(dialog, 'toggle', this.handleDialogToggle, { signal })
    }

    @watch('kind', { immediate: true })
    syncKind(): void {
      if (!this.dialog) return
      this.dialog.setAttribute('role', resolveDialogRole(resolveDialogKind(this.kind)))
    }

    @listen('click')
    handleClick(event: Event): void {
      const trigger = closestOwnedElement(this, event.target, TRIGGER_SELECTOR)
      if (trigger === this.trigger) {
        this.handleTriggerClick()
        return
      }

      this.handleDialogClick(event)
    }

    private handleTriggerClick(): void {
      if (!this.trigger || !this.dialog || isDisabledControl(this.trigger)) {
        return
      }

      if (this.usesAuthoredCommand(this.trigger, showModalCommand)) {
        return
      }

      this.#returnFocusTarget = returnTargetForTrigger(this.ownerDocument, this.trigger)
      this.openDialog()
    }

    private handleDialogClose = (): void => {
      this.#openedByCommand = false
      syncDialogExpanded(this.trigger, false)
      returnFocus(this.#returnFocusTarget ?? this.trigger)
      this.#returnFocusTarget = null
    }

    private handleDialogCancel = (): void => {
      syncDialogExpanded(this.trigger, false)
    }

    private handleDialogCommand = (event: Event): void => {
      const dialog = this.dialog
      if (!dialog || event.target !== dialog) return
      if (commandFromEvent(event) !== showModalCommand) return

      const source = commandSource(event, this.ownerDocument.defaultView)
      // The platform refuses a `disabled` invoker but not an `aria-disabled` one, which the click
      // path treats as inert. Cancelling keeps the two paths indistinguishable.
      if (source && isDisabledControl(source)) {
        event.preventDefault()
        return
      }

      // `command` fires before the platform opens the dialog, so only the focus-return target can
      // be read here — it depends on where focus was at invocation. The rest waits for `toggle`.
      const invoker = source ?? this.trigger
      this.#returnFocusTarget = invoker ? returnTargetForTrigger(this.ownerDocument, invoker) : null
      this.#openedByCommand = true
    }

    private handleDialogToggle = (event: Event): void => {
      if (!this.#openedByCommand || !isOpenedByToggle(event)) return

      // The click path already did this inside `openDialog`, synchronously and without depending on
      // toggle events. This is the authored path, where no Timeless code ran to open the dialog.
      this.#openedByCommand = false
      const dialog = this.dialog
      if (!dialog) return
      syncDialogExpanded(this.trigger, true)
      focusInitialDialogTarget(dialog)
    }

    private handleDialogClick(event: Event): void {
      if (!this.dialog) return

      const closeControl = closestOwnedElement(this.dialog, event.target, CLOSE_SELECTOR)
      if (!closeControl || !this.dialog.open) {
        return
      }

      // The platform closes an authored close control itself, including the button's `value` as
      // the dialog's `returnValue`.
      if (this.usesAuthoredCommand(closeControl, closeCommand, requestCloseCommand)) {
        return
      }

      const HTMLButtonElementConstructor = this.ownerDocument.defaultView?.HTMLButtonElement
      const value =
        HTMLButtonElementConstructor &&
        closeControl instanceof HTMLButtonElementConstructor &&
        closeControl.value
          ? closeControl.value
          : undefined
      this.dialog.close(value)
    }

    private usesAuthoredCommand(control: HTMLElement, ...commands: readonly string[]): boolean {
      return (
        this.#supportsInvokerCommands &&
        hasAuthoredCommand(control, this.dialog?.id ?? '', ...commands)
      )
    }

    private openDialog(): void {
      if (!this.dialog || !this.trigger) return

      this.#openedByCommand = false
      if (!this.dialog.open) {
        this.dialog.showModal()
      }

      syncDialogExpanded(this.trigger, true)
      focusInitialDialogTarget(this.dialog)
    }
  }

  return UIDialogElement as unknown as UIDialogElementConstructor
}

export const UIDialogElement = createDialogElementClass()
export type UIDialogElement = InstanceType<typeof UIDialogElement>

export function enhanceDialogParts(
  parts: DialogEnhancementParts,
  options: DialogEnhancementOptions,
): DialogEnhancementResult {
  const missing = invalidDialogParts(parts)

  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  if (!options.supportsDialog) {
    return { status: 'unsupported', feature: 'dialog' }
  }

  const trigger = parts.trigger!
  const dialog = parts.dialog!
  if (!dialog.id) {
    dialog.id = options.generatedId
  }

  const role = resolveDialogRole(options.kind ?? resolveDialogKind(dialog.getAttribute('role')))
  dialog.setAttribute('role', role)
  dialog.setAttribute('aria-modal', 'true')
  nameSurfaceFromParts(dialog, parts, dialog.id)
  // A dialog invoker gets no implicit `aria-expanded` from the platform the way a popover trigger
  // does, so these stay written on both paths.
  trigger.setAttribute('aria-controls', dialog.id)
  trigger.setAttribute('aria-haspopup', 'dialog')
  syncDialogExpanded(trigger, dialog.open)

  return {
    status: 'enhanced',
    dialogId: dialog.id,
    role,
    triggerWiring:
      options.supportsInvokerCommands && hasAuthoredCommand(trigger, dialog.id, showModalCommand)
        ? 'authored'
        : 'listener',
  }
}

export function resolveDialogKind(value: string | null): DialogKind {
  return value === 'alert' || value === 'alertdialog' ? 'alert' : 'dialog'
}

export function resolveDialogRole(kind: DialogKind): 'dialog' | 'alertdialog' {
  return kind === 'alert' ? 'alertdialog' : 'dialog'
}

export function syncDialogExpanded(trigger: DialogTriggerLike | null, open: boolean): void {
  trigger?.setAttribute('aria-expanded', String(open))
}

export function focusInitialDialogTarget(dialog: HTMLElement): boolean {
  if (focusFirst(dialog)) {
    return true
  }

  if (!dialog.hasAttribute('tabindex')) {
    dialog.setAttribute('tabindex', '-1')
  }
  dialog.focus({ preventScroll: true })
  return true
}

function invalidDialogParts(parts: DialogEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.dialog) missing.push('dialog')
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

function nextAvailableDialogInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-dialog', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-dialog': UIDialogElement
  }
}
