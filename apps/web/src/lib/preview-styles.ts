const CSS_ROOT = '../../../../packages/components/src/css/'

const modules = import.meta.glob('../../../../packages/components/src/css/**/*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

/**
 * Keyed by the path relative to `src/css`, not by basename: `core/popover.css` and `popover.css` are
 * two different stylesheets, and a basename key silently served one of them for both.
 */
const styles = new Map(
  Object.entries(modules).map(([path, source]) => [
    path.slice(path.indexOf(CSS_ROOT) + CSS_ROOT.length),
    source,
  ]),
)

export function resolvePreviewStyles(names: readonly string[]): string {
  return names
    .map((name) => {
      const source = styles.get(name)
      if (!source) throw new Error(`Missing preview style: ${name}`)
      return source
    })
    .join('\n')
}
