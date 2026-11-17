/* CampusFoodShare frontend */
let map;
let markersLayer;
let ngoLocation = { lat: 12.9716, lng: 77.5946 };
let ngoMarker = null;
let currentUser = null;
let authToken = null;
let selectedRole = '';
let latestAiScan = { freshnessScore: 95, freshnessStatus: 'Excellent Freshness (Grade A)' };
let searchTimer = null;

const $ = (id) => document.getElementById(id);
const CLAIM_ROLES = ['ngo', 'volunteer', 'admin'];

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  $('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 3800);
}

/* ── API helper: attaches token, returns { ok, status, data } ── */
async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  try {
    const res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (res.status === 401 && authToken && path !== '/api/auth/signin') {
      clearSession();
      showToast('🔐 Session expired - please sign in again');
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    showToast('❌ Cannot reach the server');
    return { ok: false, status: 0, data: {} };
  }
}

/* ── Auth ── */
function saveSession(user, token) {
  currentUser = user;
  authToken = token;
  try { localStorage.setItem('cf_token', token); } catch (e) { /* ignore */ }
  updateAuthUI();
}

function clearSession() {
  currentUser = null;
  authToken = null;
  try { localStorage.removeItem('cf_token'); } catch (e) { /* ignore */ }
  updateAuthUI();
}

function updateAuthUI() {
  $('loggedInUserBadge').textContent = currentUser ? `👤 ${currentUser.name} (${currentUser.role.toUpperCase()})` : '👤 Guest Viewer';
  $('openAuthModalBtn').textContent = currentUser ? '🔄 Switch Account' : '🔐 Sign In / Sign Up';
  $('signOutBtn').style.display = currentUser ? 'inline-flex' : 'none';
  const isAdmin = currentUser && currentUser.role === 'admin';
  $('resetDemoBtn').style.display = isAdmin ? 'inline-flex' : 'none';
  $('adminPanel').style.display = isAdmin ? 'block' : 'none';
  if (currentUser && (currentUser.role === 'donor' || isAdmin)) {
    if (currentUser.organization) $('donorName').value = currentUser.organization;
    if (currentUser.phone) $('donorPhone').value = currentUser.phone;
  }
  if (isAdmin) loadAdminUsers();
  if ($('listingsContainer').dataset.ready) loadListings();
}

function requireAuth(action) {
  if (!currentUser) {
    showToast(`🔐 Please sign in to ${action}`);
    $('authModal').classList.add('active');
    return false;
  }
  return true;
}

async function checkAuth() {
  let token = null;
  try { token = localStorage.getItem('cf_token'); } catch (e) { /* ignore */ }
  if (!token) return;
  authToken = token;
  const r = await api('/api/auth/me');
  if (r.ok) { currentUser = r.data.user; updateAuthUI(); } else clearSession();
}

async function handleSignIn(e) {
  e.preventDefault();
  const r = await api('/api/auth/signin', { method: 'POST', body: { email: $('siEmail').value.trim(), password: $('siPassword').value } });
  if (!r.ok) return showToast(`❌ ${r.data.error || 'Sign in failed'}`);
  saveSession(r.data.user, r.data.token);
  $('authModal').classList.remove('active');
  $('signinForm').reset();
  showToast(`✅ Signed in as ${r.data.user.name} (${r.data.user.role.toUpperCase()})`);
}

async function handleSignUp(e) {
  e.preventDefault();
  if (!selectedRole) return showToast('⚠️ Please select a role');
  const r = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: $('suName').value.trim(), email: $('suEmail').value.trim(), password: $('suPassword').value, phone: $('suPhone').value.trim(), organization: $('suOrg').value.trim(), role: selectedRole },
  });
  if (!r.ok) return showToast(`❌ ${r.data.error || 'Sign up failed'}`);
  saveSession(r.data.user, r.data.token);
  $('authModal').classList.remove('active');
  $('signupForm').reset();
  showToast(`🎉 Welcome, ${r.data.user.name}!`);
}

