export type IdFactory = (name?: string) => string

const globalIdOwner = {}
const idCounters = new WeakMap<object, Map<string, number>>()

export function createId(prefix = 'ui', ownerDocument?: Document): string {
  const normalizedPrefix = normalizeIdPart(prefix)
  const owner = ownerDocument ?? globalIdOwner
  let counters = idCounters.get(owner)
  if (!counters) {
    counters = new Map()
    idCounters.set(owner, counters)
  }
  const counter = (counters.get(normalizedPrefix) ?? 0) + 1
  counters.set(normalizedPrefix, counter)
  return `${normalizedPrefix}-${counter}`
}

export function createIdFactory(prefix = 'ui', ownerDocument?: Document): IdFactory {
  const normalizedPrefix = normalizeIdPart(prefix)
  let counter = 0

  return (name = 'item') => {
    if (ownerDocument)
      return createId(`${normalizedPrefix}-${normalizeIdPart(name)}`, ownerDocument)
    counter += 1
    return `${normalizedPrefix}-${normalizeIdPart(name)}-${counter}`
  }
}

export function ensureElementId(
  element: {
    id: string
  },
  id: string,
): string {
  if (!element.id) {
    element.id = id
  }

  return element.id
}

export function normalizeIdPart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'id'
}
