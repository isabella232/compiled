import { basename } from 'path';

import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
} from '../../../test-utils';
import { noStyledTaggedTemplateExpressionRule } from '../index';

const createComposedComponentTestCase = (test: RuleTester.InvalidTestCase) => {
  const replace = (str: string) => str.replace('styled.div', 'styled(Base)');

  return {
    ...test,
    filename: `composed-${basename(test.filename!)}.ts`,
    code: replace(test.code),
    output: replace(test.output!),
  };
};

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    }))
    .flatMap((t) => [t, ...createDeclarationInvalidTestCases(t, 'Component', ['styled.div'])])
    .flatMap((t) => [t, createComposedComponentTestCase(t)])
    .flatMap((t) => [
      t,
      createAliasedInvalidTestCase(t, (str: string) =>
        str
          .replace('{ styled }', '{ styled as styled2 }')
          .replace('styled.div', 'styled2.div')
          .replace('styled(Base)', 'styled2(Base)')
      ),
    ]);

// TODO Handle and test comments
// TODO multi nested
tester.run('no-styled-tagged-template-expression', noStyledTaggedTemplateExpressionRule, {
  valid: [
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
    `
      import { styled } from '@compiled/react-clone';

      styled.div\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`color: blue\`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: "blue"
        });
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div({
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div({
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
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div\`
          color: \${color};
          opacity: \${opacity};
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div({
          color: color,
          opacity: opacity
        });
      `,
    },
    {
      filename: 'affixed-declaration-values.ts',
      code: `
        import { styled } from '@compiled/react';

        const spacing = 8;

        styled.div\`
          margin: \${spacing}px \${spacing * 3}px;
          padding: calc(\${spacing} * 2);
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        const spacing = 8;

        styled.div({
          margin: \`\${spacing}px \${spacing * 3}px\`,
          padding: \`calc(\${spacing} * 2)\`
        });
      `,
    },
    {
      filename: 'dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          :hover {
            color: \${(props) => props.hoverColor};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: (props) => props.color,
          ":hover": {
            color: (props) => props.hoverColor
          }
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          :hover {
            color: \${(props) => props.hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: (props) => props.color,
          ":hover": {
            color: (props) => props.hoverColor
          }
        });
      `,
    },
    {
      filename: 'destructured-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${({ color }) => color};
          :hover {
            color: \${({ hoverColor }) => hoverColor};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: ({ color }) => color,
          ":hover": {
            color: ({ hoverColor }) => hoverColor
          }
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-destructured-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${({ color }) => color};
          :hover {
            color: \${({ hoverColor }) => hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: ({ color }) => color,
          ":hover": {
            color: ({ hoverColor }) => hoverColor
          }
        });
      `,
    },
    {
      filename: 'conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'destructured-conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${({ disabled }) => disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            \${({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto'};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          ({ disabled }) => disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": ({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-destructured-conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${({ disabled }) => disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            \${({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto'}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          ({ disabled }) => disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": ({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'conditional-rules-before-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          color: \${(props) => props.color};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
            color: \${(props) => props.hoverColor};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            color: (props) => props.color,
            ":hover": [
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
              {
                color: (props) => props.hoverColor
              }
            ]
          }
        );
      `,
    },
    // TODO handle expressions without semicolon
    {
      filename: 'no-trailing-semicolon-conditional-rules-before-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          color: \${(props) => props.color};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
            color: \${(props) => props.hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            color: (props) => props.color,
            ":hover": [
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
              {
                color: (props) => props.hoverColor
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'conditional-rules-after-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            color: \${(props) => props.hoverColor};
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          {
            color: (props) => props.color
          },
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": [
              {
                color: (props) => props.hoverColor
              },
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
            ]
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-conditional-rules-after-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          :hover {
            color: \${(props) => props.hoverColor};
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          {
            color: (props) => props.color
          },
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          {
            ":hover": [
              {
                color: (props) => props.hoverColor
              },
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
            ]
          }
        );
      `,
    },
  ]),
});
