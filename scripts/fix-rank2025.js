#!/usr/bin/env node
/**
 * fix-rank2025.js
 *
 * One-time fix: restores correct rank2025/rankDisplay2025 values in
 * law-schools.json using the original pre-2026-update backup.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const BACKUP  = path.join(__dirname, 'law-schools-2025-backup.json');
const SRC_LS  = path.join(ROOT, 'data', 'law-schools.json');

const original = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
const current  = JSON.parse(fs.readFileSync(SRC_LS,  'utf8'));

const origBySlug = Object.fromEntries(original.map(s => [s.slug, s.rank]));

let fixed = 0;
for (const school of current) {
  const orig2025 = origBySlug[school.slug];
  const correct2025 = (orig2025 != null) ? orig2025 : null;
  const correctDisplay = correct2025 != null ? `#${correct2025}` : null;

  if (school.rank2025 !== correct2025 || school.rankDisplay2025 !== correctDisplay) {
    school.rank2025        = correct2025;
    school.rankDisplay2025 = correctDisplay;
    fixed++;
  }
}

fs.writeFileSync(SRC_LS, JSON.stringify(current, null, 2), 'utf8');
console.log(`✓ Fixed rank2025/rankDisplay2025 for ${fixed} schools in law-schools.json`);
