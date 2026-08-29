Atlas Legis

Atlas Legis is a free, independent law-school research platform for prospective students. It turns public ABA disclosures into a map, school profiles, comparisons, rankings, and planning tools—without reputation surveys or paywalled data.

Live at atlaslegis.com

What it includes

* Interactive map — Explore ABA-accredited U.S. law schools and surface core admissions and outcomes data directly from the map.
* School profiles — 197 data-rich pages at /schools/<slug>/, covering admissions ranges, employment outcomes, bar passage, tuition, scholarships, cost of attendance, historical admissions trends, and downloadable reports.
* Rankings — Sortable, filterable views for bar passage, BigLaw placement, federal clerkships, and scholarship data. They use disclosed data rather than reputation surveys.
* Where Do I Stand? — An LSAT/GPA positioning tool.
* Scholarship Estimator — Estimates merit-scholarship ranges from each school’s disclosed 509 grant-distribution data, with net-cost context and confidence indicators.
* Debt Planner — Models borrowing and repayment under standard, scholarship-loss, and public-interest/PSLF scenarios; it includes school-specific tuition autofill and shareable URLs.
* Guides — Plain-language admissions resources, beginning with application-fee waivers.

Data and methodology

Atlas Legis is built primarily from official, public ABA required disclosures:

* ABA Standard 509 reports: admissions, enrollment, tuition, scholarships, and bar-passage data
* ABA employment summaries: Class of 2024 employment outcomes
* Federal loan rates: 2026 FAFSA rates

Employment percentages are calculated from disclosed raw counts, using total graduates—including graduates of unknown status—as the denominator. The project does not use reputation surveys, subjective composite scores, or third-party estimated employment outcomes.

See the site’s sources and methodology pages for additional detail.

Built with

* Vanilla HTML, CSS, and JavaScript—no framework or bundler
* Static JSON datasets in /data/
* Leaflet for the interactive map and Chart.js for visualizations
* GitHub Pages with the custom domain atlaslegis.com
* Google Analytics
* Playfair Display, DM Sans, and Instrument Serif

Repository layout

/
├── index.html                    # Homepage and interactive map
├── schools/<slug>/               # Individual school profiles
├── rankings/                     # Rankings hub and metric pages
├── debt-planner/                 # Law-school borrowing planner
├── scholarship-estimator/        # Merit-scholarship estimator
├── finder/                       # Admissions-positioning tool
├── guides/                       # Admissions guides
├── data/                         # Source-derived JSON datasets
├── reports/                      # Downloadable school reports
├── scripts/                      # Page generation and data-maintenance scripts
├── theme.css / theme.js          # Shared interface and theme behavior
└── sitemap.xml                   # Search-engine discovery

Updating the site

The site is static. Most data and profile-page changes begin in /data/ and are propagated with the scripts in /scripts/; profile pages are generated rather than hand-authored. Changes pushed to main deploy through GitHub Pages.

⸻

Atlas Legis is an independent project, unaffiliated with the ABA, any law school, or U.S. News. Its data is provided for informational purposes only.