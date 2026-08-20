import { describe, expect, it } from 'vitest'
import { showModalCommand } from './invoker'
import {
  canScrollInAxis,
  enhanceSheetParts,
  resolveSheetPosition,
  sheetDismissDirection,
  sheetDragAxis,
  sheetDragProgress,
  shouldDismissSheetDrag,
  syncSheetModal,
  type NativeSheetDialogLike,
} from './sheet'

class FakeSheetElement {
  id = ''
  open = false
  readonly attributes = new Map<string, string>()

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    if (name === 'id') return this.id.length > 0
    return this.attributes.has(name)
  }

  removeAttribute(name: string): void {
    if (name === 'id') {
      this.id = ''
      return
    }
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value
    }
    this.attributes.set(name, value)
  }

  show(): void {
    this.open = true
  }

  showModal(): void {
    this.open = true
  }

  close(): void {
    this.open = false
  }
}

describe('enhanceSheetParts', () => {
  it('links trigger and native dialog semantics for modal sheets', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()

    const result = enhanceSheetParts(
      { host, trigger, panel },
      {
        generatedId: 'ui-sheet-1',
        modal: true,
        position: 'left',
        supportsDialog: true,
        supportsInvokerCommands: true,
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      modal: true,
      panelId: 'ui-sheet-1',
      position: 'left',
      triggerWiring: 'listener',
    })
    expect(panel.id).toBe('ui-sheet-1')
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe('ui-sheet-1')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps non-modal sheets out of aria-modal', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    panel.open = true

    const result = enhanceSheetParts(
      { host, trigger, panel },
      {
        generatedId: 'ui-sheet-2',
        modal: false,
        position: 'right',
        supportsDialog: true,
        supportsInvokerCommands: true,
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      modal: false,
      panelId: 'ui-sheet-2',
      position: 'right',
      triggerWiring: 'listener',
    })
    expect(panel.getAttribute('aria-modal')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('reports the authored trigger path when the markup invokes a modal panel', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    panel.id = 'release-sheet'
    trigger.setAttribute('command', showModalCommand)
    trigger.setAttribute('commandfor', 'release-sheet')

    expect(
      enhanceSheetParts(
        { host, trigger, panel },
        {
          generatedId: 'ui-sheet-5',
          modal: true,
          position: 'right',
          supportsDialog: true,
          supportsInvokerCommands: true,
        },
      ),
    ).toMatchObject({ status: 'enhanced', panelId: 'release-sheet', triggerWiring: 'authored' })
  })

  it('falls back to the click path when the browser lacks invoker commands', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    panel.id = 'release-sheet'
    trigger.setAttribute('command', showModalCommand)
    trigger.setAttribute('commandfor', 'release-sheet')

    expect(
      enhanceSheetParts(
        { host, trigger, panel },
        {
          generatedId: 'ui-sheet-6',
          modal: true,
          position: 'right',
          supportsDialog: true,
          supportsInvokerCommands: false,
        },
      ),
    ).toMatchObject({ status: 'enhanced', triggerWiring: 'listener' })
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeSheetElement()

    expect(
      enhanceSheetParts(
        { host, trigger: null, panel: null },
        { generatedId: 'ui-sheet-3', supportsDialog: true, supportsInvokerCommands: true },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'panel'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()

    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    expect(
      enhanceSheetParts(
        { host, trigger, panel },
        { generatedId: 'ui-sheet-4', supportsDialog: false, supportsInvokerCommands: true },
      ),
    ).toEqual({ status: 'unsupported', feature: 'dialog' })
    expect(host.getAttribute('data-ui-unsupported')).toBeNull()
  })
})

describe('sheet helpers', () => {
  it('normalizes sheet positions', () => {
    expect(resolveSheetPosition('top')).toBe('top')
    expect(resolveSheetPosition('bottom')).toBe('bottom')
    expect(resolveSheetPosition('center')).toBe('right')
    expect(resolveSheetPosition(null)).toBe('right')
  })

  it('syncs modal semantics', () => {
    const panel = new FakeSheetElement() as NativeSheetDialogLike

    syncSheetModal(panel, true)
    expect(panel.getAttribute('aria-modal')).toBe('true')

    syncSheetModal(panel, false)
    expect(panel.getAttribute('aria-modal')).toBeNull()
  })
})

describe('sheet swipe geometry', () => {
  const viewport = { width: 1024, height: 768 }

  it('drags along the axis the position anchors to', () => {
    expect(sheetDragAxis('right')).toBe('x')
    expect(sheetDragAxis('left')).toBe('x')
    expect(sheetDragAxis('top')).toBe('y')
    expect(sheetDragAxis('bottom')).toBe('y')
  })

  it('closes toward whichever edge the panel actually sits against', () => {
    const right = { top: 0, left: 576, right: 1024, bottom: 768 }
    const left = { top: 0, left: 0, right: 448, bottom: 768 }
    const top = { top: 0, left: 0, right: 1024, bottom: 384 }
    const bottom = { top: 384, left: 0, right: 1024, bottom: 768 }

    expect(sheetDismissDirection('x', right, viewport)).toBe(1)
    expect(sheetDismissDirection('x', left, viewport)).toBe(-1)
    expect(sheetDismissDirection('y', top, viewport)).toBe(-1)
    expect(sheetDismissDirection('y', bottom, viewport)).toBe(1)
  })

  /**
   * The rect is what makes the gesture right under `dir="rtl"`: `position="right"` puts the panel
   * against the physical left edge there, and the measurement already knows that.
   */
  it('follows the panel rather than the position under a mirrored writing direction', () => {
    const mirroredRight = { top: 0, left: 0, right: 448, bottom: 768 }

    expect(sheetDismissDirection(sheetDragAxis('right'), mirroredRight, viewport)).toBe(-1)
  })

  it('absorbs movement away from the closing edge', () => {
    expect(sheetDragProgress(120, 1)).toBe(120)
    expect(sheetDragProgress(-120, 1)).toBe(0)
    expect(sheetDragProgress(-120, -1)).toBe(120)
    expect(sheetDragProgress(120, -1)).toBe(0)
  })

  it('dismisses past the greater of the proportional and the minimum threshold', () => {
    // 40% of a 400px panel is 160px, which is above the 48px floor.
    expect(shouldDismissSheetDrag(159, 400)).toBe(false)
    expect(shouldDismissSheetDrag(160, 400)).toBe(true)
    // A short panel falls back to the floor, so a stray few pixels cannot close it.
    expect(shouldDismissSheetDrag(40, 80)).toBe(false)
    expect(shouldDismissSheetDrag(48, 80)).toBe(true)
  })

  it('yields the gesture to anything that can scroll along the axis', () => {
    const scrollsDown = { clientHeight: 200, clientWidth: 300, scrollHeight: 900, scrollWidth: 300 }
    const fits = { clientHeight: 200, clientWidth: 300, scrollHeight: 200, scrollWidth: 300 }

    expect(canScrollInAxis(scrollsDown, 'y')).toBe(true)
    expect(canScrollInAxis(scrollsDown, 'x')).toBe(false)
    expect(canScrollInAxis(fits, 'y')).toBe(false)
  })
})

describe('overlay naming', () => {
  it('names the panel from its title and description parts', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    const title = { id: '' }
    const description = { id: 'authored-description' }

    enhanceSheetParts(
      { host, trigger, panel, title, description },
      { generatedId: 'ui-sheet-9', supportsDialog: true, supportsInvokerCommands: true },
    )

    expect(title.id).toBe('ui-sheet-9-title')
    expect(panel.getAttribute('aria-labelledby')).toBe('ui-sheet-9-title')
    expect(panel.getAttribute('aria-describedby')).toBe('authored-description')
  })

  it('never overwrites an authored relationship', () => {
    const host = new FakeSheetElement()
    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    panel.setAttribute('aria-labelledby', 'somewhere-else')

    enhanceSheetParts(
      { host, trigger, panel, title: { id: 'panel-title' } },
      { generatedId: 'ui-sheet-10', supportsDialog: true, supportsInvokerCommands: true },
    )

    expect(panel.getAttribute('aria-labelledby')).toBe('somewhere-else')
  })
})
