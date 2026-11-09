/**
 * public/app.js
 * CampusFoodShare v2.0.0 Frontend
 * - Leaflet.js interactive map with live status markers
 * - Role Switcher (Donor, NGO/Receiver, Volunteer, Admin)
 * - AI Food Freshness Scanner
 * - Haversine + Priority Queue ranked listing feed
 * - Search & Dietary Filters
 * - NGO Claim / Collect / Feedback (posted -> claimed -> collected)
 * - Donor form with mandatory 4-point Food-Safety Checklist
 * - Real-time Notification Feed + CSV Export
 * - HTML5 Geolocation API
 */

let map;
let markersLayer;
let ngoLocation = { lat: 12.9716, lng: 77.5946 };
let ngoMarker = null;
let currentRole = 'donor';
let pendingRatingListingId = null;
let currentUserRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadSafetyChecklist();
  refreshAllData();

  document.getElementById('roleSwitch').addEventListener('change', (e) => {
    currentRole = e.target.value;
    refreshAllData();
  });
  document.getElementById('statusFilter').addEventListener('change', () => loadListings());
  document.getElementById('typeFilter').addEventListener('change', () => loadListings());
  document.getElementById('searchInput').addEventListener('input', () => loadListings());

  document.getElementById('useMyLocationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ngoLocation.lat = Number(pos.coords.latitude.toFixed(4));
        ngoLocation.lng = Number(pos.coords.longitude.toFixed(4));
        updateNgoCoordsUI();
        refreshAllData();
      },
      () => alert('Unable to retrieve GPS. Using default campus coordinates.')
    );
  });

  document.getElementById('resetDemoBtn').addEventListener('click', async () => {
    await fetch('/api/reset-demo', { method: 'POST' });
    refreshAllData();
  });

  document.getElementById('donorForm').addEventListener('submit', handleDonorSubmit);
  document.getElementById('runAiScanBtn').addEventListener('click', handleAiScan);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsvReport);

  // Rating modal
  document.getElementById('cancelRatingBtn').addEventListener('click', () => {
    document.getElementById('ratingModal').style.display = 'none';
  });
  document.getElementById('submitRatingBtn').addEventListener('click', submitRating);

  // Star rating UI
  const starsContainer = document.getElementById('starsContainer');
  for (let i = 5; i >= 1; i--) {
    const s = document.createElement('span');
    s.textContent = '★';
    s.dataset.val = i;
    s.addEventListener('click', () => { currentUserRating = i; updateStarsUI(); });
    starsContainer.appendChild(s);
  }

  setInterval(refreshAllData, 30000);
});

