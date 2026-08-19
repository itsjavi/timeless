import { expect, test } from '../../shared/fixtures'
import { expectRouteDocumentReady } from '../../shared/test-utils'

const OTP_ROUTE = '/stories/library-forms-otp-field--in-sign-in-form/'
const RANGE_ROUTE = '/stories/library-forms-range-field--default/'
const FORM_ROUTE = '/stories/library-forms-form--default/'
const FIELDSET_ROUTE = '/stories/library-forms-fieldset--default/'
const SELECT_ROUTE = '/stories/library-forms-native-select--default/'

/**
 * Milestone 023 took exit B on the native select: the platform arrow sits at a fixed engine-chosen
 * offset that no author padding moves, and WebKit drops `padding` and `min-block-size` on a UA-drawn
 * select entirely. This asserts the shape that decision produced — an asymmetric inline padding
 * reserving room for an indicator Timeless draws — rather than a pixel value that would differ per
 * engine if the platform still owned it.
 */
test('the native select reserves its own indicator gutter and matches the input box', async ({
  page,
}) => {
  await page.goto(SELECT_ROUTE)
  await expectRouteDocumentReady(page)

  const metrics = await page.locator('select.ui-select').evaluate((select) => {
    const styles = getComputedStyle(select)
    return {
      appearance: styles.appearance,
      backgroundImage: styles.backgroundImage,
      paddingStart: Number.parseFloat(styles.paddingInlineStart),
      paddingEnd: Number.parseFloat(styles.paddingInlineEnd),
      height: Math.round(select.getBoundingClientRect().height),
    }
  })

  expect(metrics.appearance).toBe('none')
  expect(metrics.backgroundImage).toContain('gradient')
  // The end side carries the gutter plus the indicator, so the two sides cannot be equal.
  expect(metrics.paddingEnd).toBeGreaterThan(metrics.paddingStart)
  expect(metrics.paddingStart).toBe(12)
  expect(metrics.height).toBe(40)
})

test('a disabled fieldset submits nothing and disables every control inside it', async ({
  page,
}) => {
  await page.goto(FIELDSET_ROUTE)
  await expectRouteDocumentReady(page)

  const street = page.getByLabel('Street')
  await expect(street).toBeEnabled()

  const submitted = await page.locator('fieldset.ui-fieldset').evaluate((fieldset) => {
    const form = fieldset.ownerDocument.createElement('form')
    fieldset.parentElement?.insertBefore(form, fieldset)
    form.append(fieldset)
    const enabled = [...new FormData(form).keys()]
    ;(fieldset as HTMLFieldSetElement).disabled = true
    return { enabled, disabled: [...new FormData(form).keys()] }
  })

  expect(submitted.enabled).toContain('street')
  expect(submitted.disabled).toEqual([])
  await expect(street).toBeDisabled()
})

test('ui-form puts a server error on a field, focuses it, and clears it on the next input', async ({
  page,
}) => {
  await page.goto(FORM_ROUTE)
  await expectRouteDocumentReady(page)

  const slug = page.getByLabel('Workspace address')
  const owner = page.getByLabel('Owner email')
  const slugError = page.locator('#workspace-slug').locator('xpath=../*[@data-ui-part="error"]')

  await page.getByRole('button', { name: 'Save' }).click()

  await expect(slugError).toHaveText('That workspace address is already taken.')
  await expect(slug).toHaveAttribute('aria-invalid', 'true')
  await expect(slug).toHaveAttribute('aria-describedby', /error/)
  await expect(slug).toBeFocused()
  // A mapped message is a real constraint failure, not just text: the form stops validating.
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(
    false,
  )

  // The message survives exactly as long as the value that caused it.
  await slug.fill('acme-two')
  await expect(slugError).toHaveText('')
  await expect(slug).not.toHaveAttribute('aria-invalid', 'true')
  // Only the edited field clears; the other error is still the server's answer.
  expect(await owner.evaluate((input: HTMLInputElement) => input.validationMessage)).toBe(
    'No account exists for this address.',
  )

  await page.getByRole('button', { name: 'Clear errors' }).click()
  expect(await owner.evaluate((input: HTMLInputElement) => input.validationMessage)).toBe('')
})

