type ElementDefiner = (targetWindow?: Window) => unknown

const loaders: Record<string, () => Promise<ElementDefiner>> = {
  'ui-tabs': async () => (await import('@timelessui/components/define/ui-tabs')).defineTabsElement,
  'ui-dialog': async () =>
    (await import('@timelessui/components/define/ui-dialog')).defineDialogElement,
  'ui-sheet': async () =>
    (await import('@timelessui/components/define/ui-sheet')).defineSheetElement,
  'ui-popover': async () =>
    (await import('@timelessui/components/define/ui-popover')).definePopoverElement,
  'ui-hover-card': async () =>
    (await import('@timelessui/components/define/ui-hover-card')).defineHoverCardElement,
  'ui-menu': async () => (await import('@timelessui/components/define/ui-menu')).defineMenuElement,
  'ui-menu-button': async () =>
    (await import('@timelessui/components/define/ui-menu-button')).defineMenuButtonElement,
  'ui-context-menu': async () =>
    (await import('@timelessui/components/define/ui-context-menu')).defineContextMenuElement,
  'ui-toolbar': async () =>
    (await import('@timelessui/components/define/ui-toolbar')).defineToolbarElement,
  'ui-radio-group': async () =>
    (await import('@timelessui/components/define/ui-radio-group')).defineRadioGroupElement,
  'ui-checkbox-group': async () =>
    (await import('@timelessui/components/define/ui-checkbox-group')).defineCheckboxGroupElement,
  'ui-listbox': async () =>
    (await import('@timelessui/components/define/ui-listbox')).defineListboxElement,
  'ui-select': async () =>
    (await import('@timelessui/components/define/ui-select')).defineSelectElement,
  'ui-combobox': async () =>
    (await import('@timelessui/components/define/ui-combobox')).defineComboboxElement,
  'ui-toaster': async () =>
    (await import('@timelessui/components/define/ui-toaster')).defineToasterElement,
  'ui-toast': async () =>
    (await import('@timelessui/components/define/ui-toast')).defineToastElement,
  'ui-toggle-group': async () =>
    (await import('@timelessui/components/define/ui-toggle-group')).defineToggleGroupElement,
  'ui-number-stepper': async () =>
    (await import('@timelessui/components/define/ui-number-stepper')).defineNumberStepperElement,
  'ui-color-picker': async () =>
    (await import('@timelessui/components/define/ui-color-picker')).defineColorPickerElement,
  'ui-form': async () => (await import('@timelessui/components/define/ui-form')).defineFormElement,
  'ui-range-field': async () =>
    (await import('@timelessui/components/define/ui-range-field')).defineRangeFieldElement,
  'ui-otp-field': async () =>
    (await import('@timelessui/components/define/ui-otp-field')).defineOtpFieldElement,
}

const definitions = JSON.parse(document.body.dataset.definitions ?? '[]') as string[]
await Promise.all(
  definitions.map(async (tag) => {
    const load = loaders[tag]
    if (!load) throw new Error(`Missing preview definition loader: ${tag}`)
    const define = await load()
    define(window)
  }),
)

const theme = new URLSearchParams(window.location.search).get('theme')
document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'

export {}
