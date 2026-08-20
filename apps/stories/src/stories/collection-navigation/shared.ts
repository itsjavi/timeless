import type { StoryLiteMeta } from '@storylite/storylite'
import buttonCss from '@timelessui/components/css/button.css?raw'
import choiceGroupCss from '@timelessui/components/css/choice-groups.css?raw'
import comboboxCss from '@timelessui/components/css/combobox.css?raw'
import contextMenuCss from '@timelessui/components/css/context-menu.css?raw'
import floatingCss from '@timelessui/components/css/floating.css?raw'
import formsCss from '@timelessui/components/css/forms.css?raw'
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
    contextMenuCss,
    toolbarCss,
    formsCss,
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

export function createCollectionNavigationMeta(
  component: string,
  extraCss: readonly string[] = [],
): StoryLiteMeta {
  return {
    title: `Library/Navigation/${component}`,
    parameters:
      extraCss.length === 0
        ? collectionNavigationParameters
        : {
            ...collectionNavigationParameters,
            css: [...collectionNavigationParameters.css, ...extraCss],
          },
  }
}
