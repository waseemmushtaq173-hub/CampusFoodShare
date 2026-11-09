require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculateHaversineDistance } = require('./src/utils/haversine');
const { rankListingsForNGO } = require('./src/utils/priorityQueue');
const { analyzeFoodFreshness } = require('./src/utils/aiFoodDetector');
const { LISTING_STATUS, FOOD_SAFETY_CHECKLIST, validateListingPayload } = require('./src/models/schemas');
const { readDb, writeDb, sweepExpiredListings, addNotification } = require('./src/storage/db');
const { generateSeedData } = require('./src/seed/seedFaker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const initialDb = readDb();
if (!initialDb.listings || initialDb.listings.length === 0) {
  writeDb(generateSeedData());
}

app.get('/api/checklist', (req, res) => res.json({ checklist: FOOD_SAFETY_CHECKLIST }));
app.post('/api/ai-detect', (req, res) => res.json(analyzeFoodFreshness(req.body || {})));

app.get('/api/listings', (req, res) => {
  const { lat, lng, status, foodType, search, includeExpired } = req.query;
  const { db, expiredSwept } = sweepExpiredListings();
  const ngoLat = lat ? parseFloat(lat) : 12.9716;
  const ngoLng = lng ? parseFloat(lng) : 77.5946;

  let filtered = db.listings || [];
  if (status) filtered = filtered.filter((i) => i.status === status);
  else if (includeExpired !== 'true') filtered = filtered.filter((i) => i.status !== LISTING_STATUS.EXPIRED);
  if (foodType) filtered = filtered.filter((i) => i.foodType === foodType);
  if (search && String(search).trim() !== '') {
    const q = String(search).toLowerCase().trim();
    filtered = filtered.filter((i) => i.foodTitle.toLowerCase().includes(q) || i.donorName.toLowerCase().includes(q) || i.location.address.toLowerCase().includes(q));
  }
  const rankedListings = rankListingsForNGO(filtered, ngoLat, ngoLng, calculateHaversineDistance);
  res.json({ expiredSwept, referencePoint: { lat: ngoLat, lng: ngoLng }, count: rankedListings.length, listings: rankedListings });
});

app.post('/api/listings', (req, res) => {
  const errors = validateListingPayload(req.body);
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
  const db = readDb();
  const quantityMeals = Number(req.body.quantityMeals);
  const weightKg = Number(req.body.weightKg || (quantityMeals * 0.35).toFixed(1));
  const aiAnalysis = analyzeFoodFreshness({ foodTitle: req.body.foodTitle, hoursSinceCooked: 1 });

  const newListing = {
    id: 'lst-' + Date.now(),
    donorId: req.body.donorId || 'donor-custom',
    donorName: req.body.donorName.trim(),
    donorPhone: req.body.donorPhone || '+91 98000 00000',
    foodTitle: req.body.foodTitle.trim(),
    foodType: req.body.foodType,
    quantityMeals,
    weightKg,
    aiFreshnessScore: req.body.aiFreshnessScore || aiAnalysis.freshnessScore,
    aiFreshnessStatus: req.body.aiFreshnessStatus || aiAnalysis.freshnessStatus,
    preparedAt: new Date().toISOString(),
    useBefore: new Date(req.body.useBefore).toISOString(),
    status: LISTING_STATUS.POSTED,
    safetyChecklistConfirmed: Boolean(req.body.safetyChecklistConfirmed),
    checklistItems: req.body.checklistItems || [],
    location: { address: req.body.location.address || 'Campus Pickup Point', lat: Number(req.body.location.lat), lng: Number(req.body.location.lng) },
    claimedBy: null,
    feedback: null,
    createdAt: new Date().toISOString(),
  };
  db.listings.unshift(newListing);
  addNotification(db, { type: 'NEW_LISTING', title: 'New Surplus Food Posted', message: `${newListing.donorName} posted ${newListing.quantityMeals} ${newListing.foodType} meals ("${newListing.foodTitle}").` });
  writeDb(db);
  res.status(201).json({ message: 'Surplus food listing posted', listing: newListing });
});

app.post('/api/listings/:id/claim', (req, res) => {
  const { id } = req.params;
  const { ngoName, volunteerName, volunteerPhone } = req.body;
  if (!ngoName || !volunteerName) return res.status(400).json({ error: 'ngoName and volunteerName required' });
  const { db } = sweepExpiredListings();
  const listing = db.listings.find((i) => i.id === id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.POSTED) return res.status(409).json({ error: `Cannot claim listing in '${listing.status}' status` });

  listing.status = LISTING_STATUS.CLAIMED;
  listing.claimedBy = { ngoName: ngoName.trim(), volunteerName: volunteerName.trim(), volunteerPhone: volunteerPhone || '+91 99000 00000', claimedAt: new Date().toISOString(), collectedAt: null };
  addNotification(db, { type: 'CLAIMED', title: 'Listing Claimed for Pickup', message: `${ngoName} (Volunteer: ${volunteerName}) claimed "${listing.foodTitle}".` });
  writeDb(db);
  res.json({ message: 'Listing claimed', listing });
});

app.post('/api/listings/:id/collect', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const listing = db.listings.find((i) => i.id === id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.CLAIMED) return res.status(409).json({ error: 'Only claimed listings can be collected' });

  listing.status = LISTING_STATUS.COLLECTED;
  if (listing.claimedBy) listing.claimedBy.collectedAt = new Date().toISOString();
  addNotification(db, { type: 'COLLECTED', title: 'Food Rescued & Collected!', message: `${listing.quantityMeals} meals ("${listing.foodTitle}") collected by ${listing.claimedBy?.ngoName || 'NGO'}.` });
  writeDb(db);
  res.json({ message: 'Food collected', listing });
});

