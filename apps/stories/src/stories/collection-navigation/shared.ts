import type { StoryLiteMeta } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import choiceGroupCss from '@timelessui/components/css/choice-group.css?raw'
import comboboxCss from '@timelessui/components/css/combobox.css?raw'
import floatingCss from '@timelessui/components/css/floating.css?raw'
import listboxCss from '@timelessui/components/css/listbox.css?raw'
import optionsCss from '@timelessui/components/css/options.css?raw'
import menuCss from '@timelessui/components/css/menu.css?raw'
import popoverCss from '@timelessui/components/css/popover.css?raw'
import selectCss from '@timelessui/components/css/select.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import toolbarCss from '@timelessui/components/css/toolbar.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'
import overlayDemoCss from '../progressive-overlays/shared.css?raw'

const collectionNavigationParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    buttonCss,
    floatingCss,
    popoverCss,
    menuCss,
    toolbarCss,
    choiceGroupCss,
    optionsCss,
    listboxCss,
    selectCss,
    comboboxCss,
    demoCss,
    overlayDemoCss,
  ],
  defineCustomElements: defineTimelessElements,
} satisfies StoryLiteMeta['parameters']

export function createCollectionNavigationMeta(component: string): StoryLiteMeta {
  return {
    title: `Library/Navigation/${component}`,
    parameters: collectionNavigationParameters,
  }
}
