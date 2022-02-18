import { tester } from '../../../test-utils';
import { noStyledTaggedTemplateExpressionRule } from '../index';

tester.run('no-styled-tagged-template-expression', noStyledTaggedTemplateExpressionRule, {
  valid: [
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
  ],
  invalid: [
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
          color: \${props => props.color};
          :hover {
            color: \${props => props.hoverColor};
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
          color: \${props => props.color};
          :hover {
            color: \${props => props.hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: (props) => props.color,
          ":hover": {
            color: (props) => props.hoverColor,
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
            color: ({ hoverColor }) => hoverColor,
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
            color: ({ hoverColor }) => hoverColor,
          }
        });
      `,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    },
    {
      filename: 'conditional-rules.ts',
      only: true,
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
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
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
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
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
            ":hover": ({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto',
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
            ":hover": ({ disabled }) => disabled ? "cursor: not-allowed" : 'cursor: auto',
          }
        );
      `,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    },
  ],
});

// TODO add aliased parameterise test
// defineInlineTest(
//   { default: transformer, parser: 'tsx' },
//   { plugins: [] },
//   `
//     import { styled as styled2 } from '@compiled/react';
//
//     styled2.div\`color: blue\`;
//   `,
//   `
//     import { styled as styled2 } from '@compiled/react';
//
//     styled2.div({ color: 'blue' });
//   `,
//   'transforms an aliased styled component with a static rule'
// );

// TODO comments
// TODO const Foo =
// TODO export const Foo =
// TODO export default
// TODO composition styled()
