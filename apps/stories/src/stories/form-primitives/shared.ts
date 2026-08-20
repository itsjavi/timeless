import type { StoryLiteMeta } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import formsCss from '@timelessui/components/css/forms.css?raw'
import formCss from '@timelessui/components/css/form.css?raw'
import otpFieldCss from '@timelessui/components/css/otp-field.css?raw'
import rangeCss from '@timelessui/components/css/range.css?raw'
import rangeFieldCss from '@timelessui/components/css/range-field.css?raw'
import themeCss from '@timelessui/components/css/theme-atmosphere.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'
import formDemoCss from './shared.css?raw'

const formPrimitiveParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    themeCss,
    buttonCss,
    formsCss,
    formCss,
    rangeCss,
    rangeFieldCss,
    otpFieldCss,
    demoCss,
    formDemoCss,
  ],
  defineCustomElements: defineTimelessElements,
} satisfies StoryLiteMeta['parameters']

export function createFormPrimitiveMeta(component: string): StoryLiteMeta {
  return {
    title: `Library/Forms/${component === 'Select' ? 'Native Select' : component}`,
    parameters: formPrimitiveParameters,
  }
}
