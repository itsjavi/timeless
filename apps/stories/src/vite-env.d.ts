declare module '*?raw' {
  const source: string
  export default source
}

declare module '*.md' {
  const html: string
  const frontmatter: Record<string, unknown>
  export default html
  export { html, frontmatter }
}
