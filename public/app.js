/* CampusFoodShare - role-based single page app */
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── Icons ── */
const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  map: 'M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16', plus: 'M12 5v14M5 12h14', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  truck: 'M1 6h13v10H1zM14 10h4l4 3v3h-8M6 19a2 2 0 100-4 2 2 0 000 4M18 19a2 2 0 100-4 2 2 0 000 4',
  users: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8M21 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2', rocket: 'M5 15c-1 1-2 4-2 6 2 0 5-1 6-2M14 4c3-1 6-1 7-1 0 1 0 4-1 7l-7 7-6-6zM15 9h.01',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z', logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0M12 13a3 3 0 100-6 3 3 0 000 6', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16M21 21l-4.3-4.3', heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8',
  check: 'M20 6L9 17l-5-5', clock: 'M12 22a10 10 0 100-20 10 10 0 000 20M12 6v6l4 2', leaf: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10M2 21c0-3 1.9-5.4 5-6',
  menu: 'M3 6h18M3 12h18M3 18h18', x: 'M18 6L6 18M6 6l12 12', utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0', star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z',
};
Object.assign(ICONS, {
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  volume: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14', send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z', arrow: 'M5 12h14M13 6l6 6-6 6',
  navigation: 'M3 11l19-9-9 19-2-8z', box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12', tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01',
  flame: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.2.4-2.3 1-3 0 1.4 1 2.5 2.5 2.5z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4', calendar: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18', route: 'M6 19a3 3 0 100-6 3 3 0 000 6M18 11a3 3 0 100-6 3 3 0 000 6M9 16h6a3 3 0 003-3M12 8H9a3 3 0 00-3 3',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12M8.2 13.9L7 23l5-3 5 3-1.2-9.1', message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6', type: 'M4 7V4h16v3M9 20h6M12 4v16', camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8',
  store: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01',
});
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24"><path d="${ICONS[n] || ''}"/></svg>`;

/* ── State ── */
let map, markersLayer, ngoMarker = null, accuracyCircle = null;
let ngoLocation = { lat: 12.9716, lng: 77.5946 };
let currentUser = null, authToken = null, selectedRole = '', selectedSiRole = '';
let latestAiScan = { freshnessScore: 95, freshnessStatus: 'Excellent Freshness (Grade A)' };
let searchTimer = null, pickupDirty = false, lastOwnAction = 0, refreshTimer = null;
let markerById = {};
let watchId = null, firstFix = true, lastFetchPos = null, lastFetchAt = 0, lastNotifs = [];
let gpsWarned = false, gpsBlocked = false, gpsAcc = null, volLayer = null, lastShare = { t: 0, lat: 0, lng: 0 };
const CLAIM_ROLES = ['ngo', 'volunteer', 'admin'];

/* ── Role menus ── */
const NAV = {
  guest: [['start', 'Start Here', 'home'], ['need', 'Find Food', 'utensils'], ['track', 'My Request', 'clock'], ['explore', 'Live Map', 'map'], ['insights', 'Insights', 'chart'], ['overview', 'About', 'heart'], ['roadmap', 'Roadmap', 'rocket']],
  donor: [['dashboard', 'Dashboard', 'grid'], ['give', 'Donate Food', 'gift'], ['mylistings', 'My Listings', 'list'], ['explore', 'Live Map', 'map'], ['post', 'Detailed Form', 'plus'], ['schedules', 'Recurring Surplus', 'calendar', true], ['insights', 'Insights', 'chart'], ['roadmap', 'Roadmap', 'rocket'], ['settings', 'Settings', 'sliders']],
  ngo: [['dashboard', 'Dashboard', 'grid'], ['requests', 'Food Requests', 'heart'], ['explore', 'Find & Claim', 'map'], ['pickups', 'My Pickups', 'truck'], ['routes', 'Route Planner', 'route', true], ['insights', 'Insights', 'chart'], ['roadmap', 'Roadmap', 'rocket'], ['settings', 'Settings', 'sliders']],
  volunteer: [['dashboard', 'Dashboard', 'grid'], ['requests', 'Food Requests', 'heart'], ['explore', 'Available Pickups', 'map'], ['pickups', 'My Tasks', 'truck'], ['routes', 'Route Planner', 'route', true], ['insights', 'Insights', 'chart'], ['roadmap', 'Roadmap', 'rocket'], ['settings', 'Settings', 'sliders']],
  admin: [['dashboard', 'Overview', 'grid'], ['requests', 'Food Requests', 'heart'], ['moderation', 'All Listings', 'list'], ['users', 'Users & Roles', 'users'], ['explore', 'Live Map', 'map'], ['insights', 'Insights', 'chart'], ['reports', 'Reports & Certificates', 'award', true], ['integrations', 'SMS & WhatsApp', 'message', true], ['roadmap', 'Roadmap', 'rocket'], ['settings', 'Settings', 'sliders']],
};
const ROLE_LABEL = { guest: 'Guest', donor: 'Donor', ngo: 'NGO', volunteer: 'Volunteer', admin: 'Admin' };
const PAGE_SUB = {
  overview: 'Public, read-only view of the platform', explore: 'Real-time listings ranked by distance and expiry', post: 'Alert nearby NGOs in under a minute',
  mylistings: 'Track every listing you have posted', pickups: 'Your claimed and completed rescues', moderation: 'Review and moderate every listing',
  users: 'Manage roles and access', insights: 'Impact analytics and leaderboards', roadmap: 'Shipped features and what is next',
  start: 'Share surplus food with people nearby', track: 'Follow your request for food', settings: 'Your account and preferences', start_: '', need: 'Free food close to you', give: 'Give food in a few taps', requests: 'People asking for food near you',
};
const hasRequest = () => { try { return !!localStorage.getItem('cf_req'); } catch (e) { return false; } };
const roleOf = () => (currentUser ? currentUser.role : 'guest');
const titleFor = (r) => (r === 'dashboard' ? `${ROLE_LABEL[roleOf()]} ${roleOf() === 'admin' ? 'Control Center' : 'Dashboard'}` : navLabel(r, (NAV[roleOf()].find((n) => n[0] === r) || [, 'Home'])[1]));

/* ── Helpers ── */
function showToast(message) {
  const box = $('toastContainer');
  const text = String(message);
  const dupe = [...box.children].find((t) => t.textContent === text);
  if (dupe) { dupe.classList.remove('toast-pop'); void dupe.offsetWidth; dupe.classList.add('toast-pop'); return; }
  const t = document.createElement('div');
  const bad = /(fail|cannot|could not|denied|invalid|incorrect|too many|required|expired|not allowed|already|unable|error|blocked)/i.test(text);
  t.className = `toast-msg${bad ? ' toast-error' : ''}`;
  t.textContent = text;
  t.setAttribute('role', bad ? 'alert' : 'status');
  t.addEventListener('click', () => t.remove());
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), bad ? 6000 : 3800);
}

/* ── API helper: attaches token, returns { ok, status, data } ── */
async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  try {
    const res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty */ }
    if (res.status === 401 && authToken && !path.startsWith('/api/auth/signin')) {
      clearSession(); showToast('Session expired. Please sign in again.');
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Cannot reach the server' } };
  }
}

function distKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}
function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m left` : `${m}m ${String(s % 60).padStart(2, '0')}s left`;
}
function tickCountdowns() {
  document.querySelectorAll('[data-expiry]').forEach((el) => {
    const ms = new Date(el.dataset.expiry).getTime() - Date.now();
    el.textContent = formatCountdown(ms);
    el.classList.toggle('urgent', ms > 0 && ms < 3600000);
  });
}
const timerBadge = (iso) => `<span class="badge badge-timer" data-expiry="${esc(iso)}">${formatCountdown(new Date(iso) - Date.now())}</span>`;

/* ── Auth ── */
function saveSession(user, token) {
  currentUser = user; authToken = token;
  try { localStorage.setItem('cf_token', token); } catch (e) { /* ignore */ }
  updateAuthUI();
}
function clearSession() {
  currentUser = null; authToken = null;
  try { localStorage.removeItem('cf_token'); } catch (e) { /* ignore */ }
  updateAuthUI();
}

function updateAuthUI() {
  const role = roleOf();
  $('navMenu').innerHTML = NAV[role].filter((n) => n[0] !== 'track' || hasRequest()).map(([id, label, icon, soon]) => `<button class="nav-item${soon ? ' is-soon' : ''}" data-route="${id}">${ic(icon)}<span>${esc(navLabel(id, label))}</span>${soon ? '<em class="soon-pill">Soon</em>' : ''}</button>`).join('');
  $('navLabel').textContent = `${ROLE_LABEL[role]} menu`;
  if (currentUser) {
    const initial = esc((currentUser.name || '?').trim()[0].toUpperCase());
    $('userCard').innerHTML = `<div class="user-row"><div class="avatar">${initial}</div><div style="min-width:0"><strong>${esc(currentUser.name.replace(/\s*\(.*\)\s*$/, ''))}</strong><span class="role-tag ${role}">${ROLE_LABEL[role]}</span></div></div>
      <button class="btn btn-ghost btn-sm" data-act="signout">${ic('logout')} Sign out</button>`;
    $('authChip').className = 'btn btn-ghost btn-sm';
    $('authChip').innerHTML = `<span class="role-tag ${role}">${ROLE_LABEL[role]}</span>`;
    if (currentUser.role === 'donor' || currentUser.role === 'admin') {
      if (currentUser.organization) $('donorName').value = currentUser.organization;
      if (currentUser.phone) $('donorPhone').value = currentUser.phone;
    }
  } else {
    $('userCard').innerHTML = `<div class="user-row"><div class="avatar guest">G</div><div><strong>Guest viewer</strong><span class="role-tag">Read-only</span></div></div>
      <button class="btn btn-primary btn-sm" data-open-auth="signin">Sign in / Sign up</button>`;
    $('authChip').className = 'btn btn-primary btn-sm';
    $('authChip').textContent = 'Sign in';
  }
  renderRoute();
}

function setSiRole(role) {
  selectedSiRole = role;
  document.querySelectorAll('#siRoleChips .role-chip').forEach((c) => c.classList.toggle('active', c.dataset.role === role));
}
function openAuth(mode = 'signin', role) {
  if (role) setSiRole(role); switchAuthTab(mode); $('authModal').classList.add('active'); }
function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));
  $(mode + 'Form').classList.add('active');
  $('authModalTitle').textContent = mode === 'signup' ? 'Create your account' : 'Welcome back';
}
function requireAuth(action) {
  if (currentUser) return true;
  showToast(`Please sign in to ${action}`); openAuth('signin'); return false;
}

async function doSignIn(email, password, role) {
  const r = await api('/api/auth/signin', { method: 'POST', body: { email, password, role } });
  if (!r.ok) { const msg = r.data.error || 'Sign in failed'; showToast(msg); setFormError('siError', msg); return false; }
  setFormError('siError', '');
  saveSession(r.data.user, r.data.token);
  $('authModal').classList.remove('active');
  showToast(`Signed in as ${r.data.user.name} (${ROLE_LABEL[r.data.user.role]})`);
  location.hash = '#/' + landingAfterLogin(r.data.user.role); renderRoute();
  return true;
}

async function handleSignUp(e) {
  e.preventDefault();
  if (!selectedRole) return showToast('Please select a role');
  const r = await api('/api/auth/signup', { method: 'POST', body: { name: $('suName').value.trim(), email: $('suEmail').value.trim(), password: $('suPassword').value, phone: $('suPhone').value.trim(), organization: $('suOrg').value.trim(), role: selectedRole } });
  if (!r.ok) { const msg = r.data.error || 'Sign up failed'; showToast(msg); setFormError('suError', msg); return; }
  setFormError('suError', '');
  saveSession(r.data.user, r.data.token);
  $('authModal').classList.remove('active'); $('signupForm').reset();
  showToast(`Welcome, ${r.data.user.name}!`); location.hash = '#/dashboard'; renderRoute();
}

async function signOut() {
  await api('/api/auth/signout', { method: 'POST' });
  history.replaceState(null, '', '#/start');
  clearSession(); showToast('Signed out');
}

async function checkAuth() {
  let token = null;
  try { token = localStorage.getItem('cf_token'); } catch (e) { /* ignore */ }
  if (!token) return;
  authToken = token;
  const r = await api('/api/auth/me');
  if (r.ok) currentUser = r.data.user; else { authToken = null; try { localStorage.removeItem('cf_token'); } catch (e) { /* ignore */ } }
}

/* ── Routing ── */
const currentRoute = () => (location.hash.replace(/^#\/?/, '') || '').split('?')[0];

function renderRoute() {
  const role = roleOf();
  const ids = NAV[role].filter((n) => n[0] !== 'track' || hasRequest()).map((n) => n[0]);
  let route = currentRoute();
  if (!ids.includes(route)) {
    if (!currentUser && ['dashboard', 'post', 'mylistings', 'pickups', 'moderation', 'users'].includes(route)) { showToast('Sign in to open that page'); }
    route = ids[0];
    history.replaceState(null, '', `#/${route}`);
  }
  const viewId = SOON[route] ? 'soon' : route;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${viewId}`));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.route === route));
  $('pageTitle').textContent = titleFor(route);
  $('pageSub').textContent = PAGE_SUB[route] || (route === 'dashboard' ? `Signed in as ${currentUser ? currentUser.email : ''}` : '');
  closeSidebar();
  if (route === 'explore' && map) setTimeout(() => map.invalidateSize(), 60);
  if (route === 'post') applyPickupDefaults();
  loadRoute(route);
}

function loadRoute(route) {
  loadNotifications(route === 'overview');
  if (SOON[route]) return renderSoon(route);
  ({
    overview: () => {}, track: loadTrack, settings: renderSettings, start: loadStart, need: loadNeed, give: renderGive, requests: loadRequests, dashboard: loadDashboard, explore: () => { loadListings(); loadLocations(); }, mylistings: loadMyListings, pickups: loadPickups,
    moderation: loadModeration, users: loadUsers, insights: loadInsights, roadmap: renderRoadmap, post: () => {},
  }[route] || (() => {}))();
}
const STATIC_ROUTES = ['settings', 'post', 'give', 'roadmap'];
const refreshCurrent = () => { const r = currentRoute(); if (!STATIC_ROUTES.includes(r) && !SOON[r]) loadRoute(r); };
function debouncedRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshCurrent, 250); }
const go = (r) => { location.hash = `#/${r}`; };

function closeSidebar() { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); }

/* ── Live GPS ── */
function setLiveUI(on) {
  const btn = $('useMyLocationBtn');
  btn.classList.toggle('live', on);
  btn.classList.toggle('blocked', gpsBlocked && !on);
  $('gpsIcon').innerHTML = ic('pin');
  const acc = on && gpsAcc ? ` ±${Math.round(gpsAcc)}m` : '';
  $('currentCoordsLabel').textContent = gpsBlocked && !on ? 'Location off' : `${on ? 'LIVE · ' : ''}${ngoLocation.lat}, ${ngoLocation.lng}${acc}`;
  btn.title = on ? 'Live GPS on - click to stop' : 'Start live GPS tracking';
  const b = $('gpsBanner');
  if (!b) return;
  b.className = `gps-banner ${on ? (gpsAcc ? 'on' : 'wait') : gpsBlocked ? 'blocked' : ''}`;
  b.innerHTML = `<i></i><span>${on
    ? (gpsAcc ? `Live GPS locked (±${Math.round(gpsAcc)} m). Distances, ranking and routes update as you move.` : 'Searching for your location…')
    : gpsBlocked ? 'Location is blocked. Allow Location in your browser address bar (lock icon), then click here to retry.' : 'Live GPS is off. Click here to turn it on.'}</span>`;
}

function startLiveGps(highAccuracy = true) {
  if (!navigator.geolocation) return showToast('Geolocation is not supported in this browser');
  if (watchId !== null) return;
  firstFix = true;
  if (highAccuracy) showToast('Requesting your live location…');
  gpsBlocked = false;
  if (highAccuracy) gpsWarned = false;
  watchId = navigator.geolocation.watchPosition(onPosition, (err) => {
    if (err.code === 1) { // permission denied: the only fatal error
      navigator.geolocation.clearWatch(watchId); watchId = null;
      gpsBlocked = true; setLiveUI(false);
      showToast('Location permission denied. Allow Location in the browser address bar, then click the GPS chip.');
      return;
    }
    // Timeouts / unavailable are normal for a device that is standing still. Keep tracking.
    if (gpsAcc != null) return;
    if (highAccuracy) { // no fix yet: fall back to network / Wi-Fi positioning
      navigator.geolocation.clearWatch(watchId); watchId = null;
      startLiveGps(false);
      return;
    }
    if (!gpsWarned) { gpsWarned = true; showToast('Still looking for your location. Using the campus default until it locks.'); }
  }, { enableHighAccuracy: highAccuracy, maximumAge: 15000, timeout: highAccuracy ? 15000 : 60000 });
  try { localStorage.setItem('cf_live', '1'); } catch (e) { /* ignore */ }
  setLiveUI(true);
}

function stopLiveGps(silent) {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  if (!silent) { try { localStorage.setItem('cf_live', '0'); } catch (e) { /* ignore */ } }
  gpsAcc = null;
  setLiveUI(false);
  if (!silent) showToast('Live GPS stopped');
}

