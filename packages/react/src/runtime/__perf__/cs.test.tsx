import { runBenchmark } from '@compiled/benchmark';
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { memo } from 'react';
import { render } from 'react-dom';
import { renderToString } from 'react-dom/server';

import { CC, CS } from '../index';

const MemoCS = memo(CS, () => true);

import { StyleArr, StyleStr } from './utils/cs';

describe('CS benchmark', () => {
  describe.each(['server', 'client'])('on the %s', (env) => {
    const document = globalThis.document;
    const window = globalThis.window;

    beforeAll(() => {
      if (env === 'server') {
        // @ts-expect-error
        delete globalThis.document;
        // @ts-expect-error
        delete globalThis.window;
      } else {
        const dom = new JSDOM('<div id="root"></div>');
        globalThis.document = dom.window.document;
        // @ts-expect-error
        globalThis.window = dom.window;
      }
    });

    afterAll(() => {
      globalThis.document = document;
      globalThis.window = window;
    });

    const fastest = env === 'server' ? ['StyleArr', 'StyleStr'] : ['MemoCS (n array elements)'];

    it(`completes with [${fastest.join(', ')}] as the fastest`, async () => {
      const stylesArr = [
        '._s7n4jp4b{vertical-align:top}',
        '._1reo15vq{overflow-x:hidden}',
        '._18m915vq{overflow-y:hidden}',
        '._1bto1l2s{text-overflow:ellipsis}',
        '._o5721q9c{white-space:nowrap}',
        '._ca0qidpf{padding-top:0}',
        '._u5f31y44{padding-right:4px}',
        '._n3tdidpf{padding-bottom:0}',
        '._19bv1y44{padding-left:4px}',
        '._p12f12xx{max-width:100px}',
        '._1bsb1osq{width:100%}',
      ];

      const stylesStr = stylesArr.join('');

      const className = [
        '_bfhk1jys',
        '_2rko1l7b',
        '_vchhusvi',
        '_syaz4rde',
        '_1e0c1o8l',
        '_1wyb1skh',
        '_k48p1fw0',
        '_vwz4kb7n',
        '_p12f1osq',
        '_ca0qyh40',
        '_u5f3idpf',
        '_n3td1l7b',
        '_19bvidpf',
        '_1p1dangw',
        '_s7n41q9y',
      ].join(' ');

      const style = {
        '--_16owtcm': 'rgb(227, 252, 239)',
        '--_kmurgp': 'rgb(0, 102, 68)',
      } as any;

      const nonce = 'k0Mp1lEd';

      const renderJSX =
        env === 'server'
          ? (jsx: JSX.Element) => {
              renderToString(jsx);
            }
          : (jsx: JSX.Element) => {
              render(jsx, globalThis.document.getElementById('root'));
            };

      const tests = [
        {
          name: 'CS (1 array element)',
          fn: () => {
            renderJSX(
              <CC>
                <CS nonce={nonce}>{[stylesStr]}</CS>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
        {
          name: 'CS (n array elements)',
          fn: () => {
            renderJSX(
              <CC>
                <CS nonce={nonce}>{stylesArr}</CS>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
        {
          name: 'MemoCS (1 array element)',
          fn: () => {
            renderJSX(
              <CC>
                <MemoCS nonce={nonce}>{[stylesStr]}</MemoCS>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
        {
          name: 'MemoCS (n array elements)',
          fn: () => {
            renderJSX(
              <CC>
                <MemoCS nonce={nonce}>{stylesArr}</MemoCS>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
        {
          name: 'StyleArr',
          fn: () => {
            renderJSX(
              <CC>
                <StyleArr nonce={nonce}>{stylesArr}</StyleArr>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
        {
          name: 'StyleStr',
          fn: () => {
            renderJSX(
              <CC>
                <StyleStr nonce={nonce}>{stylesStr}</StyleStr>
                <span className={className} style={style}>
                  hello world
                </span>
              </CC>
            );
          },
        },
      ];

      const benchmark = await runBenchmark('CS', tests);

      expect(benchmark).toMatchObject({
        fastest: expect.not.arrayContaining(
          tests.map((t) => t.name).filter((n) => !fastest.includes(n))
        ),
      });
    }, 60000);
  });
});
