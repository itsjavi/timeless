import type {
  AlertVariant,
  AvatarShape,
  AvatarStatus,
  BadgeVariant,
  CardVariant,
  GroupOrientation,
  ListVariant,
  PrimitiveDensity,
  PrimitiveSize,
  SeparatorOrientation,
  SeparatorVariant,
  SkeletonShape,
  SkeletonWidth,
  SpinnerVariant,
} from '@timelessui/components'
import { escapeAttribute, escapeHtml } from './utils.ts'

type AlertProps = {
  title: string
  description: string
  variant?: AlertVariant
  density?: Extract<PrimitiveDensity, 'compact' | 'normal'>
  icon?: string
  role?: 'status' | 'alert' | 'note'
  actionLabel?: string
}

type AvatarProps = {
  label: string
  initials: string
  size?: PrimitiveSize
  shape?: AvatarShape
  status?: AvatarStatus
}

type BadgeProps = {
  label: string
  variant?: BadgeVariant
  size?: PrimitiveSize
  dot?: boolean
}

type SeparatorProps = {
  orientation?: SeparatorOrientation
  variant?: Exclude<SeparatorVariant, 'centered'>
}

type CardProps = {
  title: string
  description: string
  meta?: string
  variant?: CardVariant
  density?: Extract<PrimitiveDensity, 'compact' | 'normal'>
}

type SkeletonProps = {
  shape?: SkeletonShape
  size?: PrimitiveSize
  width?: SkeletonWidth
}

type ProgressProps = {
  id?: string
  label: string
  value?: number
  max?: number
  hint?: string
  size?: PrimitiveSize
}

type GroupProps = {
  orientation?: GroupOrientation
  density?: PrimitiveDensity
  attached?: boolean
  wrap?: boolean
}

type ListProps = {
  variant?: ListVariant
  density?: Extract<PrimitiveDensity, 'compact' | 'normal'>
}

type SpinnerProps = {
  label: string
  size?: PrimitiveSize
  variant?: SpinnerVariant
}

function optionalAttribute(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value || value === defaultValue) {
    return ''
  }

  return ` ${name}="${escapeAttribute(value)}"`
}

function booleanAttribute(name: string, value: boolean | undefined): string {
  return value ? ` ${name}` : ''
}

function idFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createAlert(props: AlertProps): string {
  const variant = optionalAttribute('data-ui-variant', props.variant, 'neutral')
  const density = optionalAttribute('data-ui-density', props.density, 'normal')
  const role = props.role ? ` role="${escapeAttribute(props.role)}"` : ''
  const icon = props.icon
    ? `<span data-ui-part="icon" aria-hidden="true">${escapeHtml(props.icon)}</span>`
    : ''
  const actions = props.actionLabel
    ? `<div data-ui-part="actions">
      <a class="ui-link" href="#alert">${escapeHtml(props.actionLabel)}</a>
    </div>`
    : ''

  return `<section class="ui-alert"${variant}${density}${role}>
  ${icon}
  <div data-ui-part="content">
    <h2 data-ui-part="title">${escapeHtml(props.title)}</h2>
    <p data-ui-part="description">${escapeHtml(props.description)}</p>
    ${actions}
  </div>
</section>`
}

export function createAvatar(props: AvatarProps): string {
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const shape = optionalAttribute('data-ui-shape', props.shape, 'circle')
  const status = optionalAttribute('data-ui-status', props.status)
  const statusSlot = props.status ? '<span data-ui-part="status" aria-hidden="true"></span>' : ''
  const label = props.status ? `${props.label}, ${props.status}` : props.label

  return `<span class="ui-avatar"${size}${shape}${status} role="img" aria-label="${escapeAttribute(label)}">
  <span data-ui-part="fallback">${escapeHtml(props.initials)}</span>
  ${statusSlot}
</span>`
}

