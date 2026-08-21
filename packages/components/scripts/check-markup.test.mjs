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

  /*
   * Per-item attributes are declared on the part, and an option is neither a root nor a host, so
   * before milestone 031 nothing checked them. A misspelling here costs a submitted form value.
   */
  describe('per-item attributes declared on a part', () => {
    it('accepts the value and label an option declares', () => {
      expect(
        checkMarkup(
          '<div data-ui-part="option" role="option" data-ui-value="a" data-ui-label="Alpha">A</div>',
        ),
      ).toEqual([])
    })

    it('accepts the value a tab declares', () => {
      expect(checkMarkup('<button data-ui-part="tab" data-ui-value="one">T</button>')).toEqual([])
    })

    it('rejects a misspelled per-item attribute', () => {
      expect(kinds('<div data-ui-part="option" data-ui-valeu="a">A</div>')).toEqual([
        'undeclared-attribute',
      ])
    })

    it('names the part when the attribute exists but not on this one', () => {
      const findings = checkMarkup('<button data-ui-part="tab" data-ui-label="x">T</button>')
      expect(findings.map((finding) => finding.kind)).toEqual(['undeclared-attribute'])
      expect(findings[0]?.message).toContain('`tab`')
    })

    it('rejects root configuration on a part that is not a root', () => {
      expect(kinds('<div data-ui-part="content" data-ui-density="compact">x</div>')).toEqual([
        'undeclared-attribute',
      ])
    })

    it('accepts root configuration when the part is also a root', () => {
      expect(
        checkMarkup('<div class="ui-card" data-ui-part="panel" data-ui-density="compact">x</div>'),
      ).toEqual([])
    })

    /*
     * An element can be a part and a root at once, and then each loop has to know what the other
     * owns: the root does not declare `data-ui-value`, the part does, and the attribute is valid.
     */
    it('accepts a part attribute on an element that is also a root', () => {
      expect(
        checkMarkup('<div class="ui-card" data-ui-part="option" data-ui-value="x">y</div>'),
      ).toEqual([])
    })

    it('reports a misspelling once when the element is both a part and a root', () => {
      expect(kinds('<div class="ui-card" data-ui-part="option" data-ui-valeu="x">y</div>')).toEqual(
        ['undeclared-attribute'],
      )
    })
  })

  /*
   * An authored role wins over the `combobox` the enhancement applies, and the runtime then declines
   * to write `aria-activedescendant` onto a role that forbids it. That is correct and silent, so this
   * is the only thing that tells the author their active option is never announced.
   */
  describe('a Select trigger whose role cannot carry the relationship', () => {
    const select = (trigger) =>
      `<ui-select>${trigger}<div data-ui-part="listbox" role="listbox" popover="manual"><div role="option">A</div></div></ui-select>`

    it('reports an authored role that forbids aria-activedescendant', () => {
      const findings = checkMarkup(
        select('<button data-ui-part="trigger" role="button" aria-label="Role">Pick</button>'),
      )
      expect(findings.map((finding) => finding.kind)).toEqual(['role-forbids-relationship'])
      expect(findings[0].message).toContain('role="button"')
      expect(findings[0].message).toContain('combobox')
    })

    it('accepts the role Timeless applies, and an absent role', () => {
      expect(
        checkMarkup(
          select('<button data-ui-part="trigger" role="combobox" aria-label="Role">Pick</button>'),
        ),
      ).toEqual([])
      expect(
        checkMarkup(select('<button data-ui-part="trigger" aria-label="Role">Pick</button>')),
      ).toEqual([])
    })

    it('reports the missing name as well, since the two are separate problems', () => {
      expect(kinds(select('<button data-ui-part="trigger" role="button">Pick</button>'))).toEqual([
        'role-forbids-relationship',
        'missing-accessible-name',
      ])
    })
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
