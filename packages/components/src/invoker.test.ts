import { describe, expect, it } from 'vitest'
import {
  authoredCommand,
  closeCommand,
  commandFromEvent,
  commandSource,
  commandTarget,
  hasAuthoredCommand,
  isOpenedByToggle,
  requestCloseCommand,
  showModalCommand,
  supportsInvokerCommands,
} from './invoker'

class FakeInvoker {
  readonly attributes = new Map<string, string>()

  constructor(attributes: Record<string, string> = {}) {
    for (const [name, value] of Object.entries(attributes)) {
      this.attributes.set(name, value)
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }
}

describe('supportsInvokerCommands', () => {
  it('detects the button command property', () => {
    expect(
      supportsInvokerCommands({ HTMLButtonElement: { prototype: { command: '' } } } as never),
    ).toBe(true)
    expect(supportsInvokerCommands({ HTMLButtonElement: { prototype: {} } } as never)).toBe(false)
    expect(supportsInvokerCommands({} as never)).toBe(false)
    expect(supportsInvokerCommands(null)).toBe(false)
    expect(supportsInvokerCommands(undefined)).toBe(false)
  })
})

describe('authoredCommand', () => {
  it('reads a command only when it is aimed at a target', () => {
    expect(
      authoredCommand(new FakeInvoker({ command: 'show-modal', commandfor: 'release-dialog' })),
    ).toBe(showModalCommand)
    expect(
      authoredCommand(new FakeInvoker({ command: '  close  ', commandfor: 'release-dialog' })),
    ).toBe(closeCommand)
  })

  it('treats either attribute alone as inert, matching the platform', () => {
    expect(authoredCommand(new FakeInvoker({ commandfor: 'release-dialog' }))).toBeNull()
    expect(authoredCommand(new FakeInvoker({ command: 'show-modal' }))).toBeNull()
    expect(authoredCommand(new FakeInvoker({ command: 'show-modal', commandfor: '  ' }))).toBeNull()
    expect(
      authoredCommand(new FakeInvoker({ command: '  ', commandfor: 'release-dialog' })),
    ).toBeNull()
    expect(authoredCommand(new FakeInvoker())).toBeNull()
    expect(authoredCommand(null)).toBeNull()
  })

  it('reports the target id separately', () => {
    expect(commandTarget(new FakeInvoker({ commandfor: ' release-dialog ' }))).toBe(
      'release-dialog',
    )
    expect(commandTarget(new FakeInvoker({ commandfor: '' }))).toBeNull()
    expect(commandTarget(null)).toBeNull()
  })
})

describe('hasAuthoredCommand', () => {
  it('matches a listed command against the target id', () => {
    const trigger = new FakeInvoker({ command: 'show-modal', commandfor: 'release-dialog' })

    expect(hasAuthoredCommand(trigger, 'release-dialog', showModalCommand)).toBe(true)
    expect(hasAuthoredCommand(trigger, 'other-dialog', showModalCommand)).toBe(false)
    expect(hasAuthoredCommand(trigger, '', showModalCommand)).toBe(false)
    expect(hasAuthoredCommand(trigger, 'release-dialog', closeCommand, requestCloseCommand)).toBe(
      false,
    )
  })

  it('matches built-in command names case-insensitively', () => {
    const close = new FakeInvoker({ command: 'Request-Close', commandfor: 'release-dialog' })

    expect(hasAuthoredCommand(close, 'release-dialog', closeCommand, requestCloseCommand)).toBe(
      true,
    )
  })

  it('reads an unrecognized command as no authored command', () => {
    const trigger = new FakeInvoker({ command: 'showmodal', commandfor: 'release-dialog' })

    expect(hasAuthoredCommand(trigger, 'release-dialog', showModalCommand)).toBe(false)
  })
})

describe('command event readers', () => {
  it('normalizes the dispatched command name', () => {
    expect(commandFromEvent({ command: ' Show-Modal ' } as unknown as Event)).toBe(showModalCommand)
    expect(commandFromEvent({} as Event)).toBe('')
  })

  it('reads an open transition from a toggle event', () => {
    expect(isOpenedByToggle({ newState: 'open' } as unknown as Event)).toBe(true)
    expect(isOpenedByToggle({ newState: 'closed' } as unknown as Event)).toBe(false)
    expect(isOpenedByToggle({} as Event)).toBe(false)
  })

  it('returns the invoking button only when it belongs to the expected window', () => {
    class FakeHTMLElement {}
    const source = new FakeHTMLElement()
    const targetWindow = { HTMLElement: FakeHTMLElement } as unknown as Window

    expect(commandSource({ source } as unknown as Event, targetWindow)).toBe(source)
    expect(commandSource({ source: {} } as unknown as Event, targetWindow)).toBeNull()
    expect(commandSource({ source: null } as unknown as Event, targetWindow)).toBeNull()
    expect(commandSource({ source } as unknown as Event, null)).toBeNull()
  })
})
