import type { StoryLiteMeta } from '@storylite/storylite'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import coreFormsCss from '@timelessui/components/css/core/forms.css?raw'
import formsCss from '@timelessui/components/css/themes/atmosphere/forms.css?raw'
import formCss from '@timelessui/components/css/core/form.css?raw'
import coreOtpFieldCss from '@timelessui/components/css/core/otp-field.css?raw'
import otpFieldCss from '@timelessui/components/css/themes/atmosphere/otp-field.css?raw'
import coreRangeCss from '@timelessui/components/css/core/range.css?raw'
import rangeCss from '@timelessui/components/css/themes/atmosphere/range.css?raw'
import coreRangeFieldCss from '@timelessui/components/css/core/range-field.css?raw'
import rangeFieldCss from '@timelessui/components/css/themes/atmosphere/range-field.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'
import formDemoCss from './shared.css?raw'

const formPrimitiveParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    themeCss,
    coreButtonCss,
    buttonCss,
    coreFormsCss,
    formsCss,
    formCss,
    coreRangeCss,
    rangeCss,
    coreRangeFieldCss,
    rangeFieldCss,
    coreOtpFieldCss,
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
