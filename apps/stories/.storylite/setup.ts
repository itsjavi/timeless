import { defineTimelessElements } from '@timelessui/components/define'
import { defineLargeDatasetElements } from '../src/stories/collection-navigation/large-dataset.fixture'

export function setupPreview(window: Window): void {
  defineTimelessElements(window)
  defineLargeDatasetElements(window)
}
