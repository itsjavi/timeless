import type { StoryLiteMeta } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import formsCss from '@timelessui/components/css/forms.css?raw'
import rangeCss from '@timelessui/components/css/range.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import demoCss from '../styles.css?raw'
import formDemoCss from './shared.css?raw'

const formPrimitiveParameters = {
  renderer: 'html',
  css: [tokensCss, buttonCss, formsCss, rangeCss, demoCss, formDemoCss],
} satisfies StoryLiteMeta['parameters']

export function createFormPrimitiveMeta(component: string): StoryLiteMeta {
  return {
    title: `Library/Forms/${component === 'Select' ? 'Native Select' : component}`,
    parameters: formPrimitiveParameters,
  }
}
