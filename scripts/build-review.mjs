#!/usr/bin/env node

import OpenCC from "opencc-js";
import {
  formatVariableSignature,
  getColumnIndex,
  getHeader,
  parsePo,
  parseUsageHtml,
  poEntriesToMap,
  readLocalizationCsv,
  readTextFile,
  signaturesEqual,
  variableSignature,
  writeTextFile,
} from "./lib/localization.mjs";

const OUTPUT_PATH = "review.html";
const TRADITIONAL_COLUMN = "Chinese (Traditional)";
const cnToTw = OpenCC.Converter({ from: "cn", to: "twp" });
const twToCn = OpenCC.Converter({ from: "tw", to: "cn" });

const rows = readLocalizationCsv("localization.csv");
const header = getHeader(rows);
const englishIndex = getColumnIndex(header, "English");
const commentIndex = getColumnIndex(header, "Comment");
const importanceIndex = getColumnIndex(header, "Importance");
const zhCNIndex = getColumnIndex(header, "Chinese");
const zhTWIndex = getColumnIndex(header, TRADITIONAL_COLUMN);

if ([englishIndex, commentIndex, importanceIndex, zhCNIndex, zhTWIndex].some((index) => index < 0)) {
  throw new Error(`localization.csv must contain English, Comment, Importance, Chinese and ${TRADITIONAL_COLUMN}`);
}

const poTerms = buildPoTerms();
const usageTerms = buildUsageTerms();
const reviewRows = rows.slice(2).map((row, index) => buildReviewRow(row, index));
const summary = buildSummary(reviewRows);
const html = buildHtml({ summary, rows: reviewRows });

writeTextFile(OUTPUT_PATH, html);
console.log(`wrote ${OUTPUT_PATH} with ${reviewRows.length} entries`);

function buildReviewRow(row, index) {
  const english = row[englishIndex] ?? "";
  const description = row[commentIndex] ?? "";
  const zhCN = row[zhCNIndex] ?? "";
  const zhTW = row[zhTWIndex] ?? "";
  const sourceSignature = variableSignature(english);
  const cnSignature = variableSignature(zhCN);
  const twSignature = variableSignature(zhTW);
  const formatOk = signaturesEqual(sourceSignature, cnSignature) && signaturesEqual(sourceSignature, twSignature);
  const twSimplified = findChangedChineseChars(zhTW, cnToTw);
  const cnTraditional = findChangedChineseChars(zhCN, twToCn);
  const poMatches = findReferenceMatches(poTerms, { english, description, zhCN, zhTW });
  const usageMatches = findReferenceMatches(usageTerms, { english, description, zhCN, zhTW });
  const tags = [];

  tags.push(formatOk ? tag("format", "格式 OK", "ok") : tag("format", "格式錯誤", "error"));
  if (twSimplified.length > 0) {
    tags.push(tag("script", "繁含簡", "warn"));
  }
  if (cnTraditional.length > 0) {
    tags.push(tag("script", "簡含繁", "warn"));
  }
  if (poMatches.length > 0) {
    tags.push(tag("po", poMatches.some((match) => match.status === "different") ? "PO 不同" : "PO 相同", poMatches.some((match) => match.status === "different") ? "warn" : "info"));
  }
  if (usageMatches.length > 0) {
    tags.push(tag("usage", usageMatches.some((match) => match.status === "different") ? "術語不同" : "術語相同", usageMatches.some((match) => match.status === "different") ? "warn" : "info"));
  }

  return {
    id: index,
    rowNumber: index + 3,
    english,
    description,
    importance: row[importanceIndex] ?? "",
    zhCN,
    zhTW,
    tags,
    hasIssue: !formatOk || twSimplified.length > 0 || cnTraditional.length > 0 || poMatches.some((match) => match.status === "different") || usageMatches.some((match) => match.status === "different"),
    checks: {
      format: {
        ok: formatOk,
        english: formatVariableSignature(sourceSignature),
        zhCN: formatVariableSignature(cnSignature),
        zhTW: formatVariableSignature(twSignature),
      },
      script: {
        twSimplified,
        cnTraditional,
      },
      po: poMatches,
      usage: usageMatches,
    },
  };
}

function buildPoTerms() {
  const twMap = poEntriesToMap(parsePo(readTextFile("zh_TW.po")));
  const cnMap = poEntriesToMap(parsePo(readTextFile("zh_CN.po")));
  const terms = [];
  for (const [english, zhCN] of cnMap) {
    const zhTW = twMap.get(english);
    if (!isUsefulReferenceTerm({ english, zhCN, zhTW })) {
      continue;
    }
    terms.push({
      source: "Git PO",
      english,
      zhCN: [zhCN],
      zhTW: [zhTW],
    });
  }
  return sortTerms(terms);
}

