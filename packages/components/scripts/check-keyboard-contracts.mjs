/**
 * Every key a component declares must be pressed by a test.
 *
 * `accessibility().keys` is a public contract. It reaches consumers through the reference page,
 * `contracts.ts`, `llms-full.txt`, and the contract table inside the packaged agent skill — and until
 * milestone 030 nothing connected it to the code. Two things had drifted: a `Page Up / Page Down` row
 * shared by five collections that `collectionNavigationTarget` never handled, and a Checkbox Group
 * table of arrows and `Home`/`End` behind an element with no `keydown` handler at all.
 *
 * `validate-contracts.mjs` is the model for this: prove the declaration against the implementation
 * rather than reviewing it. The difference is that a keyboard contract cannot be proven by reading
 * CSS, so the evidence is a test that presses the key.
 *
 * The check is deliberately shallow. It does not know whether the assertion after the press is the
 * right one; it knows whether a press exists at all. That is enough to have caught both drifts, and a
 * deeper check would need to understand each pattern.
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { components } from './component-registry.mjs'

const repoRoot = resolve(import.meta.dirname, '../../..')
const packageRoot = resolve(import.meta.dirname, '..')

/**
 * Where a press can be evidence. Unit tests dispatch `KeyboardEvent`s at the enhancement helpers;
 * e2e specs press keys in a real browser. Both count.
 */
const SOURCES = [
  { root: resolve(packageRoot, 'src'), match: /\.test\.ts$/ },
  { root: resolve(repoRoot, 'apps/e2e/tests'), match: /\.spec\.ts$/ },
]

/**
 * A declared row names keys the way a reader wants them — `Arrow keys`, `Home / End`,
 * `Enter / Space`. This maps one row to the individual `KeyboardEvent.key` values that would prove
 * it. A row naming no recognisable key is a documentation row rather than a keyboard claim, and is
 * reported separately rather than silently passing.
 */
