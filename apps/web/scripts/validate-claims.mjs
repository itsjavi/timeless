/**
 * The landing page's "Modern ingredients" shelf says Timeless is *built with* these browser
 * features. It once advertised container queries and Invoker Commands, neither of which appeared
 * anywhere in the library. Every tin now needs proof in the component or core source.
 *
 * Adding a tin without adding its proof here fails the build, which is the point.
 *
 * The shelf is not the only place the page makes a claim. The "House rules" list sat outside this
 * script's slice, which is how "Optional CSS, layered and override-friendly" survived there while
 * milestone 028 was opened specifically to establish that CSS is *not* optional — `floating.css` is
 * the anchoring implementation, so six components open unanchored without it. The second half of
 * this file gates that list too. It is a narrower job than the shelf's: rather than requiring proof
 * for an open-ended set of claims, it forbids the one claim the library cannot honour.
 */
import { readFile, readdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { examples } from '@timelessui/examples'

const root = resolve(import.meta.dirname, '../../..')

/** Claim heading -> a pattern that must match somewhere in the library source. */
const proofs = new Map([
  ['CSS anchor positioning', /anchor-name|position-anchor|position-try/],
  ['Native Overlays', /\bpopover\b|<dialog|showModal/],
  ['Cascade layers', /@layer\s+ui\./],
  ['Custom states', /:state\(|attachInternals/],
  ['Invoker Commands', /commandfor|CommandEvent/],
  ['light-dark()', /light-dark\(/],
  ['Light DOM', /data-ui-part/],
])

/**
 * Claims for features the library is committed to but has not shipped. Each one names the milestone
 * that will implement it, and each must graduate to `proofs` when that milestone lands — a planned
 * claim that already has an implementation is reported so it stops being treated as unverified.
 * Invoker Commands sat here until milestone 020 wired up Dialog and Sheet. Nothing is planned now.
 *
 * @type {Map<string, { milestone: string, proof: RegExp }>}
 */
const planned = new Map()

/*
 * Every published package, because "the library source" is what a claim is proven against and it is
 * no longer one directory: milestone 029 moved the colour model out to `@timelessui/color`, so a
 * future colour tin would have had no proof to find.
 */
const sources = await collectSources([
  resolve(root, 'packages/components/src'),
  resolve(root, 'packages/core/src'),
  resolve(root, 'packages/color/src'),
])

const landing = await readFile(resolve(root, 'apps/web/src/pages/index.astro'), 'utf8')
const shelf = landing.slice(
  landing.indexOf('class="tin-shelf"'),
  landing.indexOf('</div>', landing.lastIndexOf('class="tin__label"')),
)
const claims = [...shelf.matchAll(/<h3>(.*?)<\/h3>/g)].map((match) => decode(match[1]))

if (claims.length === 0) throw new Error('Could not read any platform claims from the landing page')

const failures = []
for (const claim of claims) {
  const upcoming = planned.get(claim)
  if (upcoming) {
    if (sources.some((source) => upcoming.proof.test(source))) {
      failures.push(
        `"${claim}" is now implemented; move it from planned to proofs in validate-claims.mjs`,
      )
    } else {
      console.log(`"${claim}" is advertised ahead of milestone ${upcoming.milestone}.`)
    }
    continue
  }
  const proof = proofs.get(claim)
  if (!proof) {
    failures.push(`"${claim}" is advertised but has no proof pattern in validate-claims.mjs`)
    continue
  }
  if (!sources.some((source) => proof.test(source))) {
    failures.push(`"${claim}" is advertised but ${proof} matches nothing in the library source`)
  }
}

if (failures.length > 0) {
  throw new Error(`Unsupported platform claims on the landing page:\n- ${failures.join('\n- ')}`)
}

const principles = principleItems(landing)
if (principles.length === 0) {
  throw new Error('Could not read any house rules from the landing page')
}

/**
 * Claiming the stylesheets are optional is the one assertion the library provably cannot support, so
 * it is forbidden by pattern rather than argued about in review. Matching is per principle and
 * requires "optional" and a CSS noun in the same item, which leaves the honest neighbouring claims —
 * that the theme is replaceable, that the layers are override-friendly — untouched.
 */
const forbidden = principles.filter(
  (principle) =>
    /\boptional\b[^.]*\b(css|stylesheets?)\b/i.test(principle) ||
    /\b(css|stylesheets?)\b[^.]*\boptional\b/i.test(principle),
)
if (forbidden.length > 0) {
  throw new Error(
    `The landing page advertises CSS as optional, which the library does not support:\n- ${forbidden.join('\n- ')}`,
  )
}

/**
 * `README.md` names the components that anchor a surface to their trigger, and it had drifted to four
 * of six — Menu Button and Hover Card anchor and were never added. Which components anchor is not a
 * judgement call: `syncFloatingAnchor` is the only way a component gets an anchor name, so its call
 * sites are the list. `floating.css` names the same six in its header comment, for a reader who is in
 * the stylesheet rather than here.
 *
 * The bullet is worth keeping as prose, because "for the six surfaces that open beside a trigger"
 * teaches more than a generated list would. It is not worth trusting.
 */
const anchoredModules = (await readdir(resolve(root, 'packages/components/src')))
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  // `floating.ts` declares the helper and `index.ts` re-exports it; neither anchors anything.
  .filter((name) => name !== 'floating.ts' && name !== 'index.ts')
const anchored = []
for (const name of anchoredModules) {
  const source = await readFile(resolve(root, 'packages/components/src', name), 'utf8')
  if (/\bsyncFloatingAnchor\b/.test(source)) anchored.push(name.replace(/\.ts$/, ''))
}
const readme = await readFile(resolve(root, 'README.md'), 'utf8')
const anchorBullet = readme.split('\n').find((line) => line.startsWith('- CSS anchor positioning'))
if (!anchorBullet) {
  throw new Error(
    'README.md no longer names the anchored surfaces; update this check or restore it',
  )
}
// Collapsed, because the bullet wraps and "Menu Button" can arrive split across two lines.
const anchorClaim = readme.slice(readme.indexOf(anchorBullet)).split('\n- ')[0].replace(/\s+/g, ' ')
const missingAnchors = anchored.filter(
  (name) => !new RegExp(name.replace(/-/g, '[ -]'), 'i').test(anchorClaim),
)
if (missingAnchors.length > 0) {
  throw new Error(
    `README.md's anchor-positioning bullet omits ${missingAnchors.join(', ')}, which call syncFloatingAnchor`,
  )
}
if (!new RegExp(`\\b${numberWord(anchored.length)}\\b`, 'i').test(anchorClaim)) {
  throw new Error(
    `README.md's anchor-positioning bullet does not say "${numberWord(anchored.length)}", but ${anchored.length} components call syncFloatingAnchor`,
  )
}

/**
 * The post-framework page splits the library into the components that need no JavaScript and the
 * ones that do, and the split is its whole argument — a stale number there is not a typo, it is the
 * page arguing from a library that no longer exists.
 *
 * The numbers are literals rather than a build-time `examples` expression on purpose. Every
 * documentation page is also served as raw Markdown for coding agents, and that route does not
 * evaluate MDX, so an interpolated count reaches an agent as `{cssOnly}`. Literals read correctly in
 * both places, and this check is what keeps them true. A component's `definitions` is empty exactly
 * when it registers no custom element, which is the same thing as needing no JavaScript.
 */
const catalogued = examples.filter((example) => example.domain !== 'recipes')
const cssOnlyCount = catalogued.filter((example) => example.definitions.length === 0).length
const expectedCounts = [
  ['documented components', catalogued.length],
  ['CSS-only components', cssOnlyCount],
  ['enhanced components', catalogued.length - cssOnlyCount],
]
const postFramework = await readFile(
  resolve(root, 'apps/web/src/content/docs/docs/getting-started/post-framework.mdx'),
  'utf8',
)
const claimedCounts = [
  [/There are (\d+) documented components/, 'documented components'],
  [/\*\*(\d+) are CSS over native HTML/, 'CSS-only components'],
  [/\*\*(\d+) are custom elements\*\*/, 'enhanced components'],
]
const countFailures = []
for (const [pattern, label] of claimedCounts) {
  const match = postFramework.match(pattern)
  if (!match) {
    countFailures.push(`the ${label} sentence no longer matches ${pattern}`)
    continue
  }
  const expected = expectedCounts.find(([name]) => name === label)[1]
  if (Number(match[1]) !== expected) {
    countFailures.push(`it says ${match[1]} ${label}, but the catalog has ${expected}`)
  }
}
if (countFailures.length > 0) {
  throw new Error(`The post-framework page misstates the library:\n- ${countFailures.join('\n- ')}`)
}

console.log(
  `Verified ${claims.length} platform claims against the library source, ${principles.length} house rules, ${anchored.length} anchored surfaces, and ${expectedCounts.length} component counts.`,
)

function numberWord(count) {
  return (
    ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][
      count
    ] ?? String(count)
  )
}

function principleItems(source) {
  const list = source.slice(
    source.indexOf('class="principles-list"'),
    source.indexOf('</ul>', source.indexOf('class="principles-list"')),
  )
  return [...list.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => decode(match[1]))
}

async function collectSources(directories) {
  const contents = []
  for (const directory of directories) {
    for (const path of await walk(directory)) {
      if (!['.ts', '.css'].includes(extname(path))) continue
      if (path.endsWith('.test.ts')) continue
      contents.push(await readFile(path, 'utf8'))
    }
  }
  return contents
}

async function walk(directory) {
  const paths = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) paths.push(...(await walk(path)))
    else paths.push(path)
  }
  return paths
}

function decode(value) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replace(/<[^>]+>/g, '')
    .trim()
}