export function createBadge(props: BadgeProps): string {
  const variant = optionalAttribute('data-ui-variant', props.variant, 'neutral')
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const dot = props.dot ? '<span data-ui-part="dot" aria-hidden="true"></span>' : ''

  return `<span class="ui-badge"${variant}${size}>${dot}${escapeHtml(props.label)}</span>`
}

export function createSeparator(props: SeparatorProps = {}): string {
  const orientation = props.orientation ?? 'horizontal'
  const orientationAttribute = optionalAttribute('data-ui-orientation', orientation, 'horizontal')
  const variant = optionalAttribute('data-ui-variant', props.variant, 'default')

  if (orientation === 'vertical') {
    return `<span class="ui-separator" data-ui-orientation="vertical"${variant} role="separator" aria-orientation="vertical"></span>`
  }

  return `<hr class="ui-separator"${orientationAttribute}${variant}>`
}

export function createLabeledSeparator(label: string): string {
  return `<div class="ui-separator" data-ui-variant="centered" role="separator" aria-orientation="horizontal">
  <span data-ui-part="label">${escapeHtml(label)}</span>
</div>`
}

export function createVerticalLabeledSeparator(label?: {
  before?: string
  after?: string
}): string {
  const before = label?.before
    ? `<span data-ui-part="label">${escapeHtml(label.before)}</span>`
    : ''
  const after = label?.after ? `<span data-ui-part="label">${escapeHtml(label.after)}</span>` : ''

  return `<span class="ui-separator" data-ui-orientation="vertical" role="separator" aria-orientation="vertical">
  ${before}
  <hr aria-hidden="true">
  ${after}
</span>`
}

export function createCard(props: CardProps): string {
  const variant = optionalAttribute('data-ui-variant', props.variant, 'surface')
  const density = optionalAttribute('data-ui-density', props.density, 'normal')
  const meta = props.meta ? `<p data-ui-part="meta">${escapeHtml(props.meta)}</p>` : ''

  return `<article class="ui-card"${variant}${density}>
  <header data-ui-part="header">
    ${meta}
    <h2 data-ui-part="title">${escapeHtml(props.title)}</h2>
    <p data-ui-part="description">${escapeHtml(props.description)}</p>
  </header>
  <footer data-ui-part="footer">
    <div data-ui-part="actions">
      <a class="ui-link" href="#card">Open</a>
      ${createBadge({ label: 'Stable', variant: 'success' })}
    </div>
  </footer>
</article>`
}

export function createSkeleton(props: SkeletonProps = {}): string {
  const shape = optionalAttribute('data-ui-shape', props.shape, 'text')
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const width = optionalAttribute('data-ui-width', props.width, 'full')

  return `<span class="ui-skeleton"${shape}${size}${width} aria-hidden="true"></span>`
}

export function createProgress(props: ProgressProps): string {
  const id = props.id ?? `progress-${idFragment(props.label) || 'value'}`
  const max = props.max ?? 100
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const value = typeof props.value === 'number' ? ` value="${props.value}"` : ''
  const output =
    typeof props.value === 'number' ? `${Math.round((props.value / max) * 100)}%` : 'Loading'
  const hintId = props.hint ? `${id}-hint` : ''
  const describedBy = props.hint ? ` aria-describedby="${escapeAttribute(hintId)}"` : ''
  const hint = props.hint
    ? `<p id="${escapeAttribute(hintId)}" data-ui-part="hint">${escapeHtml(props.hint)}</p>`
    : ''

  return `<div class="ui-progress"${size}>
  <div data-ui-part="header">
    <label for="${escapeAttribute(id)}">${escapeHtml(props.label)}</label>
    <output for="${escapeAttribute(id)}" data-ui-part="output">${escapeHtml(output)}</output>
  </div>
  <progress id="${escapeAttribute(id)}" max="${max}"${value}${describedBy}></progress>
  ${hint}
</div>`
}

