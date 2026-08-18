import {
  addUniqueAttribute,
  defineElementMetadata,
  toAttributeName,
  type AttributeKind,
} from './metadata'
import type { UIElementDecoratorHost } from './ui-element'

export type AttributeOptions = {
  readonly attribute?: string
}

type Accessor<This extends UIElementDecoratorHost, Value> = ClassAccessorDecoratorTarget<
  This,
  Value
>
type AccessorContext<This extends UIElementDecoratorHost, Value> = ClassAccessorDecoratorContext<
  This,
  Value
>
type AccessorResult<This extends UIElementDecoratorHost, Value> = ClassAccessorDecoratorResult<
  This,
  Value
>

export function attr<This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
): AccessorResult<This, Value>
export function attr(
  options?: AttributeOptions,
): <This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
) => AccessorResult<This, Value>
export function attr<This extends UIElementDecoratorHost, Value>(
  first?: AttributeOptions | Accessor<This, Value>,
  context?: AccessorContext<This, Value>,
) {
  return attributeDecorator('string', first, context)
}

export function boolAttr<This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
): AccessorResult<This, Value>
export function boolAttr(
  options?: AttributeOptions,
): <This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
) => AccessorResult<This, Value>
export function boolAttr<This extends UIElementDecoratorHost, Value>(
  first?: AttributeOptions | Accessor<This, Value>,
  context?: AccessorContext<This, Value>,
) {
  return attributeDecorator('boolean', first, context)
}

export function numberAttr<This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
): AccessorResult<This, Value>
export function numberAttr(
  options?: AttributeOptions,
): <This extends UIElementDecoratorHost, Value>(
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
) => AccessorResult<This, Value>
export function numberAttr<This extends UIElementDecoratorHost, Value>(
  first?: AttributeOptions | Accessor<This, Value>,
  context?: AccessorContext<This, Value>,
) {
  return attributeDecorator('number', first, context)
}

function attributeDecorator<This extends UIElementDecoratorHost, Value>(
  kind: AttributeKind,
  first?: AttributeOptions | Accessor<This, Value>,
  context?: AccessorContext<This, Value>,
) {
  if (context) {
    return decorateAttribute(kind, {}, first as Accessor<This, Value>, context)
  }

  const options = (first ?? {}) as AttributeOptions
  return (accessor: Accessor<This, Value>, decoratorContext: AccessorContext<This, Value>) =>
    decorateAttribute(kind, options, accessor, decoratorContext)
}

function decorateAttribute<This extends UIElementDecoratorHost, Value>(
  kind: AttributeKind,
  options: AttributeOptions,
  accessor: Accessor<This, Value>,
  context: AccessorContext<This, Value>,
): AccessorResult<This, Value> {
  if (context.static || context.private) {
    throw new Error('Timeless attribute decorators can only decorate public instance accessors.')
  }

  const property = String(context.name)
  const definition = {
    property,
    attribute: options.attribute ?? toAttributeName(property),
    kind,
  }
  addUniqueAttribute(defineElementMetadata(context.metadata), definition)

  return {
    get() {
      return accessor.get.call(this)
    },
    set(value: Value) {
      const previous = accessor.get.call(this)
      const next = coercePropertyValue(kind, value) as Value
      accessor.set.call(this, next)

      if (previous !== next) {
        this.reflectDecoratedAttribute(definition, next)
        this.notifyDecoratedWatchers(property, next, previous)
      }
    },
    init(value: Value) {
      return coercePropertyValue(kind, value) as Value
    },
  }
}

function coercePropertyValue(kind: AttributeKind, value: unknown): unknown {
  if (kind === 'boolean') return Boolean(value)
  if (kind === 'number') {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
  }
  return value == null ? '' : String(value)
}
