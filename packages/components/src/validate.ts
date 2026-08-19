import {
  componentContracts,
  type ComponentAttributeContract,
  type ComponentName,
} from './contracts'

/**
 * Development-time check that authored markup matches the component contracts.
 *
 * Timeless configuration is plain attributes, which means a typo is silent: `data-ui-varaint` and
 * `data-ui-variant="primry"` both parse, both render, and both simply do nothing. Type checking
 * catches that in TypeScript, but not in a `.html` file, a server-rendered template, or a string of
 * markup assembled at runtime. This walks real DOM and reports what the stylesheets cannot.
 *
 * Opt-in, and deliberately absent from the default entrypoint:
 *
 * ```ts
 * if (import.meta.env.DEV) {
 *   const { validateTimelessMarkup } = await import('@timelessui/components/validate')
 *   validateTimelessMarkup()
 * }
 * ```
 */

/**
 * The shape this walker needs from an element. Real DOM satisfies it, and so does a plain object, so
 * the check is testable without a DOM environment — the same approach every other module here takes.
 */
export type ValidatableElement = {
  readonly tagName: string
  readonly className: string
  readonly attributes: {
    readonly length: number
    item(index: number): { readonly name: string; readonly value: string } | null
  }
}

export type ValidatableRoot = {
  querySelectorAll(selectors: string): {
    readonly length: number
    item(index: number): ValidatableElement | null
  }
}

export type TimelessMarkupProblem = {
  /** The element carrying the problem, so a console report can be clicked through to it. */
  readonly element: ValidatableElement
  /** Contract the element's root class or tag resolved to. */
  readonly component: ComponentName
  readonly attribute: string
  /** Absent when the attribute itself is unknown rather than its value. */
  readonly value?: string
  readonly message: string
}

export type ValidateTimelessMarkupOptions = {
  /** Subtree to walk. Defaults to the ambient `document`. */
  readonly root?: ValidatableRoot
  /** Set to `false` to collect problems without writing them to the console. */
  readonly log?: boolean
}

/**
 * Roots are indexed by kind, not by name. `ui-select` is both a class root — the styled native
 * `<select>` — and the tag of the enhanced element, and they are different contracts with different
 * attributes.
 */
const classRoots = new Map<string, ComponentName>()
const elementRoots = new Map<string, ComponentName>()
for (const [name, contract] of Object.entries(componentContracts)) {
  const index = contract.root.kind === 'class' ? classRoots : elementRoots
  if (!index.has(contract.root.name)) index.set(contract.root.name, name as ComponentName)
}

/**
 * Reports every public `data-ui-*` attribute that no contract declares, and every declared attribute
 * carrying a value outside its permitted set.
 *
 * Returns the problems it found, so a test can assert on them instead of reading the console.
 */
export function validateTimelessMarkup(
  options: ValidateTimelessMarkupOptions = {},
): TimelessMarkupProblem[] {
  const root = options.root ?? (globalThis.document as unknown as ValidatableRoot | undefined)
  const log = options.log ?? true
  if (!root) throw new Error('validateTimelessMarkup needs a root: there is no ambient document')
  const problems: TimelessMarkupProblem[] = []

  const elements = root.querySelectorAll('*')
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements.item(index)
    if (!element) continue
    const component = resolveComponent(element)
    if (!component) continue
    const contract = componentContracts[component]
    // `componentContracts` is `as const`, so each attribute has its own literal type and only some
    // carry `values`. Widen to the contract type before searching.
    const declared: readonly ComponentAttributeContract[] = contract.attributes

    for (let position = 0; position < element.attributes.length; position += 1) {
      const attributeNode = element.attributes.item(position)
      if (!attributeNode) continue
      const { name, value } = attributeNode
      if (!name.startsWith('data-ui-')) continue
      // `data-ui-part` is authored anatomy, and internal hooks are written by the elements
      // themselves. Neither is configuration on this root.
      if (name === 'data-ui-part' || name.startsWith('data-ui-internal-')) continue

      const attribute = declared.find((candidate) => candidate.name === name)
      if (!attribute) {
        problems.push({
          element,
          component,
          attribute: name,
          message: `${contract.root.name} has no ${name} attribute. Declared: ${list(declared.map((candidate) => candidate.name))}.`,
        })
        continue
      }
      if (attribute.type === 'boolean') {
        if (value !== '') {
          problems.push({
            element,
            component,
            attribute: name,
            value,
            message: `${name} is presence-based on ${contract.root.name}. Author it with no value.`,
          })
        }
        continue
      }
      if (attribute.values && !attribute.values.includes(value)) {
        problems.push({
          element,
          component,
          attribute: name,
          value,
          message: `${name}="${value}" is not permitted on ${contract.root.name}. Permitted: ${list(attribute.values)}.`,
        })
      }
    }
  }

  if (log && problems.length > 0) {
    for (const problem of problems) console.warn(`[timeless] ${problem.message}`, problem.element)
  }
  return problems
}

/**
 * The nearest contract this element is a root of.
 *
 * An element can carry several `ui-*` classes — Toggle is authored as `class="ui-button ui-toggle"`
 * — so the most specific matching contract wins, which is the last class that resolves.
 */
function resolveComponent(element: ValidatableElement): ComponentName | null {
  const tag = element.tagName.toLowerCase()
  const asElement = elementRoots.get(tag)
  if (asElement) return asElement

  let resolved: ComponentName | null = null
  for (const className of element.className.split(/\s+/)) {
    const component = classRoots.get(className)
    if (component) resolved = component
  }
  return resolved
}

function list(values: readonly string[]): string {
  return values.map((value) => `\`${value}\``).join(', ')
}
