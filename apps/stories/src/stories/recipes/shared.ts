import type { StoryLiteMeta } from '@storylite/storylite'
import avatarCss from '@timelessui/components/css/avatar.css?raw'
import badgeCss from '@timelessui/components/css/badge.css?raw'
import buttonCss from '@timelessui/components/css/button.css?raw'
import colorPickerCss from '@timelessui/components/css/color-picker.css?raw'
import colorSwatchCss from '@timelessui/components/css/color-swatch.css?raw'
import dialogCss from '@timelessui/components/css/dialog.css?raw'
import floatingCss from '@timelessui/components/css/floating.css?raw'
import formsCss from '@timelessui/components/css/forms.css?raw'
import listCss from '@timelessui/components/css/list.css?raw'
import optionsCss from '@timelessui/components/css/options.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import selectCss from '@timelessui/components/css/select.css?raw'
import rangeCss from '@timelessui/components/css/range.css?raw'
import toggleCss from '@timelessui/components/css/toggle.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'

export function createRecipeMeta(path: string): StoryLiteMeta {
  return {
    title: `Recipes/${path}`,
    parameters: {
      renderer: 'html',
      css: [
        tokensCss,
        buttonCss,
        avatarCss,
        badgeCss,
        listCss,
        formsCss,
        toggleCss,
        rangeCss,
        floatingCss,
        popoverCss,
        dialogCss,
        optionsCss,
        selectCss,
        colorPickerCss,
        colorSwatchCss,
        demoCss,
      ],
      defineCustomElements: defineTimelessElements,
    },
  }
}
