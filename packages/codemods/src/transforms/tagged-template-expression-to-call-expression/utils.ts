import type {
  Collection,
  Identifier,
  ImportDeclaration,
  Node,
  MemberExpression,
  CallExpression,
} from 'jscodeshift';

const isCallExpression = (node: Node): node is CallExpression => node.type === 'CallExpression';
const isIdentifier = (node: Node): node is Identifier => node.type === 'Identifier';
const isMemberExpression = (node: Node): node is MemberExpression =>
  node.type === 'MemberExpression';

type Specifiers = Set<string>;

export const isCss = (node: Node, specifiers: Specifiers): boolean =>
  isIdentifier(node) && specifiers.has(node.name);

export const isStyled = (node: Node, specifiers: Specifiers): boolean =>
  (isMemberExpression(node) && isIdentifier(node.object) && specifiers.has(node.object.name)) ||
  (isCallExpression(node) && isIdentifier(node.callee) && specifiers.has(node.callee.name));

export const isKeyframes = (node: Node, specifiers: Specifiers): boolean =>
  isIdentifier(node) && specifiers.has(node.name);

export type CompiledSpecifiers = {
  css: Specifiers;
  keyframes: Specifiers;
  styled: Specifiers;
};

export const getCompiledSpecifiers = (
  importDeclarations: Collection<ImportDeclaration>
): CompiledSpecifiers => {
  const compiledSpecifiers = {
    css: new Set<string>(),
    keyframes: new Set<string>(),
    styled: new Set<string>(),
  };

  if (!importDeclarations.length) {
    return compiledSpecifiers;
  }

  const specifiers = new Set(Object.keys(compiledSpecifiers));

  for (const declaration of importDeclarations.nodes()) {
    for (const specifier of declaration.specifiers ?? []) {
      if (specifier.type !== 'ImportSpecifier' || !specifiers.has(specifier.imported.name)) {
        continue;
      }

      // @ts-ignore
      compiledSpecifiers[specifier.imported.name].add(
        specifier.local?.name ?? specifier.imported.name
      );
    }
  }

  return compiledSpecifiers;
};