function onPosition(pos) {
  const { latitude, longitude, accuracy } = pos.coords;
  ngoLocation = { lat: Number(latitude.toFixed(5)), lng: Number(longitude.toFixed(5)) };
  gpsAcc = accuracy; gpsBlocked = false;
  updateNgoCoordsUI(accuracy);
  shareLocation();
  if (firstFix) {
    firstFix = false; if (map) map.setView([ngoLocation.lat, ngoLocation.lng], 15);
    showToast(`Live GPS locked (±${Math.round(accuracy)} m). Distances now update as you move.`);
  }
  if (!pickupDirty) { $('pickupLat').value = ngoLocation.lat; $('pickupLng').value = ngoLocation.lng; }
  const moved = lastFetchPos ? distKm(lastFetchPos, ngoLocation) * 1000 : Infinity;
  if (moved > 25 || Date.now() - lastFetchAt > 20000) {
    lastFetchPos = { ...ngoLocation }; lastFetchAt = Date.now();
    if (['explore', 'dashboard', 'pickups', 'need', 'requests'].includes(currentRoute())) refreshCurrent();
  }
}

function updateNgoCoordsUI(accuracy) {
  setLiveUI(watchId !== null);
  if (!map) return;
  if (ngoMarker) map.removeLayer(ngoMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);
  ngoMarker = L.circleMarker([ngoLocation.lat, ngoLocation.lng], { radius: 9, fillColor: '#19c3a6', color: '#fff', weight: 3, fillOpacity: 1 })
    .addTo(map).bindPopup('<strong>You are here</strong>');
  if (accuracy) accuracyCircle = L.circle([ngoLocation.lat, ngoLocation.lng], { radius: accuracy, color: '#19c3a6', weight: 1, fillOpacity: 0.1 }).addTo(map);
}

function applyPickupDefaults() {
  if (!pickupDirty) { $('pickupLat').value = ngoLocation.lat; $('pickupLng').value = ngoLocation.lng; }
}

/* ── Share & watch live volunteer locations ── */
function shareLocation() {
  if (!currentUser || !CLAIM_ROLES.includes(currentUser.role)) return;
  const now = Date.now();
  const moved = lastShare.lat ? distKm(lastShare, ngoLocation) * 1000 : Infinity;
  if (now - lastShare.t < 5000 || (now - lastShare.t < 20000 && moved < 15)) return;
  lastShare = { t: now, lat: ngoLocation.lat, lng: ngoLocation.lng };
  api('/api/location', { method: 'POST', body: { lat: ngoLocation.lat, lng: ngoLocation.lng, accuracy: gpsAcc } });
}

async function loadLocations() {
  if (!currentUser || !volLayer) return;
  const r = await api('/api/locations');
  if (!r.ok) return;
  volLayer.clearLayers();
  document.querySelectorAll('[data-track]').forEach((el) => { el.textContent = ''; });
  (r.data.locations || []).forEach((l) => {
    const secs = Math.max(0, Math.round((Date.now() - l.at) / 1000));
    const ago = secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)} min ago`;
    L.polyline([[l.lat, l.lng], [l.pickup.lat, l.pickup.lng]], { color: '#8b5cf6', weight: 3, dashArray: '6 8' }).addTo(volLayer);
    L.marker([l.lat, l.lng], { icon: L.divIcon({ className: '', html: '<div class="vol-dot"></div>', iconSize: [22, 22] }) })
      .bindPopup(`<strong>${esc(l.name)}</strong><br/>On the way to ${esc(l.title)}<br/>${l.distanceKm.toFixed(2)} km from pickup · updated ${ago}`).addTo(volLayer);
    document.querySelectorAll(`[data-track="${l.listingId}"]`).forEach((el) => { el.textContent = `On the way: ${l.name} is ${l.distanceKm.toFixed(2)} km from pickup · ${ago}`; });
  });
}

/* ── Live updates (Server-Sent Events) ── */
function connectStream() {
  const badge = $('liveBadge');
  const es = new EventSource('/api/stream');
  es.onopen = () => { badge.classList.add('on'); badge.title = 'Real-time updates connected'; };
  es.onerror = () => { badge.classList.remove('on'); badge.title = 'Reconnecting…'; };
  es.addEventListener('location', () => { if (['explore', 'dashboard'].includes(currentRoute())) loadLocations(); });
  es.addEventListener('update', (ev) => {
    let d = {}; try { d = JSON.parse(ev.data); } catch (e) { /* ignore */ }
    if (d.title && Date.now() - lastOwnAction > 1800) showToast(`${d.title}: ${d.message}`);
    debouncedRefresh();
  });
}

/* ── Notifications ── */
async function loadNotifications(withMetrics) {
  const r = await api('/api/impact');
  if (!r.ok) return;
  lastNotifs = r.data.notifications || [];
  let seen = 0; try { seen = Number(localStorage.getItem('cf_seen') || 0); } catch (e) { /* ignore */ }
  const unread = lastNotifs.filter((n) => new Date(n.createdAt).getTime() > seen).length;
  $('bellDot').style.display = unread ? 'block' : 'none';
  $('notificationsList').innerHTML = lastNotifs.map((n) => `<div class="ntf"><strong>${esc(n.title)}</strong><div>${esc(n.message)}</div><small>${timeAgo(n.createdAt)} · ${esc(n.channel || '')}</small></div>`).join('') || '<p class="muted">No activity yet.</p>';
  if (withMetrics !== false && currentRoute() === 'overview') {
    const m = r.data.metrics;
    $('publicKpis').innerHTML = [[m.totalMealsSaved, 'Meals rescued'], [`${m.totalFoodRescuedKg} kg`, 'Food saved'], [m.activeListingsCount, 'Available now'], [`${m.co2PreventedKg} kg`, 'CO₂e prevented']]
      .map(([v, l]) => `<div class="mini-kpi"><b>${esc(v)}</b><span>${l}</span></div>`).join('');
    const live = await api(`/api/listings?status=posted&${locQuery()}`);
    if (live.ok) {
      $('publicPreview').innerHTML = live.data.listings.slice(0, 3).map((l) => mini(l.foodTitle, `${esc(l.donorName)} · ${esc(l.quantityMeals)} meals · ${esc(l.distanceKm)} km`, `${timerBadge(l.useBefore)}<button class="btn btn-ghost btn-sm" data-open-auth="signin">Sign in to claim</button>`)).join('') || '<div class="empty">Nothing available right now. New listings appear here instantly.</div>';
      tickCountdowns();
    }
  }
}

/* ── Listing cards ── */
function cardHtml(item, idx) {
  const role = roleOf(), id = esc(item.id);
  const mine = currentUser && item.claimedBy && item.claimedBy.userId === currentUser.id;
  const ownPost = currentUser && item.donorId === currentUser.id;
  const pin = item.claimedBy && item.claimedBy.handoverCode;
  let actions = '';
  if (item.status === 'posted') {
    if (CLAIM_ROLES.includes(role)) actions = `<button class="btn btn-primary btn-sm" data-act="claim" data-id="${id}">Claim pickup</button>`;
    else if (!currentUser) actions = `<button class="btn btn-ghost btn-sm" data-open-auth="signin">Sign in to claim</button>`;
    else actions = `<span class="hint">Only NGOs and volunteers can claim</span>`;
    if (role === 'admin' || (role === 'donor' && ownPost)) actions += ` <button class="btn btn-ghost btn-sm" data-act="delete" data-id="${id}">Withdraw</button>`;
  } else if (item.status === 'claimed') {
    actions = `<span class="hint warn">${esc(item.claimedBy ? item.claimedBy.volunteerName : '')} · ${esc(item.claimedBy ? item.claimedBy.ngoName : '')}</span><span class="hint track" data-track="${id}"></span>`;
    if (pin) actions += ` <span class="pin-chip" title="Handover PIN">PIN ${esc(pin)}</span>`;
    if (CLAIM_ROLES.includes(role)) {
      actions += ` <button class="btn btn-ok btn-sm" data-act="collect" data-id="${id}">Mark collected</button>`;
      if (role === 'admin' || mine) actions += ` <button class="btn btn-ghost btn-sm" data-act="release" data-id="${id}">Release</button>`;
    }
  } else if (item.status === 'collected') {
    if (item.feedback) actions = `<span class="hint info">★ ${esc(item.feedback.rating)}/5 · "${esc(item.feedback.comment)}"</span>`;
    else if (CLAIM_ROLES.includes(role)) actions = `<button class="btn btn-primary btn-sm" data-act="rate" data-id="${id}">Rate hygiene</button>`;
  }
  if (role === 'admin' && item.status !== 'posted') actions += ` <button class="btn btn-danger btn-sm" data-act="delete" data-id="${id}">Remove</button>`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location.lat + ',' + item.location.lng)}&origin=${encodeURIComponent(ngoLocation.lat + ',' + ngoLocation.lng)}`;
  const done = (s) => (item.status === 'collected' || (s === 2 && item.status === 'claimed') ? 'done' : '');
  return `<div class="listing-card st-${esc(item.status)}" data-lid="${id}">
    <div class="listing-top">
      <div><span class="listing-title">#${idx + 1} · ${esc(item.foodTitle)}</span>
        <div class="sub">${esc(item.donorName)}${item.donorPhone ? ` · <a href="tel:${esc(item.donorPhone.replace(/\s/g, ''))}">${esc(item.donorPhone)}</a>` : ''}</div></div>
      <div class="badges"><span class="badge badge-${esc(item.status)}">${esc(item.status.toUpperCase())}</span>${item.status === 'posted' ? timerBadge(item.useBefore) : ''}
        <span class="badge">Freshness ${esc(item.aiFreshnessScore || 95)}%</span><span class="badge">${esc(item.distanceKm)} km</span></div>
    </div>
    <div class="stepper"><div class="done">1 · Posted</div><div class="${done(2)}">2 · Claimed</div><div class="${item.status === 'collected' ? 'done' : ''}">3 · Collected</div></div>
    <div class="listing-meta">
      <div><strong>Diet:</strong> ${esc(item.foodType)}</div><div><strong>Quantity:</strong> ${esc(item.quantityMeals)} meals (~${esc(item.weightKg)} kg)</div>
      <div><strong>Pickup:</strong> ${esc(item.location.address)} · <a href="${directions}" target="_blank" rel="noopener">Directions ↗</a> · <a href="#/explore" data-focus="${id}">Show on map</a></div><div><strong>Priority score:</strong> ${esc(item.urgencyScore)}</div>
    </div>
    <div class="listing-actions"><span class="hint ok">Safety checklist confirmed</span><div class="action-row">${actions}</div></div>
  </div>`;
}
const renderCards = (el, list, empty) => { el.innerHTML = list.length ? list.map(cardHtml).join('') : `<div class="empty">${empty}</div>`; };
const locQuery = () => `lat=${ngoLocation.lat}&lng=${ngoLocation.lng}`;

