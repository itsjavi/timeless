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
import { queryOwnedPart } from './parts'

export type DialogKind = 'dialog' | 'alert'

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
}

export type DialogEnhancementOptions = {
  readonly generatedId: string
  readonly supportsDialog: boolean
  readonly kind?: DialogKind
}

export type DialogEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly dialogId: string
      readonly role: 'dialog' | 'alertdialog'
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

    #returnFocusTarget: FocusTarget | null = null

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    protected override disconnected(): void {
      this.#returnFocusTarget = null
    }

    private enhance(signal: AbortSignal): void {
      const trigger = this.trigger
      const dialog = this.dialog
      const result = enhanceDialogParts(
        {
          host: this,
          trigger,
          dialog,
        },
        {
          generatedId: nextAvailableDialogInstanceId(this.ownerDocument),
          supportsDialog: supportsNativeDialog(this.ownerDocument.defaultView),
          kind: resolveDialogKind(this.kind || dialog?.getAttribute('role') || null),
        },
      )

      if (result.status !== 'enhanced' || !trigger || !dialog) {
        return
      }

      this.on(dialog, 'close', this.handleDialogClose, { signal })
      this.on(dialog, 'cancel', this.handleDialogCancel, { signal })
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

      this.#returnFocusTarget = returnTargetForTrigger(this.ownerDocument, this.trigger)
      this.openDialog()
    }

    private handleDialogClose = (): void => {
      syncDialogExpanded(this.trigger, false)
      returnFocus(this.#returnFocusTarget ?? this.trigger)
      this.#returnFocusTarget = null
    }

    private handleDialogCancel = (): void => {
      syncDialogExpanded(this.trigger, false)
    }

    private handleDialogClick(event: Event): void {
      if (!this.dialog) return

      const closeControl = closestOwnedElement(this.dialog, event.target, CLOSE_SELECTOR)
      if (!closeControl || !this.dialog.open) {
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

    private openDialog(): void {
      if (!this.dialog || !this.trigger) return

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
  trigger.setAttribute('aria-controls', dialog.id)
  trigger.setAttribute('aria-haspopup', 'dialog')
  syncDialogExpanded(trigger, dialog.open)

  return {
    status: 'enhanced',
    dialogId: dialog.id,
    role,
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

function supportsNativeDialog(targetWindow: Window | null | undefined): boolean {
  const timelessWindow = targetWindow as (Window & typeof globalThis) | null | undefined
  return Boolean(
    timelessWindow?.HTMLDialogElement && 'showModal' in timelessWindow.HTMLDialogElement.prototype,
  )
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
