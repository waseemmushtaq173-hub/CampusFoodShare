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
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => { res.set('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
app.use(express.static(path.join(__dirname, 'public')));
// Leaflet is served locally so the map works even when public CDNs are blocked
app.use('/vendor/leaflet', express.static(path.join(__dirname, 'node_modules', 'leaflet', 'dist')));

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
    if (user && !user.suspended) {
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

// ---------- real-time updates (Server-Sent Events) ----------
const streamClients = new Set();
let lastNotificationId = ((readDb().notifications || [])[0] || {}).id;

function broadcast(payload, event = 'update') {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of streamClients) client.write(msg);
}

function broadcastChange() {
  const latest = (readDb().notifications || [])[0];
  const payload = { at: Date.now() };
  if (latest && latest.id !== lastNotificationId) {
    lastNotificationId = latest.id;
    payload.title = latest.title;
    payload.message = latest.message;
    payload.type = latest.type;
  }
  broadcast(payload);
}

app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  streamClients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); streamClients.delete(res); });
});

// any successful write to the API notifies every connected browser
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'OPTIONS' && !req.originalUrl.startsWith('/api/location')) {
    res.on('finish', () => { if (res.statusCode < 400) broadcastChange(); });
  }
  next();
});

// auto-expiry sweep runs in the background so clients see expiries live
setInterval(() => {
  const { expiredSwept } = sweepExpiredListings();
  if (expiredSwept > 0) broadcastChange();
}, 30000).unref();

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

const failedLogins = new Map(); // email -> { n, until }

app.post('/api/auth/signin', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const key = String(email).trim().toLowerCase();
  const failed = failedLogins.get(key);
  if (failed && failed.until > Date.now() && failed.n >= 5) {
    return res.status(429).json({ error: 'Too many failed attempts. Please wait a few minutes and try again.' });
  }
  const db = readDb();
  const user = db.users.find((u) => u.email === key);
  if (!user || !verifyPassword(password, user.password)) {
    const n = failed && failed.until > Date.now() ? failed.n + 1 : 1;
    failedLogins.set(key, { n, until: Date.now() + 10 * 60000 });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.suspended) return res.status(403).json({ error: 'This account has been suspended by an admin' });
  if (role && role !== user.role) {
    return res.status(403).json({ error: `This account is registered as ${user.role.toUpperCase()}. Select "${user.role}" to sign in.` });
  }
  failedLogins.delete(key);
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
const baseName = (n) => String(n || '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();

function isMine(l, user) {
  if (user.role === USER_ROLES.DONOR) return l.donorId === user.id;
  if (user.role === USER_ROLES.NGO) return !!(l.claimedBy && l.claimedBy.userId === user.id);
  if (user.role === USER_ROLES.VOLUNTEER) {
    return !!(l.claimedBy && (l.claimedBy.userId === user.id || baseName(l.claimedBy.volunteerName) === baseName(user.name)));
  }
  return user.role === USER_ROLES.ADMIN;
}

/** Handover PIN is only visible to the owning donor, the claimant, the assigned volunteer and admins. */
function sanitizeListing(l, user) {
  if (!l.claimedBy || !l.claimedBy.handoverCode) return l;
  const canSee = user && (user.role === USER_ROLES.ADMIN || l.donorId === user.id || isMine(l, user));
  if (canSee) return l;
  const { handoverCode, ...claimedBy } = l.claimedBy;
  return { ...l, claimedBy };
}
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
  if (req.query.scope === 'mine' && req.user) filtered = filtered.filter((l) => isMine(l, req.user));
  const listings = rankListingsForNGO(filtered, ngoLat, ngoLng, calculateHaversineDistance).map((l) => sanitizeListing(l, req.user));
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
    handoverCode: String(crypto.randomInt(1000, 10000)),
    ngoName: String(ngoName).trim(),
    volunteerName: String(volunteerName).trim(),
    volunteerPhone: volunteerPhone || req.user.phone || '',
    claimedAt: new Date().toISOString(),
    collectedAt: null,
  };
  addNotification(db, { type: 'CLAIMED', title: 'Listing Claimed for Pickup', message: `${listing.claimedBy.ngoName} (Volunteer: ${listing.claimedBy.volunteerName}) claimed "${listing.foodTitle}".` });
  writeDb(db);
  res.json({ message: 'Listing claimed', listing: sanitizeListing(listing, req.user) });
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
  const expected = listing.claimedBy && listing.claimedBy.handoverCode;
  if (expected && req.user.role !== USER_ROLES.ADMIN && String((req.body || {}).code || '').trim() !== expected) {
    return res.status(400).json({ error: 'Incorrect handover PIN. Ask the donor for the 4-digit code.' });
  }
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

// ---------- live volunteer / NGO locations ----------
const liveLocations = new Map(); // userId -> { userId, name, lat, lng, accuracy, at }

app.post('/api/location', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const lat = Number(req.body && req.body.lat), lng = Number(req.body && req.body.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: 'Valid lat/lng required' });
  liveLocations.set(req.user.id, { userId: req.user.id, name: req.user.name, lat, lng, accuracy: Number(req.body.accuracy) || null, at: Date.now() });
  broadcast({ at: Date.now() }, 'location');
  res.json({ ok: true });
});

