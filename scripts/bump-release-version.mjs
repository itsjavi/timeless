/**
 * Bumps every publishable manifest to one version, then records it as one commit and one tag.
 *
 * The three published packages ship in lockstep, so a release is a single fact about the whole
 * repository rather than a per-package decision: `@timelessui/components` depends on
 * `@timelessui/core` and `@timelessui/color` through `workspace:*`, and the publish workflow triggers
 * on a `*.*.*` tag. That is why this writes one commit and one annotated tag for the set — a tag per
 * package would fire the same workflow several times over the same commit — and why the tag carries
 * no leading `v`: the workflow's trigger pattern does not match one.
 *
 * A version is not only a manifest field: `web-types.json` is generated from
 * `@timelessui/components`'s version, so rewriting the manifests alone leaves the generated output
 * stale and `pnpm build` fails on `generate:check` — after the tag exists. So the bump regenerates and
 * commits that output in the same commit, and the release commit is self-consistent by construction.
 *
 * The working tree has to be clean, because the tag names the commit that gets published, and a
 * published version cannot be recalled. That precondition is also what makes staging everything safe
 * here: whatever is dirty after the rewrite and the regeneration is this script's own work, so there
 * is nothing else to sweep up. Nothing is pushed; the push is what starts the release, so it stays a
 * deliberate second step. `check-release-version.mjs` runs against the rewritten manifests before the
 * commit exists, so this can never produce a tag that gate would reject.
 *
 * Private packages are left alone, for the same reason the check skips them: `pnpm publish -r` skips
 * them too. Reading the workspace from `pnpm ls` keeps "publishable" one definition, not two.
 *
 *   node scripts/bump-release-version.mjs 0.2.0     # an explicit version
 *   node scripts/bump-release-version.mjs minor     # major | minor | patch, from the current one
 *   node scripts/bump-release-version.mjs patch --dry-run
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/
const RELEASE_ONLY = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const INCREMENTS = ['major', 'minor', 'patch']

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const positional = args.filter((arg) => !arg.startsWith('--'))
const unknownFlags = args.filter((arg) => arg.startsWith('--') && arg !== '--dry-run')

if (unknownFlags.length > 0) {
  fail(`Unknown ${unknownFlags.length === 1 ? 'flag' : 'flags'}: ${unknownFlags.join(', ')}`)
}
if (positional.length !== 1) {
  fail(
    'Pass one version or increment, for example:\n' +
      '  node scripts/bump-release-version.mjs 0.2.0\n' +
      '  node scripts/bump-release-version.mjs minor',
  )
}

const request = positional[0].trim()
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const publishable = JSON.parse(
  execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], { encoding: 'utf8' }),
).filter((project) => project.private === false && project.name)

if (publishable.length === 0) {
  fail('No publishable workspace package found; there is nothing to bump.')
}

const currentVersions = [...new Set(publishable.map((project) => project.version))]
const target = resolveTarget(request, currentVersions)

if (!SEMVER.test(target)) {
  fail(`${target} is not a semantic version.`)
}
if (currentVersions.length === 1 && currentVersions[0] === target) {
  fail(`Every publishable package is already ${target}, so the commit would be empty.`)
}

const dirty = git(['status', '--porcelain'])
if (dirty !== '' && !dryRun) {
  fail(
    'The working tree is not clean. The tag names the commit that gets published, so commit or stash first:\n' +
      dirty
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n'),
  )
}
if (tagExists(target)) {
  fail(`Tag ${target} already exists. Delete it, or pick another version.`)
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
const rewrites = publishable.map((project) => {
  const manifestPath = join(project.path, 'package.json')
  const before = readFileSync(manifestPath, 'utf8')
  const after = before.replace(/"version":\s*"[^"]*"/, `"version": "${target}"`)

  if (JSON.parse(after).version !== target) {
    fail(`Could not rewrite the version field in ${relative(repoRoot, manifestPath)}.`)
  }

  return {
    name: project.name,
    from: project.version,
    path: manifestPath,
    relativePath: relative(repoRoot, manifestPath),
    contents: after,
  }
})

console.log(
  `${dryRun ? 'Would bump' : 'Bumping'} ${rewrites.length} publishable packages to ${target}:`,
)
for (const rewrite of rewrites) {
  console.log(`  ${rewrite.name}  ${rewrite.from} → ${target}  (${rewrite.relativePath})`)
}

if (dryRun) {
  console.log(
    `\nWould then regenerate, commit "chore(release): ${target}" on ${branch}, and tag it ${target}.`,
  )
  process.exit(0)
}

for (const rewrite of rewrites) {
  writeFileSync(rewrite.path, rewrite.contents)
}

/*
 * `web-types.json` carries the version of the package it describes, so it drifts the moment the
 * manifest does. `--if-present` rather than a named package because a second generated surface should
 * be covered the day it lands, not the day a release breaks on it.
 */
