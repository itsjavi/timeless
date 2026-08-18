import { attr, createUIElementClass, element, listen, watch } from '@timelessui/core'
import {
  collectionNavigationTarget,
  resolveCollectionOrientation,
  syncRovingTabIndex,
} from './collection'

export type ToolbarOrientation = 'horizontal' | 'vertical'

export type ToolbarItemLike = {
  focus(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ToolbarHostLike = ToolbarItemLike

export type ToolbarEnhancementParts = {
  readonly host: ToolbarHostLike
  readonly items: readonly ToolbarItemLike[]
}

export type ToolbarEnhancementOptions = {
  readonly orientation: ToolbarOrientation
}

export type ToolbarEnhancementResult =
  | { readonly status: 'enhanced'; readonly activeIndex: number | null }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

const TOOLBAR_ITEM_SELECTOR =
  "[data-ui-part~='item'], button, a[href], input, select, textarea, [tabindex]"

export type UIToolbarElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    orientation: string
  }
}

export function createToolbarElementClass(targetWindow?: Window): UIToolbarElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-toolbar')
  class UIToolbarElement extends UIElementBase {
    @attr accessor orientation = ''

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    private enhance(): void {
      enhanceToolbarParts(
        {
          host: this,
          items: this.items,
        },
        {
          orientation: resolveToolbarOrientation(this.orientation),
        },
      )
    }

    @watch('orientation')
    syncOrientation(): void {
      this.setAttribute('aria-orientation', resolveToolbarOrientation(this.orientation))
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const item = this.closestTarget<HTMLElement>(event, TOOLBAR_ITEM_SELECTOR)
      if (!item || !this.items.includes(item)) return

      const items = this.items
      const currentIndex = items.indexOf(item)
      const targetIndex = collectionNavigationTarget(
        items,
        currentIndex,
        event.key,
        resolveToolbarOrientation(this.orientation),
      )

      if (targetIndex === null) return

      event.preventDefault()
      const resolvedIndex = syncRovingTabIndex(items, targetIndex)
      if (resolvedIndex !== null) {
        items[resolvedIndex]?.focus()
      }
    }

    private get items(): HTMLElement[] {
      return findToolbarItems(this)
    }
  }

  return UIToolbarElement as unknown as UIToolbarElementConstructor
}

export const UIToolbarElement = createToolbarElementClass()
export type UIToolbarElement = InstanceType<typeof UIToolbarElement>

export function enhanceToolbarParts(
  parts: ToolbarEnhancementParts,
  options: ToolbarEnhancementOptions,
): ToolbarEnhancementResult {
  if (parts.items.length === 0) {
    return { status: 'invalid', missing: ['items'] }
  }
  parts.host.setAttribute('role', 'toolbar')
  parts.host.setAttribute('orientation', options.orientation)
  parts.host.setAttribute('aria-orientation', options.orientation)

  const activeIndex = syncRovingTabIndex(parts.items, 0)
  return { status: 'enhanced', activeIndex }
}

export function resolveToolbarOrientation(value: string | null): ToolbarOrientation {
  const orientation = resolveCollectionOrientation(value, 'horizontal')
  return orientation === 'vertical' ? 'vertical' : 'horizontal'
}

export function findToolbarItems(host: Element): HTMLElement[] {
  return Array.from(host.children).filter((child): child is HTMLElement =>
    child.matches(TOOLBAR_ITEM_SELECTOR),
  )
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-toolbar': UIToolbarElement
  }
}
