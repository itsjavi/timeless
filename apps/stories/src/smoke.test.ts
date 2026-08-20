import { describe, expect, it } from 'vitest'
import { Default as TeamPresence } from './stories/recipes/team-presence.stories'
import { Default, Sizes, Variants } from './stories/button.stories'
import { Default as Alert } from './stories/css-primitives/alert.stories'
import { Default as Avatar } from './stories/css-primitives/avatar.stories'
import { Default as Badge } from './stories/css-primitives/badge.stories'
import { Default as Card } from './stories/css-primitives/card.stories'
import { Default as Group } from './stories/css-primitives/group.stories'
import { Default as List } from './stories/css-primitives/list.stories'
import { Default as Progress } from './stories/css-primitives/progress.stories'
import {
  Labeled as LabeledSeparator,
  Default as Separator,
  StaticFallback as StaticSeparatorFallback,
} from './stories/css-primitives/separator.stories'
import { Default as Skeleton } from './stories/css-primitives/skeleton.stories'
import { Default as Spinner } from './stories/css-primitives/spinner.stories'
import { Default as Table } from './stories/css-primitives/table.stories'
import { Default as Text } from './stories/css-primitives/text.stories'
import { Default as Toggle } from './stories/css-primitives/toggle.stories'
import { Default as Empty } from './stories/css-primitives/empty.stories'
import { Default as Meter } from './stories/css-primitives/meter.stories'
import { Default as ToggleGroup } from './stories/collection-navigation/toggle-group.stories'
import {
  Default as ContextMenu,
  PerRegion as ContextMenuPerRegion,
} from './stories/collection-navigation/context-menu.stories'
import {
  GroupedAndCheckable as GroupedMenu,
  Menubar,
  Default as Menu,
} from './stories/collection-navigation/menu.stories'
import { Default as Sheet } from './stories/progressive-overlays/sheet.stories'
import { Default as ColorPicker } from './stories/color-controls/color-picker.stories'
import { Default as ColorSwatch } from './stories/color-controls/color-swatch.stories'
import { Default as ChoiceGroup, RadioGroup } from './stories/form-primitives/choice-group.stories'
import { Default as Field, Validation } from './stories/form-primitives/field.stories'
import { Default as FileInput, InvalidFile } from './stories/form-primitives/file-input.stories'
import { Default as Range } from './stories/form-primitives/range.stories'
import {
  AgainstChoiceGroup as FieldsetDensity,
  Default as Fieldset,
} from './stories/form-primitives/fieldset.stories'
import { Default as Form } from './stories/form-primitives/form.stories'
import {
  Default as OtpField,
  InSignInForm as OtpFieldInForm,
} from './stories/form-primitives/otp-field.stories'
import {
  AgainstSingleThumb as RangeFieldPair,
  Default as RangeField,
} from './stories/form-primitives/range-field.stories'
import { Default as NumberStepper } from './stories/form-primitives/number-stepper.stories'
import { Default as Select } from './stories/form-primitives/select.stories'
import { Default as Switch } from './stories/form-primitives/switch.stories'
import {
  Default as Collapsible,
  ReleaseChecklist,
} from './stories/progressive-overlays/collapsible.stories'
import { Default as Dialog } from './stories/progressive-overlays/dialog.stories'
import { Default as HoverCard } from './stories/progressive-overlays/hover-card.stories'
import {
  Default as Popover,
  Placements as PopoverPlacements,
} from './stories/progressive-overlays/popover.stories'
import {
  ProductSettings,
  StaticFallback as StaticTabsFallback,
  Default as Tabs,
} from './stories/progressive-overlays/tabs.stories'
import {
  Default as Toast,
  ToastApi,
  Placements as ToastPlacements,
} from './stories/progressive-overlays/toast.stories'
import { Default as Tooltip } from './stories/progressive-overlays/tooltip.stories'

