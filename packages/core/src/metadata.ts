export type AttributeKind = 'string' | 'boolean' | 'number'

export type AttributeDefinition = {
  readonly property: string
  readonly attribute: string
  readonly kind: AttributeKind
}

export type WatchDefinition = {
  readonly properties: readonly string[]
  readonly method: string
  readonly immediate: boolean
}

export type QueryDefinition = {
  readonly property: string
  readonly selector: string
  readonly multiple: boolean
}

export type ListenerDefinition = {
  readonly method: string
  readonly event: string
  readonly options?: AddEventListenerOptions
}

export type ElementMetadata = {
  elementName?: string
  attributes: AttributeDefinition[]
  properties: string[]
  watchers: WatchDefinition[]
  queries: QueryDefinition[]
  listeners: ListenerDefinition[]
}

export type MetadataConstructor = Function & {
  elementName?: string
  observedAttributes?: readonly string[]
  [Symbol.metadata]?: DecoratorMetadata | null
}

const symbolConstructor = globalThis.Symbol as SymbolConstructor & { metadata?: symbol }
const metadataKey = symbolConstructor.for('@timelessui/core:metadata')

if (!symbolConstructor.metadata) {
  Object.defineProperty(symbolConstructor, 'metadata', {
    configurable: false,
    enumerable: false,
    value: symbolConstructor.for('Symbol.metadata'),
    writable: false,
  })
}

export function defineElementMetadata(metadata: DecoratorMetadata): ElementMetadata {
  if (!metadata) {
    throw new Error(
      'Decorator metadata is unavailable. Load @timelessui/core before decorators run.',
    )
  }

  const store = metadata as Record<PropertyKey, unknown>
  const existing = store[metadataKey] as ElementMetadata | undefined
  if (existing) return existing

  const created: ElementMetadata = {
    attributes: [],
    properties: [],
    watchers: [],
    queries: [],
    listeners: [],
  }
  store[metadataKey] = created
  return created
}

export function readElementMetadata(constructor: MetadataConstructor): ElementMetadata {
  const metadata = constructor[Symbol.metadata] as Record<PropertyKey, unknown> | null | undefined
  const stored = metadata?.[metadataKey] as ElementMetadata | undefined
  return (
    stored ?? {
      attributes: [],
      properties: [],
      watchers: [],
      queries: [],
      listeners: [],
    }
  )
}

export function addUniqueProperty(metadata: ElementMetadata, property: string): void {
  if (!metadata.properties.includes(property)) metadata.properties.push(property)
}

export function addUniqueAttribute(
  metadata: ElementMetadata,
  definition: AttributeDefinition,
): void {
  const existing = metadata.attributes.find(
    (candidate) =>
      candidate.property === definition.property || candidate.attribute === definition.attribute,
  )
  if (!existing) {
    metadata.attributes.push(definition)
  }
}

export function toAttributeName(property: string): string {
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}
