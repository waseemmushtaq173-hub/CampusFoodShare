/* UX layer: smooth live updates, loading states, confirmations, busy buttons, focus handling, shortcuts */

/* ── 1. Live updates never flash: skip re-rendering a container when its markup did not change ── */
(() => {
  const ids = ['listingsContainer', 'myListings', 'pickupsActive', 'pickupsDone', 'moderationBody', 'userTableBody', 'requestsList', 'needList', 'dashboardBody',
    'notificationsList', 'helplines', 'startNow', 'startStats', 'publicPreview', 'publicKpis', 'trackBody', 'dailyChart', 'donorBoard', 'ngoBoard', 'typeLegend', 'roadmapBody'];
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  // countdown text changes every second on its own, so it must not count as a change
  const key = (h) => String(h).replace(/(data-(?:expiry|exp2)="[^"]*"[^>]*>)[^<]*/g, '$1');
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    Object.defineProperty(el, 'innerHTML', {
      configurable: true,
      get() { return desc.get.call(el); },
      set(v) {
        const k = key(v);
        if (el.__k === k && el.children.length) return;
        el.__k = k; el.__skeleton = false;
        desc.set.call(el, v);
      },
    });
  });
})();

/* ── 2. Skeleton placeholders while a page loads for the first time ── */
const SK = {
  cards: (n = 3) => `<div class="sk-wrap">${Array.from({ length: n }, () => '<div class="sk-card"><i class="sk w40"></i><i class="sk w70"></i><i class="sk w55"></i></div>').join('')}</div>`,
  kpis: () => '<div class="kpi-grid">' + Array.from({ length: 4 }, () => '<div class="sk-card"><i class="sk w40"></i><i class="sk w30 tall"></i></div>').join('') + '</div><div class="sk-wrap"><div class="sk-card"><i class="sk w55"></i><i class="sk w70"></i><i class="sk w40"></i></div></div>',
  rows: (n = 5) => Array.from({ length: n }, () => '<tr><td colspan="6"><i class="sk w70"></i></td></tr>').join(''),
};
const SKELETON_FOR = {
  explore: { listingsContainer: 'cards' }, mylistings: { myListings: 'cards' }, pickups: { pickupsActive: 'cards', pickupsDone: 'cards' }, need: { needList: 'cards' },
  requests: { requestsList: 'cards' }, dashboard: { dashboardBody: 'kpis' }, moderation: { moderationBody: 'rows' }, users: { userTableBody: 'rows' }, track: { trackBody: 'cards' },
};
(() => {
  const real = loadRoute;
  // eslint-disable-next-line no-global-assign
  loadRoute = function (route) {
    const map = SKELETON_FOR[route];
    if (map) {
      Object.entries(map).forEach(([id, kind]) => {
        const el = document.getElementById(id);
        if (el && !el.children.length) { el.innerHTML = SK[kind](); el.__k = null; }
      });
    }
    return real(route);
  };
})();

