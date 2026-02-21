# Methodology

## Data Source and Scope

All employment data presented on Atlas Legis is derived from the American Bar Association (ABA) Employment Summary Reports for the Class of 2024, as published by each ABA-accredited law school.

These reports constitute the official, standardized employment disclosures required under ABA accreditation rules. No third-party aggregators, rankings publications, or proprietary datasets are used.

The unit of analysis is the graduating class of each reporting institution.

---

## Data Extraction and Structure

Employment data are extracted as raw graduate counts by category.

The underlying dataset preserves the ABA’s categorical structure, including:

- Law firm placements (by firm size)
- Judicial clerkships (federal, state/local, tribal, international)
- Government positions
- Public interest positions
- Business and industry
- Education
- JD-advantage positions
- Professional positions
- Unemployed (seeking and not seeking)

All calculations are performed using total graduates as the primary denominator unless otherwise specified.

No percentage values are stored in the dataset. All percentages displayed on the site are computed dynamically from raw counts to preserve precision and transparency.

---

## Operational Definitions

### Bar-Required Employment

For purposes of this project, “Bar-Required Jobs” are defined as:

- All law firm positions  
- All judicial clerkships  
- Government positions  
- Public interest positions  

This metric is calculated as:

(Law Firms + Clerkships + Government + Public Interest) / Total Graduates

---

### BigLaw (251+ Attorneys)

“BigLaw” is operationalized as employment at law firms with 251 or more attorneys, combining:

- 251–500 attorneys  
- 501+ attorneys  

Calculated as:

(251–500 + 501+) / Total Graduates

---

### Clerkships

- “Federal Clerkships” refers exclusively to federal judicial placements.
- “All Clerkships” aggregates federal, state/local, tribal, and international clerkships.

---

### Law Firm Distribution

Law firm outcomes are presented in two distinct formats:

1. As a percentage of total graduates  
2. As a percentage of total law firm placements  

The second format reflects internal firm-size distribution and sums to 100%.

---

## Calculation Protocol

- Percentages are calculated dynamically from raw counts.
- Values are rounded to one decimal place.
- No smoothing, weighting, or statistical adjustments are applied.
- No imputation or inference is performed for missing values.
- All figures reflect outcomes as reported in official ABA disclosures.

---

## Analytical Philosophy

Atlas Legis is designed as a transparency-oriented data presentation tool rather than a ranking system.

The project adheres to three methodological principles:

1. Raw-data integrity — preserving official ABA counts without modification.  
2. Denominator clarity — distinguishing between percentages of total graduates and percentages of subcategories.  
3. Comparative neutrality — avoiding composite weighting schemes unless explicitly defined.

The objective is to enable users to evaluate institutional employment outcomes using standardized, publicly disclosed data presented in a structurally consistent format.
