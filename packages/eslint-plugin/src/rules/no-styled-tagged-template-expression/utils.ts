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

type CurrentRule =
  | {
      parent: CurrentRule | undefined;
      rule: CSSRule;
    }
  | undefined;

const getDeclaration = (declaration: string) => {
  const [property, value] = declaration.split(':');
  console.log('value', value);

  return {
    property: property.trim(),
    // @ts-expect-error TypeScript does not include strings in isNaN
    value: isNaN(value) ? value.trim() : parseFloat(value),
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

export const toCallExpression = (source: SourceCode, template: ESTree.TemplateLiteral): string => {
  const groups: Group[] = [];
  let currentRule: CurrentRule = undefined;
  let chars = '';

  // @ts-ignore
  for (const [i, quasi] of template.quasis.entries()) {
    for (const char of quasi.value.raw) {
      switch (char) {
        case '{':
          const rule: CSSRule = {
            type: 'rule',
            selector: chars.trim(),
            groups: [],
          };

          groups.push(rule);
          currentRule = { parent: currentRule, rule };
          chars = '';
          break;
        case '}':
          if (currentRule) {
            if (chars.trim().length) {
              // No semicolon was encountered, and we are at the end of the rule
              currentRule.rule.groups.push({
                type: 'declaration',
                ...getDeclaration(chars),
              });
              chars = '';
            }

            currentRule = currentRule.parent;
          }
          break;
        case ';':
          if (chars.trim().length) {
            const expression = source.getText(template.expressions[i - 1]);
            const group: Group =
              expression === chars
                ? { type: 'expression', expression: chars }
                : { type: 'declaration', ...getDeclaration(chars) };

            if (currentRule) {
              currentRule.rule.groups.push(group);
            } else {
              groups.push(group);
            }
            chars = '';
          }
          break;
        default:
          chars += char;
          break;
      }
    }

    if (i < template.expressions.length) {
      const expression = source.getText(template.expressions[i]);
      chars += expression;
    }
  }

  if (chars.trim().length) {
    // Add any leftover characters to the groups
    // TODO expression?
    groups.push({
      type: 'declaration',
      ...getDeclaration(chars),
    });
  }

  return JSON.stringify(toArguments(groups), null, 2);
};
