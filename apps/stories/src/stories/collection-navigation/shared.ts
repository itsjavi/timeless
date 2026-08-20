import type { StoryLiteMeta } from '@storylite/storylite'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import coreChoiceGroupCss from '@timelessui/components/css/core/choice-groups.css?raw'
import choiceGroupCss from '@timelessui/components/css/themes/atmosphere/choice-groups.css?raw'
import comboboxCss from '@timelessui/components/css/themes/atmosphere/combobox.css?raw'
import contextMenuCss from '@timelessui/components/css/themes/atmosphere/context-menu.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import coreMenuCss from '@timelessui/components/css/core/menu.css?raw'
import coreContextMenuCss from '@timelessui/components/css/core/context-menu.css?raw'
import coreListboxCss from '@timelessui/components/css/core/listbox.css?raw'
import coreOptionsCss from '@timelessui/components/css/core/options.css?raw'
import coreSelectCss from '@timelessui/components/css/core/select.css?raw'
import coreComboboxCss from '@timelessui/components/css/core/combobox.css?raw'
import floatingCss from '@timelessui/components/css/core/floating.css?raw'
import coreFormsCss from '@timelessui/components/css/core/forms.css?raw'
import formsCss from '@timelessui/components/css/themes/atmosphere/forms.css?raw'
import listboxCss from '@timelessui/components/css/themes/atmosphere/listbox.css?raw'
import optionsCss from '@timelessui/components/css/themes/atmosphere/options.css?raw'
import menuCss from '@timelessui/components/css/themes/atmosphere/menu.css?raw'
import popoverCss from '@timelessui/components/css/themes/atmosphere/popover.css?raw'
import selectCss from '@timelessui/components/css/themes/atmosphere/select.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import coreToolbarCss from '@timelessui/components/css/core/toolbar.css?raw'
import toolbarCss from '@timelessui/components/css/themes/atmosphere/toolbar.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import demoCss from '../styles.css?raw'
import overlayDemoCss from '../progressive-overlays/shared.css?raw'

const collectionNavigationParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    themeCss,
    coreButtonCss,
    buttonCss,
    floatingCss,
    corePopoverCss,
    popoverCss,
    coreMenuCss,
    menuCss,
    coreContextMenuCss,
    contextMenuCss,
    coreToolbarCss,
    toolbarCss,
    coreFormsCss,
    formsCss,
    coreChoiceGroupCss,
    choiceGroupCss,
    coreOptionsCss,
    optionsCss,
    coreListboxCss,
    listboxCss,
    coreSelectCss,
    selectCss,
    coreComboboxCss,
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
