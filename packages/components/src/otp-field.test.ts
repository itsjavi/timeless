import { describe, expect, it } from 'vitest'
import { distributeOtpValue, otpCellsValue, otpTraversalTarget } from './otp-field'

describe('distributeOtpValue', () => {
  it('spreads a full-length code one character per cell', () => {
    const { cells, focusIndex } = distributeOtpValue(6, '482913')

    expect(cells).toEqual(['4', '8', '2', '9', '1', '3'])
    expect(focusIndex).toBe(5)
  })

  it('drops the spaces and hyphens people copy along with a code', () => {
    expect(distributeOtpValue(6, '482 913').cells).toEqual(['4', '8', '2', '9', '1', '3'])
    expect(distributeOtpValue(6, '482-913').cells).toEqual(['4', '8', '2', '9', '1', '3'])
    expect(distributeOtpValue(6, ' 482–913\n').cells).toEqual(['4', '8', '2', '9', '1', '3'])
  })

  it('truncates a code longer than the field instead of overflowing it', () => {
    const { cells, focusIndex } = distributeOtpValue(4, '482913')

    expect(cells).toEqual(['4', '8', '2', '9'])
    expect(focusIndex).toBe(3)
  })

  it('pastes into the middle without disturbing the cells before it', () => {
    const { cells, focusIndex } = distributeOtpValue(6, '91', {
      cells: ['4', '8', '2', '', '', ''],
      startIndex: 3,
    })

    expect(cells).toEqual(['4', '8', '2', '9', '1', ''])
    expect(focusIndex).toBe(5)
  })

  it('keeps letters, because a one-time code is not always numeric', () => {
    expect(distributeOtpValue(4, 'a1B2').cells).toEqual(['a', '1', 'B', '2'])
  })

  it('drops punctuation rather than spending a cell on it', () => {
    expect(distributeOtpValue(4, '1.2,3!4').cells).toEqual(['1', '2', '3', '4'])
  })

  it('leaves the field untouched when the text carries no content at all', () => {
    const { cells, focusIndex } = distributeOtpValue(4, '   --- ', {
      cells: ['1', '2', '', ''],
      startIndex: 2,
    })

    expect(cells).toEqual(['1', '2', '', ''])
    expect(focusIndex).toBe(2)
  })

  it('writes a single typed character and points focus at the next cell', () => {
    const { cells, focusIndex } = distributeOtpValue(6, '7', {
      cells: ['4', '', '', '', '', ''],
      startIndex: 1,
    })

    expect(cells).toEqual(['4', '7', '', '', '', ''])
    expect(focusIndex).toBe(2)
  })

  it('clamps a start index past the end of the field', () => {
    expect(distributeOtpValue(3, '9', { startIndex: 9 }).cells).toEqual(['', '', '9'])
  })

  it('returns nothing to write for a field with no cells', () => {
    expect(distributeOtpValue(0, '4829')).toEqual({ cells: [], focusIndex: 0 })
  })
})

describe('otpCellsValue', () => {
  it('joins the cells into the code they spell', () => {
    expect(otpCellsValue(['4', '8', '2'])).toBe('482')
  })

  it('collapses empty cells rather than padding the value', () => {
    expect(otpCellsValue(['4', '', '2'])).toBe('42')
  })
})

describe('otpTraversalTarget', () => {
  it('moves between neighbouring cells', () => {
    expect(otpTraversalTarget(6, 2, 'ArrowLeft')).toBe(1)
    expect(otpTraversalTarget(6, 2, 'ArrowRight')).toBe(3)
  })

  it('stops at the ends rather than wrapping', () => {
    expect(otpTraversalTarget(6, 0, 'ArrowLeft')).toBeNull()
    expect(otpTraversalTarget(6, 5, 'ArrowRight')).toBeNull()
  })

  it('jumps to the first and last cells', () => {
    expect(otpTraversalTarget(6, 3, 'Home')).toBe(0)
    expect(otpTraversalTarget(6, 3, 'End')).toBe(5)
  })

  it('leaves a key that would not move focus to the browser', () => {
    expect(otpTraversalTarget(6, 0, 'Home')).toBeNull()
    expect(otpTraversalTarget(6, 5, 'End')).toBeNull()
    expect(otpTraversalTarget(6, 2, 'ArrowDown')).toBeNull()
    expect(otpTraversalTarget(6, 2, 'a')).toBeNull()
  })
})
