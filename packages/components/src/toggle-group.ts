import { attr, createUIElementClass, element, listen, watch } from '@timelessui/core'
import {
  collectionNavigationTarget,
  isCollectionItemDisabled,
  syncRovingTabIndex,
} from './collection'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'

export const toggleGroupSelections = ['single', 'multiple'] as const
export type ToggleGroupSelection = (typeof toggleGroupSelections)[number]
export type ToggleGroupOrientation = 'horizontal' | 'vertical'
export type ToggleGroupChangeDetail = UITransitionDetail<readonly string[], 'toggle'> & {
  readonly values: readonly string[]
}

export type ToggleButtonLike = {
  focus(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ToggleGroupHostLike = ToggleButtonLike

const TOGGLE_SELECTOR = '.ui-toggle[aria-pressed]'

export function resolveToggleGroupSelection(value: string | null): ToggleGroupSelection {
  return value === 'multiple' ? 'multiple' : 'single'
}

export function resolveToggleGroupOrientation(value: string | null): ToggleGroupOrientation {
  return value === 'vertical' ? 'vertical' : 'horizontal'
}

export function findToggleButtons(host: Element): HTMLElement[] {
  return Array.from(host.children).filter((child): child is HTMLElement =>
    child.matches(TOGGLE_SELECTOR),
  )
}

export function toggleButtonValue(button: ToggleButtonLike): string {
  return button.getAttribute('value') ?? ''
}

export function pressedToggleValues(buttons: readonly ToggleButtonLike[]): string[] {
  return buttons
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map(toggleButtonValue)
}

export function syncToggleGroupSelection(
  buttons: readonly ToggleButtonLike[],
  selection: ToggleGroupSelection,
): number | null {
  let firstPressed: number | null = null

  buttons.forEach((button, index) => {
    const pressed = button.getAttribute('aria-pressed') === 'true'
    if (selection === 'single' && pressed) {
      if (firstPressed === null) firstPressed = index
      else button.setAttribute('aria-pressed', 'false')
    } else if (!pressed) {
      button.setAttribute('aria-pressed', 'false')
    }
  })

  return syncRovingTabIndex(buttons, firstPressed)
}

export function activateToggleButton(
  buttons: readonly ToggleButtonLike[],
  index: number,
  selection: ToggleGroupSelection,
): void {
  const button = buttons[index]
  if (!button || isCollectionItemDisabled(button)) return

  if (selection === 'single') {
    buttons.forEach((item, itemIndex) => {
      item.setAttribute('aria-pressed', itemIndex === index ? 'true' : 'false')
    })
  } else {
    button.setAttribute(
      'aria-pressed',
      button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true',
    )
  }

  syncRovingTabIndex(buttons, index)
}

export type UIToggleGroupElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    readonly value: string
    readonly values: readonly string[]
    orientation: ToggleGroupOrientation
    selection: ToggleGroupSelection
  }
}

export function createToggleGroupElementClass(
  targetWindow?: Window,
): UIToggleGroupElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-toggle-group')
  class UIToggleGroupElement extends UIElementBase {
    @attr accessor orientation: ToggleGroupOrientation = 'horizontal'
    @attr accessor selection: ToggleGroupSelection = 'single'

    get value(): string {
      return this.values[0] ?? ''
    }

    get values(): readonly string[] {
      return pressedToggleValues(this.buttons)
    }

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    @watch('orientation', { immediate: true })
    syncOrientation(): void {
      const orientation = resolveToggleGroupOrientation(this.orientation)
      this.setAttribute('orientation', orientation)
      this.setAttribute('aria-orientation', orientation)
    }

    @watch('selection')
    syncSelection(): void {
      syncToggleGroupSelection(this.buttons, resolveToggleGroupSelection(this.selection))
    }

    @listen('click', { capture: true })
    handleClick(event: Event): void {
      const button = this.closestTarget<HTMLElement>(event, TOGGLE_SELECTOR)
      const buttons = this.buttons
      if (!button || !buttons.includes(button)) return

      const previousValue = this.values
      const index = buttons.indexOf(button)
      const selection = resolveToggleGroupSelection(this.selection)
      const buttonValue = toggleButtonValue(button)
      const nextValues =
        selection === 'single'
          ? [buttonValue]
          : previousValue.includes(buttonValue)
            ? previousValue.filter((value) => value !== buttonValue)
            : [...previousValue, buttonValue]
      const detail: ToggleGroupChangeDetail = {
        originalEvent: event,
        previousValue,
        reason: 'toggle',
        source: transitionSourceFromEvent(event),
        value: nextValues,
        values: nextValues,
      }
      if (!this.emit('ui-before-change', detail, { cancelable: true })) {
        event.preventDefault()
        return
      }
      activateToggleButton(buttons, index, selection)
      this.emit('ui-change', detail)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const button = this.closestTarget<HTMLElement>(event, TOGGLE_SELECTOR)
      const buttons = this.buttons
      if (!button || !buttons.includes(button)) return

      const targetIndex = collectionNavigationTarget(
        buttons,
        buttons.indexOf(button),
        event.key,
        resolveToggleGroupOrientation(this.orientation),
      )
      if (targetIndex === null) return

      event.preventDefault()
      const index = syncRovingTabIndex(buttons, targetIndex)
      if (index !== null) buttons[index]?.focus()
    }

    private enhance(): void {
      this.setAttribute('role', 'toolbar')
      this.syncOrientation()
      syncToggleGroupSelection(this.buttons, resolveToggleGroupSelection(this.selection))
    }

    private get buttons(): HTMLElement[] {
      return findToggleButtons(this)
    }
  }

  return UIToggleGroupElement as unknown as UIToggleGroupElementConstructor
}

export const UIToggleGroupElement = createToggleGroupElementClass()
export type UIToggleGroupElement = InstanceType<typeof UIToggleGroupElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-toggle-group': UIToggleGroupElement
  }
}
