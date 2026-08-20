import type { StoryLiteMeta } from '@storylite/storylite'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/button.css?raw'
import coreCollapsibleCss from '@timelessui/components/css/core/collapsible.css?raw'
import collapsibleCss from '@timelessui/components/css/collapsible.css?raw'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import codeCss from '@timelessui/components/css/code.css?raw'
import coreDialogCss from '@timelessui/components/css/core/dialog.css?raw'
import dialogCss from '@timelessui/components/css/dialog.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import coreSheetCss from '@timelessui/components/css/core/sheet.css?raw'
import coreToastCss from '@timelessui/components/css/core/toast.css?raw'
import floatingCss from '@timelessui/components/css/core/floating.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import sheetCss from '@timelessui/components/css/sheet.css?raw'
import coreTabsCss from '@timelessui/components/css/core/tabs.css?raw'
import tabsCss from '@timelessui/components/css/tabs.css?raw'
import themeCss from '@timelessui/components/css/theme-atmosphere.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import toastCss from '@timelessui/components/css/toast.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'
import overlayDemoCss from './shared.css?raw'

const progressiveOverlayParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    themeCss,
    coreButtonCss,
    buttonCss,
    coreCodeCss,
    codeCss,
    coreTabsCss,
    tabsCss,
    coreCollapsibleCss,
    collapsibleCss,
    coreDialogCss,
    dialogCss,
    coreSheetCss,
    sheetCss,
    floatingCss,
    corePopoverCss,
    popoverCss,
    coreToastCss,
    toastCss,
    demoCss,
    overlayDemoCss,
  ],
  defineCustomElements: defineTimelessElements,
} satisfies StoryLiteMeta['parameters']

export function createProgressiveOverlayMeta(component: string): StoryLiteMeta {
  return {
    title: `Library/${component === 'Toast' ? 'Feedback' : 'Overlays'}/${component}`,
    parameters: progressiveOverlayParameters,
  }
}
