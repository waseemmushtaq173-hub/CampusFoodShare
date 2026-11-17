require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { calculateHaversineDistance } = require('./src/utils/haversine');
const { rankListingsForNGO } = require('./src/utils/priorityQueue');
const { analyzeFoodFreshness } = require('./src/utils/aiFoodDetector');
const { hashPassword, verifyPassword, hashAllPasswords, publicUser } = require('./src/utils/auth');
const { USER_ROLES, SIGNUP_ROLES, LISTING_STATUS, FOOD_SAFETY_CHECKLIST, validateListingPayload } = require('./src/models/schemas');
const { readDb, writeDb, sweepExpiredListings, addNotification } = require('./src/storage/db');
const { generateSeedData } = require('./src/seed/seedFaker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- bootstrap: seed if empty, hash any plaintext passwords ----------
{
  let db = readDb();
  if (!db.listings || db.listings.length === 0 || !db.users || db.users.length === 0) db = generateSeedData();
  hashAllPasswords(db);
  writeDb(db);
}

// ---------- sessions (token -> userId) ----------
const sessions = new Map();
const newId = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex')}`;

function attachUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token ? sessions.get(token) : null;
  if (userId) {
    const user = (readDb().users || []).find((u) => u.id === userId);
    if (user) {
      req.user = user;
      req.token = token;
    } else {
      sessions.delete(token);
    }
  }
  next();
}
app.use(attachUser);

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `This action requires one of these roles: ${roles.join(', ')}` });
    }
    next();
  };
}

// ---------- auth ----------
app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: publicUser(req.user) });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role, phone, organization } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!SIGNUP_ROLES.includes(role)) return res.status(400).json({ error: 'Role must be donor, ngo or volunteer' });
  const cleanEmail = String(email).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const db = readDb();
  if (db.users.find((u) => u.email === cleanEmail)) return res.status(409).json({ error: 'Email already registered' });
  const user = {
    id: newId('usr'),
    name: String(name).trim(),
    email: cleanEmail,
    password: hashPassword(password),
    role,
    organization: organization ? String(organization).trim() : String(name).trim(),
    phone: phone ? String(phone).trim() : '',
    verified: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, user.id);
  res.status(201).json({ message: 'Account created', user: publicUser(user), token });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const db = readDb();
  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, user.id);
  res.json({ message: 'Signed in', user: publicUser(user), token });
});

app.post('/api/auth/signout', (req, res) => {
  if (req.token) sessions.delete(req.token);
  res.json({ message: 'Signed out' });
});

// ---------- reference data ----------
app.get('/api/checklist', (req, res) => res.json({ checklist: FOOD_SAFETY_CHECKLIST }));
app.post('/api/ai-detect', (req, res) => res.json(analyzeFoodFreshness(req.body || {})));

// ---------- listings ----------
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
    filtered = filtered.filter((i) =>
      i.foodTitle.toLowerCase().includes(q) || i.donorName.toLowerCase().includes(q) || (i.location.address || '').toLowerCase().includes(q));
  }
  const listings = rankListingsForNGO(filtered, ngoLat, ngoLng, calculateHaversineDistance);
  res.json({ expiredSwept, referencePoint: { lat: ngoLat, lng: ngoLng }, count: listings.length, listings });
});

app.post('/api/listings', requireRole(USER_ROLES.DONOR, USER_ROLES.ADMIN), (req, res) => {
  const body = { ...req.body, donorName: req.body.donorName || req.user.organization || req.user.name };
  const errors = validateListingPayload(body);
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
  const db = readDb();
  const quantityMeals = Number(body.quantityMeals);
  const weightKg = Number(body.weightKg) > 0 ? Number(body.weightKg) : Number((quantityMeals * 0.35).toFixed(1));
  const aiAnalysis = analyzeFoodFreshness({ foodTitle: body.foodTitle, hoursSinceCooked: 1 });

  const listing = {
    id: newId('lst'),
    donorId: req.user.id,
    donorName: String(body.donorName).trim(),
    donorPhone: body.donorPhone || req.user.phone || '',
    foodTitle: String(body.foodTitle).trim(),
    foodType: body.foodType,
    quantityMeals,
    weightKg,
    aiFreshnessScore: Number(body.aiFreshnessScore) || aiAnalysis.freshnessScore,
    aiFreshnessStatus: body.aiFreshnessStatus || aiAnalysis.freshnessStatus,
    preparedAt: new Date().toISOString(),
    useBefore: new Date(body.useBefore).toISOString(),
    status: LISTING_STATUS.POSTED,
    safetyChecklistConfirmed: true,
    checklistItems: body.checklistItems,
    location: { address: body.location.address || 'Campus Pickup Point', lat: body.location.lat, lng: body.location.lng },
    claimedBy: null,
    feedback: null,
    createdAt: new Date().toISOString(),
  };
  db.listings.unshift(listing);
  addNotification(db, { type: 'NEW_LISTING', title: 'New Surplus Food Posted', message: `${listing.donorName} posted ${listing.quantityMeals} ${listing.foodType} meals ("${listing.foodTitle}").` });
  writeDb(db);
  res.status(201).json({ message: 'Surplus food listing posted', listing });
});

