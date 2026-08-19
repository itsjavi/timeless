import type { ComboboxInputDetail } from '@timelessui/components'

/**
 * The demo behind the consumer-owned-filtering story.
 *
 * The story's `source` shows the handful of lines a consumer actually writes. This wrapper exists
 * only because a `<script>` injected as story markup never executes, while an element upgrades on
 * its own. The logic inside is the same logic.
 *
 * Register it from `.storylite/setup.ts` and nowhere else. StoryLite calls `setupPreview` with the
 * window the story renders into; a story module runs in the manager window, so registering from
 * there defines the element in a realm the markup never reaches and it stays an unupgraded
 * `HTMLElement`.
 *
 * The class is declared inside the define function, against the target window's `HTMLElement`, so
 * the module can be evaluated on a server where no `HTMLElement` global exists.
 */
export function defineOwnedFilterElement(targetWindow: Window = window): void {
  if (targetWindow.customElements.get('story-owned-filter')) return
  const realm = targetWindow as Window & typeof globalThis

  class StoryOwnedFilterElement extends realm.HTMLElement {
    connectedCallback(): void {
      const combobox = this.querySelector('ui-combobox')
      if (!combobox) return

      combobox.addEventListener('ui-input', (event) => {
        const query = (event as CustomEvent<ComboboxInputDetail>).detail.query
          .trim()
          .toLocaleLowerCase()
        for (const option of combobox.querySelectorAll<HTMLElement>('[role="option"]')) {
          option.hidden =
            query.length > 0 && !(option.textContent ?? '').toLocaleLowerCase().endsWith(query)
        }
      })
    }
  }

  targetWindow.customElements.define('story-owned-filter', StoryOwnedFilterElement)
}
