import { defineTimelessElements } from '@timelessui/components/define'
import { defineLargeDatasetElements } from '../src/stories/collection-navigation/large-dataset.fixture'
import { defineServerErrorsElement } from '../src/stories/form-primitives/server-errors.fixture'

export function setupPreview(window: Window): void {
  defineTimelessElements(window)
  defineLargeDatasetElements(window)
  defineServerErrorsElement(window)
}
