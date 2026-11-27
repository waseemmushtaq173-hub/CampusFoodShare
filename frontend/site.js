/* CampusFoodShare public website. Talks to the backend API; nothing is stored in the browser except the donor's own tracking links. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EMOJI = { Veg: '🍛', 'Non-Veg': '🍗', Vegan: '🥗', Bakery: '🥖' };
  const KEY = 'cf_site_donations';

  async function api(path, opts = {}) {
    try {
      const res = await fetch(path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
      let data = {};
      try { data = await res.json(); } catch (e) { /* empty body */ }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Cannot reach the server. Please check your connection and try again.' } };
    }
  }
  const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const store = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 20))); } catch (e) { /* ignore */ } };

  function when(iso) {
    const d = new Date(iso);
    const ms = d - Date.now();
    const clock = d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    if (ms <= 0) return `${clock} (expired)`;
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `${clock} (${h ? `${h}h ` : ''}${m}m left)`;
  }
  const countUp = (el, to) => {
    const n = Number(to) || 0, start = performance.now();
    el.textContent = n.toLocaleString(); // always show the real number first
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const step = (t) => { const k = Math.min(1, (t - start) / 700); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ── live numbers ── */
  async function loadImpact() {
    const [imp, meta] = await Promise.all([api('/api/impact'), api('/api/meta')]);
    if (imp.ok) {
      const m = imp.data.metrics;
      countUp($('#meal-count'), m.totalMealsSaved); countUp($('#listing-count'), m.activeListingsCount); countUp($('#partner-count'), m.partners);
    }
    const sample = meta.ok && meta.data.demo;
    $('#demo-flag').textContent = sample ? 'Sample data' : 'Live from the platform';
    $('#listing-subtitle').textContent = sample ? 'Sample listings • Updated automatically' : 'Live listings • Updated automatically';
  }

  /* ── available food ── */
  async function loadListings() {
    const r = await api('/api/listings?status=posted');
    const box = $('#listings');
    if (!r.ok) { box.innerHTML = '<p class="empty-note">Could not load listings right now. Please try again in a moment.</p>'; return; }
    const items = r.data.listings.slice(0, 9);
    box.innerHTML = items.map((l) => {
      const phone = String(l.donorPhone || '').replace(/[^\d+]/g, '');
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}`;
      return `<article class="listing-card">
        <div class="listing-top"><div class="food-emoji">${EMOJI[l.foodType] || '🍲'}</div><span class="status">Available</span></div>
        <h3>${esc(l.foodTitle)}</h3><div class="food-meta">${esc(l.foodType)}${l.notes ? ' • ' + esc(l.notes) : ''}</div>
        <div class="listing-details"><span>▦ <b>${esc(l.quantityMeals)} meals</b></span><span>◷ Pickup by <b>${esc(when(l.useBefore))}</b></span><span>⌖ ${esc(l.location.address)}</span></div>
        <div class="listing-bottom"><span class="donor">Shared by ${esc(l.donorName)}</span><span class="btn-row">${phone ? `<a class="contact-btn" href="tel:${esc(phone)}">Call ↗</a>` : ''}<a class="contact-btn alt" href="${dir}" target="_blank" rel="noopener">Directions</a></span></div>
      </article>`;
    }).join('') || '<p class="empty-note">No food is listed right now. <a href="#donate">Be the first to share</a>.</p>';
  }

  async function loadHelplines() {
    const r = await api('/api/directory');
    if (!r.ok) return;
    $('#helplines').innerHTML = r.data.directory.map((h) => `<div class="helpline"><div><strong>${esc(h.name)}</strong><span>${esc(h.area)} • ${esc(h.hours)}</span></div><a class="contact-btn" href="tel:${esc(String(h.phone).replace(/[^\d+]/g, ''))}">${esc(h.phone)}</a></div>`).join('');
  }

  /* ── donate without an account ── */
  const form = $('#donation-form');
  const pad = (n) => String(n).padStart(2, '0');
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  function resetDeadline() {
    const now = new Date();
    form.elements.useBefore.min = local(now);
    form.elements.useBefore.max = local(new Date(now.getTime() + 24 * 3600000));
    form.elements.useBefore.value = local(new Date(now.getTime() + 3 * 3600000));
  }
  resetDeadline();

  let point = null;
  $('#geo-btn').addEventListener('click', () => {
    const status = $('#geo-status');
    if (!navigator.geolocation) { status.textContent = 'Location is not available in this browser. We will use the campus centre.'; return; }
    status.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { point = { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) }; status.textContent = `Location saved (±${Math.round(pos.coords.accuracy)} m). Volunteers will get directions to this spot.`; status.classList.add('ok'); },
      () => { point = null; status.textContent = 'We could not get your location. Allow location access, or just continue: we will use the campus centre.'; },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });

  const showError = (msg) => { const e = $('#form-error'); e.textContent = msg; e.hidden = !msg; };
  form.addEventListener('input', () => showError(''));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    if (!form.elements.safetyConfirmed.checked) return showError('Please confirm the food safety statement before posting.');
    const f = form.elements;
    const body = {
      foodTitle: f.foodTitle.value.trim(), foodType: f.foodType.value, quantityMeals: Number(f.quantityMeals.value), useBefore: new Date(f.useBefore.value).toISOString(),
      address: f.address.value.trim(), donorName: f.donorName.value.trim(), phone: f.phone.value.trim(), notes: f.notes.value.trim(), safetyConfirmed: true, website: f.website.value,
      ...(point || {}),
    };
    const btn = form.querySelector('.submit-button');
    btn.disabled = true; btn.firstChild.textContent = 'Posting… ';
    const r = await api('/api/public/donations', { method: 'POST', body });
    btn.disabled = false; btn.firstChild.textContent = 'Post food donation ';
    if (!r.ok) return showError((r.data.details || [r.data.error || 'Something went wrong. Please try again.']).join('. '));
    const d = r.data;
    if (d.id) {
      store([{ id: d.id, token: d.token, title: body.foodTitle, at: Date.now() }, ...saved().filter((x) => x.id !== d.id)]);
      const link = `${location.origin}/?track=${d.id}.${d.token}`;
      $('#donation-success').innerHTML = `<div class="success-mark">✓</div><h3>Thank you! Your food is live.</h3>
        <p>${esc(d.message)}</p>${d.approximateLocation ? '<p class="soft">Your pickup is shown near the campus centre. Add details in your tracking page or call a team if the spot is hard to find.</p>' : ''}
        <label class="link-box">Your private tracking link<input readonly value="${esc(link)}" id="track-link" /></label>
        <div class="success-actions"><button class="button primary" type="button" id="copy-link">Copy link</button><a class="button ghost" href="#my-donations">Track my donation</a><button class="button ghost" type="button" id="donate-again">Share more food</button></div>`;
      form.hidden = true; $('#donation-success').hidden = false;
      $('#copy-link').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(link); e.target.textContent = 'Copied'; } catch (err) { $('#track-link').select(); } });
      $('#donate-again').addEventListener('click', () => { form.reset(); resetDeadline(); point = null; $('#geo-status').textContent = 'Optional. Without it we show your pickup as near the campus centre.'; form.hidden = false; $('#donation-success').hidden = true; });
    }
    refreshAll();
  }) ;

  /* ── donor tracker ── */
  async function renderTracker() {
    const list = saved();
    const section = $('#my-donations');
    section.hidden = !list.length;
    if (!list.length) return;
    const cards = await Promise.all(list.map(async (s) => {
      const r = await api(`/api/public/donations/${encodeURIComponent(s.id)}?token=${encodeURIComponent(s.token)}`);
      if (!r.ok) return `<article class="tracker-card gone"><h3>${esc(s.title)}</h3><p class="soft">This donation is no longer on the platform (it was withdrawn or removed).</p><button class="mini-btn" data-forget="${esc(s.id)}">Remove from this list</button></article>`;
      const d = r.data.donation, c = d.claimedBy;
      const stage = d.status === 'collected' ? 3 : d.status === 'claimed' ? 2 : d.status === 'expired' ? 0 : 1;
      const step = (n, label) => `<li class="${stage >= n ? 'done' : ''}">${label}</li>`;
      const pin = d.handoverCode ? `<div class="pin-box"><span>Handover PIN</span><strong>${esc(d.handoverCode)}</strong><small>Give this only to the volunteer when they arrive.</small></div>` : '';
      const who = c ? `<p class="who"><b>${esc(c.ngoName)}</b> is collecting. Volunteer: <b>${esc(c.volunteerName)}</b>${c.volunteerPhone ? ` • <a href="tel:${esc(String(c.volunteerPhone).replace(/[^\d+]/g, ''))}">${esc(c.volunteerPhone)}</a>` : ''}</p>` : '';
      const note = d.status === 'posted' ? '<p class="soft">Waiting for a nearby NGO or volunteer to claim it. You will see their details here.</p>' : d.status === 'expired' ? '<p class="soft">The pickup deadline passed before anyone collected this food.</p>' : d.status === 'collected' ? '<p class="soft">Collected and counted in our impact. Thank you for sharing!</p>' : '';
      return `<article class="tracker-card"><div class="tc-top"><h3>${esc(d.foodTitle)}</h3><span class="status s-${esc(d.status)}">${esc(d.status)}</span></div>
        <p class="soft">${esc(d.quantityMeals)} meals • ${esc(d.address)} • pickup by ${esc(when(d.useBefore))}</p>
        <ol class="timeline"><li class="done">Posted</li>${step(2, 'Claimed')}${step(3, 'Collected')}</ol>${who}${pin}${note}
        <div class="tc-actions">${d.status === 'posted' ? `<button class="mini-btn danger" data-withdraw="${esc(s.id)}">Withdraw this listing</button>` : ''}${d.status !== 'posted' && d.status !== 'claimed' ? `<button class="mini-btn" data-forget="${esc(s.id)}">Remove from list</button>` : ''}</div></article>`;
    }));
    $('#my-donations-list').innerHTML = cards.join('');
  }
  $('#my-donations-list').addEventListener('click', async (e) => {
    const f = e.target.closest('[data-forget]');
    if (f) { store(saved().filter((x) => x.id !== f.dataset.forget)); return renderTracker(); }
    const w = e.target.closest('[data-withdraw]');
    if (w && confirm('Withdraw this listing? NGOs will no longer see it.')) {
      const s = saved().find((x) => x.id === w.dataset.withdraw);
      w.disabled = true;
      const r = await api(`/api/public/donations/${encodeURIComponent(s.id)}/withdraw`, { method: 'POST', body: { token: s.token } });
      if (!r.ok) alert(r.data.error || 'Could not withdraw this listing.');
      refreshAll();
    }
  });

  /* ── contact ── */
  const cf = $('#contact-form');
  cf.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = $('#contact-msg');
    msg.className = 'contact-msg'; msg.textContent = '';
    if (!cf.reportValidity()) return;
    const btn = cf.querySelector('button'); btn.disabled = true;
    const r = await api('/api/public/contact', { method: 'POST', body: { name: cf.elements.name.value, email: cf.elements.email.value, message: cf.elements.message.value, website: cf.elements.website.value } });
    btn.disabled = false;
    if (r.ok) { msg.textContent = r.data.message; msg.classList.add('ok'); cf.reset(); }
    else { msg.textContent = (r.data.details || [r.data.error || 'Could not send your message.']).join('. '); msg.classList.add('bad'); }
  });

  /* ── open a tracking link (?track=id.token) ── */
  const t = new URLSearchParams(location.search).get('track');
  if (t && t.includes('.')) {
    const [id, token] = t.split('.');
    if (id && token && !saved().some((x) => x.id === id)) store([{ id, token, title: 'Your donation', at: Date.now() }, ...saved()]);
    history.replaceState(null, '', location.pathname + '#my-donations');
  }

  /* ── keep everything live ── */
  let timer = null;
  function refreshAll() { clearTimeout(timer); timer = setTimeout(() => { loadImpact(); loadListings(); renderTracker(); }, 200); }
  loadHelplines();
  refreshAll();
  setInterval(refreshAll, 30000);
  try { new EventSource('/api/stream').addEventListener('update', refreshAll); } catch (e) { /* live updates are optional */ }
  if (location.hash === '#my-donations') setTimeout(() => $('#my-donations').scrollIntoView(), 600);
})();
