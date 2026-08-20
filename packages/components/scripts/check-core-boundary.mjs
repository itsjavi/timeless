/**
 * Proves the core/theme boundary mechanically, because a boundary maintained by review erodes on the
 * first convenient exception and this one is the whole point of milestone 028.
 *
 * Four rules:
 *
 * 1. A core stylesheet declares no cosmetic property. Core carries what a component needs to
 *    *behave*; a colour, a shadow, a radius, a font, or a transition in a core file means the rule was
 *    misclassified, not that the boundary needs widening.
 *
 * 2. A core stylesheet declares no size. Sizing is the tier this milestone deliberately left in the
 *    theme — a `max-block-size` clamp is a design decision, not a behavioral requirement — and it is
 *    also where the one real bug of the extraction came from. `min-inline-size: anchor-size(width)`
 *    was moved into `core/options.css` while `options.css` kept its own `min-inline-size` on a
 *    selector of equal specificity; because `core.css` is imported first, the theme won and every
 *    Select surface silently rendered at 14rem instead of its trigger's width. Nothing failed. It just
 *    looked slightly wrong.
 *
 * 3. A theme stylesheet declares none of the properties core owns, for any component that has a core
 *    file. This is the inverse boundary, and the one that makes the split total rather than partial:
 *    extraction has to *move* a declaration, and a property left behind competes with core at equal
 *    specificity, where the winner is decided by whichever file the consumer imported last. The rule
 *    self-scopes — it applies to `x.css` exactly when `core/x.css` exists — so a half-finished
 *    extraction fails rather than passing quietly.
 *
 * 4. Every Atmosphere token a core file reads carries a literal fallback. Core has to work with no
 *    theme loaded, and `var(--ui-radius-lg)` with nothing behind it computes to nothing. Per-instance
 *    custom properties written by the runtime — `--ui-floating-anchor`, `--ui-floating-left` — are
 *    exempt: they are state, not theme, and no literal default would be correct for them.
 *
 * Rule 3 has three exemptions, because "behavior-critical" is a property of the declaration in
 * context, not of the property name alone. The milestone's own baseline said as much: it counted
 * `translate` as behavior-critical "because in this library it positions anchored surfaces rather than
 * animating them, which is true of those surfaces and not necessarily of everything else".
 *
 * - `@keyframes` blocks. An animation naming a property core places with is motion, not a competing
 *   declaration.
 * - A `::before`/`::after` rule that declares `content`. The element is drawn by the theme and does
 *   not exist without it, so positioning it is not behavior — there is nothing to behave. Splitting
 *   such a rule would leave core absolutely positioning a pseudo-element that has no content.
 * - A declaration preceded by a `core-exempt:` comment naming a reason. The escape hatch for genuine
 *   one-offs, deliberately visible in the CSS and greppable. The count is printed on every run so
 *   these cannot quietly multiply.
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const cssRoot = resolve(packageRoot, 'src/css')
const coreRoot = resolve(cssRoot, 'core')

/** Cosmetic properties, spelled out. The plan's "explicitly excluded" list, plus its type clause. */
const COSMETIC_EXACTLY = new Set([
  'animation',
  'backdrop-filter',
  'color',
  'filter',
  'font',
  'letter-spacing',
  'line-height',
  'mix-blend-mode',
  'opacity',
  'text-indent',
  'text-transform',
  'transition',
  'word-spacing',
])
/** Catches `border-color`, `border-radius`, `box-shadow`, `accent-color`, the logical radii. */
const COSMETIC_SUFFIXES = ['-color', '-radius', '-shadow']
const COSMETIC_PREFIXES = [
  'animation-',
  'background',
  'font-',
  'text-decoration',
  'text-emphasis',
  'transition-',
]

/** Sizing. The theme's, per the milestone's narrow-tier decision. */
const SIZE_PROPERTIES = new Set([
  'block-size',
  'height',
  'inline-size',
  'max-block-size',
  'max-height',
  'max-inline-size',
  'max-width',
  'min-block-size',
  'min-height',
  'min-inline-size',
  'min-width',
  'width',
])

/**
 * The properties core owns exclusively — the behavior-critical set the milestone's baseline measured.
 * A theme stylesheet whose component has a core file may not declare any of them.
 */
const CORE_OWNED = new Set([
  'anchor-name',
  'appearance',
  'border-collapse',
  'bottom',
  'color-scheme',
  'display',
  'field-sizing',
  'forced-color-adjust',
  'inset',
  'inset-block',
  'inset-block-end',
  'inset-block-start',
  'inset-inline',
  'inset-inline-end',
  'inset-inline-start',
  'left',
  'overflow',
  'overflow-block',
  'overflow-inline',
  'overflow-x',
  'overflow-y',
  'overscroll-behavior',
  'overscroll-behavior-block',
  'overscroll-behavior-inline',
  'overscroll-behavior-x',
  'overscroll-behavior-y',
  'pointer-events',
  'position',
  'position-anchor',
  'position-area',
  'position-try-fallbacks',
  'position-visibility',
  'resize',
  'right',
  'scrollbar-gutter',
  'top',
  'touch-action',
  'translate',
  'z-index',
])

/** Read as text, the way `validate-contracts.mjs` reads it, so this script needs no build step. */
const themeTokens = new Set(
  [
    ...(await readFile(resolve(packageRoot, 'src/tokens.ts'), 'utf8')).matchAll(
      /'(--ui-[a-z0-9-]+)'/g,
    ),
  ].map((match) => match[1]),
)
if (themeTokens.size === 0) throw new Error('Could not read the Atmosphere token list')

