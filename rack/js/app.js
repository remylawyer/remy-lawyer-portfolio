/* Rack portfolio: drag the cable into a patch panel port to open a section. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const SECTIONS = [
  { key: 'certificates', label: 'Certificates', vlan: 10 },
  { key: 'resume', label: 'Resume', vlan: 20 },
  { key: 'projects', label: 'Projects', vlan: 30 },
  { key: 'contact', label: 'Contact', vlan: 40 },
];
const box = $('#closet'), plug = $('#plug'), view = $('#view'), statusEl = $('#status');
let D, cur = -1, P = { x: 0, y: 0 }, dragging = false, seq = 0, raf = 0;

const center = e => { const b = box.getBoundingClientRect(), r = e.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; };
const seat = i => { const c = center(ports[i].jack); return { x: c.x, y: c.y + 10 }; };
const rest = () => { const n = center($('#nic')); return innerWidth > 820 ? { x: n.x - 40, y: n.y + 70 } : { x: n.x + 60, y: n.y + 22 }; };

function draw() {
  const A = center($('#nic')), sag = Math.min(70, 20 + Math.hypot(P.x - A.x, P.y - A.y) * 0.18);
  const d = `M${A.x},${A.y} C${A.x + 30},${A.y + sag} ${P.x},${P.y + sag} ${P.x},${P.y + 24}`;
  $('#cable').setAttribute('d', d); $('#shadow').setAttribute('d', d);
  plug.setAttribute('transform', `translate(${P.x},${P.y})`);
}
function glide(to) {
  cancelAnimationFrame(raf);
  return new Promise(res => {
    if (reduce) { P = { ...to }; draw(); return res(); }
    (function step() {
      P.x += (to.x - P.x) * 0.2; P.y += (to.y - P.y) * 0.2; draw();
      if (Math.hypot(to.x - P.x, to.y - P.y) < 0.8) { P = { ...to }; draw(); res(); } else raf = requestAnimationFrame(step);
    })();
  });
}

/* Build patch panel ports and switch ports */
const ports = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.className = 'port'; b.type = 'button';
  b.innerHTML = `<i class="led"></i>${esc(s.label)}<span class="jack"></span><b>Port ${i + 1}</b>`;
  b.setAttribute('aria-label', `Plug the cable into port ${i + 1}: ${s.label}`);
  b.onclick = () => connect(i);
  $('#ports').append(b);
  return { btn: b, jack: $('.jack', b) };
});
const sw = $('#sw'); for (let i = 0; i < 12; i++) sw.append(document.createElement('i'));
const swLeds = [...sw.children];
setInterval(() => { if (!reduce) swLeds.forEach((l, i) => { if (i > 3) l.classList.toggle('act', Math.random() < .25); }); }, 450);

function setStatus(t) { statusEl.textContent = t; }
function unlink() {
  seq++;
  if (cur >= 0) { ports[cur].btn.classList.remove('up', 'neg'); swLeds[cur].classList.remove('on'); ports[cur].btn.removeAttribute('aria-current'); }
  cur = -1; view.innerHTML = '<p>Drag the orange cable into a port on the patch panel, or press a port.</p>';
  setStatus('Gi0/1 to Gi0/4: no cable detected');
}

async function connect(i) {
  const my = ++seq, s = SECTIONS[i];
  if (cur >= 0 && cur !== i) { ports[cur].btn.classList.remove('up'); swLeds[cur].classList.remove('on'); }
  cur = i;
  await glide(seat(i)); if (my !== seq) return;
  ports[i].btn.classList.add('neg'); setStatus(`Gi0/${i + 1} negotiating speed and duplex...`);
  await wait(650); if (my !== seq) return;
  ports[i].btn.classList.remove('neg'); ports[i].btn.classList.add('up'); ports[i].btn.setAttribute('aria-current', 'true'); swLeds[i].classList.add('on');
  setStatus(`Gi0/${i + 1} is up, 1000 Mbps, full duplex, VLAN ${s.vlan} (${s.label})`);
  view.innerHTML = renders[s.key](); history.replaceState(null, '', '#' + s.key);
  document.title = `${s.label} | Remy Lawyer`; bind(s.key);
}

