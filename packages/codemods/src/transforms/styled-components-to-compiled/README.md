# styled-components-to-compiled

A codemod that transforms [styled-components](https://styled-components.com) usages to compiled.

## Examples

```javascript
import styled from 'styled-components';
```

Is transformed to:

```javascript
import { styled } from '@compiled/react';
```

## Gotchas

`styled.div.attrs` spread properties are not supported.

_Example_

```javascript
styled.div.attrs({
    style: ({ left, ...props }) => {
        left: left,
        top: props.top,
    }
})`
    position: absolute;
`;
```
