import { defineElementMetadata } from './metadata'
import type { UIElementDecoratorHost } from './ui-element'

export type WatchOptions = {
  readonly immediate?: boolean
}

export function watch(properties: string | readonly string[], options: WatchOptions = {}) {
  return function decorateWatcher<This extends UIElementDecoratorHost>(
    method: (this: This, value?: unknown, oldValue?: unknown) => void,
    context: ClassMethodDecoratorContext<This, typeof method>,
  ): void {
    if (context.static || context.private) {
      throw new Error('Timeless watch decorators can only decorate public instance methods.')
    }

    defineElementMetadata(context.metadata).watchers.push({
      properties: Array.isArray(properties) ? properties : [properties],
      method: String(context.name),
      immediate: options.immediate ?? false,
    })
  }
}
