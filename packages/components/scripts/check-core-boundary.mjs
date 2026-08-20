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
 * `@keyframes` blocks are exempt from rule 3: an animation naming a property core places with is
 * motion, not a competing declaration.
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
  for (const [property, line] of declarations(stripKeyframes(stripComments(themeSource)))) {
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
  `Core boundary holds: ${coreDeclarations} declarations across ${files.length} core stylesheets, and ${themeChecked} theme counterparts leave every core-owned property to core.`,
)

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
