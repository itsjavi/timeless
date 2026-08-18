import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

import { defineConfig, devices } from '@playwright/test'

const here = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(here, '../..')
const storiesRoot = resolve(repoRoot, 'apps/stories')
const envPath = resolve(repoRoot, '.env')
const webEnvPath = resolve(repoRoot, 'apps/web/.env')
const storiesEnvPath = resolve(repoRoot, 'apps/stories/.env')
const e2eEnvPath = resolve(here, '.env')
const stackEnvPath = process.env.E2E_ENV_FILE

const rootEnvVars = readEnvFile(envPath)
const webEnvVars = readEnvFile(webEnvPath)
const storiesEnvVars = readEnvFile(storiesEnvPath)
const e2eEnvVars = readEnvFile(e2eEnvPath)
const stackEnvVars = stackEnvPath === undefined ? {} : readEnvFile(stackEnvPath)
const shellEnvVars = definedEnv(process.env)
const requestedProjects = requestedPlaywrightProjects(process.argv)
const shouldStartWebServer = requestedProjects.size === 0 || requestedProjects.has('web-chromium')
const shouldStartStoriesServer =
  requestedProjects.size === 0 || [...requestedProjects].some((name) => name.startsWith('stories-'))
const configEnv = {
  ...rootEnvVars,
  ...webEnvVars,
  ...storiesEnvVars,
  ...e2eEnvVars,
  ...stackEnvVars,
  ...shellEnvVars,
}

const configuredWebBaseUrl = configEnv.E2E_WEB_BASE_URL
const webPort = parsePort(configEnv.E2E_WEB_PORT, 'E2E_WEB_PORT', 6340)
const webBaseURL = normalizeBaseUrl(configuredWebBaseUrl ?? `http://127.0.0.1:${webPort}`)
const configuredStoriesBaseUrl = configEnv.E2E_STORIES_BASE_URL
const storiesPort = parsePort(configEnv.E2E_STORIES_PORT, 'E2E_STORIES_PORT', 6341)
const storiesBaseURL = normalizeBaseUrl(
  configuredStoriesBaseUrl ?? `http://127.0.0.1:${storiesPort}`,
)
const webServerEnv: Record<string, string> = {
  ...rootEnvVars,
  ...webEnvVars,
  ...e2eEnvVars,
  ...stackEnvVars,
  ...shellEnvVars,
  NODE_ENV: 'production',
  PORT: String(webPort),
  TZ: configEnv.TZ ?? 'UTC',
}
const storiesServerEnv: Record<string, string> = {
  ...rootEnvVars,
  ...storiesEnvVars,
  ...e2eEnvVars,
  ...stackEnvVars,
  ...shellEnvVars,
  NODE_ENV: 'production',
  PORT: String(storiesPort),
  TZ: configEnv.TZ ?? 'UTC',
}
const webServers = [
  configuredWebBaseUrl === undefined && shouldStartWebServer
    ? {
        command: 'pnpm -F @apps/web run build && pnpm -F @apps/web run preview',
        cwd: repoRoot,
        env: webServerEnv,
        url: webBaseURL,
        reuseExistingServer: false,
        timeout: 60_000,
        stdout: 'ignore' as const,
        stderr: 'pipe' as const,
      }
    : undefined,
  configuredStoriesBaseUrl === undefined && shouldStartStoriesServer
    ? {
        command:
          './node_modules/.bin/storylite build && node scripts/write-route-catalog.mjs && ./node_modules/.bin/storylite preview',
        cwd: storiesRoot,
        env: storiesServerEnv,
        url: storiesBaseURL,
        reuseExistingServer: false,
        timeout: 60_000,
        stdout: 'ignore' as const,
        stderr: 'pipe' as const,
      }
    : undefined,
].filter((server) => server !== undefined)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: configEnv.E2E_SLOW_MO ? Number(configEnv.E2E_SLOW_MO) : undefined,
    },
  },
  projects: [
    {
      name: 'web-chromium',
      testMatch: /tests\/apps\/web\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: webBaseURL },
    },
    {
      name: 'stories-chromium',
      testMatch: /tests\/apps\/stories\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: storiesBaseURL },
    },
    {
      name: 'stories-firefox',
      testMatch: /tests\/apps\/stories\/platform\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], baseURL: storiesBaseURL },
    },
    {
      name: 'stories-webkit',
      testMatch: /tests\/apps\/stories\/platform\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: storiesBaseURL },
    },
  ],
  webServer: webServers.length > 0 ? webServers : undefined,
})

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {}
  }

  return definedEnv(parseEnv(readFileSync(path, 'utf8')))
}

function definedEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function parsePort(value: string | undefined, envName: string, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid ${envName} value: ${value}`)
  }

  return parsed
}

function requestedPlaywrightProjects(args: readonly string[]): ReadonlySet<string> {
  const projects = new Set<string>()

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--project' && args[index + 1]) {
      projects.add(args[index + 1])
      index += 1
      continue
    }
    if (arg?.startsWith('--project=')) {
      projects.add(arg.slice('--project='.length))
    }
  }

  return projects
}
