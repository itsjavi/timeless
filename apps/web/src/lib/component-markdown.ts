/**
 * The Markdown rendering of a component reference page, for coding agents and for anyone who wants
 * the contract without the chrome.
 *
 * The HTML page at `pages/docs/components/[slug].astro` and this module are two renderers over one
 * source: both read `documentedContracts`, `declarationsFor`, and `stylingFor`, and both take their
 * markup from `renderExample`. Neither derives a fact the other cannot. If a section is added to the
 * page, add it here — `validate-agent-surfaces.mjs` proves the route exists, not that it is complete.
 *
 * Descriptions are authored with backtick code spans, which is already Markdown, so nothing here
 * escapes or converts them. That is the whole reason this output is cheaper than the HTML page:
 * `inlineCode` and `inlineMarkdown` exist to undo Markdown for HTML, and here they are not needed.
 */
import type { TimelessExample } from '@timelessui/examples'
import { getExample, renderExample } from '@timelessui/examples'
import {
  declarationsFor,
  documentedContracts,
  registrationFor,
  stylingFor,
  type DocumentedContract,
} from './component-docs.ts'

/** Absolute, because this output is read outside the site and relative links would not resolve. */
const SITE = 'https://timeless.build'

const table = (headers: readonly string[], rows: readonly (readonly string[])[]): string[] =>
  rows.length === 0
    ? []
    : [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.join(' | ')} |`),
        '',
      ]

/** Table cells cannot contain a raw pipe or a line break without breaking the row. */
const cell = (text: string): string =>
  text
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim()

const code = (text: string): string => `\`${text}\``

const fence = (language: string, source: string): string[] => [
  '```' + language,
  source.trim(),
  '```',
  '',
]

/**
 * The authoring surface for one attribute, in the same three shapes the HTML page renders: a
 * permitted-value list, `presence` for a boolean, or free-form input of a named type.
 */
const attributeValues = (attribute: { values?: readonly string[]; type: string }): string => {
  if (attribute.values && attribute.values.length > 0) {
    return attribute.values.map(code).join(' · ')
  }
  return attribute.type === 'boolean' ? 'presence' : `any ${code(attribute.type)}`
}

const attributeDefault = (attribute: { default?: string; type: string }): string => {
  if (attribute.default !== undefined) return code(attribute.default)
  return attribute.type === 'boolean' ? 'absent' : '—'
}

/** Only label a contract's tables when the page documents more than one. */
const labelled = (contracts: readonly DocumentedContract[], label: string): string[] =>
  contracts.length > 1 ? [`**${label}**`, ''] : []

/**
 * Both `[slug].md.ts` and `llms-full.txt.ts` render every documented example, in one build process.
 * Without this the second route repeats all 45 renders, including re-reading each stylesheet in
 * `stylingFor`, for output that is byte-identical.
 */
const cache = new Map<string, Promise<string>>()

export function componentMarkdown(example: TimelessExample): Promise<string> {
  const cached = cache.get(example.id)
  if (cached) return cached
  const rendered = renderComponentMarkdown(example)
  cache.set(example.id, rendered)
  return rendered
}

