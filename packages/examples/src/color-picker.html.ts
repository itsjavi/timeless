import { escapeAttribute, escapeHtml } from './utils.ts'

const FORMAT_GROUPS = [
  { label: 'Perceptual', formats: ['oklch', 'oklab', 'lch', 'lab'] },
  { label: 'sRGB', formats: ['hex', 'rgb', 'hsl', 'hwb'] },
  { label: 'Wide gamut', formats: ['p3', 'rec2020'] },
] as const
const CHANNELS = ['Lightness', 'Chroma', 'Hue', 'Alpha'] as const

export function createColorPicker(props: {
  id: string
  label: string
  value: string
  popover?: boolean
}): string {
  const picker = `<ui-color-picker value="${escapeAttribute(props.value)}" format="oklch" aria-label="${escapeAttribute(props.label)}"${props.popover ? ' data-ui-part="content" popover role="dialog"' : ''}>
  <div data-ui-part="preview">
    <div data-ui-part="preview-bar">
      <label data-ui-part="format-field">
        <span data-ui-part="input-label">Color format</span>
        <select data-ui-part="format">
          ${FORMAT_GROUPS.map(
            (group) =>
              `<optgroup label="${group.label}">${group.formats.map((format) => `<option value="${format}">${format}</option>`).join('')}</optgroup>`,
          ).join('\n          ')}
        </select>
      </label>
      <div data-ui-part="gamut-bar">
        <button data-ui-part="clamp" value="srgb" type="button" aria-label="Clamp to sRGB" hidden>&rarr; sRGB</button>
        <button data-ui-part="clamp" value="p3" type="button" aria-label="Clamp to P3" hidden>&rarr; P3</button>
      </div>
    </div>
    <div data-ui-part="readout">
      <span data-ui-part="gamut" aria-hidden="true"></span>
      <label>
        <span data-ui-part="input-label">Raw color value</span>
        <input data-ui-part="input" type="text" spellcheck="false" autocomplete="off" aria-describedby="${props.id}-warning">
      </label>
      <button data-ui-part="copy" type="button" aria-label="Copy color value">
        <svg data-ui-part="copy-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="2" />
          <path d="M10.25 3.5A1.75 1.75 0 0 0 8.5 1.75h-4.75A1.75 1.75 0 0 0 2 3.5v6.75" />
        </svg>
        <svg data-ui-part="copied-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M2.75 8.75 6.25 12.25 13.25 4.25" />
        </svg>
      </button>
    </div>
  </div>
  <div data-ui-part="channels">
    ${CHANNELS.map(
      (name) => `<div data-ui-part="channel">
      <span data-ui-part="channel-label" aria-hidden="true"></span>
      <input data-ui-part="channel-range" type="range" aria-label="${name}">
      <input data-ui-part="channel-input" type="number" inputmode="decimal" aria-label="${name} value">
    </div>`,
    ).join('\n    ')}
    <p id="${props.id}-warning" data-ui-part="warning" role="status" hidden></p>
  </div>
</ui-color-picker>`

  if (!props.popover) return picker
  return `<ui-popover>
  <button class="ui-color-swatch" type="button" data-ui-part="trigger" aria-label="Edit ${escapeAttribute(props.label)}" style="--ui-color-swatch: ${escapeAttribute(props.value)}">
    <span data-ui-part="chip" aria-hidden="true"></span>
    <span data-ui-part="label">${escapeHtml(props.label)}</span>
    <span data-ui-part="value">${escapeHtml(props.value)}</span>
  </button>
  ${picker}
</ui-popover>`
}

/** Mirrors the live picker value onto the swatch trigger that opens it. */
export const colorPickerPopoverScript = `for (const popover of document.querySelectorAll('ui-popover')) {
  const picker = popover.querySelector('ui-color-picker')
  const trigger = popover.querySelector("[data-ui-part~='trigger']")
  if (!picker || !trigger) continue
  const value = trigger.querySelector("[data-ui-part~='value']")
  const sync = () => {
    trigger.style.setProperty('--ui-color-swatch', picker.value)
    if (value) value.textContent = picker.value
  }
  picker.addEventListener('input', sync)
  picker.addEventListener('change', sync)
}`
