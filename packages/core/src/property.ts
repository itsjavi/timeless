import { addUniqueProperty, defineElementMetadata } from './metadata'
import type { UIElementDecoratorHost } from './ui-element'

export function property<This extends UIElementDecoratorHost, Value>(
  accessor: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  if (context.static || context.private) {
    throw new Error('Timeless property decorators can only decorate public instance accessors.')
  }

  const name = String(context.name)
  addUniqueProperty(defineElementMetadata(context.metadata), name)

  return {
    get() {
      return accessor.get.call(this)
    },
    set(value: Value) {
      const previous = accessor.get.call(this)
      accessor.set.call(this, value)
      if (!Object.is(previous, value)) this.notifyDecoratedWatchers(name, value, previous)
    },
    init(value: Value) {
      return value
    },
  }
}
