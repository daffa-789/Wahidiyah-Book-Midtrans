import re, json, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))

raw = json.load(open('refs_raw.json', encoding='utf-8'))
xml = open('unpacked/word/document.xml', encoding='utf-8').read()

def txt(p):
    return ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S))

def unesc(s):
    return s.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&apos;', "'")

# ---- 1. Parse each raw ref paragraph into (text_before_doi, doi, rid) ----
parsed = {}
for k, p in raw.items():
    t = unesc(txt(p))
    rid_m = re.search(r'<w:hyperlink r:id="(rId\d+)"', p)
    rid = rid_m.group(1) if rid_m else None
    # split DOI
    dm = re.search(r'https://doi\.org/(\S+)', t)
    if dm:
        doi = dm.group(1).strip()
        before = t[:t.index('https://doi.org/')].rstrip()
    else:
        doi = None
        before = t.strip()
    parsed[k] = {'before': before, 'doi': doi, 'rid': rid}

# ---- 2. Which to keep (SINTA journals only) - paragraph indices ----
KEEP = [597,598,600,601,605,606,607,608,609,610,611,613,614,615,617,618,622,625,626]
REJECT = [599,602,603,604,612,616,619,620,621,623,624]

# ---- 3. Repair the 'before' text for known quality issues ----
fixes = {
 611: None,  # Nariswari "Sumiati, Hay's, R." - keep as-is unless we improve
}
# Jutisi publisher fix (ref P618 = Richo) - publisher not in ref text, skip
# Minarni P607 - "Sigit, S." keep

# ---- 4. Build entries: surname for sorting ----
# Extract leading surname (up to first comma)
entries = []
for k in KEEP:
    d = parsed[str(k)]
    before = d['before']
    # sort key = text before first comma or space
    m = re.match(r'^([^,]+)', before)
    key = m.group(1).strip().lower() if m else before.lower()
    entries.append((key, k, before, d['doi'], d['rid']))

entries.sort(key=lambda x: x[0])

print("=== FINAL ORDER (APA 7th, alphabetical) ===")
for i, (key, k, before, doi, rid) in enumerate(entries, 1):
    print(f"{i:2d}. P{k} [{rid}] {before[:95]}")
    if doi:
        print(f"      DOI https://doi.org/{doi}")

print(f"\nKEEP={len(KEEP)}  REJECT={len(REJECT)}  TOTAL={len(KEEP)+len(REJECT)}")
json.dump([{'idx':k,'before':b,'doi':d,'rid':r} for (_,k,b,d,r) in entries],
          open('final_entries.json','w'), ensure_ascii=False, indent=1)
print("\nsaved final_entries.json")
