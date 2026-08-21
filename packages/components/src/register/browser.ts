/**
 * The one guard behind every `register/*` entry point.
 *
 * `define/*` exports a function and registers nothing, which is what keeps it safe to import while
 * server rendering. `register/*` is the other half of that pair: importing it registers. Those two
 * facts cannot both hold on the server, where there is no `customElements` to define into — so a
 * `register/*` import is inert there rather than throwing, and the client bundle re-imports the same
 * module and registers for real.
 *
 * Which means a `register/*` import has to appear in code the client actually loads. An import that
 * only ever runs on the server registers nothing, and the element never upgrades.
 */
export function registerInBrowser(define: (targetWindow?: Window) => unknown): void {
  if (typeof window === 'undefined') return
  define(window)
}
