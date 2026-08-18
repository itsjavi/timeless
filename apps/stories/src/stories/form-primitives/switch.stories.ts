import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createSwitchField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Switch')
export default meta

export const Default = {
  source: () =>
    createSwitchField({
      id: 'switch-notifications',
      name: 'notifications',
      label: 'Email notifications',
      description: 'Send release and validation updates to workspace members.',
      checked: true,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Switch</h1>
      <p>Switches are native checkboxes with <code class="ui-code">role="switch"</code>, so form values remain native.</p>
    </header>
    ${createSwitchField({
      id: 'switch-notifications',
      name: 'notifications',
      label: 'Email notifications',
      description: 'Send release and validation updates to workspace members.',
      checked: true,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Preferences = {
  source: () => `${createSwitchField({
    id: 'switch-preflight',
    name: 'preflight',
    label: 'Run preflight checks',
    description: 'Validate package metadata before opening a release.',
    checked: true,
  })}
${createSwitchField({
  id: 'switch-publish',
  name: 'publish',
  label: 'Auto publish',
  description: 'Disabled until release credentials are configured.',
  disabled: true,
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Preferences</h1>
      <p>Switch lists use the same choice anatomy as checkbox and radio options.</p>
    </header>
    <section class="ui-form-demo-stack" aria-label="Switch preferences">
      ${createSwitchField({
        id: 'switch-preflight',
        name: 'preflight',
        label: 'Run preflight checks',
        description: 'Validate package metadata before opening a release.',
        checked: true,
      })}
      ${createSwitchField({
        id: 'switch-publish',
        name: 'publish',
        label: 'Auto publish',
        description: 'Disabled until release credentials are configured.',
        disabled: true,
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