app.post('/api/listings/:id/feedback', (req, res) => {
  const { id } = req.params;
  const { rating, comment, ratedBy } = req.body;
  const db = readDb();
  const listing = db.listings.find((i) => i.id === id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  const fb = { id: 'fb-' + Date.now(), listingId: id, donorName: listing.donorName, ngoName: ratedBy || listing.claimedBy?.ngoName || 'Verified NGO', rating: Math.min(5, Math.max(1, Number(rating) || 5)), comment: comment || 'Smooth pickup and great quality.', createdAt: new Date().toISOString() };
  listing.feedback = fb;
  writeDb(db);
  res.json({ message: 'Feedback saved', feedback: fb });
});

app.get('/api/impact', (req, res) => {
  const { db } = sweepExpiredListings();
  const collected = db.listings.filter((l) => l.status === LISTING_STATUS.COLLECTED);
  const claimed = db.listings.filter((l) => l.status === LISTING_STATUS.CLAIMED);
  const active = db.listings.filter((l) => l.status === LISTING_STATUS.POSTED);
  const expired = db.listings.filter((l) => l.status === LISTING_STATUS.EXPIRED);
  const totalMealsSaved = collected.reduce((s, i) => s + Number(i.quantityMeals || 0), 0);
  const mealsInTransit = claimed.reduce((s, i) => s + Number(i.quantityMeals || 0), 0);
  const totalFoodRescuedKg = Number(collected.reduce((s, i) => s + Number(i.weightKg || 0), 0).toFixed(1));
  const co2PreventedKg = Number((totalFoodRescuedKg * 2.5).toFixed(1));
  const rated = collected.filter((l) => l.feedback?.rating);
  const avgRating = rated.length > 0 ? Number((rated.reduce((s, l) => s + Number(l.feedback.rating), 0) / rated.length).toFixed(1)) : 5.0;

  res.json({
    metrics: { totalMealsSaved, mealsInTransit, totalFoodRescuedKg, co2PreventedKg, avgRating, activeListingsCount: active.length, claimedListingsCount: claimed.length, collectedListingsCount: collected.length, expiredListingsCount: expired.length },
    notifications: (db.notifications || []).slice(0, 10),
    users: db.users || [],
  });
});

app.delete('/api/listings/:id', (req, res) => {
  const db = readDb();
  db.listings = db.listings.filter((i) => i.id !== req.params.id);
  writeDb(db);
  res.json({ message: 'Deleted by Admin' });
});

app.post('/api/reset-demo', (req, res) => {
  const seeded = generateSeedData();
  writeDb(seeded);
  res.json({ message: 'Demo reset', data: seeded });
});

app.listen(PORT, () => console.log(`CampusFoodShare running on http://localhost:${PORT}`));
