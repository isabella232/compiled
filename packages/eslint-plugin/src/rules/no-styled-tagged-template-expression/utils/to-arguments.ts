import type { SourceCode } from 'eslint';
import type * as ESTree from 'estree';

import type { Argument, Block, Declaration, DeclarationValue, Expression } from './types';

const getDeclaration = (declaration: string, expressions: ExpressionState[] = []): Declaration => {
  const [property, value] = declaration.split(':');
  const getValue = (): DeclarationValue => {
    if (!value.trim().length && expressions.length) {
      return {
        type: 'expression',
        expression: expressions.map((e) => e.expression).join(''),
      };
    }

    if (expressions.length) {
      // When there are expressions in the value, insert the expressions and wrap the value in a template literal
      let val = declaration;
      let offset = 1;
      for (const { expression, pos } of expressions) {
        const interpolation = '${' + expression + '}';
        val = val.substring(0, pos + offset) + interpolation + val.substring(pos + offset);
        offset += interpolation.length;
      }

      return {
        type: 'literal',
        value: '`' + val.replace(property + ':', '').trim() + '`',
      };
    }

    return {
      type: 'literal',
      value: isNaN(Number(value)) ? value.trim() : parseFloat(value),
    };
  };

  return {
    type: 'declaration',
    property: property.trim(),
    value: getValue(),
  };
};

type Current = {
  parent: Current | undefined;
  args: Argument[];
};

type ExpressionState = {
  expression: string;
  pos: number;
};

type State = {
  chars: string;
  current: Current;
  expressions: ExpressionState[];
};

export const toArguments = (source: SourceCode, template: ESTree.TemplateLiteral): Argument[] => {
  const args: Argument[] = [];
  const state: State = {
    chars: '',
    current: {
      parent: undefined,
      args,
    },
    expressions: [],
  };

  const addArgument = (argument: Expression | Block) => {
    const { args } = state.current;
    if (argument.type === 'expression') {
      if (argument.expression.length) {
        args.push(argument);
      }
      return;
    }

    const lastArg = args[state.current.args.length - 1];
    if (lastArg?.type === 'block') {
      lastArg.blocks.push(argument);
    } else {
      args.push({
        type: 'block',
        blocks: [argument],
      });
    }
  };

  // @ts-ignore
  for (const [i, quasi] of template.quasis.entries()) {
    for (const char of quasi.value.raw) {
      switch (char) {
        case '{': {
          const declarations: Argument[] = [];

          addArgument({
            type: 'rule',
            selector: state.chars.trim(),
            declarations,
          });

          state.chars = '';
          state.current = { parent: state.current, args: declarations };
          // TODO test group with expression before no semicolon
          state.expressions = [];
          break;
        }

        case '}': {
          // No semicolon was encountered, and we are at the end of the rule
          if (!state.chars.trim().length && state.expressions) {
            addArgument({
              type: 'expression',
              expression: state.expressions.map((e) => e.expression).join(''),
            });
          } else {
            addArgument(getDeclaration(state.chars, state.expressions));
          }
          state.chars = '';
          state.current = state.current.parent!;
          state.expressions = [];

          break;
        }

        case ';': {
          if (!state.chars.trim().length && state.expressions) {
            addArgument({
              type: 'expression',
              expression: state.expressions.map((e) => e.expression).join(''),
            });
          } else {
            addArgument(getDeclaration(state.chars, state.expressions));
          }

          state.chars = '';
          state.expressions = [];
          break;
        }

        default:
          state.chars += char;
          break;
      }
    }

    if (i < template.expressions.length) {
      state.expressions.push({
        pos: state.chars.length - 1,
        expression: source.getText(template.expressions[i]),
      });
    }
  }

  if (state.chars.trim().length) {
    // TODO test expression?
    // Add any leftover characters to the groups
    addArgument(getDeclaration(state.chars));
  }

  return args;
};
