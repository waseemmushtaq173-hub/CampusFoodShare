/**
 * server.js
 * Express Backend Server for CampusFoodShare
 * Implements REST APIs for Donors, NGOs, Claims, Expiry Cleanup,
 * Haversine Distance Matching, Priority Queue Ranking, and SDG Impact Metrics.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { calculateHaversineDistance } = require('./src/utils/haversine');
const { rankListingsForNGO } = require('./src/utils/priorityQueue');
const {
  LISTING_STATUS,
  FOOD_SAFETY_CHECKLIST,
  validateListingPayload,
} = require('./src/models/schemas');
const { readDb, writeDb, sweepExpiredListings } = require('./src/storage/db');
const { generateSeedData } = require('./src/seed/seedFaker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure initial seed data exists on first boot
const initialDb = readDb();
if (!initialDb.listings || initialDb.listings.length === 0) {
  writeDb(generateSeedData());
}

/**
 * GET /api/checklist
 * Objective 4: Share basic food-safety checklist with donors
 */
app.get('/api/checklist', (req, res) => {
  res.json({ checklist: FOOD_SAFETY_CHECKLIST });
});

/**
 * GET /api/listings
 * Objective 2 & 4: Automatically sweep expired listings, then return listings
 * ranked by Priority Queue (soonest expiry + Haversine distance from NGO).
 */
app.get('/api/listings', (req, res) => {
  const { lat, lng, status, includeExpired } = req.query;
  const { db, expiredSwept } = sweepExpiredListings();

  const ngoLat = lat ? parseFloat(lat) : 12.9716;
  const ngoLng = lng ? parseFloat(lng) : 77.5946;

  let filtered = db.listings;
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  } else if (includeExpired !== 'true') {
    filtered = filtered.filter((item) => item.status !== LISTING_STATUS.EXPIRED);
  }

  const rankedListings = rankListingsForNGO(
    filtered,
    ngoLat,
    ngoLng,
    calculateHaversineDistance
  );

  res.json({
    expiredSwept,
    referencePoint: { lat: ngoLat, lng: ngoLng },
    count: rankedListings.length,
    listings: rankedListings,
  });
});

/**
 * POST /api/listings
 * Objective 1: Let donors post surplus food with type, quantity, pickup location,
 * "use before" time, and verified food-safety checklist.
 */
app.post('/api/listings', (req, res) => {
  const errors = validateListingPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const db = readDb();
  const quantityMeals = Number(req.body.quantityMeals);
  const weightKg = Number(req.body.weightKg || (quantityMeals * 0.35).toFixed(1));

  const newListing = {
    id: 'lst-' + Date.now(),
    donorId: req.body.donorId || 'donor-custom',
    donorName: req.body.donorName.trim(),
    donorPhone: req.body.donorPhone || '+91 98000 00000',
    foodTitle: req.body.foodTitle.trim(),
    foodType: req.body.foodType,
    quantityMeals,
    weightKg,
    preparedAt: req.body.preparedAt || new Date().toISOString(),
    useBefore: new Date(req.body.useBefore).toISOString(),
    status: LISTING_STATUS.POSTED,
    safetyChecklistConfirmed: Boolean(req.body.safetyChecklistConfirmed),
    checklistItems: req.body.checklistItems || [],
    location: {
      address: req.body.location.address || 'Campus Pickup Point',
      lat: Number(req.body.location.lat),
      lng: Number(req.body.location.lng),
    },
    claimedBy: null,
    createdAt: new Date().toISOString(),
  };

  db.listings.unshift(newListing);
  writeDb(db);

  res.status(201).json({
    message: 'Surplus food listing posted successfully',
    listing: newListing,
  });
});

/**
 * POST /api/listings/:id/claim
 * Objective 3: Let NGOs claim a listing and track pickup status.
 */
