import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createFileField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('File Input')
export default meta

export const Default = {
  source: () =>
    createFileField({
      id: 'file-manifest',
      name: 'manifest',
      label: 'Release manifest',
      accept: '.json',
      description: 'Upload the generated package manifest as JSON.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>File input</h1>
      <p>File inputs keep native picker behavior and only style the control and selector button.</p>
    </header>
    ${createFileField({
      id: 'file-manifest',
      name: 'manifest',
      label: 'Release manifest',
      accept: '.json',
      description: 'Upload the generated package manifest as JSON.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const InvalidFile = {
  source: () =>
    createFileField({
      id: 'file-invalid',
      name: 'manifest',
      label: 'Release manifest',
      accept: '.json',
      description: 'Only JSON manifests are accepted.',
      error: 'The selected file must use the .json extension.',
      invalid: true,
      required: true,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Invalid file</h1>
      <p>Error text stays outside the native file picker, while the input carries invalid state.</p>
    </header>
    ${createFileField({
      id: 'file-invalid',
      name: 'manifest',
      label: 'Release manifest',
      accept: '.json',
      description: 'Only JSON manifests are accepted.',
      error: 'The selected file must use the .json extension.',
      invalid: true,
      required: true,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
