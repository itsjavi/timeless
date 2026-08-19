import type { UIFormElement } from '@timelessui/components'

/**
 * The demo behind the server-errors story.
 *
 * The story's `source` shows the handful of lines a consumer actually writes. This wrapper exists
 * only because a `<script>` injected as story markup never executes — an element upgrades in both
 * the static build and the client renderer. The logic inside is the same logic.
 *
 * The class is declared inside the define function, against the target window's `HTMLElement`, so
 * the module can be evaluated on a server where no `HTMLElement` global exists.
 */
export function defineServerErrorsElement(targetWindow: Window = window): void {
  if (targetWindow.customElements.get('story-server-errors')) return
  const realm = targetWindow as Window & typeof globalThis

  class StoryServerErrorsElement extends realm.HTMLElement {
    connectedCallback(): void {
      const form = this.querySelector<UIFormElement>('ui-form')
      if (!form) return

      this.querySelector('#workspace-save')?.addEventListener('click', () => {
        form.setErrors({
          slug: 'That workspace address is already taken.',
          owner: 'No account exists for this address.',
        })
      })
      this.querySelector('#workspace-clear')?.addEventListener('click', () => form.clearErrors())
    }
  }

  targetWindow.customElements.define('story-server-errors', StoryServerErrorsElement)
}
