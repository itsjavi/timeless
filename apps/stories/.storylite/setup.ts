import { defineTimelessElements } from '@timelessui/components/define'
import { defineLargeDatasetElements } from '../src/stories/collection-navigation/large-dataset.fixture'
import { defineOwnedFilterElement } from '../src/stories/collection-navigation/owned-filter.fixture'
import { defineServerErrorsElement } from '../src/stories/form-primitives/server-errors.fixture'
import { defineCopyBlobElement } from '../src/stories/copy-button.fixture'

/**
 * The only place a story fixture element can be registered.
 *
 * StoryLite calls this with the window the story actually renders into — the preview frame in the
 * catalog, the page itself in the static build. A story module is evaluated in the manager window
 * instead, so registering from module scope defines the element in a realm the markup never reaches
 * and it silently stays an unupgraded `HTMLElement`. `parameters.defineCustomElements` is not an
 * alternative: StoryLite honours it only for the `web-components` renderer, and every story here
 * uses `html`.
 */
export function setupPreview(window: Window): void {
  defineTimelessElements(window)
  defineLargeDatasetElements(window)
  defineOwnedFilterElement(window)
  defineServerErrorsElement(window)
  defineCopyBlobElement(window)
}