const failures = []
let exempted = 0
const files = (await readdir(coreRoot, { recursive: true }))
  .filter((name) => name.endsWith('.css'))
  .sort()
if (files.length === 0) throw new Error('No core stylesheets found in src/css/core')

let coreDeclarations = 0
let themeChecked = 0
for (const file of files) {
  const source = stripComments(await readFile(resolve(coreRoot, file), 'utf8'))
  const found = declarations(source)
  /*
   * A core stylesheet with no declarations means the parser broke, not that the file is clean — the
   * first draft of this script required a leading hyphen and so reported every file as empty and
   * passing. Fail loudly instead.
   */
  if (found.length === 0) {
    throw new Error(`core/${file} parsed to zero declarations; the parser in this script is wrong`)
  }

  for (const [property, line] of found) {
    coreDeclarations += 1
    if (isCosmetic(property)) {
      failures.push(`core/${file}:${line} declares the cosmetic property \`${property}\``)
    }
    if (SIZE_PROPERTIES.has(property)) {
      failures.push(
        `core/${file}:${line} declares the size \`${property}\`; sizing stays in the theme`,
      )
    }
  }

  for (const [token, line] of tokenReads(source)) {
    if (!themeTokens.has(token)) continue
    failures.push(
      `core/${file}:${line} reads the Atmosphere token \`${token}\` with no literal fallback`,
    )
  }

  /*
   * The inverse boundary. A core file with no theme counterpart is legitimate: Context Menu's
   * placement is entirely behavior, so nothing is left for a theme file to hold.
   */
  const themeSource = await readFile(resolve(cssRoot, file), 'utf8').catch(() => null)
  if (themeSource === null) continue
  themeChecked += 1
  for (const [property, line] of themeDeclarations(stripKeyframes(themeSource))) {
    if (!CORE_OWNED.has(property)) continue
    failures.push(
      `${file}:${line} declares \`${property}\`, which core/${file} owns — extraction must move a declaration, not leave one behind`,
    )
  }
}

if (failures.length > 0) {
  throw new Error(`Core stylesheets crossed the theme boundary:\n- ${failures.join('\n- ')}`)
}

console.log(
  `Core boundary holds: ${coreDeclarations} declarations across ${files.length} core stylesheets, ` +
    `${themeChecked} theme counterparts leave every core-owned property to core, ` +
    `and ${exempted} ${exempted === 1 ? 'declaration is' : 'declarations are'} marked \`core-exempt\`.`,
)

/**
 * Rule-aware scan of a theme stylesheet, applying rule 3's exemptions. Rules are found by matching a
 * selector against its brace-delimited body; the library's stylesheets are oxfmt-formatted and nest
 * only at-rules, so a body never contains a nested style rule.
 */
function themeDeclarations(source) {
  const found = []
  for (const match of stripComments(source).matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const [, selector, body] = match
    if (!selector.includes(':') && !selector.includes('[') && selector.trim().startsWith('@')) {
      continue
    }
    // The theme drew this pseudo-element; positioning something that does not exist is not behavior.
    if (/::(before|after)/.test(selector) && /(?:^|[{;])\s*content\s*:/.test(body)) continue
    const bodyStart = match.index + selector.length + 1
    const raw = source.slice(bodyStart, bodyStart + body.length)
    for (const [property, offset] of bodyDeclarations(body)) {
      // An explicit marker immediately above the declaration opts it out.
      if (/\/\*\s*core-exempt:[^*]*\*\/\s*$/.test(raw.slice(0, offset))) {
        exempted += 1
        continue
      }
      found.push([property, lineOf(source, bodyStart + offset)])
    }
  }
  return found
}

/**
 * Offsets point at the property name itself, not at the `;` or block start the pattern anchors on, so
 * that slicing up to the offset includes any comment sitting directly above the declaration. Anchored
 * at the previous character, the first declaration in a block reported offset 0 and its `core-exempt`
 * marker was invisible.
 */
function bodyDeclarations(body) {
  const found = []
  for (const match of body.matchAll(/(?:^|[{;])\s*((?:--)?[a-z][a-z0-9-]*)\s*:/gi)) {
    found.push([match[1].toLowerCase(), match.index + match[0].indexOf(match[1])])
  }
  return found
}

function isCosmetic(property) {
  if (property.startsWith('--')) return false
  if (COSMETIC_EXACTLY.has(property)) return true
  if (COSMETIC_SUFFIXES.some((suffix) => property.endsWith(suffix))) return true
  return COSMETIC_PREFIXES.some((prefix) => property.startsWith(prefix))
}

/**
 * Declaration starts only: a property name is preceded by `{`, `;`, or the start of the file. That
 * skips pseudo-classes such as `:popover-open`, and skips `@supports (anchor-name: --ui-anchor)`,
 * whose colon sits inside parentheses rather than a declaration block.
 */
function declarations(source) {
  const found = []
  for (const match of source.matchAll(/(?:^|[{;])\s*((?:--)?[a-z][a-z0-9-]*)\s*:/gi)) {
    found.push([match[1].toLowerCase(), lineOf(source, match.index)])
  }
  return found
}

/** `var(--x)` with no comma is an unguarded read; `var(--x, 0.5rem)` carries its own default. */
function tokenReads(source) {
  const found = []
  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
    if (match[2] === ',') continue
    found.push([match[1].toLowerCase(), lineOf(source, match.index)])
  }
  return found
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

/** Motion that animates a property core places with is not a competing declaration of it. */
function stripKeyframes(source) {
  return source.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (block) =>
    block.replace(/[^\n]/g, ' '),
  )
}

function stripComments(source) {
  // Replaced with matching spaces so reported line numbers still point at the real line.
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
}
