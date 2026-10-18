# -*- coding: utf-8 -*-
"""
Replace the 18 DAFTAR PUSTAKA paragraphs in document_new6.xml with
Zotero CSL-generated APA 7th entries (from zotero_apa_bib.txt).

Each new paragraph:
  <w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:after="160"/>
    <w:ind w:hanging="720" w:left="720"/></w:pPr>
    <w:r><w:rPr>Times New Roman / sz 24</w:rPr><w:t>TEXT </w:t></w:r>
    <w:hyperlink r:id="rIdN"><w:r>...blue+underline...<w:t>URL</w:t></w:r></w:hyperlink>
  </w:p>
"""
import re, os, sys, html

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "document_new6.xml")
OUT = os.path.join(HERE, "document_new7.xml")
BIB = os.path.join(HERE, "zotero_apa_bib.txt")
RELS = os.path.join(HERE, "unpacked", "word", "_rels", "document.xml.rels")

# --- 1. parse Zotero bib ---
raw = open(BIB, encoding="utf-8").read()
lines = [l.strip() for l in raw.splitlines() if l.strip()]
entries = []
for l in lines:
    if l.startswith("#"):
        continue
    m = re.match(r"^\d+\.\s+(.*)$", l)
    if not m:
        continue
    text = m.group(1)
    entries.append(text)
print("parsed entries:", len(entries))
assert len(entries) == 18, f"expected 18, got {len(entries)}"

# --- 2. build DOI -> rId map from rels ---
rels = open(RELS, encoding="utf-8").read()
doi2rid = {}
for m in re.finditer(r'<Relationship Id="(rId\d+)"[^>]*Target="([^"]+)"[^>]*/>', rels):
    rid, tgt = m.group(1), m.group(2)
    if "doi.org" in tgt:
        doi2rid[tgt.rstrip("/").lower()] = rid
print("doi rels:", len(doi2rid))

FONT = ('<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" '
        'w:cs="Times New Roman" w:eastAsia="Times New Roman"/>')

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def build_para(text):
    # split off trailing DOI url
    m = re.search(r"(https?://doi\.org/\S+)\s*$", text)
    body = text
    url = None
    if m:
        url = m.group(1)
        body = text[:m.start()].rstrip()
    # Zotero export uses &amp; already? -> it emitted raw '&amp;' text; unescape then re-escape
    body = html.unescape(body)
    body = body.replace("\xa0", " ")
    body_esc = esc(body)
    out = ['<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:after="160"/>'
           '<w:ind w:hanging="720" w:left="720"/></w:pPr>']
    out.append(f'<w:r><w:rPr>{FONT}<w:sz w:val="24"/></w:rPr>'
               f'<w:t xml:space="preserve">{body_esc} </w:t></w:r>')
    if url:
        rid = doi2rid.get(url.rstrip("/").lower())
        if rid:
            out.append(
                f'<w:hyperlink r:id="{rid}"><w:r><w:rPr><w:color w:val="0563C1"/>'
                f'<w:u w:val="single"/>{FONT}<w:sz w:val="24"/></w:rPr>'
                f'<w:t xml:space="preserve">{esc(url)}</w:t></w:r></w:hyperlink>'
            )
        else:
            print("  !! no rid for", url)
            out.append(f'<w:r><w:rPr>{FONT}<w:sz w:val="24"/></w:rPr>'
                       f'<w:t xml:space="preserve">{esc(url)}</w:t></w:r>')
    out.append('</w:p>')
    return "".join(out)

# --- 3. locate the existing 18 ref paragraphs and their span in the doc ---
doc = open(SRC, encoding="utf-8").read()
pat = re.compile(r'<w:p>(?:(?!</w:p>).)*?w:hanging="720"(?:(?!</w:p>).)*?</w:p>', re.S)
matches = list(pat.finditer(doc))
print("existing ref paragraphs:", len(matches))
assert len(matches) == 18, f"expected 18 refs, got {len(matches)}"

start = matches[0].start()
end = matches[-1].end()

new_block = "".join(build_para(e) for e in entries)

doc_new = doc[:start] + new_block + doc[end:]
open(OUT, "w", encoding="utf-8").write(doc_new)

import xml.dom.minidom as MD
MD.parseString(doc_new)
print("OK -> wrote", OUT)