/** Live positions of volunteers on claimed pickups. Only the donor, the claimant and admins can see them. */
app.get('/api/locations', requireRole(USER_ROLES.ADMIN, USER_ROLES.DONOR, USER_ROLES.NGO, USER_ROLES.VOLUNTEER), (req, res) => {
  const db = readDb();
  const fresh = Date.now() - 10 * 60000;
  const out = [];
  for (const l of db.listings) {
    if (l.status !== LISTING_STATUS.CLAIMED || !l.claimedBy) continue;
    if (!(req.user.role === USER_ROLES.ADMIN || l.donorId === req.user.id || isMine(l, req.user))) continue;
    const p = [...liveLocations.values()]
      .filter((x) => x.at >= fresh && (x.userId === l.claimedBy.userId || baseName(x.name) === baseName(l.claimedBy.volunteerName)))
      .sort((a, b) => b.at - a.at)[0];
    let pos = p;
    if (!pos && l.claimedBy.sim) {
      const claimedAt = new Date(l.claimedBy.claimedAt).getTime();
      const progress = Math.min(0.95, Math.max(0.05, (Date.now() - claimedAt) / (25 * 60000)));
      const sLat = Number(l.location.lat) + 0.011, sLng = Number(l.location.lng) - 0.009;
      pos = { name: l.claimedBy.volunteerName, lat: sLat + (Number(l.location.lat) - sLat) * progress, lng: sLng + (Number(l.location.lng) - sLng) * progress, at: Date.now(), simulated: true };
    }
    if (!pos) continue;
    out.push({
      listingId: l.id, title: l.foodTitle, name: String(pos.name).replace(/\s*\(.*\)\s*$/, ''), lat: pos.lat, lng: pos.lng, at: pos.at, simulated: Boolean(pos.simulated),
      pickup: { lat: l.location.lat, lng: l.location.lng },
      distanceKm: calculateHaversineDistance(pos.lat, pos.lng, Number(l.location.lat), Number(l.location.lng)),
    });
  }
  res.json({ locations: out });
});

// ---------- "I need food" requests from people in need (public, rate limited) ----------
const requestHits = new Map(); // ip -> timestamps of recent requests

