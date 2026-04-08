#!/usr/bin/env node
/**
 * update-2026-rankings.js
 *
 * Merges the 2026 US News law school rankings into data/law-schools.json.
 *
 * For each school:
 *   - rank2025      ← old rank (preserved for comparison)
 *   - rank          ← new 2026 numeric rank (sortable integer; lower bound for ranges, 9999 for Unranked)
 *   - rankDisplay   ← human-readable 2026 display string ("T#7", "#15", "175–194", "Unranked")
 *   - rankDisplay2025 ← human-readable 2025 display ("#18") or null
 *   - rankTied      ← true if 2026 rank is tied, else false
 *   - tier          ← recalculated from new rank
 *
 * Matching is done via a hardcoded USN_ID_TO_SLUG map (most reliable).
 * Schools in the 2026 file that are not in law-schools.json are warned about.
 * Schools in law-schools.json that have no 2026 ranking are left unchanged except
 * that their rank2025 is preserved and rank is set to 9999 (unranked).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const SRC_26  = path.join(ROOT, 'data', 'usnews_law_rankings_2026.json');
const SRC_LS  = path.join(ROOT, 'data', 'law-schools.json');

// ─── Hardcoded USN ID → slug map ─────────────────────────────────────────────
// Every entry in usnews_law_rankings_2026.json mapped to its law-schools.json slug.
const USN_ID_TO_SLUG = {
  '03014': 'stanford-law-school',
  '03052': 'university-of-chicago-law-school',
  '03027': 'yale-law-school',
  '03140': 'penn-carey-law',
  '03162': 'university-of-virginia-school-of-law',
  '03074': 'harvard-law-school',
  '03117': 'duke-university-school-of-law',
  '03110': 'nyu-school-of-law',
  '03104': 'columbia-law-school',
  '03050': 'northwestern-pritzker-school-of-law',
  '03082': 'university-of-michigan-law-school',
  '03147': 'vanderbilt-university-law-school',
  '03105': 'cornell-law-school',
  '03018': 'ucla-school-of-law',
  '03092': 'washington-university-in-st-louis-school-of-law',
  '03016': 'uc-berkeley-school-of-law',
  '03155': 'university-of-texas-school-of-law',
  '03032': 'georgetown-university-law-center',
  '03119': 'university-of-north-carolina-school-of-law',
  '03072': 'boston-college-law-school',
  '03056': 'university-of-notre-dame-law-school',
  '03179': 'texas-a-m-university-school-of-law',
  '03085': 'university-of-minnesota-law-school',
  '03073': 'boston-university-school-of-law',
  '03156': 'byu-j-reuben-clark-law-school',
  '03031': 'george-washington-university-law-school',
  '03042': 'university-of-georgia-school-of-law',
  '03021': 'usc-gould-school-of-law',
  '03170': 'university-of-wisconsin-law-school',
  '03126': 'ohio-state-university-moritz-college-of-law',
  '03120': 'wake-forest-university-school-of-law',
  '03159': 'george-mason-antonin-scalia-law-school',
  '03059': 'university-of-iowa-college-of-law',
  '03148': 'baylor-law-school',
  '03034': 'florida-state-university-college-of-law',
  '03201': 'uc-irvine-school-of-law',
  '03037': 'university-of-florida-levin-college-of-law',
  '03163': 'washington-and-lee-university-school-of-law',
  '03160': 'william-mary-law-school',
  '03039': 'emory-university-school-of-law',
  '03001': 'university-of-alabama-school-of-law',
  '03107': 'fordham-university-school-of-law',
  '03150': 'smu-dedman-school-of-law',
  '03003': 'arizona-state-sandra-day-oconnor-college-of-law',
  '03157': 'university-of-utah-s-j-quinney-college-of-law',
  '03011': 'pepperdine-caruso-school-of-law',
  '03053': 'university-of-illinois-college-of-law',
  '03060': 'university-of-kansas-school-of-law',
  '03054': 'indiana-university-maurer-school-of-law',
  '03139': 'temple-university-beasley-school-of-law',
  '03142': 'villanova-university-widger-school-of-law',
  '03017': 'uc-davis-school-of-law',
  '03167': 'university-of-washington-school-of-law',
  '03023': 'university-of-colorado-law-school',
  '03154': 'university-of-houston-law-center',
  '03019': 'university-of-san-diego-school-of-law',
  '03146': 'university-of-tennessee-college-of-law',
  '03026': 'university-of-connecticut-school-of-law',
  '03169': 'marquette-university-law-school',
  '03091': 'university-of-missouri-school-of-law',
  '03103': 'cardozo-school-of-law',
  '03207': 'penn-state-dickinson-law',
  '03112': 'st-johns-university-school-of-law',
  '03132': 'university-of-oklahoma-college-of-law',
  '03071': 'university-of-maryland-carey-school-of-law',
  '03095': 'university-of-nebraska-college-of-law',
  '03161': 'university-of-richmond-school-of-law',
  '03143': 'university-of-south-carolina-school-of-law',
  '03083': 'wayne-state-university-law-school',
  '03009': 'loyola-law-school-los-angeles',
  '03099': 'seton-hall-university-school-of-law',
  '03030': 'catholic-university-of-america-columbus-school-of-law',
  '03068': 'tulane-university-law-school',
  '03004': 'university-of-arizona-james-e-rogers-college-of-law',
  '03063': 'university-of-kentucky-college-of-law',
  '03038': 'university-of-miami-school-of-law',
  '03190': 'florida-international-university-college-of-law',
  '03040': 'georgia-state-university-college-of-law',
  '03048': 'loyola-university-chicago-school-of-law',
  '03076': 'northeastern-university-school-of-law',
  '03141': 'university-of-pittsburgh-school-of-law',
  '03199': 'drexel-university-kline-school-of-law',
  '03113': 'university-at-buffalo-school-of-law',
  '03128': 'university-of-cincinnati-college-of-law',
  '03203': 'belmont-university-college-of-law',
  '03138': 'duquesne-university-school-of-law',
  '03065': 'lsu-paul-m-hebert-law-center',
  '03153': 'texas-tech-university-school-of-law',
  '03015': 'uc-college-of-the-law-san-francisco',
  '03093': 'university-of-montana-school-of-law',
  '03058': 'drake-university-law-school',
  '03172': 'regent-university-school-of-law',
  '03089': 'saint-louis-university-school-of-law',
  '03036': 'stetson-university-college-of-law',
  '03024': 'university-of-denver-sturm-college-of-law',
  '03043': 'university-of-hawaii-richardson-school-of-law',
  '03069': 'university-of-maine-school-of-law',
  '03185': 'unlv-william-s-boyd-school-of-law',
  '03135': 'university-of-oregon-school-of-law',
  '03123': 'case-western-reserve-university-school-of-law',
  '03209': 'rutgers-law-school',
  '03114': 'syracuse-university-college-of-law',
  '03005': 'university-of-arkansas-school-of-law',
  '03090': 'university-of-missouri-kansas-city-school-of-law',
  '03102': 'brooklyn-law-school',
  '03046': 'chicago-kent-college-of-law-iit',
  '03191': 'university-of-st-thomas-school-of-law',
  '03029': 'american-university-washington-college-of-law',
  '03041': 'mercer-university-walter-f-george-school-of-law',
  '03079': 'michigan-state-university-college-of-law',
  '03061': 'washburn-university-school-of-law',
  '03182': 'chapman-university-fowler-school-of-law',
  '03134': 'lewis-clark-law-school',
  '03109': 'new-york-law-school',
  '03129': 'university-of-dayton-school-of-law',
  '03171': 'university-of-wyoming-college-of-law',
  '03108': 'hofstra-university-deane-school-of-law',
  '03033': 'howard-university-school-of-law',
  '03100': 'university-of-new-mexico-school-of-law',
  '03101': 'albany-law-school',
  '03133': 'university-of-tulsa-college-of-law',
  '03002': 'samford-university-cumberland-school-of-law',
  '03144': 'university-of-south-dakota-school-of-law',
  '03055': 'indiana-university-mckinney-school-of-law',
  '03064': 'university-of-louisville-brandeis-school-of-law',
  '03088': 'university-of-mississippi-school-of-law',
  '03168': 'west-virginia-university-college-of-law',
  '03166': 'seattle-university-school-of-law',
  '03149': 'south-texas-college-of-law-houston',
  '03077': 'suffolk-university-law-school',
  '03116': 'campbell-university-norman-adrian-wiggins-school-of-law',
  '03045': 'depaul-university-college-of-law',
  '03062': 'northern-kentucky-university-chase-college-of-law',
  '03127': 'university-of-akron-school-of-law',
  '03066': 'loyola-university-new-orleans-college-of-law',
  '03124': 'cleveland-state-university-college-of-law',
  '03025': 'quinnipiac-university-school-of-law',
  '03070': 'university-of-baltimore-school-of-law',
  '03096': 'university-of-new-hampshire-franklin-pierce-school-of-law',
  '03006': 'ua-little-rock-bowen-school-of-law',
  '03145': 'university-of-memphis-humphreys-school-of-law',
  '03111': 'pace-university-elisabeth-haub-school-of-law',
  '03081': 'university-of-detroit-mercy-school-of-law',
  '03094': 'creighton-university-school-of-law',
  '03200': 'elon-university-school-of-law',
  '03165': 'gonzaga-university-school-of-law',
  '03196': 'liberty-university-school-of-law',
  '03044': 'university-of-idaho-college-of-law',
  '03130': 'university-of-toledo-college-of-law',
  '03012': 'santa-clara-university-school-of-law',
  '03151': 'st-marys-university-school-of-law',
  '03212': 'mitchell-hamline-school-of-law',
  '03010': 'university-of-the-pacific-mcgeorge-school-of-law',
  '03158': 'vermont-law-school',
  '03210': 'widener-university-delaware-law-school',
  '03131': 'oklahoma-city-university-school-of-law',
  '03121': 'university-of-north-dakota-school-of-law',
  '03020': 'university-of-san-francisco-school-of-law',
  '03213': 'university-of-north-texas-dallas-college-of-law',
  '03078': 'western-new-england-university-school-of-law',
  '03087': 'mississippi-college-school-of-law',
  '03049': 'northern-illinois-university-college-of-law',
  '03013': 'southwestern-law-school',
  '03188': 'ave-maria-school-of-law',
  '03195': 'faulkner-university-thomas-goode-jones-school-of-law',
  '03115': 'touro-university-jacob-d-fuchsberg-law-center',
  '03678': 'university-of-illinois-chicago-school-of-law',
  '03075': 'new-england-law-boston',
  '03173': 'st-thomas-university-school-of-law',
  '03136': 'willamette-university-college-of-law',
  '03194': 'charleston-school-of-law',
  '03106': 'cuny-school-of-law',
  '03180': 'roger-williams-university-school-of-law',
  '03202': 'university-of-massachusetts-school-of-law',
  '03187': 'appalachian-school-of-law',
  '03192': 'atlantas-john-marshall-law-school',
  '03186': 'barry-university-dwayne-o-andreas-school-of-law',
  '03007': 'california-western-school-of-law',
  '03122': 'capital-university-law-school',
  '03080': 'thomas-m-cooley-law-school',
  '03189': 'florida-a-m-university-college-of-law',
  '03176': 'inter-american-university-of-puerto-rico-school-of-law',
  '03204': 'lincoln-memorial-university-duncan-school-of-law',
  '03118': 'north-carolina-central-university-school-of-law',
  '03035': 'nova-southeastern-university-shepard-broad-college-of-law',
  '03125': 'ohio-northern-university-pettit-college-of-law',
  '03175': 'pontifical-catholic-university-of-puerto-rico-school-of-law',
  '03051': 'southern-illinois-university-school-of-law',
  '03067': 'southern-university-law-center',
  '03152': 'texas-southern-university-thurgood-marshall-school-of-law',
  '03177': 'university-of-puerto-rico-school-of-law',
  '03178': 'university-of-the-district-of-columbia-david-a-clarke-school-of-law',
  '03183': 'western-state-college-of-law-at-westcliff-university',
  '03206': 'widener-university-commonwealth-law-school',
  // Unranked
  '03778': 'jacksonville-university-school-of-law',
  '03713': 'wilmington-university-school-of-law',
  // '03008': golden-gate-university — not in law-schools.json, skip
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a rank string from the 2026 file.
 * Returns { numeric, display, tied }.
 */
