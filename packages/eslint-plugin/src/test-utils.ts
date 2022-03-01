import { basename } from 'path';

import { RuleTester } from 'eslint';

(RuleTester as any).describe = (text: string, method: (...args: any[]) => void) => {
  const origHasAssertions = expect.hasAssertions;
  describe(text, () => {
    beforeAll(() => {
      // Stub out expect.hasAssertions beforeEach from jest-presetup.js
      expect.hasAssertions = () => {};
    });
    afterAll(() => {
      expect.hasAssertions = origHasAssertions;
    });

    method();
  });
};

export const tester = new RuleTester({
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

export const createAliasedInvalidTestCase = (
  test: RuleTester.InvalidTestCase,
  replace: (str: string) => string
): RuleTester.InvalidTestCase => ({
  ...test,
  filename: `aliased-${basename(test.filename!)}.ts`,
  code: replace(test.code),
  output: replace(test.output!),
});

export const createDeclarationInvalidTestCases = (
  test: RuleTester.InvalidTestCase,
  name: string,
  replacements: string[]
): RuleTester.InvalidTestCase[] => {
  const filename = basename(test.filename!);
  const replace = (prefix: string) => (str: string) => {
    let s = str;
    for (const replacement of replacements) {
      s = s.replace(replacement, prefix + replacement);
    }
    return s;
  };

  const replaceExportDefaultDeclaration = replace(`export default `);
  const replaceExportNamedDeclaration = replace(`export const ${name} = `);
  const replaceNamedDeclaration = replace(`const ${name} = `);

  return [
    {
      ...test,
      filename: `${filename}-export-default-declaration.ts`,
      code: replaceExportDefaultDeclaration(test.code),
      output: replaceExportDefaultDeclaration(test.output!),
    },
    {
      ...test,
      filename: `${filename}-export-named-declaration.ts`,
      code: replaceExportNamedDeclaration(test.code),
      output: replaceExportNamedDeclaration(test.output!),
    },
    {
      ...test,
      filename: `${filename}-named-declaration.ts`,
      code: replaceNamedDeclaration(test.code),
      output: replaceNamedDeclaration(test.output!),
    },
  ];
};
