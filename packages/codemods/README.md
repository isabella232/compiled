# @compiled/codemods

Facilitates large scale code migrations through codemods that:

-
- lkdsfkdf
-

## Installation

```bash
npx @compiled/cli --preset codemods
```

**Codemods modify files in place, so make sure you can recover if it goes wrong!**

## Updating

When updating to a later version, make sure `@compiled/cli` is run with the same version.

> Watch out for it being cached!

For example when upgrading `@compiled/react` to `v0.6.0` where you've already used the CLI, on your next run explicitly set the version number:

```bash
npx @compiled/cli@0.6.0 --preset codemods
```

## Codemods

The set of available codemods are:

1. [emotion-to-compiled](./src/transforms/emotion-to-compiled)
2. [styled-components-to-compiled](./src/transforms/styled-components-to-compiled)
3. [styled-components-inner-ref-to-ref](./src/transforms/styled-components-inner-ref-to-ref)
4. [tagged-template-expression-to-call-expression](./src/transforms/tagged-template-expression-to-call-expression)

## Plugins

Codemods support a simple plugin system where supported implementations can be overridden. The `CodemodPlugin` interface
lists all the supported methods to be re-implemented. See the following example:

```ts
import type { API, FileInfo, Options } from 'jscodeshift';
import type { CodemodPlugin } from '@compiled/codemods';

const ExampleCodemodPlugin: CodemodPlugin = {
  name: 'example-codemod-plugin',
  create: (fileInfo: FileInfo, { jscodeshift: j }: API, options: Options) => ({
    visitor: {
      program({ program }) {
        j(program)
          .find(j.ImportDeclaration)
          .at(-1)
          .get()
          .insertAfter(
            j.importDeclaration(
              [j.importSpecifier(j.identifier('getFeatureFlag'))],
              j.literal('./feature-flags')
            )
          );
      },
    },
  }),
};

export default ExampleCodemodPlugin;
```