app.post('/api/listings/:id/claim', (req, res) => {
  const { id } = req.params;
  const { ngoName, volunteerName, volunteerPhone } = req.body;

  if (!ngoName || !volunteerName) {
    return res
      .status(400)
      .json({ error: 'ngoName and volunteerName are required to claim a listing' });
  }

  const { db } = sweepExpiredListings();
  const listing = db.listings.find((item) => item.id === id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  if (listing.status !== LISTING_STATUS.POSTED) {
    return res.status(409).json({
      error: `Listing cannot be claimed because its current status is '${listing.status}'`,
    });
  }

  const claimedAt = new Date().toISOString();
  listing.status = LISTING_STATUS.CLAIMED;
  listing.claimedBy = {
    ngoName: ngoName.trim(),
    volunteerName: volunteerName.trim(),
    volunteerPhone: volunteerPhone || '+91 99000 00000',
    claimedAt,
    collectedAt: null,
  };

  const claimRecord = {
    id: 'clm-' + Date.now(),
    listingId: listing.id,
    ngoName: ngoName.trim(),
    volunteerName: volunteerName.trim(),
    volunteerPhone: volunteerPhone || '+91 99000 00000',
    status: LISTING_STATUS.CLAIMED,
    claimedAt,
    collectedAt: null,
  };

  db.claims.unshift(claimRecord);
  writeDb(db);

  res.json({
    message: 'Listing claimed by NGO successfully',
    listing,
    claim: claimRecord,
  });
});

/**
 * POST /api/listings/:id/collect
 * Objective 3: Mark a claimed listing as collected once picked up by NGO/volunteer.
 */
app.post('/api/listings/:id/collect', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const listing = db.listings.find((item) => item.id === id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  if (listing.status !== LISTING_STATUS.CLAIMED) {
    return res.status(409).json({
      error: `Only 'claimed' listings can be marked as collected (current: '${listing.status}')`,
    });
  }

  const collectedAt = new Date().toISOString();
  listing.status = LISTING_STATUS.COLLECTED;
  if (listing.claimedBy) {
    listing.claimedBy.collectedAt = collectedAt;
  }

  const claimRecord = db.claims.find((c) => c.listingId === id);
  if (claimRecord) {
    claimRecord.status = LISTING_STATUS.COLLECTED;
    claimRecord.collectedAt = collectedAt;
  }

  writeDb(db);

  res.json({
    message: 'Food pickup confirmed and marked as collected!',
    listing,
  });
});

/**
 * GET /api/impact
 * Objective 5: Impact dashboard of meals saved and food rescued,
 * supporting SDG 2 (Zero Hunger), SDG 11 (Sustainable Cities) & SDG 12 (Responsible Consumption).
 */
app.get('/api/impact', (req, res) => {
  const { db } = sweepExpiredListings();

  const collectedListings = db.listings.filter(
    (l) => l.status === LISTING_STATUS.COLLECTED
  );
  const claimedListings = db.listings.filter(
    (l) => l.status === LISTING_STATUS.CLAIMED
  );
  const activeListings = db.listings.filter(
    (l) => l.status === LISTING_STATUS.POSTED
  );
  const expiredListings = db.listings.filter(
    (l) => l.status === LISTING_STATUS.EXPIRED
  );

  const totalMealsSaved = collectedListings.reduce(
    (sum, item) => sum + Number(item.quantityMeals || 0),
    0
  );
  const mealsInTransit = claimedListings.reduce(
    (sum, item) => sum + Number(item.quantityMeals || 0),
    0
  );
  const totalFoodRescuedKg = Number(
    collectedListings
      .reduce((sum, item) => sum + Number(item.weightKg || 0), 0)
      .toFixed(1)
  );

  // Environmental calculation: 1 kg of food waste prevented avoids ~2.5 kg CO2e
  const co2PreventedKg = Number((totalFoodRescuedKg * 2.5).toFixed(1));

  res.json({
    metrics: {
      totalMealsSaved,
      mealsInTransit,
      totalFoodRescuedKg,
      co2PreventedKg,
      activeListingsCount: activeListings.length,
      claimedListingsCount: claimedListings.length,
      collectedListingsCount: collectedListings.length,
      expiredListingsCount: expiredListings.length,
    },
    sdgAlignment: [
      {
        sdg: 'SDG 2: Zero Hunger',
        metric: `${totalMealsSaved} nutritious meals delivered to nearby shelters & communities`,
      },
      {
        sdg: 'SDG 11: Sustainable Cities & Communities',
        metric: `${collectedListings.length + claimedListings.length} campus-to-community hyperlocal food rescue pickups`,
      },
      {
        sdg: 'SDG 12: Responsible Consumption & Production',
        metric: `${totalFoodRescuedKg} kg of edible food diverted from landfills (${co2PreventedKg} kg CO2e avoided)`,
      },
    ],
  });
});

/**
 * POST /api/reset-demo
 * Resets database to fresh Faker/demo seed state for live presentation/testing
 */
app.post('/api/reset-demo', (req, res) => {
  const seeded = generateSeedData();
  writeDb(seeded);
  res.json({ message: 'Demo database reset to fresh campus seed state', data: seeded });
});

app.listen(PORT, () => {
  console.log(`CampusFoodShare server running at http://localhost:${PORT}`);
});
