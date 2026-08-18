import { collectionTextMatches } from '@timelessui/components'
import { defineComboboxElement } from '@timelessui/components/define/ui-combobox'

type DatasetRecord = {
  readonly disabled: boolean
  readonly id: number
  readonly label: string
  readonly type: string
}

const PAGE_SIZE = 48
const records: readonly DatasetRecord[] = Array.from({ length: 1_600 }, (_, index) => ({
  disabled: index > 0 && index % 37 === 0,
  id: index + 1,
  label: `Archive record ${String(index + 1).padStart(4, '0')}`,
  type: ['Document', 'Image', 'Audio', 'Dataset'][index % 4]!,
}))
const previewImage =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%23d7e7fb%22/%3E%3Cpath d=%22M8 10h16v12H8z%22 fill=%22none%22 stroke=%22%230064d8%22 stroke-width=%222%22/%3E%3C/svg%3E'

export function defineLargeDatasetElements(targetWindow: Window = window): void {
  defineComboboxElement(targetWindow)
  if (targetWindow.customElements.get('ui-large-dataset-fixture')) return
  const realm = targetWindow as Window & typeof globalThis

  class UILargeDatasetFixtureElement extends realm.HTMLElement {
    #abortController: AbortController | null = null
    #loaded = false
    #page = 0

    connectedCallback(): void {
      this.#abortController?.abort()
      realm.requestAnimationFrame(() => {
        if (this.isConnected) this.connectParts()
      })
    }

    private connectParts(): void {
      this.#abortController?.abort()
      const controller = new realm.AbortController()
      this.#abortController = controller
      const signal = controller.signal
      this.input.addEventListener('focus', this.load, { once: true, signal })
      this.input.addEventListener('input', this.handleInput, { signal })
      this.previous.addEventListener('click', this.handlePrevious, { signal })
      this.next.addEventListener('click', this.handleNext, { signal })
      this.combobox.addEventListener('ui-change', this.handleChange, { signal })
    }

    disconnectedCallback(): void {
      this.#abortController?.abort()
    }

    private get combobox(): HTMLElement {
      return this.querySelector('ui-combobox')!
    }

    private get input(): HTMLInputElement {
      return this.querySelector('[role="combobox"]')!
    }

    private get listbox(): HTMLElement {
      return this.querySelector('[role="listbox"]')!
    }

    private get status(): HTMLElement {
      return this.querySelector('[data-dataset-status]')!
    }

    private get pageOutput(): HTMLOutputElement {
      return this.querySelector('[data-dataset-page]')!
    }

    private get previous(): HTMLButtonElement {
      return this.querySelector('[data-dataset-previous]')!
    }

    private get next(): HTMLButtonElement {
      return this.querySelector('[data-dataset-next]')!
    }

    private matchingRecords(): readonly DatasetRecord[] {
      return records.filter((record) => collectionTextMatches(record.label, this.input.value))
    }

    private renderPage(): void {
      const matches = this.matchingRecords()
      const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
      this.#page = Math.min(this.#page, pageCount - 1)
      const visible = matches.slice(this.#page * PAGE_SIZE, (this.#page + 1) * PAGE_SIZE)
      const fragment = this.ownerDocument.createDocumentFragment()
      for (const record of visible) {
        const option = this.ownerDocument.createElement('div')
        option.setAttribute('data-ui-value', record.label)
        option.setAttribute('role', 'option')
        option.setAttribute('aria-selected', 'false')
        if (record.disabled) option.setAttribute('aria-disabled', 'true')
        option.innerHTML = `<img src="${previewImage}" alt="" width="32" height="32" loading="lazy" decoding="async"><span>${record.label}</span><small>${record.type}</small>`
        fragment.append(option)
      }
      this.listbox.replaceChildren(fragment)
      this.previous.disabled = this.#page === 0
      this.next.disabled = this.#page + 1 >= pageCount
      const pageLabel = `Page ${this.#page + 1} of ${pageCount}`
      if (this.pageOutput.value !== pageLabel) this.pageOutput.value = pageLabel
      if (this.pageOutput.textContent !== pageLabel) this.pageOutput.textContent = pageLabel
      this.status.textContent = `${matches.length} matching records. ${visible.length} rendered.`
    }

    private load = (): void => {
      if (this.#loaded) return
      this.#loaded = true
      this.status.textContent = 'Loading 1,600 synthetic records.'
      realm.queueMicrotask(() => this.renderPage())
    }

    private handleInput = (): void => {
      this.load()
      this.#page = 0
      this.renderPage()
    }

    private handlePrevious = (): void => {
      this.#page = Math.max(0, this.#page - 1)
      this.renderPage()
    }

    private handleNext = (): void => {
      this.#page += 1
      this.renderPage()
    }

    private handleChange = (event: Event): void => {
      const value = (event as CustomEvent<{ readonly value: string }>).detail.value
      this.status.textContent = `Selected ${value}.`
    }
  }

  targetWindow.customElements.define('ui-large-dataset-fixture', UILargeDatasetFixtureElement)
}
