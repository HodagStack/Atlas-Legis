#!/usr/bin/env node
/**
 * build-school-pages.js — extracts + renders + writes every schools/<slug>/index.html
 * in the new dashboard-style template.
 *
 * Usage:
 *   node scripts/build-school-pages.js --dry-run           # render in memory, no writes
 *   node scripts/build-school-pages.js --only=SLUG[,SLUG2]  # limit to specific schools
 *   node scripts/build-school-pages.js                      # write all
 */
const fs = require('fs');
const path = require('path');
const { extract } = require('./generate-school-pages.js');
const { renderPage } = require('./render-template.js');

const ROOT = path.join(__dirname, '..');
const SCHOOLS_DIR = path.join(ROOT, 'schools');
const DRY_RUN = process.argv.includes('--dry-run');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',') : null;

const dirs = fs.readdirSync(SCHOOLS_DIR)
  .filter(f => fs.statSync(path.join(SCHOOLS_DIR, f)).isDirectory())
  .filter(f => !ONLY || ONLY.includes(f));

let written = 0, skipped = 0;
const skippedList = [];
const sizeReport = [];

for (const slug of dirs) {
  const file = path.join(SCHOOLS_DIR, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  try {
    const d = extract(html, slug);
    const out = renderPage(d);
    if (/\bundefined\b|\bNaN\b/.test(out)) {
      throw new Error('output contains undefined/NaN — template bug');
    }
    if (!DRY_RUN) {
      fs.writeFileSync(file, out, 'utf8');
    }
    written++;
    sizeReport.push({ slug, before: html.length, after: out.length });
  } catch (e) {
    skipped++;
    skippedList.push(`${slug}: ${e.message}`);
  }
}

console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Rendered ${written}/${dirs.length} school pages, skipped ${skipped}`);
if (skippedList.length) {
  console.log('\nSKIPPED (left untouched):');
  skippedList.forEach(s => console.log(' - ' + s));
}
if (ONLY) {
  sizeReport.forEach(s => console.log(`${s.slug}: ${s.before} -> ${s.after} bytes`));
}
