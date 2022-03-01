import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
} from '../../../test-utils';
import { noKeyframesTaggedTemplateExpressionRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'noKeyframesTaggedTemplateExpression' }],
    }))
    .flatMap((t) => [createDeclarationInvalidTestCases(t, 'styles', ['keyframes`', 'keyframes('])])
    .flatMap((t) => [
      t,
      createAliasedInvalidTestCase(t, (str) =>
        str
          .replace('{ keyframes }', '{ keyframes as keyframes2 }')
          .replace('keyframes`', 'keyframes2`')
          .replace('keyframes(', 'keyframes2(')
      ),
    ]);

// TODO Handle and test comments
// TODO multi nested
tester.run('no-keyframes-tagged-template-expression', noKeyframesTaggedTemplateExpressionRule, {
  valid: [
    `
      import { keyframes } from 'keyframes';

      keyframes\`color: blue\`;
    `,
    `
      import { keyframes } from '@compiled/react-clone';

      keyframes\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { css } from '@compiled/react';

        css\`color: blue\`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue"
        });
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          opacity: 0.8;
          :hover { color: purple; opacity: 1; }
          :visited { color: indigo; }
          :focus {
            color: coral;
            opacity: 1;
          }
          display: block;
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          opacity: 0.8,
          ":hover": {
            color: "purple",
            opacity: 1
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "coral",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          opacity: 0.8;
          :hover { color: purple; opacity: 1 }
          :visited { color: indigo }
          :focus {
            color: coral;
            opacity: 1
          }
          display: block
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          opacity: 0.8,
          ":hover": {
            color: "purple",
            opacity: 1
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "coral",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'interpolated-declaration-values.ts',
      code: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css\`
          color: \${color};
          opacity: \${opacity};
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css({
          color: color,
          opacity: opacity
        });
      `,
    },
    {
      filename: 'affixed-rules.ts',
      code: `
        import { css } from '@compiled/react';

        const size = 8;

        css\`
          margin: \${size}px \${size * 3}px;
          padding: calc(\${size} * 2);
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const size = 8;

        css({
          margin: \`\${size}px \${size * 3}px\`,
          padding: \`calc(\${size} * 2)\`
        });
      `,
    },
  ]),
});
