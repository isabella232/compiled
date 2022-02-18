import type { Rule, Scope, SourceCode } from 'eslint';
import type * as ESTree from 'estree';

type Definition = Scope.Definition;
type Node = Rule.Node;
type Reference = Scope.Reference;

const isStyledImportSpecifier = (def: Definition) =>
  def.node.type === 'ImportSpecifier' &&
  def.node.imported.type === 'Identifier' &&
  def.node.imported.name === 'styled' &&
  def.parent?.type === 'ImportDeclaration' &&
  def.parent?.source.value === '@compiled/react';

export const isStyled = (node: Node, references: Reference[]): boolean =>
  (node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    references.some(
      (reference) =>
        reference.identifier === node.object &&
        reference.resolved?.defs.some(isStyledImportSpecifier)
    )) ||
  (node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    references.some(
      (reference) =>
        reference.identifier === node.callee &&
        reference.resolved?.defs.some(isStyledImportSpecifier)
    ));

type Declaration = {
  type: 'declaration';
  property: string;
  value: string | number;
};

type Expression = {
  type: 'expression';
  expression: string;
};

type CSSRule = {
  type: 'rule';
  selector: string;
  groups: Group[];
};

type Group = Declaration | Expression | CSSRule;

const getDeclaration = (declaration: string, expressions: ExpressionState[] = []): Declaration => {
  const [property, value] = declaration.split(':');
  const getValue = () => {
    if (!value.trim().length && expressions.length) {
      return expressions.map((e) => e.expression).join('');
    }

    if (expressions.length) {
      // When there are expressions in the value, insert the expressions and wrap the value in a template literal
      let val = declaration;
      let offset = 0;
      for (const { expression, pos } of expressions) {
        const interpolation = '${' + expression + '}';
        val =
          val.substring(0, pos + offset) + interpolation + val.substring(pos + offset, val.length);
        offset += interpolation.length;
      }

      return '`' + val.replace(property + ':', '').trim() + '`';
    }

    // @ts-expect-error TypeScript does not include strings in isNaN
    if (!isNaN(value)) {
      return parseFloat(value);
    }

    return value.trim();
  };

  return {
    type: 'declaration',
    property: property.trim(),
    value: getValue(),
  };
};

// @ts-ignore
type Argument = string | Record<string, Argument | string | number>;

const toArguments = (groups: Group[]) => {
  const args: Argument | Argument[] = [];
  for (const group of groups) {
    const lastArg = args[args.length - 1];
    switch (group.type) {
      case 'declaration':
        if (lastArg && typeof lastArg === 'object') {
          lastArg[group.property] = group.value;
        } else {
          args.push({ [group.property]: group.value });
        }
        break;
      case 'expression':
        args.push(group.expression);
        break;

      case 'rule':
        if (lastArg && typeof lastArg === 'object') {
          lastArg[group.selector] = toArguments(group.groups);
        } else {
          args.push({ [group.selector]: toArguments(group.groups) });
        }
        break;

      default:
        break;
    }
  }

  // Flatten the arguments if there is only one
  return args.length === 1 ? args[0] : args;
};

type CurrentRule =
  | {
      parent: CurrentRule | undefined;
      rule: CSSRule;
    }
  | undefined;

type ExpressionState = {
  expression: string;
  pos: number;
};

type State = {
  chars: string;
  currentRule: CurrentRule;
  expressions: ExpressionState[];
};

export const toCallExpression = (source: SourceCode, template: ESTree.TemplateLiteral): string => {
  const groups: Group[] = [];
  const state: State = {
    chars: '',
    currentRule: undefined,
    expressions: [],
  };

  // @ts-ignore
  for (const [i, quasi] of template.quasis.entries()) {
    for (const char of quasi.value.raw) {
      switch (char) {
        case '{':
          const rule: CSSRule = {
            type: 'rule',
            selector: state.chars.trim(),
            groups: [],
          };

          groups.push(rule);
          state.chars = '';
          state.currentRule = { parent: state.currentRule, rule };
          state.expressions = [];
          break;
        case '}':
          if (state.currentRule) {
            if (state.chars.trim().length) {
              // No semicolon was encountered, and we are at the end of the rule
              state.currentRule.rule.groups.push(getDeclaration(state.chars, state.expressions));
              state.chars = '';
            }

            state.currentRule = state.currentRule.parent;
            state.expressions = [];
          }
          break;
        case ';':
          const group: Group =
            // TODO combine logic?
            !state.chars.trim().length && state.expressions
              ? {
                  type: 'expression',
                  expression: state.expressions.map((e) => e.expression).join(''),
                }
              : getDeclaration(state.chars, state.expressions);

          if (state.currentRule) {
            state.currentRule.rule.groups.push(group);
          } else {
            groups.push(group);
          }
          state.chars = '';
          state.expressions = [];
          break;
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
    // Add any leftover characters to the groups
    groups.push(getDeclaration(state.chars, state.expressions));
  }

  return JSON.stringify(toArguments(groups), null, 2);
};
