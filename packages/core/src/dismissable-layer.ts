export type DismissReason = 'escape' | 'outside-interaction'

export type DismissableLayerOptions = {
  readonly layer: Element
  readonly onDismiss: (reason: DismissReason, event: Event) => void
  readonly document?: Document
  readonly escapeKey?: boolean
  readonly outsidePointer?: boolean
  readonly outsideFocus?: boolean
}

export type DismissableLayerController = {
  destroy(): void
}

export function createDismissableLayerController(
  options: DismissableLayerOptions,
): DismissableLayerController {
  const ownerDocument = options.document ?? options.layer.ownerDocument
  const abortController = new AbortController()
  const signal = abortController.signal

  if (options.escapeKey !== false) {
    ownerDocument.addEventListener(
      'keydown',
      (event) => {
        if (isEscapeKey(event)) {
          options.onDismiss('escape', event)
        }
      },
      { signal },
    )
  }

  if (options.outsidePointer !== false) {
    ownerDocument.addEventListener(
      'pointerdown',
      (event) => {
        if (isEventOutside(event, options.layer)) {
          options.onDismiss('outside-interaction', event)
        }
      },
      { signal },
    )
  }

  if (options.outsideFocus === true) {
    ownerDocument.addEventListener(
      'focusin',
      (event) => {
        if (isEventOutside(event, options.layer)) {
          options.onDismiss('outside-interaction', event)
        }
      },
      { signal },
    )
  }

  return {
    destroy() {
      abortController.abort()
    },
  }
}

export function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape'
}

export function isEventOutside(event: Event, layer: Element): boolean {
  const path = event.composedPath()
  if (path.length > 0) {
    return !path.includes(layer)
  }

  const target = event.target
  if (typeof Node !== 'undefined' && target instanceof Node) {
    return !layer.contains(target)
  }

  return true
}
