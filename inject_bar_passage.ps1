# inject_bar_passage.ps1
# Reads bar passage data from Excel and injects into each school's HTML profile page.
# Adds a "First-Time Bar Passage" card between Employment and Scholarships,
# and a sidebar info-row after "Bar-Required FTLT" in the At a Glance card.
# Safe to re-run: skips pages that already contain the injected section.

$basePath  = "C:\Users\hunte\OneDrive\Documents\GitHub\Atlas-Legis"
$xlsxPath  = "$basePath\First_Time_Bar_Admission_2025.xlsx"
$schoolsDir = "$basePath\schools"

# ── Name → Slug mapping ────────────────────────────────────────────────────
$nameToSlug = @{
    "Akron, The University of"                        = "university-of-akron-school-of-law"
    "Alabama, The University of"                      = "university-of-alabama-school-of-law"
    "Albany Law School"                               = "albany-law-school"
    "American University"                             = "american-university-washington-college-of-law"
    "Appalachian School of Law"                       = "appalachian-school-of-law"
    "Arizona State University"                        = "arizona-state-sandra-day-oconnor-college-of-law"
    "Arizona, The University of"                      = "university-of-arizona-james-e-rogers-college-of-law"
    "Arkansas at Little Rock, University of"          = "ua-little-rock-bowen-school-of-law"
    "Arkansas, University of"                         = "university-of-arkansas-school-of-law"
    "Atlanta's John Marshall Law School"              = "atlantas-john-marshall-law-school"
    "Ave Maria School of Law"                         = "ave-maria-school-of-law"
    "Baltimore, University of"                        = "university-of-baltimore-school-of-law"
    "Barry University"                                = "barry-university-dwayne-o-andreas-school-of-law"
    "Baylor University"                               = "baylor-law-school"
    "Belmont University"                              = "belmont-university-college-of-law"
    "Boston College"                                  = "boston-college-law-school"
    "Boston University"                               = "boston-university-school-of-law"
    "Brigham Young University"                        = "byu-j-reuben-clark-law-school"
    "Brooklyn Law School"                             = "brooklyn-law-school"
    "Buffalo, University at"                          = "university-at-buffalo-school-of-law"
    "California Western School of Law"                = "california-western-school-of-law"
    "California-Berkeley, University of"              = "uc-berkeley-school-of-law"
    "California-Davis, University of"                 = "uc-davis-school-of-law"
    "California-Irvine, University of"                = "uc-irvine-school-of-law"
    "California-Los Angeles, University of"           = "ucla-school-of-law"
    "California-San Francisco, University of"         = "uc-college-of-the-law-san-francisco"
    "Campbell University"                             = "campbell-university-norman-adrian-wiggins-school-of-law"
    "Capital University Law School"                   = "capital-university-law-school"
    "Cardozo, Yeshiva University"                     = "cardozo-school-of-law"
    "Case Western Reserve University"                 = "case-western-reserve-university-school-of-law"
    "Catholic University of America, The"             = "catholic-university-of-america-columbus-school-of-law"
    "Chapman University"                              = "chapman-university-fowler-school-of-law"
    "Charleston School of Law"                        = "charleston-school-of-law"
    "Chicago, The University of"                      = "university-of-chicago-law-school"
    "Chicago-Kent, Illinois Institute of Technology"  = "chicago-kent-college-of-law-iit"
    "Cincinnati, University of"                       = "university-of-cincinnati-college-of-law"
    "City University of New York, University of"      = "cuny-school-of-law"
    "Cleveland State University"                      = "cleveland-state-university-college-of-law"
    "Colorado, University of"                         = "university-of-colorado-law-school"
    "Columbia University"                             = "columbia-law-school"
    "Connecticut, University of"                      = "university-of-connecticut-school-of-law"
    "Cooley Law School"                               = "thomas-m-cooley-law-school"
    "Cornell University"                              = "cornell-law-school"
    "Creighton University"                            = "creighton-university-school-of-law"
    "Dayton, University of"                           = "university-of-dayton-school-of-law"
    "Denver, University of"                           = "university-of-denver-sturm-college-of-law"
    "DePaul University"                               = "depaul-university-college-of-law"
    "Detroit Mercy, University of"                    = "university-of-detroit-mercy-school-of-law"
    "District of Columbia, University of"             = "university-of-the-district-of-columbia-david-a-clarke-school-of-law"
    "Drake University"                                = "drake-university-law-school"
    "Drexel University"                               = "drexel-university-kline-school-of-law"
    "Duke University"                                 = "duke-university-school-of-law"
    "Duquesne University"                             = "duquesne-university-school-of-law"
    "Elon University"                                 = "elon-university-school-of-law"
    "Emory University"                                = "emory-university-school-of-law"
    "Faulkner University"                             = "faulkner-university-thomas-goode-jones-school-of-law"
    "Florida A&M University"                          = "florida-a-m-university-college-of-law"
    "Florida International University"                = "florida-international-university-college-of-law"
    "Florida State University"                        = "florida-state-university-college-of-law"
    "Florida, University of"                          = "university-of-florida-levin-college-of-law"
    "Fordham University"                              = "fordham-university-school-of-law"
    "George Mason University"                         = "george-mason-antonin-scalia-law-school"
    "George Washington University, The"               = "george-washington-university-law-school"
    "Georgetown University"                           = "georgetown-university-law-center"
    "Georgia State University"                        = "georgia-state-university-college-of-law"
    "Georgia, University of"                          = "university-of-georgia-school-of-law"
    "Gonzaga University"                              = "gonzaga-university-school-of-law"
    "Harvard University"                              = "harvard-law-school"
    "Hawaii, University of"                           = "university-of-hawaii-richardson-school-of-law"
    "Hofstra University"                              = "hofstra-university-deane-school-of-law"
    "Houston, University of"                          = "university-of-houston-law-center"
    "Howard University"                               = "howard-university-school-of-law"
    "Idaho, University of"                            = "university-of-idaho-college-of-law"
    "Illinois, University of"                         = "university-of-illinois-college-of-law"
    "Illinois-Chicago, University of"                 = "university-of-illinois-chicago-school-of-law"
    "Indiana University-Bloomington"                  = "indiana-university-maurer-school-of-law"
    "Indiana University-Indianapolis"                 = "indiana-university-mckinney-school-of-law"
    "Inter American University of Puerto Rico"        = "inter-american-university-of-puerto-rico-school-of-law"
    "Iowa, University of"                             = "university-of-iowa-college-of-law"
    "Kansas, The University of"                       = "university-of-kansas-school-of-law"
    "Kentucky, University of"                         = "university-of-kentucky-college-of-law"
    "Lewis & Clark Law School"                        = "lewis-clark-law-school"
    "Liberty University"                              = "liberty-university-school-of-law"
    "Lincoln Memorial University"                     = "lincoln-memorial-university-duncan-school-of-law"
    "Louisiana State University"                      = "lsu-paul-m-hebert-law-center"
    "Louisville, University of"                       = "university-of-louisville-brandeis-school-of-law"
    "Loyola Marymount University-Los Angeles"         = "loyola-law-school-los-angeles"
    "Loyola University-Chicago"                       = "loyola-university-chicago-school-of-law"
    "Loyola University-New Orleans"                   = "loyola-university-new-orleans-college-of-law"
    "Maine, University of"                            = "university-of-maine-school-of-law"
    "Marquette University"                            = "marquette-university-law-school"
    "Maryland, University of"                         = "university-of-maryland-carey-school-of-law"
    "Massachusetts/Dartmouth, University of"          = "university-of-massachusetts-school-of-law"
    "Memphis, The University of"                      = "university-of-memphis-humphreys-school-of-law"
    "Mercer University"                               = "mercer-university-walter-f-george-school-of-law"
    "Miami, University of"                            = "university-of-miami-school-of-law"
    "Michigan State University"                       = "michigan-state-university-college-of-law"
    "Michigan, University of"                         = "university-of-michigan-law-school"
    "Minnesota, University of"                        = "university-of-minnesota-law-school"
    "Mississippi College"                             = "mississippi-college-school-of-law"
    "Mississippi, The University of"                  = "university-of-mississippi-school-of-law"
    "Missouri, University of"                         = "university-of-missouri-school-of-law"
    "Missouri-Kansas City, University of"             = "university-of-missouri-kansas-city-school-of-law"
    "Mitchell/Hamline School of Law"                  = "mitchell-hamline-school-of-law"
    "Montana, University of"                          = "university-of-montana-school-of-law"
    "Nebraska, University of"                         = "university-of-nebraska-college-of-law"
    "Nevada-Las Vegas, University of"                 = "unlv-william-s-boyd-school-of-law"
    "New England Law/Boston"                          = "new-england-law-boston"
    "New Hampshire, University of"                    = "university-of-new-hampshire-franklin-pierce-school-of-law"
    "New Mexico, The University of"                   = "university-of-new-mexico-school-of-law"
    "New York Law School"                             = "new-york-law-school"
    "New York University"                             = "nyu-school-of-law"
    "North Carolina Central University"               = "north-carolina-central-university-school-of-law"
    "North Carolina, University of"                   = "university-of-north-carolina-school-of-law"
    "North Dakota, University of"                     = "university-of-north-dakota-school-of-law"
    "North Texas at Dallas, University of"            = "university-of-north-texas-dallas-college-of-law"
    "Northeastern University"                         = "northeastern-university-school-of-law"
    "Northern Illinois University"                    = "northern-illinois-university-college-of-law"
    "Northern Kentucky University"                    = "northern-kentucky-university-chase-college-of-law"
    "Northwestern University"                         = "northwestern-pritzker-school-of-law"
    "Notre Dame, University of"                       = "university-of-notre-dame-law-school"
    "Nova Southeastern University"                    = "nova-southeastern-university-shepard-broad-college-of-law"
    "Ohio Northern University"                        = "ohio-northern-university-pettit-college-of-law"
    "Oklahoma City University"                        = "oklahoma-city-university-school-of-law"
    "Oklahoma, University of"                         = "university-of-oklahoma-college-of-law"
    "Oregon, University of"                           = "university-of-oregon-school-of-law"
    "Pace University"                                 = "pace-university-elisabeth-haub-school-of-law"
    "Pacific, University of the"                      = "university-of-the-pacific-mcgeorge-school-of-law"
    "Penn State Dickinson Law"                        = "penn-state-dickinson-law"
    "Pennsylvania, University of"                     = "penn-carey-law"
    "Pepperdine University"                           = "pepperdine-caruso-school-of-law"
    "Pittsburgh, University of"                       = "university-of-pittsburgh-school-of-law"
    "Pontifical Catholic University of Puerto Rico"   = "pontifical-catholic-university-of-puerto-rico-school-of-law"
    "Puerto Rico, University of"                      = "university-of-puerto-rico-school-of-law"
    "Quinnipiac University"                           = "quinnipiac-university-school-of-law"
    "Regent University"                               = "regent-university-school-of-law"
    "Richmond, University of"                         = "university-of-richmond-school-of-law"
    "Roger Williams University"                       = "roger-williams-university-school-of-law"
    "Rutgers University"                              = "rutgers-law-school"
    "Saint Louis University"                          = "saint-louis-university-school-of-law"
    "Samford University"                              = "samford-university-cumberland-school-of-law"
    "San Diego, University of"                        = "university-of-san-diego-school-of-law"
    "San Francisco, University of"                    = "university-of-san-francisco-school-of-law"
    "Santa Clara University"                          = "santa-clara-university-school-of-law"
    "Seattle University"                              = "seattle-university-school-of-law"
    "Seton Hall University"                           = "seton-hall-university-school-of-law"
    "South Carolina, University of"                   = "university-of-south-carolina-school-of-law"
    "South Dakota, University of"                     = "university-of-south-dakota-school-of-law"
    "South Texas College of Law Houston"              = "south-texas-college-of-law-houston"
    "Southern California, University of"              = "usc-gould-school-of-law"
    "Southern Illinois University"                    = "southern-illinois-university-school-of-law"
    "Southern Methodist University"                   = "smu-dedman-school-of-law"
    "Southern University"                             = "southern-university-law-center"
    "Southwestern Law School"                         = "southwestern-law-school"
    "St. John's University"                           = "st-johns-university-school-of-law"
    "St. Mary's University"                           = "st-marys-university-school-of-law"
    "St. Thomas University (Miami)"                   = "st-thomas-university-school-of-law"
    "St. Thomas, (Minneapolis) University of"         = "university-of-st-thomas-school-of-law"
    "Stanford University"                             = "stanford-law-school"
    "Stetson University"                              = "stetson-university-college-of-law"
    "Suffolk University"                              = "suffolk-university-law-school"
    "Syracuse University"                             = "syracuse-university-college-of-law"
    "Temple University"                               = "temple-university-beasley-school-of-law"
    "Tennessee, University of"                        = "university-of-tennessee-college-of-law"
    "Texas A&M University"                            = "texas-a-m-university-school-of-law"
    "Texas Southern University"                       = "texas-southern-university-thurgood-marshall-school-of-law"
    "Texas Tech University"                           = "texas-tech-university-school-of-law"
    "Texas, University of"                            = "university-of-texas-school-of-law"
    "The Ohio State University"                       = "ohio-state-university-moritz-college-of-law"
    "Toledo, The University of"                       = "university-of-toledo-college-of-law"
    "Touro University"                                = "touro-university-jacob-d-fuchsberg-law-center"
    "Tulane University"                               = "tulane-university-law-school"
    "Tulsa, The University of"                        = "university-of-tulsa-college-of-law"
    "Utah, The University of"                         = "university-of-utah-s-j-quinney-college-of-law"
    "Vanderbilt University"                           = "vanderbilt-university-law-school"
    "Vermont Law School"                              = "vermont-law-school"
    "Villanova University"                            = "villanova-university-widger-school-of-law"
    "Virginia, University of"                         = "university-of-virginia-school-of-law"
    "Wake Forest University"                          = "wake-forest-university-school-of-law"
    "Washburn University"                             = "washburn-university-school-of-law"
    "Washington and Lee University"                   = "washington-and-lee-university-school-of-law"
    "Washington University (St. Louis)"               = "washington-university-in-st-louis-school-of-law"
    "Washington, University of"                       = "university-of-washington-school-of-law"
    "Wayne State University"                          = "wayne-state-university-law-school"
    "West Virginia University"                        = "west-virginia-university-college-of-law"
    "Western New England University"                  = "western-new-england-university-school-of-law"
    "Western State, Westcliff University"             = "western-state-college-of-law-at-westcliff-university"
    "Widener University Commonwealth Law School"      = "widener-university-commonwealth-law-school"
    "Widener University Delaware Law School"          = "widener-university-delaware-law-school"
    "Willamette University"                           = "willamette-university-college-of-law"
    "William & Mary"                                  = "william-mary-law-school"
    "Wisconsin, University of"                        = "university-of-wisconsin-law-school"
    "Wyoming, University of"                          = "university-of-wyoming-college-of-law"
    "Yale University"                                 = "yale-law-school"
}

