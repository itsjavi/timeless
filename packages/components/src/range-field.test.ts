import { describe, expect, it } from 'vitest'
import { clampRangePair, rangeFillBounds } from './range-field'

describe('clampRangePair', () => {
  it('leaves an ordered pair alone', () => {
    expect(clampRangePair({ from: 20, to: 80 }, 'from')).toEqual({ from: 20, to: 80 })
    expect(clampRangePair({ from: 20, to: 20 }, 'to')).toEqual({ from: 20, to: 20 })
  })

  it('blocks the lower thumb at the upper one instead of swapping them', () => {
    expect(clampRangePair({ from: 90, to: 80 }, 'from')).toEqual({ from: 80, to: 80 })
  })

  it('blocks the upper thumb at the lower one instead of swapping them', () => {
    expect(clampRangePair({ from: 40, to: 10 }, 'to')).toEqual({ from: 40, to: 40 })
  })

  it('never hands the drag to the other thumb, whichever one crossed', () => {
    const crossed = { from: 70, to: 30 }

    expect(clampRangePair(crossed, 'from').from).toBe(30)
    expect(clampRangePair(crossed, 'to').to).toBe(70)
  })
})

describe('rangeFillBounds', () => {
  it('maps the pair onto percentages of the shared span', () => {
    expect(rangeFillBounds({ from: 20, to: 80 }, { min: 0, max: 100 })).toEqual({
      start: 20,
      end: 80,
    })
  })

  it('handles a span that does not start at zero', () => {
    expect(rangeFillBounds({ from: 15, to: 20 }, { min: 10, max: 20 })).toEqual({
      start: 50,
      end: 100,
    })
  })

  it('clamps a value outside the declared bounds', () => {
    expect(rangeFillBounds({ from: -40, to: 400 }, { min: 0, max: 100 })).toEqual({
      start: 0,
      end: 100,
    })
  })

  it('falls back to a full track when the bounds carry no span', () => {
    expect(rangeFillBounds({ from: 5, to: 5 }, { min: 10, max: 10 })).toEqual({
      start: 0,
      end: 100,
    })
    expect(rangeFillBounds({ from: 5, to: 5 }, { min: 0, max: Number.NaN })).toEqual({
      start: 0,
      end: 100,
    })
  })
})
