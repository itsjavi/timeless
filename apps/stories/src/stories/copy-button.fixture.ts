/**
 * The demo behind the intercepted-copy story.
 *
 * The story's `source` shows the handful of lines a consumer writes. This wrapper exists only because a
 * `<script>` injected as story markup never executes, while a custom element upgrades in both the static
 * build and the client renderer — the same reason `server-errors.fixture.ts` exists. The logic inside is
 * the same logic.
 *
 * The class is declared inside the define function, against the target window's `HTMLElement`, so the
 * module can be evaluated on a server where no `HTMLElement` global exists.
 */
export function defineCopyBlobElement(targetWindow: Window = window): void {
  if (targetWindow.customElements.get('story-copy-blob')) return
  const realm = targetWindow as Window & typeof globalThis

  /** A 1x1 PNG, so the story copies a real image rather than a string that looks like one. */
  const SWATCH =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mO4o2ACAAMMATH9sBa8AAAAAElFTkSuQmCC'

  class StoryCopyBlobElement extends realm.HTMLElement {
    connectedCallback(): void {
      this.querySelector('ui-copy-button')?.addEventListener('ui-before-copy', (event) => {
        const proposal = event as CustomEvent<{ respondWith(write: Promise<void>): void }>
        /*
         * `write` is called synchronously so the click's user activation still covers it, and
         * `ClipboardItem` takes the promised blob rather than an awaited one.
         */
        proposal.detail.respondWith(
          realm.navigator.clipboard.write([
            new realm.ClipboardItem({
              'image/png': fetch(SWATCH).then((response) => response.blob()),
            }),
          ]),
        )
      })
    }
  }

  targetWindow.customElements.define('story-copy-blob', StoryCopyBlobElement)
}
