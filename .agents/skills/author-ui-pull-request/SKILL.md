---
name: author-ui-pull-request
description:
  Open a pull request for work that changes how a Timeless component looks or behaves visually —
  branch naming, capturing the before screenshots on the pristine tree, shooting StoryLite routes,
  hosting the images on the assets-pr-screenshots orphan branch, and filling the PR body. Use for
  requests like "open a PR", "raise the pull request", "take before and after screenshots", "add
  screenshots to the PR", or "push this and open it". Read it before implementing, not after — the
  before shot is unrecoverable once the change lands. Not for planning or closing a milestone, which
  is manage-milestone, and not for judging the change itself, which is audit-component-contracts.
---

# Author a UI pull request

A pull request that changes what a component looks like is reviewed from the images, not the diff. A
CSS hunk does not say whether the gap got better.

The whole procedure hinges on one ordering fact: **the "before" screenshot only exists before you
implement.** Afterwards it costs a stash or a second worktree, and the reviewer usually gets a PR
with only an "after" instead. Read step 2 before touching a stylesheet.

## 1. Branch

Branch from a clean `main`. The prefix is the Conventional Commit type the work will land under —
`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `ci/` — then a lowercase hyphenated slug.

```bash
git switch main && git pull --ff-only
git switch -c refactor/collection-surfaces
```

Work that closes a milestone puts the zero-padded milestone number first in the slug, as
`refactor/021-surface-consolidation` did. The PR title is the Conventional Commit line, with the
milestone named in parentheses when there is one: `refactor: surface consolidation (milestone 021)`.

## 2. Capture "before", on the pristine tree

Do this while `git status` is still clean.

### Start the catalog

Start `apps/stories` through the browser preview tool, using the `storylite` entry in
`.claude/launch.json`:

```jsonc
// preview_start { "name": "storylite" }
```

Never start it with `pnpm dev`, `pnpm dev:ui`, or `pnpm -F @apps/stories run dev` in a shell — a
foreground dev server blocks the turn, and the launch entry sets `autoPort: true`, so the port is
usually **not** 1992. Take the port from the tool result.

### Find the route id

`apps/stories/story-routes.json` is written by `pnpm -F @apps/stories run build` and committed, so
it is readable without a build. Every entry is `/stories/<route-id>/` — the route id is the path
with the `/stories/` prefix and the trailing slash removed:

```bash
node -e "console.log(require('./apps/stories/story-routes.json').filter(r => r.includes('popover')).map(r => r.slice(9, -1)).join('\n'))"
# library-overlays-popover--default
# library-overlays-popover--inline-actions
# library-overlays-popover--placements
```

Route ids read `library-<group>-<component>--<story-export>`, from the story's `title` and its
export name.

### Choose the URL

| URL                                     | What renders                                                       |
| --------------------------------------- | ------------------------------------------------------------------ |
| `http://localhost:<port>/#/canvas/<id>` | The story alone. No shell, no toolbar, **no iframe**. Shoot this   |
| `http://localhost:<port>/#/story/<id>`  | The catalog shell; the story sits in an iframe                     |
| `/stories/<id>/`                        | The built static site, what `apps/e2e` navigates. Not the dev form |

Use `#/canvas/`. In `#/story/` the demo is inside an `<iframe>`, so a screenshot carries catalog
chrome and every locator needs `frameLocator('iframe')`. Only shoot `#/story/` when the change _is_
to the controls panel.

### Write the file

The browser tools render a page for you to look at; they cannot write a PNG to disk. Playwright is
already installed in `apps/e2e`, and `.gitignore` matches `.local/` at any depth, so a throwaway
script there is invisible to `git status` and resolves `@playwright/test` from
`apps/e2e/node_modules`:

```bash
mkdir -p apps/e2e/.local && cat > apps/e2e/.local/capture.mjs <<'EOF'
import { chromium } from '@playwright/test'

const [port, routeId, out, scheme = 'light'] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  colorScheme: scheme,
  deviceScaleFactor: 2,
})
await page.goto(`http://localhost:${port}/#/canvas/${routeId}`, { waitUntil: 'networkidle' })
// Drive the state the change is about, here, before the shot.
await page.screenshot({ path: out })
await browser.close()
EOF

node apps/e2e/.local/capture.mjs 61234 library-overlays-popover--default /tmp/shots/popover-before.png
```

Keep the shots outside the repo — `/tmp/shots/` — named `<subject>-before.png` and
`<subject>-after.png`. Then implement, and run the identical command with `-after.png`.

## 3. Frame the shot so the change is legible

One variable. The before and after pair must agree on route, viewport, color scheme, and interaction
state; anything else that moves reads as part of the change.

- **Theme is not a toggle.** `tokens.css` declares `color-scheme: light dark` and the palette is
  `light-dark()`, so the theme is whatever `colorScheme` the page is created with. There is no theme
  attribute to set. Shoot `light` unless the change is dark-only, and shoot both when it touches a
  `light-dark()` pair.
- **`deviceScaleFactor: 2`.** A 1x shot of 13px type looks like a rendering bug on a retina screen.
- **Open the overlay before shooting.** In `#/canvas/` there is no iframe, so the trigger is
  directly reachable. Wait for the surface rather than sleeping:

  ```js
  await page.getByRole('button', { name: 'Open status' }).click()
  await page.locator('[popover]:popover-open').first().waitFor()
  ```

