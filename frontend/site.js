/* CampusFoodShare public website. Talks to the backend API; nothing is stored in the browser except the donor's own tracking links. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EMOJI = { Veg: '🍛', 'Non-Veg': '🍗', Vegan: '🥗', Bakery: '🥖' };
  const KEY = 'cf_site_donations';

  async function api(path, opts = {}) {
    try {
      const res = await fetch(path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
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
  let seenIds = null;
  function liveToast(text) {
    const t = document.createElement('div');
    t.className = 'live-toast'; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 7000);
  }
  let viewer = null, sortBy = 'new', showAll = false;
  const km = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
  async function loadListings() {
    const q = viewer ? `&lat=${viewer.lat}&lng=${viewer.lng}` : '';
    const r = await api('/api/listings?status=posted' + q);
    const box = $('#listings');
    if (!r.ok) { box.innerHTML = '<p class="empty-note">Could not load listings right now. Please try again in a moment.</p>'; return; }
    const all = [...r.data.listings];
    all.sort(sortBy === 'near' && viewer ? (a, b) => a.distanceKm - b.distanceKm : (a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // anything that appeared since the last refresh was posted just now: highlight it and say so
    const ids = all.map((l) => l.id);
    const fresh = seenIds ? ids.filter((id) => !seenIds.has(id)) : [];
    seenIds = new Set(ids);
    if (fresh.length) { const n = all.find((x) => x.id === fresh[0]); liveToast(`New food just posted: ${n.foodTitle} (${n.quantityMeals} meals, ${n.donorName})`); }
    const items = showAll ? all : all.slice(0, 12);
    const from = viewer ? 'from you' : 'from campus centre';
    const more = $('#show-all');
    more.hidden = all.length <= 12;
    more.textContent = showAll ? 'Show fewer' : `Show all ${all.length} listings`;
    box.innerHTML = items.map((l) => {
      const phone = String(l.donorPhone || '').replace(/[^\d+]/g, '');
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}`;
      return `<article class="listing-card ${fresh.includes(l.id) ? 'fresh' : ''}">
        <div class="listing-top"><div class="food-emoji">${EMOJI[l.foodType] || '🍲'}</div><span class="status">${fresh.includes(l.id) ? 'Just posted' : 'Available'}</span></div>
        <h3>${esc(l.foodTitle)}</h3><div class="food-meta">${esc(l.foodType)}${l.notes ? ' • ' + esc(l.notes) : ''}</div>
        <div class="listing-details"><span>▦ <b>${esc(l.quantityMeals)} meals</b>${l.weightKg ? ` (${esc(l.weightKg)} kg)` : ''}</span><span>◷ Pickup by <b>${esc(when(l.useBefore))}</b></span><span>⌖ ${esc(l.location.address)}</span>${typeof l.distanceKm === 'number' ? `<span>➜ <b>${km(l.distanceKm)}</b> ${from}</span>` : ''}${l.targetOrgName && Date.parse(l.directedUntil) > Date.now() ? `<span>★ Reserved for <b>${esc(l.targetOrgName)}</b></span>` : ''}</div>
        <div class="listing-bottom"><span class="donor">Shared by ${esc(l.donorName)}</span><span class="btn-row">${phone ? `<a class="contact-btn" href="tel:${esc(phone)}">Call ↗</a>` : ''}<a class="contact-btn alt" href="${dir}" target="_blank" rel="noopener">Directions</a></span></div>
      </article>`;
    }).join('') || '<p class="empty-note">No food is listed right now. <a href="#donate">Be the first to share</a>.</p>';
  }
  function setSort(mode) {
    sortBy = mode;
    $('#sort-new').classList.toggle('active', mode === 'new');
    $('#sort-near').classList.toggle('active', mode === 'near');
    loadListings();
  }
  $('#sort-new').addEventListener('click', () => setSort('new'));
  $('#sort-near').addEventListener('click', () => {
    if (viewer) return setSort('near');
    const note = $('#listing-loc');
    if (!navigator.geolocation) { note.textContent = 'Location is not available in this browser.'; return; }
    note.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { viewer = { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) }; note.textContent = 'Distances are from your location.'; setSort('near'); },
      () => { note.textContent = 'Allow location access to see how far each place is. Distances now are from the campus centre.'; },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
  $('#show-all').addEventListener('click', () => { showAll = !showAll; loadListings(); });

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
  let chosenOrg = '';
  $('#geo-btn').addEventListener('click', () => {
    const status = $('#geo-status');
    if (!navigator.geolocation) { status.textContent = 'Location is not available in this browser. We will use the campus centre.'; return; }
    status.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { point = { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) }; status.textContent = `Location saved (±${Math.round(pos.coords.accuracy)} m). Volunteers will get directions to this spot.`; status.classList.add('ok'); updateMatches(); },
      () => { point = null; status.textContent = 'We could not get your location. Allow location access, or just continue: we will use the campus centre.'; },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });


  /* ── where can I donate this? ── */
  const kgFromForm = () => { const q = Number(form.elements.quantity.value); return form.elements.unit.value === 'kg' ? q : q * 0.35; };
  let matchTimer = null;
  function updateMatches() { clearTimeout(matchTimer); matchTimer = setTimeout(runMatch, 400); }
  async function runMatch() {
    const panel = $('#match-panel');
    const kg = kgFromForm();
    const type = form.elements.foodType.value;
    if (!(kg >= 0.5)) { panel.hidden = true; chosenOrg = ''; return; }
    const q = new URLSearchParams({ kg: kg.toFixed(2) });
    if (type) q.set('foodType', type);
    if ($('#mp-type').value) q.set('type', $('#mp-type').value);
    if (point) { q.set('lat', point.lat); q.set('lng', point.lng); }
    const r = await api(`/api/match?${q}`);
    panel.hidden = false;
    if (!r.ok) { $('#mp-list').innerHTML = ''; $('#mp-sub').textContent = ''; $('#mp-note').textContent = r.data.error || 'Could not check where to donate right now.'; return; }
    const d = r.data;
    $('#mp-sub').textContent = `${d.request.kg} kg ≈ ${d.request.meals} meals${type ? ' • ' + type : ''}${point ? '' : ' • distance from the campus centre'}`;
    const top = d.matches.slice(0, 4);
    if (!top.some((m) => m.organization.id === chosenOrg)) chosenOrg = '';
    const opt = (id, title, body, checked) => `<label class="mp-card ${checked ? 'on' : ''}"><input type="radio" name="targetOrg" value="${esc(id)}" ${checked ? 'checked' : ''} /><span class="mp-body"><span class="mp-title">${title}</span>${body}</span></label>`;
    $('#mp-list').innerHTML = top.map((m, i) => {
      const o = m.organization;
      const tags = [`<span class="chip">${esc(o.type)}</span>`, m.takesAll ? '<span class="chip ok">Can take all</span>' : `<span class="chip warn">Can take ${esc(m.canTakeKg)} kg</span>`, m.openNow ? '<span class="chip ok">Open now</span>' : '<span class="chip warn">Closed now</span>', i === 0 ? '<span class="chip best">Best match</span>' : ''].join('');
      return opt(o.id, `<strong>${esc(o.name)}</strong> ${tags}`, `<small>${esc(m.distanceKm)} km • ${esc(m.reasons.filter((x) => /needs|Needs/.test(x)).join('') || '')} • ${esc(o.canPickup ? 'Can send a volunteer' : 'Drop-off only')} • ${esc(o.phone)}</small>${m.warnings.length ? `<small class="warn-line">${esc(m.warnings.join('. '))}</small>` : ''}`, o.id === chosenOrg);
    }).join('') + opt('', '<strong>Let any nearby team claim it</strong>', '<small>Best when you are unsure. Posted for every NGO and volunteer.</small>', !chosenOrg);
    $('#mp-note').textContent = (d.plan.length ? 'Suggested split: ' + d.summary.replace(/^.*Suggested split: /, '') + ' Post one donation per place.' : d.summary) + (d.excluded.length ? ` Not suggested: ${d.excluded.slice(0, 3).map((e) => e.organization.name).join(', ')} (${d.excluded[0].reason.toLowerCase()}).` : '');
  }
  $('#mp-type').addEventListener('change', runMatch);
  ['quantity', 'unit', 'foodType'].forEach((n) => form.elements[n].addEventListener('input', updateMatches));
  $('#mp-list').addEventListener('change', () => { const sel = $('#mp-list').querySelector('input:checked'); chosenOrg = sel ? sel.value : ''; $('#mp-list').querySelectorAll('.mp-card').forEach((c) => c.classList.toggle('on', c.querySelector('input').checked)); });

  /* ── ashrams, homes and NGOs with their live requirements ── */
  let orgs = [], orgFilter = 'All';
  const left = (o) => (o.needLeftKg > 0 ? `Needs about ${o.needLeftKg} kg today` : 'No urgent need left today');
  function renderOrgs() {
    const types = ['All', ...new Set(orgs.map((o) => o.type))];
    $('#org-filters').innerHTML = types.map((t) => `<button type="button" class="chip-btn ${t === orgFilter ? 'on' : ''}" data-type="${esc(t)}">${esc(t)}</button>`).join('');
    const list = orgs.filter((o) => orgFilter === 'All' || o.type === orgFilter);
    $('#org-list').innerHTML = list.map((o) => {
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;
      const pct = Math.min(100, Math.round((o.receivedTodayKg / Math.max(1, o.capacityKgPerDay)) * 100));
      return `<article class="org-card"><div class="oc-top"><span class="chip">${esc(o.type)}</span><span class="chip ${o.openNow ? 'ok' : 'warn'}">${o.openNow ? 'Open now' : 'Closed now'}</span></div>
        <h3>${esc(o.name)}</h3><p class="oc-area">${esc(o.area)} • serves about ${esc(o.peopleServed)} people</p>
        <div class="need-line"><strong>${esc(left(o))}</strong><div class="bar"><i style="width:${pct}%"></i></div><small>${esc(o.receivedTodayKg)} of ${esc(o.capacityKgPerDay)} kg capacity used today</small></div>
        <ul class="oc-facts"><li>Accepts: ${esc(o.acceptsDiets.join(', '))}</li><li>Hours: ${esc(o.hours.open)} to ${esc(o.hours.close)}</li><li>${o.canPickup ? 'Can send a volunteer to collect' : 'Drop-off only'}</li>${o.notes ? `<li class="oc-note">${esc(o.notes)}</li>` : ''}</ul>
        <div class="btn-row"><a class="contact-btn" href="tel:${esc(String(o.phone).replace(/[^\d+]/g, ''))}">Call ↗</a><a class="contact-btn alt" href="${dir}" target="_blank" rel="noopener">Directions</a><button type="button" class="contact-btn" data-donate-to="${esc(o.id)}">Donate here</button></div></article>`;
    }).join('') || '<p class="empty-note">No organisations to show.</p>';
  }
  async function loadOrganizations() { const r = await api('/api/organizations'); if (r.ok) { orgs = r.data.organizations; renderOrgs(); } }
  $('#org-filters').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) { orgFilter = b.dataset.type; renderOrgs(); } });
  $('#org-list').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-donate-to]');
    if (!b) return;
    const o = orgs.find((x) => x.id === b.dataset.donateTo);
    chosenOrg = o.id;
    if (!form.elements.quantity.value) form.elements.quantity.value = Math.max(1, Math.min(50, Math.round(o.needLeftKg || 10)));
    document.getElementById('donate').scrollIntoView({ behavior: 'smooth' });
    await runMatch();
    const radio = $('#mp-list').querySelector(`input[value="${CSS.escape(o.id)}"]`);
    if (radio) { radio.checked = true; $('#mp-list').dispatchEvent(new Event('change')); } else $('#mp-note').textContent = `${o.name} is not in the top suggestions for this food type or amount. Check the type and quantity above.`;
  });


  /* ── signed-in donors post under their own account, right from the website ── */
  let account = null, useAccount = false;
  const ALL_CHECKS = ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'];
  const authToken = () => { try { return localStorage.getItem('cf_token'); } catch (e) { return null; } };
  async function loadAccount() {
    const token = authToken();
    if (!token) return;
    const r = await api('/api/auth/me', { token });
    if (!r.ok || !['donor', 'admin'].includes(r.data.user.role)) return;
    account = r.data.user; useAccount = true;
    form.elements.donorName.value = account.organization || account.name;
    if (account.phone) form.elements.phone.value = account.phone;
    renderAcctBar();
  }
  function renderAcctBar() {
    const bar = $('#acct-bar');
    bar.hidden = !account;
    if (!account) return;
    bar.innerHTML = useAccount
      ? `<span><b>Posting as ${esc(account.name)}</b> (${esc(account.role)}). This food appears on the public list below and in your dashboard.</span><span class="acct-actions"><a href="/app/#/mylistings">My dashboard</a><button type="button" id="acct-guest">Post as a guest instead</button></span>`
      : `<span>You are signed in as <b>${esc(account.name)}</b>.</span><span class="acct-actions"><button type="button" id="acct-use">Post with my account</button></span>`;
    $('#acct-guest') && $('#acct-guest').addEventListener('click', () => { useAccount = false; renderAcctBar(); });
    $('#acct-use') && $('#acct-use').addEventListener('click', () => { useAccount = true; renderAcctBar(); });
  }
  const seeItLive = (title) => { const card = [...document.querySelectorAll('#listings .listing-card')].find((c) => c.querySelector('h3') && c.querySelector('h3').textContent === title); (card || $('#food-listings')).scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const showError = (msg) => { const e = $('#form-error'); e.textContent = msg; e.hidden = !msg; };
  form.addEventListener('input', () => showError(''));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    if (!form.elements.safetyConfirmed.checked) return showError('Please confirm the food safety statement before posting.');
    const f = form.elements;
    const body = {
      foodTitle: f.foodTitle.value.trim(), foodType: f.foodType.value, ...(f.unit.value === 'kg' ? { quantityKg: Number(f.quantity.value) } : { quantityMeals: Number(f.quantity.value) }), ...(chosenOrg ? { targetOrgId: chosenOrg } : {}), useBefore: new Date(f.useBefore.value).toISOString(),
      address: f.address.value.trim(), donorName: f.donorName.value.trim(), phone: f.phone.value.trim(), notes: f.notes.value.trim(), safetyConfirmed: true, website: f.website.value,
      ...(point || {}),
    };
    const btn = form.querySelector('.submit-button');
    btn.disabled = true; btn.firstChild.textContent = 'Posting… ';
    let r;
    if (account && useAccount) {
      const kg = f.unit.value === 'kg' ? Number(f.quantity.value) : 0;
      r = await api('/api/listings', { method: 'POST', token: authToken(), body: {
        donorName: body.donorName, donorPhone: body.phone, foodTitle: body.foodTitle, foodType: body.foodType,
        quantityMeals: kg ? Math.max(1, Math.round(kg / 0.35)) : body.quantityMeals, ...(kg ? { weightKg: kg } : {}),
        useBefore: body.useBefore, notes: body.notes, ...(chosenOrg ? { targetOrgId: chosenOrg } : {}),
        location: { address: body.address, lat: point ? point.lat : 12.9716, lng: point ? point.lng : 77.5946 },
        safetyChecklistConfirmed: true, checklistItems: ALL_CHECKS,
      } });
    } else {
      r = await api('/api/public/donations', { method: 'POST', body });
    }
    btn.disabled = false; btn.firstChild.textContent = 'Post food donation ';
    if (!r.ok) return showError((r.data.details || [r.data.error || 'Something went wrong. Please try again.']).join('. '));
    const d = r.data;
    const liveBtn = `<button class="button primary" type="button" id="see-live">See it live below ↓</button>`;
    const again = () => { form.reset(); resetDeadline(); point = null; chosenOrg = ''; $('#match-panel').hidden = true; $('#geo-status').textContent = 'Optional. Without it we show your pickup as near the campus centre.'; form.hidden = false; $('#donation-success').hidden = true; if (account) loadAccount(); };
    if (d.listing) {
      $('#donation-success').innerHTML = `<div class="success-mark">✓</div><h3>Posted. Everyone can see it now.</h3>
        <p>"${esc(d.listing.foodTitle)}" is live in <b>Available food nearby</b> for NGOs, volunteers and visitors, and it is in your dashboard.</p>
        <div class="success-actions">${liveBtn}<a class="button ghost" href="/app/#/mylistings">Open my dashboard</a><button class="button ghost" type="button" id="donate-again">Share more food</button></div>`;
      form.hidden = true; $('#donation-success').hidden = false;
      $('#donate-again').addEventListener('click', again);
      $('#see-live').addEventListener('click', () => seeItLive(d.listing.foodTitle));
      refreshAll();
      return;
    }
    if (d.id) {
      store([{ id: d.id, token: d.token, title: body.foodTitle, at: Date.now() }, ...saved().filter((x) => x.id !== d.id)]);
      const link = `${location.origin}/?track=${d.id}.${d.token}`;
      $('#donation-success').innerHTML = `<div class="success-mark">✓</div><h3>Thank you! Your food is live.</h3>
        <p>${esc(d.message)} It is already visible in <b>Available food nearby</b>.</p>${d.approximateLocation ? '<p class="soft">Your pickup is shown near the campus centre. Add details in your tracking page or call a team if the spot is hard to find.</p>' : ''}
        <label class="link-box">Your private tracking link<input readonly value="${esc(link)}" id="track-link" /></label>
        <div class="success-actions">${liveBtn}<button class="button primary" type="button" id="copy-link">Copy tracking link</button><a class="button ghost" href="#my-donations">Track my donation</a><button class="button ghost" type="button" id="donate-again">Share more food</button></div>`;
      form.hidden = true; $('#donation-success').hidden = false;
      $('#copy-link').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(link); e.target.textContent = 'Copied'; } catch (err) { $('#track-link').select(); } });
      $('#donate-again').addEventListener('click', again);
      $('#see-live').addEventListener('click', () => seeItLive(body.foodTitle));
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
        <p class="soft">${esc(d.quantityMeals)} meals • ${esc(d.address)} • pickup by ${esc(when(d.useBefore))}</p>${d.targetOrgName ? `<p class="soft">Directed to <b>${esc(d.targetOrgName)}</b>. Reserved for them for the first 30 minutes.</p>` : ''}
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
  function refreshAll() { clearTimeout(timer); timer = setTimeout(() => { loadImpact(); loadListings(); renderTracker(); loadOrganizations(); }, 200); }
  loadHelplines();
  loadAccount();
  refreshAll();
  setInterval(refreshAll, 30000);
  try { new EventSource('/api/stream').addEventListener('update', refreshAll); } catch (e) { /* live updates are optional */ }
  if (location.hash === '#my-donations') setTimeout(() => $('#my-donations').scrollIntoView(), 600);
})();
