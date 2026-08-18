import { escapeAttribute, escapeHtml } from './utils.ts'

export function createColorSwatch(props: {
  label: string
  value: string
  pressed?: boolean
  warning?: string
}): string {
  const anatomy = `<span data-ui-part="chip" aria-hidden="true"></span>
  <span data-ui-part="label">${escapeHtml(props.label)}</span>
  <span data-ui-part="value">${escapeHtml(props.value)}</span>
  ${props.warning ? `<span data-ui-part="warning">${escapeHtml(props.warning)}</span>` : ''}`
  const swatchStyle = `style="--ui-color-swatch: ${escapeAttribute(props.value)}"`

  if (props.pressed === undefined) {
    return `<div class="ui-color-swatch" ${swatchStyle}>
  ${anatomy}
</div>`
  }

  return `<button class="ui-color-swatch" type="button" aria-pressed="${String(props.pressed)}" aria-label="Select ${escapeAttribute(props.label)}, ${escapeAttribute(props.value)}" ${swatchStyle}>
  ${anatomy}
</button>`
}

export type ColorPaletteEntry = {
  label: string
  value: string
  warning?: string
}

/** Lays a set of swatches out as a responsive grid. Selection makes every entry a toggle button. */
export function createColorPalette(props: {
  colors: readonly ColorPaletteEntry[]
  selected?: string
  columnSize?: string
}): string {
  const columns = `repeat(auto-fill, minmax(${props.columnSize ?? '13rem'}, 1fr))`
  const swatches = props.colors
    .map((color) =>
      createColorSwatch({
        ...color,
        pressed: props.selected === undefined ? undefined : props.selected === color.value,
      }),
    )
    .join('\n  ')
  return `<div style="display: grid; gap: 0.5rem; grid-template-columns: ${columns}">
  ${swatches}
</div>`
}
