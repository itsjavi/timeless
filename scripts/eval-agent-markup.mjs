/**
 * Advisory eval: does an agent given only `/llms.txt` and the skill write markup the contracts accept?
 *
 * This is the measurement milestone 027 is ultimately about. It is deliberately **not** part of
 * `pnpm qa`: a model call is nondeterministic and needs a key, and a gate that fails for reasons
 * outside the repository trains people to ignore gates. The deterministic half — `checkMarkup`, which
 * decides whether markup satisfies a contract — is gated, by unit tests in `packages/components` and
 * by the canonical-example sweep in `packages/examples/scripts/validate.mjs`.
 *
 * Run it by hand when the grammar preamble or the skill changes:
 *
 *   ANTHROPIC_API_KEY=... node scripts/eval-agent-markup.mjs
 *   ANTHROPIC_API_KEY=... node scripts/eval-agent-markup.mjs --count 12 --model claude-sonnet-5
 *
 * Skips with exit code 0 and an explanation when no key is present, so it is safe to wire into a
 * scheduled job without breaking unattended runs.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { examples } from '../packages/examples/src/catalog.ts'
import { checkMarkup } from '../packages/components/scripts/check-markup.mjs'

const root = resolve(import.meta.dirname, '..')
const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  console.log('ANTHROPIC_API_KEY is not set. Skipping the advisory agent eval.')
  process.exit(0)
}

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback)
}

const model = argument('model', 'claude-sonnet-5')
const count = Number(argument('count', '8'))

/**
 * The context under test is exactly what a consumer's agent would have: the grammar preamble and index
 * from `/llms.txt`, plus the packaged skill. Component pages are deliberately withheld — the question
 * is whether the cheap always-loaded context is enough, not whether the full contract is correct.
 */
const llmsTxt = await readFile(resolve(root, 'apps/web/dist/llms.txt'), 'utf8').catch(() => {
  throw new Error('No apps/web/dist/llms.txt. Run pnpm -F @apps/web run build first.')
})
const skill = await readFile(
  resolve(root, 'packages/components/skills/using-timeless-ui/SKILL.md'),
  'utf8',
)
const contractsReference = await readFile(
  resolve(root, 'packages/components/skills/using-timeless-ui/reference/contracts.md'),
  'utf8',
)

/* Spread across groups so the sample is not eight variations on a button. */
const subjects = []
const seenGroups = new Set()
for (const example of examples.filter((item) => item.domain !== 'recipes')) {
  if (subjects.length >= count) break
  if (seenGroups.has(example.group)) continue
  seenGroups.add(example.group)
  subjects.push(example)
}
for (const example of examples.filter((item) => item.domain !== 'recipes')) {
  if (subjects.length >= count) break
  if (!subjects.includes(example)) subjects.push(example)
}

const system = [
  'You are writing production HTML for a project that uses the Timeless UI library.',
  'The reference material below is everything you have. Follow it exactly.',
  'Reply with only the HTML for the requested component. No prose, no markdown fences.',
  '',
  '# /llms.txt',
  llmsTxt,
  '',
  '# Skill: using-timeless-ui',
  skill,
  '',
  '# Contract reference',
  contractsReference,
].join('\n')

async function ask(example) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system,
      messages: [
        {
          role: 'user',
          content: `Write the markup for a Timeless "${example.title}" (${example.description}). Use the component's real contract: correct root, correct configuration attributes, and every required part.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${await response.text()}`)
  }
  const body = await response.json()
  return body.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
}

const results = []
for (const example of subjects) {
  const markup = (await ask(example)).replace(/^```[a-z]*\n?|```$/g, '').trim()
  const findings = checkMarkup(markup)
  results.push({ id: example.id, findings })
  const label = findings.length === 0 ? 'pass' : `${findings.length} finding(s)`
  console.log(`${findings.length === 0 ? '✓' : '✗'} ${example.id.padEnd(20)} ${label}`)
  for (const finding of findings) console.log(`    ${finding.kind}: ${finding.message}`)
}

const clean = results.filter((result) => result.findings.length === 0).length
const byKind = new Map()
for (const result of results) {
  for (const finding of result.findings) {
    byKind.set(finding.kind, (byKind.get(finding.kind) ?? 0) + 1)
  }
}

console.log(
  `\n${clean}/${results.length} components authored with no contract findings (${model}).`,
)
if (byKind.size > 0) {
  console.log('Findings by kind:')
  for (const [kind, total] of [...byKind].sort((left, right) => right[1] - left[1])) {
    console.log(`  ${total.toString().padStart(3)}  ${kind}`)
  }
  console.log('\nEach kind points at a rule the preamble or the skill states too weakly.')
}
