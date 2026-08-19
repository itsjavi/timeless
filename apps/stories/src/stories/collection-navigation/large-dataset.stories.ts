import type { StoryLiteMeta, StoryLiteStoryDefinition } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import comboboxCss from '@timelessui/components/css/combobox.css?raw'
import floatingCss from '@timelessui/components/css/floating.css?raw'
import listboxCss from '@timelessui/components/css/listbox.css?raw'
import optionsCss from '@timelessui/components/css/options.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import demoCss from '../styles.css?raw'
import { defineLargeDatasetElements } from './large-dataset.fixture'
import fixtureCss from './large-dataset.stories.css?raw'

const meta: StoryLiteMeta = {
  title: 'Recipes/Performance/Large Dataset',
  parameters: {
    renderer: 'html',
    css: [
      tokensCss,
      buttonCss,
      floatingCss,
      popoverCss,
      optionsCss,
      listboxCss,
      comboboxCss,
      demoCss,
      fixtureCss,
    ],
    defineCustomElements: defineLargeDatasetElements,
  },
}
export default meta

export const Default = {
  source: () => `<ui-combobox>
  <label for="record-search">Search records</label>
  <input id="record-search" role="combobox" name="record" autocomplete="off" aria-autocomplete="list">
  <div role="listbox" popover="manual"></div>
</ui-combobox>`,
  render: () => `<main class="ui-demo-page">
      <header>
        <h1>Large dataset selector</h1>
        <p>This synthetic fixture loads on first use, filters 1,600 domain records, and renders one bounded page of direct option nodes.</p>
      </header>
      <ui-large-dataset-fixture class="ui-large-dataset" role="region" aria-label="Synthetic record selector">
        <ui-combobox>
          <label for="large-dataset-search">Search records</label>
          <input id="large-dataset-search" role="combobox" name="record" autocomplete="off" aria-autocomplete="list">
          <div id="large-dataset-options" role="listbox" popover="manual"></div>
        </ui-combobox>
        <div data-dataset-controls>
          <button class="ui-button" data-dataset-previous type="button">Previous page</button>
          <button class="ui-button" data-dataset-next type="button">Next page</button>
          <output data-dataset-page>Page 1</output>
        </div>
        <p data-dataset-status role="status" aria-live="polite">Records load when the selector receives focus.</p>
      </ui-large-dataset-fixture>
    </main>`,
} satisfies StoryLiteStoryDefinition
