import { describe, expect, it, vi } from 'vitest'
import {
  copySourceText,
  performCopy,
  readCopyFeedbackDuration,
  resolveCopyValue,
  type CopyButtonHostLike,
  type CopySourceLike,
} from './copy-button'

const source = (localName: string, fields: Partial<CopySourceLike> = {}): CopySourceLike => ({
  localName,
  textContent: null,
  ...fields,
})

const host = (
  attributes: Record<string, string>,
  document: Record<string, CopySourceLike> = {},
): CopyButtonHostLike => ({
  getAttribute: (name) => attributes[name] ?? null,
  ownerDocument: { getElementById: (id) => document[id] ?? null },
})

describe('copySourceText', () => {
  it('reads the value of the three elements whose text is not their value', () => {
    expect(copySourceText(source('input', { value: 'typed', textContent: '' }))).toBe('typed')
    expect(copySourceText(source('textarea', { value: 'many lines' }))).toBe('many lines')
    expect(copySourceText(source('select', { value: 'admin', textContent: 'Administrator' }))).toBe(
      'admin',
    )
  })

  it('reads the text of anything else, including elements that happen to carry a value', () => {
    expect(copySourceText(source('code', { textContent: 'pnpm add x' }))).toBe('pnpm add x')
    // A button pointed at by `from` means its label, not the value it submits.
    expect(copySourceText(source('button', { value: 'submit', textContent: 'Publish' }))).toBe(
      'Publish',
    )
    expect(copySourceText(source('span'))).toBe('')
    expect(copySourceText(null)).toBe('')
  })
})

describe('resolveCopyValue', () => {
  it('prefers an authored value over from', () => {
    expect(
      resolveCopyValue(
        host(
          { value: 'literal', from: 'target' },
          { target: source('code', { textContent: 'read' }) },
        ),
      ),
    ).toBe('literal')
  })

  it('treats an authored empty value as the author saying to copy nothing', () => {
    expect(
      resolveCopyValue(
        host({ value: '', from: 'target' }, { target: source('code', { textContent: 'read' }) }),
      ),
    ).toBe('')
  })

  it('falls back to the element from names', () => {
    expect(
      resolveCopyValue(
        host({ from: 'target' }, { target: source('code', { textContent: 'read' }) }),
      ),
    ).toBe('read')
  })

  it('resolves to nothing when from names no element, or when neither is authored', () => {
    expect(resolveCopyValue(host({ from: 'missing' }))).toBe('')
    expect(resolveCopyValue(host({ from: '' }))).toBe('')
    expect(resolveCopyValue(host({}))).toBe('')
  })
})

describe('readCopyFeedbackDuration', () => {
  it('defaults to the duration the color picker already uses', () => {
    expect(readCopyFeedbackDuration(null)).toBe(1800)
    expect(readCopyFeedbackDuration('  ')).toBe(1800)
  })

  it('accepts a number, including zero, and rejects anything else', () => {
    expect(readCopyFeedbackDuration('600')).toBe(600)
    expect(readCopyFeedbackDuration('0')).toBe(0)
    expect(readCopyFeedbackDuration('soon')).toBe(1800)
    expect(readCopyFeedbackDuration('-1')).toBe(1800)
  })
})

describe('performCopy', () => {
  it('reports the write and carries no reason on success', async () => {
    const writeText = vi.fn(async () => {})

    await expect(performCopy('pnpm add x', { writeText })).resolves.toEqual({
      status: 'copied',
      value: 'pnpm add x',
      reason: null,
    })
    expect(writeText).toHaveBeenCalledExactlyOnceWith('pnpm add x')
  })

  it('reports an empty value without touching the clipboard', async () => {
    const writeText = vi.fn(async () => {})

    await expect(performCopy('', { writeText })).resolves.toEqual({
      status: 'failed',
      value: '',
      reason: 'empty',
    })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('reports an absent Clipboard API as unsupported rather than silently doing nothing', async () => {
    await expect(performCopy('value', undefined)).resolves.toEqual({
      status: 'failed',
      value: 'value',
      reason: 'unsupported',
    })
    await expect(performCopy('value', null)).resolves.toEqual({
      status: 'failed',
      value: 'value',
      reason: 'unsupported',
    })
  })

  it('reports a rejected write as denied', async () => {
    const writeText = vi.fn(async () => {
      throw new DOMException('Write permission denied.', 'NotAllowedError')
    })

    await expect(performCopy('value', { writeText })).resolves.toEqual({
      status: 'failed',
      value: 'value',
      reason: 'denied',
    })
  })
})