export function createTextPrimitives(): string {
  return `<div class="ui-primitive-copy">
  <p>Use <a class="ui-link" href="#link">links</a>, <code class="ui-code">inline code</code>, and <kbd class="ui-kbd">Cmd</kbd><kbd class="ui-kbd">K</kbd> in dense interface text.</p>
  <pre class="ui-code" tabindex="0" aria-label="Component CSS import"><code>import '@timelessui/components/css/components.css'</code></pre>
</div>`
}

export function createGroup(props: GroupProps = {}): string {
  const orientation = optionalAttribute('data-ui-orientation', props.orientation, 'horizontal')
  const density = optionalAttribute('data-ui-density', props.density, 'normal')
  const attached = booleanAttribute('data-ui-attached', props.attached)
  const wrap = booleanAttribute('data-ui-wrap', props.wrap)

  return `<div class="ui-group"${orientation}${density}${attached}${wrap}>
  <button class="ui-button" data-ui-variant="secondary" type="button">Day</button>
  <button class="ui-button" data-ui-variant="secondary" type="button">Week</button>
  <button class="ui-button" type="button">Month</button>
</div>`
}

export function createList(props: ListProps = {}): string {
  const variant = optionalAttribute('data-ui-variant', props.variant, 'plain')
  const density = optionalAttribute('data-ui-density', props.density, 'normal')
  const tag = props.variant === 'ordered' ? 'ol' : 'ul'
  const items: ReadonlyArray<readonly [string, string]> = [
    ['Install package CSS', 'Import tokens and only the components you use.'],
    ['Author native markup', 'Keep behavior available when CSS is absent.'],
    ['Style public anatomy', 'Use class hooks and namespaced data attributes.'],
  ]

  return `<${tag} class="ui-list"${variant}${density}>
  ${items
    .map(
      ([title, description]) => `<li data-ui-part="item">
    <span data-ui-part="title">${escapeHtml(title)}</span>
    <span data-ui-part="description">${escapeHtml(description)}</span>
  </li>`,
    )
    .join('\n  ')}
</${tag}>`
}

export function createTable(): string {
  return `<div class="ui-table" role="region" aria-label="Primitive coverage table" tabindex="0">
  <table>
    <caption>
      <span data-ui-part="caption">Primitive coverage</span>
      <span data-ui-part="description">CSS-only component contracts in this milestone batch.</span>
    </caption>
    <thead>
      <tr>
        <th scope="col">Primitive</th>
        <th scope="col">Contract</th>
        <th scope="col" data-ui-align="end">Depth</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Badge</th>
        <td><code class="ui-code">.ui-badge</code></td>
        <td data-ui-align="end">Flat</td>
      </tr>
      <tr>
        <th scope="row">Card</th>
        <td><code class="ui-code">.ui-card</code></td>
        <td data-ui-align="end">Flat</td>
      </tr>
      <tr>
        <th scope="row">Disclosure</th>
        <td><code class="ui-code">details.ui-disclosure</code></td>
        <td data-ui-align="end">Native</td>
      </tr>
    </tbody>
  </table>
</div>`
}

export function createDisclosure(): string {
  return `<section aria-label="Disclosure examples">
  <details class="ui-disclosure" open>
    <summary>Why details and summary?</summary>
    <div>
      <p>Native disclosure keeps keyboard interaction and semantics in the platform while Timeless styles the public anatomy.</p>
    </div>
  </details>
  <details class="ui-disclosure">
    <summary>Can consumers customize the content?</summary>
    <div>
      <p>Yes. The panel is author-owned Light DOM, so app CSS can target it without crossing a shadow boundary.</p>
    </div>
  </details>
</section>`
}

export function createSpinner(props: SpinnerProps): string {
  const size = optionalAttribute('data-ui-size', props.size, 'md')
  const variant = optionalAttribute('data-ui-variant', props.variant, 'neutral')

  return `<span class="ui-spinner"${size}${variant} role="status">
  <span data-ui-part="label">${escapeHtml(props.label)}</span>
</span>`
}