/* ── 3. Confirmation dialog instead of the browser's confirm() ── */
let __confirmResolve = null;
function confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
  let ov = document.getElementById('confirmModal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'confirmModal'; ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal" style="max-width:420px"><div class="modal-header"><h3 id="cfTitle"></h3></div><p class="muted" id="cfMsg" style="font-size:.92rem"></p><div class="action-row" style="margin-top:20px;justify-content:flex-end"><button class="btn btn-secondary" id="cfNo"></button><button class="btn" id="cfYes"></button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) closeConfirm(false); });
    ov.querySelector('#cfNo').addEventListener('click', () => closeConfirm(false));
    ov.querySelector('#cfYes').addEventListener('click', () => closeConfirm(true));
    watchModal(ov);
  }
  ov.querySelector('#cfTitle').textContent = title;
  ov.querySelector('#cfMsg').textContent = message;
  ov.querySelector('#cfNo').textContent = cancelText;
  const yes = ov.querySelector('#cfYes');
  yes.textContent = confirmText; yes.className = `btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`;
  ov.classList.add('active');
  setTimeout(() => yes.focus(), 60);
  return new Promise((resolve) => { __confirmResolve = resolve; });
}
function closeConfirm(result) {
  const ov = document.getElementById('confirmModal');
  if (ov) ov.classList.remove('active');
  if (__confirmResolve) { const r = __confirmResolve; __confirmResolve = null; r(result); }
}
// existing destructive actions now use the dialog
// eslint-disable-next-line no-global-assign
deleteListing = async function (id) {
  if (!requireAuth('remove a listing')) return;
  const own = currentUser.role === 'donor';
  if (!(await confirmDialog({ title: own ? 'Withdraw this listing?' : 'Remove this listing?', message: own ? 'NGOs will no longer see it. You can post it again any time.' : 'This permanently removes the listing for everyone.', confirmText: own ? 'Withdraw' : 'Remove', danger: true }))) return;
  lastOwnAction = Date.now();
  const r = await api(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  showToast(r.ok ? (own ? 'Listing withdrawn' : 'Listing removed') : (r.data.error || 'Could not remove')); refreshCurrent();
};
// eslint-disable-next-line no-global-assign
resetDemo = async function () {
  if (!(await confirmDialog({ title: 'Reset demo data?', message: 'Everything returns to the original demo dataset. Accounts created since will be removed and you will be signed out.', confirmText: 'Reset data', danger: true }))) return;
  const r = await api('/api/reset-demo', { method: 'POST' });
  if (!r.ok) return showToast(r.data.error || 'Reset failed');
  clearSession(); showToast('Demo data restored. Please sign in again.'); location.hash = '#/start'; renderRoute();
};
(() => {
  const realAct = act;
  // eslint-disable-next-line no-global-assign
  act = async function (path, body, ok) {
    if (/\/release$/.test(path) && !(await confirmDialog({ title: 'Release this pickup?', message: 'It becomes available for other NGOs and volunteers to claim.', confirmText: 'Release', danger: true }))) return false;
    return realAct(path, body, ok);
  };
})();

/* ── 4. Buttons show a busy state, so double clicks cannot send things twice ── */
let __lastBtn = null, __lastBtnAt = 0;
document.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { __lastBtn = b; __lastBtnAt = Date.now(); } }, true);
document.addEventListener('submit', (e) => { if (e.submitter) { __lastBtn = e.submitter; __lastBtnAt = Date.now(); } }, true);
(() => {
  const realApi = api;
  // eslint-disable-next-line no-global-assign
  api = async function (path, opts = {}) {
    const write = (opts.method || 'GET').toUpperCase() !== 'GET';
    const btn = write && __lastBtn && Date.now() - __lastBtnAt < 4000 && document.contains(__lastBtn) ? __lastBtn : null;
    if (btn) { __lastBtn = null; btn.disabled = true; btn.classList.add('is-busy'); }
    try {
      const r = await realApi(path, opts);
      if (r.status === 0) setOffline(true); else setOffline(false);
      return r;
    } finally { if (btn) { btn.disabled = false; btn.classList.remove('is-busy'); } }
  };
})();

/* ── 5. Offline banner ── */
function setOffline(off) {
  let b = document.getElementById('netBanner');
  if (!b) { b = document.createElement('div'); b.id = 'netBanner'; b.className = 'net-banner'; b.setAttribute('role', 'alert'); b.textContent = 'You appear to be offline. We will reconnect automatically.'; document.body.appendChild(b); }
  b.classList.toggle('show', off);
}
window.addEventListener('offline', () => setOffline(true));
window.addEventListener('online', () => { setOffline(false); refreshCurrent(); });

/* ── 6. Inline form errors ── */
function setFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || ''; el.hidden = !msg;
}
['signinForm', 'signupForm'].forEach((id) => {
  const f = document.getElementById(id);
  if (f) f.addEventListener('input', () => setFormError(id === 'signinForm' ? 'siError' : 'suError', ''));
});

