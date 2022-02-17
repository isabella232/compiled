# styled-components-inner-ref-to-ref

A codemod that transforms an `innerRef` prop to `ref`.

## Examples

```javascript
<div innerRef={this.setRef} />
```

Is transformed to:

```javascript
<div ref={this.setRef} />
```
