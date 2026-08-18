import { describe, expect, it } from 'vitest'
import { enhanceDialogParts, resolveDialogKind, resolveDialogRole } from './dialog'

class FakeOverlayElement {
  id = ''
  open = false
  hidden = false
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

  close(): void {
    this.open = false
  }
}

describe('enhanceDialogParts', () => {
  it('links trigger and native dialog semantics', () => {
    const host = new FakeOverlayElement()
    const trigger = new FakeOverlayElement()
    const dialog = new FakeOverlayElement()

    const result = enhanceDialogParts(
      { host, trigger, dialog },
      { generatedId: 'ui-dialog-1', supportsDialog: true, kind: 'alert' },
    )

    expect(result).toEqual({
      status: 'enhanced',
      dialogId: 'ui-dialog-1',
      role: 'alertdialog',
    })
    expect(dialog.id).toBe('ui-dialog-1')
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe('ui-dialog-1')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeOverlayElement()

    expect(
      enhanceDialogParts(
        { host, trigger: null, dialog: null },
        { generatedId: 'ui-dialog-2', supportsDialog: true },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'dialog'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()

    const trigger = new FakeOverlayElement()
    const dialog = new FakeOverlayElement()
    expect(
      enhanceDialogParts(
        { host, trigger, dialog },
        { generatedId: 'ui-dialog-3', supportsDialog: false },
      ),
    ).toEqual({ status: 'unsupported', feature: 'dialog' })
    expect(host.getAttribute('data-ui-unsupported')).toBeNull()
  })
})

describe('dialog option resolvers', () => {
  it('normalizes dialog kind and role values', () => {
    expect(resolveDialogKind('alertdialog')).toBe('alert')
    expect(resolveDialogKind('alert')).toBe('alert')
    expect(resolveDialogKind('dialog')).toBe('dialog')
    expect(resolveDialogRole('alert')).toBe('alertdialog')
    expect(resolveDialogRole('dialog')).toBe('dialog')
  })
})
