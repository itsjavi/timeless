const modules = import.meta.glob('../../../../packages/components/src/css/*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const styles = new Map(
  Object.entries(modules).map(([path, source]) => [path.split('/').at(-1) ?? path, source]),
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