function buildUsageTerms() {
  return sortTerms(
    parseUsageHtml(readTextFile("usage.html"))
      .filter(({ english, zhCN, zhTW }) => isUsefulReferenceTerm({ english, zhCN, zhTW }))
      .map(({ english, zhCN, zhTW }) => ({
        source: "中文計算機術語速查",
        english,
        zhCN: splitAlternatives(zhCN),
        zhTW: splitAlternatives(zhTW),
      })),
  );
}

function isUsefulReferenceTerm({ english, zhCN, zhTW }) {
  if (!english || !zhCN || !zhTW) {
    return false;
  }
  if (english.length < 2 || english.length > 48 || /[%${}\n]/.test(english)) {
    return false;
  }
  if (!/[A-Za-z]/.test(english) || !hasChinese(zhCN) || !hasChinese(zhTW)) {
    return false;
  }
  return true;
}

function splitAlternatives(value) {
  return String(value ?? "")
    .split(/[;；]/)
    .map((part) => part.replace(/\s*\([^)]*\)/g, "").trim())
    .filter((part) => part && hasChinese(part));
}

function findReferenceMatches(terms, row) {
  const matches = [];
  for (const term of terms) {
    if (!includesEnglishTerm(row.english, term.english)) {
      continue;
    }
    const cnSame = term.zhCN.some((value) => row.zhCN.includes(value));
    const twSame = term.zhTW.some((value) => row.zhTW.includes(value));
    matches.push({
      source: term.source,
      english: term.english,
      zhCN: term.zhCN,
      zhTW: term.zhTW,
      cnSame,
      twSame,
      status: cnSame && twSame ? "same" : "different",
    });
  }
  return matches.slice(0, 12);
}

function includesEnglishTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`, "i").test(text);
}

function findChangedChineseChars(text, converter) {
  const chars = new Set();
  for (const char of String(text ?? "")) {
    if (!hasChinese(char)) {
      continue;
    }
    if (converter(char) !== char) {
      chars.add(char);
    }
  }
  return [...chars].slice(0, 12);
}

function hasChinese(value) {
  return /[\u3400-\u9fff]/.test(String(value ?? ""));
}

function sortTerms(terms) {
  return terms.sort((left, right) => right.english.length - left.english.length);
}

function tag(kind, label, severity) {
  return { kind, label, severity };
}

function buildSummary(reviewRows) {
  return {
    total: reviewRows.length,
    issues: reviewRows.filter((row) => row.hasIssue).length,
    formatErrors: reviewRows.filter((row) => !row.checks.format.ok).length,
    twSimplified: reviewRows.filter((row) => row.checks.script.twSimplified.length > 0).length,
    cnTraditional: reviewRows.filter((row) => row.checks.script.cnTraditional.length > 0).length,
    poDifferent: reviewRows.filter((row) => row.checks.po.some((match) => match.status === "different")).length,
    usageDifferent: reviewRows.filter((row) => row.checks.usage.some((match) => match.status === "different")).length,
  };
}

function buildHtml(data) {
  const json = JSON.stringify(data).replaceAll("</", "<\\/");
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Working Copy 翻譯審查</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --panel: #ffffff;
      --line: #d8d6cf;
      --line-strong: #b9b6ac;
      --text: #1f2528;
      --muted: #667074;
      --selected: #e8f2ef;
      --ok-bg: #e1f3e4;
      --ok-text: #1f6b39;
      --warn-bg: #fff0c7;
      --warn-text: #815a00;
      --error-bg: #ffdede;
      --error-text: #9f1c1c;
      --info-bg: #e1ebf7;
      --info-text: #285a89;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    header {
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      padding: 12px 16px;
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto;
      gap: 12px;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
    }

    .summary {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
    }

    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
      min-width: 0;
    }

    input[type="search"] {
      width: min(360px, 40vw);
      min-width: 180px;
      height: 34px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      padding: 0 10px;
      font: inherit;
      background: #fff;
    }

    .segments {
      display: inline-flex;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      overflow: hidden;
      background: #fff;
    }

    .segments button {
      height: 32px;
      border: 0;
      border-right: 1px solid var(--line-strong);
      background: transparent;
      padding: 0 10px;
      color: var(--text);
      font: inherit;
      cursor: pointer;
    }

    .segments button:last-child {
      border-right: 0;
    }

    .segments button.active {
      background: #20272b;
      color: #fff;
    }

    main {
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(520px, 58vw) minmax(360px, 1fr);
    }

    .table-pane,
    .detail-pane {
      min-height: 0;
      overflow: auto;
    }

    .table-pane {
      border-right: 1px solid var(--line);
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f0f0ec;
      border-bottom: 1px solid var(--line-strong);
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
      text-align: left;
      padding: 8px;
    }

    tbody tr {
      cursor: pointer;
    }

    tbody tr.selected {
      background: var(--selected);
    }

    tbody tr:hover {
      background: #f4f8f6;
    }

    td {
      vertical-align: top;
      border-bottom: 1px solid var(--line);
      padding: 8px;
      overflow-wrap: anywhere;
    }

    th.labels,
    td.labels {
      width: 190px;
    }

    .badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 20px;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 650;
      white-space: nowrap;
    }

    .badge.ok { background: var(--ok-bg); color: var(--ok-text); }
    .badge.warn { background: var(--warn-bg); color: var(--warn-text); }
    .badge.error { background: var(--error-bg); color: var(--error-text); }
    .badge.info { background: var(--info-bg); color: var(--info-text); }

    .cell-text {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      white-space: pre-wrap;
    }

    .detail-pane {
      background: var(--bg);
      padding: 18px;
    }

    .detail {
      max-width: 920px;
      margin: 0 auto;
    }

    .detail h2 {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .meta {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 12px;
    }

    .section {
      border-top: 1px solid var(--line);
      padding-top: 14px;
      margin-top: 14px;
    }

    .section h3 {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .translation-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field {
      min-width: 0;
    }

    .field label {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }

    .value {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      min-height: 42px;
    }

    .check-list {
      display: grid;
      gap: 8px;
    }

    .check {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
    }

    .check-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
      font-weight: 650;
    }

    .ref-list {
      display: grid;
      gap: 8px;
    }

    .ref {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
    }

    .ref-title {
      font-weight: 650;
      margin-bottom: 4px;
    }

    .empty {
      color: var(--muted);
      font-style: italic;
    }

    @media (max-width: 980px) {
      header {
        grid-template-columns: 1fr;
      }

      .toolbar {
        justify-content: stretch;
        flex-wrap: wrap;
      }

      input[type="search"] {
        width: 100%;
      }

      main {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(340px, 52vh) minmax(360px, 1fr);
      }

      .table-pane {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .translation-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header>
      <div>
        <h1>Working Copy 翻譯審查</h1>
        <div class="summary" id="summary"></div>
      </div>
      <div class="toolbar">
        <input id="search" type="search" placeholder="搜尋英文、簡體、繁體或描述">
        <div class="segments" role="tablist" aria-label="filter">
          <button type="button" class="active" data-filter="all">全部</button>
          <button type="button" data-filter="issues">需審查</button>
        </div>
      </div>
    </header>
    <main>
      <section class="table-pane" aria-label="translation table">
        <table>
          <thead>
            <tr>
              <th class="labels">標籤</th>
              <th>英文</th>
              <th>簡體中文</th>
              <th>繁體中文</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </section>
      <aside class="detail-pane" aria-label="translation details">
        <div class="detail" id="detail"></div>
      </aside>
    </main>
  </div>
  <script>
    const REVIEW_DATA = ${json};
    const state = { filter: "all", search: "", selectedId: 0, visible: [] };
    const rowsEl = document.getElementById("rows");
    const detailEl = document.getElementById("detail");
    const searchEl = document.getElementById("search");
    const summaryEl = document.getElementById("summary");

    summaryEl.textContent = [
      REVIEW_DATA.summary.total + " 筆",
      REVIEW_DATA.summary.issues + " 筆需審查",
      "格式錯誤 " + REVIEW_DATA.summary.formatErrors,
      "繁含簡 " + REVIEW_DATA.summary.twSimplified,
      "簡含繁 " + REVIEW_DATA.summary.cnTraditional,
      "PO 不同 " + REVIEW_DATA.summary.poDifferent,
      "術語不同 " + REVIEW_DATA.summary.usageDifferent,
    ].join(" · ");

    document.querySelectorAll(".segments button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".segments button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        state.filter = button.dataset.filter;
        render();
      });
    });

    searchEl.addEventListener("input", () => {
      state.search = searchEl.value.trim().toLowerCase();
      render();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (state.visible.length === 0) return;
      event.preventDefault();
      const currentIndex = Math.max(0, state.visible.findIndex((row) => row.id === state.selectedId));
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = Math.min(state.visible.length - 1, Math.max(0, currentIndex + delta));
      selectRow(state.visible[nextIndex].id, true);
    });

    function render() {
      state.visible = REVIEW_DATA.rows.filter((row) => {
        if (state.filter === "issues" && !row.hasIssue) return false;
        if (!state.search) return true;
        return [row.english, row.description, row.zhCN, row.zhTW].some((value) => value.toLowerCase().includes(state.search));
      });
      if (!state.visible.some((row) => row.id === state.selectedId)) {
        state.selectedId = state.visible[0]?.id ?? null;
      }
      rowsEl.innerHTML = state.visible.map((row) => rowHtml(row)).join("");
      rowsEl.querySelectorAll("tr").forEach((tr) => {
        tr.addEventListener("click", () => selectRow(Number(tr.dataset.id), false));
      });
      renderDetail();
    }

    function rowHtml(row) {
      return \`<tr data-id="\${row.id}" class="\${row.id === state.selectedId ? "selected" : ""}">
        <td class="labels"><div class="badges">\${row.tags.map(badgeHtml).join("")}</div></td>
        <td><div class="cell-text">\${escapeHtml(row.english)}</div></td>
        <td><div class="cell-text">\${escapeHtml(row.zhCN)}</div></td>
        <td><div class="cell-text">\${escapeHtml(row.zhTW)}</div></td>
      </tr>\`;
    }

    function badgeHtml(tag) {
      return \`<span class="badge \${tag.severity}" title="\${escapeHtml(tag.kind)}">\${escapeHtml(tag.label)}</span>\`;
    }

    function selectRow(id, scrollIntoView) {
      state.selectedId = id;
      rowsEl.querySelectorAll("tr").forEach((tr) => {
        tr.classList.toggle("selected", Number(tr.dataset.id) === id);
      });
      if (scrollIntoView) {
        rowsEl.querySelector(\`tr[data-id="\${id}"]\`)?.scrollIntoView({ block: "nearest" });
      }
      renderDetail();
    }

    function renderDetail() {
      const row = REVIEW_DATA.rows.find((item) => item.id === state.selectedId);
      if (!row) {
        detailEl.innerHTML = '<p class="empty">沒有符合條件的項目。</p>';
        return;
      }
      detailEl.innerHTML = \`
        <h2>\${escapeHtml(row.english || "(blank)")}</h2>
        <div class="meta">CSV row \${row.rowNumber} · Importance \${escapeHtml(row.importance || "-")}</div>
        <div class="badges">\${row.tags.map(badgeHtml).join("")}</div>
        <div class="section">
          <h3>Description</h3>
          <div class="value">\${escapeHtml(row.description || "無")}</div>
        </div>
        <div class="section">
          <h3>Translations</h3>
          <div class="translation-grid">
            <div class="field"><label>簡體中文</label><div class="value">\${escapeHtml(row.zhCN)}</div></div>
            <div class="field"><label>繁體中文</label><div class="value">\${escapeHtml(row.zhTW)}</div></div>
          </div>
        </div>
        <div class="section">
          <h3>Checks</h3>
          <div class="check-list">\${checksHtml(row)}</div>
        </div>
        <div class="section">
          <h3>PO Matches</h3>
          <div class="ref-list">\${referencesHtml(row.checks.po)}</div>
        </div>
        <div class="section">
          <h3>Usage Matches</h3>
          <div class="ref-list">\${referencesHtml(row.checks.usage)}</div>
        </div>\`;
    }

    function checksHtml(row) {
      const formatBadge = row.checks.format.ok ? badgeHtml({ label: "OK", severity: "ok", kind: "format" }) : badgeHtml({ label: "錯誤", severity: "error", kind: "format" });
      const twChars = row.checks.script.twSimplified.length ? row.checks.script.twSimplified.join(" ") : "無";
      const cnChars = row.checks.script.cnTraditional.length ? row.checks.script.cnTraditional.join(" ") : "無";
      return \`
        <div class="check">
          <div class="check-title">\${formatBadge}<span>變數與 placeholder</span></div>
          <div>English: \${escapeHtml(row.checks.format.english)}</div>
          <div>簡體: \${escapeHtml(row.checks.format.zhCN)}</div>
          <div>繁體: \${escapeHtml(row.checks.format.zhTW)}</div>
        </div>
        <div class="check">
          <div class="check-title">\${badgeHtml({ label: row.checks.script.twSimplified.length || row.checks.script.cnTraditional.length ? "需看" : "OK", severity: row.checks.script.twSimplified.length || row.checks.script.cnTraditional.length ? "warn" : "ok", kind: "script" })}<span>繁簡字形</span></div>
          <div>繁體疑似簡體字: \${escapeHtml(twChars)}</div>
          <div>簡體疑似繁體字: \${escapeHtml(cnChars)}</div>
        </div>\`;
    }

    function referencesHtml(matches) {
      if (!matches.length) return '<p class="empty">沒有參考命中。</p>';
      return matches.map((match) => \`
        <div class="ref">
          <div class="ref-title">\${badgeHtml({ label: match.status === "same" ? "相同" : "不同", severity: match.status === "same" ? "info" : "warn", kind: match.source })} \${escapeHtml(match.source)} · \${escapeHtml(match.english)}</div>
          <div>參考簡體: \${escapeHtml(match.zhCN.join(" / "))} \${match.cnSame ? "✓" : "未命中"}</div>
          <div>參考繁體: \${escapeHtml(match.zhTW.join(" / "))} \${match.twSame ? "✓" : "未命中"}</div>
        </div>\`).join("");
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    render();
  </script>
</body>
</html>`;
}