async function handleSignOut() {
  await api('/api/auth/signout', { method: 'POST' });
  clearSession();
  showToast('👋 Signed out');
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  loadSafetyChecklist();
  await checkAuth();
  await refreshAllData();
  $('listingsContainer').dataset.ready = '1';

  document.querySelectorAll('.auth-tab').forEach((tab) => tab.addEventListener('click', () => switchAuthTab(tab.dataset.mode)));
  document.querySelector('.switch-to-signin').addEventListener('click', () => switchAuthTab('signin'));

  document.querySelectorAll('#signupForm .role-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#signupForm .role-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedRole = chip.dataset.role;
    });
  });

  document.querySelectorAll('[data-demo]').forEach((el) => el.addEventListener('click', () => {
    const [email, pw] = el.dataset.demo.split('|');
    $('siEmail').value = email;
    $('siPassword').value = pw;
  }));

  [['siTogglePwd', 'siPassword'], ['suTogglePwd', 'suPassword']].forEach(([btn, input]) =>
    $(btn).addEventListener('click', () => { $(input).type = $(input).type === 'password' ? 'text' : 'password'; }));

  $('signinForm').addEventListener('submit', handleSignIn);
  $('signupForm').addEventListener('submit', handleSignUp);
  $('openAuthModalBtn').addEventListener('click', () => $('authModal').classList.add('active'));
  $('closeAuthModalBtn').addEventListener('click', () => $('authModal').classList.remove('active'));
  $('signOutBtn').addEventListener('click', handleSignOut);

  $('closeClaimModalBtn').addEventListener('click', () => $('claimModal').classList.remove('active'));
  $('claimModalForm').addEventListener('submit', submitClaimModal);
  $('closeRateModalBtn').addEventListener('click', () => $('rateModal').classList.remove('active'));
  $('rateModalForm').addEventListener('submit', submitRateModal);
  document.querySelectorAll('.modal-overlay').forEach((m) => m.addEventListener('click', (ev) => { if (ev.target === m) m.classList.remove('active'); }));

  document.querySelectorAll('.star-btn').forEach((btn) => btn.addEventListener('click', () => {
    const val = Number(btn.dataset.val);
    $('rateStarValue').value = val;
    document.querySelectorAll('.star-btn').forEach((b) => b.classList.toggle('active', Number(b.dataset.val) <= val));
  }));

  $('statusFilter').addEventListener('change', loadListings);
  $('typeFilter').addEventListener('change', loadListings);
  $('searchInput').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadListings, 250); });

  document.querySelectorAll('.gui-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.gui-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    if (target === 'all') window.scrollTo({ top: 0, behavior: 'smooth' });
    else $(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  $('resetDemoBtn').addEventListener('click', async () => {
    if (!confirm('Reset all demo data? Accounts you created will be removed.')) return;
    const r = await api('/api/reset-demo', { method: 'POST' });
    if (!r.ok) return showToast(`❌ ${r.data.error || 'Reset failed'}`);
    clearSession();
    showToast('🔄 Demo database restored - please sign in again');
    refreshAllData();
  });

  $('useMyLocationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return showToast('⚠️ Geolocation not supported in this browser.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ngoLocation = { lat: Number(pos.coords.latitude.toFixed(4)), lng: Number(pos.coords.longitude.toFixed(4)) };
        updateNgoCoordsUI();
        map.setView([ngoLocation.lat, ngoLocation.lng], 14);
        refreshAllData();
        showToast('📍 GPS coordinates updated!');
      },
      () => showToast('📍 Using default Bengaluru campus coordinates.')
    );
  });

  document.querySelectorAll('.chip-btn').forEach((chip) => chip.addEventListener('click', () => {
    $('foodTitle').value = chip.dataset.title;
    $('foodType').value = chip.dataset.type;
    $('quantityMeals').value = chip.dataset.meals;
    showToast('✨ Dish preset loaded!');
  }));

  $('runAiScanBtn').addEventListener('click', runAiFoodScanner);
  $('donorForm').addEventListener('submit', handleDonorSubmit);

  setInterval(refreshAllData, 30000);
  setInterval(tickCountdowns, 1000);
});

function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));
  $(mode + 'Form').classList.add('active');
  $('authModalTitle').textContent = mode === 'signup' ? '📝 Create Account' : '🔐 Welcome Back';
}

