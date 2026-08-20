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

console.log(
  `Verified ${claims.length} platform claims against the library source, and ${principles.length} house rules.`,
)

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
