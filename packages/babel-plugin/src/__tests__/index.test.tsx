import type { TransformOptions } from '@babel/core';
import { transformSync } from '@babel/core';

import babelNext from '../index';

const babelOpts: TransformOptions = {
  configFile: false,
  babelrc: false,
  plugins: [babelNext],
};

describe('babel plugin', () => {
  it('should not comment file if no transformation occurred', () => {
    const output = transformSync(
      `
      import { ClassNames } from '@compiled/react/runtime';
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(
      `"import { ClassNames } from '@compiled/react/runtime';"`
    );
  });

  it('should generate fallback file comment when filename is not defined', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/react';

      const MyDiv = styled.div\`
        font-size: 12px;
      \`;
    `,
      babelOpts
    );

    expect(output?.code).toInclude('File generated by @compiled/babel-plugin v0.0.0');
  });

  it('should generate fallback file comment when filename is defined', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/react';

      const MyDiv = styled.div\`
        font-size: 12px;
      \`;
    `,
      {
        ...babelOpts,
        filename: 'packages/babel-plugin/src/__tests__/index.test.tsx',
      }
    );

    expect(output?.code).toInclude('index.test.tsx generated by @compiled/babel-plugin v0.0.0');
  });

  it('should not change code where there is no compiled components', () => {
    const output = transformSync(
      `
      const one = 1;
    `,
      babelOpts
    );

    expect(output?.code).toEqual('const one = 1;');
  });

  it('should transform basic styled component', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/react';

      const MyDiv = styled.div\`
        font-size: 12px;
      \`;
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "/* File generated by @compiled/babel-plugin v0.0.0 */

      import { forwardRef } from 'react';
      import * as React from 'react';
      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      const _ = \\"._1wyb1fwx{font-size:12px}\\";
      const MyDiv = forwardRef(({
        as: C = \\"div\\",
        style,
        ...props
      }, ref) => <CC>
            <CS>{[_]}</CS>
            <C {...props} style={style} ref={ref} className={ax([\\"_1wyb1fwx\\", props.className])} />
          </CC>);

      if (process.env.NODE_ENV !== 'production') {
        MyDiv.displayName = 'MyDiv';
      }"
    `);
  });

  it('should transform basic css prop', () => {
    const output = transformSync(
      `
      import '@compiled/react';

      const MyDiv = () => {
        return <div css="font-size:12px;">hello</div>
      };
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "/* File generated by @compiled/babel-plugin v0.0.0 */

      import * as React from 'react';
      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      const _ = \\"._1wyb1fwx{font-size:12px}\\";

      const MyDiv = () => {
        return <CC>
          <CS>{[_]}</CS>
          {<div className={ax([\\"_1wyb1fwx\\"])}>hello</div>}
        </CC>;
      };"
    `);
  });

  it('should preserve comments at the top of the processed file before inserting runtime imports', () => {
    const output = transformSync(
      `
      // @flow strict-local
      import React from 'react';
      import '@compiled/react';

      const MyDiv = () => {
        return <div css="font-size:12px;">hello</div>
      };
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "/* File generated by @compiled/babel-plugin v0.0.0 */
      // @flow strict-local

      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import React from 'react';
      const _ = \\"._1wyb1fwx{font-size:12px}\\";

      const MyDiv = () => {
        return <CC>
          <CS>{[_]}</CS>
          {<div className={ax([\\"_1wyb1fwx\\"])}>hello</div>}
        </CC>;
      };"
    `);
  });

  it('should not remove manual runtime import if no transformation occurs', () => {
    const output = transformSync(
      `
      import { CC } from '@compiled/react/runtime';

      <CC>
        <div />
      </CC>
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import { CC } from '@compiled/react/runtime';
      <CC>
              <div />
            </CC>;"
    `);
  });

  it('should append to manual runtime import if already present and transformation occurs', () => {
    const output = transformSync(
      `
      import { CC as CompiledRoot, ax } from '@compiled/react/runtime';
      import '@compiled/react';

      const classes = ax(['1', '2']);

      <CompiledRoot>
        <div css={{ display: 'block' }}  />
      </CompiledRoot>
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "/* File generated by @compiled/babel-plugin v0.0.0 */

      import * as React from 'react';
      import { CC as CompiledRoot, ax, ix, CC, CS } from '@compiled/react/runtime';
      const _ = \\"._1e0c1ule{display:block}\\";
      const classes = ax(['1', '2']);
      <CompiledRoot>
              <CC>
          <CS>{[_]}</CS>
          {<div className={ax([\\"_1e0c1ule\\"])} />}
        </CC>
            </CompiledRoot>;"
    `);
  });
});
