/**
 * Platform feature detection, in one place.
 *
 * Every enhanced component asks the same question before it wires anything up: does this window
 * ship the platform feature the authored markup already relies on? The answer is a boolean the
 * component takes as an enhancement option, so a unit test can force the unsupported path without
 * a fake window, and so the probe itself lives here rather than being restated per component.
 *
 * These probes read a constructor prototype rather than calling anything. They never touch the
 * document, so they are safe on a server, and they take the window explicitly because a component
 * inside an iframe must ask its own `ownerDocument.defaultView`, not the global one.
 */

type TimelessWindow = (Window & typeof globalThis) | null | undefined

/** Whether the Popover API is available: `popover`, `popovertarget`, light dismiss, and Escape. */
export function supportsNativePopover(targetWindow: Window | null | undefined): boolean {
  const timelessWindow = targetWindow as TimelessWindow
  return Boolean(
    timelessWindow?.HTMLElement && 'showPopover' in timelessWindow.HTMLElement.prototype,
  )
}

/**
 * Whether `<dialog>` is available with the whole surface Timeless drives.
 *
 * All three methods are probed, not just `showModal`: a non-modal sheet opens with `show()` and
 * every close path calls `close()`, so a partial implementation would pass a `showModal`-only
 * check and then fail at the call site.
 */
export function supportsNativeDialog(targetWindow: Window | null | undefined): boolean {
  const timelessWindow = targetWindow as TimelessWindow
  return Boolean(
    timelessWindow?.HTMLDialogElement &&
    'show' in timelessWindow.HTMLDialogElement.prototype &&
    'showModal' in timelessWindow.HTMLDialogElement.prototype &&
    'close' in timelessWindow.HTMLDialogElement.prototype,
  )
}

/** Whether Invoker Commands are available, so an authored `command` runs before any script. */
export function supportsInvokerCommands(targetWindow: Window | null | undefined): boolean {
  const timelessWindow = targetWindow as TimelessWindow
  return Boolean(
    timelessWindow?.HTMLButtonElement && 'command' in timelessWindow.HTMLButtonElement.prototype,
  )
}