function initMap() {
  map = L.map('rescueMap').setView([ngoLocation.lat, ngoLocation.lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | CampusFoodShare',
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  map.on('click', (e) => {
    const lat = Number(e.latlng.lat.toFixed(4));
    const lng = Number(e.latlng.lng.toFixed(4));
    document.getElementById('pickupLat').value = lat;
    document.getElementById('pickupLng').value = lng;
  });
  updateNgoCoordsUI();
}

function updateNgoCoordsUI() {
  document.getElementById('currentCoordsLabel').textContent = `${ngoLocation.lat}, ${ngoLocation.lng}`;
  if (ngoMarker) map.removeLayer(ngoMarker);
  ngoMarker = L.circleMarker([ngoLocation.lat, ngoLocation.lng], {
    radius: 8, fillColor: '#2563eb', color: '#ffffff', weight: 2, fillOpacity: 0.95,
  }).addTo(map).bindPopup('<strong>Your NGO / Volunteer Reference Location</strong>');
}

async function loadSafetyChecklist() {
  const res = await fetch('/api/checklist');
  const data = await res.json();
  const container = document.getElementById('safetyChecklistContainer');
  container.innerHTML = data.checklist
    .map(
      (item) => `
      <label class="check-item">
        <input type="checkbox" name="safetyCheck" value="${item.id}" required />
        <span>${item.label}</span>
      </label>
    `
    )
    .join('');
}

async function refreshAllData() {
  await Promise.all([loadImpactMetrics(), loadListings(), loadNotifications()]);
}

async function loadImpactMetrics() {
  const res = await fetch('/api/impact');
  const data = await res.json();
  const m = data.metrics;
  document.getElementById('statMealsSaved').textContent = m.totalMealsSaved;
  document.getElementById('statMealsInTransit').textContent = `${m.mealsInTransit} meals in transit`;
  document.getElementById('statFoodRescuedKg').textContent = `${m.totalFoodRescuedKg} kg`;
  document.getElementById('statCo2Saved').textContent = `${m.co2PreventedKg} kg CO₂e prevented`;
  document.getElementById('statActiveCount').textContent = m.activeListingsCount;
  document.getElementById('statLifecycleSummary').textContent =
    `${m.claimedListingsCount} Claimed • ${m.collectedListingsCount} Collected • ${m.expiredListingsCount} Expired`;
}

async function loadListings() {
  const status = document.getElementById('statusFilter').value;
  const foodType = document.getElementById('typeFilter').value;
  const search = document.getElementById('searchInput').value;
  const params = new URLSearchParams({ lat: ngoLocation.lat, lng: ngoLocation.lng });
  if (status) params.set('status', status);
  if (foodType) params.set('foodType', foodType);
  if (search) params.set('search', search);

  const res = await fetch(`/api/listings?${params.toString()}`);
  const data = await res.json();
  renderMapMarkers(data.listings);
  renderListingsFeed(data.listings);
}

function renderMapMarkers(listings) {
  markersLayer.clearLayers();
  listings.forEach((item) => {
    const color =
      item.status === 'posted' ? '#16a34a' : item.status === 'claimed' ? '#d97706' : item.status === 'collected' ? '#2563eb' : '#9ca3af';
    const marker = L.circleMarker([item.location.lat, item.location.lng], {
      radius: 10, fillColor: color, color: '#ffffff', weight: 2, fillOpacity: 0.9,
    });
    marker.bindPopup(`
      <div style="min-width:220px">
        <strong>${item.foodTitle}</strong><br/>
        <span>Donor: ${item.donorName}</span><br/>
        <span>Meals: <b>${item.quantityMeals}</b> (${item.foodType})</span><br/>
        <span>AI Freshness: ${item.aiFreshnessScore}/100</span><br/>
        <span>Distance: <b>${item.distanceKm} km</b></span><br/>
        <span>Status: <b>${item.status.toUpperCase()}</b></span>
      </div>
    `);
    markersLayer.addLayer(marker);
  });
}

function renderListingsFeed(listings) {
  const container = document.getElementById('listingsContainer');
  const isDonor = currentRole === 'donor';
  const isNGO = currentRole === 'ngo';
  const isVol = currentRole === 'volunteer';
  const isAdmin = currentRole === 'admin';

  if (!listings || listings.length === 0) {
    container.innerHTML = `<p style="color:#52665b;">No surplus food listings match the current filter.</p>`;
    return;
  }

  container.innerHTML = listings
    .map((item, idx) => {
      const statusBadgeClass =
        item.status === 'posted' ? 'badge-posted' : item.status === 'claimed' ? 'badge-claimed' :
        item.status === 'collected' ? 'badge-collected' : 'badge-expired';

      const expiryText =
        item.status === 'collected' ? 'Collected & Completed' :
        item.status === 'expired' ? 'Expired' :
        item.minutesRemaining > 0 ? `Expires in ${item.minutesRemaining} mins` : 'Expired';

      let actionArea = '';
      if (item.status === 'posted' && (isNGO || isVol || isAdmin)) {
        actionArea = `
          <button class="btn btn-claim btn-sm" onclick="claimListing('${item.id}')">
            Claim Pickup
          </button>
        `;
      } else if (item.status === 'claimed' && (isNGO || isVol || isAdmin)) {
        actionArea = `
          <span style="font-size:0.82rem;color:#92400e;">
            Claimed by <strong>${item.claimedBy?.ngoName || 'NGO'}</strong> (${item.claimedBy?.volunteerName || ''})
          </span>
          <button class="btn btn-collect btn-sm" onclick="collectListing('${item.id}')">
            Confirm Collected
          </button>
        `;
      } else if (item.status === 'collected' && !item.feedback && (isNGO || isVol || isAdmin)) {
        actionArea = `
          <span style="font-size:0.82rem;color:#1e40af;">✓ Rescued by <strong>${item.claimedBy?.ngoName || 'NGO'}</strong></span>
          <button class="btn btn-outline btn-sm" onclick="openRatingModal('${item.id}', '${item.foodTitle}')">
            Rate NGO ⭐
          </button>
        `;
      } else if (item.status === 'collected' && item.feedback) {
        actionArea = `
          <span style="font-size:0.82rem;color:#1e40af;">✓ Rated ${item.feedback.rating}/5 by ${item.feedback.ngoName}</span>
        `;
      } else if (isDonor && item.status === 'posted') {
        actionArea = `<span style="font-size:0.82rem;color:#15803d;">Broadcast to NGOs</span>`;
      } else if (isAdmin) {
        actionArea = `
          <button class="btn btn-danger btn-sm" style="background:var(--danger)" onclick="deleteListing('${item.id}')">Delete</button>
        `;
      }

      const freshnessBadge = item.aiFreshnessScore >= 85
        ? `<span class="badge badge-freshness">AI Fresh ${item.aiFreshnessScore}/100</span>`
        : `<span class="badge badge-urgency">AI Fresh ${item.aiFreshnessScore}/100</span>`;

      return `
        <div class="listing-item">
          <div class="listing-top">
            <div>
              <span class="listing-title">#${idx + 1} • ${item.foodTitle}</span>
              <div style="font-size:0.84rem;color:#52665b;">
                Donor: <strong>${item.donorName}</strong> (${item.donorPhone})
              </div>
            </div>
            <div class="badges">
              <span class="badge ${statusBadgeClass}">${item.status.toUpperCase()}</span>
              <span class="badge badge-distance">${item.distanceKm} km away</span>
              <span class="badge badge-urgency">${expiryText}</span>
              ${freshnessBadge}
            </div>
          </div>
          <div class="listing-meta">
            <div><strong>Type:</strong> ${item.foodType}</div>
            <div><strong>Quantity:</strong> ${item.quantityMeals} meals (~${item.weightKg} kg)</div>
            <div><strong>Pickup:</strong> ${item.location.address}</div>
            <div><strong>Priority Score:</strong> ${item.urgencyScore}</div>
          </div>
          <div class="listing-actions">
            <span style="font-size:0.78rem;color:#15803d;">✓ Food-Safety Checklist Verified</span>
            <div style="display:flex;gap:0.5rem;align-items:center;">${actionArea}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

async function claimListing(listingId) {
  const ngoName = prompt('Enter your NGO or Chapter Name:', 'Robin Hood Army - Campus Chapter');
  if (!ngoName) return;
  const volunteerName = prompt('Enter Pickup Volunteer Name:', 'Harsha S');
  if (!volunteerName) return;
  const volunteerPhone = prompt('Enter Volunteer Contact Number:', '+91 99001 44556');

  const res = await fetch(`/api/listings/${listingId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ngoName, volunteerName, volunteerPhone }),
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Could not claim listing');
    return;
  }
  refreshAllData();
}

async function collectListing(listingId) {
  const res = await fetch(`/api/listings/${listingId}/collect`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Could not mark listing as collected');
    return;
  }
  refreshAllData();
}

async function deleteListing(listingId) {
  if (!confirm('Delete this listing? (Admin only)')) return;
  await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
  refreshAllData();
}

function openRatingModal(listingId, foodTitle) {
  pendingRatingListingId = listingId;
  currentUserRating = 0;
  document.getElementById('ratingListingTitle').textContent = foodTitle;
  updateStarsUI();
  document.getElementById('ratingComment').value = '';
  document.getElementById('ratingModal').style.display = 'flex';
}

function updateStarsUI() {
  const stars = document.querySelectorAll('#starsContainer span');
  stars.forEach((s) => {
    s.classList.toggle('filled', Number(s.dataset.val) <= currentUserRating);
  });
}

async function submitRating() {
  if (!currentUserRating) { alert('Please select a star rating.'); return; }
  const comment = document.getElementById('ratingComment').value.trim();
  const res = await fetch(`/api/listings/${pendingRatingListingId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: currentUserRating, comment }),
  });
  if (!res.ok) { alert('Failed to save rating.'); return; }
  document.getElementById('ratingModal').style.display = 'none';
  refreshAllData();
}

async function handleAiScan() {
  const foodTitle = document.getElementById('foodTitle').value || '';
  const res = await fetch('/api/ai-detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodTitle, hoursSinceCooked: 1 }),
  });
  const data = await res.json();
  const aiResult = document.getElementById('aiResult');
  aiResult.textContent = `Detected: ${data.detectedType} • Freshness: ${data.freshnessScore}/100 (${data.freshnessStatus})`;
  document.getElementById('foodType').value = data.detectedType;
}

async function handleDonorSubmit(e) {
  e.preventDefault();
  const feedback = document.getElementById('formFeedback');
  const checkedBoxes = Array.from(
    document.querySelectorAll('input[name="safetyCheck"]:checked')
  ).map((cb) => cb.value);

  const hoursValid = parseFloat(document.getElementById('hoursValid').value);
  const useBefore = new Date(Date.now() + hoursValid * 3600 * 1000).toISOString();

  const payload = {
    donorName: document.getElementById('donorName').value,
    donorPhone: document.getElementById('donorPhone').value,
    foodType: document.getElementById('foodType').value,
    foodTitle: document.getElementById('foodTitle').value,
    quantityMeals: Number(document.getElementById('quantityMeals').value),
    useBefore,
    safetyChecklistConfirmed: checkedBoxes.length === 4,
    checklistItems: checkedBoxes,
    location: {
      address: document.getElementById('pickupAddress').value,
      lat: parseFloat(document.getElementById('pickupLat').value),
      lng: parseFloat(document.getElementById('pickupLng').value),
    },
  };

  const res = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    feedback.style.color = '#dc2626';
    feedback.textContent = (err.details || [err.error]).join(', ');
    return;
  }

  feedback.style.color = '#15803d';
  feedback.textContent = '✓ Surplus food listing posted and broadcast to nearby NGOs!';
  document.getElementById('foodTitle').value = '';
  refreshAllData();
}

async function loadNotifications() {
  try {
    const res = await fetch('/api/impact');
    const data = await res.json();
    const container = document.getElementById('notificationsFeed');
    const notifs = data.notifications || [];
    if (notifs.length === 0) {
      container.innerHTML = `<p style="color:#52665b;font-size:0.85rem;">No recent notifications.</p>`;
      return;
    }
    container.innerHTML = notifs.map((n) => `
      <div class="notif-item">
        <div>
          <div class="notif-title">${n.title}</div>
          <div style="font-size:0.8rem;color:var(--muted);">${n.message}</div>
        </div>
        <div class="notif-time">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load notifications', err);
  }
}

function exportCsvReport() {
  fetch('/api/listings?includeExpired=true')
    .then((r) => r.json())
    .then((data) => {
      const rows = data.listings.map((l) => [
        l.id, l.donorName, l.foodTitle, l.foodType, l.quantityMeals, l.weightKg,
        l.aiFreshnessScore, l.status, l.location.address, l.location.lat, l.location.lng,
        l.useBefore, l.createdAt,
      ]);
      const csv = [
        ['id', 'donorName', 'foodTitle', 'foodType', 'quantityMeals', 'weightKg', 'aiFreshnessScore', 'status', 'address', 'lat', 'lng', 'useBefore', 'createdAt'],
        ...rows,
      ]
        .map((r) => r.map((v) => `"${v}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campus-food-share-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
}