async function loadListings() {
  const p = new URLSearchParams({ lat: ngoLocation.lat, lng: ngoLocation.lng });
  if ($('statusFilter').value) p.set('status', $('statusFilter').value);
  if ($('typeFilter').value) p.set('foodType', $('typeFilter').value);
  if ($('searchInput').value) p.set('search', $('searchInput').value);
  const r = await api(`/api/listings?${p}`);
  if (!r.ok) return;
  if (markersLayer) markersLayer.clearLayers();
  markerById = {};
  if (markersLayer) r.data.listings.forEach((i) => {
    const color = { posted: '#22c55e', claimed: '#f59e0b', collected: '#0ea5e9' }[i.status] || '#64748b';
    const mk = L.circleMarker([i.location.lat, i.location.lng], { radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9 })
      .bindPopup(`<strong>${esc(i.foodTitle)}</strong><br/>${esc(i.donorName)}<br/>${esc(i.quantityMeals)} meals · <b>${esc(i.distanceKm)} km</b>`).addTo(markersLayer);
    markerById[i.id] = mk;
    mk.on('click', () => highlightListing(i.id));
  });
  const filtered = Boolean($('statusFilter').value || $('typeFilter').value || $('searchInput').value);
  renderCards($('listingsContainer'), r.data.listings, filtered ? 'No listings match your filters. Try clearing them.' : 'Nothing is listed right now. New surplus appears here the moment a donor posts it.');
  $('resultCount').textContent = `${r.data.listings.length} listing${r.data.listings.length === 1 ? '' : 's'}`;
  $('clearFilters').hidden = !filtered;
}
async function loadMyListings() {
  const r = await api(`/api/listings?scope=mine&includeExpired=true&${locQuery()}`);
  if (r.ok) renderCards($('myListings'), r.data.listings, 'You have not posted anything yet.<br><button class="btn btn-primary btn-sm" data-go="give" style="margin-top:12px">Donate food</button>');
}
async function loadPickups() {
  const r = await api(`/api/listings?scope=mine&${locQuery()}`);
  if (!r.ok) return;
  renderCards($('pickupsActive'), r.data.listings.filter((l) => l.status === 'claimed'), 'No active pickups.<br><button class="btn btn-primary btn-sm" data-go="explore" style="margin-top:12px">Find food to claim</button>');
  renderCards($('pickupsDone'), r.data.listings.filter((l) => l.status === 'collected'), 'Completed rescues will appear here.');
}