- **Drive every other state too** — `page.keyboard.press('Tab')` for focus rings, `locator.hover()`
  for hover, a filled invalid input for error styling. A state described in prose but absent from
  the image is not evidence.
- **Crop with numbers, never by eye.** To zoom into a region, keep the viewport identical and pass
  the _same_ explicit `clip` rectangle to both phases. A differently framed pair invents a change
  that is not there.

## 4. Verify before opening

The full gate, always:

```bash
pnpm qa
```

While iterating, the narrow proofs are faster:

```bash
pnpm -F @timelessui/components run contracts:validate
pnpm -F @timelessui/components run manifest:validate
pnpm -F @timelessui/components run exports:validate
pnpm -F @timelessui/examples run test
```

`.agents/reference/validators.md` maps each failure message to its remedy. Then run the
`audit-component-contracts` skill over the diff for the authoring rules no script decides.

## 5. Open the PR first, then host the images

The images live under a directory named after the PR number, and that number does not exist until
the PR does. So the order is forced:

1. Push the branch and open the PR from `.github/PULL_REQUEST_TEMPLATE.md`, with the Screenshots
   section left as a one-line placeholder. `gh pr create --body-file` bypasses the template, so
   start from the template file rather than writing a body from scratch.

   ```bash
   git push -u origin refactor/collection-surfaces
   gh pr create --base main --title "refactor: collection surfaces" --body-file /tmp/pr-body.md
   ```

2. Note the number:

   ```bash
   gh pr view --json number -q .number   # 42
   ```

3. Push the images to `pr-42/` on the `assets-pr-screenshots` orphan branch.
4. Edit the body to embed them: `gh pr edit 42 --body-file /tmp/pr-body.md`.

### The orphan branch

`assets-pr-screenshots` holds only images. It never merges into `main`, and no PR targets it — that
is the point of an orphan branch: the binaries stay out of the history everyone clones.

A worktree under the gitignored `.local/` keeps your working tree, your dev server, and your
node_modules links untouched. **First time**, when the branch does not exist yet:

```bash
git worktree add --orphan -b assets-pr-screenshots .local/pr-assets
```

That creates an unborn branch with an empty index. **Afterwards**, in a fresh clone or after
`git worktree remove`:

```bash
git fetch origin assets-pr-screenshots
git worktree add .local/pr-assets assets-pr-screenshots
```

Either way, the commit is the same, and `git status` in the main tree never changes:

```bash
mkdir -p .local/pr-assets/pr-42
cp /tmp/shots/*.png .local/pr-assets/pr-42/
git -C .local/pr-assets pull --ff-only          # skip on the first push
git -C .local/pr-assets add pr-42
git -C .local/pr-assets commit -m "docs(assets): screenshots for pr-42"
git -C .local/pr-assets push -u origin assets-pr-screenshots
```

`git switch assets-pr-screenshots` in the main tree works only on a clean tree, and it is the wrong
tool mid-change: it invalidates the running dev server and every generated artifact, and you cannot
do it while the diff you are screenshotting is uncommitted.

The branch is append-only. Never rewrite or delete an existing `pr-<n>/` — merged PRs still link to
those files, and a dead image is worse than no image.

## 6. Embed as a two-column table

Raw URLs follow
`https://raw.githubusercontent.com/<owner>/<repo>/assets-pr-screenshots/pr-<n>/<file>.png`. Confirm
the owner and repo from `git remote -v` — today that is `itsjavi/timeless`.

```markdown
## Screenshots

| Before                                                                                                                        | After                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ![Menu open, items 8px apart](https://raw.githubusercontent.com/itsjavi/timeless/assets-pr-screenshots/pr-42/menu-before.png) | ![Menu open, items 4px apart](https://raw.githubusercontent.com/itsjavi/timeless/assets-pr-screenshots/pr-42/menu-after.png) |
```

The table is what puts the two images side by side; stacked images make a reviewer scroll between
them and compare from memory. Write alt text that names what to look at, not "before" — it is the
caption a reviewer gets when the image fails to load.

One row per subject. A PR touching three components gets three rows, each labelled, not six loose
images.

## When screenshots are not warranted

A change with no visual delta gets no images — and says so, in the Screenshots section, rather than
dropping the heading:

```markdown
## Screenshots

No visual changes — this PR only moves the value sets into the registry.
```

An omitted section reads as an oversight the reviewer has to chase. A stated one reads as a decision
already made.

Genuinely non-visual: validator scripts, registry descriptions, type-only exports, docs prose,
tests, CI. If the diff touches any file under `packages/components/src/css/`, assume there is a
visual delta until a shot proves otherwise — including the ones you expect to be inert, since an
inert override is exactly the defect a pair of images catches.
