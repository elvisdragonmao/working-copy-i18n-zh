import fs from "node:fs";

const FORMAT_SPECIFIER_RE =
  /%(?!%)(?:(\d+)\$)?[-+#0]*(?:\d+|\*)?(?:\.(?:\d+|\*))?(hh|h|ll|l|L|z|t|j)?([@diuoxXfFeEgGaAcCsSp])/g;
const BRACED_VARIABLE_RE = /\$\{[A-Za-z_][A-Za-z0-9_]*\}/g;
const DOLLAR_VARIABLE_RE = /\$[A-Z][A-Z0-9_]+/g;

export const TITLE_CELL = "Localization-QA";
export const HEADER_ROW_INDEX = 1;
export const REQUIRED_COLUMNS = ["English", "Comment", "Importance", "Chinese"];
export const LANGUAGE_COLUMN_EXCLUDES = new Set(["English", "Comment", "Importance"]);

export function readTextFile(path) {
  return fs.readFileSync(path, "utf8");
}

export function writeTextFile(path, text) {
  fs.writeFileSync(path, text);
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsv(text) {
  const input = stripBom(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quoted) {
      if (char === "\"") {
        if (input[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (quoted) {
    throw new Error("CSV ended while inside a quoted field");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function stringifyCsv(rows) {
  return `${rows.map((row) => row.map(quoteCsvField).join(",")).join("\n")}\n`;
}

export function quoteCsvField(value) {
  const stringValue = String(value ?? "");
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replaceAll("\"", "\"\"")}"`;
}

export function readLocalizationCsv(path = "localization.csv") {
  return parseCsv(readTextFile(path));
}

export function getHeader(rows) {
  return rows[HEADER_ROW_INDEX] ?? [];
}

export function getColumnIndex(header, columnName) {
  return header.indexOf(columnName);
}

export function getLanguageColumns(header) {
  return header
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => name && !LANGUAGE_COLUMN_EXCLUDES.has(name));
}

export function rowToRecord(header, row, dataIndex) {
  return Object.fromEntries([
    ["index", dataIndex],
    ...header.map((name, index) => [name, row[index] ?? ""]),
  ]);
}

export function getDataRecords(rows) {
  const header = getHeader(rows);
  return rows.slice(HEADER_ROW_INDEX + 1).map((row, index) => rowToRecord(header, row, index));
}

export function extractVariables(text) {
  const variables = [];
  for (const match of String(text ?? "").matchAll(FORMAT_SPECIFIER_RE)) {
    const [, position, length = "", specifier] = match;
    variables.push({
      raw: match[0],
      kind: "format",
      key: `${length}${specifier}`,
      position: position ? Number(position) : null,
    });
  }
  for (const match of String(text ?? "").matchAll(BRACED_VARIABLE_RE)) {
    variables.push({ raw: match[0], kind: "variable", key: match[0], position: null });
  }
  for (const match of String(text ?? "").matchAll(DOLLAR_VARIABLE_RE)) {
    variables.push({ raw: match[0], kind: "variable", key: match[0], position: null });
  }
  return variables;
}

export function variableSignature(text) {
  const counts = new Map();
  for (const variable of extractVariables(text)) {
    const key = `${variable.kind}:${variable.key}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export function signaturesEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(([key, count], index) => {
    const [otherKey, otherCount] = right[index];
    return key === otherKey && count === otherCount;
  });
}

export function formatVariableSignature(signature) {
  if (signature.length === 0) {
    return "(none)";
  }
  return signature.map(([key, count]) => `${key.replace(/^(format|variable):/, "")} x${count}`).join(", ");
}

export function validateLocalizationRows(rows) {
  const errors = [];

  if (rows.length < 2) {
    errors.push("CSV must contain a title row and a header row");
    return errors;
  }

  const title = rows[0] ?? [];
  const header = getHeader(rows);
  if (title[0] !== TITLE_CELL) {
    errors.push(`row 1 column 1 must be ${TITLE_CELL}`);
  }

  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) {
      errors.push(`header is missing required column: ${column}`);
    }
  }

  const expectedWidth = header.length;
  rows.forEach((row, index) => {
    if (row.length !== expectedWidth) {
      errors.push(`row ${index + 1} has ${row.length} columns; expected ${expectedWidth}`);
    }
  });

  const englishIndex = getColumnIndex(header, "English");
  const commentIndex = getColumnIndex(header, "Comment");
  const importanceIndex = getColumnIndex(header, "Importance");
  const languageColumns = getLanguageColumns(header);

  rows.slice(HEADER_ROW_INDEX + 1).forEach((row, dataIndex) => {
    const rowNumber = dataIndex + HEADER_ROW_INDEX + 2;
    const english = row[englishIndex] ?? "";
    const blankUiString =
      !english.trim() && languageColumns.every(({ index }) => !(row[index] ?? "").trim());
    if (!english.trim() && !blankUiString) {
      errors.push(`row ${rowNumber} has an empty English source string`);
    }

    const importance = row[importanceIndex] ?? "";
    if (importance && Number.isNaN(Number(importance))) {
      errors.push(`row ${rowNumber} has a non-numeric Importance value: ${importance}`);
    }

    if (commentIndex >= 0 && (row[commentIndex] ?? "").includes("\u0000")) {
      errors.push(`row ${rowNumber} Comment contains a NUL byte`);
    }

    const sourceSignature = variableSignature(english);
    for (const { name, index } of languageColumns) {
      const translation = row[index] ?? "";
      if (!translation) {
        continue;
      }
      const translationSignature = variableSignature(translation);
      if (!signaturesEqual(sourceSignature, translationSignature)) {
        errors.push(
          [
            `row ${rowNumber} ${name} variables do not match English`,
            `English: ${formatVariableSignature(sourceSignature)}`,
            `${name}: ${formatVariableSignature(translationSignature)}`,
          ].join(" | "),
        );
      }
    }
  });

  return errors;
}
