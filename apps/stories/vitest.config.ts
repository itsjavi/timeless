import { defineConfig } from 'vitest/config'
import ts from 'typescript'
import satteri from 'vite-plugin-satteri'

export default defineConfig({
  plugins: [
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
  test: {
    environment: 'node',
    passWithNoTests: false,
    include: ['src/**/*.test.ts'],
  },
})
