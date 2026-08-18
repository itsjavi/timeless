import type { Page } from '@playwright/test'

export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let pass = 0; pass < 4; pass += 1) {
      const animations = document.getAnimations()
      if (animations.length === 0) return
      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  })
}