const KEY_ALIASES = new Map([
  ['arrow keys', ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']],
  ['arrow up', ['ArrowUp']],
  ['arrow down', ['ArrowDown']],
  ['arrow left', ['ArrowLeft']],
  ['arrow right', ['ArrowRight']],
  ['arrow up / arrow down', ['ArrowUp', 'ArrowDown']],
  ['arrow down / arrow up', ['ArrowDown', 'ArrowUp']],
  ['enter / space / arrow down', ['Enter', ' ', 'Space', 'ArrowDown']],
  ['context menu key', ['ContextMenu']],
  ['arrow left / arrow right', ['ArrowLeft', 'ArrowRight']],
  ['home / end', ['Home', 'End']],
  ['home', ['Home']],
  ['end', ['End']],
  ['page up / page down', ['PageUp', 'PageDown']],
  ['enter', ['Enter']],
  ['space', [' ', 'Space']],
  ['enter / space', ['Enter', ' ', 'Space']],
  ['escape', ['Escape']],
  ['tab', ['Tab']],
  ['shift + tab', ['Tab']],
  ['backspace', ['Backspace']],
  ['delete', ['Delete']],
  ['shift + f10', ['F10']],
  ['context menu', ['ContextMenu']],
  ['printable characters', ['__typeahead__']],
  ['a printable character', ['__typeahead__']],
  ['typing', ['__typeahead__']],
  ['paste', ['__paste__']],
])

const sources = []
for (const { root, match } of SOURCES) {
  for (const entry of await readdir(root, { recursive: true, withFileTypes: false })) {
    if (!match.test(entry)) continue
    sources.push({ path: entry, text: await readFile(resolve(root, entry), 'utf8') })
  }
}

/**
 * The keys pressed in one body of test source. Typing and pasting are matched by their own APIs
 * rather than by a key name, because that is how a test spells them.
 */
function pressedKeys(text) {
  const pressed = new Set()
  for (const match of text.matchAll(/press\(\s*['"`]([^'"`]+)['"`]/g)) {
    for (const part of match[1].split('+')) pressed.add(part.trim())
  }
  for (const match of text.matchAll(/key:\s*['"`]([^'"`]+)['"`]/g)) pressed.add(match[1].trim())
  /*
   * A quoted key name anywhere in the file. Unit tests here pass the key positionally —
   * `tabsNavigationTarget(tabs, 0, 'ArrowRight', 'horizontal')` — so requiring `press()` or `key:`
   * would report every navigation helper as untested.
   */
  for (const match of text.matchAll(
    /['"`](Arrow(?:Up|Down|Left|Right)|Home|End|PageUp|PageDown|Enter|Escape|Tab|Backspace|Delete|F10|ContextMenu)['"`]/g,
  )) {
    pressed.add(match[1])
  }
  if (/insertText|\.fill\(|\.type\(|pressSequentially/.test(text)) pressed.add('__typeahead__')
  if (/ClipboardEvent|'paste'|"paste"/.test(text)) pressed.add('__paste__')
  return pressed
}

/**
 * Evidence is scoped to the component, not to the repository.
 *
 * A global corpus would have missed the Checkbox Group drift entirely: arrows and `Home`/`End` are
 * pressed all over the suite, by Radio Group and Toolbar and Listbox, so the keys looked covered
 * while the element had no `keydown` handler at all. A file counts as evidence for a component when
 * it names that component's root, its element class, or its factory.
 */
/**
 * One file, split into its test blocks.
 *
 * Each block carries the file's `describe` titles prepended, because a component is often named
 * there rather than inside the block — and a block that mentions no component at all would otherwise
 * vouch for nothing.
 */
function blocksOf(source) {
  const describes = [...source.text.matchAll(/^\s*(?:test|describe)\.?[a-z]*\(\s*['"`]([^'"`]+)/gm)]
    .map((match) => match[1])
    .join('\n')
  const parts = source.text.split(/\n(?=\s*(?:test|it)[.(])/)
  return parts.map((part) => `${describes}\n${part}`)
}

function evidenceFor(component) {
  /*
   * Files that name the component's root, class, factory, or plain name.
   *
   * Deliberately generous: the e2e specs address components through story routes and `getByRole`
   * rather than by tag, so requiring the tag reports eleven tested keys as untested. The cost is that
   * a file covering two related collections vouches for both, which is what the `keydown` check below
   * exists to cover.
   */
  const needles = [
    component.root?.name,
    component.factory,
    component.classExport,
    component.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    component.name,
  ].filter(Boolean)
  const scoped = sources.filter((source) => needles.some((needle) => source.text.includes(needle)))
  /*
   * Per test block, not per file. A single spec file covering two related collections would otherwise
   * let a press meant for Toolbar prove a declared key for Menu — the same false-pass shape at file
   * granularity that the corpus-wide version had at repository granularity.
   */
  const pressed = new Set()
  for (const source of scoped) {
    for (const block of blocksOf(source)) {
      if (!needles.some((needle) => block.includes(needle))) continue
      for (const key of pressedKeys(block)) pressed.add(key)
    }
  }
  return { pressed, files: scoped.length }
}

const moduleSources = new Map()
for (const component of components) {
  if (!component.module || moduleSources.has(component.module)) continue
  moduleSources.set(
    component.module,
    await readFile(resolve(packageRoot, `src/${component.module}.ts`), 'utf8'),
  )
}

function handlesKeyDown(component) {
  return /@listen\(\s*'keydown'|addEventListener\(\s*'keydown'/.test(
    moduleSources.get(component.module) ?? '',
  )
}

const unproven = []
const unrecognised = []
const unhandled = []

/**
 * Keys that can only work if the component listens for them.
 *
 * Arrows, `Home`, `End`, and the page keys are never delivered by the platform to a roving-focus
 * collection — something has to handle `keydown`. Checkbox Group declared all of them behind an
 * element that had no `keydown` handler at all, and the press check above could not see it: a file
 * covering two related collections presses arrows for the other one.
 */
const NAVIGATION_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])

for (const component of components) {
  if (!component.accessibility?.keys?.length) continue
  const { pressed, files } = evidenceFor(component)
  if (files === 0) {
    unproven.push(`${component.name}: declares keys and no test file mentions the component at all`)
    continue
  }

  for (const row of component.accessibility.keys) {
    /*
     * A row that says the platform owns the key is not a claim about this component's code — the
     * split between `keys` and `notes` is documented in the registry, and this is the one place a
     * `keys` row is allowed to describe something Timeless does not implement.
     */
    if (/not by Timeless|Handled by the native|come from the platform/i.test(row.action)) continue

    const aliases = KEY_ALIASES.get(row.key.trim().toLowerCase())
    if (!aliases) {
      unrecognised.push(`${component.name}: ${row.key}`)
      continue
    }
    if (!aliases.some((alias) => pressed.has(alias))) {
      unproven.push(`${component.name}: "${row.key}" — no test presses ${aliases.join(' or ')}`)
    }
    if (aliases.some((alias) => NAVIGATION_KEYS.has(alias)) && !handlesKeyDown(component)) {
      unhandled.push(
        `${component.name}: "${row.key}" needs a keydown handler and src/${component.module}.ts has none`,
      )
    }
  }
}

if (unhandled.length > 0) {
  console.error(
    `Navigation keys declared by a component whose module never listens for keydown:\n  ${unhandled.join('\n  ')}`,
  )
}
if (unrecognised.length > 0) {
  console.error(
    `Keyboard contract rows naming no recognisable key. Add the spelling to KEY_ALIASES in ${'scripts/check-keyboard-contracts.mjs'}, or reword the row:\n  ${unrecognised.join('\n  ')}`,
  )
}
if (unproven.length > 0) {
  console.error(
    `Declared keys that no test presses. Implement and test the key, or move it to \`notes\` if the platform provides it:\n  ${unproven.join('\n  ')}`,
  )
}
if (unrecognised.length > 0 || unproven.length > 0 || unhandled.length > 0) {
  process.exitCode = 1
} else {
  const rows = components.reduce(
    (total, component) => total + (component.accessibility?.keys?.length ?? 0),
    0,
  )
  console.log(
    `Proved ${rows} declared keyboard rows against ${sources.length} test files, scoped per test block.`,
  )
}