async function renderComponentMarkdown(example: TimelessExample): Promise<string> {
  const contracts = documentedContracts(example.contracts)
  const declarations = declarationsFor(example.definitions)
  const styling = await stylingFor(example.styles, contracts)
  const enhanced = example.definitions.length > 0

  const registrations = example.definitions.map((tag) => registrationFor(tag))
  const imports = [
    ...example.styles.map((style) => `import '@timelessui/components/css/${style}'`),
    ...registrations.map((registration) => `import '${registration.sideEffect}'`),
  ].join('\n')

  const partContracts = contracts.filter(({ contract }) => contract.parts.length > 0)
  /** Per-item input authored on a part. Several contracts share `option`, so present each row once. */
  const partAttributes = [
    ...new Map(
      contracts.flatMap(({ contract }) =>
        contract.parts.flatMap((part) =>
          part.attributes.map(
            (attribute) => [`${part.name}:${attribute.name}`, { part, attribute }] as const,
          ),
        ),
      ),
    ).values(),
  ]
  const attributeContracts = contracts.filter(({ contract }) => contract.attributes.length > 0)
  const publicStates = [
    ...new Map(
      contracts.flatMap(({ contract }) =>
        contract.states
          .filter((state) => state.public)
          .map((state) => [`${state.name}:${state.description}`, state] as const),
      ),
    ).values(),
  ]
  const accessibility = contracts.filter(({ contract }) => contract.accessibility)
  const related = (example.related ?? []).flatMap((id) => getExample(id) ?? [])

  const lines: string[] = [
    `# ${example.title}`,
    '',
    `${example.description} ${enhanced ? '(Custom element.)' : '(CSS only.)'}`,
    '',
    `Reference: ${SITE}/docs/components/${example.id}/`,
    '',
  ]

  if (example.guidance) lines.push(`> **Choosing between components.** ${example.guidance}`, '')
  if (example.authoring) lines.push(`> **Markup you author.** ${example.authoring}`, '')

  lines.push('## Markup', '')
  lines.push(...fence('html', renderExample(example)))

  lines.push('## Install', '')
  lines.push(...fence('js', imports))

  if (enhanced) {
    lines.push(
      'A `register/` import is a side effect: it defines the element as the module evaluates, so it',
      'has to run in code the browser loads. To register explicitly instead — to control the timing,',
      'or to define into another window — call the function from the matching `define/` entry point,',
      'which registers nothing on its own:',
      '',
    )
    lines.push(
      ...fence(
        'js',
        registrations
          .map(
            (registration) =>
              `import { ${registration.export} } from '${registration.module}'\n${registration.export}()`,
          )
          .join('\n'),
      ),
    )
  }

  if (example.script) {
    lines.push('## Consumer wiring', '')
    lines.push(
      'This example needs the following plain JavaScript beyond custom-element registration.',
      '',
    )
    lines.push(...fence('js', example.script))
  }

  if (partContracts.length > 0) {
    lines.push('## Anatomy', '')
    lines.push(
      'Parts are authored in your own markup and identified by the selector below. Required parts',
      'must be present for the component to work. Private `data-ui-internal-*` hooks are written by',
      'the runtime and must never be authored.',
      '',
    )
    for (const { label, contract } of partContracts) {
      lines.push(...labelled(contracts, label))
      lines.push(
        ...table(
          ['Part', 'Required', 'Selector', 'Purpose'],
          contract.parts.map((part) => [
            code(part.name),
            part.required ? 'Yes' : 'No',
            code(part.selector),
            cell(part.description),
          ]),
        ),
      )
    }
    if (partAttributes.length > 0) {
      lines.push(
        'These parts also accept per-item input of their own. No stylesheet selects these',
        'attributes — the component reads them.',
        '',
      )
      lines.push(
        ...table(
          ['Part', 'Attribute', 'Description'],
          partAttributes.map(({ part, attribute }) => [
            code(part.name),
            code(attribute.name),
            cell(attribute.description),
          ]),
        ),
      )
    }
  }

  if (attributeContracts.length > 0) {
    lines.push('## Attributes', '')
    lines.push(
      'Every value below is implemented by the stylesheets this component ships. Boolean attributes',
      'are presence-based: author the attribute with no value, or omit it.',
      '',
    )
    for (const { label, contract } of attributeContracts) {
      lines.push(...labelled(contracts, label))
      lines.push(
        ...table(
          ['Attribute', 'Values', 'Default', 'Description'],
          contract.attributes.map((attribute) => [
            code(attribute.name),
            attributeValues(attribute),
            attributeDefault(attribute),
            cell(attribute.description),
          ]),
        ),
      )
    }
  }

  if (declarations.length > 0) {
    lines.push('## Element API', '')
    lines.push(
      'Attributes above are the authoring surface. These are the DOM properties and events the',
      'registered element adds once it upgrades.',
      '',
    )
    for (const declaration of declarations) {
      lines.push(`### \`<${declaration.tagName}>\``, '')
      const members = declaration.members ?? []
      if (members.length > 0) {
        lines.push(
          ...table(
            ['Property', 'Type', 'Notes'],
            members.map((member) => [
              code(member.name),
              code(member.type?.text ?? 'unknown'),
              member.attribute
                ? `Reflects the ${code(member.attribute)} attribute`
                : cell(member.description ?? ''),
            ]),
          ),
        )
      } else {
        lines.push('This element adds no public properties. Configure it with its attributes.', '')
      }
      const events = declaration.events ?? []
      if (events.length > 0) {
        lines.push(
          ...table(
            ['Event', 'Detail', 'Description'],
            events.map((event) => [
              code(event.name),
              code(event.type?.text ?? 'CustomEvent'),
              cell(event.description ?? ''),
            ]),
          ),
        )
      } else {
        lines.push('This element dispatches no component events.', '')
      }
    }
  }

  if (publicStates.length > 0) {
    lines.push('## State', '')
    lines.push(
      'Native attributes, ARIA, and platform pseudo-classes are authoritative. Style state through',
      'the selectors below rather than adding your own state classes.',
      '',
    )
    lines.push(
      ...table(
        ['State', 'Source', 'How to express it'],
        publicStates.map((state) => [code(state.name), state.source, cell(state.description)]),
      ),
    )
  }

  lines.push('## Styling', '')
  lines.push(
    `Root identity: ${contracts.map(({ contract }) => code(contract.root.name)).join(', ')}.`,
    `Required stylesheets: ${example.styles.map(code).join(', ')}.`,
    '',
  )
  if (styling.variables.length > 0) {
    lines.push('Set these custom properties to restyle the component:', '')
    lines.push(
      ...table(
        ['Custom property', 'Controls'],
        styling.variables.map((variable) => [code(variable.name), cell(variable.description)]),
      ),
    )
  } else {
    lines.push(
      `This component adds no custom properties of its own. Restyle it through the design tokens at ${SITE}/docs/styling/theming/ or your own CSS.`,
      '',
    )
  }
  if (styling.tokens.length > 0) {
    lines.push(
      `Design tokens this component reads (${styling.tokens.length}), global and set at the theme level: ${styling.tokens.map(code).join(', ')}.`,
      '',
    )
  }

  lines.push('## Accessibility', '')
  lines.push(
    'Keep the native elements, roles, and relationships shown in the markup. Timeless adds only the',
    'state and keyboard coordination the platform does not already provide, and it never supplies',
    'your accessible names — those depend on your content.',
    '',
  )
  /*
   * A component with no `accessibility()` block used to end the page here, on three generic lines
   * that told the reader nothing about *this* component. Saying what the absence means is more
   * useful than saying nothing, and it is also falsifiable: if a component grows a keyboard contract,
   * this paragraph stops being true and the block has to appear.
   */
  if (!accessibility.some(({ contract }) => contract.accessibility)) {
    lines.push(
      'This component declares no keyboard contract, because it has none of its own: the markup above',
      'is native elements and native ARIA, and everything a keyboard or a screen reader does with it',
      'comes from the platform. Nothing here manages focus, and nothing here adds a role you did not',
      'author. So the accessibility of this component is the accessibility of the markup — which is why',
      'the markup is the part worth copying exactly.',
      '',
    )
  }
  for (const { label, contract } of accessibility) {
    const a11y = contract.accessibility
    if (!a11y) continue
    lines.push(...labelled(accessibility, label))
    lines.push(
      a11y.pattern
        ? `Follows the [${a11y.patternLabel} pattern](https://www.w3.org/WAI/ARIA/apg/patterns/${a11y.pattern}/) from the ARIA Authoring Practices Guide.`
        : `The ARIA Authoring Practices Guide has no pattern for ${a11y.patternLabel}. The contract below is a composition of behavior the platform already defines, not ARIA invented to fill the gap.`,
      '',
    )
    if (a11y.keys.length > 0) {
      lines.push(
        ...table(
          ['Key', 'Action'],
          a11y.keys.map((entry) => [code(entry.key), cell(entry.action)]),
        ),
      )
    }
    if (a11y.notes) lines.push(cell(a11y.notes), '')
  }

  lines.push('## Before JavaScript runs', '')
  lines.push(
    enhanced
      ? 'The markup above is complete and usable on its own: native controls submit, labels associate, and authored ARIA is already correct. Registration adds state synchronisation, focus management, and keyboard coordination on top of it.'
      : 'This primitive is CSS only. There is nothing to register and nothing to wait for.',
    '',
  )

  for (const composition of related) {
    lines.push(`## ${composition.title}`, '')
    lines.push(composition.description, '')
    lines.push(...fence('html', renderExample(composition)))
    if (composition.script) lines.push(...fence('js', composition.script))
  }

  return `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
}
