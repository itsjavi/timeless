import type { StoryLiteMeta } from '@storylite/storylite'
import alertCss from '@timelessui/components/css/alert.css?raw'
import avatarCss from '@timelessui/components/css/avatar.css?raw'
import badgeCss from '@timelessui/components/css/badge.css?raw'
import buttonCss from '@timelessui/components/css/button.css?raw'
import cardCss from '@timelessui/components/css/card.css?raw'
import codeCss from '@timelessui/components/css/code.css?raw'
import disclosureCss from '@timelessui/components/css/disclosure.css?raw'
import groupCss from '@timelessui/components/css/group.css?raw'
import kbdCss from '@timelessui/components/css/kbd.css?raw'
import linkCss from '@timelessui/components/css/link.css?raw'
import listCss from '@timelessui/components/css/list.css?raw'
import progressCss from '@timelessui/components/css/progress.css?raw'
import separatorCss from '@timelessui/components/css/separator.css?raw'
import skeletonCss from '@timelessui/components/css/skeleton.css?raw'
import spinnerCss from '@timelessui/components/css/spinner.css?raw'
import tableCss from '@timelessui/components/css/table.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import demoCss from '../styles.css?raw'
import primitiveDemoCss from './shared.css?raw'

const cssPrimitiveParameters = {
  renderer: 'html',
  css: [
    tokensCss,
    buttonCss,
    alertCss,
    avatarCss,
    badgeCss,
    separatorCss,
    cardCss,
    skeletonCss,
    progressCss,
    linkCss,
    kbdCss,
    codeCss,
    groupCss,
    listCss,
    tableCss,
    disclosureCss,
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
        : ['Avatar', 'Card', 'Disclosure', 'Group', 'List', 'Table'].includes(component)
          ? 'Content'
          : 'Feedback'
  const displayName = component === 'Text' ? 'Text and Code' : component
  return structuredClone({
    title: `Library/${domain}/${displayName}`,
    parameters: cssPrimitiveParameters,
  })
}
