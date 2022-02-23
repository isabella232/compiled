import type { Rule } from 'eslint';

import { generate, getOffset, isStyled, toArguments } from './utils';

type RuleFixer = Rule.RuleFixer;

export const noStyledTaggedTemplateExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-tagged-template-expression',
    },
    fixable: 'code',
    messages: {
      noStyledTaggedTemplateExpression:
        'Encountered unexpected styled tagged template expression from @compiled/react',
    },
    type: 'problem',
  },
  create(context) {
    return {
      TaggedTemplateExpression(node) {
        const { references } = context.getScope();
        if (!isStyled(node.tag as Rule.Node, references)) {
          return;
        }

        context.report({
          messageId: 'noStyledTaggedTemplateExpression',
          node,
          *fix(fixer: RuleFixer) {
            const { quasi, tag } = node;
            const source = context.getSourceCode();
            yield fixer.insertTextBefore(
              node,
              source.getText(tag) +
                // Indent the arguments after the tagged template expression range
                generate(toArguments(source, quasi), getOffset(node))
            );
            yield fixer.remove(node);
          },
        });
      },
    };
  },
};
