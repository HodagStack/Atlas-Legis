import os, re, glob
import PyPDF2

REPORTS = "C:/Users/hunte/OneDrive/Documents/GitHub/Atlas-Legis/reports"
SCHOOLS = "C:/Users/hunte/OneDrive/Documents/GitHub/Atlas-Legis/schools"

MONTHS = {"January","February","March","April","May","June",
          "July","August","September","October","November","December"}

def extract_fields(pdf_path):
    """Extract Application deadline and Application fee from a 509 PDF."""
    try:
        reader = PyPDF2.PdfReader(pdf_path)
        # Read first 2 pages — basics are always on page 1
        text = ""
        for i in range(min(2, len(reader.pages))):
            text += reader.pages[i].extract_text() + "\n"
    except Exception as e:
        return None, None, f"PDF read error: {e}"

    # ── Application deadline ──────────────────────────────────────────
    # Known field labels that indicate a blank deadline (next field bled in)
    FIELD_LABELS = {"application", "financial", "academic", "type"}

    deadline = None
    m = re.search(r'Application deadline\s*\n?\s*([^\n]*)', text)
    if m:
        raw = m.group(1).strip()
        tokens = raw.split()
        # If the captured text is empty or starts with a known field label,
        # the deadline field was blank — treat as rolling.
        if not tokens or tokens[0].lower() in FIELD_LABELS:
            deadline = "Rolling"
        elif tokens[0] in MONTHS and len(tokens) >= 2 and tokens[1].isdigit():
            deadline = f"{tokens[0]} {tokens[1]}"
        elif tokens[0].lower() in {"rolling", "none", "varies", "open"}:
            deadline = tokens[0].capitalize()
        elif tokens[0] in MONTHS:
            deadline = tokens[0]
        else:
            # Take up to 3 tokens as a fallback
            deadline = " ".join(tokens[:3])

    # ── Application fee ───────────────────────────────────────────────
    fee = None
    m = re.search(r'Application fee\s+([^\n]+)', text)
    if m:
        raw = m.group(1).strip()
        tokens = raw.split()
        if tokens:
            first = tokens[0]
            # Should look like $0, $75, $75.00, etc.
            if re.match(r'^\$[\d,]+(?:\.\d+)?$', first):
                fee = first
            elif first == "$":
                # "$" and amount split by tokenizer
                fee = "$ " + tokens[1] if len(tokens) > 1 else "$0"
            elif first.lower() in {"none", "no", "waived", "free"}:
                fee = "None"
            else:
                fee = first  # best effort

    error = None
    if not deadline:
        error = "Could not parse deadline"
    if not fee:
        error = (error + "; " if error else "") + "Could not parse fee"

    return deadline, fee, error


def inject_into_html(html_path, deadline, fee):
    """Insert Application Deadline and Fee rows into the At a Glance card."""
    with open(html_path, encoding="utf-8") as f:
        content = f.read()

    # Skip if already injected
    if "Application Deadline" in content:
        return False, "already injected"

    # Find the glance card's info-rows closing tag
    # Pattern: the </div> that closes info-rows, which is right before </div></article>
    # in the glance-h section
    glance_start = content.find('id="glance-h"')
    if glance_start == -1:
        return False, "no glance-h found"

    # After glance-h, find the closing of info-rows: 10 spaces + </div>
    # followed by card-body close and article close
    close_pattern = "\n          </div>\n        </div>\n      </article>"
    close_pos = content.find(close_pattern, glance_start)
    if close_pos == -1:
        return False, "could not find info-rows closing pattern"

    new_rows = (
        f'\n            <div class="info-row">'
        f'\n              <span class="info-lbl">Application Deadline</span>'
        f'\n              <span class="info-val">{deadline}</span>'
        f'\n            </div>'
        f'\n            <div class="info-row">'
        f'\n              <span class="info-lbl">Application Fee</span>'
        f'\n              <span class="info-val">{fee}</span>'
        f'\n            </div>'
    )

    new_content = content[:close_pos] + new_rows + content[close_pos:]

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True, "ok"


# ── Main ─────────────────────────────────────────────────────────────
results = []
errors  = []

pdf_files = sorted(glob.glob(f"{REPORTS}/*.pdf"))
print(f"Processing {len(pdf_files)} PDFs...\n")

for pdf_path in pdf_files:
    slug = os.path.basename(pdf_path).replace(".pdf", "")
    html_path = f"{SCHOOLS}/{slug}/index.html"

    if not os.path.isfile(html_path):
        errors.append(f"NO HTML: {slug}")
        continue

    deadline, fee, err = extract_fields(pdf_path)

    if err or not deadline or not fee:
        errors.append(f"EXTRACT FAIL [{slug}]: deadline={deadline!r} fee={fee!r} err={err}")
        continue

    ok, msg = inject_into_html(html_path, deadline, fee)
    if ok:
        results.append(f"OK  {slug}: deadline={deadline!r}  fee={fee!r}")
    else:
        errors.append(f"INJECT FAIL [{slug}]: {msg}")

print(f"Injected: {len(results)}")
print(f"Errors:   {len(errors)}\n")

if errors:
    print("=== ERRORS ===")
    for e in errors:
        print(f"  {e}")
EOF
