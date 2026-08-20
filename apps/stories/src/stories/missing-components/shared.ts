import type { StoryLiteMeta } from '@storylite/storylite'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import coreColorPickerCss from '@timelessui/components/css/core/color-picker.css?raw'
import colorPickerCss from '@timelessui/components/css/themes/atmosphere/color-picker.css?raw'
import coreColorSwatchCss from '@timelessui/components/css/core/color-swatch.css?raw'
import colorSwatchCss from '@timelessui/components/css/themes/atmosphere/color-swatch.css?raw'
import coreEmptyCss from '@timelessui/components/css/core/empty.css?raw'
import emptyCss from '@timelessui/components/css/themes/atmosphere/empty.css?raw'
import coreMeterCss from '@timelessui/components/css/core/meter.css?raw'
import meterCss from '@timelessui/components/css/themes/atmosphere/meter.css?raw'
import coreNumberStepperCss from '@timelessui/components/css/core/number-stepper.css?raw'
import numberStepperCss from '@timelessui/components/css/themes/atmosphere/number-stepper.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import floatingCss from '@timelessui/components/css/core/floating.css?raw'
import popoverCss from '@timelessui/components/css/themes/atmosphere/popover.css?raw'
import coreRangeCss from '@timelessui/components/css/core/range.css?raw'
import rangeCss from '@timelessui/components/css/themes/atmosphere/range.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import coreToggleCss from '@timelessui/components/css/core/toggle.css?raw'
import toggleCss from '@timelessui/components/css/themes/atmosphere/toggle.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'

export function createMissingComponentMeta(group: string, component: string): StoryLiteMeta {
  const domain =
    group === 'Color Controls'
      ? 'Color'
      : group === 'Form Primitives'
        ? 'Forms'
        : group === 'Collection Navigation'
          ? component === 'Toggle Group'
            ? 'Actions'
            : 'Navigation'
          : ['Empty', 'Meter'].includes(component)
            ? 'Feedback'
            : 'Actions'
  const displayName =
    group === 'Form Primitives' && component === 'Select' ? 'Native Select' : component
  return {
    title: `Library/${domain}/${displayName}`,
    parameters: {
      renderer: 'html',
      css: [
        tokensCss,
        themeCss,
        coreButtonCss,
        buttonCss,
        coreToggleCss,
        toggleCss,
        coreEmptyCss,
        emptyCss,
        coreMeterCss,
        meterCss,
        coreColorSwatchCss,
        colorSwatchCss,
        coreRangeCss,
        rangeCss,
        coreNumberStepperCss,
        numberStepperCss,
        floatingCss,
        corePopoverCss,
        popoverCss,
        coreColorPickerCss,
        colorPickerCss,
        demoCss,
      ],
      defineCustomElements: defineTimelessElements,
    },
  }
}