app.post('/api/requests', (req, res) => {
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const hits = (requestHits.get(ip) || []).filter((t) => now - t < 3600000);
  if (hits.length >= 5) return res.status(429).json({ error: 'Too many requests from this device. Please try again later.' });
  const b = req.body || {};
  const people = Math.round(Number(b.people));
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!(people >= 1 && people <= 50)) return res.status(400).json({ error: 'people must be between 1 and 50' });
  if (b.lat === undefined || b.lng === undefined || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'A valid location is required' });
  }
  const db = readDb();
  db.requests = db.requests || [];
  const request = {
    id: newId('req'), people, lat, lng, status: 'open', createdAt: new Date().toISOString(),
    phone: b.phone ? String(b.phone).replace(/[^\d+ ]/g, '').slice(0, 20) : '',
    name: b.name ? String(b.name).trim().slice(0, 60) : '',
    note: b.note ? String(b.note).trim().slice(0, 140) : '',
  };
  db.requests.unshift(request);
  db.requests = db.requests.slice(0, 200);
  addNotification(db, { type: 'FOOD_REQUEST', title: 'Someone needs food', message: `${people} ${people === 1 ? 'person needs' : 'people need'} food near ${lat.toFixed(3)}, ${lng.toFixed(3)}.` });
  writeDb(db);
  hits.push(now);
  requestHits.set(ip, hits);
  res.status(201).json({ message: 'Request received', id: request.id });
});

app.get('/api/requests', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const lat = parseFloat(req.query.lat) || 12.9716;
  const lng = parseFloat(req.query.lng) || 77.5946;
  const fresh = Date.now() - 6 * 3600000;
  const open = (readDb().requests || [])
    .filter((r) => ['open', 'accepted'].includes(r.status) && new Date(r.createdAt).getTime() >= fresh)
    .map((r) => ({ ...r, distanceKm: calculateHaversineDistance(lat, lng, r.lat, r.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  res.json({ requests: open, peopleWaiting: open.reduce((sum, r) => sum + r.people, 0) });
});

app.get('/api/requests/:id', (req, res) => {
  const r = (readDb().requests || []).find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  res.json({ request: {
    id: r.id, people: r.people, status: r.status, createdAt: r.createdAt, acceptedAt: r.acceptedAt || null, helpedAt: r.helpedAt || null,
    acceptedBy: r.acceptedBy ? { name: r.acceptedBy.name, org: r.acceptedBy.org, phone: r.acceptedBy.phone } : null,
  } });
});

app.post('/api/requests/:id/accept', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'open') return res.status(409).json({ error: 'Someone has already taken this request' });
  request.status = 'accepted';
  request.acceptedAt = new Date().toISOString();
  request.acceptedBy = { name: req.user.name, org: req.user.organization || '', phone: req.user.phone || '' };
  addNotification(db, { type: 'REQUEST_ACCEPTED', title: 'Request accepted', message: `${req.user.name} is on the way to help ${request.people} ${request.people === 1 ? 'person' : 'people'}.` });
  writeDb(db);
  res.json({ message: 'Request accepted' });
});

app.post('/api/requests/:id/cancel', (req, res) => {
  const db = readDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (!['open', 'accepted'].includes(request.status)) return res.status(409).json({ error: 'This request is already closed' });
  request.status = 'cancelled';
  request.cancelledAt = new Date().toISOString();
  writeDb(db);
  res.json({ message: 'Request cancelled' });
});

app.get('/api/directory', (req, res) => res.json({ directory: readDb().directory || [] }));

app.post('/api/requests/:id/help', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (!['open', 'accepted'].includes(request.status)) return res.status(409).json({ error: 'This request was already handled' });
  request.status = 'helped';
  request.helpedBy = req.user.name;
  if (!request.acceptedBy) request.acceptedBy = { name: req.user.name, org: req.user.organization || '', phone: req.user.phone || '' };
  request.helpedAt = new Date().toISOString();
  addNotification(db, { type: 'REQUEST_HELPED', title: 'Request fulfilled', message: `${req.user.name} helped ${request.people} ${request.people === 1 ? 'person' : 'people'} get food.` });
  writeDb(db);
  res.json({ message: 'Marked as helped' });
});

// ---------- admin ----------
app.get('/api/admin/users', requireRole(USER_ROLES.ADMIN), (req, res) => {
  res.json({ users: (readDb().users || []).map(publicUser) });
});

