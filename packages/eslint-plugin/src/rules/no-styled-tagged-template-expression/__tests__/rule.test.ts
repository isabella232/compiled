import { basename } from 'path';

import type { RuleTester } from 'eslint';

import { tester } from '../../../test-utils';
import { noStyledTaggedTemplateExpressionRule } from '../index';

const createDeclarationTestCase = (
  test: RuleTester.InvalidTestCase,
  name: string,
  prefix: string
) => {
  const replace = (str: string) => str.replace('styled.div', prefix + 'styled.div');

  return {
    ...test,
    filename: `${basename(test.filename!)}-${name}.ts`,
    code: replace(test.code),
    output: replace(test.output!),
  };
};

const createComposedComponentTestCase = (test: RuleTester.InvalidTestCase) => {
  const replace = (str: string) => str.replace('styled.div', 'styled(Base)');

  return {
    ...test,
    filename: `composed-${basename(test.filename!)}.ts`,
    code: replace(test.code),
    output: replace(test.output!),
  };
};

const createAliasedTestCase = (test: RuleTester.InvalidTestCase) => {
  const replace = (str: string) =>
    str
      .replace('{ styled }', '{ styled as styled2 }')
      .replace('styled.div', 'styled2.div')
      .replace('styled(Base)', 'styled2(Base)');

  return {
    ...test,
    filename: `aliased-${basename(test.filename!)}.ts`,
    code: replace(test.code),
    output: replace(test.output!),
  };
};

const createTestCases = (tests: RuleTester.InvalidTestCase[]) =>
  tests
    .flatMap((t) => [
      t,
      createDeclarationTestCase(t, 'export-default-declaration', 'export default '),
      createDeclarationTestCase(t, 'export-named-declaration', 'export const Component = '),
      createDeclarationTestCase(t, 'variable-declaration', 'const Component = '),
    ])
    // For every test, create a composed variant
    .flatMap((t) => [t, createComposedComponentTestCase(t)])
    // For every test, create an aliased variant
    .flatMap((t) => [t, createAliasedTestCase(t)]);

// TODO Handle and test comments
// TODO multi nested
tester.run('no-styled-tagged-template-expression', noStyledTaggedTemplateExpressionRule, {
  valid: [
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
  ],
  invalid: createTestCases([
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
            .foo {
              color: pink;
            }
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
            opacity: 1,
            ".foo": {
              color: "pink"
            }
          },
          display: "block"
        });
      `,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
            .foo {
              color: pink
            }
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
            opacity: 1,
            ".foo": {
              color: "pink"
            }
          },
          display: "block"
        });
      `,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    },
    {
      filename: 'affixed-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        const size = 8;

        styled.div\`
          margin: \${size}px \${size * 3}px;
          padding: calc(\${size} * 2);
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        const size = 8;

        styled.div({
          margin: \`\${size}px \${size * 3}px\`,
          padding: \`calc(\${size} * 2)\`
        });
      `,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
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
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    },
  ]),
});