function findListing(db, id) {
  return db.listings.find((i) => i.id === id);
}

app.post('/api/listings/:id/claim', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const { ngoName, volunteerName, volunteerPhone } = req.body || {};
  if (!ngoName || !volunteerName) return res.status(400).json({ error: 'ngoName and volunteerName required' });
  const { db } = sweepExpiredListings();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.POSTED) return res.status(409).json({ error: `Cannot claim listing in '${listing.status}' status` });

  listing.status = LISTING_STATUS.CLAIMED;
  listing.claimedBy = {
    userId: req.user.id,
    ngoName: String(ngoName).trim(),
    volunteerName: String(volunteerName).trim(),
    volunteerPhone: volunteerPhone || req.user.phone || '',
    claimedAt: new Date().toISOString(),
    collectedAt: null,
  };
  addNotification(db, { type: 'CLAIMED', title: 'Listing Claimed for Pickup', message: `${listing.claimedBy.ngoName} (Volunteer: ${listing.claimedBy.volunteerName}) claimed "${listing.foodTitle}".` });
  writeDb(db);
  res.json({ message: 'Listing claimed', listing });
});

app.post('/api/listings/:id/release', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const { db } = sweepExpiredListings();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.CLAIMED) return res.status(409).json({ error: 'Only claimed listings can be released' });
  const owner = listing.claimedBy && listing.claimedBy.userId;
  if (req.user.role !== USER_ROLES.ADMIN && owner && owner !== req.user.id) {
    return res.status(403).json({ error: 'Only the claiming user can release this pickup' });
  }
  const ngo = listing.claimedBy ? listing.claimedBy.ngoName : 'NGO';
  listing.status = LISTING_STATUS.POSTED;
  listing.claimedBy = null;
  addNotification(db, { type: 'RELEASED', title: 'Pickup Released', message: `${ngo} released "${listing.foodTitle}" - it is available again.` });
  writeDb(db);
  res.json({ message: 'Claim released', listing });
});

app.post('/api/listings/:id/collect', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.CLAIMED) return res.status(409).json({ error: 'Only claimed listings can be collected' });
  listing.status = LISTING_STATUS.COLLECTED;
  if (listing.claimedBy) listing.claimedBy.collectedAt = new Date().toISOString();
  addNotification(db, { type: 'COLLECTED', title: 'Food Rescued & Collected!', message: `${listing.quantityMeals} meals ("${listing.foodTitle}") collected by ${listing.claimedBy ? listing.claimedBy.ngoName : 'NGO'}.` });
  writeDb(db);
  res.json({ message: 'Food collected', listing });
});

app.post('/api/listings/:id/feedback', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const { rating, comment } = req.body || {};
  const db = readDb();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.COLLECTED) return res.status(409).json({ error: 'Only collected listings can be rated' });
  if (listing.feedback) return res.status(409).json({ error: 'This listing has already been rated' });
  listing.feedback = {
    id: newId('fb'),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: String(comment || 'Smooth pickup and great quality.').slice(0, 300),
    ratedBy: (listing.claimedBy && listing.claimedBy.ngoName) || req.user.name,
    createdAt: new Date().toISOString(),
  };
  writeDb(db);
  res.json({ message: 'Feedback saved', feedback: listing.feedback });
});

