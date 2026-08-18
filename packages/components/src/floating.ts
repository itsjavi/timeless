export const floatingPlacements = ['bottom', 'top', 'right', 'left'] as const

export type FloatingPlacement = (typeof floatingPlacements)[number]

export type FloatingElementLike = {
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type FloatingRuntimeElement = HTMLElement & FloatingElementLike

export type FloatingHostLike = {
  setAttribute(name: string, value: string): void
}

export type FloatingAnchorParts = {
  readonly host: FloatingHostLike
  readonly trigger: FloatingElementLike
  readonly content: FloatingElementLike
}

export type FloatingAnchorOptions = {
  readonly anchorName: string
}

export type FloatingPositionOptions = {
  readonly content: FloatingRuntimeElement
  readonly offset?: number
  readonly placement: FloatingPlacement
  readonly trigger: FloatingRuntimeElement
  readonly viewportPadding?: number
}

type FloatingRect = {
  readonly blockSize: number
  readonly inlineSize: number
  readonly x: number
  readonly y: number
}

type FloatingCandidate = {
  readonly placement: FloatingPlacement
  readonly x: number
  readonly y: number
}

const DEFAULT_FLOATING_OFFSET = 6
const DEFAULT_VIEWPORT_PADDING = 8
const FLOATING_ANCHOR_PROPERTY = '--ui-floating-anchor'
const FLOATING_LEFT_PROPERTY = '--ui-floating-left'
const FLOATING_TOP_PROPERTY = '--ui-floating-top'

export function isFloatingPlacement(value: string): value is FloatingPlacement {
  return floatingPlacements.includes(value as FloatingPlacement)
}

export function resolveFloatingPlacement(value: string | null): FloatingPlacement {
  return value && isFloatingPlacement(value) ? value : 'bottom'
}

export function syncFloatingAnchor(
  parts: FloatingAnchorParts,
  options: FloatingAnchorOptions,
): void {
  parts.trigger.style.setProperty(FLOATING_ANCHOR_PROPERTY, options.anchorName)
  parts.trigger.setAttribute('data-ui-internal-floating-anchor', '')
  parts.content.style.setProperty(FLOATING_ANCHOR_PROPERTY, options.anchorName)
  parts.content.setAttribute('data-ui-internal-floating-content', '')
}

export function applyFloatingPosition(options: FloatingPositionOptions): FloatingPlacement {
  const triggerRect = options.trigger.getBoundingClientRect()
  const contentRect = options.content.getBoundingClientRect()
  const ownerWindow = options.content.ownerDocument.defaultView ?? window
  const viewport = {
    blockSize: ownerWindow.innerHeight,
    inlineSize: ownerWindow.innerWidth,
    x: 0,
    y: 0,
  }
  const offset = options.offset ?? DEFAULT_FLOATING_OFFSET
  const padding = options.viewportPadding ?? DEFAULT_VIEWPORT_PADDING
  const order = orderedFloatingPlacements(options.placement)
  const candidates = order.map((placement) =>
    floatingCandidate(placement, triggerRect, contentRect, offset),
  )
  const fittingCandidate =
    candidates.find((candidate) =>
      floatingCandidateFits(candidate, contentRect, viewport, padding),
    ) ?? candidates[0]!

  const x = clamp(
    fittingCandidate.x,
    padding,
    Math.max(padding, viewport.inlineSize - contentRect.width - padding),
  )
  const y = clamp(
    fittingCandidate.y,
    padding,
    Math.max(padding, viewport.blockSize - contentRect.height - padding),
  )

  options.content.style.setProperty(FLOATING_LEFT_PROPERTY, `${x}px`)
  options.content.style.setProperty(FLOATING_TOP_PROPERTY, `${y}px`)
  options.content.setAttribute('data-ui-internal-floating', 'fallback')
  options.content.setAttribute('data-ui-internal-placement', fittingCandidate.placement)

  return fittingCandidate.placement
}

export function clearFloatingPosition(content: FloatingRuntimeElement): void {
  content.style.removeProperty(FLOATING_LEFT_PROPERTY)
  content.style.removeProperty(FLOATING_TOP_PROPERTY)
  content.removeAttribute('data-ui-internal-floating')
  content.removeAttribute('data-ui-internal-placement')
}

function orderedFloatingPlacements(placement: FloatingPlacement): readonly FloatingPlacement[] {
  if (placement === 'top') {
    return ['top', 'bottom', 'right', 'left']
  }
  if (placement === 'right') {
    return ['right', 'left', 'bottom', 'top']
  }
  if (placement === 'left') {
    return ['left', 'right', 'bottom', 'top']
  }
  return ['bottom', 'top', 'right', 'left']
}

function floatingCandidate(
  placement: FloatingPlacement,
  trigger: DOMRectReadOnly,
  content: DOMRectReadOnly,
  offset: number,
): FloatingCandidate {
  if (placement === 'top') {
    return {
      placement,
      x: trigger.left + trigger.width / 2 - content.width / 2,
      y: trigger.top - content.height - offset,
    }
  }
  if (placement === 'right') {
    return {
      placement,
      x: trigger.right + offset,
      y: trigger.top + trigger.height / 2 - content.height / 2,
    }
  }
  if (placement === 'left') {
    return {
      placement,
      x: trigger.left - content.width - offset,
      y: trigger.top + trigger.height / 2 - content.height / 2,
    }
  }

  return {
    placement,
    x: trigger.left + trigger.width / 2 - content.width / 2,
    y: trigger.bottom + offset,
  }
}

function floatingCandidateFits(
  candidate: FloatingCandidate,
  content: DOMRectReadOnly,
  viewport: FloatingRect,
  padding: number,
): boolean {
  return (
    candidate.x >= viewport.x + padding &&
    candidate.y >= viewport.y + padding &&
    candidate.x + content.width <= viewport.x + viewport.inlineSize - padding &&
    candidate.y + content.height <= viewport.y + viewport.blockSize - padding
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
