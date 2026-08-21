import type { BreadcrumbSeparator, CompactDensity, PrimitiveSize } from '@timelessui/components'
import { uiAttributeString } from '@timelessui/components/attributes'
import { escapeAttribute, escapeHtml } from './utils.ts'

type Crumb = {
  readonly label: string
  /** Omit on the last crumb: the page you are already on is not a link. */
  readonly href?: string
}

type BreadcrumbProps = {
  readonly trail: readonly Crumb[]
  /** Accessible name for the `<nav>` landmark. Every landmark of a repeated type needs one. */
  readonly label?: string
  readonly separator?: BreadcrumbSeparator
  readonly density?: CompactDensity
}

type PaginationProps = {
  readonly page: number
  readonly pageCount: number
  /** Accessible name for the `<nav>` landmark. */
  readonly label?: string
  readonly size?: PrimitiveSize
  /** Composes `ui-group` onto the list for a joined strip instead of separate cells. */
  readonly attached?: boolean
  /** Prefix each page link is appended to, so the example produces real, shareable URLs. */
  readonly hrefPrefix?: string
  /** Pages to keep either side of the current one before the range elides. */
  readonly siblings?: number
}

/**
 * A breadcrumb trail: a labelled `<nav>` landmark, an `<ol>` in hierarchical order, and a final crumb
 * that is not a link. Nothing sits between the crumbs — the separator is a `::before` pseudo-element
 * with empty alternative text, so it is drawn by the theme and never announced.
 */
export function createBreadcrumb(props: BreadcrumbProps): string {
  const root = uiAttributeString('breadcrumb', {
    separator: props.separator,
    density: props.density,
  })
  const items = props.trail
    .map((crumb, index) => {
      const isLast = index === props.trail.length - 1
      const content =
        isLast || !crumb.href
          ? `<span data-ui-part="current" aria-current="page">${escapeHtml(crumb.label)}</span>`
          : `<a data-ui-part="link" href="${escapeAttribute(crumb.href)}">${escapeHtml(crumb.label)}</a>`
      return `    <li data-ui-part="item">${content}</li>`
    })
    .join('\n')

  return `<nav ${root} aria-label="${escapeAttribute(props.label ?? 'Breadcrumb')}">
  <ol>
${items}
  </ol>
</nav>`
}

/**
 * Page navigation as links, because a page is a URL: shareable, middle-clickable, and in the back
 * button's history. The current page and any boundary control are `<span>` elements rather than
 * links, since a disabled link is a contradiction — it still navigates.
 */
export function createPagination(props: PaginationProps): string {
  const root = uiAttributeString('pagination', { size: props.size })
  const prefix = props.hrefPrefix ?? '?page='
  const href = (page: number): string => escapeAttribute(`${prefix}${page}`)
  const list = props.attached ? '<ul class="ui-group" data-ui-attached>' : '<ul>'

  const previous =
    props.page > 1
      ? `<a data-ui-part="previous" href="${href(props.page - 1)}" rel="prev">Previous</a>`
      : `<span data-ui-part="previous">Previous</span>`
  const next =
    props.page < props.pageCount
      ? `<a data-ui-part="next" href="${href(props.page + 1)}" rel="next">Next</a>`
      : `<span data-ui-part="next">Next</span>`

  const pages = paginationRange(props.page, props.pageCount, props.siblings ?? 1).map((entry) =>
    entry === 'ellipsis'
      ? `<span data-ui-part="ellipsis" aria-hidden="true">&hellip;</span>`
      : entry === props.page
        ? `<span data-ui-part="link" aria-current="page">${entry}</span>`
        : `<a data-ui-part="link" href="${href(entry)}" aria-label="Page ${entry}">${entry}</a>`,
  )

  const items = [previous, ...pages, next]
    .map((cell) => `    <li data-ui-part="item">${cell}</li>`)
    .join('\n')

  return `<nav ${root} aria-label="${escapeAttribute(props.label ?? 'Pagination')}">
  ${list}
${items}
  </ul>
</nav>`
}

