#!/usr/bin/env node

import {
  readLocalizationCsv,
  validateLocalizationRows,
} from "./lib/localization.mjs";

const csvPath = process.argv[2] ?? "localization.csv";
const rows = readLocalizationCsv(csvPath);
const errors = validateLocalizationRows(rows);

if (errors.length > 0) {
  console.error(`localization validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`localization validation passed for ${rows.length - 2} entries`);
