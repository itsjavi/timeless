/**
 * Invoker Commands, read from authored markup.
 *
 * A `<button command="show-modal" commandfor="release-dialog">` opens its target before any script
 * runs. That is the whole reason Timeless *reads* these attributes instead of writing them: a
 * generated `commandfor` would only appear once the bundle had executed, which is exactly the dead
 * trigger the attributes exist to remove. Components detect what the author wrote and stand down,
 * so the same markup works with JavaScript disabled, still loading, or failed.
 *
 * Only `<button>` acts as an invoker, `commandfor` without `command` is inert, and a command that
 * does not match its target silently no-ops rather than throwing.
 */

import { supportsInvokerCommands } from './capabilities'

/** Re-exported from `capabilities.ts`, which owns every platform probe. */
export { supportsInvokerCommands }

/** Built-in `command` values Timeless recognises on a native `<dialog>` target. */
export const showModalCommand = 'show-modal'
export const closeCommand = 'close'
export const requestCloseCommand = 'request-close'

export type InvokerElementLike = {
  getAttribute(name: string): string | null
}

/** The id in `commandfor`, or null when the attribute is absent or empty. */
export function commandTarget(element: InvokerElementLike | null | undefined): string | null {
  const target = element?.getAttribute('commandfor')?.trim()
  return target ? target : null
}

/**
 * The `command` an element authors, or null when it authors none. Both attributes have to be
 * present: the platform treats either one on its own as inert.
 */
export function authoredCommand(element: InvokerElementLike | null | undefined): string | null {
  if (!commandTarget(element)) return null
  const command = element?.getAttribute('command')?.trim()
  return command ? command : null
}

/**
 * Whether `element` authors one of `commands` against `targetId`. Built-in command names are an
 * enumerated attribute, so they match ASCII case-insensitively; ids do not.
 *
 * A command outside `commands` — a misspelling, or one aimed at a different kind of target — reads
 * as no authored command at all, so the component keeps its click listener and goes on working.
 * The platform no-ops on that markup, which would otherwise leave a dead trigger.
 */
export function hasAuthoredCommand(
  element: InvokerElementLike | null | undefined,
  targetId: string,
  ...commands: readonly string[]
): boolean {
  if (!targetId || commandTarget(element) !== targetId) return false
  const command = authoredCommand(element)?.toLowerCase()
  return command !== undefined && commands.includes(command)
}

/** The command a dispatched `command` event carries, normalised for comparison. */
export function commandFromEvent(event: Event): string {
  return ((event as CommandEvent).command ?? '').trim().toLowerCase()
}

/**
 * Whether a `toggle` event reports its element as now open.
 *
 * `command` is dispatched *before* the platform runs the command, and a microtask queued from that
 * listener still resolves first, so it is not a signal that the element opened. `toggle` is: it is
 * queued after the state change. Every engine that ships Invoker Commands already shipped
 * `<dialog>` toggle events, so the authored path can rely on it.
 */
export function isOpenedByToggle(event: Event): boolean {
  return (event as ToggleEvent).newState === 'open'
}

/** The button that invoked a `command` event, when it is an element of the expected window. */
export function commandSource(
  event: Event,
  targetWindow: Window | null | undefined,
): HTMLElement | null {
  const timelessWindow = targetWindow as (Window & typeof globalThis) | null | undefined
  const source = (event as CommandEvent).source
  const HTMLElementConstructor = timelessWindow?.HTMLElement
  return HTMLElementConstructor && source instanceof HTMLElementConstructor ? source : null
}
