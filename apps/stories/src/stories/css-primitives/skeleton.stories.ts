import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createSkeleton } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Skeleton')
export default meta

export const Default = {
  source: () => `${createSkeleton({ shape: 'media' })}
${createSkeleton({ width: 'medium' })}
${createSkeleton({ width: 'short' })}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Skeleton</h1>
      <p>Skeletons reserve stable space for text, avatars, and media while respecting reduced motion.</p>
    </header>
    <section class="ui-primitive-grid" aria-label="Skeleton examples">
      <div class="ui-primitive-panel">
        ${createSkeleton({ shape: 'media' })}
        ${createSkeleton({ width: 'medium' })}
        ${createSkeleton({ width: 'short' })}
      </div>
      <div class="ui-group">
        ${createSkeleton({ shape: 'circle' })}
        <div class="ui-primitive-flow">
          ${createSkeleton({ width: 'medium' })}
          ${createSkeleton({ size: 'sm', width: 'short' })}
        </div>
      </div>
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
