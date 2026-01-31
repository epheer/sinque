# sinque — lightweight TTML parser and writer

A small toolkit for working with **TTML (Timed Text Markup Language)** in the browser.

* **Parse TTML** into timed cues
* **Write TTML** from plain text by recording timings line by line

---

## Features

* ✅ TTML parsing (basic `<p>` cues)
* ✅ Plain text → TTML **writer engine** (line timing recorder)
* ✅ Optional leading/trailing *silence* rows
* ✅ XML escaping for safe output
* ✅ Export as **string** or **Blob**

---

## Install

### npm

```bash
npm i sinque
```

### yarn

```bash
yarn add sinque
```

### pnpm

```bash
pnpm add sinque
```

---

## Parsing TTML

### Parse from a string

```ts
import { parse } from 'sinque'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  <body>
    <div>
      <p begin="00:00:01.000" end="00:00:02.000">Hello</p>
    </div>
  </body>
</tt>`

const cues = parse(xml)
// => [{ start: 1000, end: 2000, text: 'Hello' }]
```

### Parse from a file

```ts
import { parse } from 'sinque'

const response = await fetch('example/text.ttml')
const file = await response.blob()

const cues = parse(file)
```

---

## Writing TTML from text (timing recorder)

The writer engine converts **plain text lines** into TTML cues by recording the **end time** for each line.

### API

```ts
const { rows, write, exportTTMLString, exportTTMLFile } = sinque.write({
  text,
  silence: {
    start: true,
    end: true,
  },
})

rows                      // string[] — lines to time
record(rowIndex, endTime) // endTime in ms; start is inferred from the previous line
exportTTMLString()        // throws if not all rows are timed
exportTTMLFile()          // returns Blob (application/ttml+xml)
```

### Example

```ts
import { write } from 'sinque'

const text = `Intro
First line
Second line
Outro`

const writer = write({
  text,
  silence: { start: true, end: true }
})

// Show in UI
console.log(writer.rows)

// Record timings (end times in ms)
writer.record(0, 1200)
writer.record(1, 2800)
writer.record(2, 4100)
writer.record(3, 5200)
writer.record(4, 6500)
writer.record(5, 8000)

// Export
const ttml = writer.exportTTMLString()
console.log(ttml)

const blob = await writer.exportTTMLFile()
```

> Export functions throw `TTML is not ready` until every row has both `start` and `end` values.

---

## License

MIT
