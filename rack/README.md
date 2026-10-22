# Remy Lawyer: rack portfolio

A networking-themed portfolio. The page is a server-closet rack. Drag the orange patch cable into a port on the patch panel (or press a port, or use the arrow keys on the cable) to open a section. The switch LEDs light up, the port negotiates a link, and the display loads the content for that VLAN.

| Port | Section |
|------|---------|
| 1 | Certificates and diploma |
| 2 | Resume |
| 3 | Projects |
| 4 | Contact |

Pull the cable out and the link drops. Sections are shareable: `/#resume`, `/#contact`, and so on.

## Run locally

The site loads `data/data.json`, so serve it over http:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Edit your content

Everything lives in **`data/data.json`**: profile text, education, certificates, jobs, projects and contact details. The website and the PDF resume both read from it.

- Replace the two placeholder entries in `projects` with real ones (set `"placeholder": false` or delete the key).
- UberEats is optional. Set `"showUberEats": false` to hide it from the site and the PDF.
- The WorkCon, Better Traffic Solutions and UberEats descriptions are short drafts. Rewrite them in your own words.
- Certificates live in `certs` (grouped by the `group` field). To add one, drop the PDF in `assets/certs/` and add an entry with a `file` path. `resumeOrder` marks which qualifications appear in the resume sidebar.
- Cert PDFs show your certificate IDs and QR codes. Remove any you don't want public.

## Rebuild the PDF resume

Requires [wkhtmltopdf](https://wkhtmltopdf.org).

```bash
python3 resume/build_resume.py
```

This regenerates `resume/resume.html` and `resume/Remy_Lawyer_Resume.pdf`. The resume uses `PAGE1_JOBS` in the script to decide how many roles sit on page 1.

## Deploy on GitHub Pages

1. Create a new GitHub repo and push this folder to `main`.
2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) publishes the site on every push.

## Structure

```
index.html            page shell: rack, patch panel, switch, display, cable
css/style.css         hardware styling and responsive layout
js/app.js             cable physics, port logic, section views, routing
data/data.json        all content (single source for site and resume)
resume/               PDF resume and the script that builds it
assets/remy.jpg       profile photo
assets/certs/         certificate PDFs linked from the site
```

Privacy note: your phone number and email are public once the site is live. Remove them from `data/data.json` if you would rather not publish them.
