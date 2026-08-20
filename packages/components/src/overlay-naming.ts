import { ensureElementId } from '@timelessui/core'

/**
 * The accessible name and description of an overlay surface, wired from authored anatomy.
 *
 * Dialog and Sheet both give a `<dialog>` dialog semantics, and a `role="dialog"` with no name is
 * the most common accessibility defect an overlay ships with. Until now both delegated naming to a
 * prose note, so every consumer hand-wrote a pair of ids and a pair of ARIA attributes.
 *
 * The relationship is all Timeless writes. The content stays the author's, and an authored
 * `aria-labelledby` or `aria-describedby` always wins: a consumer who pointed the panel at
 * something else meant it.
 */
export type NamedSurfaceLike = {
  hasAttribute(name: string): boolean
  setAttribute(name: string, value: string): void
}

export type SurfaceLabelLike = {
  id: string
}

export type SurfaceNamingParts = {
  readonly title?: SurfaceLabelLike | null
  readonly description?: SurfaceLabelLike | null
}

/**
 * A heading or paragraph in the panel `<header>` counts without a token, because that is the shape
 * both stylesheets have always drawn and asking for a token as well would be a second contract for
 * the same element. The explicit token is what a panel with no `<header>` uses.
 */
export const SURFACE_TITLE_SELECTOR = "[data-ui-part~='title'], header > :where(h1, h2, h3)"
export const SURFACE_DESCRIPTION_SELECTOR = "[data-ui-part~='description'], header > p"

export function nameSurfaceFromParts(
  surface: NamedSurfaceLike,
  parts: SurfaceNamingParts,
  generatedIdPrefix: string,
): void {
  relateSurface(surface, 'aria-labelledby', parts.title, `${generatedIdPrefix}-title`)
  relateSurface(surface, 'aria-describedby', parts.description, `${generatedIdPrefix}-description`)
}

function relateSurface(
  surface: NamedSurfaceLike,
  attribute: string,
  part: SurfaceLabelLike | null | undefined,
  generatedId: string,
): void {
  if (!part || surface.hasAttribute(attribute)) return
  surface.setAttribute(attribute, ensureElementId(part, generatedId))
}
