import { describe, expect, it } from 'vitest'
import {
  supportsInvokerCommands,
  supportsNativeDialog,
  supportsNativePopover,
} from './capabilities'

describe('supportsNativePopover', () => {
  it('detects showPopover on the element prototype', () => {
    expect(
      supportsNativePopover({ HTMLElement: { prototype: { showPopover() {} } } } as never),
    ).toBe(true)
  })

  it('reports unsupported without the method, the constructor, or a window', () => {
    expect(supportsNativePopover({ HTMLElement: { prototype: {} } } as never)).toBe(false)
    expect(supportsNativePopover({} as never)).toBe(false)
    expect(supportsNativePopover(null)).toBe(false)
    expect(supportsNativePopover(undefined)).toBe(false)
  })
})

describe('supportsNativeDialog', () => {
  it('detects the whole dialog surface', () => {
    expect(
      supportsNativeDialog({
        HTMLDialogElement: { prototype: { close() {}, show() {}, showModal() {} } },
      } as never),
    ).toBe(true)
  })

  it('reports unsupported when any method is missing', () => {
    expect(
      supportsNativeDialog({
        HTMLDialogElement: { prototype: { close() {}, showModal() {} } },
      } as never),
    ).toBe(false)
    expect(
      supportsNativeDialog({
        HTMLDialogElement: { prototype: { close() {}, show() {} } },
      } as never),
    ).toBe(false)
    expect(
      supportsNativeDialog({
        HTMLDialogElement: { prototype: { show() {}, showModal() {} } },
      } as never),
    ).toBe(false)
  })

  it('reports unsupported without the constructor or a window', () => {
    expect(supportsNativeDialog({} as never)).toBe(false)
    expect(supportsNativeDialog(null)).toBe(false)
    expect(supportsNativeDialog(undefined)).toBe(false)
  })
})

describe('supportsInvokerCommands', () => {
  it('detects the button command property', () => {
    expect(
      supportsInvokerCommands({ HTMLButtonElement: { prototype: { command: '' } } } as never),
    ).toBe(true)
  })

  it('reports unsupported without the property, the constructor, or a window', () => {
    expect(supportsInvokerCommands({ HTMLButtonElement: { prototype: {} } } as never)).toBe(false)
    expect(supportsInvokerCommands({} as never)).toBe(false)
    expect(supportsInvokerCommands(null)).toBe(false)
    expect(supportsInvokerCommands(undefined)).toBe(false)
  })
})
