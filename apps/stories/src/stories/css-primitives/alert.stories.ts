import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { alertVariants, type AlertVariant, type PrimitiveDensity } from '@timelessui/components'
import { createAlert } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Alert')
export default meta

type AlertDensity = Extract<PrimitiveDensity, 'compact' | 'normal'>

type AlertArgs = {
  title: string
  description: string
  variant: AlertVariant
  density: AlertDensity
}

const alertDensities = ['compact', 'normal'] as const satisfies readonly AlertDensity[]

const alertArgs: AlertArgs = {
  title: 'Package published',
  description: 'The CSS bundle and type declarations are available for consumers.',
  variant: 'success',
  density: 'normal',
}

const alertArgTypes = {
  title: { control: 'text' },
  description: { control: 'text' },
  variant: { control: 'select', options: alertVariants },
  density: { control: 'select', options: alertDensities },
} satisfies StoryLiteArgTypes<AlertArgs>

export const Default = {
  args: alertArgs,
  argTypes: alertArgTypes,
  source: (args = alertArgs) => createAlert(toAlertProps(args)),
  render: (args = alertArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Alert</h1>
      <p>Alerts are flat status surfaces with author-owned text, optional icon anatomy, and semantic roles chosen by the consumer.</p>
    </header>
    ${createAlert(toAlertProps(args))}
  </main>`,
} satisfies StoryLiteStoryDefinition<AlertArgs>

export const FeedbackStack = {
  source: () => `${createAlert({
    title: 'Build completed',
    description: 'All package artifacts were generated successfully.',
    variant: 'success',
    icon: 'i',
    role: 'status',
  })}
${createAlert({
  title: 'Check token contrast',
  description: 'Muted text remains readable in both supported color schemes.',
  variant: 'warning',
  icon: '!',
  role: 'status',
})}
${createAlert({
  title: 'Publish blocked',
  description: 'The package cannot be published until validation errors are resolved.',
  variant: 'danger',
  icon: '!',
  role: 'alert',
  actionLabel: 'Review errors',
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Feedback stack</h1>
      <p>Use variants for status meaning. Use <code class="ui-code">role="alert"</code> only when the message should interrupt assistive technology.</p>
    </header>
    <section class="ui-primitive-flow" aria-label="Feedback examples">
      ${createAlert({
        title: 'Build completed',
        description: 'All package artifacts were generated successfully.',
        variant: 'success',
        icon: 'i',
        role: 'status',
      })}
      ${createAlert({
        title: 'Check token contrast',
        description: 'Muted text remains readable in both supported color schemes.',
        variant: 'warning',
        icon: '!',
        role: 'status',
      })}
      ${createAlert({
        title: 'Publish blocked',
        description: 'The package cannot be published until validation errors are resolved.',
        variant: 'danger',
        icon: '!',
        role: 'alert',
        actionLabel: 'Review errors',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

function toAlertProps(args: AlertArgs): Parameters<typeof createAlert>[0] {
  return {
    ...args,
    icon: args.variant === 'warning' || args.variant === 'danger' ? '!' : 'i',
    role: args.variant === 'danger' ? 'alert' : 'status',
  }
}