/* Section views, all driven by data/data.json */
const renders = {
  certificates: () => {
    const groups = [...new Set(D.certs.map(c => c.group))];
    return `<h3>Certificates and diploma</h3><p>${D.certs.length} credentials. Open a certificate to see the original PDF.</p>` + groups.map(g =>
      `<h4>${esc(g)}</h4><div class="cards">${D.certs.filter(c => c.group === g).map(c =>
        `<article class="card ${c.status}"><h3>${esc(c.name)}</h3><small>${esc([c.issuer, c.year].filter(Boolean).join(', '))}</small><small>${esc(c.note)}</small>${c.file ? `<a href="${esc(c.file)}" target="_blank" rel="noopener">View certificate (PDF)</a>` : ''}</article>`).join('')}</div>`).join('');
  },
  resume: () => {
    const jobs = D.jobs.filter(j => D.showUberEats || j.optional !== 'uber');
    return `<h3>${esc(D.name)}</h3><p>${esc(D.profile)}</p><a class="btn" href="resume/Remy_Lawyer_Resume.pdf" download>Download PDF resume</a>
    <h4>Education</h4>${D.education.map(e => `<details><summary><b>${esc(e.school)}</b><time>${esc(e.dates)}</time></summary><p>${esc(e.detail)}</p></details>`).join('')}
    <h4>Work experience</h4>${jobs.map((j, n) => `<details ${n < 4 ? 'open' : ''}><summary><span>${j.current ? '<i class="dot" title="Current"></i>' : ''}<b>${esc(j.role)}</b> at ${esc(j.org)}</span><time>${esc(j.dates)}</time></summary><p>${esc(j.text)}</p></details>`).join('')}`;
  },
  projects: () => `<h3>Projects</h3><p>Builds and lab work.</p><div class="cards">${D.projects.map(p =>
    `<article class="card ${p.placeholder ? 'placeholder' : ''}"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${p.placeholder ? '<small>Placeholder. Edit data/data.json.</small>' : ''}</article>`).join('')}</div>`,
  contact: () => `<h3>Contact</h3><dl class="rows"><dt>Email</dt><dd><a href="mailto:${esc(D.contact.email)}">${esc(D.contact.email)}</a></dd>
    <dt>Phone</dt><dd><a href="tel:${esc(D.contact.phone.replace(/\s/g, ''))}">${esc(D.contact.phone)}</a></dd><dt>Location</dt><dd>${esc(D.contact.location)}</dd></dl>
    <button class="btn" id="ping" type="button">Ping Remy</button><pre id="out" aria-live="polite"></pre>`,
};
function bind(key) {
  if (key !== 'contact') return;
  $('#ping').onclick = async () => {
    const out = $('#out'); out.textContent = `Pinging ${D.contact.email}...\n`;
    for (let n = 0; n < 4; n++) { await wait(380); out.textContent += `Reply from inbox: seq=${n} time<1ms\n`; }
    out.insertAdjacentHTML('beforeend', `<a href="mailto:${esc(D.contact.email)}">Reply received. Write your message</a>`);
  };
}

/* Dragging, keyboard and routing */
const at = e => { const b = box.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
plug.addEventListener('pointerdown', e => { dragging = true; plug.setPointerCapture(e.pointerId); plug.classList.add('drag'); cancelAnimationFrame(raf); plug.parentNode.classList.remove('nudge'); if (cur >= 0) unlink(); P = at(e); draw(); e.preventDefault(); });
plug.addEventListener('pointermove', e => { if (dragging) { P = at(e); draw(); } });
plug.addEventListener('pointerup', () => {
  if (!dragging) return; dragging = false; plug.classList.remove('drag');
  const near = ports.map((p, i) => [Math.hypot(seat(i).x - P.x, seat(i).y - P.y), i]).sort((a, b) => a[0] - b[0])[0];
  near[0] < 60 ? connect(near[1]) : glide(rest());
});
plug.addEventListener('keydown', e => {
  const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (k) { e.preventDefault(); connect((cur + k + 4) % 4); }
  if (e.key === 'Escape') { unlink(); glide(rest()); }
});
const place = () => { if (!dragging) { P = cur >= 0 ? seat(cur) : rest(); draw(); } };
addEventListener('resize', place);

fetch('data/data.json').then(r => r.json()).then(d => {
  D = d; unlink(); place();
  const i = SECTIONS.findIndex(s => '#' + s.key === location.hash);
  if (i >= 0) connect(i); else plug.parentNode.classList.add('nudge');
}).catch(() => { view.innerHTML = '<p>Could not load data/data.json. Serve this folder over http (for example <code>python3 -m http.server</code>) instead of opening the file directly.</p>'; });
addEventListener('hashchange', () => { const i = SECTIONS.findIndex(s => '#' + s.key === location.hash); if (i >= 0 && i !== cur) connect(i); });
