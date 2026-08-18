import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { toast } from '@timelessui/components'
import { createToaster } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Toast')
export default meta

const placementToasts = [
  {
    title: 'Top center',
    description: 'Fixed viewport placement, stacked as a list.',
    duration: 0,
  },
] as const

export const Default = {
  source: () =>
    createToaster([
      {
        title: 'Package built',
        description: 'Components and docs finished without warnings.',
        duration: 0,
      },
    ]),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Toast</h1>
      <p>Toast items can auto-dismiss or stay persistent while preserving authored content and close controls.</p>
    </header>
    ${createToaster([
      {
        title: 'Package built',
        description: 'Components and docs finished without warnings.',
        duration: 0,
      },
    ])}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const ToastApi = {
  source: () => `<script type="module">
  import { toast } from '@timelessui/components'
  import { defineTimelessElements } from '@timelessui/components/define'

  defineTimelessElements()

  const toaster = document.querySelector('ui-toaster')
  document.querySelector('[data-demo-toast]')?.addEventListener('click', () => {
    toast('Preview queued', {
      description: 'The toast() API appends an authored ui-toast item.',
      stack: 'overlap',
      toaster,
    })
  })
</script>

<button class="ui-button" data-demo-toast type="button">Add toast</button>
<ui-toaster placement="bottom-end" stack="overlap"></ui-toaster>`,
  render: (_args?: unknown, context?: { readonly document?: Document | null }) => {
    const markup = `<main class="ui-demo-page">
    <header>
      <h1>Toast API</h1>
      <p>A thin toast() helper can append toast items to an existing toaster without hiding the Light DOM contract.</p>
    </header>
    <section class="ui-overlay-demo-panel">
      <button class="ui-button ui-toast-demo-trigger" data-demo-toast type="button">Add toast</button>
    </section>
    <ui-toaster placement="bottom-end" stack="overlap"></ui-toaster>
  </main>`
    const document = context?.document ?? null
    if (!document) {
      return markup
    }

    const template = document.createElement('template')
    template.innerHTML = markup.trim()
    const root = template.content.firstElementChild as HTMLElement | null
    const button = root?.querySelector('[data-demo-toast]')
    const toaster = root?.querySelector('ui-toaster')
    let count = 0

    button?.addEventListener('click', () => {
      count += 1
      toast(
        {
          title: `Preview queued ${count}`,
          description: 'The toast() API appends an authored ui-toast item.',
          duration: 0,
        },
        {
          toaster,
          stack: 'overlap',
        },
      )
    })

    return root ?? markup
  },
} satisfies StoryLiteStoryDefinition

export const Stack = {
  source: () =>
    createToaster([
      {
        title: 'Preview queued',
        description: 'Newest toast stays closest to the viewport edge.',
        duration: 0,
      },
      {
        title: 'Tokens updated',
        description: 'Atmosphere shadows and control fills are available.',
        duration: 0,
      },
      {
        title: 'Stories generated',
        description: 'Progressive overlay examples are ready for review.',
        duration: 0,
      },
    ]),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Toast stack</h1>
      <p>Toasters are fixed to the viewport and overlap toast cards by default.</p>
    </header>
    ${createToaster([
      {
        title: 'Preview queued',
        description: 'Newest toast stays closest to the viewport edge.',
        duration: 0,
      },
      {
        title: 'Tokens updated',
        description: 'Atmosphere shadows and control fills are available.',
        duration: 0,
      },
      {
        title: 'Stories generated',
        description: 'Progressive overlay examples are ready for review.',
        duration: 0,
      },
    ])}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Placements = {
  source: () => `${createToaster(placementToasts, {
    placement: 'top-center',
    stack: 'list',
  })}

${createToaster(
  [
    {
      title: 'Bottom end',
      description: 'The default toast() helper position.',
      duration: 0,
    },
  ],
  {
    placement: 'bottom-end',
    stack: 'overlap',
  },
)}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Toast placements</h1>
      <p>Toaster placement and stack mode are configured on the fixed ui-toaster container.</p>
    </header>
    ${createToaster(placementToasts, {
      placement: 'top-center',
      stack: 'list',
    })}
    ${createToaster(
      [
        {
          title: 'Bottom end',
          description: 'The default toast() helper position.',
          duration: 0,
        },
        {
          title: 'Second card',
          description: 'Overlap mode gives the stack a card-pile effect.',
          duration: 0,
        },
      ],
      {
        placement: 'bottom-end',
        stack: 'overlap',
      },
    )}
  </main>`,
} satisfies StoryLiteStoryDefinition