/* ── 7. Modals: move focus in, keep it inside, give it back on close ── */
function watchModal(el) {
  new MutationObserver(() => {
    const active = el.classList.contains('active');
    if (active && !el.__open) {
      el.__open = true; el.__opener = document.activeElement;
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      setTimeout(() => {
        if (el.contains(document.activeElement) && document.activeElement !== el) return;
        const f = el.querySelector('input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea') || el.querySelector('button.btn-primary');
        if (f) f.focus();
      }, 80);
    } else if (!active && el.__open) {
      el.__open = false;
      if (el.id === 'confirmModal' && __confirmResolve) { const r = __confirmResolve; __confirmResolve = null; r(false); }
      const o = el.__opener; if (o && document.contains(o) && o.focus) o.focus();
    }
  }).observe(el, { attributes: true, attributeFilter: ['class'] });
}
document.querySelectorAll('.modal-overlay').forEach(watchModal);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const m = document.querySelector('.modal-overlay.active .modal');
  if (!m) return;
  const f = [...m.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea')].filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ── 8. Notification drawer: close on outside click or Esc, mark all read ── */
(() => {
  const drawer = document.getElementById('notifDrawer');
  const head = drawer.querySelector('.drawer-head');
  const mark = document.createElement('button');
  mark.className = 'btn btn-ghost btn-sm'; mark.textContent = 'Mark all read';
  mark.addEventListener('click', () => { try { localStorage.setItem('cf_seen', String(Date.now())); } catch (e) { /* ignore */ } document.getElementById('bellDot').style.display = 'none'; });
  head.insertBefore(mark, head.lastElementChild);
  document.addEventListener('click', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (drawer.contains(e.target) || e.target.closest('#bellBtn')) return;
    drawer.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') drawer.classList.remove('open'); });
})();

/* ── 9. Listing card <-> map ── */
function highlightListing(id) {
  const card = document.querySelector(`.listing-card[data-lid="${CSS.escape(id)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}
async function focusListing(id) {
  if (currentRoute() !== 'explore') { go('explore'); await new Promise((r) => setTimeout(r, 900)); }
  const mk = markerById[id];
  if (!mk || !map) return showToast('That listing is not on the map right now');
  $('rescueMap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  map.flyTo(mk.getLatLng(), 16, { duration: 0.8 });
  setTimeout(() => mk.openPopup(), 850);
}
document.addEventListener('click', (e) => {
  const f = e.target.closest('[data-focus]');
  if (f) { e.preventDefault(); e.stopPropagation(); focusListing(f.dataset.focus); }
}, true);

/* ── 10. Filters ── */
(() => {
  const clear = document.getElementById('clearFilters');
  if (clear) clear.addEventListener('click', () => {
    $('statusFilter').value = ''; $('typeFilter').value = ''; $('searchInput').value = '';
    loadListings();
  });
  // admin tables: instant client-side filter that survives live refreshes
  const bind = (inputId, bodyId) => {
    const input = document.getElementById(inputId), body = document.getElementById(bodyId);
    if (!input || !body) return;
    const apply = () => {
      const q = input.value.toLowerCase().trim();
      body.querySelectorAll('tr').forEach((tr) => { tr.hidden = q && !tr.textContent.toLowerCase().includes(q); });
    };
    input.addEventListener('input', apply);
    new MutationObserver(apply).observe(body, { childList: true });
  };
  bind('userSearch', 'userTableBody'); bind('modSearch', 'moderationBody');
})();

/* ── 11. Sidebar badges: how many people are waiting, how many pickups are active ── */
let __badgeAt = 0;
async function updateNavBadges() {
  if (!currentUser || !['ngo', 'volunteer', 'admin'].includes(currentUser.role) || Date.now() - __badgeAt < 4000) return;
  __badgeAt = Date.now();
  const set = (route, n) => {
    const btn = document.querySelector(`.nav-item[data-route="${route}"]`);
    if (!btn) return;
    let pill = btn.querySelector('.count-pill');
    if (!n) { if (pill) pill.remove(); return; }
    if (!pill) { pill = document.createElement('em'); pill.className = 'count-pill'; btn.appendChild(pill); }
    pill.textContent = n;
  };
  const rq = await api(`/api/requests?${locQuery()}`);
  if (rq.ok) set('requests', rq.data.requests.length);
  if (currentUser.role === 'admin') { const ms = await api('/api/admin/messages'); if (ms.ok) set('inbox', ms.data.unread); }
  if (currentUser.role !== 'admin') {
    const d = await api(`/api/dashboard?${locQuery()}`);
    if (d.ok && d.data.stats) set('pickups', d.data.stats.activePickups);
  }
}
(() => {
  const realN = loadNotifications, realAuth = updateAuthUI;
  // eslint-disable-next-line no-global-assign
  loadNotifications = async function (...args) { const r = await realN(...args); updateNavBadges(); return r; };
  // eslint-disable-next-line no-global-assign
  updateAuthUI = function (...args) { const r = realAuth(...args); __badgeAt = 0; return r; };
})();

/* ── 12. Keyboard shortcuts, page title, scroll to top on navigation ── */
document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const s = document.getElementById('searchInput');
    if (s && s.offsetParent !== null) s.focus(); else openCmd();
  }
});
window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  setTimeout(() => { document.title = `${document.getElementById('pageTitle').textContent} | CampusFoodShare`; }, 30);
});

/* ── 13. Browser tab title follows the page, including on first load and after sign-in ── */
(() => {
  const realRoute = renderRoute;
  // eslint-disable-next-line no-global-assign
  renderRoute = function (...args) {
    const r = realRoute.apply(this, args);
    document.title = `${document.getElementById('pageTitle').textContent} | CampusFoodShare`;
    return r;
  };
})();

/* ── 14. Forgot password: request a code, then choose a new password ── */
(() => {
  const form = document.getElementById('forgotForm');
  if (!form) return;
  let sent = false;
  const show = () => {
    document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));
    form.classList.add('active');
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
    document.getElementById('authModalTitle').textContent = 'Reset your password';
    sent = false;
    document.getElementById('fgStep2').hidden = true; document.getElementById('fgDemo').hidden = true;
    document.getElementById('fgSubmit').textContent = 'Send code';
    document.getElementById('fgEmail').value = document.getElementById('siEmail').value;
    setFormError('fgError', '');
    setTimeout(() => document.getElementById('fgEmail').focus(), 60);
  };
  document.getElementById('forgotLink').addEventListener('click', show);
  document.getElementById('fgBack').addEventListener('click', () => switchAuthTab('signin'));
  form.addEventListener('input', () => setFormError('fgError', ''));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormError('fgError', '');
    const email = document.getElementById('fgEmail').value.trim();
    if (!sent) {
      const r = await api('/api/auth/forgot', { method: 'POST', body: { email } });
      if (!r.ok) return setFormError('fgError', r.data.error || 'Could not generate a code');
      sent = true;
      document.getElementById('fgStep2').hidden = false;
      document.getElementById('fgSubmit').textContent = 'Reset password';
      const d = document.getElementById('fgDemo');
      d.hidden = false;
      if (r.data.demoCode) { d.className = 'big-note good'; d.textContent = `Demo mode: your code is ${r.data.demoCode}. A real deployment sends this by email.`; document.getElementById('fgCode').value = r.data.demoCode; }
      else { d.className = 'big-note'; d.textContent = 'If that email is registered, a code has been generated. Enter it below.'; }
      document.getElementById('fgPassword').focus();
      return;
    }
    const r = await api('/api/auth/reset', { method: 'POST', body: { email, code: document.getElementById('fgCode').value.trim(), password: document.getElementById('fgPassword').value } });
    if (!r.ok) return setFormError('fgError', r.data.error || 'Could not reset the password');
    showToast('Password updated. Please sign in.');
    switchAuthTab('signin');
    document.getElementById('siEmail').value = email; document.getElementById('siPassword').value = '';
    document.getElementById('siPassword').focus();
  });
})();

/* ── 15. Sample data is labelled as sample data; admins can start with nothing ── */
function renderDemoBanner() {
  api('/api/meta').then((r) => {
    const old = document.getElementById('demoBanner'); if (old) old.remove();
    if (!r.ok || !r.data.demo) return;
    let hidden = false; try { hidden = sessionStorage.getItem('cf_demo_hide') === '1'; } catch (e) { /* ignore */ }
    if (hidden) return;
    const b = document.createElement('div');
    b.id = 'demoBanner'; b.className = 'demo-banner';
    b.innerHTML = `<span><strong>Sample data.</strong> The listings, people and requests you see are demo content, not real activity.</span><span class="demo-actions">${currentUser && currentUser.role === 'admin' ? '<button class="btn btn-sm btn-secondary" data-act="startfresh">Start empty</button>' : ''}<button class="btn btn-sm btn-ghost" data-act="hidedemo">Hide</button></span>`;
    document.getElementById('views').prepend(b);
  });
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act="startfresh"],[data-act="hidedemo"]');
  if (!b) return;
  if (b.dataset.act === 'hidedemo') { try { sessionStorage.setItem('cf_demo_hide', '1'); } catch (err) { /* ignore */ } const el = document.getElementById('demoBanner'); if (el) el.remove(); return; }
  if (!(await confirmDialog({ title: 'Start with an empty platform?', message: 'All sample listings, requests and activity are removed and will not come back. Accounts are kept.', confirmText: 'Clear sample data', danger: true }))) return;
  const r = await api('/api/admin/start-fresh', { method: 'POST', body: {} });
  showToast(r.ok ? 'Sample data cleared. The platform now starts empty.' : (r.data.error || 'Could not clear the data'));
  renderDemoBanner(); refreshCurrent();
});
(() => {
  const realAuth = updateAuthUI;
  // eslint-disable-next-line no-global-assign
  updateAuthUI = function (...args) { const r = realAuth(...args); renderDemoBanner(); return r; };
  renderDemoBanner();
})();

/* ── 16. Admin inbox: messages from the public website's contact form ── */
async function loadInbox() {
  const r = await api('/api/admin/messages');
  if (!r.ok) return;
  document.getElementById('inboxList').innerHTML = r.data.messages.map((m) => `<div class="msg-card ${m.read ? 'read' : ''}"><div class="msg-top"><strong>${esc(m.name)}</strong><span class="muted">${esc(timeAgo(m.createdAt))}${m.read ? '' : ' · New'}</span></div>
    <a href="mailto:${esc(m.email)}">${esc(m.email)}</a><p>${esc(m.message)}</p>
    <div class="action-row"><a class="btn btn-secondary btn-sm" href="mailto:${esc(m.email)}?subject=Re%3A%20CampusFoodShare">Reply by email</a><button class="btn btn-ghost btn-sm" data-msg="${esc(m.id)}" data-read="${m.read ? 0 : 1}">${m.read ? 'Mark unread' : 'Mark read'}</button></div></div>`).join('')
    || '<div class="empty">No messages yet. Messages sent from the website contact form appear here.</div>';
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-msg]');
  if (!b) return;
  await api(`/api/admin/messages/${encodeURIComponent(b.dataset.msg)}`, { method: 'PATCH', body: { read: b.dataset.read === '1' } });
  __badgeAt = 0; loadInbox(); updateNavBadges();
});

/* ── 17. Links from the public website: /app/?join=ngo opens sign-up with the role chosen ── */
(() => {
  const p = new URLSearchParams(location.search);
  const join = p.get('join'), signin = p.get('signin');
  if (!join && !signin) return;
  history.replaceState(null, '', location.pathname + location.hash);
  setTimeout(() => {
    if (currentUser) return;
    if (join) {
      openAuth('signup');
      const chip = document.querySelector(`#signupForm .role-chip[data-role="${join}"]`);
      if (chip) chip.click();
    } else openAuth('signin');
  }, 900);
})();
