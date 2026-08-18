# E2E tests

Playwright end-to-end tests for the `@apps/*` apps.

## Layout

- `tests/apps/web/**`: main `apps/web` website coverage.
- `tests/apps/stories/**`: canonical `apps/stories` catalog coverage.
- `tests/shared/**`: helpers reusable across future app-specific suites.

Keep route lists, fixtures, and app-specific assertions inside `tests/apps/<app-name>/`.

## Commands

Run from the monorepo root:

| Task                | Command                             |
| ------------------- | ----------------------------------- |
| Install Chromium    | `pnpm -F @apps/e2e run e2e:install` |
| Typecheck E2E tests | `pnpm -F @apps/e2e run typecheck`   |
| Run E2E tests       | `pnpm -F @apps/e2e run e2e`         |
| Run headed (slow)   | `pnpm -F @apps/e2e run e2e:show`    |

If target URLs are not set, Playwright builds and serves both apps. The website uses
`http://127.0.0.1:6340`, configured with `E2E_WEB_BASE_URL` or `E2E_WEB_PORT`. StoryLite uses
`http://127.0.0.1:6341`, configured with `E2E_STORIES_BASE_URL` or `E2E_STORIES_PORT`.

Optional env files loaded by `playwright.config.ts`: repo `.env`, `apps/web/.env`,
`apps/stories/.env`, `apps/e2e/.env`, and `E2E_ENV_FILE` when you need a shared stack env file.

Do not commit `test-results/`, `playwright-report/`, traces, screenshots, or videos.
