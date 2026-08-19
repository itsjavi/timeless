import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { createOtpField } from '../form-fields.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('OTP Field')
export default meta

type OtpFieldArgs = {
  length: number
  grouped: boolean
  required: boolean
  disabled: boolean
}

const otpFieldArgs: OtpFieldArgs = {
  length: 6,
  grouped: true,
  required: true,
  disabled: false,
}

const otpFieldArgTypes = {
  length: { control: 'number' },
  grouped: { control: 'boolean' },
  required: { control: 'boolean' },
  disabled: { control: 'boolean' },
} satisfies StoryLiteArgTypes<OtpFieldArgs>

function createVerificationCode(args: OtpFieldArgs): string {
  const length = Math.max(2, Math.min(10, Math.trunc(args.length)))

  return createOtpField({
    id: 'signin-code',
    name: 'code',
    label: 'Verification code',
    length,
    required: args.required,
    disabled: args.disabled,
    groupAfter: args.grouped ? [Math.floor(length / 2)] : [],
    description: 'Paste the whole code — it spreads across the cells.',
  })
}

export const Default = {
  args: otpFieldArgs,
  argTypes: otpFieldArgTypes,
  source: (args = otpFieldArgs) => createVerificationCode(args),
  render: (args = otpFieldArgs) => `<main class="ui-demo-page">
    <header>
      <h1>OTP Field</h1>
      <p>
        Native inputs, one character each. Typing advances, Backspace on an empty cell steps back,
        and pasting the whole code fills the row.
      </p>
    </header>
    ${createVerificationCode(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<OtpFieldArgs>

/**
 * The field inside a real form, because the interesting behavior is at submission: the joined code
 * submits as one entry under the host name, and a half-typed code blocks the submit with its own
 * message rather than reading as blank.
 */
export const InSignInForm = {
  source: () => createSignInForm(),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Verification step</h1>
      <p>Submit with the code half-typed to see the field report itself as incomplete.</p>
    </header>
    ${createSignInForm()}
  </main>`,
} satisfies StoryLiteStoryDefinition

function createSignInForm(): string {
  return `<form class="ui-form-demo-stack" action="#verify" method="post">
  ${createOtpField({
    id: 'verify-code',
    name: 'code',
    label: 'Verification code',
    length: 6,
    required: true,
    groupAfter: [3],
    description: 'We sent it to ops@acme.test.',
  })}
  <div class="ui-form-demo-actions">
    <button class="ui-button" data-ui-variant="primary" type="submit">Verify</button>
    <button class="ui-button" data-ui-variant="secondary" type="reset">Reset</button>
  </div>
</form>`
}
