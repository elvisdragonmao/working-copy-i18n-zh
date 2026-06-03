#!/usr/bin/env node

import OpenCC from "opencc-js";
import {
  getColumnIndex,
  getHeader,
  readLocalizationCsv,
  signaturesEqual,
  stringifyCsv,
  validateLocalizationRows,
  variableSignature,
  writeTextFile,
} from "./lib/localization.mjs";

const CSV_PATH = "localization.csv";
const TRADITIONAL_COLUMN = "Chinese (Traditional)";
const OVERWRITE = process.argv.includes("--overwrite");

const cnToTw = OpenCC.Converter({ from: "cn", to: "twp" });

const EXACT_OVERRIDES = new Map([
  ["Clone", "拓製"],
  ["Fetch from remote", "從遠端抓取"],
  ["Pull from remote", "從遠端拉取"],
  ["Repository", "版本庫"],
  ["Repository name", "版本庫名稱"],
  ["Repository status", "版本庫狀態"],
  ["Settings", "設定"],
  ["Status and Configuration", "狀態與設定"],
  ["Tag", "標籤"],
  ["Tag name", "標籤名稱"],
  ["Changes", "變更"],
  ["Rate Working Copy", "為 Working Copy 評分"],
  ["Read about recent changes", "瞭解近期變更"],
  ["Visit", "造訪"],
  ["Available at %@", "可在 %@ 使用"],
  ["SSH Key needed for %@", "需要 SSH 金鑰才能存取 %@"],
]);

const CONTEXT_REPLACEMENTS = [
  { pattern: /\bfetch(es|ed|ing)?\b/i, from: ["獲取", "取得"], to: "抓取" },
  { pattern: /\bcheckout\b|\bcheck out\b/i, from: ["檢出"], to: "簽出" },
  { pattern: /\bclone(s|d|ing)?\b/i, from: ["克隆"], to: "拓製" },
  { pattern: /\brebase(s|d|ing)?\b/i, from: ["變基"], to: "重定基底" },
  { pattern: /\bstash(es|ed|ing)?\b/i, from: ["貯藏", "儲藏"], to: "貯存" },
  { pattern: /\bapply\b|\bapplies\b|\bapplying\b/i, from: ["應用"], to: "套用" },
  { pattern: /\bapp(s)?\b/i, from: ["應用"], to: "App" },
  { pattern: /\bapplication(s)?\b/i, from: ["應用程序", "應用程式"], to: "應用程式" },
  { pattern: /\baccess\b|\baccessing\b/i, from: ["訪問"], to: "存取" },
  { pattern: /\bconfiguration\b|\bconfigure\b|\bconfiguring\b|\bconfigured\b/i, from: ["配置"], to: "設定" },
  { pattern: /\btoken(s)?\b/i, from: ["令牌"], to: "權杖" },
  { pattern: /\bcommit message(s)?\b/i, from: ["提交說明", "提交訊息"], to: "提交訊息" },
  { pattern: /\bpull request(s)?\b/i, from: ["拉取請求"], to: "Pull Request" },
];

const PHRASE_REPLACEMENTS = [
  ["遠端獲取", "遠端抓取"],
  ["從遠端取得", "從遠端抓取"],
  ["訪問權杖", "存取權杖"],
  ["認證權杖", "驗證權杖"],
  ["身份", "身分"],
  ["檔案名", "檔名"],
  ["文本檔案", "文字檔案"],
  ["文本", "文字"],
  ["訊息框", "訊息方塊"],
  ["不可訪問", "無法存取"],
  ["私鑰", "密鑰"],
  ["公鑰", "公開金鑰"],
  ["主機金鑰", "主機金鑰"],
  ["密碼短語", "密碼片語"],
  ["應用內購買", "App 內購買"],
  ["檔案 App", "「檔案」App"],
  ["App 商店", "App Store"],
  ["應用程式商店", "App Store"],
  ["共享擴充功能", "分享延伸功能"],
  ["共享", "分享"],
  ["用戶指南", "使用者指南"],
  ["用戶", "使用者"],
  ["本地", "本機"],
  ["客戶端", "用戶端"],
  ["託管服務商", "代管服務商"],
  ["託管提供商", "代管服務商"],
  ["提供商", "服務商"],
  ["新聞通訊", "電子報"],
  ["版本說明", "版本資訊"],
  ["釋出說明", "版本資訊"],
  ["許可證", "授權條款"],
  ["自定義", "自訂"],
  ["標頭", "標頭"],
  ["註解", "註解"],
  ["拉取請求", "Pull Request"],
  ["推播", "推送"],
  ["星標", "星號標記"],
  ["加星標", "加上星號"],
  ["無匹配結果", "沒有相符結果"],
  ["沒有匹配結果", "沒有相符結果"],
  ["后台", "背景"],
  ["後台", "背景"],
];

