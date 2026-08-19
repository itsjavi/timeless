import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCombobox, createCustomSelect } from '../collections.html'
import { defineOwnedFilterElement } from './owned-filter.fixture'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Combobox')
export default meta

// Registered at module scope rather than through `meta.parameters`, which the static build renders
// without. The guard is what keeps this module importable on a server.
if (typeof window !== 'undefined') defineOwnedFilterElement(window)

const fruitOptions = [
  { label: 'Apple' },
  { label: 'Apricot' },
  { label: 'Banana' },
  { label: 'Blackberry' },
  { label: 'Clementine' },
  { label: 'Dragon fruit' },
] as const

const contactGroups = [
  {
    label: 'Recent',
    options: [
      { label: 'Ada Lovelace · Engineering', search: 'Ada Lovelace', value: 'ada' },
      { label: 'Grace Hopper · Compilers', search: 'Grace Hopper', value: 'grace' },
    ],
  },
  {
    label: 'Everyone else',
    options: [
      { label: 'Alan Turing · Research', search: 'Alan Turing', value: 'alan' },
      { label: 'Barbara Liskov · Systems', search: 'Barbara Liskov', value: 'barbara' },
      { label: 'Katherine Johnson · Flight', search: 'Katherine Johnson', value: 'katherine' },
    ],
  },
] as const

const defaultCombobox = {
  id: 'fruit-combobox',
  label: 'Fruit',
  name: 'fruit',
  placeholder: 'Type to filter…',
  options: fruitOptions,
  empty: 'No fruit matches that filter.',
} as const

export const Default = {
  source: () => createCombobox(defaultCombobox),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Combobox</h1>
      <p>The input keeps native editing behavior while the surface filters authored options. Filtering hides options rather than removing them, so find-in-page and the DOM still show the full list.</p>
    </header>
    ${createCombobox(defaultCombobox)}
  </main>`,
} satisfies StoryLiteStoryDefinition

/**
 * Select and Combobox are the same ARIA pattern over the same option core. Showing them together is
 * the honest way to document the one thing that actually differs.
 */
export const SearchableSelectComparison = {
  source: () => `${createCustomSelect({
    id: 'searchable-select',
    label: 'Fruit (searchable Select)',
    name: 'select-fruit',
    searchable: true,
    options: fruitOptions,
    empty: 'No fruit matches that filter.',
  })}
${createCombobox({
  id: 'compare-combobox',
  label: 'Fruit (Combobox)',
  name: 'combobox-fruit',
  options: fruitOptions,
  empty: 'No fruit matches that filter.',
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Searchable Select beside a Combobox</h1>
      <p>One difference: where you type. A <code>searchable</code> Select puts the field inside its surface and keeps a button as the trigger; a Combobox types in the trigger itself and accepts free text.</p>
    </header>
    <div class="ui-demo-row">
      ${createCustomSelect({
        id: 'searchable-select',
        label: 'Fruit (searchable Select)',
        name: 'select-fruit',
        searchable: true,
        options: fruitOptions,
        empty: 'No fruit matches that filter.',
      })}
      ${createCombobox({
        id: 'compare-combobox',
        label: 'Fruit (Combobox)',
        name: 'combobox-fruit',
        options: fruitOptions,
        empty: 'No fruit matches that filter.',
      })}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const GroupedWithChips = {
  source: () =>
    createCombobox({
      id: 'recipients-combobox',
      label: 'Recipients',
      name: 'recipients',
      multiple: true,
      clear: true,
      placeholder: 'Search people…',
      groups: contactGroups,
      empty: 'Nobody matches that search.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Grouped options with chips</h1>
      <p>Each option carries a short <code>data-ui-label</code> so the filter matches the name rather than the whole two-part line — without changing the accessible name. <kbd>Backspace</kbd> in the empty input removes the last chip.</p>
    </header>
    ${createCombobox({
      id: 'recipients-combobox',
      label: 'Recipients',
      name: 'recipients',
      multiple: true,
      clear: true,
      placeholder: 'Search people…',
      groups: contactGroups,
      empty: 'Nobody matches that search.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

const consumerFilterSource = createCombobox({
  id: 'owned-combobox',
  label: 'Command',
  name: 'command',
  filter: 'off',
  placeholder: 'Type a command…',
  options: [
    { label: 'Deploy to staging' },
    { label: 'Deploy to production' },
    { label: 'Roll back release' },
    { label: 'Open changelog' },
  ],
  empty: 'No command matches.',
})

/**
 * `filter="off"` hands visibility to the consumer through the same channel the built-in filter uses.
 * Everything downstream — navigation, the empty state, group collapse, paging — reads `hidden`.
 *
 * `source` is the code a consumer writes. `render` wraps the same logic in a demo element, because a
 * `<script>` injected as story markup never runs.
 */
export const ConsumerOwnedFiltering = {
  source: () => `${consumerFilterSource}

<script type="module">
  const combobox = document.querySelector('ui-combobox')
  combobox.addEventListener('ui-input', (event) => {
    const query = event.detail.query.trim().toLocaleLowerCase()
    for (const option of combobox.querySelectorAll('[role="option"]')) {
      // Any rule you like. Timeless only reads \`hidden\`.
      option.hidden = query.length > 0 && !option.textContent.toLocaleLowerCase().endsWith(query)
    }
  })
</script>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Consumer-owned filtering</h1>
      <p>Under <code>filter="off"</code> Timeless filters nothing and emits <code>ui-input</code> instead. This demo matches the <em>end</em> of each label, which no built-in mode does — try typing <code>production</code> or <code>release</code>.</p>
    </header>
    <story-owned-filter>
      ${consumerFilterSource}
    </story-owned-filter>
  </main>`,
} satisfies StoryLiteStoryDefinition
