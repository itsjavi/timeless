export type UITransitionSource = 'api' | 'keyboard' | 'pointer' | 'reset'

export type UITransitionDetail<TValue, TReason extends string = string> = {
  readonly originalEvent: Event | null
  readonly previousValue: TValue
  readonly reason: TReason
  readonly source: UITransitionSource
  readonly value: TValue
}

export type UITransitionEventOptions<TValue, TReason extends string> = {
  readonly cancelable?: boolean
  readonly detail: UITransitionDetail<TValue, TReason>
  readonly type: string
}

export function dispatchUITransitionEvent<TValue, TReason extends string>(
  target: EventTarget,
  options: UITransitionEventOptions<TValue, TReason>,
): boolean {
  const ownerWindow =
    'ownerDocument' in target
      ? (target as EventTarget & { ownerDocument?: Document }).ownerDocument?.defaultView
      : null
  const CustomEventConstructor = ownerWindow?.CustomEvent ?? CustomEvent
  return target.dispatchEvent(
    new CustomEventConstructor(options.type, {
      bubbles: true,
      cancelable: options.cancelable ?? false,
      composed: true,
      detail: options.detail,
    }),
  )
}

export function transitionSourceFromEvent(event: Event | null): UITransitionSource {
  if (!event) return 'api'
  if ('key' in event) return 'keyboard'
  return 'pointer'
}