const GLOBAL_REPLACEMENTS = [
  ["存儲庫", "版本庫"],
  ["儲存庫", "版本庫"],
  ["倉庫", "版本庫"],
  ["遠程", "遠端"],
  ["獲取", "取得"],
  ["克隆", "拓製"],
  ["檢出", "簽出"],
  ["變基", "重定基底"],
  ["貯藏", "貯存"],
  ["儲藏", "貯存"],
  ["子模塊", "子模組"],
  ["標簽", "標籤"],
  ["條目", "項目"],
  ["密鑰", "金鑰"],
  ["令牌", "權杖"],
  ["剪貼板", "剪貼簿"],
  ["輕觸", "點一下"],
  ["服務器", "伺服器"],
  ["設置", "設定"],
  ["配置", "設定"],
  ["賬戶", "帳戶"],
  ["屏幕", "螢幕"],
  ["網絡", "網路"],
  ["內置", "內建"],
  ["導入", "匯入"],
  ["導出", "匯出"],
  ["搜索", "搜尋"],
  ["工作流", "工作流程"],
  ["緩存", "快取"],
  ["軟件", "軟體"],
  ["擴展", "擴充功能"],
  ["快捷方式", "捷徑"],
  ["快捷指令", "捷徑"],
  ["智能體", "代理程式"],
  ["消息", "訊息"],
  ["更改", "變更"],
  ["當前", "目前"],
  ["創建", "建立"],
  ["授予", "提供"],
  ["支持", "支援"],
  ["訪問", "存取"],
];

const rows = readLocalizationCsv(CSV_PATH);
const header = getHeader(rows);
const chineseIndex = getColumnIndex(header, "Chinese");
let traditionalIndex = getColumnIndex(header, TRADITIONAL_COLUMN);

if (chineseIndex < 0) {
  throw new Error("localization.csv is missing the Chinese column");
}

if (traditionalIndex < 0) {
  traditionalIndex = chineseIndex + 1;
  rows[0].splice(traditionalIndex, 0, "");
  header.splice(traditionalIndex, 0, TRADITIONAL_COLUMN);
  for (const row of rows.slice(2)) {
    row.splice(traditionalIndex, 0, "");
  }
}

const englishIndex = getColumnIndex(header, "English");
const commentIndex = getColumnIndex(header, "Comment");
let filled = 0;

for (const row of rows.slice(2)) {
  const existing = row[traditionalIndex] ?? "";
  if (existing.trim() && !OVERWRITE) {
    continue;
  }

  const english = row[englishIndex] ?? "";
  const comment = row[commentIndex] ?? "";
  const simplified = row[chineseIndex] ?? "";
  const translated = translateTraditional({ english, comment, simplified });
  row[traditionalIndex] = translated;
  filled += 1;

  const sourceSignature = variableSignature(english);
  const translatedSignature = variableSignature(translated);
  if (!signaturesEqual(sourceSignature, translatedSignature)) {
    throw new Error(`generated placeholder mismatch for "${english}"`);
  }
}

const errors = validateLocalizationRows(rows);
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}

writeTextFile(CSV_PATH, stringifyCsv(rows));
console.log(`${OVERWRITE ? "updated" : "filled"} ${filled} ${TRADITIONAL_COLUMN} entries`);

function translateTraditional({ english, comment, simplified }) {
  if (EXACT_OVERRIDES.has(english)) {
    return EXACT_OVERRIDES.get(english);
  }

  const context = `${english}\n${comment}`;
  let output = cnToTw(simplified);

  output = applyContextReplacements(output, context);
  output = applyReplacementList(output, PHRASE_REPLACEMENTS);
  output = applyReplacementList(output, GLOBAL_REPLACEMENTS);
  output = cleanGeneratedTranslation(output);

  return output;
}

function applyContextReplacements(text, context) {
  let output = text;
  for (const replacement of CONTEXT_REPLACEMENTS) {
    if (!replacement.pattern.test(context)) {
      continue;
    }
    for (const from of replacement.from) {
      output = replaceAll(output, from, replacement.to);
    }
  }
  return output;
}

function applyReplacementList(text, replacements) {
  let output = text;
  for (const [from, to] of replacements) {
    output = replaceAll(output, from, to);
  }
  return output;
}

function cleanGeneratedTranslation(text) {
  return text
    .replace(/([\u3400-\u9fff])App/g, "$1 App")
    .replace(/App([\u3400-\u9fff])/g, "App $1")
    .replaceAll("Git版本庫", "Git 版本庫")
    .replaceAll("SSH金鑰", "SSH 金鑰")
    .replaceAll("SSH公開金鑰", "SSH 公開金鑰")
    .replaceAll("SSH密鑰", "SSH 密鑰")
    .replaceAll("URL Callbacks金鑰", "URL Callbacks 金鑰")
    .replaceAll("AppStore", "App Store")
    .replaceAll("WorkingCopy", "Working Copy");
}

function replaceAll(text, from, to) {
  if (!from || from === to) {
    return text;
  }
  return text.split(from).join(to);
}
