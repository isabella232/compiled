import type { Argument, Block, DeclarationValue } from './types';

// Wrap the key in quotes if it uses unsafe characters
const createKey = (key: string) => (/^\w+$/g.test(key) ? key : '"' + key + '"');

const createValue = (value: DeclarationValue) => {
  const { type } = value;
  if (type === 'expression') {
    return value.expression.trim();
  }

  const literal = value.value;
  return typeof literal === 'string' && literal[0] !== '`' ? '"' + literal + '"' : literal;
};

const indent = (offset: number, level: number) => ' '.repeat(offset + level * 2);

const generateBlock = (blocks: Block[], offset: number, level: number): string => {
  let chars = indent(offset, level - 1) + '{' + '\n';
  for (const [i, block] of blocks.entries()) {
    chars += indent(offset, level);

    switch (block.type) {
      case 'declaration': {
        chars += createKey(block.property) + ': ' + createValue(block.value);
        break;
      }

      case 'rule': {
        chars +=
          createKey(block.selector) +
          ': ' +
          generateArguments(block.declarations, offset, level + 1).trim();
        break;
      }

      default:
        break;
    }

    if (blocks.length > 1 && i < blocks.length - 1) {
      chars += ',';
      chars += '\n';
    }
  }

  chars += '\n' + indent(offset, level - 1) + '}';

  return chars;
};

const generateArguments = (args: Argument[], offset: number, level): string => {
  let chars = '';
  for (const [i, arg] of args.entries()) {
    switch (arg.type) {
      case 'block': {
        if (args.length === 1) {
          chars += generateBlock(arg.blocks, offset, level).trim();
        } else {
          chars += '\n';
          chars += indent(offset, level);
          chars += generateBlock(arg.blocks, offset, level + 1).trim();
        }
        break;
      }

      case 'expression': {
        chars += '\n';
        chars += indent(offset, level);
        chars += arg.expression;
        break;
      }

      default:
        break;
    }

    if (args.length > 1 && i < args.length - 1) {
      chars += ',';
    }
  }

  return chars;
};

export const generate = (args: Argument[], offset: number, level = 0): string => {
  let chars = '';

  chars += '(';
  chars += generateArguments(args, offset, level + 1);
  if (args.length > 1) {
    chars += '\n';
    chars += indent(offset, level);
  }
  chars += ')';

  return chars;
};
