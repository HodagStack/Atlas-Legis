#!/usr/bin/env node
/**
 * inject-school-ranks.js
 *
 * Batch-updates all schools/[slug]/index.html pages with a ranking card
 * showing 2026 US News rank and a collapsible 2025 comparison.
 *
 * Idempotent: re-running replaces the existing ranking card block.
 *
 * Run after patch-master-rankings.js.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const glob = require('fs');

const ROOT   = path.join(__dirname, '..');
const LS     = path.join(ROOT, 'data', 'law-schools.json');
const SCHOOL_DIR = path.join(ROOT, 'schools');

const schools = JSON.parse(fs.readFileSync(LS, 'utf8'));
const bySlug  = Object.fromEntries(schools.map(s => [s.slug, s]));

// ─── CSS to inject (once per page, before </style>) ──────────────────────────
const RANKING_CSS = `
    /* ── Ranking card comparison ────────────────────────────────── */
    .rank-compare { margin-top: 10px; border-top: 1px solid var(--border-2); padding-top: 8px; }
    .rank-compare summary {
      font-size: .78rem; font-weight: 600; color: var(--muted);
      cursor: pointer; user-select: none; letter-spacing: .02em;
      list-style: none; display: flex; align-items: center; gap: 6px;
    }
    .rank-compare summary::-webkit-details-marker { display: none; }
    .rank-compare summary::after {
      content: '▸'; font-size: .65rem; transition: transform .18s;
    }
    .rank-compare[open] summary::after { transform: rotate(90deg); }
    .rank-up   { color: #059669; font-weight: 700; }
    .rank-down { color: #dc2626; font-weight: 700; }
    .rank-same { color: var(--muted); }`;

// ─── Card template ────────────────────────────────────────────────────────────
const CARD_START = '<!-- RANKING-CARD-START (auto-generated 2026) -->';
const CARD_END   = '<!-- RANKING-CARD-END -->';

function changeClass(rank2026, rank2025) {
  if (rank2025 == null || rank2025 >= 9999) return 'rank-same';
  if (rank2026 < rank2025) return 'rank-up';
  if (rank2026 > rank2025) return 'rank-down';
  return 'rank-same';
}

function changeText(rank2026, rank2025) {
  if (rank2025 == null) return 'New to rankings';
  if (rank2025 >= 9999 && rank2026 < 9999) return 'Newly ranked';
  if (rank2026 >= 9999) return 'No longer ranked';
  const diff = rank2025 - rank2026; // positive = improved (moved up)
  if (diff === 0) return 'No change';
  if (diff > 0) return `↑${diff} spot${diff !== 1 ? 's' : ''}`;
  return `↓${Math.abs(diff)} spot${Math.abs(diff) !== 1 ? 's' : ''}`;
}

function buildCard(s) {
  const display26 = s.rankDisplay || (s.rank < 9999 ? `#${s.rank}` : 'Unranked');
  const display25 = s.rankDisplay2025 || (s.rank2025 != null && s.rank2025 < 9999 ? `#${s.rank2025}` : null);
  const cls  = changeClass(s.rank, s.rank2025);
  const text = changeText(s.rank, s.rank2025);

  const comparisonRows = display25
    ? `
            <div class="info-rows" style="margin-top:6px">
              <div class="info-row">
                <span class="info-lbl">2025 Rank</span>
                <span class="info-val">${display25}</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">Change</span>
                <span class="info-val ${cls}">${text}</span>
              </div>
            </div>`
    : `
            <div style="margin-top:6px;font-size:.8rem;color:var(--muted)">Previously unranked.</div>`;

  return `${CARD_START}
      <article class="card" aria-labelledby="ranking-h">
        <div class="card-head">
          <h2 id="ranking-h">U.S. News Ranking</h2>
          <span class="card-note">2026</span>
        </div>
        <div class="card-body">
          <div class="info-rows">
            <div class="info-row">
              <span class="info-lbl">Overall Rank</span>
              <span class="info-val">${display26}</span>
            </div>
          </div>
          <details class="rank-compare">
            <summary>Compare to 2025</summary>${comparisonRows}
          </details>
        </div>
      </article>
      ${CARD_END}`;
}

// ─── Inject CSS into a page ───────────────────────────────────────────────────
const CSS_MARKER = '/* ── Ranking card comparison';

function injectCss(html) {
  if (html.includes(CSS_MARKER)) return html; // already injected
  return html.replace('  </style>', RANKING_CSS + '\n  </style>');
}

// ─── Inject card into a page ──────────────────────────────────────────────────
// Injection point: before the data-note card, inside <aside class="side">
// Pattern to find: the plain <div class="card"> that wraps the data-note

function injectCard(html, cardHtml) {
  // Remove existing card block if present (idempotency)
  if (html.includes(CARD_START)) {
    const startIdx = html.indexOf(CARD_START);
    const endIdx   = html.indexOf(CARD_END, startIdx) + CARD_END.length;
    html = html.slice(0, startIdx) + html.slice(endIdx);
  }

  // Find the data-note card (the plain <div class="card"> containing data-note)
  const dataNoteCardPattern = /(\n      <div class="card">\n        <div class="card-body">\n          <p class="data-note")/;
  if (dataNoteCardPattern.test(html)) {
    return html.replace(dataNoteCardPattern, '\n      ' + cardHtml + '\n\n      <div class="card">\n        <div class="card-body">\n          <p class="data-note"');
  }

  // Fallback: inject before </aside>
  return html.replace('    </aside>', '      ' + cardHtml + '\n\n    </aside>');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Collect all school page files
const schoolPages = fs.readdirSync(SCHOOL_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => ({
    slug: e.name,
    file: path.join(SCHOOL_DIR, e.name, 'index.html'),
  }))
  .filter(({ file }) => fs.existsSync(file));

let updated = 0;
let skipped = 0;
const warnings = [];

for (const { slug, file } of schoolPages) {
  const school = bySlug[slug];
  if (!school) {
    warnings.push(`  [NO DATA] ${slug} — not found in law-schools.json`);
    skipped++;
    continue;
  }

  if (school.rank == null && school.rank2025 == null) {
    warnings.push(`  [SKIP]    ${slug} — no rank data (not in US News)`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(file, 'utf8');
  html = injectCss(html);
  html = injectCard(html, buildCard(school));
  fs.writeFileSync(file, html, 'utf8');
  updated++;
}

console.log(`✓ Updated ${updated} school pages`);
if (skipped > 0) console.log(`  Skipped: ${skipped}`);
if (warnings.length) {
  console.log(`\n⚠  Warnings:`);
  warnings.forEach(w => console.log(w));
}