# ── Open Excel ─────────────────────────────────────────────────────────────
Write-Host "Opening Excel..."
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($xlsxPath)
$ws = $wb.Sheets.Item(1)
$used = $ws.UsedRange

$done = 0; $skipped = 0; $warned = 0

# ── Process each row ───────────────────────────────────────────────────────
for ($r = 2; $r -le $used.Rows.Count; $r++) {
    $name = $ws.Cells($r, 1).Text.Trim()

    # Skip blank or footnote rows
    if ($name -eq "" -or $name -match "^\*") { continue }

    $takers     = $ws.Cells($r, 8).Text.Trim()
    $schoolPass = $ws.Cells($r, 11).Text.Trim()
    $statePass  = $ws.Cells($r, 12).Text.Trim()
    $diff       = $ws.Cells($r, 13).Text.Trim()

    # Skip rows with missing key data
    if ($schoolPass -eq "" -or $statePass -eq "" -or $diff -eq "") {
        Write-Host "WARN (no data): $name"
        $warned++
        continue
    }

    # Resolve slug
    $slug = $nameToSlug[$name]
    if (-not $slug) {
        Write-Host "WARN (no slug): $name"
        $warned++
        continue
    }

    $htmlPath = "$schoolsDir\$slug\index.html"
    if (-not (Test-Path $htmlPath)) {
        Write-Host "WARN (no file): $slug"
        $warned++
        continue
    }

    # Read HTML
    $html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

    # Idempotency check
    if ($html.Contains('id="bar-passage-h"')) {
        $skipped++
        continue
    }

    # ── Build values ───────────────────────────────────────────────────────

    # Strip % for the number/span pattern used in emp-num
    $schoolPassNum = $schoolPass -replace '%', ''
    $statePassNum  = $statePass  -replace '%', ''

    # Difference: determine sign, color, sub-text, and display string
    $diffStripped = $diff -replace '%', ''
    $diffVal      = [double]$diffStripped

    if ($diffVal -lt 0) {
        $diffColor   = "#dc2626"
        $diffSub     = "Below weighted average"
        $diffDisplay = "$diffStripped"          # already has leading minus
    } elseif ($diffVal -gt 0) {
        $diffColor   = "#059669"
        $diffSub     = "Above weighted average"
        $diffDisplay = "+$diffStripped"
    } else {
        $diffColor   = "#64748b"
        $diffSub     = "At weighted average"
        $diffDisplay = "$diffStripped"
    }

    # ── Bar Passage card HTML ──────────────────────────────────────────────
    $barCard = @"

      <!-- ++ Bar Passage ++++++++++++++++++++++++++++++++++++++ -->
      <section aria-labelledby="bar-passage-h">
        <article class="card">
          <div class="card-head">
            <h2 id="bar-passage-h">First-Time Bar Passage</h2>
            <span class="card-note">Class of 2024</span>
          </div>
          <div class="card-body">

            <div class="emp-hero" aria-label="$schoolPassNum percent first-time bar passage rate">
              <div>
                <div class="emp-lbl">First-Time Pass Rate</div>
                <div class="emp-num">$schoolPassNum<span>%</span></div>
                <div class="emp-sub">Across all jurisdictions &middot; first-time takers</div>
              </div>
              <div class="emp-badge" aria-hidden="true">Class of 2024</div>
            </div>

            <div class="emp-grid">
              <div class="emp-cell">
                <div class="emp-lbl">ABA Avg (Weighted)</div>
                <div class="emp-num">$statePassNum<span>%</span></div>
                <div class="emp-sub">Peer schools, same jurisdictions</div>
              </div>
              <div class="emp-cell">
                <div class="emp-lbl">vs. ABA Avg</div>
                <div class="emp-num" style="color: $diffColor;">$diffDisplay<span>%</span></div>
                <div class="emp-sub">$diffSub</div>
              </div>
              <div class="emp-cell">
                <div class="emp-lbl">First-Time Takers</div>
                <div class="emp-num">$takers</div>
                <div class="emp-sub">Graduates sitting for bar</div>
              </div>
            </div>

          </div>
        </article>
      </section>

"@

    # ── Sidebar info-row HTML ──────────────────────────────────────────────
    $sidebarRow = @"

            <div class="info-row">
              <span class="info-lbl">Bar Passage (1st Time)</span>
              <span class="info-val">$schoolPass</span>
            </div>
"@

    # ── Inject bar passage card before the Scholarships section ───────────
    $scholarMarker = '<section aria-labelledby="scholarships-h">'
    $pos = $html.IndexOf($scholarMarker)
    if ($pos -lt 0) {
        Write-Host "WARN (no scholarship anchor): $slug"
        $warned++
        continue
    }
    # Walk back to the start of that line so indentation is preserved
    $lineStart = $html.LastIndexOf("`n", $pos) + 1
    $html = $html.Substring(0, $lineStart) + $barCard + $html.Substring($lineStart)

    # ── Inject sidebar row after the Bar-Required FTLT info-row ───────────
    $ftltMarker = '<span class="info-lbl">Bar-Required FTLT</span>'
    $pos = $html.IndexOf($ftltMarker)
    if ($pos -lt 0) {
        Write-Host "WARN (no FTLT anchor): $slug"
        $warned++
        continue
    }
    # Find the closing </div> of that info-row
    $divClose = $html.IndexOf("</div>", $pos)
    if ($divClose -lt 0) {
        Write-Host "WARN (no closing div): $slug"
        $warned++
        continue
    }
    $insertAt = $divClose + 6   # after "</div>"
    $html = $html.Substring(0, $insertAt) + $sidebarRow + $html.Substring($insertAt)

    # ── Write back ────────────────────────────────────────────────────────
    [System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.Encoding]::UTF8)
    Write-Host "DONE: $slug"
    $done++
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host ""
Write-Host "==================================="
Write-Host "Injected : $done"
Write-Host "Skipped  : $skipped  (already done)"
Write-Host "Warnings : $warned"
Write-Host "==================================="
