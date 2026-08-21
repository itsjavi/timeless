/**
 * Proves a release tag against the manifests it is about to publish.
 *
 * The three published packages are versioned in lockstep — `@timelessui/components` depends on
 * `@timelessui/core` and `@timelessui/color` through `workspace:*`, so they only ever ship together —
 * and the publish workflow triggers on the tag rather than on a manifest change. That leaves one way
 * to get it wrong: tag `0.2.0` while the manifests still say `0.1.0`, and publish something other than
 * what the tag names. A published version cannot be recalled, so this runs before the build.
 *
 * Private packages are skipped, because `pnpm publish -r` skips them too. Reading the workspace from
 * `pnpm ls` rather than a glob keeps the two definitions of "publishable" the same one.
 *
 *   node scripts/check-release-version.mjs 0.2.0
 *   node scripts/check-release-version.mjs v0.2.0   # a leading v is accepted and stripped
 */
import { execFileSync } from 'node:child_process'

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/

const tag = (process.argv[2] ?? '').trim()
if (tag === '') {
  fail('Pass the release tag, for example: node scripts/check-release-version.mjs 0.2.0')
}

const expected = tag.startsWith('v') ? tag.slice(1) : tag
if (!SEMVER.test(expected)) {
  fail(`The tag ${tag} is not a semantic version, so there is nothing to check it against.`)
}

const projects = JSON.parse(
  execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], { encoding: 'utf8' }),
)
const publishable = projects.filter((project) => project.private === false && project.name)
if (publishable.length === 0) {
  fail('No publishable workspace package found; pnpm publish would have nothing to do.')
}

const mismatched = publishable.filter((project) => project.version !== expected)
if (mismatched.length > 0) {
  fail(
    `Tag ${tag} does not match ${mismatched.length === 1 ? 'the version' : 'the versions'} it would publish:\n` +
      mismatched.map((project) => `  ${project.name} is ${project.version}`).join('\n') +
      `\nBump the manifests to ${expected}, or retag.`,
  )
}

console.log(
  `Tag ${tag} matches all ${publishable.length} publishable packages: ` +
    publishable.map((project) => project.name).join(', '),
)

function fail(message) {
  console.error(`Release version check failed: ${message}`)
  process.exit(1)
}
