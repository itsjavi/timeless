import { describe, expect, it } from 'vitest'
import { checkMarkup } from './check-markup.mjs'

const kinds = (markup) => checkMarkup(markup).map((finding) => finding.kind)

describe('checkMarkup', () => {
  it('accepts a CSS component configured through data-ui-*', () => {
    expect(
      checkMarkup('<button class="ui-button" type="button" data-ui-variant="primary">Go</button>'),
    ).toEqual([])
  })

  it('accepts a custom element configured through plain attributes', () => {
    expect(checkMarkup('<ui-tabs orientation="vertical" activation="manual"></ui-tabs>')).toEqual(
      [],
    )
  })

  /* The three failures milestone 027 exists to catch. */

  it('rejects a CSS component authored as a custom element', () => {
    const findings = checkMarkup('<ui-button variant="primary">Go</ui-button>')
    expect(findings.map((finding) => finding.kind)).toContain('unknown-element')
    expect(findings[0]?.message).toContain('class="ui-button"')
  })

  it('rejects data-ui-* configuration on a custom-element host', () => {
    const findings = checkMarkup('<ui-tabs data-ui-orientation="vertical"></ui-tabs>')
    expect(findings.map((finding) => finding.kind)).toEqual(['configuration-on-host'])
    expect(findings[0]?.message).toContain('plain attribute orientation')
  })

  it('rejects a value on a presence-based attribute', () => {
    expect(kinds('<div class="ui-group" data-ui-wrap="false"></div>')).toEqual([
      'boolean-with-value',
    ])
  })

  it('accepts a presence-based attribute authored bare or empty', () => {
    expect(checkMarkup('<div class="ui-group" data-ui-wrap></div>')).toEqual([])
    expect(checkMarkup('<div class="ui-group" data-ui-wrap=""></div>')).toEqual([])
  })

  it('rejects a value the stylesheets do not implement', () => {
    const findings = checkMarkup('<button class="ui-button" data-ui-size="xl">Go</button>')
    expect(findings.map((finding) => finding.kind)).toEqual(['unpermitted-value'])
    expect(findings[0]?.message).toContain('sm')
  })

  it('rejects an attribute the root does not declare', () => {
    expect(kinds('<button class="ui-button" data-ui-density="compact">Go</button>')).toEqual([
      'undeclared-attribute',
    ])
  })

  it('rejects a bare attribute the contract spells with the data-ui- prefix', () => {
    expect(kinds('<button class="ui-button" variant="primary">Go</button>')).toEqual([
      'missing-data-ui-prefix',
    ])
  })

  it('rejects an authored private runtime hook', () => {
    expect(kinds('<div class="ui-card" data-ui-internal-open="">x</div>')).toContain(
      'internal-attribute',
    )
  })

  /* `data-ui-part` is legitimate on both kinds: a root can be a part of its parent component. */
  it('accepts data-ui-part on a class root and on a custom-element host', () => {
    expect(checkMarkup('<button class="ui-button" data-ui-part="trigger">Go</button>')).toEqual([])
    expect(checkMarkup('<ui-popover data-ui-part="trigger"></ui-popover>')).toEqual([])
  })

  it('ignores markup that uses no Timeless root', () => {
    expect(checkMarkup('<section class="prose"><p data-testid="x">Hello</p></section>')).toEqual([])
  })

  /*
   * The canonical-example sweep — the strongest assertion available — cannot live here:
   * `check-boundaries.mjs` forbids a published package from importing `@timelessui/examples`, and it is
   * right to. It runs in `packages/examples/scripts/validate.mjs` instead, where the direction is legal.
   */
})