describe('catalog stories', () => {
  it('renders shared recipes', () => {
    const html = TeamPresence.render()

    expect(html).toContain('Team presence')
    expect(html).toContain('class="ui-avatar"')
  })

  it('renders button examples through the new package contract', () => {
    const defaultHtml = Default.render()
    const variantHtml = Variants.render()
    const sizeHtml = Sizes.render()

    expect(defaultHtml).toContain('class="ui-button"')
    expect(variantHtml).toContain('data-ui-variant="secondary"')
    expect(sizeHtml).toContain('data-ui-size="lg"')
  })

  it('renders css primitive stories through public class and data contracts', () => {
    expect(Alert.render()).toContain('class="ui-alert"')
    expect(Avatar.render()).toContain('class="ui-avatar"')
    expect(Badge.render()).toContain('class="ui-badge"')
    expect(Separator.render()).toContain('class="ui-separator"')
    expect(LabeledSeparator.render()).toContain('data-ui-part="label"')
    expect(StaticSeparatorFallback.render()).toContain('class="ui-separator"')
    expect(Card.render()).toContain('data-ui-part="title"')
    expect(Skeleton.render()).toContain('class="ui-skeleton"')
    expect(Progress.render()).toContain('class="ui-progress"')
    expect(Progress.render()).toContain('aria-describedby="progress-package-build-hint"')
    expect(Text.render()).toContain('class="ui-kbd"')
    expect(Text.render()).toContain('aria-label="Component CSS import"')
    expect(Group.render()).toContain('data-ui-attached')
    expect(List.render()).toContain('data-ui-part="title"')
    expect(Table.render()).toContain('<div class="ui-table"')
    expect(Table.render()).toContain('<table>')
    expect(Table.render()).toContain('aria-label="Primitive coverage table"')
    expect(Spinner.render()).toContain('class="ui-spinner"')
  })

  it('renders form primitive stories through native labels, descriptions, and controls', () => {
    const fieldHtml = Field.render()
    const validationHtml = Validation.render()
    const choiceHtml = ChoiceGroup.render()
    const radioHtml = RadioGroup.render()
    const fileHtml = FileInput.render()
    const invalidFileHtml = InvalidFile.render()

    expect(fieldHtml).toContain('for="field-email"')
    expect(fieldHtml).toContain('aria-describedby="field-email-description"')
    expect(validationHtml).toContain('aria-invalid="true"')
    expect(validationHtml).toContain('class="ui-error"')
    expect(Select.render()).toContain('<select class="ui-select"')
    expect(choiceHtml).toContain('<fieldset class="ui-choice-group"')
    expect(choiceHtml).toContain('aria-describedby="permissions-description"')
    expect(choiceHtml).toContain('type="checkbox"')
    expect(radioHtml).toContain('type="radio"')
    expect(Switch.render()).toContain('role="switch"')
    expect(Switch.render()).toContain('aria-describedby="switch-notifications-description"')
    expect(Range.render()).toContain('type="range"')
    expect(fileHtml).toContain('type="file"')
    expect(invalidFileHtml).toContain('aria-invalid="true"')
  })

  it('renders milestone 023 form completeness stories through authored native anatomy', () => {
    const fieldsetHtml = Fieldset.render()
    const otpHtml = OtpField.render()
    const rangeFieldHtml = RangeField.render()
    const formHtml = Form.render()

    expect(fieldsetHtml).toContain('<fieldset class="ui-fieldset"')
    expect(fieldsetHtml).toContain('<legend>Billing address</legend>')
    expect(FieldsetDensity.render()).toContain('data-ui-density="compact"')

    // The cells are authored, not generated, so the copyable source has to carry the whole contract.
    expect(otpHtml).toContain('<ui-otp-field')
    expect(otpHtml).toContain('autocomplete="one-time-code"')
    expect(otpHtml.match(/autocomplete="one-time-code"/g)).toHaveLength(1)
    expect(otpHtml).toContain('inputmode="numeric"')
    expect(otpHtml).toContain('maxlength="1"')
    expect(otpHtml).toContain('aria-label="Digit 1 of 6"')
    expect(OtpFieldInForm.render()).toContain('type="submit"')

    // Both thumbs carry their own name, so the pair submits with scripting off.
    expect(rangeFieldHtml).toContain('<ui-range-field')
    expect(rangeFieldHtml).toContain('name="budget-from"')
    expect(rangeFieldHtml).toContain('name="budget-to"')
    expect(rangeFieldHtml).toContain('data-ui-part="track"')
    expect(RangeFieldPair.render()).toContain('data-ui-part="hint"')

    expect(formHtml).toContain('<ui-form>')
    expect(formHtml).toContain('data-ui-part="form"')
    expect(formHtml).toContain('class="ui-error" data-ui-part="error"')
  })

  it('keeps milestone 023 copyable source free of demo wrappers and private hooks', () => {
    for (const source of [
      Fieldset.source(),
      OtpField.source(),
      RangeField.source(),
      Form.source(),
    ]) {
      expect(source).not.toContain('ui-demo-page')
      expect(source).not.toContain('data-ui-internal-')
    }
  })

  it('renders milestone 009 controls with minimal public anatomy', () => {
    expect(Toggle.render()).toContain('class="ui-button ui-toggle"')
    expect(Toggle.render()).not.toContain('<ui-toggle>')
    expect(ToggleGroup.render()).toContain('<ui-toggle-group')
    expect(Empty.render()).toContain('class="ui-empty"')
    expect(Meter.render()).toContain('<meter')
    expect(ColorSwatch.render()).toContain('class="ui-color-swatch"')
    expect(NumberStepper.render()).toContain('<ui-number-stepper')
    expect(ColorPicker.render()).toContain('<ui-color-picker')
    expect(ColorPicker.render()).toContain('data-ui-part="channel"')
  })

  it('renders milestone 024 menu anatomy through declared parts and roles', () => {
    const groupedHtml = GroupedMenu.render()
    const menubarHtml = Menubar.render()
    const contextHtml = ContextMenu.render()

    // Groups and separators are authored; the role and the `aria-labelledby` between them are not.
    expect(Menu.render()).toContain('role="menuitem"')
    expect(groupedHtml).toContain('data-ui-part="group"')
    expect(groupedHtml).toContain('data-ui-part="group-label"')
    expect(groupedHtml).toContain('data-ui-part="separator"')
    expect(groupedHtml).toContain('role="menuitemcheckbox" type="button" aria-checked="true"')
    expect(groupedHtml).toContain('role="menuitemradio"')
    expect(groupedHtml).not.toContain('aria-labelledby')

    // Two levels of submenu, so the Arrow Right and Arrow Left keys have depth to prove themselves.
    expect(menubarHtml).toContain('role="menubar"')
    expect(menubarHtml).toContain('aria-controls="submenu-export-as"')

    expect(contextHtml).toContain('<ui-context-menu>')
    expect(contextHtml).toContain('data-ui-part="target"')
    expect(contextHtml).toContain('popover="auto"')
    expect(ContextMenuPerRegion.render()).toContain('id="row-context-menu"')
  })

  it('keeps milestone 024 copyable source free of demo wrappers and private hooks', () => {
    for (const source of [
      GroupedMenu.source(),
      ContextMenu.source(),
      ContextMenuPerRegion.source(),
      Sheet.source(),
    ]) {
      expect(source).not.toContain('ui-demo-page')
      expect(source).not.toContain('data-ui-internal-')
    }
  })

  it('renders progressive overlay stories through host and anatomy contracts', () => {
    expect(Tabs.render()).toContain('<ui-tabs')
    expect(Tabs.render()).toContain('role="tablist"')
    expect(Tabs.render()).toContain('aria-selected="true"')
    expect(Tabs.render()).toContain('hidden')
    expect(ProductSettings.render()).toContain('activation="manual"')
    expect(StaticTabsFallback.render()).toContain('role="tablist"')
    expect(Collapsible.render()).toContain('class="ui-collapsible"')
    expect(Collapsible.render()).toContain('<details class="ui-collapsible"')
    expect(ReleaseChecklist.render()).toContain('data-ui-density="compact"')
    expect(Dialog.render()).toContain('<ui-dialog')
    // The parts name the anatomy; the authored `aria-labelledby` is what makes the panel correct
    // before enhancement runs, on the path where the platform opens it from `command="show-modal"`.
    expect(Dialog.render()).toContain('data-ui-part="title"')
    expect(Dialog.render()).toContain('data-ui-part="description"')
    expect(Dialog.render()).toContain('aria-labelledby="release-dialog-title"')
    expect(Sheet.render()).toContain('data-ui-part="title"')
    expect(Sheet.render()).toContain('aria-labelledby="release-sheet-title"')
    expect(Sheet.render()).toContain('data-ui-part="drag-handle"')
    expect(Popover.render()).toContain('<ui-popover')
    expect(Popover.render()).toContain('popover="auto"')
    expect(Popover.render()).toContain('popover="auto"')
    expect(Popover.render()).toContain('aria-expanded="false"')
    expect(Popover.render()).toContain('aria-labelledby="release-popover-title"')
    expect(PopoverPlacements.render()).toContain('placement="top"')
    expect(HoverCard.render()).toContain('<ui-hover-card')
    expect(HoverCard.render()).toContain('popover="manual"')
    expect(HoverCard.render()).toContain('popover="manual"')
    expect(HoverCard.render()).toContain('aria-labelledby="component-hover-card-title"')
    expect(Tooltip.render()).toContain('variant="tooltip"')
    expect(Tooltip.render()).toContain('popover="manual"')
    expect(Tooltip.render()).toContain('anchor="copy-tooltip-anchor"')
    expect(Toast.render()).toContain('<ui-toaster')
    expect(Toast.render()).toContain('aria-label="Notifications"')
    expect(Toast.render()).toContain('stack="overlap"')
    expect(Toast.render()).toContain('data-ui-part="content"')
    expect(ToastApi.render()).toContain('data-demo-toast')
    expect(ToastApi.source()).toContain('stack: ')
    expect(ToastApi.source()).toContain("toast('Preview queued'")
    expect(ToastPlacements.render()).toContain('placement="top-center"')
    expect(ToastPlacements.render()).toContain('stack="list"')
  })
})