/* ── Dashboards ── */
const kpi = (label, value, sub, icon, tone, alert) => `<div class="kpi ${alert ? 'alert' : ''}" style="--tone:${tone}"><div class="k-top"><span>${label}</span><span class="k-ico">${ic(icon)}</span></div><b>${typeof value === 'number' ? num(value) : value}</b><small>${sub}</small></div>`;
const mini = (title, sub, right) => `<div class="mini"><div><strong>${esc(title)}</strong><small>${sub}</small></div><div class="right">${right}</div></div>`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const first = () => esc(currentUser.name.replace(/\s*\(.*\)\s*$/, '').split(' ')[0]);
function animateCounts(root = document) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    if (el.dataset.counted === el.dataset.count) return;
    el.dataset.counted = el.dataset.count;
    const target = Number(el.dataset.count), suffix = el.dataset.suffix || '', start = performance.now();
    if (!isFinite(target) || target === 0) { el.textContent = `0${suffix}`; return; }
    const step = (t) => {
      const k = Math.min(1, (t - start) / 700), v = target * (1 - Math.pow(1 - k, 3));
      el.textContent = `${Number.isInteger(target) ? Math.round(v) : v.toFixed(1)}${suffix}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
const num = (v, suffix = '') => `<span data-count="${Number(v) || 0}" data-suffix="${suffix}">${v}${suffix}</span>`;
const pct = (v) => (v == null ? '—' : `${v}%`);

async function loadDashboard() {
  if (!currentUser) return;
  const r = await api(`/api/dashboard?${locQuery()}`);
  if (!r.ok || !r.data.stats) return;
  const d = r.data, s = d.stats, body = $('dashboardBody');
  const welcome = (sub, buttons) => `<div class="welcome"><div><h2>${greeting()}, ${first()}</h2><p class="muted">${sub}</p></div><div class="welcome-actions">${buttons}</div></div>`;
  if (d.role === 'donor') {
    body.innerHTML = welcome('Here is how your surplus is doing.', `<button class="btn btn-primary" data-go="post">${ic('plus')} Post surplus</button><button class="btn btn-ghost" data-go="mylistings">My listings</button>`) +
      `<div class="kpi-grid">${kpi('Meals posted', s.mealsPosted, `${s.listings} listings`, 'utensils', 'var(--accent)')}${kpi('Meals rescued', s.mealsRescued, `${s.kgRescued} kg saved`, 'heart', 'var(--green)')}${kpi('Live listings', s.active + s.inTransit, `${s.active} open · ${s.inTransit} in transit`, 'clock', 'var(--blue)')}${kpi('Rescue rate', pct(s.rescueRate), 'rescued vs expired', 'chart', 'var(--primary)')}${kpi('Avg rating', s.avgRating == null ? '—' : `${s.avgRating} ★`, 'from NGO reviews', 'star', 'var(--purple)')}</div>
      <div class="dash-grid"><div class="glass panel"><h2>Your recent listings</h2><div class="mini-list" style="margin-top:.8rem">${d.recent.map((l) => mini(l.foodTitle, `${esc(l.quantityMeals)} meals · ${esc(l.distanceKm)} km`, `<span class="badge badge-${esc(l.status)}">${esc(l.status.toUpperCase())}</span>${l.status === 'posted' ? timerBadge(l.useBefore) : ''}${l.claimedBy && l.claimedBy.handoverCode && l.status === 'claimed' ? `<span class="pin-chip">PIN ${esc(l.claimedBy.handoverCode)}</span>` : ''}`)).join('') || '<div class="empty">Nothing posted yet.</div>'}</div></div>
      <div class="glass panel"><h2>Rescue performance</h2><div class="meter"><i style="width:${s.rescueRate || 0}%"></i></div><div class="stat-row"><span>Food rescued</span><b>${s.kgRescued} kg</b></div><div class="stat-row"><span>CO₂e prevented</span><b>${(s.kgRescued * 2.5).toFixed(1)} kg</b></div><p class="muted" style="margin-top:1rem">Tip: share the handover PIN only with the volunteer standing at your pickup point.</p></div></div>`;
  } else if (d.role === 'admin') {
    const roles = Object.entries(s.roles).map(([k, v]) => `<div class="stat-row"><span>${ROLE_LABEL[k] || k}</span><b>${v}</b></div>`).join('');
    const bar = (label, v, tone) => `<div class="stat-row"><span>${label}</span><b>${v}</b></div><div class="meter"><i style="width:${s.listings ? (v / s.listings) * 100 : 0}%;background:${tone}"></i></div>`;
    body.innerHTML = welcome('Platform health at a glance.', `<button class="btn btn-primary" data-go="users">${ic('users')} Manage users</button><button class="btn btn-ghost" data-go="moderation">Moderate listings</button><button class="btn btn-ghost" data-act="startfresh">Start empty</button><button class="btn btn-danger" data-act="reset">Reset demo data</button>`) +
      `<div class="kpi-grid">${kpi('Users', s.users, `${s.suspended} suspended`, 'users', 'var(--blue)')}${kpi('Listings', s.listings, `${s.posted} open now`, 'list', 'var(--accent)')}${kpi('Meals saved', s.mealsSaved, 'platform total', 'heart', 'var(--green)')}${kpi('Rescue rate', pct(s.rescueRate), 'rescued vs expired', 'chart', 'var(--primary)')}${kpi('Expiring < 30 min', s.expiringSoon, s.expiringSoon ? 'needs attention' : 'all clear', 'alert', 'var(--red)', s.expiringSoon > 0)}</div>
      <div class="dash-grid"><div class="glass panel"><h2>Listing pipeline</h2><div style="margin-top:.8rem">${bar('Posted', s.posted, 'var(--green)')}${bar('Claimed', s.claimed, 'var(--accent)')}${bar('Collected', s.collected, 'var(--blue)')}${bar('Expired', s.expired, 'var(--muted)')}</div><h3 style="margin-top:1rem">Users by role</h3>${roles}</div>
      <div class="glass panel"><h2>Audit log</h2><div class="mini-list" style="margin-top:.8rem">${d.audit.map((n) => mini(n.title, esc(n.message), `<small>${timeAgo(n.createdAt)}</small>`)).join('')}</div></div></div>`;
  } else {
    const isVol = d.role === 'volunteer';
    body.innerHTML = welcome(isVol ? 'Your assigned pickups and the most urgent food nearby.' : 'Claim surplus before it expires and track your pickups.', `<button class="btn btn-primary" data-go="explore">${ic('map')} ${isVol ? 'Available pickups' : 'Find & claim food'}</button><button class="btn btn-ghost" data-go="pickups">${isVol ? 'My tasks' : 'My pickups'}</button>`) +
      `<div class="kpi-grid">${kpi('Active pickups', s.activePickups, 'awaiting collection', 'truck', 'var(--accent)')}${kpi('Completed', s.completed, `${s.rated} rated`, 'check', 'var(--green)')}${kpi('Meals collected', s.mealsCollected, `${s.kgRescued} kg`, 'utensils', 'var(--blue)')}${kpi('CO₂e prevented', `${s.co2} kg`, 'your impact', 'leaf', 'var(--primary)')}${kpi('Available now', s.availableNow, 'platform-wide', 'clock', 'var(--purple)')}</div>
      <div class="dash-grid"><div class="glass panel"><h2>Active pickups</h2><div class="mini-list" style="margin-top:.8rem">${d.active.map((l) => mini(l.foodTitle, `${esc(l.location.address)} · ${esc(l.distanceKm)} km`, `${l.claimedBy && l.claimedBy.handoverCode ? `<span class="pin-chip">PIN ${esc(l.claimedBy.handoverCode)}</span>` : ''}<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}">Directions</a><button class="btn btn-ok btn-sm" data-act="collect" data-id="${esc(l.id)}">Collect</button>`)).join('') || '<div class="empty">No active pickups right now.</div>'}</div></div>
      <div class="glass panel"><h2>Most urgent near you</h2><div class="mini-list" style="margin-top:.8rem">${d.urgent.map((l) => mini(l.foodTitle, `${esc(l.quantityMeals)} meals · ${esc(l.distanceKm)} km`, `${timerBadge(l.useBefore)}<button class="btn btn-primary btn-sm" data-act="claim" data-id="${esc(l.id)}">Claim</button>`)).join('') || '<div class="empty">Nothing available right now.</div>'}</div></div></div>`;
  }
  tickCountdowns(); animateCounts(body);
  if (['ngo', 'volunteer', 'admin'].includes(d.role)) loadNeedsPanel();
}

/* ── Admin pages ── */
async function loadModeration() {
  const r = await api(`/api/listings?includeExpired=true&${locQuery()}`);
  if (!r.ok) return;
  $('moderationBody').innerHTML = r.data.listings.map((l) => `<tr><td><strong>${esc(l.foodTitle)}</strong></td><td>${esc(l.donorName)}</td><td><span class="badge badge-${esc(l.status)}">${esc(l.status)}</span></td><td>${esc(l.quantityMeals)}</td><td>${new Date(l.useBefore).toLocaleString()}</td><td><button class="btn btn-danger btn-sm" data-act="delete" data-id="${esc(l.id)}">Remove</button></td></tr>`).join('') || '<tr><td colspan="6">No listings.</td></tr>';
}
async function loadUsers() {
  const r = await api('/api/admin/users');
  if (!r.ok) return;
  $('userTableBody').innerHTML = r.data.users.map((u) => {
    const self = currentUser && u.id === currentUser.id;
    const opts = ['donor', 'ngo', 'volunteer', 'admin'].map((x) => `<option value="${x}" ${u.role === x ? 'selected' : ''}>${ROLE_LABEL[x]}</option>`).join('');
    return `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.organization || '')}</td><td><select class="input" data-role-user="${esc(u.id)}" ${self ? 'disabled' : ''}>${opts}</select></td><td><span class="badge ${u.suspended ? 'badge-expired' : 'badge-posted'}">${u.suspended ? 'Suspended' : 'Active'}</span></td><td>${self ? '<span class="hint">You</span>' : `<button class="btn ${u.suspended ? 'btn-ok' : 'btn-danger'} btn-sm" data-act="suspend" data-id="${esc(u.id)}" data-val="${u.suspended ? 0 : 1}">${u.suspended ? 'Reactivate' : 'Suspend'}</button>`}</td></tr>`;
  }).join('');
}

/* ── Insights ── */
async function loadInsights() {
  const [a, l] = await Promise.all([api('/api/analytics'), api('/api/leaderboard')]);
  if (a.ok) {
    const max = Math.max(1, ...a.data.daily.flatMap((d) => [d.posted, d.rescued]));
    $('dailyChart').innerHTML = a.data.daily.map((d) => `<div class="bar-col" title="${esc(d.label)}: ${d.posted} posted, ${d.rescued} rescued"><div class="bars"><div class="bar posted" style="height:${(d.posted / max) * 100}%"></div><div class="bar rescued" style="height:${(d.rescued / max) * 100}%"></div></div><span>${esc(d.label)}</span></div>`).join('') + '<div class="chart-legend"><i class="posted"></i>Posted <i class="rescued"></i>Rescued</div>';
    $('rescueRateLabel').textContent = a.data.rescueRate == null ? 'Rescue rate: not enough data yet' : `Rescue rate: ${a.data.rescueRate}% of finished listings were rescued, not wasted`;
    const colors = { Veg: '#22c55e', 'Non-Veg': '#ef4444', Vegan: '#14b8a6', Bakery: '#f59e0b' };
    const total = Object.values(a.data.byType).reduce((s, v) => s + v, 0);
    let acc = 0;
    const stops = Object.entries(a.data.byType).filter(([, v]) => v > 0).map(([k, v]) => { const st = acc; acc += (v / total) * 100; return `${colors[k]} ${st}% ${acc}%`; });
    $('typeDonut').style.background = total ? `conic-gradient(${stops.join(',')})` : 'var(--surface-2)';
    $('typeDonut').dataset.total = total;
    $('typeLegend').innerHTML = Object.entries(a.data.byType).map(([k, v]) => `<div><i style="background:${colors[k]}"></i>${esc(k)} <b>${v}</b></div>`).join('');
  }
  if (l.ok) {
    const board = (arr) => arr.length ? arr.map((x, i) => `<li><span class="medal">${i + 1}</span><span class="nm">${esc(x.name)}</span><b>${x.meals} meals</b></li>`).join('') : '<li class="muted">No completed rescues yet.</li>';
    $('donorBoard').innerHTML = board(l.data.donors); $('ngoBoard').innerHTML = board(l.data.ngos);
  }
}

/* ── Roadmap ── */
const ROADMAP = [
  ['shipped', 'Role-based accounts and dashboards', 'Separate menus and dashboards for donors, NGOs, volunteers and admins, with server-enforced permissions.'],
  ['shipped', 'Live map and smart ranking', 'Listings ranked by distance and time left, with a live map and filters.'],
  ['shipped', 'Claim, collect and rate', 'NGOs claim a pickup, a 4-digit PIN verifies the handover, and quality is rated afterwards.'],
  ['shipped', 'Live GPS and volunteer tracking', 'Watch a volunteer approach the pickup point in real time.'],
  ['shipped', 'Real-time updates', 'Every post, claim and collection appears instantly for everyone.'],
  ['shipped', 'Find food and ask for help', 'People can find free food nearby, or ask for it and follow the request until someone arrives.'],
  ['shipped', 'Tap-only donating', 'A five-step flow for donors who are short on time.'],
  ['shipped', 'Insights and leaderboards', 'Seven-day activity, rescue rate, diet split and top donors and NGOs.'],
  ['shipped', 'Admin tools and audit log', 'Change roles, suspend accounts, moderate listings and review every action.'],
  ['shipped', 'English, Hindi and Kannada', 'With read-aloud for people who prefer to listen.'],
  ['next', 'Installable mobile app', 'Add to home screen with cached listings for patchy campus Wi-Fi.'],
  ['shipped', 'Persistent sign-in and password reset', 'Stay signed in across restarts, and recover a forgotten password with a one-time code.'],
  ['next', 'Email delivery for sign-in codes', 'Send reset codes and verification links by email instead of showing them on screen.'],
  ['future', 'Recurring surplus schedules', 'Messes and canteens post surplus automatically on chosen days.'],
  ['future', 'Route planner', 'Combine several pickups into one efficient trip for volunteers.'],
  ['future', 'SMS and WhatsApp alerts', 'Radius-based alerts on the channels people already use.'],
  ['future', 'Reports and certificates', 'Monthly impact reports and certificates for donors and volunteers.'],
  ['future', 'Photo-based freshness analysis', 'Grade freshness from a photo of the food.'],
  ['future', 'Multi-campus network', 'Connect several campuses and nearby restaurants.'],
];
function renderRoadmap() {
  const label = { shipped: 'Live', next: 'In progress', future: 'On hold' };
  $('roadmapBody').innerHTML = ROADMAP.map(([s, t, d]) => `<div class="road"><span class="st ${s}">${label[s]}</span><h4>${esc(t)}</h4><p>${esc(d)}</p></div>`).join('');
}

/* ── Features that are designed but on hold ── */
const SOON = {
  schedules: { icon: 'calendar', title: 'Recurring surplus schedules', status: 'On hold', desc: 'Set it once and your mess or canteen posts surplus automatically on the days and times you choose.', bullets: ['Daily, weekly or event-based schedules', 'Pre-filled from your usual menu', 'Pause during holidays and exams'] },
  routes: { icon: 'route', title: 'Route planner', status: 'On hold', desc: 'Combine several pickups into one efficient trip so volunteers cover more ground in less time.', bullets: ['Multi-stop routes ordered by expiry time', 'Live arrival estimates for donors and NGOs', 'Works with live GPS'] },
  reports: { icon: 'award', title: 'Reports and certificates', status: 'On hold', desc: 'Download impact reports for your institution and certificates for donors and volunteers.', bullets: ['Monthly PDF impact reports', 'Volunteer hour certificates', 'Summaries ready for CSR and NSS records'] },
  integrations: { icon: 'message', title: 'SMS and WhatsApp alerts', status: 'On hold', desc: 'Reach NGOs and volunteers on the channels they already use, within a radius you choose.', bullets: ['Radius-based alerts', 'Reply to claim a listing', 'Delivery receipts'] },
};
function renderSoon(id) {
  const s = SOON[id];
  if (!s) return;
  let notified = false; try { notified = localStorage.getItem('cf_notify_' + id) === '1'; } catch (e) { /* ignore */ }
  $('soonBody').innerHTML = `<div class="panel soon-card"><div class="s-ico">${ic(s.icon)}</div><span class="badge">${esc(s.status)}</span><h2>${esc(s.title)}</h2><p class="muted">${esc(s.desc)}</p>
    <ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    <div class="action-row"><button class="btn btn-primary" data-act="notify" data-id="${esc(id)}" ${notified ? 'disabled' : ''}>${notified ? 'You will be notified' : 'Notify me when it is ready'}</button><button class="btn btn-ghost" data-go="dashboard">Back to dashboard</button></div></div>`;
}

/* ── Settings ── */
function renderSettings() {
  if (!currentUser) return;
  const u = currentUser;
  const row = (k, v) => `<dt>${esc(k)}</dt><dd>${esc(v || 'Not set')}</dd>`;
  const soonRow = (label, meta) => `<div class="soon-row"><span>${esc(label)} <span class="soon-pill">Soon</span><div class="meta">${esc(meta)}</div></span><span class="switch"></span></div>`;
  $('settingsBody').innerHTML = `<div class="two-col">
    <div>
      <div class="panel"><h2>Profile</h2><dl class="kv" style="margin-top:12px">${row('Name', u.name)}${row('Email', u.email)}${row('Role', ROLE_LABEL[u.role])}${row('Organization', u.organization)}${row('Phone', u.phone)}</dl></div>
      <div class="panel"><h2>Security</h2>
        <form id="pwForm" style="padding:12px 0;border-top:1px solid var(--border)"><div style="font-weight:600;margin-bottom:10px">Change password</div>
          <div class="form-row"><div class="form-group"><label for="pwCur">Current password</label><input type="password" id="pwCur" class="input" autocomplete="current-password" required /></div><div class="form-group"><label for="pwNew">New password</label><input type="password" id="pwNew" class="input" autocomplete="new-password" placeholder="At least 6 characters" required /></div></div>
          <div class="form-error" id="pwError" role="alert" hidden></div><button type="submit" class="btn btn-secondary btn-sm">Update password</button></form>
        <div class="soon-row"><span>Sign out of this device<div class="meta">You will need to sign in again</div></span><button class="btn btn-secondary btn-sm" data-act="signout">Sign out</button></div></div>
    </div>
    <div>
      <div class="panel"><h2>Preferences</h2>
        <div class="soon-row"><span>Language</span><select id="setLang" class="input" style="width:auto"><option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option></select></div>
        <div class="soon-row"><span>Theme</span><select id="setTheme" class="input" style="width:auto"><option value="light">Light</option><option value="dark">Dark</option></select></div>
        <div class="soon-row"><span>Larger text and buttons</span><button class="btn btn-secondary btn-sm" id="setEasy">Toggle</button></div></div>
      <div class="panel"><h2>Notifications</h2>
        <div class="soon-row"><span>In-app alerts<div class="meta">Live updates inside the app</div></span><span class="switch on"></span></div>
        ${soonRow('SMS alerts', 'Text messages for nearby surplus')}${soonRow('WhatsApp alerts', 'Claim by replying to a message')}${soonRow('Email digest', 'A daily summary of your activity')}</div>
      <div class="panel"><h2>Your data</h2>${soonRow('Download my data', 'Export everything we hold about you')}</div>
    </div></div>`;
  $('setLang').value = lang; $('setTheme').value = document.documentElement.dataset.theme;
  $('setLang').addEventListener('change', (e) => setLang(e.target.value));
  $('setTheme').addEventListener('change', (e) => applyTheme(e.target.value));
  $('setEasy').addEventListener('click', () => setEasy(!document.body.classList.contains('easy')));
  $('pwForm').addEventListener('input', () => setFormError('pwError', ''));
  $('pwForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const r = await api('/api/auth/password', { method: 'POST', body: { current: $('pwCur').value, password: $('pwNew').value } });
    if (!r.ok) return setFormError('pwError', r.data.error || 'Could not change the password');
    $('pwCur').value = ''; $('pwNew').value = ''; showToast(r.data.message);
  });
}

/* ── Actions ── */
async function act(path, body, ok) {
  lastOwnAction = Date.now();
  const r = await api(path, { method: 'POST', body: body || {} });
  showToast(r.ok ? ok : (r.data.error || 'Action failed'));
  refreshCurrent();
  return r.ok;
}
function openClaimModal(id) {
  if (!requireAuth('claim a listing')) return;
  $('claimListingIdInput').value = id;
  $('claimNgoName').value = currentUser.organization || currentUser.name;
  $('claimVolunteerName').value = currentUser.name.replace(/\s*\(.*\)\s*$/, '');
  if (currentUser.phone) $('claimVolunteerPhone').value = currentUser.phone;
  $('claimModal').classList.add('active');
}
function openCollectModal(id) {
  if (!requireAuth('mark collected')) return;
  $('collectListingIdInput').value = id; $('collectPinInput').value = '';
  $('collectHint').textContent = currentUser.role === 'admin' ? 'Admins can collect without a PIN.' : 'Ask the donor for the 4-digit handover PIN shown on their listing.';
  $('collectModal').classList.add('active');
  setTimeout(() => $('collectPinInput').focus(), 100);
}
function openRateModal(id) { if (requireAuth('rate hygiene')) { $('rateListingIdInput').value = id; $('rateModal').classList.add('active'); } }
async function deleteListing(id) {
  if (!requireAuth('remove a listing') || !confirm('Remove this listing? This cannot be undone.')) return;
  lastOwnAction = Date.now();
  const r = await api(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  showToast(r.ok ? 'Listing removed' : (r.data.error || 'Could not remove')); refreshCurrent();
}
async function resetDemo() {
  if (!confirm('Reset all demo data? Accounts you created will be removed.')) return;
  const r = await api('/api/reset-demo', { method: 'POST' });
  if (!r.ok) return showToast(r.data.error || 'Reset failed');
  clearSession(); showToast('Demo data restored. Please sign in again.'); location.hash = '#/'; renderRoute();
}

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open-auth]'); if (open) return openAuth(open.dataset.openAuth);
  const goEl = e.target.closest('[data-go]'); if (goEl) return go(goEl.dataset.go);
  const navEl = e.target.closest('[data-route]'); if (navEl) return go(navEl.dataset.route);
  const a = e.target.closest('[data-act]'); if (!a) return;
  const id = a.dataset.id;
  ({
    claim: () => openClaimModal(id), collect: () => openCollectModal(id), rate: () => openRateModal(id), delete: () => deleteListing(id),
    release: () => requireAuth('release a pickup') && act(`/api/listings/${encodeURIComponent(id)}/release`, {}, 'Claim released. The listing is available again.'),
    signout: signOut, reset: resetDemo,
    notify: () => { try { localStorage.setItem('cf_notify_' + id, '1'); } catch (e) { /* ignore */ } showToast("Thanks. We'll let you know when it is ready."); renderSoon(id); },
    suspend: async () => { if (a.dataset.val === '1' && !(await confirmDialog({ title: 'Suspend this user?', message: 'They will be signed out and unable to sign in until you reactivate them.', confirmText: 'Suspend', danger: true }))) return; lastOwnAction = Date.now(); const r = await api(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: { suspended: a.dataset.val === '1' } }); showToast(r.ok ? 'User updated' : (r.data.error || 'Failed')); loadUsers(); },
  }[a.dataset.act] || (() => {}))();
});

/* ── Command palette ── */
let cmdItems = [], cmdSel = 0;
function openCmd() {
  const role = roleOf();
  cmdItems = [
    ...NAV[role].map(([id, label, icon]) => ({ label: `Go to ${label}`, icon, run: () => go(id) })),
    { label: watchId !== null ? 'Stop live GPS' : 'Start live GPS', icon: 'pin', run: toggleLiveGps },
    { label: 'Switch light / dark theme', icon: 'sun', run: toggleTheme },
    currentUser ? { label: 'Sign out', icon: 'logout', run: signOut } : { label: 'Sign in / Sign up', icon: 'users', run: () => openAuth('signin') },
  ];
  $('cmdModal').classList.add('active'); $('cmdInput').value = ''; renderCmd(); setTimeout(() => $('cmdInput').focus(), 50);
}
function renderCmd() {
  const q = $('cmdInput').value.toLowerCase();
  const shown = cmdItems.filter((c) => c.label.toLowerCase().includes(q));
  cmdSel = Math.min(cmdSel, Math.max(0, shown.length - 1));
  $('cmdList').innerHTML = shown.map((c, i) => `<li class="${i === cmdSel ? 'sel' : ''}" data-i="${cmdItems.indexOf(c)}">${ic(c.icon)}<span>${esc(c.label)}</span></li>`).join('') || '<li>No matches</li>';
}
function runCmd(i) { $('cmdModal').classList.remove('active'); if (cmdItems[i]) cmdItems[i].run(); }

/* ── Theme ── */
const THEMES = ['light', 'dark'];
const THEME_ICON = { light: 'moon', dark: 'sun' }; // icon hints at the NEXT theme
function applyTheme(t) {
  if (!THEMES.includes(t)) t = 'light';
  document.documentElement.dataset.theme = t;
  $('themeBtn').innerHTML = ic(THEME_ICON[t]);
  $('themeBtn').title = `Theme: ${t} (click to switch)`;
  try { localStorage.setItem('cf_theme', t); } catch (e) { /* ignore */ }
  setBaseMap();
}
const toggleTheme = () => applyTheme(THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % THEMES.length]);

/* ── Map: keyless Esri tiles first, OSM mirrors as automatic fallback ── */
const TILE_PROVIDERS = [
  // Esri World Street Map: no API key and no Referer requirement
  () => ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 19, attribution: 'Tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors' } }),
  () => ({ url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', opts: { subdomains: 'abc', maxZoom: 19, attribution: '&copy; OpenStreetMap contributors, HOT' } }),
  () => ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' } }),
];
let tileLayer = null, tileProvider = 0, tileLoads = 0, tileErrors = 0;
function setBaseMap() {
  if (!map) return;
  if (tileLayer) map.removeLayer(tileLayer);
  const p = TILE_PROVIDERS[tileProvider](document.documentElement.dataset.theme === 'dark');
  tileLayer = L.tileLayer(p.url, p.opts).addTo(map);
  tileLoads = 0; tileErrors = 0;
  tileLayer.on('tileload', () => { tileLoads += 1; });
  tileLayer.on('tileerror', () => {
    tileErrors += 1;
    if (tileLoads === 0 && tileErrors >= 4 && tileProvider < TILE_PROVIDERS.length - 1) { tileProvider += 1; setBaseMap(); }
  });
}
function initMap() {
  if (typeof L === 'undefined') {
    $('rescueMap').innerHTML = '<div class="empty" style="margin:1rem">The map library could not load. Listings and everything else still work below.</div>';
    return;
  }
  map = L.map('rescueMap').setView([ngoLocation.lat, ngoLocation.lng], 14);
  markersLayer = L.layerGroup().addTo(map);
  volLayer = L.layerGroup().addTo(map);
  setBaseMap();
}
const toggleLiveGps = () => (watchId !== null ? stopLiveGps() : startLiveGps());

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  let theme = 'light'; try { theme = localStorage.getItem('cf_theme') || 'light'; } catch (e) { /* ignore */ }
  applyTheme(theme);
  $('brandMark').innerHTML = ic('leaf'); $('menuBtn').innerHTML = ic('menu'); $('cmdIcon').innerHTML = ic('search'); $('bellIcon').innerHTML = ic('bell'); $('gpsIcon').innerHTML = ic('pin');
  ['closeNotif', 'closeAuthModalBtn', 'closeClaimModalBtn', 'closeCollectModalBtn', 'closeRateModalBtn'].forEach((id) => { $(id).innerHTML = ic('x'); });
  const live = document.createElement('span'); live.id = 'liveBadge'; live.className = 'live-badge'; live.innerHTML = '<i></i>Live';
  document.querySelector('.top-actions').prepend(live);

  initMap();
  if (map) map.on('click', (e) => {
    pickupDirty = true;
    $('pickupLat').value = Number(e.latlng.lat.toFixed(5)); $('pickupLng').value = Number(e.latlng.lng.toFixed(5));
    showToast(`Pickup pin set to ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
  });
  updateNgoCoordsUI();
  ['pickupLat', 'pickupLng'].forEach((id) => $(id).addEventListener('input', () => { pickupDirty = true; }));

  // role cards on the guest home page
  const roleCards = [
    ['donor', 'Donor / Mess', 'heart', ['Post surplus in seconds', 'Share a handover PIN', 'Track every rescue'], 'donor@campusfoodshare.org|donor123'],
    ['ngo', 'NGO / Receiver', 'users', ['Claim the nearest food', 'Dispatch a volunteer', 'Rate hygiene'], 'ngo@campusfoodshare.org|ngo123'],
    ['volunteer', 'Volunteer', 'truck', ['See assigned tasks', 'Turn-by-turn directions', 'PIN-verified collection'], 'volunteer@campusfoodshare.org|vol123'],
    ['admin', 'Admin', 'shield', ['Moderate all listings', 'Manage users and roles', 'Audit every action'], 'admin@campusfoodshare.org|admin123'],
  ];
  $('roleCards').innerHTML = roleCards.map(([role, name, icon, pts]) => `<button class="role-card" data-role-login="${role}"><div class="ico">${ic(icon)}</div><h4>${name}</h4><ul>${pts.map((p) => `<li>${p}</li>`).join('')}</ul><span class="go">Sign in as ${name} →</span></button>`).join('');
  $('roleCards').addEventListener('click', (e) => { const c = e.target.closest('[data-role-login]'); if (c) { openAuth('signin', c.dataset.roleLogin); setTimeout(() => $('siEmail').focus(), 120); } });

  loadSafetyChecklist();
  await checkAuth();
  updateAuthUI();
  connectStream();

  // auth modal wiring
  document.querySelectorAll('.auth-tab').forEach((t) => t.addEventListener('click', () => switchAuthTab(t.dataset.mode)));
  document.querySelector('.switch-to-signin').addEventListener('click', () => switchAuthTab('signin'));
  document.querySelectorAll('#signupForm .role-chip').forEach((c) => c.addEventListener('click', () => { document.querySelectorAll('#signupForm .role-chip').forEach((x) => x.classList.remove('active')); c.classList.add('active'); selectedRole = c.dataset.role; }));
  document.querySelectorAll('[data-demo]').forEach((el) => el.addEventListener('click', () => { const [em, pw] = el.dataset.demo.split('|'); $('siEmail').value = em; $('siPassword').value = pw; }));
  [['siTogglePwd', 'siPassword'], ['suTogglePwd', 'suPassword']].forEach(([b, i]) => $(b).addEventListener('click', () => { $(i).type = $(i).type === 'password' ? 'text' : 'password'; $(b).textContent = $(i).type === 'password' ? 'Show' : 'Hide'; }));
  $('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('siEmail').value.trim() || !$('siPassword').value) return showToast('Enter your email and password');
    if (!selectedSiRole) return showToast('Choose the role you are signing in as');
    if (await doSignIn($('siEmail').value.trim(), $('siPassword').value, selectedSiRole)) { $('signinForm').reset(); setSiRole(''); }
  });
  document.querySelectorAll('#siRoleChips .role-chip').forEach((c) => c.addEventListener('click', () => setSiRole(c.dataset.role)));
  $('signupForm').addEventListener('submit', handleSignUp);
  $('authChip').addEventListener('click', () => (currentUser ? go('dashboard') : openAuth('signin')));
  $('closeAuthModalBtn').addEventListener('click', () => $('authModal').classList.remove('active'));

  // modals
  $('closeClaimModalBtn').addEventListener('click', () => $('claimModal').classList.remove('active'));
  $('closeCollectModalBtn').addEventListener('click', () => $('collectModal').classList.remove('active'));
  $('closeRateModalBtn').addEventListener('click', () => $('rateModal').classList.remove('active'));
  document.querySelectorAll('.modal-overlay').forEach((m) => m.addEventListener('click', (ev) => { if (ev.target === m) m.classList.remove('active'); }));
  $('claimModalForm').addEventListener('submit', async (e) => { e.preventDefault(); if (await act(`/api/listings/${encodeURIComponent($('claimListingIdInput').value)}/claim`, { ngoName: $('claimNgoName').value, volunteerName: $('claimVolunteerName').value, volunteerPhone: $('claimVolunteerPhone').value }, 'Pickup claimed. Handover PIN generated for the donor.')) $('claimModal').classList.remove('active'); });
  $('collectModalForm').addEventListener('submit', async (e) => { e.preventDefault(); if (await act(`/api/listings/${encodeURIComponent($('collectListingIdInput').value)}/collect`, { code: $('collectPinInput').value }, 'Collection verified. Impact counters updated.')) $('collectModal').classList.remove('active'); });
  $('rateModalForm').addEventListener('submit', async (e) => { e.preventDefault(); const rating = Number($('rateStarValue').value); if (await act(`/api/listings/${encodeURIComponent($('rateListingIdInput').value)}/feedback`, { rating, comment: $('rateCommentInput').value }, `${rating}-star review recorded. Thank you!`)) $('rateModal').classList.remove('active'); });
  document.querySelectorAll('.star-btn').forEach((b) => b.addEventListener('click', () => { const v = Number(b.dataset.val); $('rateStarValue').value = v; document.querySelectorAll('.star-btn').forEach((x) => x.classList.toggle('active', Number(x.dataset.val) <= v)); }));

  // filters
  $('statusFilter').addEventListener('change', loadListings);
  $('typeFilter').addEventListener('change', loadListings);
  $('searchInput').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadListings, 250); });

  // chrome
  $('menuBtn').addEventListener('click', () => { $('sidebar').classList.add('open'); $('scrim').classList.add('show'); });
  $('scrim').addEventListener('click', closeSidebar);
  $('themeBtn').addEventListener('click', toggleTheme);
  $('useMyLocationBtn').addEventListener('click', toggleLiveGps);
  $('bellBtn').addEventListener('click', () => { $('notifDrawer').classList.toggle('open'); try { localStorage.setItem('cf_seen', String(Date.now())); } catch (e) { /* ignore */ } $('bellDot').style.display = 'none'; });
  $('closeNotif').addEventListener('click', () => $('notifDrawer').classList.remove('open'));
  $('cmdBtn').addEventListener('click', openCmd);
  $('cmdInput').addEventListener('input', () => { cmdSel = 0; renderCmd(); });
  $('cmdList').addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) runCmd(Number(li.dataset.i)); });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
    if ($('cmdModal').classList.contains('active')) {
      const n = $('cmdList').querySelectorAll('li[data-i]').length;
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdSel = (cmdSel + 1) % Math.max(1, n); renderCmd(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdSel = (cmdSel - 1 + n) % Math.max(1, n); renderCmd(); }
      if (e.key === 'Enter') { const li = $('cmdList').querySelectorAll('li[data-i]')[cmdSel]; if (li) runCmd(Number(li.dataset.i)); }
    }
  });
  window.addEventListener('hashchange', renderRoute);

  // post form
  document.querySelectorAll('.chip-btn').forEach((c) => c.addEventListener('click', () => { $('foodTitle').value = c.dataset.title; $('foodType').value = c.dataset.type; $('quantityMeals').value = c.dataset.meals; showToast('Dish preset loaded'); }));
  $('runAiScanBtn').addEventListener('click', runAiFoodScanner);
  $('donorForm').addEventListener('submit', handleDonorSubmit);

  setInterval(tickCountdowns, 1000);
  setInterval(refreshCurrent, 60000); // safety net if the live stream drops
  setInterval(() => { if (currentRoute() === 'explore') loadLocations(); }, 15000);
  // GPS heartbeat: stationary devices stop emitting updates, so poll a fresh reading and keep sharing alive
  setInterval(() => {
    if (watchId !== null && navigator.geolocation) navigator.geolocation.getCurrentPosition(onPosition, () => {}, { maximumAge: 10000, timeout: 15000 });
  }, 20000);
  // GPS watchdog: restart tracking if it ever dropped (unless the user turned it off or it is blocked)
  const gpsWatchdog = () => {
    let p = null; try { p = localStorage.getItem('cf_live'); } catch (e) { /* ignore */ }
    if (watchId === null && !gpsBlocked && p !== '0' && !document.hidden) startLiveGps();
  };
  setInterval(gpsWatchdog, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) gpsWatchdog(); });
  $('gpsBanner').addEventListener('click', toggleLiveGps);

  // live GPS is on by default; it stays off only if the user switched it off themselves
  let pref = null;
  try { pref = localStorage.getItem('cf_live'); } catch (e) { /* ignore */ }
  setLiveUI(false);
  if (pref !== '0') startLiveGps();
  renderRoute();
});

