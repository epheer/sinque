const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pad = (value: number, size: number): string =>
  String(value).padStart(size, '0');

const msToTime = (milliseconds: number): string => {
  const safeMs = Math.max(0, Math.floor(milliseconds));

  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const ms = safeMs % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(ms, 3)}`;
};

type RowNode = {
  text: string;
  start: number | null;
  end: number | null;
};

const createNode = (text = ''): RowNode => ({
  text,
  start: null,
  end: null,
});

const textToNodes = (
  text: string,
  startSilence?: boolean,
  endSilence?: boolean
): RowNode[] => [
  ...(startSilence ? [createNode()] : []),

  ...text.split(/\r?\n/).map(createNode),

  ...(endSilence ? [createNode()] : []),
];

export type TTMLWriterOptions = {
  text: string;
  silence?: {
    start?: boolean;
    end?: boolean;
  };
};

export type TTMLWriterApi = {
  rows: string[];
  record: (nodeIndex: number, endTime: number) => void;
  toString: () => string;
  toBlob: () => Blob;
};

export const write = ({
  text,
  silence = { start: true, end: true },
}: TTMLWriterOptions): TTMLWriterApi => {
  const { start = true, end = true } = silence;
  const nodes = textToNodes(text, start, end);

  let lastEnd = 0;

  const record = (nodeIndex: number, endTime: number) => {
    const node = nodes[nodeIndex];
    if (typeof node === 'undefined') {
      throw new Error('Invalid node index');
    }

    if (endTime <= lastEnd) {
      throw new Error('End must be greater than previous cue');
    }

    if (node.start !== null) {
      throw new Error('Node already written');
    }

    node.start = lastEnd;
    node.end = endTime;
    lastEnd = endTime;
  };

  const toString = (): string => {
    if (nodes.some((n) => n.start === null || n.end === null)) {
      throw new Error('TTML is not ready');
    }

    const paragraphs: string = nodes
      .map(
        (n: RowNode) => `
        <p begin="${msToTime(n.start!)}" end="${msToTime(n.end!)}">${escapeXml(n.text)}</p>`
      )
      .join('\n');

    return `
<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  <body>
    <div>
${paragraphs}
    </div>
  </body>
</tt>`;
  };

  const toBlob = (): Blob => {
    const xml = toString();
    return new Blob([xml], { type: 'application/ttml+xml' });
  };

  return {
    rows: nodes.map((node: RowNode) => node.text),
    record,
    toString,
    toBlob,
  };
};
