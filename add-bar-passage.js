#!/usr/bin/env node
/**
 * add-bar-passage.js
 * Reads First_Time_Bar_Admission_2025.xlsx and merges bar passage data
 * into data/master.json, then writes data/bar_passage.json as a
 * standalone source file for future builds.
 *
 * Run: node add-bar-passage.js
 */

const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR    = path.join(__dirname, 'data');
const XLSX_FILE   = path.join(__dirname, 'First_Time_Bar_Admission_2025.xlsx');
const MASTER_FILE = path.join(DATA_DIR, 'master.json');
const BAR_OUT     = path.join(DATA_DIR, 'bar_passage.json');

// ── Name map: official school name → LSAC-style name ─────────────────────────
// Matches the convention used in scholarship_data.json / build-master-json.js
const SCHOLARSHIP_NAME_MAP = {
  'Stanford Law School':                                     'Stanford University',
  'Yale Law School':                                         'Yale University',
  'University of Chicago Law School':                        'Chicago, The University of',
  'University of Virginia School of Law':                    'Virginia, University of',
  'Penn Carey Law':                                          'Pennsylvania, University of',
  'Duke University School of Law':                           'Duke University',
  'Harvard Law School':                                      'Harvard University',
  'University of Michigan Law School':                       'Michigan, University of',
  'NYU School of Law':                                       'New York University',
  'Columbia Law School':                                     'Columbia University',
  'Northwestern Pritzker School of Law':                     'Northwestern University',
  'UCLA School of Law':                                      'California-Los Angeles, University of',
  'UC Berkeley School of Law':                               'California-Berkeley, University of',
  'Georgetown University Law Center':                        'Georgetown University',
  'University of Texas School of Law':                       'Texas, University of',
  'Vanderbilt University Law School':                        'Vanderbilt University',
  'Washington University in St. Louis School of Law':        'Washington University (St. Louis)',
  'Cornell Law School':                                      'Cornell University',
  'University of North Carolina School of Law':              'North Carolina, University of',
  'University of Minnesota Law School':                      'Minnesota, University of',
  'University of Alabama School of Law':                     'Alabama, The University of',
  'George Mason Antonin Scalia Law School':                  'George Mason University',
  'George Washington University Law School':                 'George Washington University, The',
  'University of Utah S.J. Quinney College of Law':          'Utah, The University of',
  'UC Irvine School of Law':                                 'California-Irvine, University of',
  'University of Florida Levin College of Law':              'Florida, University of',
  'Baylor Law School':                                       'Baylor University',
  'SMU Dedman School of Law':                                'Southern Methodist University',
  "Arizona State Sandra Day O'Connor College of Law":        'Arizona State University',
  'Indiana University Maurer School of Law':                 'Indiana University-Bloomington',
  'Villanova University Widger School of Law':               'Villanova University',
  'UC Davis School of Law':                                  'California-Davis, University of',
  'University of Kansas School of Law':                      'Kansas, The University of',
  'Temple University Beasley School of Law':                 'Temple University',
  'Pepperdine Caruso School of Law':                         'Pepperdine University',
  'University of Arizona James E. Rogers College of Law':    'Arizona, The University of',
  'Cardozo School of Law':                                   'Cardozo, Yeshiva University',
  'University of Maryland Carey School of Law':              'Maryland, University of',
  'Catholic University of America Columbus School of Law':   'Catholic University of America, The',
  'Loyola Law School Los Angeles':                           'Loyola Marymount University-Los Angeles',
  'Drexel University Kline School of Law':                   'Drexel University',
  'UNLV William S. Boyd School of Law':                      'Nevada-Las Vegas, University of',
  'LSU Paul M. Hebert Law Center':                           'Louisiana State University',
  'University of Denver Sturm College of Law':               'Denver, University of',
  'University at Buffalo School of Law':                     'Buffalo, University at',
  'University of St. Thomas School of Law':                  'St. Thomas, (Minneapolis) University of',
  'University of Hawaii Richardson School of Law':           'Hawaii, University of',
  'American University Washington College of Law':           'American University',
  'Chapman University Fowler School of Law':                 'Chapman University',
  'Rutgers Law School':                                      'Rutgers University',
  'Chicago-Kent College of Law (IIT)':                       'Chicago-Kent, Illinois Institute of Technology',
  'Indiana University McKinney School of Law':               'Indiana University-Indianapolis',
  'Mercer University Walter F. George School of Law':        'Mercer University',
  'University of New Mexico School of Law':                  'New Mexico, The University of',
  'Samford University Cumberland School of Law':             'Samford University',
  'University of Mississippi School of Law':                 'Mississippi, The University of',
  'Hofstra University Deane School of Law':                  'Hofstra University',
  'University of New Hampshire Franklin Pierce School of Law': 'New Hampshire, University of',
  'University of Akron School of Law':                       'Akron, The University of',
  'University of Tulsa College of Law':                      'Tulsa, The University of',
  'Campbell University Norman Adrian Wiggins School of Law': 'Campbell University',
  'Northern Kentucky University Chase College of Law':       'Northern Kentucky University',
  'UA Little Rock Bowen School of Law':                      'Arkansas at Little Rock, University of',
  'Pace University Elisabeth Haub School of Law':            'Pace University',
  'University of Louisville Brandeis School of Law':         'Louisville, University of',
  'University of Memphis Humphreys School of Law':           'Memphis, The University of',
  'University of Toledo College of Law':                     'Toledo, The University of',
  'Mitchell Hamline School of Law':                          'Mitchell/Hamline School of Law',
  'CUNY School of Law':                                      'City University of New York, University of',
  'University of the Pacific McGeorge School of Law':        'Pacific, University of the',
  'UC College of the Law San Francisco':                     'California-San Francisco, University of',
  'Touro University Jacob D. Fuchsberg Law Center':          'Touro University',
  'Barry University Dwayne O. Andreas School of Law':        'Barry University',
  'University of the District of Columbia David A. Clarke School of Law': 'District of Columbia, University of',
  'Faulkner University Thomas Goode Jones School of Law':    'Faulkner University',
  'Nova Southeastern University Shepard Broad College of Law': 'Nova Southeastern University',
  'Ohio Northern University Pettit College of Law':          'Ohio Northern University',
  'St. Thomas University School of Law':                     'St. Thomas University (Miami)',
  'Texas Southern University Thurgood Marshall School of Law': 'Texas Southern University',
  'Lincoln Memorial University Duncan School of Law':        'Lincoln Memorial University',
  'Thomas M. Cooley Law School':                             'Cooley Law School',
  'University of North Texas Dallas College of Law':         'North Texas at Dallas, University of',
  'University of Massachusetts School of Law':               'Massachusetts/Dartmouth, University of',
  'New England Law Boston':                                  'New England Law/Boston',
  'Western State College of Law at Westcliff University':    'Western State, Westcliff University',
  'Emory University School of Law':                          'Emory University',
  'Fordham University School of Law':                        'Fordham University',
  'Boston College Law School':                               'Boston College',
  'Boston University School of Law':                         'Boston University',
  'Tulane University Law School':                            'Tulane University',
  'Ohio State University Moritz College of Law':             'The Ohio State University',
  'Case Western Reserve University School of Law':           'Case Western Reserve University',
  'University of Georgia School of Law':                     'Georgia, University of',
  'University of Iowa College of Law':                       'Iowa, University of',
  'University of Wisconsin Law School':                      'Wisconsin, University of',
  'University of Illinois College of Law':                   'Illinois, University of',
  'University of Colorado Law School':                       'Colorado, University of',
  'University of Connecticut School of Law':                 'Connecticut, University of',
  'University of Washington School of Law':                  'Washington, University of',
  'University of Oregon School of Law':                      'Oregon, University of',
  'University of Kentucky College of Law':                   'Kentucky, University of',
  'University of Nebraska College of Law':                   'Nebraska, University of',
  'University of Arkansas School of Law':                    'Arkansas, University of',
  'University of Idaho College of Law':                      'Idaho, University of',
  'University of Missouri School of Law':                    'Missouri, University of',
  'University of Missouri-Kansas City School of Law':        'Missouri-Kansas City, University of',
  'University of Montana School of Law':                     'Montana, University of',
  'University of North Dakota School of Law':                'North Dakota, University of',
  'University of Oklahoma College of Law':                   'Oklahoma, University of',
  'University of Pittsburgh School of Law':                  'Pittsburgh, University of',
  'University of Puerto Rico School of Law':                 'Puerto Rico, University of',
  'University of Richmond School of Law':                    'Richmond, University of',
  'University of San Diego School of Law':                   'San Diego, University of',
  'University of San Francisco School of Law':               'San Francisco, University of',
  'University of South Carolina School of Law':              'South Carolina, University of',
  'University of South Dakota School of Law':                'South Dakota, University of',
  'University of Tennessee College of Law':                  'Tennessee, University of',
  'University of Wyoming College of Law':                    'Wyoming, University of',
  'University of Cincinnati College of Law':                 'Cincinnati, University of',
  'University of Dayton School of Law':                      'Dayton, University of',
  'University of Detroit Mercy School of Law':               'Detroit Mercy, University of',
  'University of Houston Law Center':                        'Houston, University of',
  'University of Illinois Chicago School of Law':            'Illinois-Chicago, University of',
  'University of Maine School of Law':                       'Maine, University of',
  'University of Miami School of Law':                       'Miami, University of',
  'University of Notre Dame Law School':                     'Notre Dame, University of',
  'University of Baltimore School of Law':                   'Baltimore, University of',
  'BYU J. Reuben Clark Law School':                          'Brigham Young University',
  'Lewis-Clark Law School':                                  'Lewis & Clark Law School',
  'Loyola University Chicago School of Law':                 'Loyola University-Chicago',
  'Loyola University New Orleans College of Law':            'Loyola University-New Orleans',
  'Michigan State University College of Law':                'Michigan State University',
  'Northeastern University School of Law':                   'Northeastern University',
  'Quinnipiac University School of Law':                     'Quinnipiac University',
  'Roger Williams University School of Law':                 'Roger Williams University',
  'Saint Louis University School of Law':                    'Saint Louis University',
  'Santa Clara University School of Law':                    'Santa Clara University',
  'Seattle University School of Law':                        'Seattle University',
  'Seton Hall University School of Law':                     'Seton Hall University',
  "St. John's University School of Law":                     "St. John's University",
  "St. Mary's University School of Law":                     "St. Mary's University",
  'Suffolk University Law School':                           'Suffolk University',
  'Syracuse University College of Law':                      'Syracuse University',
  'Texas A&M University School of Law':                      'Texas A&M University',
  'Texas Tech University School of Law':                     'Texas Tech University',
  'Wake Forest University School of Law':                    'Wake Forest University',
  'Washburn University School of Law':                       'Washburn University',
  'Washington and Lee University School of Law':             'Washington and Lee University',
  'Wayne State University Law School':                       'Wayne State University',
  'West Virginia University College of Law':                 'West Virginia University',
  'Western New England University School of Law':            'Western New England University',
  'William & Mary Law School':                               'William & Mary',
  'Gonzaga University School of Law':                        'Gonzaga University',
  'Howard University School of Law':                         'Howard University',
  'Marquette University Law School':                         'Marquette University',
  'Drake University Law School':                             'Drake University',
  'Duquesne University School of Law':                       'Duquesne University',
  'Elon University School of Law':                           'Elon University',
  'Creighton University School of Law':                      'Creighton University',
  'Florida State University College of Law':                 'Florida State University',
  'Georgia State University College of Law':                 'Georgia State University',
  'Cleveland State University College of Law':               'Cleveland State University',
  'DePaul University College of Law':                        'DePaul University',
  'Florida A&M University College of Law':                   'Florida A&M University',
  'Florida International University College of Law':         'Florida International University',
  'Liberty University School of Law':                        'Liberty University',
  'Regent University School of Law':                         'Regent University',
  'Northern Illinois University College of Law':             'Northern Illinois University',
  'North Carolina Central University School of Law':         'North Carolina Central University',
  'Mississippi College School of Law':                       'Mississippi College',
  'Oklahoma City University School of Law':                  'Oklahoma City University',
  'Belmont University College of Law':                       'Belmont University',
  'Inter American University of Puerto Rico School of Law':  'Inter American University of Puerto Rico',
  'Pontifical Catholic University of Puerto Rico School of Law': 'Pontifical Catholic University of Puerto Rico',
  'Southern University Law Center':                          'Southern University',
  'Southwestern Law School':                                 'Southwestern Law School',
  'Stetson University College of Law':                       'Stetson University',
  'Vermont Law School':                                      'Vermont Law School',
  'Widener University Commonwealth Law School':              'Widener University Commonwealth Law School',
  'Widener University Delaware Law School':                  'Widener University Delaware Law School',
  'Willamette University College of Law':                    'Willamette University',
  'USC Gould School of Law':                                 'Southern California, University of',
  'Penn State Dickinson Law':                                'Penn State Dickinson Law',
  'University of Kentucky J. David Rosenberg College of Law': 'Kentucky, University of',
  'Southern Illinois University School of Law':              'Southern Illinois University',
  'Jacksonville University School of Law':                   'Jacksonville University',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePct(str) {
  if (str == null || str === '') return null;
  const n = parseFloat(String(str).replace('%', ''));
  return isNaN(n) ? null : n;
}

function normalise(str) {
  return str.toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[.,\-&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Load xlsx ─────────────────────────────────────────────────────────────────
const wb   = XLSX.readFile(XLSX_FILE);
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

// Build lookup: LSAC name → bar passage object
const barByLsac = new Map();
for (const r of rows) {
  const lsacName = r['School Name'];
  barByLsac.set(lsacName, {
    firstTimeTakers:  r['Total First Time Takers']  ?? null,
    firstTimePassers: r['Total First Time Passers']  ?? null,
    schoolPassRate:   parsePct(r['AvgSchoolPassPercent*']),
    stateAvgPassRate: parsePct(r['AvgStatePassPercent**']),
    passDifference:   parsePct(r['TotalDifferencePercent***']),
  });
}

// Also build a normalised-name fallback map
const barByNorm = new Map();
for (const [lsac, val] of barByLsac) {
  barByNorm.set(normalise(lsac), val);
}

// ── Save standalone bar_passage.json ─────────────────────────────────────────
const barPassageOut = {};
for (const [lsac, val] of barByLsac) {
  barPassageOut[lsac] = val;
}
fs.writeFileSync(BAR_OUT, JSON.stringify(barPassageOut, null, 2), 'utf8');
console.log(`✓  data/bar_passage.json  (${rows.length} schools)`);

// ── Load master.json ──────────────────────────────────────────────────────────
const masterRaw = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
const schools   = Array.isArray(masterRaw) ? masterRaw : (masterRaw.schools ? Object.values(masterRaw.schools) : []);

// ── Merge bar passage into each school ───────────────────────────────────────
let matched = 0, unmatched = [];

for (const school of schools) {
  const officialName = school.name;

  // 1. Explicit map  →  LSAC name
  const lsacName = SCHOLARSHIP_NAME_MAP[officialName];
  let bp = lsacName ? barByLsac.get(lsacName) : undefined;

  // 2. Direct LSAC lookup (school name already in LSAC format)
  if (!bp) bp = barByLsac.get(officialName);

  // 3. Normalised fallback
  if (!bp) bp = barByNorm.get(normalise(officialName));

  if (bp) {
    school.barPassage = bp;
    matched++;
  } else {
    school.barPassage = null;
    unmatched.push(officialName);
  }
}

// ── Write updated master.json ─────────────────────────────────────────────────
const outData = Array.isArray(masterRaw) ? schools : { ...masterRaw, schools: Object.fromEntries(schools.map(s => [s.slug || s.id, s])) };
fs.writeFileSync(MASTER_FILE, JSON.stringify(outData, null, 2), 'utf8');

const kb = (fs.statSync(MASTER_FILE).size / 1024).toFixed(1);
console.log(`✓  data/master.json updated  (${kb} KB)`);
console.log(`   Matched:   ${matched}/${schools.length}`);
if (unmatched.length) {
  console.log(`   Unmatched: ${unmatched.join(', ')}`);
}
