# Atlas Legis

**Atlas Legis** is a free, data-driven law school analytics platform for prospective law students. It combines an interactive map of every ABA-accredited school with deep per-school profiles, data-driven rankings, financial planning tools, and an AI research assistant — all built directly from official ABA required disclosures.

Live at **[atlaslegis.com](https://atlaslegis.com)**

---

## Features

### Interactive Map
The homepage displays all ABA-accredited law schools on a pannable, zoomable map. Markers are clickable and surface key stats at a glance.

### School Profiles (~198 pages)
Every accredited school has a dedicated profile at `/schools/<slug>/` with:
- Employment outcomes (BigLaw, federal clerkships, public interest, JD advantage)
- Bar passage rates vs. state averages
- Tuition, scholarship, and cost of attendance data
- Admissions statistics (LSAT/GPA 25th–75th percentiles)
- Downloadable PDF reports

### Rankings
Ranked entirely from ABA 509 disclosure data — no reputation surveys, no opaque methodology.

| Ranking | URL |
|---|---|
| Bar Passage | `/rankings/bar-passage/` |
| BigLaw Placement | `/rankings/biglaw/` |
| Federal Clerkships | `/rankings/federal-clerkships/` |
| Scholarships | `/rankings/scholarships/` |

All ranking pages feature sortable/filterable tables, gold/silver/bronze podium cards for the top 3, and inline progress bars.

### Debt Planner (`/debt-planner/`)
Projects total law school borrowing across three scenarios using 2026 federal loan rates (7.94% Unsubsidized / 8.94% PLUS):
- **Standard** — normal repayment
- **High Risk** — scholarship loss after Year 1
- **Public Interest (PSLF)** — income-based repayment toward forgiveness

Includes a Chart.js loan balance visualization, school-specific tuition autofill, and a shareable URL.

### Scholarship Estimator (`/scholarship-estimator/`)
Enter your LSAT and GPA to see estimated merit scholarship amounts at every ABA school, calculated from official 509 grant distribution data. Includes grant estimate, 3-year total, estimated net cost, applicant strength tiers (Strong / Competitive / Reach), and confidence indicators.

### Ask Telamon (`/ask/`)
An AI research assistant powered by a Cloudflare Worker. Answers questions about law school admissions, employment outcomes, and financial planning using Atlas Legis data as context.

---

## Data Sources

All data comes from ABA required disclosures:
- **ABA 509 reports** — admissions, enrollment, bar passage, tuition, scholarships
- **ABA employment summaries** — Class of 2024 outcomes
- **Federal loan rates** — 2026 FAFSA rates

No affiliation with any law school or accrediting body.

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript — no framework, no bundler
- **Data:** Static JSON files in `/data/` loaded via `fetch()`
- **Charts:** Chart.js 4.4
- **AI backend:** Cloudflare Worker (`workers/telamon.js`)
- **Hosting:** GitHub Pages (custom domain via `CNAME`)
- **Fonts:** Playfair Display · DM Sans · Instrument Serif (Google Fonts)

---

## Project Structure

```
/
├── index.html                    # Homepage + map
├── schools/<slug>/index.html     # ~198 individual school profiles
├── rankings/
│   ├── index.html                # Rankings hub
│   ├── bar-passage/
│   ├── biglaw/
│   ├── federal-clerkships/
│   └── scholarships/
├── debt-planner/index.html
├── scholarship-estimator/index.html
├── ask/index.html                # Ask Telamon
├── data/                         # JSON data files
├── reports/<slug>.pdf            # Per-school PDF reports
├── workers/telamon.js            # Cloudflare AI worker
└── theme.css / theme.js          # Sitewide dark mode toggle
```

---

*Atlas Legis is an independent project and is not affiliated with any law school or accrediting body. Data is sourced from public ABA disclosures and is provided for informational purposes only.*
