#!/usr/bin/env node
/**
 * patch-master-rankings.js
 *
 * Copies the updated ranking fields from law-schools.json into master.json.
 * Fields copied per school (matched by slug):
 *   rank, rank2025, rankDisplay, rankDisplay2025, rankTied, tier
 *
 * Run after update-2026-rankings.js.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const SRC_LS    = path.join(ROOT, 'data', 'law-schools.json');
const SRC_MASTER = path.join(ROOT, 'data', 'master.json');

const schools = JSON.parse(fs.readFileSync(SRC_LS, 'utf8'));
const master  = JSON.parse(fs.readFileSync(SRC_MASTER, 'utf8'));

// Build slug → law-schools entry
const bySlug = Object.fromEntries(schools.map(s => [s.slug, s]));

let updated = 0;
let missing = 0;

for (const [slug, school] of Object.entries(master.schools || {})) {
  const src = bySlug[slug];
  if (!src) {
    console.warn(`  [MISSING] slug "${slug}" in master.json has no match in law-schools.json`);
    missing++;
    continue;
  }

  school.rank            = src.rank;
  school.rank2025        = src.rank2025 != null ? src.rank2025 : null;
  school.rankDisplay     = src.rankDisplay  || null;
  school.rankDisplay2025 = src.rankDisplay2025 || null;
  school.rankTied        = src.rankTied || false;
  school.tier            = src.tier;

  updated++;
}

// Stamp generation date
if (master.meta) {
  master.meta.generatedAt     = new Date().toISOString().slice(0, 10);
  master.meta.rankingsUpdated = '2026';
}

fs.writeFileSync(SRC_MASTER, JSON.stringify(master, null, 2), 'utf8');

console.log(`✓ Patched ${updated} schools in master.json`);
if (missing > 0) console.warn(`⚠  ${missing} slugs in master.json had no match in law-schools.json`);
else console.log('✓ No warnings.');
