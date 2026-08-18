# @timelessui/core

Thin Web Components authoring layer for Timeless UI packages.

This package provides lifecycle cleanup, explicit custom element registration, small decorators, and
live query helpers. It does not render templates, ship CSS-in-JS, or register custom elements as an
import side effect.

Decorated attributes and properties assigned before custom element definition are replayed before
`connected()` runs. Components with replaceable author-owned anatomy can use the protected
`observeParts(enhance)` hook. It coalesces Light DOM child mutations, aborts the previous scoped
listener signal before rewiring, and recreates its observer and listeners after reconnection.

```ts
import { property, UIElement } from '@timelessui/core'

class DomainSelector extends UIElement {
  @property accessor records: readonly unknown[] = []

  protected override connected(): void {
    this.observeParts((signal) => {
      const input = this.querySelector('input')
      input?.addEventListener('input', this.handleInput, { signal })
    })
  }

  private handleInput = (): void => {}
}
```
