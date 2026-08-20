import type { StoryLiteMeta } from '@storylite/storylite'
import coreAlertCss from '@timelessui/components/css/core/alert.css?raw'
import alertCss from '@timelessui/components/css/themes/atmosphere/alert.css?raw'
import coreAvatarCss from '@timelessui/components/css/core/avatar.css?raw'
import avatarCss from '@timelessui/components/css/themes/atmosphere/avatar.css?raw'
import coreBadgeCss from '@timelessui/components/css/core/badge.css?raw'
import badgeCss from '@timelessui/components/css/themes/atmosphere/badge.css?raw'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import coreCardCss from '@timelessui/components/css/core/card.css?raw'
import cardCss from '@timelessui/components/css/themes/atmosphere/card.css?raw'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import codeCss from '@timelessui/components/css/themes/atmosphere/code.css?raw'
import coreGroupCss from '@timelessui/components/css/core/group.css?raw'
import groupCss from '@timelessui/components/css/themes/atmosphere/group.css?raw'
import coreKbdCss from '@timelessui/components/css/core/kbd.css?raw'
import kbdCss from '@timelessui/components/css/themes/atmosphere/kbd.css?raw'
import linkCss from '@timelessui/components/css/themes/atmosphere/link.css?raw'
import coreListCss from '@timelessui/components/css/core/list.css?raw'
import listCss from '@timelessui/components/css/themes/atmosphere/list.css?raw'
import coreProgressCss from '@timelessui/components/css/core/progress.css?raw'
import progressCss from '@timelessui/components/css/themes/atmosphere/progress.css?raw'
import coreSeparatorCss from '@timelessui/components/css/core/separator.css?raw'
import separatorCss from '@timelessui/components/css/themes/atmosphere/separator.css?raw'
import coreSkeletonCss from '@timelessui/components/css/core/skeleton.css?raw'
import skeletonCss from '@timelessui/components/css/themes/atmosphere/skeleton.css?raw'
import coreSpinnerCss from '@timelessui/components/css/core/spinner.css?raw'
import spinnerCss from '@timelessui/components/css/themes/atmosphere/spinner.css?raw'
import coreTableCss from '@timelessui/components/css/core/table.css?raw'
import tableCss from '@timelessui/components/css/themes/atmosphere/table.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import demoCss from '../styles.css?raw'
import primitiveDemoCss from './shared.css?raw'

const cssPrimitiveParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    themeCss,
    coreButtonCss,
    buttonCss,
    coreAlertCss,
    alertCss,
    coreAvatarCss,
    avatarCss,
    coreBadgeCss,
    badgeCss,
    coreSeparatorCss,
    separatorCss,
    coreCardCss,
    cardCss,
    coreSkeletonCss,
    skeletonCss,
    coreProgressCss,
    progressCss,
    linkCss,
    coreKbdCss,
    kbdCss,
    coreCodeCss,
    codeCss,
    coreGroupCss,
    groupCss,
    coreListCss,
    listCss,
    coreTableCss,
    tableCss,
    coreSpinnerCss,
    spinnerCss,
    demoCss,
    primitiveDemoCss,
  ],
} satisfies StoryLiteMeta['parameters']

export function createCssPrimitiveMeta(component: string): StoryLiteMeta {
  const domain =
    component === 'Separator' || component === 'Text'
      ? 'Foundations'
      : component === 'Toggle'
        ? 'Actions'
        : ['Avatar', 'Card', 'Group', 'List', 'Table'].includes(component)
          ? 'Content'
          : 'Feedback'
  const displayName = component === 'Text' ? 'Text and Code' : component
  return structuredClone({
    title: `Library/${domain}/${displayName}`,
    parameters: cssPrimitiveParameters,
  })
}
