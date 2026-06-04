#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  getHeader,
  parseCsv,
  readTextFile,
  writeTextFile,
} from "./lib/localization.mjs";

const DEFAULT_BASE_COMMIT = "6fe111301789e72fb73a45a825a35cb9676f1577";
const DEFAULT_CSV_PATH = "localization.csv";
const DEFAULT_OUTPUT_PATH = "localization-diff.html";
const DATA_ROW_OFFSET = 2;
const TARGET_COLUMNS = new Set(["Chinese", "Chinese (Traditional)"]);

const options = parseOptions(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

const beforeRows = parseCsv(readGitFile(options.base, options.csvPath));
const afterRows = parseCsv(readTextFile(options.csvPath));
const report = buildReport({
  beforeRows,
  afterRows,
  base: options.base,
  csvPath: options.csvPath,
  includeUnchanged: options.includeUnchanged,
});

writeTextFile(options.outputPath, buildHtml(report));

console.log(
  [
    `wrote ${options.outputPath}`,
    `${report.summary.changedRows} changed row(s)`,
    `${report.summary.targetChangedRows} translation row(s)`,
    `${report.summary.protectedChangedRows} non-translation row(s)`,
  ].join(" | "),
);

if (report.summary.protectedChangedRows > 0 || report.headerChanges.length > 0) {
  console.log("review warning: non-Chinese fields or CSV header rows changed");
}

function parseOptions(args) {
  const parsed = {
    base: DEFAULT_BASE_COMMIT,
    csvPath: DEFAULT_CSV_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    includeUnchanged: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--base") {
      parsed.base = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === "--csv") {
      parsed.csvPath = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === "--output") {
      parsed.outputPath = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === "--include-unchanged") {
      parsed.includeUnchanged = true;
    } else if (!arg.startsWith("-") && parsed.base === DEFAULT_BASE_COMMIT) {
      parsed.base = arg;
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }

  return parsed;
}

function requireOptionValue(args, index, optionName) {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

function printUsage() {
  console.log(`Usage: node scripts/build-localization-diff.mjs [options]

Options:
  --base <commit>         Git commit used as the before version
                          default: ${DEFAULT_BASE_COMMIT}
  --csv <path>            CSV path to compare against the working tree
                          default: ${DEFAULT_CSV_PATH}
  --output <path>         HTML output path
                          default: ${DEFAULT_OUTPUT_PATH}
  --include-unchanged     Include unchanged rows in the HTML
  -h, --help              Show this help
`);
}

function readGitFile(ref, path) {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : "";
    throw new Error(`failed to read ${path} at ${ref}${stderr ? `: ${stderr}` : ""}`);
  }
}

function buildReport({ beforeRows, afterRows, base, csvPath, includeUnchanged }) {
  const beforeHeader = getHeader(beforeRows);
  const afterHeader = getHeader(afterRows);
  const columns = buildColumnList(beforeHeader, afterHeader);
  const rowCount = Math.max(beforeRows.length - DATA_ROW_OFFSET, afterRows.length - DATA_ROW_OFFSET);
  const rowDiffs = [];
  const changedByColumn = new Map(columns.map((column) => [column, 0]));
  const headerChanges = buildHeaderChanges(beforeRows, afterRows);

  for (let index = 0; index < rowCount; index += 1) {
    const beforeRow = beforeRows[index + DATA_ROW_OFFSET] ?? null;
    const afterRow = afterRows[index + DATA_ROW_OFFSET] ?? null;
    const changes = [];

    for (const column of columns) {
      const before = beforeRow ? getRowValue(beforeRow, beforeHeader, column) : "";
      const after = afterRow ? getRowValue(afterRow, afterHeader, column) : "";

      if (before !== after) {
        changes.push({
          column,
          before,
          after,
          target: TARGET_COLUMNS.has(column),
        });
        changedByColumn.set(column, (changedByColumn.get(column) ?? 0) + 1);
      }
    }

    const targetChanges = changes.filter((change) => change.target);
    const protectedChanges = changes.filter((change) => !change.target);
    const hasChange = changes.length > 0 || !beforeRow || !afterRow;

    if (!hasChange && !includeUnchanged) {
      continue;
    }

    rowDiffs.push({
      index,
      rowNumber: index + DATA_ROW_OFFSET + 1,
      beforeRow,
      afterRow,
      source: getBestValue({ beforeRow, afterRow, beforeHeader, afterHeader, column: "English" }),
      comment: getBestValue({ beforeRow, afterRow, beforeHeader, afterHeader, column: "Comment" }),
      importance: getBestValue({ beforeRow, afterRow, beforeHeader, afterHeader, column: "Importance" }),
      changes,
      targetChanges,
      protectedChanges,
      added: !beforeRow && Boolean(afterRow),
      deleted: Boolean(beforeRow) && !afterRow,
      hasChange,
    });
  }

  const changedRows = rowDiffs.filter((row) => row.hasChange);
  const summary = {
    base,
    csvPath,
    totalBeforeRows: Math.max(0, beforeRows.length - DATA_ROW_OFFSET),
    totalAfterRows: Math.max(0, afterRows.length - DATA_ROW_OFFSET),
    visibleRows: rowDiffs.length,
    changedRows: changedRows.length,
    unchangedRows: Math.max(0, rowCount - changedRows.length),
    targetChangedRows: changedRows.filter((row) => row.targetChanges.length > 0).length,
    protectedChangedRows: changedRows.filter((row) => row.protectedChanges.length > 0).length,
    zhCNChangedRows: changedRows.filter((row) => hasColumnChange(row, "Chinese")).length,
    zhTWChangedRows: changedRows.filter((row) => hasColumnChange(row, "Chinese (Traditional)")).length,
    addedRows: changedRows.filter((row) => row.added).length,
    deletedRows: changedRows.filter((row) => row.deleted).length,
    changedCells: changedRows.reduce((sum, row) => sum + row.changes.length, 0),
    changedByColumn: [...changedByColumn.entries()]
      .filter(([, count]) => count > 0)
      .map(([column, count]) => ({ column, count, target: TARGET_COLUMNS.has(column) })),
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    headerChanges,
    columns,
    beforeHeader,
    afterHeader,
    rows: rowDiffs,
  };
}

function buildColumnList(beforeHeader, afterHeader) {
  const columns = [];
  for (const column of afterHeader) {
    if (column && !columns.includes(column)) {
      columns.push(column);
    }
  }
  for (const column of beforeHeader) {
    if (column && !columns.includes(column)) {
      columns.push(column);
    }
  }
  return columns;
}

function buildHeaderChanges(beforeRows, afterRows) {
  return [
    buildMetaRowChange("Title row", 1, beforeRows[0] ?? [], afterRows[0] ?? []),
    buildMetaRowChange("Header row", 2, beforeRows[1] ?? [], afterRows[1] ?? []),
  ].filter(Boolean);
}

function buildMetaRowChange(label, rowNumber, before, after) {
  const beforeText = before.join(",");
  const afterText = after.join(",");

  if (beforeText === afterText) {
    return null;
  }

  return { label, rowNumber, before: beforeText, after: afterText };
}

function getBestValue({ beforeRow, afterRow, beforeHeader, afterHeader, column }) {
  const after = afterRow ? getRowValue(afterRow, afterHeader, column) : "";
  if (after) {
    return after;
  }
  return beforeRow ? getRowValue(beforeRow, beforeHeader, column) : "";
}

function getRowValue(row, header, column) {
  const index = header.indexOf(column);
  return index >= 0 ? row[index] ?? "" : "";
}

function hasColumnChange(row, column) {
  return row.changes.some((change) => change.column === column);
}

function buildHtml(report) {
  const renderedRows = report.rows.map((row) => renderRow(row, report)).join("");
  const headerWarning = renderHeaderWarning(report.headerChanges);
  const protectedWarning = renderProtectedWarning(report.summary);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>localization.csv translation diff</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f8;
      --surface: #ffffff;
      --surface-soft: #f1f5f7;
      --line: #d8dee3;
      --line-strong: #aeb8c1;
      --text: #1d252b;
      --muted: #5f6f7a;
      --danger-bg: #ffe3df;
      --danger-text: #8d2119;
      --success-bg: #dff3e7;
      --success-text: #145c32;
      --warn-bg: #fff2c9;
      --warn-text: #755600;
      --info-bg: #e1eefc;
      --info-text: #245c90;
      --row-hover: #eef6f8;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 14px/1.48 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto auto 1fr;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 4;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 14px 18px;
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      gap: 12px;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .subhead {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    input[type="search"] {
      width: min(380px, 38vw);
      min-width: 190px;
      height: 34px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      padding: 0 10px;
      background: #fff;
      color: var(--text);
      font: inherit;
    }

    .segments {
      display: inline-flex;
      max-width: 100%;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      overflow: auto hidden;
      background: #fff;
    }

    .segments button {
      height: 32px;
      border: 0;
      border-right: 1px solid var(--line-strong);
      background: transparent;
      color: var(--text);
      padding: 0 10px;
      font: inherit;
      white-space: nowrap;
      cursor: pointer;
    }

    .segments button:last-child {
      border-right: 0;
    }

    .segments button.active {
      background: #1f2c33;
      color: #fff;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
      gap: 1px;
      background: var(--line);
      border-bottom: 1px solid var(--line);
    }

    .metric {
      background: var(--surface);
      padding: 10px 14px;
      min-width: 0;
    }

    .metric-value {
      display: block;
      font-size: 20px;
      font-weight: 750;
      line-height: 1.1;
    }

    .metric-label {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-top: 3px;
    }

    .notice {
      border-bottom: 1px solid var(--line);
      background: var(--surface);
      padding: 10px 18px;
      color: var(--muted);
    }

    .notice.warn {
      background: var(--warn-bg);
      color: var(--warn-text);
    }

    .notice.ok {
      background: var(--success-bg);
      color: var(--success-text);
    }

    .notice-title {
      font-weight: 700;
      margin-right: 8px;
    }

    main {
      min-width: 0;
      overflow: auto;
    }

    table {
      width: 100%;
      min-width: 1180px;
      border-collapse: collapse;
      table-layout: fixed;
      background: var(--surface);
    }

    thead th {
      background: var(--surface-soft);
      border-bottom: 1px solid var(--line-strong);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
    }

    tbody tr:hover {
      background: var(--row-hover);
    }

    tbody tr[hidden] {
      display: none;
    }

    th.meta,
    td.meta {
      width: 150px;
    }

    th.source,
    td.source {
      width: 24%;
    }

    th.translation,
    td.translation {
      width: 22%;
    }

    th.protected,
    td.protected {
      width: 22%;
    }

    td {
      vertical-align: top;
      border-bottom: 1px solid var(--line);
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .row-number {
      font-weight: 750;
      margin-bottom: 6px;
    }

    .badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .badge {
      display: inline-flex;
      min-height: 20px;
      align-items: center;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge.info {
      background: var(--info-bg);
      color: var(--info-text);
    }

    .badge.warn {
      background: var(--warn-bg);
      color: var(--warn-text);
    }

    .badge.danger {
      background: var(--danger-bg);
      color: var(--danger-text);
    }

    .badge.success {
      background: var(--success-bg);
      color: var(--success-text);
    }

    .source-text {
      white-space: pre-wrap;
      font-weight: 650;
    }

    .importance {
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
    }

    .diff-inline {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      display: block;
    }

    .value {
      display: block;
      min-height: 34px;
      padding: 8px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .value.unchanged {
      color: var(--muted);
      background: #fafafa;
    }

    .diff-delete {
      background: var(--danger-bg);
      color: var(--danger-text);
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }

    .diff-insert {
      background: var(--success-bg);
      color: var(--success-text);
      font-weight: 700;
    }

    .placeholder {
      color: var(--muted);
      font-style: italic;
    }

    .protected-change + .protected-change {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed var(--line-strong);
    }

    .column-name {
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 750;
      color: var(--muted);
    }

    .empty-state {
      padding: 32px 18px;
      color: var(--muted);
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }

    @media (max-width: 860px) {
      header {
        grid-template-columns: 1fr;
      }

      .toolbar {
        justify-content: stretch;
      }

      input[type="search"] {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header>
      <div>
        <h1>localization.csv translation diff</h1>
        <div class="subhead">before: ${escapeHtml(report.summary.base)} | after: ${escapeHtml(report.summary.csvPath)} working tree | generated: ${escapeHtml(report.generatedAt)} | showing <span id="visible-count">${escapeHtml(report.rows.length)}</span> / ${escapeHtml(report.rows.length)} rows</div>
      </div>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search rows, English, or translations">
        <div class="segments" role="tablist" aria-label="diff filters">
          <button type="button" class="active" data-filter="all">All changes</button>
          <button type="button" data-filter="target">Translations</button>
          <button type="button" data-filter="zh-cn">Simplified</button>
          <button type="button" data-filter="zh-tw">Traditional</button>
          <button type="button" data-filter="protected">Other fields</button>
        </div>
      </div>
    </header>
    ${renderSummary(report.summary)}
    ${protectedWarning}
    ${headerWarning}
    <main>
      ${report.rows.length > 0 ? renderTable(renderedRows) : renderEmptyState()}
    </main>
  </div>
  <script>
    const rows = Array.from(document.querySelectorAll("tbody tr"));
    const search = document.getElementById("search");
    const count = document.getElementById("visible-count");
    const buttons = Array.from(document.querySelectorAll("[data-filter]"));
    const state = { filter: "all", query: "" };

    function applyFilters() {
      let visible = 0;
      for (const row of rows) {
        const kinds = row.dataset.kinds.split(" ");
        const filterMatches = state.filter === "all" || kinds.includes(state.filter);
        const searchMatches = !state.query || row.textContent.toLowerCase().includes(state.query);
        const show = filterMatches && searchMatches;
        row.hidden = !show;
        if (show) {
          visible += 1;
        }
      }
      if (count) {
        count.textContent = String(visible);
      }
    }

    search.addEventListener("input", () => {
      state.query = search.value.trim().toLowerCase();
      applyFilters();
    });

    for (const button of buttons) {
      button.addEventListener("click", () => {
        for (const item of buttons) {
          item.classList.remove("active");
        }
        button.classList.add("active");
        state.filter = button.dataset.filter;
        applyFilters();
      });
    }

    applyFilters();
  </script>
</body>
</html>
`;
}

function renderSummary(summary) {
  return `<section class="summary" aria-label="summary">
    ${renderMetric(summary.changedRows, "Changed rows")}
    ${renderMetric(summary.targetChangedRows, "Translation rows")}
    ${renderMetric(summary.protectedChangedRows, "Other-field rows")}
    ${renderMetric(summary.zhCNChangedRows, "Simplified rows")}
    ${renderMetric(summary.zhTWChangedRows, "Traditional rows")}
    ${renderMetric(summary.changedCells, "Changed cells")}
    ${renderMetric(summary.unchangedRows, "Unchanged rows")}
    ${renderMetric(summary.totalAfterRows, "Current rows")}
  </section>`;
}

function renderMetric(value, label) {
  return `<div class="metric"><span class="metric-value">${escapeHtml(value)}</span><span class="metric-label">${escapeHtml(label)}</span></div>`;
}

function renderProtectedWarning(summary) {
  if (summary.protectedChangedRows === 0) {
    return `<section class="notice ok"><span class="notice-title">Check result</span>No source text, importance, or other non-translation fields changed.</section>`;
  }

  const changedColumns = summary.changedByColumn
    .filter((item) => !item.target)
    .map((item) => `${displayColumnName(item.column)} ${item.count}`)
    .join(", ");

  return `<section class="notice warn"><span class="notice-title">Needs review</span>${summary.protectedChangedRows} row(s) include non-translation field changes: ${escapeHtml(changedColumns)}</section>`;
}

function renderHeaderWarning(headerChanges) {
  if (headerChanges.length === 0) {
    return "";
  }

  const items = headerChanges
    .map((change) => `<div class="protected-change">
      <div class="column-name">${escapeHtml(change.label)} | row ${escapeHtml(change.rowNumber)}</div>
      ${renderDiffBlock(change.before, change.after)}
    </div>`)
    .join("");

  return `<section class="notice warn"><span class="notice-title">CSV header rows changed</span>${items}</section>`;
}

function renderTable(rows) {
  return `<table>
    <thead>
      <tr>
        <th class="meta">Row / status</th>
        <th class="source">English</th>
        <th class="translation">Simplified Chinese</th>
        <th class="translation">Traditional Chinese</th>
        <th class="protected">Other field changes</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderEmptyState() {
  return `<div class="empty-state">No changes found.</div>`;
}

function renderRow(row, report) {
  const kinds = buildRowKinds(row);

  return `<tr data-kinds="${escapeAttribute(kinds.join(" "))}">
    <td class="meta">
      <div class="row-number">row ${escapeHtml(row.rowNumber)}</div>
      <div class="badges">${renderBadges(row)}</div>
    </td>
    <td class="source">
      <div class="source-text">${renderValue(row.source)}</div>
      ${row.importance ? `<div class="importance">Importance: ${escapeHtml(row.importance)}</div>` : ""}
    </td>
    <td class="translation">${renderColumnDiff(row, report.beforeHeader, report.afterHeader, "Chinese")}</td>
    <td class="translation">${renderColumnDiff(row, report.beforeHeader, report.afterHeader, "Chinese (Traditional)")}</td>
    <td class="protected">${renderProtectedChanges(row)}</td>
  </tr>`;
}

function buildRowKinds(row) {
  const kinds = [];
  if (row.hasChange) {
    kinds.push("changed");
  }
  if (row.targetChanges.length > 0) {
    kinds.push("target");
  }
  if (row.protectedChanges.length > 0) {
    kinds.push("protected");
  }
  if (hasColumnChange(row, "Chinese")) {
    kinds.push("zh-cn");
  }
  if (hasColumnChange(row, "Chinese (Traditional)")) {
    kinds.push("zh-tw");
  }
  if (row.added) {
    kinds.push("added");
  }
  if (row.deleted) {
    kinds.push("deleted");
  }
  if (kinds.length === 0) {
    kinds.push("unchanged");
  }
  return kinds;
}

function renderBadges(row) {
  const badges = [];
  if (row.added) {
    badges.push(renderBadge("Added", "success"));
  }
  if (row.deleted) {
    badges.push(renderBadge("Deleted", "danger"));
  }
  if (hasColumnChange(row, "Chinese")) {
    badges.push(renderBadge("Simplified", "info"));
  }
  if (hasColumnChange(row, "Chinese (Traditional)")) {
    badges.push(renderBadge("Traditional", "info"));
  }
  if (row.protectedChanges.length > 0) {
    badges.push(renderBadge("Other field", "warn"));
  }
  if (badges.length === 0) {
    badges.push(renderBadge("Unchanged", "success"));
  }
  return badges.join("");
}

function renderBadge(label, severity) {
  return `<span class="badge ${escapeAttribute(severity)}">${escapeHtml(label)}</span>`;
}

function renderColumnDiff(row, beforeHeader, afterHeader, column) {
  const before = row.beforeRow ? getRowValue(row.beforeRow, beforeHeader, column) : "";
  const after = row.afterRow ? getRowValue(row.afterRow, afterHeader, column) : "";

  if (before === after) {
    return `<span class="value unchanged">${renderValue(after)}</span>`;
  }

  return renderDiffBlock(before, after);
}

function renderProtectedChanges(row) {
  if (row.protectedChanges.length === 0) {
    return `<span class="value unchanged">Unchanged</span>`;
  }

  return row.protectedChanges
    .map((change) => `<div class="protected-change">
      <div class="column-name">${escapeHtml(displayColumnName(change.column))}</div>
      ${renderDiffBlock(change.before, change.after)}
    </div>`)
    .join("");
}

function renderDiffBlock(before, after) {
  const diff = buildTextDiff(before, after);

  return `<span class="diff-inline value">${renderDiffParts(diff)}</span>`;
}

function buildTextDiff(beforeValue, afterValue) {
  const beforeTokens = tokenize(beforeValue);
  const afterTokens = tokenize(afterValue);
  const prefixLength = commonPrefixLength(beforeTokens, afterTokens);
  const suffixLength = commonSuffixLength(beforeTokens, afterTokens, prefixLength);
  const beforeMiddle = beforeTokens.slice(prefixLength, beforeTokens.length - suffixLength);
  const afterMiddle = afterTokens.slice(prefixLength, afterTokens.length - suffixLength);
  const prefix = beforeTokens.slice(0, prefixLength);
  const suffix = beforeTokens.slice(beforeTokens.length - suffixLength);
  const middle = diffTokenLists(beforeMiddle, afterMiddle);

  return [
    ...partsFromTokens("same", prefix),
    ...middle,
    ...partsFromTokens("same", suffix),
  ];
}

function diffTokenLists(before, after) {
  if (before.length === 0 && after.length === 0) {
    return [];
  }
  if (before.length === 0) {
    return partsFromTokens("insert", after);
  }
  if (after.length === 0) {
    return partsFromTokens("delete", before);
  }
  if (before.length * after.length > 180000) {
    return [
      ...partsFromTokens("delete", before),
      ...partsFromTokens("insert", after),
    ];
  }

  const table = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1));
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      table[left][right] =
        before[left] === after[right]
          ? table[left + 1][right + 1] + 1
          : Math.max(table[left + 1][right], table[left][right + 1]);
    }
  }

  const parts = [];
  let left = 0;
  let right = 0;

  while (left < before.length && right < after.length) {
    if (before[left] === after[right]) {
      pushPart(parts, "same", before[left]);
      left += 1;
      right += 1;
    } else if (table[left + 1][right] >= table[left][right + 1]) {
      pushPart(parts, "delete", before[left]);
      left += 1;
    } else {
      pushPart(parts, "insert", after[right]);
      right += 1;
    }
  }

  while (left < before.length) {
    pushPart(parts, "delete", before[left]);
    left += 1;
  }

  while (right < after.length) {
    pushPart(parts, "insert", after[right]);
    right += 1;
  }

  return parts;
}

function tokenize(value) {
  const tokens = [];
  let buffer = "";
  let bufferKind = "";

  for (const char of Array.from(String(value ?? ""))) {
    const kind = tokenKind(char);
    if ((kind === "word" || kind === "space") && kind === bufferKind) {
      buffer += char;
      continue;
    }

    if (buffer) {
      tokens.push(buffer);
      buffer = "";
      bufferKind = "";
    }

    if (kind === "word" || kind === "space") {
      buffer = char;
      bufferKind = kind;
    } else {
      tokens.push(char);
    }
  }

  if (buffer) {
    tokens.push(buffer);
  }

  return tokens;
}

function tokenKind(char) {
  if (/[\t\n\r ]/.test(char)) {
    return "space";
  }
  if (/[A-Za-z0-9_@$%#.-]/.test(char)) {
    return "word";
  }
  return "char";
}

function commonPrefixLength(before, after) {
  let index = 0;
  while (index < before.length && index < after.length && before[index] === after[index]) {
    index += 1;
  }
  return index;
}

function commonSuffixLength(before, after, prefixLength) {
  let length = 0;
  while (
    length < before.length - prefixLength &&
    length < after.length - prefixLength &&
    before[before.length - 1 - length] === after[after.length - 1 - length]
  ) {
    length += 1;
  }
  return length;
}

function partsFromTokens(type, tokens) {
  if (tokens.length === 0) {
    return [];
  }
  return [{ type, text: tokens.join("") }];
}

function pushPart(parts, type, token) {
  const previous = parts[parts.length - 1];
  if (previous?.type === type) {
    previous.text += token;
  } else {
    parts.push({ type, text: token });
  }
}

function renderDiffParts(parts) {
  if (parts.length === 0 || parts.every((part) => part.text.length === 0)) {
    return `<span class="placeholder">(empty)</span>`;
  }

  return parts
    .map((part) => {
      if (part.type === "delete") {
        return `<span class="diff-delete">${escapeHtml(part.text)}</span>`;
      }
      if (part.type === "insert") {
        return `<span class="diff-insert">${escapeHtml(part.text)}</span>`;
      }
      return escapeHtml(part.text);
    })
    .join("");
}

function renderValue(value) {
  const text = String(value ?? "");
  if (!text) {
    return `<span class="placeholder">(empty)</span>`;
  }
  return escapeHtml(text);
}

function displayColumnName(column) {
  if (column === "Chinese") {
    return "Simplified Chinese";
  }
  if (column === "Chinese (Traditional)") {
    return "Traditional Chinese";
  }
  return column;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
