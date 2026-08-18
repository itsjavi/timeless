import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCombobox } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Combobox')
export default meta

const fruitOptions = [
  { label: 'Apple' },
  { label: 'Apricot' },
  { label: 'Banana' },
  { label: 'Blackberry' },
  { label: 'Clementine' },
  { label: 'Dragon fruit' },
] as const

export const Default = {
  source: () =>
    createCombobox({
      id: 'fruit-combobox',
      label: 'Fruit',
      options: fruitOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Combobox</h1>
      <p>The input keeps native editing behavior while the listbox filters authored options.</p>
    </header>
    ${createCombobox({
      id: 'fruit-combobox',
      label: 'Fruit',
      options: fruitOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const EmptyFilter = {
  source: () =>
    createCombobox({
      id: 'empty-filter-combobox',
      label: 'Search fruit',
      options: fruitOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Combobox filtering</h1>
      <p>Typing filters option visibility without replacing the native input.</p>
    </header>
    ${createCombobox({
      id: 'empty-filter-combobox',
      label: 'Search fruit',
      options: fruitOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
