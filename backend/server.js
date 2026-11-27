require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { calculateHaversineDistance } = require('./src/utils/haversine');
const { rankListingsForNGO } = require('./src/utils/priorityQueue');
const { analyzeFoodFreshness } = require('./src/utils/aiFoodDetector');
const { hashPassword, verifyPassword, hashAllPasswords, publicUser } = require('./src/utils/auth');
const { USER_ROLES, SIGNUP_ROLES, LISTING_STATUS, FOOD_TYPES, FOOD_SAFETY_CHECKLIST, validateListingPayload } = require('./src/models/schemas');
const { match: matchOrgs, describe: describeOrg, validateOrganization, KG_PER_MEAL, ORG_TYPES } = require('./src/utils/matcher');
const { readDb, writeDb, sweepExpiredListings, addNotification } = require('./src/storage/db');
const { generateSeedData } = require('./src/seed/seedFaker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => { res.set('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
// The frontend is a separate folder: the public website at / and the platform web app at /app/
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// Leaflet is served locally so the map works even when public CDNs are blocked
app.use('/vendor/leaflet', express.static(path.join(__dirname, '..', 'node_modules', 'leaflet', 'dist')));

// ---------- bootstrap: seed if empty, hash any plaintext passwords ----------
{
  let db = readDb();
  if (!db.users || db.users.length === 0 || ((!db.listings || db.listings.length === 0) && isDemoData(db))) db = generateSeedData();
  if (!db.organizations) db.organizations = generateSeedData().organizations;
  hashAllPasswords(db);
  writeDb(db);
}
// (ensureFreshDemo runs again below, once its helpers exist)

// ---------- demo data stays alive ----------
// Demo listings are only valid for a few hours. When the data is demo data and (almost) nothing is
// open any more, regenerate the live demo slice and keep any accounts people created themselves.
// Set DEMO_MODE=off to disable this for real deployments.
function isDemoData(db) {
  return db.meta ? db.meta.demo !== false : (db.users || []).some((u) => u.id === 'usr-admin-1');
}

function ensureFreshDemo() {
  if (process.env.DEMO_MODE === 'off') return false;
  const { db } = sweepExpiredListings();
  if (!isDemoData(db)) return false;
  const open = (db.listings || []).filter((l) => l.status === LISTING_STATUS.POSTED).length;
  if (open >= 3) return false;
  const fresh = generateSeedData();
  const seedIds = new Set(fresh.users.map((u) => u.id));
  const mine = (db.users || []).filter((u) => !seedIds.has(u.id));
  hashAllPasswords(fresh);
  fresh.users = fresh.users.concat(mine);
  fresh.sessions = db.sessions || [];
  fresh.messages = db.messages || [];
  fresh.organizations = db.organizations || fresh.organizations;
  writeDb(fresh);
  return true;
}
const sweepFresh = () => { ensureFreshDemo(); return sweepExpiredListings(); };

// ---------- sessions (token -> userId) ----------
const SESSION_TTL = 30 * 24 * 3600000;
const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
/** Sessions are stored (hashed) in the database, so people stay signed in across server restarts. */
function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const db = readDb();
  db.sessions = (db.sessions || []).filter((x) => x.exp > Date.now());
  db.sessions.push({ h: sha(token), userId, exp: Date.now() + SESSION_TTL });
  writeDb(db);
  return token;
}
const newId = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex')}`;

function attachUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const db = readDb();
    const h = sha(token);
    const sess = (db.sessions || []).find((x) => x.h === h && x.exp > Date.now());
    const user = sess && (db.users || []).find((u) => u.id === sess.userId);
    if (user && !user.suspended) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}
app.use(attachUser);

// ---------- request log (feeds the backend console; method, route pattern, status and time only) ----------
const bootTime = Date.now();
const apiLog = [];
app.use('/api', (req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    if (/^\/(stream|system\/logs)/.test(req.path)) return;
    apiLog.unshift({ at: new Date().toISOString(), method: req.method, route: req.route ? req.route.path : '/api/*', status: res.statusCode, ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e6) });
    if (apiLog.length > 100) apiLog.pop();
  });
  next();
});

