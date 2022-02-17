import type { API, FileInfo, Options } from 'jscodeshift';

import { withPlugin } from '../../utils';

import { getCompiledSpecifiers, isCss, isStyled } from './utils';

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);

  const { css, keyframes, styled } = getCompiledSpecifiers(
    collection.find(j.ImportDeclaration, ({ source }) => source.value === '@compiled/react')
  );

  // Do not transform the code if there are irrelevant compiled import declarations
  if (!css.size && !keyframes.size && !styled.size) {
    return source;
  }

  const cssExpressions = collection.find(j.TaggedTemplateExpression, ({ tag }) => isCss(tag, css));
  const keyframesExpressions = collection.find(j.TaggedTemplateExpression, ({ tag }) =>
    isStyled(tag, keyframes)
  );
  const styledExpressions = collection.find(j.TaggedTemplateExpression, ({ tag }) =>
    isStyled(tag, styled)
  );

  // Do not transform the code if there are no compiled usages
  if (!cssExpressions.length && !keyframesExpressions.length && !styledExpressions.length) {
    return source;
  }

  for (const expressions of [cssExpressions, keyframesExpressions, styledExpressions]) {
    expressions.forEach((expression) => {
      expression.replace(j.callExpression(expression.node.tag, [j.nullLiteral()]));
    });
  }

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
