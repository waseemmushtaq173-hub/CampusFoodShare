/**
 * public/app.js
 * Frontend logic for CampusFoodShare:
 * - Leaflet.js interactive map with live status markers
 * - Haversine & Priority Queue ranked listing feed
 * - NGO Claim & Pickup Status tracking (posted -> claimed -> collected)
 * - Donor form with mandatory Food-Safety Checklist verification
 */

let map;
let markersLayer;
let ngoLocation = { lat: 12.9716, lng: 77.5946 };
let ngoMarker = null;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadSafetyChecklist();
  refreshAllData();

  document.getElementById('statusFilter').addEventListener('change', () => {
    loadListings();
  });

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
      () => {
        alert('Unable to retrieve GPS coordinates. Using default campus coordinates.');
      }
    );
  });

  document.getElementById('resetDemoBtn').addEventListener('click', async () => {
    await fetch('/api/reset-demo', { method: 'POST' });
    refreshAllData();
  });

  document.getElementById('donorForm').addEventListener('submit', handleDonorSubmit);

  // Auto-refresh every 30 seconds to sweep expired listings & update countdowns
  setInterval(refreshAllData, 30000);
});

function initMap() {
  map = L.map('rescueMap').setView([ngoLocation.lat, ngoLocation.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | CampusFoodShare',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // Clicking on the map updates the Donor Pickup Coordinates for convenience
  map.on('click', (e) => {
    const lat = Number(e.latlng.lat.toFixed(4));
    const lng = Number(e.latlng.lng.toFixed(4));
    document.getElementById('pickupLat').value = lat;
    document.getElementById('pickupLng').value = lng;
  });

  updateNgoCoordsUI();
}

function updateNgoCoordsUI() {
  document.getElementById('currentCoordsLabel').textContent =
    `${ngoLocation.lat}, ${ngoLocation.lng}`;

  if (ngoMarker) {
    map.removeLayer(ngoMarker);
  }
  ngoMarker = L.circleMarker([ngoLocation.lat, ngoLocation.lng], {
    radius: 8,
    fillColor: '#2563eb',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 0.95,
  })
    .addTo(map)
    .bindPopup('<strong>Your NGO / Volunteer Reference Location</strong>');
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
  await Promise.all([loadImpactMetrics(), loadListings()]);
}

async function loadImpactMetrics() {
  const res = await fetch('/api/impact');
  const data = await res.json();
  const m = data.metrics;

  document.getElementById('statMealsSaved').textContent = m.totalMealsSaved;
  document.getElementById('statMealsInTransit').textContent =
    `${m.mealsInTransit} meals currently claimed & in transit`;
  document.getElementById('statFoodRescuedKg').textContent = `${m.totalFoodRescuedKg} kg`;
  document.getElementById('statCo2Saved').textContent =
    `${m.co2PreventedKg} kg CO₂e landfill emissions prevented`;
  document.getElementById('statActiveCount').textContent = m.activeListingsCount;
  document.getElementById('statLifecycleSummary').textContent =
    `${m.claimedListingsCount} Claimed • ${m.collectedListingsCount} Collected • ${m.expiredListingsCount} Auto-Expired`;
}

async function loadListings() {
  const status = document.getElementById('statusFilter').value;
  const params = new URLSearchParams({
    lat: ngoLocation.lat,
    lng: ngoLocation.lng,
  });
  if (status) params.set('status', status);

  const res = await fetch(`/api/listings?${params.toString()}`);
  const data = await res.json();

  renderMapMarkers(data.listings);
  renderListingsFeed(data.listings);
}

function renderMapMarkers(listings) {
  markersLayer.clearLayers();

  listings.forEach((item) => {
    const color =
      item.status === 'posted'
        ? '#16a34a'
        : item.status === 'claimed'
        ? '#d97706'
        : '#2563eb';

    const marker = L.circleMarker([item.location.lat, item.location.lng], {
      radius: 10,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.9,
    });

    marker.bindPopup(`
      <div style="min-width:200px">
        <strong>${item.foodTitle}</strong><br/>
        <span>Donor: ${item.donorName}</span><br/>
        <span>Meals: <b>${item.quantityMeals}</b> (${item.foodType})</span><br/>
        <span>Distance: <b>${item.distanceKm} km</b></span><br/>
        <span>Status: <b>${item.status.toUpperCase()}</b></span>
      </div>
    `);

    markersLayer.addLayer(marker);
  });
}

function renderListingsFeed(listings) {
  const container = document.getElementById('listingsContainer');
  if (!listings || listings.length === 0) {
    container.innerHTML = `<p style="color:#52665b;">No surplus food listings match the current filter.</p>`;
    return;
  }

  container.innerHTML = listings
    .map((item, idx) => {
      const statusBadgeClass =
        item.status === 'posted'
          ? 'badge-posted'
          : item.status === 'claimed'
          ? 'badge-claimed'
          : 'badge-collected';

      const expiryText =
        item.status === 'collected'
          ? 'Collected & Completed'
          : item.minutesRemaining > 0
          ? `Expires in ${item.minutesRemaining} mins`
          : 'Expired';

      let actionArea = '';
      if (item.status === 'posted') {
        actionArea = `
          <button class="btn btn-claim btn-sm" onclick="claimListing('${item.id}')">
            Claim Pickup (NGO / Volunteer)
          </button>
        `;
      } else if (item.status === 'claimed') {
        actionArea = `
          <span style="font-size:0.82rem;color:#92400e;">
            Claimed by <strong>${item.claimedBy?.ngoName || 'NGO'}</strong> (${item.claimedBy?.volunteerName || ''})
          </span>
          <button class="btn btn-collect btn-sm" onclick="collectListing('${item.id}')">
            Confirm Food Collected
          </button>
        `;
      } else if (item.status === 'collected') {
        actionArea = `
          <span style="font-size:0.82rem;color:#1e40af;">
            ✓ Rescued by <strong>${item.claimedBy?.ngoName || 'NGO'}</strong>
          </span>
        `;
      }

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
            <div style="display:flex;gap:0.5rem;align-items:center;">
              ${actionArea}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

async function claimListing(listingId) {
  const ngoName = prompt(
    'Enter your NGO or Chapter Name:',
    'Robin Hood Army - Campus Chapter'
  );
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
  const res = await fetch(`/api/listings/${listingId}/collect`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Could not mark listing as collected');
    return;
  }
  refreshAllData();
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