/** A donor may direct food to one organisation. It is reserved for that organisation for 30 minutes. */
function resolveTarget(db, body, foodType) {
  if (!body.targetOrgId) return { fields: {} };
  const o = (db.organizations || []).find((x) => x.id === body.targetOrgId && x.active !== false);
  if (!o) return { error: 'The organisation you chose could not be found' };
  if (foodType && !o.acceptsDiets.includes(foodType)) return { error: `${o.name} does not accept ${foodType} food` };
  return { fields: { targetOrgId: o.id, targetOrgName: o.name, directedUntil: new Date(Date.now() + 30 * 60000).toISOString() } };
}

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

if (ensureFreshDemo()) console.log('Demo data was stale and has been refreshed.');

// auto-expiry sweep runs in the background so clients see expiries live
setInterval(() => {
  const refreshed = ensureFreshDemo();
  const { expiredSwept } = sweepExpiredListings();
  if (refreshed || expiredSwept > 0) broadcastChange();
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
  const token = createSession(user.id);
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
  const token = createSession(user.id);
  res.json({ message: 'Signed in', user: publicUser(user), token });
});

app.post('/api/auth/signout', (req, res) => {
  if (req.token) {
    const db = readDb();
    db.sessions = (db.sessions || []).filter((x) => x.h !== sha(req.token));
    writeDb(db);
  }
  res.json({ message: 'Signed out' });
});

// ---------- password reset and change ----------
const resetHits = new Map(); // email -> timestamps
const resetPassword = (db, user, newPassword) => {
  user.password = hashPassword(newPassword);
  db.sessions = (db.sessions || []).filter((x) => x.userId !== user.id);
  failedLogins.delete(user.email);
};

