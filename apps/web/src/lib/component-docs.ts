import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  atmosphereTokens,
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
type ManifestDeclaration = {
  name: string
  tagName?: string
  attributes?: ManifestAttribute[]
  members?: ManifestMember[]
  events?: ManifestEvent[]
  description?: string
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
        .filter((style) => style !== 'tokens.css')
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
  const globals = new Set<string>(atmosphereTokens)

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
 */
export function inlineCode(text: string): string {
  return text
    .replace(/[&<>"]/g, (character) => HTML_ESCAPES[character] ?? character)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

/** `inlineCode` plus Markdown links, for the short guidance notes authored in the catalog. */
export function inlineMarkdown(text: string): string {
  return inlineCode(text).replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, href: string) => `<a href="${href}">${label}</a>`,
  )
}
