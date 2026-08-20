import type { StoryLiteMeta } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import colorPickerCss from '@timelessui/components/css/color-picker.css?raw'
import colorSwatchCss from '@timelessui/components/css/color-swatch.css?raw'
import emptyCss from '@timelessui/components/css/empty.css?raw'
import meterCss from '@timelessui/components/css/meter.css?raw'
import numberStepperCss from '@timelessui/components/css/number-stepper.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import floatingCss from '@timelessui/components/css/core/floating.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import rangeCss from '@timelessui/components/css/range.css?raw'
import themeCss from '@timelessui/components/css/theme-atmosphere.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import toggleCss from '@timelessui/components/css/toggle.css?raw'
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
        buttonCss,
        toggleCss,
        emptyCss,
        meterCss,
        colorSwatchCss,
        rangeCss,
        numberStepperCss,
        floatingCss,
        corePopoverCss,
        popoverCss,
        colorPickerCss,
        demoCss,
      ],
      defineCustomElements: defineTimelessElements,
    },
  }
}