app.patch('/api/admin/users/:id', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own account' });
  const { role, suspended } = req.body || {};
  if (role !== undefined) {
    if (!Object.values(USER_ROLES).includes(role)) return res.status(400).json({ error: 'Invalid role' });
    target.role = role;
  }
  if (suspended !== undefined) target.suspended = Boolean(suspended);
  addNotification(db, { type: 'ADMIN_ACTION', title: 'Admin Action', message: `${req.user.name} updated ${target.name}: role=${target.role}, ${target.suspended ? 'suspended' : 'active'}.`, channel: 'Audit Log' });
  writeDb(db);
  if (target.suspended) for (const [t, uid] of sessions) if (uid === target.id) sessions.delete(t);
  res.json({ user: publicUser(target) });
});

app.get('/api/dashboard', (req, res) => {
  const { db } = sweepExpiredListings();
  const L = db.listings;
  const meals = (arr) => arr.reduce((s, i) => s + Number(i.quantityMeals || 0), 0);
  const kg = (arr) => Number(arr.reduce((s, i) => s + Number(i.weightKg || 0), 0).toFixed(1));
  const st = (arr, s) => arr.filter((l) => l.status === s);
  const avg = (arr) => {
    const r = arr.filter((l) => l.feedback);
    return r.length ? Number((r.reduce((s, l) => s + l.feedback.rating, 0) / r.length).toFixed(1)) : null;
  };
  const lat = parseFloat(req.query.lat) || 12.9716;
  const lng = parseFloat(req.query.lng) || 77.5946;
  const user = req.user;
  if (!user) return res.json({ role: 'guest' });
  const withDist = (l) => ({ ...sanitizeListing(l, user), distanceKm: calculateHaversineDistance(lat, lng, Number(l.location.lat), Number(l.location.lng)) });

  if (user.role === USER_ROLES.DONOR) {
    const mine = L.filter((l) => isMine(l, user));
    const done = st(mine, 'collected');
    const finished = done.length + st(mine, 'expired').length;
    return res.json({
      role: 'donor',
      stats: {
        listings: mine.length, mealsPosted: meals(mine), mealsRescued: meals(done), kgRescued: kg(done),
        active: st(mine, 'posted').length, inTransit: st(mine, 'claimed').length,
        rescueRate: finished ? Math.round((done.length / finished) * 100) : null, avgRating: avg(mine),
      },
      recent: mine.slice(0, 4).map(withDist),
    });
  }
  if (user.role === USER_ROLES.NGO || user.role === USER_ROLES.VOLUNTEER) {
    const mine = L.filter((l) => isMine(l, user));
    const done = st(mine, 'collected');
    const urgent = rankListingsForNGO(st(L, 'posted'), lat, lng, calculateHaversineDistance).slice(0, 3);
    return res.json({
      role: user.role,
      stats: {
        activePickups: st(mine, 'claimed').length, completed: done.length, mealsCollected: meals(done), kgRescued: kg(done),
        co2: Number((kg(done) * 2.5).toFixed(1)), availableNow: st(L, 'posted').length, rated: done.filter((l) => l.feedback).length,
      },
      active: st(mine, 'claimed').map(withDist),
      urgent,
    });
  }
  const now = Date.now();
  const roles = {};
  for (const u of db.users) roles[u.role] = (roles[u.role] || 0) + 1;
  const finished = st(L, 'collected').length + st(L, 'expired').length;
  return res.json({
    role: 'admin',
    stats: {
      users: db.users.length, suspended: db.users.filter((u) => u.suspended).length, roles,
      listings: L.length, posted: st(L, 'posted').length, claimed: st(L, 'claimed').length,
      collected: st(L, 'collected').length, expired: st(L, 'expired').length,
      expiringSoon: st(L, 'posted').filter((l) => new Date(l.useBefore) - now < 30 * 60000).length,
      rescueRate: finished ? Math.round((st(L, 'collected').length / finished) * 100) : null,
      mealsSaved: meals(st(L, 'collected')),
    },
    audit: (db.notifications || []).slice(0, 8),
  });
});

app.post('/api/reset-demo', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const seeded = generateSeedData();
  hashAllPasswords(seeded);
  writeDb(seeded);
  res.json({ message: 'Demo reset' });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

// JSON error handler (malformed request bodies, unexpected failures)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`CampusFoodShare running on http://localhost:${PORT}`));
}

module.exports = app;
