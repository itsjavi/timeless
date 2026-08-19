import { describe, expect, it } from 'vitest'
import { uiAttributes, uiAttributeString } from './attributes'

describe('uiAttributes', () => {
  it('emits the root class and the configured data attributes', () => {
    expect(uiAttributes('button', { variant: 'primary', size: 'lg' })).toEqual({
      class: 'ui-button',
      'data-ui-variant': 'primary',
      'data-ui-size': 'lg',
    })
  })

  it('emits only the root class when nothing is configured', () => {
    expect(uiAttributes('card')).toEqual({ class: 'ui-card' })
  })

  it('appends consumer classes after the root class', () => {
    expect(uiAttributes('alert', { variant: 'danger', class: 'my-alert mt-4' })).toEqual({
      class: 'ui-alert my-alert mt-4',
      'data-ui-variant': 'danger',
    })
  })

  it('treats boolean attributes as presence', () => {
    expect(uiAttributes('group', { wrap: true, attached: false })).toEqual({
      class: 'ui-group',
      'data-ui-wrap': '',
    })
  })

  it('omits attributes left undefined', () => {
    expect(uiAttributes('avatar', { size: 'sm', status: undefined })).toEqual({
      class: 'ui-avatar',
      'data-ui-size': 'sm',
    })
  })

  // Type-level assertions. Never called: `tsc` is the assertion, and two of these would throw.
  it('rejects values, attributes, and components outside the contract', () => {
    function typeErrors() {
      // @ts-expect-error 'nope' is not one of the seven button variants.
      uiAttributes('button', { variant: 'nope' })
      // @ts-expect-error Card has no size attribute.
      uiAttributes('card', { size: 'md' })
      // @ts-expect-error There is no such component.
      uiAttributes('nonexistent', {})
      // @ts-expect-error Alert implements two densities, not three.
      uiAttributes('alert', { density: 'spacious' })
    }
    expect(typeErrors).toBeTypeOf('function')
  })
})

describe('uiAttributeString', () => {
  it('serializes attributes for a template literal', () => {
    expect(uiAttributeString('button', { variant: 'danger', size: 'lg' })).toBe(
      'class="ui-button" data-ui-variant="danger" data-ui-size="lg"',
    )
  })

  it('omits values that equal the contract default', () => {
    expect(uiAttributeString('alert', { variant: 'neutral', density: 'normal' })).toBe(
      'class="ui-alert"',
    )
  })

  it('keeps defaults when asked to', () => {
    expect(uiAttributeString('alert', { variant: 'neutral' }, { omitDefaults: false })).toBe(
      'class="ui-alert" data-ui-variant="neutral"',
    )
  })

  it('escapes a consumer class', () => {
    expect(uiAttributeString('card', { class: 'a"b' })).toBe('class="ui-card a&quot;b"')
  })

  it('serializes a presence-based boolean as an empty value', () => {
    expect(uiAttributeString('group', { wrap: true })).toBe('class="ui-group" data-ui-wrap=""')
  })
})
