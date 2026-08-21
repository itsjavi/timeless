/**
 * The one rule about how the three CSS tiers have to arrive together, shared by the two surfaces that
 * tell a consumer what to import: the catalog's `styles` arrays, which every component page publishes
 * as its required import set, and the `@timelessui/components/css/...` snippets in the MDX.
 *
 * Milestone 028 split every component stylesheet into a behaviour half and a look half. Nothing was
 * watching the lists that name them, so twenty catalog entries ended up importing
 * `themes/atmosphere/button.css` for a `.ui-button` trigger without `core/button.css`, and ten MDX
 * snippets named a component's theme file with no `themes/atmosphere/tokens.css` at all — which
 * resolves every `--ui-*` in that file to nothing, because `tokens.css` declares no value, the
 * per-component theme files contain no `@import`, and only core stylesheets are required to carry
 * literal fallbacks.
 */
import { readdir } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

const cssRoot = resolve(import.meta.dirname, '../../components/src/css')

/** Every stylesheet the package ships, relative to `src/css`, so `core/<x>.css` is a real entry. */
export async function readStylesheetNames() {
  return new Set(
    (await readdir(cssRoot, { recursive: true }))
      .map((name) => name.split(sep).join('/'))
      .filter((name) => name.endsWith('.css'))
      .filter((name) => name !== 'core.css' && name !== 'themes/atmosphere.css'),
  )
}

/**
 * Which required tier a stylesheet list is missing, given the theme files it names. An empty array
 * means the list is complete. A list with no per-component theme file is exempt: the utility-CSS page
 * imports `tokens.css` and `core/*` deliberately, and that is the documented theme-free tier.
 *
 * @param {readonly string[]} stylesheets Names relative to `src/css`, in any order.
 * @param {ReadonlySet<string>} available Every stylesheet the package ships.
 * @returns {string[]} One sentence per missing tier, ready to append to a subject.
 */
export function incompleteTiers(stylesheets, available) {
  const listed = [...stylesheets]
  const problems = []
  const themed = listed.filter(
    (name) => name.startsWith('themes/atmosphere/') && name !== 'themes/atmosphere/tokens.css',
  )
  if (themed.length === 0) return problems

  if (!listed.includes('tokens.css') && !listed.includes('themes/atmosphere.css')) {
    problems.push('a theme stylesheet without tokens.css, which carries the cascade-layer order')
  }
  if (
    !listed.includes('themes/atmosphere/tokens.css') &&
    !listed.includes('themes/atmosphere.css')
  ) {
    problems.push(
      'a theme stylesheet without themes/atmosphere/tokens.css, so every --ui-* in it resolves to nothing',
    )
  }
  for (const theme of themed) {
    const core = `core/${theme.slice('themes/atmosphere/'.length)}`
    if (
      available.has(core) &&
      !listed.includes(core) &&
      !listed.includes('core.css') &&
      !listed.includes('themes/atmosphere.css')
    ) {
      problems.push(`${theme} without ${core}, which is the behaviour half of that component`)
    }
  }
  return problems
}