app.post('/api/auth/forgot', (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const generic = { message: 'If that email is registered, a reset code has been generated.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  const now = Date.now();
  const hits = (resetHits.get(email) || []).filter((t) => now - t < 3600000);
  if (hits.length >= 3) return res.status(429).json({ error: 'Too many reset requests. Please try again in an hour.' });
  hits.push(now); resetHits.set(email, hits);
  const db = readDb();
  const user = db.users.find((u) => u.email === email);
  if (!user || user.suspended) return res.json(generic);
  const code = String(crypto.randomInt(100000, 1000000));
  db.resets = (db.resets || []).filter((r) => r.email !== email && r.exp > now);
  db.resets.push({ email, h: sha(code), exp: now + 15 * 60000, tries: 0 });
  writeDb(db);
  // Email delivery is on hold. In demo mode the code is shown on screen; otherwise it is written to the server log.
  if (isDemoData(db) || process.env.SHOW_RESET_CODE === '1') return res.json({ ...generic, demoCode: code });
  console.log(`[password reset] code for ${email}: ${code}`);
  res.json(generic);
});

app.post('/api/auth/reset', (req, res) => {
  const { email, code, password } = req.body || {};
  const key = String(email || '').trim().toLowerCase();
  if (!key || !code || !password) return res.status(400).json({ error: 'Email, code and new password are required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const db = readDb();
  const rec = (db.resets || []).find((r) => r.email === key && r.exp > Date.now());
  const user = db.users.find((u) => u.email === key);
  if (!rec || !user) return res.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  if (rec.tries >= 5) return res.status(429).json({ error: 'Too many wrong attempts. Request a new code.' });
  if (rec.h !== sha(String(code).trim())) {
    rec.tries += 1; writeDb(db);
    return res.status(400).json({ error: 'Incorrect code. Check the digits and try again.' });
  }
  resetPassword(db, user, password);
  db.resets = db.resets.filter((r) => r !== rec);
  writeDb(db);
  res.json({ message: 'Password updated. You can sign in now.' });
});

app.post('/api/auth/password', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue' });
  const { current, password } = req.body || {};
  if (!current || !password) return res.status(400).json({ error: 'Current and new password are required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!verifyPassword(current, user.password)) return res.status(400).json({ error: 'Your current password is incorrect' });
  resetPassword(db, user, password);
  const h = sha(req.token);
  db.sessions.push({ h, userId: user.id, exp: Date.now() + SESSION_TTL }); // keep this device signed in
  writeDb(db);
  res.json({ message: 'Password changed. Other devices were signed out.' });
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
  const { db, expiredSwept } = sweepFresh();
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
  const tgt = resolveTarget(db, body, body.foodType);
  if (tgt.error) return res.status(400).json({ error: 'Validation failed', details: [tgt.error] });
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
    notes: body.notes ? String(body.notes).trim().slice(0, 300) : '',
    source: 'platform',
    ...tgt.fields,
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
  const { db } = sweepFresh();
  const listing = findListing(db, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== LISTING_STATUS.POSTED) return res.status(409).json({ error: `Cannot claim listing in '${listing.status}' status` });
  if (listing.targetOrgId && Date.parse(listing.directedUntil) > Date.now() && req.user.role !== USER_ROLES.ADMIN) {
    const owner = (db.organizations || []).find((o) => o.id === listing.targetOrgId);
    if (!owner || owner.userId !== req.user.id) {
      const mins = Math.ceil((Date.parse(listing.directedUntil) - Date.now()) / 60000);
      return res.status(409).json({ error: `Reserved for ${listing.targetOrgName} for the next ${mins} minutes` });
    }
  }

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
  const { db } = sweepFresh();
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
  const { db } = sweepFresh();
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
      partners: (db.users || []).filter((u) => [USER_ROLES.NGO, USER_ROLES.VOLUNTEER].includes(u.role) && !u.suspended).length,
    },
    notifications: (db.notifications || []).slice(0, 12),
  });
});

app.get('/api/analytics', (req, res) => {
  const { db } = sweepFresh();
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
  const { db } = sweepFresh();
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
const REQUEST_TTL = 3 * 3600000;
const reqStatus = (r) => (['open', 'accepted'].includes(r.status) && Date.now() - new Date(r.createdAt).getTime() > REQUEST_TTL ? 'expired' : r.status);

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
  const open = (readDb().requests || [])
    .filter((r) => ['open', 'accepted'].includes(reqStatus(r)))
    .map((r) => ({ ...r, distanceKm: calculateHaversineDistance(lat, lng, r.lat, r.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  res.json({ requests: open, peopleWaiting: open.reduce((sum, r) => sum + r.people, 0) });
});

app.get('/api/requests/:id', (req, res) => {
  const r = (readDb().requests || []).find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  res.json({ request: {
    id: r.id, people: r.people, status: reqStatus(r), createdAt: r.createdAt, acceptedAt: r.acceptedAt || null, helpedAt: r.helpedAt || null,
    acceptedBy: r.acceptedBy ? { name: r.acceptedBy.name, org: r.acceptedBy.org, phone: r.acceptedBy.phone } : null,
  } });
});

app.post('/api/requests/:id/accept', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (reqStatus(request) !== 'open') return res.status(409).json({ error: 'This request is no longer open' });
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
  if (!['open', 'accepted'].includes(reqStatus(request))) return res.status(409).json({ error: 'This request is already closed' });
  request.status = 'cancelled';
  request.cancelledAt = new Date().toISOString();
  writeDb(db);
  res.json({ message: 'Request cancelled' });
});

app.get('/api/meta', (req, res) => res.json({ demo: isDemoData(readDb()) }));

app.post('/api/admin/start-fresh', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  db.listings = []; db.requests = []; db.notifications = []; db.feedbacks = []; db.tracking = [];
  db.meta = { demo: false, seededAt: null };
  addNotification(db, { type: 'ADMIN_ACTION', title: 'Sample data cleared', message: `${req.user.name} cleared the sample data. The platform now starts empty.`, channel: 'Audit Log' });
  writeDb(db);
  res.json({ message: 'Sample data cleared' });
});

// ---------- public website: donate without an account, track it, contact us ----------
const donationHits = new Map();
const contactHits = new Map();
const attemptHits = new Map();
const recent = (map, ip) => (map.get(ip) || []).filter((t) => Date.now() - t < 3600000);
const overLimit = (map, ip, max) => recent(map, ip).length >= max;
const record = (map, ip) => { map.set(ip, [...recent(map, ip), Date.now()]); };
// Successful submissions are limited strictly; failed attempts only loosely, so a typo never locks a real donor out.
const tooMany = (map, ip, max) => overLimit(map, ip, max) || (record(attemptHits, ip), overLimit(attemptHits, ip, 60));
const ALL_CHECKS = FOOD_SAFETY_CHECKLIST.map((c) => c.id);
const publicDonation = (l, withPin) => ({
  id: l.id, foodTitle: l.foodTitle, foodType: l.foodType, quantityMeals: l.quantityMeals, status: l.status, useBefore: l.useBefore, createdAt: l.createdAt,
  address: l.location.address, notes: l.notes || '', targetOrgName: l.targetOrgName || null,
  claimedBy: l.claimedBy ? { ngoName: l.claimedBy.ngoName, volunteerName: l.claimedBy.volunteerName, volunteerPhone: l.claimedBy.volunteerPhone, claimedAt: l.claimedBy.claimedAt, collectedAt: l.claimedBy.collectedAt } : null,
  handoverCode: withPin && l.status === LISTING_STATUS.CLAIMED && l.claimedBy ? l.claimedBy.handoverCode : null,
});
function trackedListing(db, id, token) {
  const entry = (db.tracking || []).find((t) => t.listingId === id && t.h === sha(String(token || '')));
  return entry ? (db.listings || []).find((l) => l.id === id) : null;
}

app.post('/api/public/donations', (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(201).json({ message: 'Thank you for sharing food.' }); // hidden field: only bots fill it in
  if (tooMany(donationHits, req.ip || 'unknown', 5)) return res.status(429).json({ error: 'Too many donations from this device. Please try again in an hour.' });
  const errors = [];
  const phone = String(b.phone || '').trim();
  if (!/^[0-9+() -]{7,20}$/.test(phone)) errors.push('A valid phone number is required so a team can reach you');
  if (!b.donorName || String(b.donorName).trim().length < 2) errors.push('Your name or canteen name is required');
  if (!b.address || String(b.address).trim().length < 3) errors.push('Pickup location is required');
  const hasPoint = b.lat !== undefined && b.lat !== null && b.lat !== '' && b.lng !== undefined && b.lng !== null && b.lng !== '';
  const lat = hasPoint ? Number(b.lat) : Number(process.env.DEFAULT_CAMPUS_LAT || 12.9716);
  const lng = hasPoint ? Number(b.lng) : Number(process.env.DEFAULT_CAMPUS_LNG || 77.5946);
  const confirmed = b.safetyConfirmed === true || b.safetyConfirmed === 'true';
  const kgIn = Number(b.quantityKg) > 0 ? Number(b.quantityKg) : 0;
  if (kgIn > 2000) errors.push('Quantity must be 2000 kg or less');
  const mealsIn = Number(b.quantityMeals) > 0 ? Number(b.quantityMeals) : (kgIn ? Math.max(1, Math.round(kgIn / KG_PER_MEAL)) : 0);
  const tgt = resolveTarget(readDb(), b, b.foodType);
  if (tgt.error) errors.push(tgt.error);
  const payload = {
    donorName: b.donorName, foodTitle: b.foodTitle, foodType: b.foodType, quantityMeals: mealsIn, useBefore: b.useBefore,
    location: { address: b.address, lat, lng }, safetyChecklistConfirmed: confirmed, checklistItems: confirmed ? ALL_CHECKS : [],
  };
  errors.push(...validateListingPayload(payload));
  if (new Date(b.useBefore).getTime() - Date.now() > 24 * 3600000) errors.push('Pickup deadline must be within the next 24 hours');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  record(donationHits, req.ip || 'unknown');
  const db = readDb();
  const meals = Math.round(mealsIn);
  const id = newId('lst');
  const token = crypto.randomBytes(8).toString('hex');
  const listing = {
    id, donorId: 'guest', donorName: String(b.donorName).trim().slice(0, 80), donorPhone: phone,
    foodTitle: String(b.foodTitle).trim(), foodType: b.foodType, quantityMeals: meals,
    weightKg: kgIn || (Number(b.weightKg) > 0 ? Number(b.weightKg) : Number((meals * KG_PER_MEAL).toFixed(1))),
    aiFreshnessScore: analyzeFoodFreshness({ foodTitle: b.foodTitle, hoursSinceCooked: 1 }).freshnessScore, aiFreshnessStatus: 'Estimated from the dish',
    preparedAt: new Date().toISOString(), useBefore: new Date(b.useBefore).toISOString(), status: LISTING_STATUS.POSTED,
    safetyChecklistConfirmed: true, checklistItems: ALL_CHECKS,
    location: { address: String(b.address).trim().slice(0, 140), lat, lng, approximate: !hasPoint },
    notes: b.notes ? String(b.notes).trim().slice(0, 300) : '', source: 'public-form', donorVerified: false, ...tgt.fields,
    claimedBy: null, feedback: null, createdAt: new Date().toISOString(),
  };
  db.listings.unshift(listing);
  db.tracking = [{ listingId: id, h: sha(token), createdAt: listing.createdAt }, ...(db.tracking || [])].slice(0, 500);
  addNotification(db, { type: 'NEW_LISTING', title: 'New Surplus Food Posted', message: `${listing.donorName} (website) posted ${meals} ${listing.foodType} meals ("${listing.foodTitle}").` });
  writeDb(db);
  res.status(201).json({ message: 'Your food has been posted. NGOs and volunteers nearby can now claim it.', id, token, approximateLocation: !hasPoint });
});

app.get('/api/public/donations/:id', (req, res) => {
  const l = trackedListing(readDb(), req.params.id, req.query.token);
  if (!l) return res.status(404).json({ error: 'Donation not found' });
  res.json({ donation: publicDonation(l, true) });
});

app.post('/api/public/donations/:id/withdraw', (req, res) => {
  const db = readDb();
  const l = trackedListing(db, req.params.id, (req.body || {}).token);
  if (!l) return res.status(404).json({ error: 'Donation not found' });
  if (l.status !== LISTING_STATUS.POSTED) return res.status(409).json({ error: 'Only unclaimed food can be withdrawn' });
  db.listings = db.listings.filter((x) => x.id !== l.id);
  addNotification(db, { type: 'WITHDRAWN', title: 'Listing Withdrawn', message: `"${l.foodTitle}" from ${l.donorName} was withdrawn by the donor.` });
  writeDb(db);
  res.json({ message: 'Your listing was withdrawn.' });
});

app.post('/api/public/contact', (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(201).json({ message: 'Thanks, we will get back to you.' });
  if (tooMany(contactHits, req.ip || 'unknown', 5)) return res.status(429).json({ error: 'Too many messages from this device. Please try again later.' });
  const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase(), message = String(b.message || '').trim();
  const errors = [];
  if (name.length < 2) errors.push('Please tell us your name');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Enter a valid email address so we can reply');
  if (message.length < 10) errors.push('Please write a few words about how we can help');
  if (message.length > 1000) errors.push('Message is too long (1000 characters maximum)');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  record(contactHits, req.ip || 'unknown');
  const db = readDb();
  db.messages = [{ id: newId('msg'), name: name.slice(0, 80), email, message, createdAt: new Date().toISOString(), read: false }, ...(db.messages || [])].slice(0, 500);
  writeDb(db);
  res.status(201).json({ message: 'Thanks, we will get back to you soon.' });
});

app.get('/api/admin/messages', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const messages = readDb().messages || [];
  res.json({ messages, unread: messages.filter((m) => !m.read).length });
});

app.patch('/api/admin/messages/:id', requireRole(USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const m = (db.messages || []).find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Message not found' });
  m.read = (req.body || {}).read !== false;
  writeDb(db);
  res.json({ message: m });
});

// ---------- organisations (ashrams, homes, shelters, kitchens) and donation matching ----------
app.get('/api/organizations', (req, res) => {
  const db = readDb();
  res.json({ organizations: (db.organizations || []).filter((o) => o.active !== false).map((o) => describeOrg(db, o)) });
});

/** "I have 50 kg of food. Where can I donate it?" Ranks organisations by what they need, their capacity, distance and opening hours. */
app.get('/api/match', (req, res) => {
  const q = req.query;
  let kg = Number(q.kg);
  if (!(kg > 0) && Number(q.meals) > 0) kg = Number(q.meals) * KG_PER_MEAL;
  if (!(kg >= 0.5 && kg <= 5000)) return res.status(400).json({ error: 'Enter an amount between 0.5 and 5000 kg' });
  const foodType = q.foodType || null;
  if (foodType && !FOOD_TYPES.includes(foodType)) return res.status(400).json({ error: 'foodType must be Veg, Non-Veg, Vegan or Bakery' });
  const lat = q.lat === undefined ? Number(process.env.DEFAULT_CAMPUS_LAT || 12.9716) : Number(q.lat);
  const lng = q.lng === undefined ? Number(process.env.DEFAULT_CAMPUS_LNG || 77.5946) : Number(q.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: 'Invalid location' });
  const orgType = q.type || null;
  if (orgType && !ORG_TYPES.includes(orgType)) return res.status(400).json({ error: `type must be one of ${ORG_TYPES.join(', ')}` });
  res.json(matchOrgs(readDb(), { kg, foodType, lat, lng, orgType }));
});

app.get('/api/organization/me', requireRole(USER_ROLES.NGO), (req, res) => {
  const db = readDb();
  const o = (db.organizations || []).find((x) => x.userId === req.user.id);
  res.json({ organization: o ? describeOrg(db, o) : null, types: ORG_TYPES });
});

/** An NGO keeps its requirements up to date: capacity, what it needs today, accepted food, hours, pickup. Matching reflects it immediately. */
app.put('/api/organization', requireRole(USER_ROLES.NGO), (req, res) => {
  const { errors, value } = validateOrganization(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const db = readDb();
  db.organizations = db.organizations || [];
  let o = db.organizations.find((x) => x.userId === req.user.id);
  if (!o) { o = { id: newId('org'), userId: req.user.id, verified: false, active: true }; db.organizations.push(o); }
  Object.assign(o, value, { updatedAt: new Date().toISOString() });
  addNotification(db, { type: 'ORG_UPDATE', title: 'Requirements updated', message: `${o.name} updated what it needs: ${o.needsKgToday} kg today, capacity ${o.capacityKgPerDay} kg/day.` });
  writeDb(db);
  res.json({ organization: describeOrg(db, o) });
});

// ---------- system: what is running (backend console) ----------
app.get('/api/system/status', (req, res) => {
  const db = readDb();
  const byStatus = {};
  (db.listings || []).forEach((l) => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path.startsWith('/api/')) {
      Object.keys(layer.route.methods).forEach((m) => routes.push({ method: m.toUpperCase(), path: layer.route.path, access: layer.route.path.startsWith('/api/admin') ? 'admin' : layer.route.path.startsWith('/api/public') ? 'public' : 'platform' }));
    }
  });
  res.json({
    name: 'CampusFoodShare API', version: require('../package.json').version, node: process.version, storage: 'JSON file database', time: new Date().toISOString(),
    uptimeSeconds: Math.round((Date.now() - bootTime) / 1000),
    counts: { users: (db.users || []).length, organizations: (db.organizations || []).length, listings: (db.listings || []).length, requests: (db.requests || []).length, messages: (db.messages || []).length },
    listingsByStatus: byStatus, routes,
  });
});
app.get('/api/system/logs', (req, res) => res.json({ logs: apiLog.slice(0, 60) }));

app.get('/api/directory', (req, res) => res.json({ directory: readDb().directory || [] }));

app.post('/api/requests/:id/help', requireRole(USER_ROLES.NGO, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN), (req, res) => {
  const db = readDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (!['open', 'accepted'].includes(reqStatus(request))) return res.status(409).json({ error: 'This request was already handled' });
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
  if (target.suspended) db.sessions = (db.sessions || []).filter((x) => x.userId !== target.id);
  writeDb(db);
  res.json({ user: publicUser(target) });
});

app.get('/api/dashboard', (req, res) => {
  const { db } = sweepFresh();
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
  const before = readDb();
  const seeded = generateSeedData();
  hashAllPasswords(seeded);
  // people whose accounts still exist after the reset stay signed in
  const ids = new Set(seeded.users.map((u) => u.id));
  seeded.sessions = (before.sessions || []).filter((x) => ids.has(x.userId) && x.exp > Date.now());
  seeded.messages = before.messages || [];
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