function parseRank(rankStr, isTied) {
  if (!rankStr || rankStr === 'Unranked') {
    return { numeric: 9999, display: 'Unranked', tied: false };
  }
  if (rankStr.includes('-')) {
    // Range like "175-194"
    const [lo] = rankStr.split('-');
    return { numeric: parseInt(lo, 10), display: rankStr.replace('-', '–'), tied: false };
  }
  const n = parseInt(rankStr, 10);
  const display = `#${n}`;
  return { numeric: n, display, tied: !!isTied };
}

/**
 * Calculate tier from numeric rank.
 * T14 threshold is 13: the 15 schools ranked 1-13 form the new T14.
 * Berkeley (#16) and Texas (#16) are tier2; Georgetown (#18) is tier2.
 */
function calcTier(numericRank) {
  if (numericRank <= 13)    return 't14';
  if (numericRank <= 50)    return 'tier2';
  return 'tier3';
}

/**
 * Format an old integer rank as a display string.
 */
function formatOldRank(rank) {
  if (rank == null) return null;
  if (rank >= 9999) return 'Unranked';
  return `#${rank}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const rankings26 = JSON.parse(fs.readFileSync(SRC_26, 'utf8'));
const schools    = JSON.parse(fs.readFileSync(SRC_LS, 'utf8'));

// Build slug → school index
const bySlug = Object.fromEntries(schools.map(s => [s.slug, s]));

// Build a set of slugs that got updated so we can report unmatched
const updatedSlugs = new Set();
const warned = [];

for (const entry of rankings26) {
  const slug = USN_ID_TO_SLUG[entry.usn_id];

  if (!slug) {
    warned.push(`  [SKIP]    USN ${entry.usn_id} "${entry.name}" — not in USN_ID_TO_SLUG map`);
    continue;
  }

  const school = bySlug[slug];
  if (!school) {
    warned.push(`  [MISSING] USN ${entry.usn_id} "${entry.name}" → slug "${slug}" not found in law-schools.json`);
    continue;
  }

  const { numeric, display, tied } = parseRank(entry.rank, entry.is_tied);

  // Preserve old rank — only set on first run; do NOT overwrite on re-runs
  if (school.rank2025 === undefined) {
    school.rank2025        = school.rank != null ? school.rank : null;
    school.rankDisplay2025 = formatOldRank(school.rank);
  }

  // Apply 2026 rank
  school.rank        = numeric;
  school.rankDisplay = display;
  school.rankTied    = tied;

  // Recalculate tier
  school.tier = calcTier(numeric);

  updatedSlugs.add(slug);
}

// For schools NOT in the 2026 file: preserve rank2025, mark rank as 9999 (unranked)
// ONLY if they previously had a rank. Schools already at null stay null.
for (const school of schools) {
  if (!updatedSlugs.has(school.slug)) {
    if (school.rank != null && school.rank2025 === undefined) {
      // Had a rank before but dropped off rankings entirely
      school.rank2025        = school.rank;
      school.rankDisplay2025 = formatOldRank(school.rank);
      school.rank            = 9999;
      school.rankDisplay     = 'Unranked';
      school.rankTied        = false;
      school.tier            = 'tier3';
      warned.push(`  [DROPPED] "${school.name}" was #${school.rank2025} but has no 2026 ranking`);
    } else if (school.rank2025 === undefined) {
      // No previous rank and no 2026 rank — leave as-is but fill in fields
      school.rank2025        = null;
      school.rankDisplay2025 = null;
      school.rankTied        = school.rankTied || false;
      if (!school.rankDisplay) school.rankDisplay = school.rank != null && school.rank < 9999
        ? `#${school.rank}` : 'Unranked';
    }
  }
}

// Write output
fs.writeFileSync(SRC_LS, JSON.stringify(schools, null, 2), 'utf8');

// Report
console.log(`✓ Updated ${updatedSlugs.size} schools in law-schools.json`);
console.log(`  Total schools in file: ${schools.length}`);

if (warned.length) {
  console.log(`\n⚠  Warnings (${warned.length}):`);
  warned.forEach(w => console.log(w));
} else {
  console.log('\n✓ No warnings — all 2026 entries matched.');
}