/* ── Donor form & AI scanner ── */
async function loadSafetyChecklist() {
  const r = await api('/api/checklist');
  $('safetyChecklistContainer').innerHTML = (r.data.checklist || []).map((i) => `<label class="check-item"><input type="checkbox" name="safetyCheck" value="${esc(i.id)}" required /><span>${esc(i.label)}</span></label>`).join('');
}
async function runAiFoodScanner() {
  const file = $('foodImageInput').files && $('foodImageInput').files[0];
  const r = await api('/api/ai-detect', { method: 'POST', body: { foodTitle: $('foodTitle').value || 'Cooked Campus Meal', imageName: file ? file.name : '', hoursSinceCooked: 1 } });
  if (!r.ok) return;
  latestAiScan = r.data; $('foodType').value = r.data.detectedType;
  $('aiScanResult').textContent = `Detected ${r.data.detectedType} · Freshness ${r.data.freshnessScore}% (${r.data.freshnessStatus}) · safe for ~${r.data.recommendedSafeHours} h`;
  showToast(`Freshness estimate: ${r.data.freshnessScore}%`);
}
async function handleDonorSubmit(e) {
  e.preventDefault();
  if (!requireAuth('post surplus food')) return;
  if (currentUser.role !== 'donor' && currentUser.role !== 'admin') return showToast('Only donor or admin accounts can post food');
  const fb = $('formFeedback');
  const checked = Array.from(document.querySelectorAll('input[name="safetyCheck"]:checked')).map((c) => c.value);
  const total = document.querySelectorAll('input[name="safetyCheck"]').length;
  lastOwnAction = Date.now();
  const r = await api('/api/listings', { method: 'POST', body: {
    donorName: $('donorName').value, donorPhone: $('donorPhone').value, foodType: $('foodType').value, foodTitle: $('foodTitle').value,
    quantityMeals: Number($('quantityMeals').value), aiFreshnessScore: latestAiScan.freshnessScore, aiFreshnessStatus: latestAiScan.freshnessStatus,
    useBefore: new Date(Date.now() + parseFloat($('hoursValid').value) * 3600000).toISOString(),
    safetyChecklistConfirmed: total > 0 && checked.length === total, checklistItems: checked,
    location: { address: $('pickupAddress').value, lat: parseFloat($('pickupLat').value), lng: parseFloat($('pickupLng').value) },
  } });
  if (!r.ok) { fb.style.color = 'var(--red)'; fb.textContent = (r.data.details || [r.data.error || 'Could not post']).join(', '); return; }
  fb.style.color = 'var(--green)'; fb.textContent = 'Surplus food broadcast successfully!';
  showToast('Surplus alert published to nearby NGOs');
  $('foodTitle').value = ''; document.querySelectorAll('input[name="safetyCheck"]').forEach((c) => { c.checked = false; });
  setTimeout(() => { fb.textContent = ''; go('mylistings'); }, 900);
  setTimeout(() => go('mylistings'), 700);
}
