import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  uiTokens,
  componentContracts,
  type ComponentContract,
  type ComponentName,
} from '@timelessui/components'

type ManifestAttribute = { name: string; type?: { text?: string }; description?: string }
type ManifestEvent = { name: string; type?: { text?: string }; description?: string }
type ManifestMember = {
  kind: 'field' | 'method'
  name: string
  attribute?: string
  type?: { text?: string }
  description?: string
}
type ManifestRegistration = { sideEffect: string; module: string; export: string }
type ManifestDeclaration = {
  name: string
  tagName?: string
  attributes?: ManifestAttribute[]
  members?: ManifestMember[]
  events?: ManifestEvent[]
  description?: string
  'timeless:registration'?: ManifestRegistration
}
type Manifest = { modules: { declarations?: ManifestDeclaration[] }[] }

const manifest = JSON.parse(
  await readFile(resolve(process.cwd(), '../../packages/components/custom-elements.json'), 'utf8'),
) as Manifest

const declarations = manifest.modules.flatMap((module) => module.declarations ?? [])

export function declarationsFor(tags: readonly string[]): ManifestDeclaration[] {
  return tags.flatMap(
    (tag) => declarations.find((declaration) => declaration.tagName === tag) ?? [],
  )
}

/**
 * The two registration entry points for a tag, as the generated manifest declares them.
 *
 * Read rather than derived: `defineOtpFieldElement` is a public export name, and rebuilding it from
 * `ui-otp-field` here would be a second declaration of it that nothing proves.
 */
export function registrationFor(tag: string): ManifestRegistration {
  const registration = declarations.find((declaration) => declaration.tagName === tag)?.[
    'timeless:registration'
  ]
  if (!registration) {
    throw new Error(`No registration entry points declared for ${tag} in custom-elements.json`)
  }
  return registration
}

export type DocumentedContract = {
  readonly name: ComponentName
  readonly contract: ComponentContract
  /** `ui-button` for a CSS component, `<ui-tabs>` for a custom element. */
  readonly label: string
}

/**
 * The contracts a component page documents, taken from the example's explicit `contracts` list.
 *
 * Deriving this from shared stylesheets is what made the Popover page present Hover Card's
 * `open-delay` as its own, so the link is declared in the catalog and validated there.
 */
export function documentedContracts(names: readonly ComponentName[]): DocumentedContract[] {
  return names.map((name) => {
    const contract = componentContracts[name] as ComponentContract
    return {
      name,
      contract,
      label: contract.root.kind === 'element' ? `<${contract.root.name}>` : contract.root.name,
    }
  })
}

/**
 * The two tiers every component imports and none of them is described by: `tokens.css` is the layer
 * order and `color-scheme`, and `themes/atmosphere/tokens.css` is the token values. Reading either as
 * "properties this component uses" would list the whole theme on every page.
 */
const GLOBAL_STYLESHEETS = new Set(['tokens.css', 'themes/atmosphere/tokens.css'])

export type ComponentStyling = {
  /** Custom properties a consumer may set, declared per component. */
  readonly variables: readonly { name: string; description: string; owner: string }[]
  /** Global Atmosphere tokens these stylesheets read, documented once in the theming guide. */
  readonly tokens: readonly string[]
  /** Component-scoped properties the stylesheets use that no contract declares yet. */
  readonly undeclared: readonly string[]
}

/**
 * Splits the custom properties a component's stylesheets touch into the ones a consumer sets and
 * the global tokens the component merely reads. A single flat list cannot answer "what may I
 * override?", which is the only question this section exists for.
 */
export async function stylingFor(
  styles: readonly string[],
  contracts: readonly DocumentedContract[],
): Promise<ComponentStyling> {
  const source = (
    await Promise.all(
      styles
        .filter((style) => !GLOBAL_STYLESHEETS.has(style))
        .map((style) =>
          readFile(resolve(process.cwd(), '../../packages/components/src/css', style), 'utf8'),
        ),
    )
  ).join('\n')

  const used = new Set(source.match(/--ui-[a-z0-9-]+/g) ?? [])
  const variables = contracts.flatMap(({ contract, label }) =>
    contract.variables.map((variable) => ({ ...variable, owner: label })),
  )
  const declared = new Set(variables.map((variable) => variable.name))
  const globals = new Set<string>(uiTokens)

  return {
    variables,
    tokens: [...used].filter((name) => globals.has(name)).sort(),
    undeclared: [...used].filter((name) => !globals.has(name) && !declared.has(name)).sort(),
  }
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

/**
 * Contract descriptions are authored with backtick code spans so they read well in the registry, in
 * editor tooling, and in the manifest. Tables render them as HTML, so escape first, then convert.
 *
 * Emphasis is converted for the same reason: the registry prose is Markdown, the `.md` routes serve
 * it verbatim, and this is the surface that has to catch up. Without it the HTML page printed the
 * asterisks — Context Menu's note has said `**This is the one Timeless component with no
 * no-JavaScript fallback**`, literally, since it was written.
 */
export function inlineCode(text: string): string {
  return withEmphasis(
    text
      .replace(/[&<>"]/g, (character) => HTML_ESCAPES[character] ?? character)
      .replace(/`([^`]+)`/g, '<code>$1</code>'),
  )
}

/**
 * `**strong**` and `*em*`, applied only to the text between tags, so an asterisk inside a code span
 * or an already-built `<a>` label is left as the author wrote it.
 */
function withEmphasis(html: string): string {
  return html
    .split(/(<[^>]+>[^<]*<\/(?:code|a)>|<[^>]+>)/)
    .map((segment) =>
      segment.startsWith('<')
        ? segment
        : segment
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>'),
    )
    .join('')
}

/** `inlineCode` plus Markdown links, for the short guidance notes authored in the catalog. */
export function inlineMarkdown(text: string): string {
  return inlineCode(text).replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, href: string) => `<a href="${href}">${label}</a>`,
  )
}
