import { describe, expect, it } from 'vitest'
import {
  enhanceSheetParts,
  resolveSheetPosition,
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
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      modal: true,
      panelId: 'ui-sheet-1',
      position: 'left',
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
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      modal: false,
      panelId: 'ui-sheet-2',
      position: 'right',
    })
    expect(panel.getAttribute('aria-modal')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeSheetElement()

    expect(
      enhanceSheetParts(
        { host, trigger: null, panel: null },
        { generatedId: 'ui-sheet-3', supportsDialog: true },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'panel'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()

    const trigger = new FakeSheetElement()
    const panel = new FakeSheetElement()
    expect(
      enhanceSheetParts(
        { host, trigger, panel },
        { generatedId: 'ui-sheet-4', supportsDialog: false },
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
