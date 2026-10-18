import re, json, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

entries = json.load(open('final_entries.json', encoding='utf-8'))
xml = open('unpacked/word/document.xml', encoding='utf-8').read()

RPR = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/></w:rPr>'
PPR = '<w:pPr><w:spacing w:line="360" w:lineRule="auto" w:after="160"/><w:ind w:hanging="720" w:left="720"/></w:pPr>'

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def run(text, italic=False):
    rpr = RPR if not italic else RPR.replace('<w:sz ', '<w:i/><w:sz ')
    return f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>'

# ---- Build new reference paragraphs ----
# Strategy: keep the CLEAN 'before' text as-is (already APA-7-formatted by the
# original builder), just re-emit with proper pPr/rPr and the DOI hyperlink.
new_paras = []
for e in entries:
    before = e['before'].strip()
    doi = e['doi']
    rid = e['rid']
    # ensure sentence ends with a period before DOI
    if not before.endswith('.'):
        before = before.rstrip() + '.'
    body = run(before + ' ')
    if doi and rid:
        link = (f'<w:hyperlink r:id="{rid}">'
                f'<w:r><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/>'
                f'<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/></w:rPr>'
                f'<w:t xml:space="preserve">https://doi.org/{esc(doi)}</w:t></w:r></w:hyperlink>')
        para = f'<w:p>{PPR}{body}{link}</w:p>'
    else:
        para = f'<w:p>{PPR}{body}</w:p>'
    new_paras.append(para)

# ---- Replace paragraphs 597..626 (30 refs) with the 19 new ones ----
paras = re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)
assert len(paras) == 805, f"paragraph count changed: {len(paras)}"

# Build the new document by walking paragraphs
out = []
i = 0
while i < len(paras):
    if i == 597:
        # insert new refs, then skip the old ones 597..626
        out.extend(new_paras)
        i = 627
        continue
    out.append(paras[i])
    i += 1

# Reassemble: split original xml on paragraph boundaries then rebuild
# Simpler: use the original xml and do a targeted string replace of the
# contiguous block from P597 to P626.
block_start = xml.index(paras[597])
block_end = xml.index(paras[626]) + len(paras[626])
old_block = xml[block_start:block_end]
new_block = ''.join(new_paras)
new_xml = xml[:block_start] + new_block + xml[block_end:]

# sanity
assert old_block.startswith(paras[597][:50]), "block start mismatch"
assert new_xml.count('<w:p>') + new_xml.count('<w:p ') == 805 - 30 + 19, "para count wrong"

open('document_new.xml', 'w', encoding='utf-8').write(new_xml)
print("written document_new.xml")
print("old block paragraphs:", old_block.count('<w:p>') + old_block.count('<w:p '))
print("new block paragraphs:", new_block.count('<w:p>') + new_block.count('<w:p '))
print("total paras: old=%d new=%d" % (
    xml.count('<w:p>') + xml.count('<w:p '),
    new_xml.count('<w:p>') + new_xml.count('<w:p ')))
