import { describe, expect, it, vi } from 'vitest'
import {
  dismissToast,
  isToasterPlacement,
  isToasterStack,
  readToastDuration,
  toast,
  type ToastDismissReason,
} from './toast'

class FakeToast {
  hidden = false
  readonly attributes = new Map<string, string>()
  readonly events: Event[] = []

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  dispatchEvent(event: Event): boolean {
    this.events.push(event)
    return true
  }
}

class FakeElement {
  innerHTML = ''
  textContent = ''
  readonly attributes = new Map<string, string>()
  readonly children: FakeElement[] = []

  constructor(
    readonly localName: string,
    readonly ownerDocument: FakeDocument,
  ) {}

  append(...children: FakeElement[]): void {
    this.children.push(...children)
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  querySelector(selector: string): FakeElement | null {
    if (this.localName === selector) {
      return this
    }

    for (const child of this.children) {
      const match = child.querySelector(selector)
      if (match) return match
    }

    return null
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

class FakeDocument {
  readonly body = new FakeElement('body', this)

  createElement(localName: string): FakeElement {
    return new FakeElement(localName, this)
  }

  querySelector(selector: string): FakeElement | null {
    return this.body.querySelector(selector)
  }
}

describe('dismissToast', () => {
  it('dismisses a toast once and emits the reason', () => {
    vi.stubGlobal(
      'CustomEvent',
      class TestCustomEvent<TDetail> extends Event {
        readonly detail: TDetail

        constructor(type: string, init: CustomEventInit<TDetail> = {}) {
          super(type, init)
          this.detail = init.detail as TDetail
        }
      },
    )

    const toast = new FakeToast()

    expect(dismissToast(toast, 'user')).toBe(true)
    expect(dismissToast(toast, 'timeout')).toBe(false)
    expect(toast.hidden).toBe(true)
    expect(toast.getAttribute('data-ui-state')).toBeNull()
    expect(toast.getAttribute('data-ui-dismissed')).toBeNull()
    expect((toast.events[0] as CustomEvent<{ reason: ToastDismissReason }>).detail.reason).toBe(
      'user',
    )
  })
})

describe('toast', () => {
  it('appends authored toast anatomy to a toaster', () => {
    const document = new FakeDocument()

    const toastElement = toast('Preview queued', {
      description: 'The package API adds a toast item.',
      document: document as unknown as Document,
      duration: 0,
    }) as unknown as FakeElement

    const toaster = document.body.children[0]!
    const content = toastElement.children[0]!
    const close = toastElement.children[1]!

    expect(toaster.localName).toBe('ui-toaster')
    expect(toaster.getAttribute('placement')).toBe('bottom-end')
    expect(toaster.getAttribute('stack')).toBe('overlap')
    expect(toaster.children[0]).toBe(toastElement)
    expect(toastElement.localName).toBe('ui-toast')
    expect(toastElement.getAttribute('duration')).toBe('0')
    expect(content.getAttribute('data-ui-part')).toBe('content')
    expect(content.children[0]!.getAttribute('data-ui-part')).toBe('title')
    expect(content.children[0]!.textContent).toBe('Preview queued')
    expect(content.children[1]!.getAttribute('data-ui-part')).toBe('description')
    expect(close.getAttribute('data-ui-part')).toBe('close')
    expect(close.innerHTML).toContain('<svg')
  })

  it('configures auto-created toaster positioning and stack mode', () => {
    const document = new FakeDocument()

    toast('Preview queued', {
      document: document as unknown as Document,
      placement: 'top-center',
      stack: 'list',
    })

    const toaster = document.body.children[0]!

    expect(toaster.getAttribute('placement')).toBe('top-center')
    expect(toaster.getAttribute('stack')).toBe('list')
  })

  it('can configure an authored toaster passed to toast()', () => {
    const document = new FakeDocument()
    const toaster = document.createElement('ui-toaster')

    toast('Preview queued', {
      placement: 'bottom-center',
      stack: 'overlap',
      toaster: toaster as unknown as Element,
    })

    expect(toaster.getAttribute('placement')).toBe('bottom-center')
    expect(toaster.getAttribute('stack')).toBe('overlap')
  })
})

describe('readToastDuration', () => {
  it('keeps duration attributes numeric and non-negative', () => {
    expect(readToastDuration('2500')).toBe(2500)
    expect(readToastDuration('0')).toBe(0)
    expect(readToastDuration('-1')).toBe(5000)
    expect(readToastDuration('soon')).toBe(5000)
    expect(readToastDuration(null)).toBe(5000)
  })
})

describe('toaster contracts', () => {
  it('validates public toaster placement and stack values', () => {
    expect(isToasterPlacement('top-center')).toBe(true)
    expect(isToasterPlacement('middle')).toBe(false)
    expect(isToasterStack('overlap')).toBe(true)
    expect(isToasterStack('stacked')).toBe(false)
  })
})