test.describe('one-time code field', () => {
  test('fills forward, retreats on Backspace, and traverses with arrows and Home or End', async ({
    page,
  }) => {
    await page.goto(OTP_ROUTE)
    await expectRouteDocumentReady(page)

    const cells = page.locator("ui-otp-field [data-ui-part~='cell']")
    await expect(cells).toHaveCount(6)

    await cells.nth(0).click()
    await page.keyboard.type('482')
    await expect(cells.nth(3)).toBeFocused()
    await expect(cells.nth(0)).toHaveValue('4')
    await expect(cells.nth(2)).toHaveValue('2')

    // Backspace clears the focused cell first, then steps back and clears the previous one.
    await page.keyboard.press('Backspace')
    await expect(cells.nth(2)).toBeFocused()
    await expect(cells.nth(2)).toHaveValue('')

    await page.keyboard.press('ArrowLeft')
    await expect(cells.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(cells.nth(2)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(cells.nth(0)).toBeFocused()
    await page.keyboard.press('End')
    await expect(cells.nth(5)).toBeFocused()
  })

  test('a pasted code spreads across the cells and submits as one entry', async ({ page }) => {
    await page.goto(OTP_ROUTE)
    await expectRouteDocumentReady(page)

    const cells = page.locator("ui-otp-field [data-ui-part~='cell']")
    await cells.nth(0).click()
    // Written through the real clipboard event, decorations and all.
    await cells.nth(0).evaluate((cell) => {
      const data = new DataTransfer()
      data.setData('text', '482-913')
      cell.dispatchEvent(
        new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }),
      )
    })

    await expect(cells.nth(0)).toHaveValue('4')
    await expect(cells.nth(5)).toHaveValue('3')
    await expect(page.locator('ui-otp-field')).toHaveJSProperty('value', '482913')

    const submitted = await page
      .locator('form')
      .evaluate((form: HTMLFormElement) => [...new FormData(form).entries()])
    expect(submitted).toContainEqual(['code', '482913'])
  })

  test('a required field blocks submission while empty, and a half-typed code says so', async ({
    page,
  }) => {
    await page.goto(OTP_ROUTE)
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-otp-field')
    const readValidity = () =>
      host.evaluate((element) => {
        const field = element as HTMLElement & {
          checkValidity(): boolean
          validationMessage: string
          value: string
        }
        return { valid: field.checkValidity(), message: field.validationMessage }
      })

    expect(await readValidity()).toEqual({ valid: false, message: 'Please enter the code.' })

    await page.locator("ui-otp-field [data-ui-part~='cell']").nth(0).click()
    await page.keyboard.type('482')
    expect(await readValidity()).toEqual({
      valid: false,
      message: 'Please enter all 6 characters of the code.',
    })

    await page.keyboard.type('913')
    expect(await readValidity()).toEqual({ valid: true, message: '' })

    // Reset restores the authored default rather than whatever was typed.
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(host).toHaveJSProperty('value', '')
  })
})

test.describe('two-thumb range field', () => {
  test('each thumb is separately focusable and arrow-operable', async ({ page }) => {
    await page.goto(RANGE_ROUTE)
    await expectRouteDocumentReady(page)

    const from = page.locator("ui-range-field [data-ui-part~='from']")
    const to = page.locator("ui-range-field [data-ui-part~='to']")

    await from.focus()
    await expect(from).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(from).toHaveValue('130')

    // Tab reaches the second thumb: two native inputs, two tab stops, no roving tabindex.
    await page.keyboard.press('Tab')
    await expect(to).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(to).toHaveValue('370')
  })

  test('a thumb stops at its neighbour instead of swapping, and the fill follows', async ({
    page,
  }) => {
    await page.goto(RANGE_ROUTE)
    await expectRouteDocumentReady(page)

    const from = page.locator("ui-range-field [data-ui-part~='from']")
    const to = page.locator("ui-range-field [data-ui-part~='to']")
    const track = page.locator("ui-range-field [data-ui-part~='track']")

    await from.evaluate((input: HTMLInputElement) => {
      input.value = '450'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await expect(from).toHaveValue('380')
    await expect(to).toHaveValue('380')
    await expect(page.locator("ui-range-field [data-ui-part~='output']")).toHaveText('380 – 380')

    const fill = await track.evaluate((element) => ({
      start: element.style.getPropertyValue('--ui-range-fill-start'),
      end: element.style.getPropertyValue('--ui-range-fill-end'),
    }))
    expect(fill).toEqual({ start: '76%', end: '76%' })
  })

  test('the pair submits as two native entries under its own names', async ({ page }) => {
    await page.goto(RANGE_ROUTE)
    await expectRouteDocumentReady(page)

    const submitted = await page.locator('ui-range-field').evaluate((host) => {
      const form = host.ownerDocument.createElement('form')
      host.parentElement?.insertBefore(form, host)
      form.append(host)
      return [...new FormData(form).entries()]
    })

    expect(submitted).toEqual([
      ['budget-from', '120'],
      ['budget-to', '380'],
    ])
  })
})
