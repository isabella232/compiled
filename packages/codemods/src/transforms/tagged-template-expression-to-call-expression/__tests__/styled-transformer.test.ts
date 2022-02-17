import transformer from '../index';

jest.disableAutomock();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('tagged-template-expression-to-call-expression transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
    'does not transform a styled component when it does not originate from @compiled/react'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from '@compiled/react';

      styled.div\`
        color: blue;
        :hover { color: purple }
      \`;
    `,
    `
      import { styled } from '@compiled/react';

      styled.div({
        color: 'blue',
        ':hover': { color: 'purple' },
      });
    `,
    'transforms a styled component with static rules'
  );

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

  // TODO composition styled()

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from '@compiled/react';

      styled.div\`
        color: \${props => props.color};
        :hover {
          color: \${props => props.hoverColor};
        }
      \`;
    `,
    `
      import { styled } from '@compiled/react';

      styled.div({
        color: (props) => props.color,
        ':hover': {
          color: (props) => props.hoverColor,
        }
      });
    `,
    'transforms a styled component with a dynamic value'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from '@compiled/react';

      styled.div\`
        color: \${({ color }) => color};
        :hover {
          \${({ hoverColor }) => hoverColor};
        }
      \`;
    `,
    `
      import { styled } from '@compiled/react';

      styled.div({ color: 'blue' });
    `,
    'transforms a styled component with a destructured dynamic value'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from '@compiled/react';

      styled.div\`
        \${props => props.display ? 'display: flex' : 'display: none'};
      \`;
    `,
    `
      import { styled } from '@compiled/react';

      styled.div(
        (props) => props.display ? 'display: flex' : 'display: none',
      );
    `,
    'transforms a styled component with a conditional rule'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
      import { styled } from '@compiled/react';

      styled.div\`
        \${({ display }) => display ? 'display: flex' : 'display: none'};
      \`;
    `,
    `
      import { styled } from '@compiled/react';

      styled.div(
        ({ display }) => display ? 'display: flex' : 'display: none',
      );
    `,
    'transforms a styled component with a destructured conditional rule'
  );
});
