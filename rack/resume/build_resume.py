#!/usr/bin/env python3
"""Builds resume/resume.html and Remy_Lawyer_Resume.pdf from data/data.json.
Requires wkhtmltopdf (https://wkhtmltopdf.org). Usage: python3 resume/build_resume.py"""
import json, html, pathlib, subprocess, datetime
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data/data.json").read_text(encoding="utf-8"))
e = html.escape
PAGE1_JOBS = 4  # how many roles fit on page 1 beside the sidebar

jobs = [j for j in D["jobs"] if D.get("showUberEats", True) or j.get("optional") != "uber"]

def job(j):
    led = '<span class="led"></span>' if j.get("current") else ""
    return (f'<div class="job"><div class="role">{e(j["role"])}</div>'
            f'<table class="ot"><tr><td class="org">{led}{e(j["org"])}</td><td class="dt">{e(j["dates"])}</td></tr></table>'
            f'<div class="tx">{e(j["text"])}</div></div>')

def edu(x):
    return (f'<div class="ed"><b>{e(x["school"])}</b><br><span class="dm">{e(x["dates"])}</span><br>'
            f'<span class="sm">{e(x["detail"])}</span></div>')

quals = [c["name"] for c in sorted((c for c in D["certs"] if c.get("resumeOrder")), key=lambda c: c["resumeOrder"])]
quals.append("Will Pass National Police Check")
cisco = [x for x in D["certs"] if x.get("file")]
def cert_cell(x):
    who = "" if x["issuer"] == "Cisco Networking Academy" else f'{e(x["issuer"])}, '
    return (f'<div class="cc"><b>{e(x["name"])}</b><br><span class="dm">{who}{datetime.datetime.strptime(x["year"], "%d %b %Y").strftime("%m/%y")}</span></div>')
SPLIT = 7  # first 7 are networking and IT support, the rest are AI
cisco_html = ('<div class="blk"><h2>IT Certifications</h2><div class="dm" style="margin:-2px 0 6px 12px">Cisco Networking Academy, 12 completed</div>'
              '<table class="ct"><tr><td><div class="gl">Networking and IT support</div>' + "".join(cert_cell(x) for x in cisco[:SPLIT])
              + '</td><td><div class="gl">Artificial intelligence</div>' + "".join(cert_cell(x) for x in cisco[SPLIT:]) + '</td></tr></table></div>')
c = D["contact"]
css = """
@page{size:A4;margin:0}*{box-sizing:border-box}
body{zoom:1.32;margin:0;font-family:Carlito,Calibri,'Liberation Sans',sans-serif;font-size:10.5pt;color:#17232c;line-height:1.4}
.page{width:210mm;height:296mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.hdr{background:#17232c;padding:11mm 14mm 0 14mm;height:42mm}
.hdr table{width:100%;border-collapse:collapse}.n{font-size:30pt;font-weight:bold;color:#fff;letter-spacing:2px}
.h{font-size:12.5pt;color:#7fc4ee;margin-top:2px}.ph{width:30mm;text-align:right}.ph img{width:27mm;height:27mm;border-radius:50%;border:2px solid #f28a1f}
.cab{height:2mm;background:#f28a1f;margin-top:-0.5mm}
.mini{height:24mm;padding:7mm 14mm 0}.mini .n{font-size:18pt}
.body{width:100%;border-collapse:collapse;table-layout:fixed}.side{width:68mm;background:#e3e7e8;vertical-align:top;padding:8mm 7mm;height:250mm}
.main{vertical-align:top;padding:8mm 12mm 0 10mm}
h2{font-size:11.5pt;margin:0 0 6px;padding-left:8px;border-left:4px solid #f28a1f;color:#17232c;letter-spacing:.5px}
.blk{margin-bottom:16px}.lab{font-size:8.5pt;color:#5b6a72}.ed{margin-bottom:9px;font-size:9.5pt}.dm{color:#5b6a72;font-size:9pt}.sm{font-size:9pt}
ul{margin:0;padding-left:15px;font-size:9.5pt}li{margin-bottom:4px}
.prof{font-size:10pt;text-align:justify}
.job{margin-bottom:10px;padding-left:9px;border-left:2px solid #c9d1d4;page-break-inside:avoid}
.role{font-size:9pt;color:#5b6a72}.ot{width:100%;border-collapse:collapse}.org{font-weight:bold;font-size:10.5pt}.dt{text-align:right;font-weight:bold;color:#17232c;font-size:9.5pt;white-space:nowrap}
.tx{font-size:9.5pt;color:#2b3b45}.led{display:inline-block;width:7px;height:7px;border-radius:50%;background:#35d07f;margin-right:6px}
.ct{width:100%;border-collapse:collapse}.ct td{width:50%;vertical-align:top;padding-right:8px}.gl{font-size:9pt;font-weight:bold;color:#2b3b45;margin:0 0 4px 0}.cc{margin-bottom:4px;font-size:9.5pt;line-height:1.25;padding-left:9px;border-left:2px solid #35d07f}
.full{padding:6mm 14mm 0 14mm}.port{display:inline-block;width:9px;height:9px;background:#10181d;border:1px solid #56636b;margin-left:4px}
"""
side = (f'<div class="blk"><h2>Contact</h2><div class="lab">Phone</div><b>{e(c["phone"])}</b><div class="lab" style="margin-top:5px">Email</div><b style="font-size:9.5pt">{e(c["email"])}</b>'
        f'<div class="lab" style="margin-top:5px">Location</div><b>{e(c["location"])}</b></div>'
        f'<div class="blk"><h2>Education</h2>{"".join(edu(x) for x in D["education"])}</div>'
        f'<div class="blk"><h2>Licenses &amp; Qualifications</h2><ul>{"".join(f"<li>{e(q)}</li>" for q in quals)}</ul></div>'
        f'<div class="blk"><h2>References</h2><span style="font-size:9.5pt">Available upon request</span></div>')
main = (f'<div class="blk"><h2>Profile</h2><div class="prof">{e(D["profile"])}</div></div>{cisco_html}<h2>Work Experience</h2>' + "".join(job(j) for j in jobs[:PAGE1_JOBS]))
doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="page"><div class="hdr"><table><tr><td><div class="n">REMY LAWYER</div><div class="h">{e(D["headline"])}</div></td>
<td class="ph"><img src="../{D["photo"]}"></td></tr></table></div><div class="cab"></div>
<table class="body"><tr><td class="side">{side}</td><td class="main">{main}</td></tr></table></div>
<div class="page"><div class="hdr mini" style="height:24mm"><div class="n" style="font-size:18pt">REMY LAWYER</div><div class="h" style="font-size:10pt">Work Experience (continued)</div></div><div class="cab"></div>
<div class="full">{"".join(job(j) for j in jobs[PAGE1_JOBS:])}</div></div></body></html>"""
out = ROOT / "resume"
(out / "resume.html").write_text(doc, encoding="utf-8")
subprocess.run(["wkhtmltopdf", "--quiet", "--enable-local-file-access", "--page-size", "A4", "-T", "0", "-B", "0", "-L", "0", "-R", "0",
                str(out / "resume.html"), str(out / "Remy_Lawyer_Resume.pdf")], check=True)
print("Built", out / "Remy_Lawyer_Resume.pdf")
