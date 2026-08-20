import { defineConfig } from '@storylite/storylite'
import ts from 'typescript'
import satteri from 'vite-plugin-satteri'

function resolveStoryId(path: string, suggestedId: string): string {
  const storyDomains: Record<string, string> = {
    alert: 'feedback',
    avatar: 'content',
    badge: 'feedback',
    button: 'actions',
    card: 'content',
    'copy-button': 'actions',
    empty: 'feedback',
    group: 'content',
    list: 'content',
    meter: 'feedback',
    progress: 'feedback',
    separator: 'foundations',
    skeleton: 'feedback',
    spinner: 'feedback',
    table: 'content',
    text: 'foundations',
    toast: 'feedback',
    toggle: 'actions',
    'toggle-group': 'actions',
  }
  const normalizedPath = path.replaceAll('\\', '/')
  const exportSuffix = suggestedId.includes('--') ? `--${suggestedId.split('--').at(-1)}` : ''
  const filename = normalizedPath.match(/\/([^/]+)\.stories\.ts$/)?.[1] ?? suggestedId

  if (normalizedPath.includes('/recipes/')) {
    // A table rather than a ternary chain, whose fallback filed every new recipe under Color.
    const recipeCategories: Record<string, string> = {
      'account-form': 'forms',
      'command-palette': 'composition',
      'popover-color-picker': 'color',
      'team-presence': 'identity',
    }
    return `recipes-${recipeCategories[filename] ?? 'composition'}-${filename}${exportSuffix}`
  }
  if (filename === 'large-dataset') return `recipes-performance-large-dataset${exportSuffix}`

  const canonicalName =
    filename === 'text'
      ? 'text-and-code'
      : filename === 'select' && normalizedPath.includes('/form-primitives/')
        ? 'native-select'
        : filename
  const domain =
    storyDomains[canonicalName] ??
    storyDomains[filename] ??
    (normalizedPath.includes('/form-primitives/') ? 'forms' : undefined) ??
    (normalizedPath.includes('/collection-navigation/') ? 'navigation' : undefined) ??
    (normalizedPath.includes('/progressive-overlays/') ? 'overlays' : undefined) ??
    (normalizedPath.includes('/color-controls/') ? 'color' : undefined)
  if (!domain) return suggestedId.replace(/^stories-/, '')
  return `library-${domain}-${canonicalName}${exportSuffix}`
}

export default defineConfig({
  stories: ['./src/**/*.stories.ts'],
  setup: './.storylite/setup.ts',
  vitePlugins: [
    {
      name: 'timeless-decorator-transform',
      enforce: 'pre',
      transform(code, id) {
        const filePath = id.split('?')[0] ?? id
        if (!filePath.includes('/packages/components/src/') || !filePath.endsWith('.ts')) {
          return null
        }
        if (!code.includes('@')) {
          return null
        }

        const result = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            sourceMap: true,
            target: ts.ScriptTarget.ES2023,
            useDefineForClassFields: true,
          },
          fileName: id,
        })

        return {
          code: result.outputText,
          map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
        }
      },
    },
    satteri({
      mdx: false,
      features: {
        frontmatter: true,
        gfm: true,
      },
    }),
  ],
  storyId: resolveStoryId,
  managerHtmlAttrs: (defaults) => ({ ...defaults, 'data-timeless-manager': 'true' }),
  managerHead: '<title>Timeless components - StoryLite</title>',
  previewHtmlAttrs: (defaults) => ({ ...defaults, 'data-timeless-preview': 'true' }),
  ui: {
    brand: {
      markHtml: '<span style="color: white;">UI</span>',
      titleHtml: '<strong>Timeless</strong>',
      subtitle: 'Component catalog',
    },
    viewports: (defaultViewports) =>
      defaultViewports.map((viewport) => {
        if (viewport.icon === 'mobile') return { ...viewport, width: 320 }
        if (viewport.icon === 'tablet') return { ...viewport, width: 768 }
        if (viewport.icon === 'desktop') return { ...viewport, width: 1024 }
        return viewport
      }),
  },
})
