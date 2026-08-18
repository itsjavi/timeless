import { defineElementMetadata } from './metadata'
import type { UIElementDecoratorHost } from './ui-element'

export function query(selector: string) {
  return queryDecorator(selector, false)
}

export function queryAll(selector: string) {
  return queryDecorator(selector, true)
}

function queryDecorator(selector: string, multiple: boolean) {
  return function decorateQuery<This extends UIElementDecoratorHost, Value>(
    _accessor: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ): ClassAccessorDecoratorResult<This, Value> {
    if (context.static || context.private) {
      throw new Error('Timeless query decorators can only decorate public instance accessors.')
    }

    defineElementMetadata(context.metadata).queries.push({
      property: String(context.name),
      selector,
      multiple,
    })

    return {
      get() {
        return (
          multiple ? this.querySelectorAllArray(selector) : this.querySelector(selector)
        ) as Value
      },
      set() {
        // Query decorators are live read-only views over Light DOM.
      },
    }
  }
}
