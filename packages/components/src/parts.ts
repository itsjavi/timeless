export function queryOwnedPart<TElement extends Element>(
  root: Element,
  selector: string,
): TElement | null {
  return queryOwnedParts<TElement>(root, selector)[0] ?? null
}

export function queryOwnedParts<TElement extends Element>(
  root: Element,
  selector: string,
): TElement[] {
  return Array.from(root.querySelectorAll<TElement>(selector)).filter((candidate) =>
    isOwnedBy(root, candidate),
  )
}

export function isOwnedBy(root: Element, candidate: Element): boolean {
  let ancestor = candidate.parentElement
  while (ancestor && ancestor !== root) {
    if (isComponentRoot(ancestor)) return false
    ancestor = ancestor.parentElement
  }
  return ancestor === root
}

function isComponentRoot(element: Element): boolean {
  if (element.localName.startsWith('ui-')) return true
  return Array.from(element.classList).some((className) => className.startsWith('ui-'))
}
