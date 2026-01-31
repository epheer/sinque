import { parse, type TTMLParserOptions } from './parser';
import type { Cue } from './ttml';

type Sinque = {
  parse: (opts: TTMLParserOptions) => Promise<Cue[]>;
};

const sinque: Sinque = {
  parse,
};

export default sinque;