/**
 * The page numbers to render, with `ellipsis` standing in for the runs that are omitted. The first
 * and last page are always present so the ends of the range stay reachable in one click.
 */
export function paginationRange(
  page: number,
  pageCount: number,
  siblings = 1,
): ReadonlyArray<number | 'ellipsis'> {
  const shown = new Set<number>([1, pageCount])
  for (let offset = -siblings; offset <= siblings; offset += 1) {
    const candidate = page + offset
    if (candidate >= 1 && candidate <= pageCount) shown.add(candidate)
  }

  const entries: Array<number | 'ellipsis'> = []
  let previous = 0
  for (const current of [...shown].sort((a, b) => a - b)) {
    if (previous && current - previous > 1) entries.push('ellipsis')
    entries.push(current)
    previous = current
  }
  return entries
}

type NavigationMenuSection = {
  readonly id: string
  readonly label: string
  readonly links: readonly { readonly label: string; readonly href: string }[]
}

type NavigationMenuProps = {
  readonly sections: readonly NavigationMenuSection[]
  /** Links with no panel behind them, rendered after the sections. */
  readonly links?: readonly { readonly label: string; readonly href: string }[]
  /** Accessible name for the `<nav>` landmark. */
  readonly label?: string
  readonly openDelay?: number
  readonly closeDelay?: number
}

/**
 * A navigation menu, composed rather than shipped as an element.
 *
 * The one rule this recipe exists to enforce: **a menu of links is not an APG menu.** `role="menu"`
 * means a set of commands with roving focus, where one Tab stop holds the whole set and the arrow
 * keys move inside it. Links are individually tabbable, and `Tab` is the traversal a reader expects
 * from a site nav — so the panels are `role="group"` regions, which is what `ui-hover-card` gives
 * them, and nothing here takes focus away from the platform.
 *
 * Everything else is Hover Card's: `aria-expanded` and `aria-controls` on each trigger, opening on
 * pointer intent and on focus, closing on pointer-leave, blur, and Escape, and the close delay that
 * lets the pointer cross the gap into the panel.
 *
 * The delays are what make the bar read as one menu rather than as three cards. `close-delay` is
 * shorter than `open-delay`, so moving along the bar closes the panel you are leaving before the next
 * one opens; equal delays leave both surfaces in the top layer for the difference. Hover Card takes
 * the surface to `popover="manual"` on enhancement — that is what lets the pointer cross the gap
 * without the browser light-dismissing mid-journey — so the handoff is these two numbers, not the
 * Popover API closing one `auto` surface as another opens.
 */
export function createNavigationMenu(props: NavigationMenuProps): string {
  const openDelay = props.openDelay ?? 120
  const closeDelay = props.closeDelay ?? 100
  const items = [
    ...props.sections.map((section) => {
      const panelId = escapeAttribute(section.id)
      const titleId = `${panelId}-title`
      const links = section.links
        .map(
          (link) =>
            `        <li data-ui-part="item"><a class="ui-link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a></li>`,
        )
        .join('\n')

      return `    <li>
      <ui-hover-card open-delay="${openDelay}" close-delay="${closeDelay}">
        <button class="ui-button" data-ui-variant="ghost" data-ui-part="trigger" type="button" aria-controls="${panelId}" aria-expanded="false">${escapeHtml(section.label)}</button>
        <div id="${panelId}" popover="manual" role="group" aria-labelledby="${titleId}">
          <h2 id="${titleId}">${escapeHtml(section.label)}</h2>
          <ul class="ui-list" data-ui-density="compact">
${links}
          </ul>
        </div>
      </ui-hover-card>
    </li>`
    }),
    ...(props.links ?? []).map(
      (link) =>
        `    <li><a class="ui-button" data-ui-variant="ghost" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a></li>`,
    ),
  ]

  return `<nav aria-label="${escapeAttribute(props.label ?? 'Main')}">
  <ul class="ui-group" data-ui-density="compact" data-ui-wrap>
${items.join('\n')}
  </ul>
</nav>`
}
