import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightDotMd from 'starlight-dot-md'
import { examples } from '@timelessui/examples'
import { defineConfig } from 'astro/config'
import { GROUP_ORDER } from './src/lib/agent-surfaces.ts'
import { SHARE_CARD_HEAD } from './src/lib/share-card.ts'

/**
 * The sidebar is derived from the example catalog so the component list, the documentation groups,
 * and the routes cannot drift apart. Reorder or regroup in `packages/examples/src/catalog.ts`.
 *
 * `GROUP_ORDER` is shared with `/llms.txt`, which presents the same components in the same order.
 */

const documented = examples.filter((example) => example.domain !== 'recipes')
const componentGroups = GROUP_ORDER.map((group) => ({
  label: group,
  collapsed: true,
  items: documented
    .filter((example) => example.group === group)
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((example) => ({ label: example.title, link: `/docs/components/${example.id}/` })),
}))

const ungrouped = documented.filter((example) => !GROUP_ORDER.includes(example.group ?? ''))
if (ungrouped.length > 0) {
  throw new Error(
    `Examples are missing a sidebar group: ${ungrouped.map((example) => example.id).join(', ')}`,
  )
}

export default defineConfig({
  site: 'https://timeless.build',
  integrations: [
    // Preview documents exist only to be framed, so keep them out of the sitemap.
    sitemap({ filter: (page) => !page.includes('/docs/_preview/') }),
    starlight({
      title: 'Timeless',
      description: 'Framework-agnostic UI built on modern web standards.',
      /*
       * Starlight emits `twitter:card` as `summary_large_image` but never an image, so without this
       * every documentation page would share a large card with an empty image well. A page can still
       * override it from frontmatter: `head` entries merge by property, and the page's own win.
       */
      head: SHARE_CARD_HEAD,
      /*
       * Canonical markup is meant to be read and copied, and some of it is long. Wrapping keeps every
       * snippet fully visible and avoids a horizontally scrollable region that needs its own keyboard
       * access, which is a serious WCAG failure on any page with a wide snippet.
       */
      expressiveCode: { defaultProps: { wrap: true, preserveIndent: true } },
      disable404Route: true,
      favicon: '/logo.png',
      customCss: ['./src/styles/docs-theme.css'],
      lastUpdated: true,
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/itsjavi/timeless' }],
      plugins: [starlightDotMd()],
      components: { PageTitle: './src/components/docs/PageTitle.astro' },
      sidebar: [
        { label: 'Overview', slug: 'docs' },
        {
          label: 'Getting started',
          items: [{ autogenerate: { directory: 'docs/getting-started' } }],
        },
        { label: 'Styling', items: [{ autogenerate: { directory: 'docs/styling' } }] },
        { label: 'Frameworks', items: [{ autogenerate: { directory: 'docs/frameworks' } }] },
        { label: 'Concepts', items: [{ autogenerate: { directory: 'docs/concepts' } }] },
        ...componentGroups,
        { label: 'Reference', items: [{ autogenerate: { directory: 'docs/reference' } }] },
      ],
    }),
  ],
})
