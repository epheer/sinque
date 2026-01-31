import type { Cue } from '../ttml';

let parser: DOMParser | null = null;

const getParser = (): DOMParser => {
  if (parser !== null) {
    return parser;
  }

  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available');
  }

  parser = new DOMParser();
  return parser;
};

const parseDoc = (xml: string): Document =>
  getParser().parseFromString(xml, 'text/xml');

const parseTime = (value: string): number => {
  if (value.endsWith('ms')) {
    return parseFloat(value);
  }

  if (value.endsWith('s')) {
    return parseFloat(value) * 1000;
  }

  if (value.includes(':')) {
    const [hours, minutes, seconds] = value.split(':');
    return (
      Number(hours) * 3600000 +
      Number(minutes) * 60000 +
      parseFloat(seconds) * 1000
    );
  }

  return 0;
};

type OnCueCallback = (cue: Cue) => Cue | void | null;

const parseTTMLString = (xml: string, onCue?: OnCueCallback): Cue[] => {
  const doc = parseDoc(xml);

  const nodes = doc.getElementsByTagName('p');

  const result: Cue[] = [];

  for (const node of Array.from(nodes)) {
    const begin = parseTime(node.getAttribute('begin') ?? '0s');

    const endAttr = node.getAttribute('end');
    const durAttr = node.getAttribute('dur');

    const end = endAttr
      ? parseTime(endAttr)
      : begin + parseTime(durAttr ?? '0s');

    let cue: Cue = {
      start: begin,
      end,
      text: node.textContent?.trim() ?? '',
    };

    if (typeof onCue !== 'undefined') {
      const transformed = onCue(cue);

      if (transformed === null) {
        continue;
      }

      cue = transformed ?? cue;
    }

    result.push(cue);
  }

  return result;
};

const parseTTMLFile = async (
  file: Blob,
  onCue?: OnCueCallback
): Promise<Cue[]> => {
  const text = await file.text();
  return parseTTMLString(text, onCue);
};

export type TTMLParserOptions = {
  ttml: string | File;
  onCue?: OnCueCallback;
};

export const parse = async ({ ttml, onCue }: TTMLParserOptions) => {
  if (ttml instanceof File) {
    return await parseTTMLFile(ttml, onCue);
  }

  return parseTTMLString(ttml, onCue);
};