app.delete('/api/listings/:id', requireRole(USER_ROLES.ADMIN, USER_ROLES.DONOR), (req, res) => {
  const db = readDb();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (req.user.role === USER_ROLES.DONOR) {
    if (listing.donorId !== req.user.id) return res.status(403).json({ error: 'You can only withdraw your own listings' });
    if (listing.status !== LISTING_STATUS.POSTED) return res.status(409).json({ error: 'Only unclaimed listings can be withdrawn' });
  }
  db.listings = db.listings.filter((i) => i.id !== listing.id);
  addNotification(db, { type: 'WITHDRAWN', title: 'Listing Withdrawn', message: `"${listing.foodTitle}" from ${listing.donorName} was removed.` });
  writeDb(db);
  res.json({ message: 'Listing removed' });
});

// ---------- impact, analytics, leaderboard ----------
app.get('/api/impact', (req, res) => {
  const { db } = sweepExpiredListings();
  const by = (s) => db.listings.filter((l) => l.status === s);
  const collected = by(LISTING_STATUS.COLLECTED);
  const claimed = by(LISTING_STATUS.CLAIMED);
  const sum = (arr, k) => arr.reduce((s, i) => s + Number(i[k] || 0), 0);
  const totalFoodRescuedKg = Number(sum(collected, 'weightKg').toFixed(1));
  const co2PreventedKg = Number((totalFoodRescuedKg * 2.5).toFixed(1));
  const rated = collected.filter((l) => l.feedback && l.feedback.rating);
  const avgRating = rated.length ? Number((rated.reduce((s, l) => s + Number(l.feedback.rating), 0) / rated.length).toFixed(1)) : null;
  res.json({
    metrics: {
      totalMealsSaved: sum(collected, 'quantityMeals'),
      mealsInTransit: sum(claimed, 'quantityMeals'),
      totalFoodRescuedKg,
      co2PreventedKg,
      treesEquivalent: Number((co2PreventedKg / 21).toFixed(1)),
      avgRating,
      ratingCount: rated.length,
      activeListingsCount: by(LISTING_STATUS.POSTED).length,
      claimedListingsCount: claimed.length,
      collectedListingsCount: collected.length,
      expiredListingsCount: by(LISTING_STATUS.EXPIRED).length,
    },
    notifications: (db.notifications || []).slice(0, 12),
  });
});

app.get('/api/analytics', (req, res) => {
  const { db } = sweepExpiredListings();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), posted: 0, rescued: 0 });
  }
  const byType = { Veg: 0, 'Non-Veg': 0, Vegan: 0, Bakery: 0 };
  const status = { posted: 0, claimed: 0, collected: 0, expired: 0 };
  for (const l of db.listings) {
    status[l.status] = (status[l.status] || 0) + 1;
    const created = days.find((d) => d.key === new Date(l.createdAt).toDateString());
    if (created) created.posted += Number(l.quantityMeals || 0);
    if (l.status === LISTING_STATUS.COLLECTED) {
      byType[l.foodType] = (byType[l.foodType] || 0) + Number(l.quantityMeals || 0);
      const when = (l.claimedBy && l.claimedBy.collectedAt) || l.createdAt;
      const day = days.find((d) => d.key === new Date(when).toDateString());
      if (day) day.rescued += Number(l.quantityMeals || 0);
    }
  }
  const total = status.collected + status.expired;
  res.json({
    daily: days.map(({ label, posted, rescued }) => ({ label, posted, rescued })),
    byType,
    status,
    rescueRate: total ? Math.round((status.collected / total) * 100) : null,
  });
});

app.get('/api/leaderboard', (req, res) => {
  const { db } = sweepExpiredListings();
  const donors = {};
  const ngos = {};
  for (const l of db.listings) {
    if (l.status !== LISTING_STATUS.COLLECTED) continue;
    const meals = Number(l.quantityMeals || 0);
    donors[l.donorName] = (donors[l.donorName] || 0) + meals;
    const ngo = l.claimedBy && l.claimedBy.ngoName;
    if (ngo) ngos[ngo] = (ngos[ngo] || 0) + meals;
  }
  const top = (o) => Object.entries(o).map(([name, meals]) => ({ name, meals })).sort((a, b) => b.meals - a.meals).slice(0, 5);
  res.json({ donors: top(donors), ngos: top(ngos) });
});

// ---------- admin ----------
app.get('/api/admin/users', requireRole(USER_ROLES.ADMIN), (req, res) => {
  res.json({ users: (readDb().users || []).map(publicUser) });
});

app.post('/api/reset-demo', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const seeded = generateSeedData();
  hashAllPasswords(seeded);
  writeDb(seeded);
  res.json({ message: 'Demo reset' });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`CampusFoodShare running on http://localhost:${PORT}`));
}

module.exports = app;
