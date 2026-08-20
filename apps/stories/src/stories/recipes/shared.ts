import type { StoryLiteMeta } from '@storylite/storylite'
import coreAvatarCss from '@timelessui/components/css/core/avatar.css?raw'
import avatarCss from '@timelessui/components/css/avatar.css?raw'
import coreBadgeCss from '@timelessui/components/css/core/badge.css?raw'
import badgeCss from '@timelessui/components/css/badge.css?raw'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/button.css?raw'
import coreColorPickerCss from '@timelessui/components/css/core/color-picker.css?raw'
import colorPickerCss from '@timelessui/components/css/color-picker.css?raw'
import coreColorSwatchCss from '@timelessui/components/css/core/color-swatch.css?raw'
import colorSwatchCss from '@timelessui/components/css/color-swatch.css?raw'
import coreDialogCss from '@timelessui/components/css/core/dialog.css?raw'
import dialogCss from '@timelessui/components/css/dialog.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import coreOptionsCss from '@timelessui/components/css/core/options.css?raw'
import coreSelectCss from '@timelessui/components/css/core/select.css?raw'
import floatingCss from '@timelessui/components/css/core/floating.css?raw'
import coreFormsCss from '@timelessui/components/css/core/forms.css?raw'
import formsCss from '@timelessui/components/css/forms.css?raw'
import coreListCss from '@timelessui/components/css/core/list.css?raw'
import listCss from '@timelessui/components/css/list.css?raw'
import optionsCss from '@timelessui/components/css/options.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import selectCss from '@timelessui/components/css/select.css?raw'
import coreRangeCss from '@timelessui/components/css/core/range.css?raw'
import rangeCss from '@timelessui/components/css/range.css?raw'
import coreToggleCss from '@timelessui/components/css/core/toggle.css?raw'
import toggleCss from '@timelessui/components/css/toggle.css?raw'
import themeCss from '@timelessui/components/css/theme-atmosphere.css?raw'
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
        themeCss,
        coreButtonCss,
        buttonCss,
        coreAvatarCss,
        avatarCss,
        coreBadgeCss,
        badgeCss,
        coreListCss,
        listCss,
        coreFormsCss,
        formsCss,
        coreToggleCss,
        toggleCss,
        coreRangeCss,
        rangeCss,
        floatingCss,
        corePopoverCss,
        popoverCss,
        coreDialogCss,
        dialogCss,
        coreOptionsCss,
        optionsCss,
        coreSelectCss,
        selectCss,
        coreColorPickerCss,
        colorPickerCss,
        coreColorSwatchCss,
        colorSwatchCss,
        demoCss,
      ],
      defineCustomElements: defineTimelessElements,
    },
  }
}