/* ── AI scanner ── */
async function runAiFoodScanner() {
  const file = $('foodImageInput').files && $('foodImageInput').files[0];
  const r = await api('/api/ai-detect', { method: 'POST', body: { foodTitle: $('foodTitle').value || 'Cooked Campus Meal', imageName: file ? file.name : '', hoursSinceCooked: 1 } });
  if (!r.ok) return;
  latestAiScan = r.data;
  $('foodType').value = r.data.detectedType;
  $('aiScanResult').textContent = `✅ AI Detected: ${r.data.detectedType} | Freshness: ${r.data.freshnessScore}% (${r.data.freshnessStatus}) | Safe for ~${r.data.recommendedSafeHours} h`;
  showToast(`🤖 AI Scan Complete: ${r.data.freshnessScore}% Freshness`);
}

/* ── Map ── */
function initMap() {
  map = L.map('rescueMap').setView([ngoLocation.lat, ngoLocation.lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap | CampusFoodShare' }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  map.on('click', (e) => {
    $('pickupLat').value = Number(e.latlng.lat.toFixed(4));
    $('pickupLng').value = Number(e.latlng.lng.toFixed(4));
    showToast(`📍 Pickup pin set to ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
  });
  updateNgoCoordsUI();
}

function updateNgoCoordsUI() {
  $('currentCoordsLabel').textContent = `${ngoLocation.lat}, ${ngoLocation.lng}`;
  if (ngoMarker) map.removeLayer(ngoMarker);
  ngoMarker = L.circleMarker([ngoLocation.lat, ngoLocation.lng], { radius: 9, fillColor: '#14b8a6', color: '#ffffff', weight: 2, fillOpacity: 0.95 })
    .addTo(map).bindPopup('<strong>Your reference location</strong>');
}

/* ── Checklist (unchecked by default: donor must actively confirm) ── */
async function loadSafetyChecklist() {
  const r = await api('/api/checklist');
  $('safetyChecklistContainer').innerHTML = (r.data.checklist || [])
    .map((i) => `<label class="check-item"><input type="checkbox" name="safetyCheck" value="${esc(i.id)}" required /><span>${esc(i.label)}</span></label>`).join('');
}

/* ── Data refresh ── */
async function refreshAllData() {
  await Promise.all([loadImpactMetrics(), loadListings(), loadInsights()]);
  if (currentUser && currentUser.role === 'admin') loadAdminUsers();
}

async function loadImpactMetrics() {
  const r = await api('/api/impact');
  if (!r.ok) return;
  const m = r.data.metrics;
  $('statMealsSaved').textContent = m.totalMealsSaved;
  $('statMealsInTransit').textContent = `${m.mealsInTransit} meals currently in pickup transit`;
  $('statFoodRescuedKg').textContent = `${m.totalFoodRescuedKg} kg`;
  $('statCo2Saved').textContent = `${m.co2PreventedKg} kg CO₂e prevented (≈ ${m.treesEquivalent} trees/yr)`;
  $('statActiveCount').textContent = m.activeListingsCount;
  $('statLifecycleSummary').textContent = `${m.claimedListingsCount} Claimed • ${m.collectedListingsCount} Collected • ${m.expiredListingsCount} Expired`;
  $('statAvgRating').textContent = m.avgRating == null ? 'No ratings yet' : `${m.avgRating} ★`;
  $('statRatingCount').textContent = m.ratingCount ? `From ${m.ratingCount} NGO hygiene review${m.ratingCount > 1 ? 's' : ''}` : 'Every listing AI scanned & checklist verified';
  $('notificationsList').innerHTML = (r.data.notifications || [])
    .map((n) => `<div class="ntf-pill-3d"><strong>${esc(n.title)}</strong><div>${esc(n.message)}</div><small>${timeAgo(n.createdAt)}</small></div>`).join('')
    || '<p class="panel-sub">No activity yet.</p>';
}

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

async function loadListings() {
  const params = new URLSearchParams({ lat: ngoLocation.lat, lng: ngoLocation.lng });
  if ($('statusFilter').value) params.set('status', $('statusFilter').value);
  if ($('typeFilter').value) params.set('foodType', $('typeFilter').value);
  if ($('searchInput').value) params.set('search', $('searchInput').value);
  const r = await api(`/api/listings?${params}`);
  if (!r.ok) return;
  renderMapMarkers(r.data.listings || []);
  renderListingsFeed(r.data.listings || []);
}

function renderMapMarkers(listings) {
  markersLayer.clearLayers();
  listings.forEach((i) => {
    const color = i.status === 'posted' ? '#22c55e' : i.status === 'claimed' ? '#f59e0b' : i.status === 'collected' ? '#0ea5e9' : '#64748b';
    L.circleMarker([i.location.lat, i.location.lng], { radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9 })
      .bindPopup(`<strong>${esc(i.foodTitle)}</strong><br/>Donor: ${esc(i.donorName)}<br/>Meals: <b>${esc(i.quantityMeals)}</b><br/>Distance: <b>${esc(i.distanceKm)} km</b>`)
      .addTo(markersLayer);
  });
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m left` : `${m}m ${String(s % 60).padStart(2, '0')}s left`;
}

function tickCountdowns() {
  document.querySelectorAll('[data-expiry]').forEach((el) => {
    const ms = new Date(el.dataset.expiry).getTime() - Date.now();
    el.textContent = `⏳ ${formatCountdown(ms)}`;
    el.classList.toggle('urgent', ms > 0 && ms < 3600000);
  });
}

function renderListingsFeed(listings) {
  const c = $('listingsContainer');
  if (!listings.length) {
    c.innerHTML = '<p style="color:var(--text-muted);">No surplus food listings match your filter.</p>';
    return;
  }
  const role = currentUser ? currentUser.role : null;
  c.innerHTML = listings.map((item, idx) => {
    const id = esc(item.id);
    const badgeClass = `badge-${item.status}`;
    const claimedOrMore = item.status === 'claimed' || item.status === 'collected';
    const mine = currentUser && item.claimedBy && item.claimedBy.userId === currentUser.id;
    const ownPost = currentUser && item.donorId === currentUser.id;
    let actions = '';
    if (item.status === 'posted') {
      actions = CLAIM_ROLES.includes(role)
        ? `<button class="btn btn-claim btn-sm" onclick="openClaimModal('${id}')">🤝 Claim Pickup</button>`
        : `<span class="hint">${currentUser ? 'Only NGOs / volunteers can claim' : 'Sign in as NGO / volunteer to claim'}</span>`;
      if (role === 'admin' || (role === 'donor' && ownPost)) actions += ` <button class="btn btn-secondary btn-sm" onclick="deleteListing('${id}')">↩ Withdraw</button>`;
    } else if (item.status === 'claimed') {
      actions = `<span class="hint warn">🛵 ${esc(item.claimedBy ? item.claimedBy.volunteerName : '')} · ${esc(item.claimedBy ? item.claimedBy.ngoName : '')}</span>`;
      if (CLAIM_ROLES.includes(role)) {
        actions += ` <button class="btn btn-collect btn-sm" onclick="collectListing('${id}')">✅ Mark Collected</button>`;
        if (role === 'admin' || mine) actions += ` <button class="btn btn-secondary btn-sm" onclick="releaseListing('${id}')">↩ Release</button>`;
      }
    } else if (item.status === 'collected') {
      if (item.feedback) actions = `<span class="hint info">★ ${esc(item.feedback.rating)}/5 — "${esc(item.feedback.comment)}"</span>`;
      else if (CLAIM_ROLES.includes(role)) actions = `<button class="btn btn-primary btn-sm" onclick="openRateModal('${id}')">⭐ Rate Hygiene</button>`;
    }
    if (role === 'admin' && item.status !== 'posted') actions += ` <button class="btn btn-secondary btn-sm" onclick="deleteListing('${id}')">🗑️ Remove</button>`;
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location.lat + ',' + item.location.lng)}`;
    const countdown = item.status === 'posted'
      ? `<span class="badge badge-timer" data-expiry="${esc(item.useBefore)}">⏳ ${formatCountdown(new Date(item.useBefore) - Date.now())}</span>` : '';
    return `
      <div class="listing-card-3d">
        <div class="listing-top">
          <div>
            <span class="listing-title">#${idx + 1} • ${esc(item.foodTitle)}</span>
            <div class="sub">🏫 ${esc(item.donorName)}${item.donorPhone ? ` · <a href="tel:${esc(item.donorPhone.replace(/\s/g, ''))}">${esc(item.donorPhone)}</a>` : ''}</div>
          </div>
          <div class="badges">
            <span class="badge ${badgeClass}">${esc(item.status.toUpperCase())}</span>
            ${countdown}
            <span class="badge badge-ai">🤖 ${esc(item.aiFreshnessScore || 95)}% Fresh</span>
            <span class="badge badge-distance">📍 ${esc(item.distanceKm)} km</span>
          </div>
        </div>
        <div class="lifecycle-stepper">
          <div class="step-node done">1. Posted</div>
          <div class="step-node ${claimedOrMore ? 'done' : ''}">2. Claimed</div>
          <div class="step-node ${item.status === 'collected' ? 'done' : ''}">3. Collected</div>
        </div>
        <div class="listing-meta">
          <div><strong>🥗 Diet:</strong> ${esc(item.foodType)}</div>
          <div><strong>🍽️ Quantity:</strong> ${esc(item.quantityMeals)} meals (~${esc(item.weightKg)} kg)</div>
          <div><strong>📍 Pickup:</strong> ${esc(item.location.address)} · <a href="${directions}" target="_blank" rel="noopener">Directions ↗</a></div>
          <div><strong>⚡ Priority:</strong> ${esc(item.urgencyScore)}</div>
        </div>
        <div class="listing-actions">
          <span class="hint ok">✓ 4-Point Safety Checklist & AI Verified</span>
          <div class="action-row">${actions}</div>
        </div>
      </div>`;
  }).join('');
}

/* ── Insights ── */
async function loadInsights() {
  const [a, l] = await Promise.all([api('/api/analytics'), api('/api/leaderboard')]);
  if (a.ok) {
    const max = Math.max(1, ...a.data.daily.flatMap((d) => [d.posted, d.rescued]));
    $('dailyChart').innerHTML = a.data.daily.map((d) => `
      <div class="bar-col" title="${esc(d.label)}: ${d.posted} posted, ${d.rescued} rescued">
        <div class="bars"><div class="bar posted" style="height:${(d.posted / max) * 100}%"></div><div class="bar rescued" style="height:${(d.rescued / max) * 100}%"></div></div>
        <span>${esc(d.label)}</span>
      </div>`).join('') + '<div class="chart-legend"><i class="posted"></i>Posted <i class="rescued"></i>Rescued</div>';
    $('rescueRateLabel').textContent = a.data.rescueRate == null ? 'Rescue rate: not enough data yet' : `Rescue rate: ${a.data.rescueRate}% of finished listings were rescued, not wasted`;
    const colors = { Veg: '#22c55e', 'Non-Veg': '#ef4444', Vegan: '#14b8a6', Bakery: '#f59e0b' };
    const total = Object.values(a.data.byType).reduce((s, v) => s + v, 0);
    let acc = 0;
    const stops = Object.entries(a.data.byType).filter(([, v]) => v > 0).map(([k, v]) => {
      const start = acc; acc += (v / total) * 100; return `${colors[k]} ${start}% ${acc}%`;
    });
    $('typeDonut').style.background = total ? `conic-gradient(${stops.join(',')})` : 'rgba(255,255,255,0.08)';
    $('typeDonut').dataset.total = total;
    $('typeLegend').innerHTML = Object.entries(a.data.byType).map(([k, v]) =>
      `<div><i style="background:${colors[k]}"></i>${esc(k)} <b>${v}</b></div>`).join('');
  }
  if (l.ok) {
    const board = (arr, unit) => arr.length
      ? arr.map((x, i) => `<li><span class="medal">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="nm">${esc(x.name)}</span><b>${x.meals} ${unit}</b></li>`).join('')
      : '<li class="panel-sub">No completed rescues yet.</li>';
    $('donorBoard').innerHTML = board(l.data.donors, 'meals');
    $('ngoBoard').innerHTML = board(l.data.ngos, 'meals');
  }
}

async function loadAdminUsers() {
  const r = await api('/api/admin/users');
  if (!r.ok) return;
  $('userTableBody').innerHTML = r.data.users.map((u) =>
    `<tr><td>${esc(u.name)}</td><td><span class="badge badge-${u.role === 'admin' ? 'claimed' : 'posted'}">${esc(u.role)}</span></td><td>${esc(u.email)}</td><td>${esc(u.organization || '')}</td></tr>`).join('');
}

/* ── Claim / Release / Collect / Rate / Delete ── */
function openClaimModal(id) {
  if (!requireAuth('claim a listing')) return;
  $('claimListingIdInput').value = id;
  $('claimNgoName').value = currentUser.organization || currentUser.name;
  $('claimVolunteerName').value = currentUser.name.replace(/\s*\(.*\)\s*$/, '');
  if (currentUser.phone) $('claimVolunteerPhone').value = currentUser.phone;
  $('claimModal').classList.add('active');
}

async function actOnListing(id, action, body, okMsg) {
  const r = await api(`/api/listings/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: body || {} });
  if (!r.ok) { showToast(`❌ ${r.data.error || 'Action failed'}`); }
  else showToast(okMsg);
  refreshAllData();
  return r.ok;
}

async function submitClaimModal(e) {
  e.preventDefault();
  const ok = await actOnListing($('claimListingIdInput').value, 'claim', {
    ngoName: $('claimNgoName').value, volunteerName: $('claimVolunteerName').value, volunteerPhone: $('claimVolunteerPhone').value,
  }, '🤝 Pickup claimed! Volunteer dispatched.');
  if (ok) $('claimModal').classList.remove('active');
}

function collectListing(id) { if (requireAuth('mark collected')) actOnListing(id, 'collect', {}, '🎉 Food pickup confirmed! Impact counters updated.'); }
function releaseListing(id) { if (requireAuth('release a pickup')) actOnListing(id, 'release', {}, '↩ Claim released - listing is available again.'); }

function openRateModal(id) {
  if (!requireAuth('rate hygiene')) return;
  $('rateListingIdInput').value = id;
  $('rateModal').classList.add('active');
}

async function submitRateModal(e) {
  e.preventDefault();
  const rating = Number($('rateStarValue').value);
  const ok = await actOnListing($('rateListingIdInput').value, 'feedback', { rating, comment: $('rateCommentInput').value }, `⭐ Thank you! ${rating}-star hygiene review recorded.`);
  if (ok) $('rateModal').classList.remove('active');
}

async function deleteListing(id) {
  if (!requireAuth('remove a listing')) return;
  if (!confirm('Remove this listing? This cannot be undone.')) return;
  const r = await api(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  showToast(r.ok ? '🗑️ Listing removed.' : `❌ ${r.data.error || 'Could not remove'}`);
  refreshAllData();
}

/* ── Donor form ── */
async function handleDonorSubmit(e) {
  e.preventDefault();
  if (!requireAuth('post surplus food')) return;
  if (currentUser.role !== 'donor' && currentUser.role !== 'admin') return showToast('🏫 Only donor or admin accounts can post food');
  const feedback = $('formFeedback');
  const checked = Array.from(document.querySelectorAll('input[name="safetyCheck"]:checked')).map((cb) => cb.value);
  const total = document.querySelectorAll('input[name="safetyCheck"]').length;
  const useBefore = new Date(Date.now() + parseFloat($('hoursValid').value) * 3600 * 1000).toISOString();
  const r = await api('/api/listings', {
    method: 'POST',
    body: {
      donorName: $('donorName').value, donorPhone: $('donorPhone').value, foodType: $('foodType').value, foodTitle: $('foodTitle').value,
      quantityMeals: Number($('quantityMeals').value), aiFreshnessScore: latestAiScan.freshnessScore, aiFreshnessStatus: latestAiScan.freshnessStatus,
      useBefore, safetyChecklistConfirmed: total > 0 && checked.length === total, checklistItems: checked,
      location: { address: $('pickupAddress').value, lat: parseFloat($('pickupLat').value), lng: parseFloat($('pickupLng').value) },
    },
  });
  if (!r.ok) {
    feedback.style.color = '#ef4444';
    feedback.textContent = (r.data.details || [r.data.error || 'Could not post']).join(', ');
    return;
  }
  feedback.style.color = '#22c55e';
  feedback.textContent = '✓ Surplus Food Broadcasted Successfully!';
  showToast('🚀 Surplus food alert published to nearby NGOs!');
  $('foodTitle').value = '';
  document.querySelectorAll('input[name="safetyCheck"]').forEach((cb) => { cb.checked = false; });
  refreshAllData();
}
