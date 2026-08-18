import { defineElementMetadata } from './metadata'
import type { UIElementDecoratorHost } from './ui-element'

export function listen(event: string, options?: AddEventListenerOptions) {
  return function decorateListener<This extends UIElementDecoratorHost>(
    method: (this: This, ...args: any[]) => void,
    context: ClassMethodDecoratorContext<This, typeof method>,
  ): void {
    if (context.static || context.private) {
      throw new Error('Timeless listen decorators can only decorate public instance methods.')
    }

    defineElementMetadata(context.metadata).listeners.push({
      method: String(context.name),
      event,
      options,
    })
  }
}
