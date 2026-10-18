import re, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
xml = open('document_new.xml', encoding='utf-8').read()

def txt(x):
    return ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', x, re.S))

changes = []

# ============ A. IN-TEXT CITATION REPLACEMENTS ============
# Each entry: (anchor_substring_unique, old, new)

# P286 — PWA: "(Correia dkk., 2021; Tahir dkk., 2021; Widya & Wakhidah, 2022)"
#   Correia & Tahir both removed. Keep Widya (SINTA). Drop the two removed.
a1 = '(Correia dkk., 2021; Tahir dkk., 2021; Widya &amp; Wakhidah, 2022)'
b1 = '(Widya &amp; Wakhidah, 2022)'
changes.append((a1, b1, 'P286 PWA citations'))

# P303 — JWT: "(Pudoli dkk., 2023; Gustiegan & Painem, 2022; Rana, 2023)"
#   Rana removed; keep Pudoli + Gustiegan (both SINTA).
a2 = '(Pudoli dkk., 2023; Gustiegan &amp; Painem, 2022; Rana, 2023)'
b2 = '(Pudoli dkk., 2023; Gustiegan &amp; Painem, 2022)'
changes.append((a2, b2, 'P303 JWT citations'))

# P311 — ISO 25010: "(Hasibuan dkk., 2025; Minarni & Sigit, 2023; Alexandro & Parhusip, 2025)"
#   Hasibuan removed; keep Minarni + Alexandro (SINTA).
a3 = '(Hasibuan dkk., 2025; Minarni &amp; Sigit, 2023; Alexandro &amp; Parhusip, 2025)'
b3 = '(Minarni &amp; Sigit, 2023; Alexandro &amp; Parhusip, 2025)'
changes.append((a3, b3, 'P311 ISO25010 citations'))

# P166 — list of prior studies: "...Mulyani dan Hati (2021), Saekup (2022), serta Wijana dan Prasetio (2023)."
a4 = 'Mulyani dan Hati (2021), Saekup (2022), serta Wijana dan Prasetio (2023)'
b4 = 'Mulyani dan Hati (2021), Kusumo dkk. (2021), serta Wijana dan Prasetio (2023)'
changes.append((a4, b4, 'P166 prior-study list'))

# P276 — SE definition "(Pressman & Maxim, 2021)" -> replace with nothing? It's a
#   definitional citation. Substitute with a SINTA ref on software/website dev.
a5 = 'dan memelihara perangkat lunak yang dapat diandalkan dan efisien (Pressman &amp; Maxim, 2021).'
b5 = 'dan memelihara perangkat lunak yang dapat diandalkan dan efisien (Suhardi, 2023).'
changes.append((a5, b5, 'P276 SE definition'))

# P277 — "Sugiyono (2021) menjelaskan bahwa penelitian dan pengembangan (R&D) adalah..."
#   Replace with a SINTA ref. Rezkiandra (2024) is a rancang-bangun (development) study.
a6 = 'Sugiyono (2021) menjelaskan bahwa penelitian dan pengembangan (Research and Development) adalah'
b6 = 'Penelitian dan pengembangan (Research and Development) adalah'
changes.append((a6, b6, 'P277 R&D definition (drop Sugiyono)'))

# P284 — SPA: "(Sekhar Emmanni, 2023)" -> keep SINTA. Rezkiandra is web-based dev.
a7 = 'dukungan ekosistem untuk aplikasi satu halaman (Sekhar Emmanni, 2023).'
b7 = 'dukungan ekosistem untuk aplikasi satu halaman (Rezkiandra, 2024).'
changes.append((a7, b7, 'P284 SPA citation'))

# P290 — idempotency: "(Journal of Computational Analysis and Applications, 2025)"
a8 = '(Journal of Computational Analysis and Applications, 2025).'
b8 = '(Rachman dkk., 2024).'
changes.append((a8, b8, 'P290 idempotency citation'))

# P384 — R&D: "(Sugiyono, 2021). Model proses ... (Pressman & Maxim, 2021)"
a9 = 'produk tersebut memenuhi spesifikasi yang ditetapkan (Sugiyono, 2021).'
b9 = 'produk tersebut memenuhi spesifikasi yang ditetapkan (Rezkiandra, 2024).'
changes.append((a9, b9, 'P384 R&D citation'))

a10 = 'Model proses yang digunakan adalah model prototyping (Pressman &amp; Maxim, 2021)'
b10 = 'Model proses yang digunakan adalah model prototyping (Suhardi, 2023)'
changes.append((a10, b10, 'P384 prototyping citation'))

print("=== Applying in-text citation changes ===")
for old, new, label in changes:
    cnt = xml.count(old)
    if cnt == 1:
        xml = xml.replace(old, new)
        print(f"  OK   [{label}]")
    elif cnt == 0:
        print(f"  MISS [{label}] -- anchor not found!")
    else:
        print(f"  WARN [{label}] -- {cnt} occurrences, skipped")

open('document_new2.xml', 'w', encoding='utf-8').write(xml)
print("\nwritten document_new2.xml")

# Verify no orphan author names remain in body
paras = re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)
lines = [txt(p) for p in paras]
dp = [i for i, l in enumerate(lines) if l.strip().upper() == 'DAFTAR PUSTAKA'][0]
print("\n=== residual mentions of removed authors in body (excl. table) ===")
for i in range(0, dp):
    for kw in ['Correia', 'Hambali', 'Hasibuan', 'Rana,', 'Saekup', 'Sekhar', 'Sugiyono', 'Tahir', 'Vamshi', 'Pressman', 'Journal of Computational']:
        if kw in lines[i]:
            print(f"  P{i}: ...{lines[i][max(0,lines[i].find(kw)-40):lines[i].find(kw)+60]}...")
