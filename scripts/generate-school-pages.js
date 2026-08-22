#!/usr/bin/env node
/**
 * generate-school-pages.js
 *
 * Rewrites every schools/<slug>/index.html into the new dashboard-style
 * template (sidebar nav, KPI cards, admissions trend chart, insights,
 * range bars, ranked bar charts for employment/scholarships, bar-passage
 * comparison, compact rankings widget) while extracting all real data
 * straight out of the CURRENT live page for that school (source of truth,
 * since it reflects manual corrections that postdate /data/*.json).
 *
 * SEO-critical head elements (title, meta description, canonical,
 * JSON-LD breadcrumb, Google tag) are preserved verbatim per school.
 *
 * Usage:
 *   node scripts/generate-school-pages.js --dry-run   # extract + validate only
 *   node scripts/generate-school-pages.js             # write files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCHOOLS_DIR = path.join(ROOT, 'schools');
const DRY_RUN = process.argv.includes('--dry-run');

// ── small helpers ──────────────────────────────────────────────────────────

function slice(html, startMarker, endMarkers) {
  const s = html.indexOf(startMarker);
  if (s === -1) return null;
  let e = html.length;
  for (const m of endMarkers) {
    const idx = html.indexOf(m, s + startMarker.length);
    if (idx !== -1 && idx < e) e = idx;
  }
  return html.slice(s, e);
}

function matchAll(re, str) {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(str)) !== null) out.push(m);
  return out;
}

function num(s) {
  if (s == null) return null;
  const cleaned = String(s).replace(/<[^>]*>/g, '').replace(/,/g, '').trim();
  const v = parseFloat(cleaned);
  return Number.isNaN(v) ? null : v;
}

function pairs(sectionHtml, lblClass, valClass) {
  if (!sectionHtml) return {};
  const re = new RegExp(
    `class="${lblClass}"[^>]*>([^<]*)<\\/(?:div|span)>\\s*<[a-z]+ class="${valClass}"[^>]*>([\\s\\S]*?)<\\/(?:div|span)>`,
    'g'
  );
  const out = {};
  let m;
  while ((m = re.exec(sectionHtml)) !== null) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

// ── extraction ──────────────────────────────────────────────────────────────

function extract(html, slug) {
  const d = { slug };

  // Head: keep verbatim
  const headStart = html.indexOf('<meta charset');
  const headEnd = html.indexOf('</title>') + '</title>'.length;
  d.headBlock = html.slice(headStart, headEnd);
  const gtagStart = html.indexOf('<script async src="https://www.googletagmanager.com');
  d.gtagBlock = gtagStart !== -1 ? html.slice(gtagStart, headStart) : '';
  const ldStart = html.indexOf('<script type="application/ld+json">');
  const ldEndMarker = '</script>';
  const ldEnd = ldStart !== -1 ? html.indexOf(ldEndMarker, ldStart) + ldEndMarker.length : -1;
  d.jsonLd = ldStart !== -1 ? html.slice(ldStart, ldEnd) : '';

  // Name / location
  const nameM = html.match(/<h1>([^<]+)<\/h1>/);
  d.name = nameM ? nameM[1].trim() : null;
  const locM = html.match(/aria-label="Location: ([^"]+)"/);
  d.location = locM ? locM[1].trim() : null;

  // Hero stats bar (fallback source only)
  const statsSec = slice(html, '<div class="stats-bar"', ['</header>']);
  const heroStats = pairs(statsSec, 'stat-lbl', 'stat-val');

  // Admissions Profile
  const admStart = html.indexOf('<!-- ── Admissions');
  const admSec = slice(html, '<!-- ── Admissions', ['<!-- MEDIANS-TREND-START', '<!-- ── Employment']);
  const admNote = admSec ? (admSec.match(/<span class="card-note">([^<]*)<\/span>/) || [])[1] : null;
  const pctVals = admSec ? matchAll(/pct-item-val">([\d.]+)<\/span>/g, admSec).map(m => num(m[1])) : [];
  d.admissionsNote = admNote || 'Entering class';
  d.lsat = { p75: pctVals[0], p50: pctVals[1], p25: pctVals[2] };
  d.gpa = { p75: pctVals[3], p50: pctVals[4], p25: pctVals[5] };

  // Medians trend (may be absent)
  const medM = html.match(/window\.SCHOOL_MEDIANS=(\{[\s\S]*?\});/);
  d.medians = medM ? JSON.parse(medM[1]) : null;

  // Employment
  const empSec = slice(html, '<!-- ── Employment', ['<!-- ── Scholarships']);
  const empNote = empSec ? (empSec.match(/<span class="card-note">([^<]*)<\/span>/) || [])[1] : null;
  d.empClassNote = empNote || null;
  const empHeroNum = empSec ? empSec.match(/class="emp-hero"[\s\S]*?emp-num">([\d.]+)/) : null;
  d.barRequiredPct = empHeroNum ? num(empHeroNum[1]) : (heroStats['Bar-Required Jobs'] != null ? num(heroStats['Bar-Required Jobs']) : null);
  const empCells = empSec
    ? matchAll(/<div class="emp-cell"[^>]*>\s*<div class="emp-lbl">([^<]+)<\/div>\s*<div class="emp-num"[^>]*>(-?[\d.]+)(?:<span>%<\/span>)?<\/div>/g, empSec)
    : [];
  d.employment = empCells.map(m => ({ label: m[1].trim(), value: num(m[2]) }));

  // Bar passage (may be absent)
  const bpSec = slice(html, '<!-- ++ Bar Passage', ['<section aria-labelledby="scholarships-h">']);
  if (bpSec && bpSec.includes('class="emp-hero"')) {
    const bpNote = bpSec.match(/<span class="card-note">([^<]*)<\/span>/);
    const bpBadge = bpSec.match(/class="emp-badge"[^>]*>([^<]*)<\/div>/);
    const bpRate = bpSec.match(/class="emp-hero"[\s\S]*?emp-num">([\d.]+)/);
    const bpCells = matchAll(/<div class="emp-cell">\s*<div class="emp-lbl">([^<]+)<\/div>\s*<div class="emp-num"[^>]*>(-?[\d.]+)/g, bpSec);
    const cellMap = {};
    bpCells.forEach(m => { cellMap[m[1].trim()] = num(m[2]); });
    d.barPassage = {
      note: bpNote ? bpNote[1] : null,
      badge: bpBadge ? bpBadge[1] : null,
      rate: bpRate ? num(bpRate[1]) : null,
      abaAvg: cellMap['ABA Avg (Weighted)'] != null ? cellMap['ABA Avg (Weighted)'] : null,
      vsAba: cellMap['vs. ABA Avg'] != null ? cellMap['vs. ABA Avg'] : null,
      takers: cellMap['First-Time Takers'] != null ? cellMap['First-Time Takers'] : null,
    };
  } else {
    d.barPassage = null;
  }

  // Scholarships
  const scholSec = slice(html, '<section aria-labelledby="scholarships-h">', ['<!-- Sidebar', '</main>']);
  const scholRows = scholSec ? slice(scholSec, '<div class="schol-rows"', ['</section>']) : null;
  const scholVals = scholRows ? matchAll(/schol-val">(\d+)<\/span>/g, scholRows).map(m => num(m[1])) : [];
  d.scholarship = {
    none: scholVals[0] ?? null,
    less: scholVals[1] ?? null,
    half: scholVals[2] ?? null,
    full: scholVals[3] ?? null,
    stipend: scholVals[4] ?? null,
  };

  // Sidebar: tuition + at-a-glance
  const tuitionSec = slice(html, 'id="tuition-h"', ['id="glance-h"']);
  const tuitionMap = pairs(tuitionSec, 'info-lbl', 'info-val');
  if (tuitionMap['Annual Tuition']) {
    d.tuition = tuitionMap['Annual Tuition'];
  } else if (tuitionMap['In-State Tuition'] || tuitionMap['Out-of-State Tuition']) {
    const parts = [];
    if (tuitionMap['In-State Tuition']) parts.push(`${tuitionMap['In-State Tuition']} in-state`);
    if (tuitionMap['Out-of-State Tuition']) parts.push(`${tuitionMap['Out-of-State Tuition']} out-of-state`);
    d.tuition = parts.join(' / ');
    d.tuitionSplit = { inState: tuitionMap['In-State Tuition'] || null, outState: tuitionMap['Out-of-State Tuition'] || null };
  } else {
    d.tuition = null;
  }
  d.classSize = tuitionMap['1L Class Size'] ? num(tuitionMap['1L Class Size']) : (heroStats['1L Class Size'] ? num(heroStats['1L Class Size']) : null);
  if (!d.location) d.location = tuitionMap['Location'] || null;

  const glanceSec = slice(html, 'id="glance-h"', ['<!-- RANKING-CARD-START', '<p class="data-note"', '</aside>']);
  const glanceMap = pairs(glanceSec, 'info-lbl', 'info-val');
  d.appDeadline = glanceMap['Application Deadline'] || null;
  d.appFee = glanceMap['Application Fee'] || null;

  // Ranking card (may be absent)
  const rankSec = slice(html, '<!-- RANKING-CARD-START', ['<!-- RANKING-CARD-END']);
  if (rankSec) {
    const rankNote = rankSec.match(/<span class="card-note">([^<]*)<\/span>/);
    const overall = rankSec.match(/info-lbl">Overall Rank<\/span>\s*<span class="info-val">([^<]*)<\/span>/);
    const prevRank = rankSec.match(/info-lbl">2025 Rank<\/span>\s*<span class="info-val">([^<]*)<\/span>/);
    const change = rankSec.match(/class="info-val (rank-up|rank-down|rank-same)">([^<]*)<\/span>/);
    d.ranking = {
      year: rankNote ? rankNote[1] : null,
      overall: overall ? overall[1].trim() : null,
      prevYear: prevRank ? prevRank[1].trim() : null,
      changeClass: change ? change[1] : null,
      changeText: change ? change[2].trim() : null,
    };
  } else {
    d.ranking = null;
  }

  // PDF report
  const pdfPath = path.join(ROOT, 'reports', `${slug}.pdf`);
  d.pdfHref = fs.existsSync(pdfPath) ? `https://atlaslegis.com/reports/${slug}.pdf` : null;

  // Validate required fields — these must exist for the page to be worth regenerating
  const required = ['name', 'location', 'classSize', 'tuition'];
  for (const f of required) {
    if (d[f] == null) throw new Error(`missing required field "${f}"`);
  }
  if (d.lsat.p50 == null || d.gpa.p50 == null) throw new Error('missing admissions percentiles');

  // Employment breakdown is optional (a few very new schools report none yet)
  if (d.employment.length === 0) d.barRequiredPct = null;

  return d;
}

// ── derived / computed values ────────────────────────────────────────────

const SUBSET_OF = {
  'BigLaw (251+ atty)': 'Any Law Firm',
  'Federal Clerkship': 'All Clerkships',
};

function deriveEmploymentBars(employment) {
  const subsetVal = {};
  const main = [];
  employment.forEach(e => {
    if (SUBSET_OF[e.label]) subsetVal[SUBSET_OF[e.label]] = e.value;
    else main.push(e);
  });
  main.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return main.map(e => ({ ...e, sub: subsetVal[e.label] ?? null }));
}

function deriveScholarshipRows(s) {
  const tiers = [
    { key: 'none', label: 'No scholarship', color: '#cbd5e1' },
    { key: 'less', label: 'Less than ½ tuition', color: 'var(--em-200)' },
    { key: 'half', label: 'Half to full tuition', color: 'var(--em-400)' },
    { key: 'full', label: 'Full tuition', color: 'var(--em-600)' },
    { key: 'stipend', label: 'More than full tuition', color: 'var(--em-800)' },
  ];
  const total = tiers.reduce((sum, t) => sum + (s[t.key] || 0), 0);
  return {
    total,
    rows: tiers.map(t => ({
      ...t,
      count: s[t.key] || 0,
      pct: total > 0 ? (100 * (s[t.key] || 0) / total) : 0,
    })),
  };
}

function niceLsatDomain(p25, p75) {
  let lo = Math.floor((p25 - 8) / 5) * 5;
  let hi = Math.ceil((p75 + 8) / 5) * 5;
  lo = Math.max(120, lo);
  hi = Math.min(180, hi);
  if (hi - lo < 15) hi = lo + 15;
  return [lo, hi];
}

function niceGpaDomain(p25, p75) {
  let lo = Math.max(2.0, Math.floor((p25 - 0.35) * 10) / 10);
  let hi = Math.min(4.0, Math.ceil((p75 + 0.25) * 10) / 10);
  if (hi - lo < 0.6) hi = Math.min(4.0, lo + 0.6);
  return [lo, hi];
}

function pctPos(v, lo, hi) {
  return Math.max(0, Math.min(100, (100 * (v - lo)) / (hi - lo)));
}

function chartGeometry(values, { width, height, padL, padR, padT, padB, niceStep, decimals }) {
  const dataMin = Math.min(...values), dataMax = Math.max(...values);
  const span = Math.max(dataMax - dataMin, niceStep * 2);
  const pad = Math.max(span * 0.25, niceStep);
  let domMin = Math.floor((dataMin - pad) / niceStep) * niceStep;
  let domMax = Math.ceil((dataMax + pad) / niceStep) * niceStep;
  if (domMax === domMin) domMax = domMin + niceStep * 4;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const n = values.length;
  const x = i => padL + (n > 1 ? i * (plotW / (n - 1)) : plotW / 2);
  const y = v => padT + ((domMax - v) / (domMax - domMin)) * plotH;
  const gridVals = [0, 1, 2, 3].map(k => domMax - (k * (domMax - domMin)) / 3);
  return { domMin, domMax, x, y, plotW, plotH, padT, padB, gridVals, width, height };
}

function buildTrendChart(years, values) {
  const g = chartGeometry(values, { width: 640, height: 220, padL: 40, padR: 16, padT: 16, padB: 28, niceStep: 2, decimals: 0 });
  const pts = values.map((v, i) => ({ x: g.x(i), y: g.y(v) }));
  const linePath = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  const baseline = g.y(g.domMin);
  const areaPath = linePath + ` L${pts[pts.length - 1].x.toFixed(1)},${baseline.toFixed(1)} L${pts[0].x.toFixed(1)},${baseline.toFixed(1)} Z`;
  const gridlines = g.gridVals.map(v => ({ y: g.y(v).toFixed(1), label: Math.round(v) }));
  const n = years.length;
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const xLabels = years
    .map((yr, i) => ({ x: g.x(i).toFixed(1), yr, show: i % labelEvery === 0 || i === n - 1 }))
    .filter(l => l.show);
  const dots = pts.map((p, i) => ({ x: p.x.toFixed(1), y: p.y.toFixed(1), last: i === pts.length - 1 }));
  return { linePath, areaPath, gridlines, xLabels, dots, width: g.width, height: g.height };
}

function buildMiniChart(values) {
  const g = chartGeometry(values, { width: 320, height: 140, padL: 14, padR: 14, padT: 12, padB: 22, niceStep: 0.1, decimals: 2 });
  const pts = values.map((v, i) => ({ x: g.x(i), y: g.y(v) }));
  const linePath = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  const dots = pts.map((p, i) => ({ x: p.x.toFixed(1), y: p.y.toFixed(1), last: i === pts.length - 1 }));
  return { linePath, dots, width: g.width, height: g.height, gridTop: (g.padT).toFixed(1), gridBottom: (g.height - g.padB).toFixed(1) };
}

function deltaBadge(current, prior, { decimals = 0, unit = ' pts' } = {}) {
  if (current == null || prior == null) return { cls: 'flat', text: null, sub: null };
  const d = current - prior;
  const dAbs = Math.abs(d).toFixed(decimals);
  if (Math.abs(d) < Math.pow(10, -decimals) / 2) return { cls: 'flat', text: 'No change', sub: `Matches prior year (${prior.toFixed(decimals)})` };
  return {
    cls: d > 0 ? 'up' : 'down',
    text: `${dAbs}${unit}`,
    sub: `vs. prior year (${prior.toFixed(decimals)})`,
  };
}

module.exports = {
  extract, deriveEmploymentBars, deriveScholarshipRows, niceLsatDomain, niceGpaDomain,
  pctPos, buildTrendChart, buildMiniChart, deltaBadge,
};

// ── dry-run driver (rendering + write happens in render-school-pages.js) ───
if (require.main === module) {
  const dirs = fs.readdirSync(SCHOOLS_DIR).filter(f => fs.statSync(path.join(SCHOOLS_DIR, f)).isDirectory());
  let ok = 0, warnRank = 0, warnMedians = 0, warnBar = 0, warnEmp = 0, fail = 0;
  const failures = [];
  for (const slug of dirs) {
    const file = path.join(SCHOOLS_DIR, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    try {
      const d = extract(html, slug);
      ok++;
      if (!d.ranking) warnRank++;
      if (!d.medians) warnMedians++;
      if (!d.barPassage) warnBar++;
      if (d.employment.length === 0) warnEmp++;
    } catch (e) {
      fail++;
      failures.push(`${slug}: ${e.message}`);
    }
  }
  console.log(`Parsed ${ok + fail}/${dirs.length} school dirs — ok=${ok} fail=${fail}`);
  console.log(`Optional-data gaps: no ranking=${warnRank}, no medians=${warnMedians}, no bar passage=${warnBar}, no employment=${warnEmp}`);
  if (failures.length) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(' - ' + f));
  }
}
