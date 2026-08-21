import { defineConfig } from 'tsdown'
import ts from 'typescript'
import { elements } from './scripts/element-registry.mjs'

const elementEntries = [...new Set(elements.map((item) => `src/${item.module}.ts`))]
const defineEntries = elements.map((item) => `src/define/${item.tag}.ts`)
const registerEntries = elements.map((item) => `src/register/${item.tag}.ts`)

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/define.ts',
    'src/register.ts',
    'src/collection.ts',
    'src/events.ts',
    'src/value-state.ts',
    'src/attributes.ts',
    'src/validate.ts',
    'src/react.ts',
    'src/preact.ts',
    'src/solid.ts',
    'src/vue.ts',
    'src/svelte.ts',
    ...elementEntries,
    ...defineEntries,
    ...registerEntries,
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  plugins: [
    {
      name: 'timeless-decorator-transform',
      transform(code, id) {
        const filePath = id.split('?')[0] ?? id
        if (!filePath.includes('/packages/components/src/') || !filePath.endsWith('.ts')) {
          return null
        }
        // The dts pass feeds declaration files through the same pipeline, and `transpileModule`
        // cannot emit for one. Only the authored sources carry decorators.
        if (filePath.endsWith('.d.ts')) {
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
  ],
  outExtensions: () => ({ js: '.js' }),
})