try {
  execFileSync('pnpm', ['-r', '--if-present', 'run', 'generate'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })
} catch (error) {
  revert()
  fail(`Could not regenerate after the bump, so nothing was committed: ${message(error)}`)
}

// The same gate the publish workflow runs, against the manifests as they now stand — so a tag this
// script creates is one that gate accepts.
try {
  execFileSync('node', [join(repoRoot, 'scripts/check-release-version.mjs'), target], {
    stdio: 'inherit',
  })
} catch {
  revert()
  fail('The release version check rejected the rewritten manifests; nothing was committed.')
}

git(['add', '-A'])

/*
 * `pnpm run` verifies node_modules against the lockfile before it runs anything, and will install to
 * reconcile them. The publishable packages depend on each other through `workspace:*` links, which the
 * lockfile records without a version, so a bump has no business changing it — a staged lockfile means
 * the install resolved something unrelated, and it must not ride along in a release commit.
 */
if (git(['diff', '--cached', '--name-only']).split('\n').includes('pnpm-lock.yaml')) {
  revert()
  fail(
    'Regenerating changed pnpm-lock.yaml, which a version bump never should. Run `pnpm install`,\n' +
      'commit the lockfile on its own, and bump again.',
  )
}

try {
  git(['commit', '-m', `chore(release): ${target}`])
} catch (error) {
  revert()
  fail(`Could not create the release commit: ${message(error)}`)
}

try {
  git(['tag', '-a', target, '-m', `Release ${target}`])
} catch (error) {
  fail(
    `Committed the bump, but could not create tag ${target}: ${message(error)}\n` +
      `Tag it by hand with: git tag -a ${target} -m "Release ${target}"`,
  )
}

const committed = git(['show', '--name-only', '--format=', 'HEAD'])
  .split('\n')
  .filter((line) => line !== '')

console.log(
  `\nCommitted chore(release): ${target} on ${branch}, tagged ${target}:\n` +
    committed.map((path) => `  ${path}`).join('\n') +
    `\nNothing is pushed yet. Pushing the tag starts the publish:\n` +
    `  git push origin ${branch} && git push origin ${target}`,
)

function resolveTarget(input, versions) {
  if (!INCREMENTS.includes(input)) {
    return input.startsWith('v') ? input.slice(1) : input
  }

  if (versions.length > 1) {
    fail(
      `A ${input} bump needs one current version to count from, but the manifests disagree:\n` +
        publishable.map((p) => `  ${p.name} is ${p.version}`).join('\n') +
        '\nPass an explicit version to reconcile them.',
    )
  }

  const current = versions[0]
  if (!RELEASE_ONLY.test(current)) {
    fail(
      `The current version ${current} is not a plain x.y.z, so pass the next version explicitly.`,
    )
  }

  const [major, minor, patch] = current.split('.').map(Number)
  if (input === 'major') return `${major + 1}.0.0`
  if (input === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

/*
 * Bounded by the clean-tree precondition: nothing was modified, staged, or untracked before this
 * script wrote anything, so this restores the tree to the commit it started from and no further.
 * `clean -fd` without `-x` leaves ignored files, which the precondition never covered, alone.
 */
function revert() {
  git(['reset', '-q'])
  git(['checkout', '-q', '--', '.'])
  git(['clean', '-qfd'])
}

function tagExists(tag) {
  try {
    git(['rev-parse', '-q', '--verify', `refs/tags/${tag}`])
    return true
  } catch {
    return false
  }
}

function git(argv) {
  return execFileSync('git', argv, { cwd: repoRoot, encoding: 'utf8' }).trim()
}

function message(error) {
  return (error?.stderr || error?.message || String(error)).trim()
}

function fail(text) {
  console.error(`Release bump failed: ${text}`)
  process.exit(1)
}
