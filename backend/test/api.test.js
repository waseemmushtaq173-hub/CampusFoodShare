const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 3400 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const DB = path.join(os.tmpdir(), `cfs-test-${process.pid}-${Date.now()}.json`);
let server;
const tok = {};

async function call(method, url, body, token) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty */ }
  return { status: res.status, data };
}
const signin = async (email, password, role) => (await call('POST', '/api/auth/signin', { email, password, role })).data.token;
const CHECKLIST = ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'];
const listing = (over = {}) => ({
  foodTitle: 'Test Pulao', foodType: 'Veg', quantityMeals: 25, useBefore: new Date(Date.now() + 2 * 3600000).toISOString(),
  location: { address: 'Gate 1', lat: 12.97, lng: 77.59 }, safetyChecklistConfirmed: true, checklistItems: CHECKLIST, ...over,
});

before(async () => {
  server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT), DB_FILE_PATH: DB, DEMO_MODE: 'off' }, cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASE}/api/checklist`)).ok) break; } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  tok.admin = await signin('admin@campusfoodshare.org', 'admin123', 'admin');
  tok.donor = await signin('donor@campusfoodshare.org', 'donor123', 'donor');
  tok.ngo = await signin('ngo@campusfoodshare.org', 'ngo123', 'ngo');
  tok.vol = await signin('volunteer@campusfoodshare.org', 'vol123', 'volunteer');
});

after(() => { if (server) server.kill(); try { fs.unlinkSync(DB); } catch (e) { /* ignore */ } });

test('seed users can sign in and passwords are stored hashed', () => {
  for (const t of Object.values(tok)) assert.ok(t, 'token issued');
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  assert.ok(db.users.every((u) => u.password.startsWith('scrypt$')));
});

test('public endpoints work and never leak users', async () => {
  assert.equal((await call('GET', '/api/checklist')).data.checklist.length, 4);
  const impact = await call('GET', '/api/impact');
  assert.equal(impact.status, 200);
  assert.equal(impact.data.users, undefined);
  const list = await call('GET', '/api/listings');
  assert.ok(list.data.listings.length > 0);
  assert.equal(list.data.listings[0].status, 'posted', 'posted listings rank first');
  assert.equal((await fetch(`${BASE}/vendor/leaflet/leaflet.js`)).status, 200, 'Leaflet is self-hosted');
});

test('sign-up validation and role rules', async () => {
  assert.equal((await call('POST', '/api/auth/signup', { name: 'x', email: 'x@y.co', password: 'secret1', role: 'admin' })).status, 400);
  assert.equal((await call('POST', '/api/auth/signup', { name: 'x', email: 'bad', password: 'secret1', role: 'donor' })).status, 400);
  assert.equal((await call('POST', '/api/auth/signup', { name: 'x', email: 'a@b.co', password: '123', role: 'donor' })).status, 400);
  const ok = await call('POST', '/api/auth/signup', { name: 'New Mess', email: 'NewMess@Test.io', password: 'secret1', role: 'donor', phone: '+91 90000 00001' });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.user.password, undefined);
  assert.equal((await call('POST', '/api/auth/signup', { name: 'dup', email: 'newmess@test.io', password: 'secret1', role: 'donor' })).status, 409);
  assert.equal((await call('GET', '/api/auth/me', undefined, ok.data.token)).data.user.email, 'newmess@test.io');
});

test('sign-in is role based and brute-force protected', async () => {
  assert.equal((await call('POST', '/api/auth/signin', { email: 'donor@campusfoodshare.org', password: 'donor123', role: 'admin' })).status, 403);
  assert.equal((await call('POST', '/api/auth/signin', { email: 'donor@campusfoodshare.org', password: 'donor123', role: 'donor' })).status, 200);
  assert.equal((await call('POST', '/api/auth/signin', { email: 'nobody@x.io', password: 'x' })).status, 401);
  let last;
  for (let i = 0; i < 6; i++) last = await call('POST', '/api/auth/signin', { email: 'lock@test.io', password: 'bad' });
  assert.equal(last.status, 429);
});

test('role-based access control on listing actions', async () => {
  assert.equal((await call('POST', '/api/listings', listing())).status, 401);
  assert.equal((await call('POST', '/api/listings', listing(), tok.ngo)).status, 403);
  assert.equal((await call('POST', '/api/listings', listing({ checklistItems: ['temp_control'] }), tok.donor)).status, 400);
  assert.equal((await call('POST', '/api/listings', listing({ useBefore: new Date(Date.now() - 1000).toISOString() }), tok.donor)).status, 400);
  assert.equal((await call('POST', '/api/listings', listing({ location: { lat: 999, lng: 1 } }), tok.donor)).status, 400);
  assert.equal((await call('POST', '/api/reset-demo', {}, tok.ngo)).status, 403);
  assert.equal((await call('GET', '/api/admin/users', undefined, tok.donor)).status, 403);
});

test('full lifecycle: post, claim, PIN collect, rate, privacy of the PIN', async () => {
  const posted = await call('POST', '/api/listings', listing(), tok.donor);
  assert.equal(posted.status, 201);
  const id = posted.data.listing.id;
  assert.equal((await call('POST', `/api/listings/${id}/claim`, { ngoName: 'N', volunteerName: 'V' }, tok.donor)).status, 403);
  const claim = await call('POST', `/api/listings/${id}/claim`, { ngoName: 'Robin Hood', volunteerName: 'Harsha S' }, tok.ngo);
  assert.equal(claim.status, 200);
  const pin = claim.data.listing.claimedBy.handoverCode;
  assert.match(pin, /^\d{4}$/);
  assert.equal((await call('POST', `/api/listings/${id}/claim`, { ngoName: 'N', volunteerName: 'V' }, tok.vol)).status, 409);

  const find = async (t) => (await call('GET', '/api/listings?status=claimed', undefined, t)).data.listings.find((l) => l.id === id);
  assert.equal((await find()).claimedBy.handoverCode, undefined, 'guests cannot see the PIN');
  assert.equal((await find(tok.ngo)).claimedBy.handoverCode, pin);
  assert.equal((await find(tok.donor)).claimedBy.handoverCode, pin, 'the owning donor sees the PIN');

  assert.equal((await call('POST', `/api/listings/${id}/feedback`, { rating: 5 }, tok.ngo)).status, 409, 'cannot rate before collection');
  assert.equal((await call('POST', `/api/listings/${id}/collect`, { code: '0000' === pin ? '1111' : '0000' }, tok.ngo)).status, 400);
  assert.equal((await call('POST', `/api/listings/${id}/collect`, { code: pin }, tok.ngo)).status, 200);
  assert.equal((await call('POST', `/api/listings/${id}/collect`, { code: pin }, tok.ngo)).status, 409);
  assert.equal((await call('POST', `/api/listings/${id}/feedback`, { rating: 4, comment: 'Great' }, tok.ngo)).status, 200);
  assert.equal((await call('POST', `/api/listings/${id}/feedback`, { rating: 4 }, tok.ngo)).status, 409);
});

test('release rules and admin collect without PIN', async () => {
  const id = (await call('POST', '/api/listings', listing({ foodTitle: 'Release me' }), tok.donor)).data.listing.id;
  await call('POST', `/api/listings/${id}/claim`, { ngoName: 'N', volunteerName: 'Someone Else' }, tok.ngo);
  assert.equal((await call('POST', `/api/listings/${id}/release`, {}, tok.vol)).status, 403, 'only the claimant can release');
  assert.equal((await call('POST', `/api/listings/${id}/release`, {}, tok.ngo)).status, 200);
  await call('POST', `/api/listings/${id}/claim`, { ngoName: 'N', volunteerName: 'V' }, tok.ngo);
  assert.equal((await call('POST', `/api/listings/${id}/collect`, {}, tok.admin)).status, 200);
});

test('withdraw and delete permissions', async () => {
  const id = (await call('POST', '/api/listings', listing({ foodTitle: 'Withdraw me' }), tok.donor)).data.listing.id;
  assert.equal((await call('DELETE', `/api/listings/${id}`, undefined, tok.ngo)).status, 403);
  assert.equal((await call('DELETE', `/api/listings/${id}`, undefined, tok.donor)).status, 200);
  assert.equal((await call('DELETE', `/api/listings/${id}`, undefined, tok.admin)).status, 404);
  const other = (await call('GET', '/api/listings?foodType=Veg')).data.listings.find((l) => l.donorId !== 'usr-donor-1' && l.status === 'posted');
  if (other) assert.equal((await call('DELETE', `/api/listings/${other.id}`, undefined, tok.donor)).status, 403);
});

test('role dashboards return role-specific data', async () => {
  assert.equal((await call('GET', '/api/dashboard')).data.role, 'guest');
  const d = await call('GET', '/api/dashboard?lat=12.97&lng=77.59', undefined, tok.donor);
  assert.equal(d.data.role, 'donor');
  assert.ok(typeof d.data.stats.mealsPosted === 'number');
  assert.ok(d.data.recent.every((l) => typeof l.distanceKm === 'number'));
  assert.equal((await call('GET', '/api/dashboard', undefined, tok.ngo)).data.role, 'ngo');
  assert.equal((await call('GET', '/api/dashboard', undefined, tok.vol)).data.role, 'volunteer');
  const a = await call('GET', '/api/dashboard', undefined, tok.admin);
  assert.equal(a.data.role, 'admin');
  assert.ok(a.data.stats.users >= 4);
});

test('admin: users, role change, suspension, self-protection', async () => {
  const users = (await call('GET', '/api/admin/users', undefined, tok.admin)).data.users;
  assert.ok(users.every((u) => u.password === undefined));
  const vol = users.find((u) => u.email === 'volunteer@campusfoodshare.org');
  const me = users.find((u) => u.email === 'admin@campusfoodshare.org');
  assert.equal((await call('PATCH', `/api/admin/users/${me.id}`, { suspended: true }, tok.admin)).status, 400);
  assert.equal((await call('PATCH', `/api/admin/users/${vol.id}`, { role: 'wizard' }, tok.admin)).status, 400);
  assert.equal((await call('PATCH', `/api/admin/users/${vol.id}`, { suspended: true }, tok.admin)).status, 200);
  assert.equal((await call('GET', '/api/auth/me', undefined, tok.vol)).status, 401, 'suspended sessions are revoked');
  assert.equal((await call('POST', '/api/auth/signin', { email: vol.email, password: 'vol123', role: 'volunteer' })).status, 403);
  assert.equal((await call('PATCH', `/api/admin/users/${vol.id}`, { suspended: false }, tok.admin)).status, 200);
  tok.vol = await signin(vol.email, 'vol123', 'volunteer');
  assert.ok(tok.vol);
});

test('live location sharing is permission checked', async () => {
  assert.equal((await call('POST', '/api/location', { lat: 12.97, lng: 77.59 })).status, 401);
  assert.equal((await call('POST', '/api/location', { lat: 12.97, lng: 77.59 }, tok.donor)).status, 403);
  assert.equal((await call('POST', '/api/location', { lat: 999, lng: 1 }, tok.vol)).status, 400);
  assert.equal((await call('POST', '/api/location', { lat: 12.9741, lng: 77.596, accuracy: 8 }, tok.vol)).status, 200);
  const ngo = (await call('GET', '/api/locations', undefined, tok.ngo)).data.locations;
  assert.ok(ngo.length >= 1 && typeof ngo[0].distanceKm === 'number');
  assert.equal((await call('GET', '/api/locations')).status, 401);
});

test('real-time stream pushes an event when data changes', async () => {
  const ctrl = new AbortController();
  const res = await fetch(`${BASE}/api/stream`, { signal: ctrl.signal });
  assert.ok(res.headers.get('content-type').startsWith('text/event-stream'));
  const reader = res.body.getReader();
  await new Promise((r) => setTimeout(r, 150));
  await call('POST', '/api/listings', listing({ foodTitle: 'Stream test' }), tok.donor);
  let seen = '';
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline && !seen.includes('event: update')) {
    const { value } = await reader.read();
    seen += Buffer.from(value || []).toString();
  }
  ctrl.abort();
  assert.ok(seen.includes('event: update'));
});

test('errors are returned as JSON', async () => {
  const bad = await fetch(`${BASE}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'Invalid JSON body');
  assert.equal((await call('GET', '/api/nope')).status, 404);
});

test('admin reset restores demo data', async () => {
  assert.equal((await call('POST', '/api/reset-demo', {}, tok.admin)).status, 200);
  const list = await call('GET', '/api/listings?includeExpired=true');
  assert.ok(list.data.listings.length >= 25, 'rich demo data is restored');
});

test('people in need can ask for food; only NGOs, volunteers and admins can see and answer', async () => {
  assert.equal((await call('POST', '/api/requests', { people: 0, lat: 12.97, lng: 77.59 })).status, 400);
  assert.equal((await call('POST', '/api/requests', { people: 3 })).status, 400, 'location is required');
  const ok = await call('POST', '/api/requests', { people: 3, phone: '+91 98765 43210', lat: 12.9716, lng: 77.5946 });
  assert.equal(ok.status, 201);
  assert.equal((await call('GET', '/api/requests')).status, 401, 'guests cannot read requests');
  assert.equal((await call('GET', '/api/requests', undefined, tok.donor)).status, 403);
  const list = await call('GET', '/api/requests?lat=12.97&lng=77.59', undefined, tok.ngo);
  assert.equal(list.status, 200);
  const mine = list.data.requests.find((r) => r.id === ok.data.id);
  assert.ok(mine && typeof mine.distanceKm === 'number' && mine.people === 3);
  assert.ok(list.data.peopleWaiting >= 3);
  assert.equal((await call('POST', `/api/requests/${ok.data.id}/help`, {}, tok.donor)).status, 403);
  assert.equal((await call('POST', `/api/requests/${ok.data.id}/help`, {}, tok.ngo)).status, 200);
  assert.equal((await call('POST', `/api/requests/${ok.data.id}/help`, {}, tok.ngo)).status, 409);
  const after = await call('GET', '/api/requests', undefined, tok.ngo);
  assert.ok(!after.data.requests.some((r) => r.id === ok.data.id), 'helped requests leave the queue');
});

test('request lifecycle: received, accepted by a named helper, helped, plus cancel and directory', async () => {
  const made = await call('POST', '/api/requests', { people: 2, lat: 12.97, lng: 77.59 });
  assert.equal(made.status, 201);
  const id = made.data.id;
  const view = async () => (await call('GET', `/api/requests/${id}`)).data.request;
  assert.equal((await view()).status, 'open');
  assert.equal((await call('POST', `/api/requests/${id}/accept`, {}, tok.donor)).status, 403);
  assert.equal((await call('POST', `/api/requests/${id}/accept`, {}, tok.vol)).status, 200);
  assert.equal((await call('POST', `/api/requests/${id}/accept`, {}, tok.ngo)).status, 409, 'only one helper can take a request');
  const accepted = await view();
  assert.equal(accepted.status, 'accepted');
  assert.ok(accepted.acceptedBy && accepted.acceptedBy.name, 'the person can see who is coming');
  assert.equal((await call('POST', `/api/requests/${id}/help`, {}, tok.vol)).status, 200);
  assert.equal((await view()).status, 'helped');
  assert.equal((await call('POST', `/api/requests/${id}/cancel`, {})).status, 409);
  const another = (await call('POST', '/api/requests', { people: 1, lat: 12.97, lng: 77.59 })).data.id;
  assert.equal((await call('POST', `/api/requests/${another}/cancel`, {})).status, 200);
  assert.equal((await call('GET', '/api/requests/nope')).status, 404);
  assert.ok((await call('GET', '/api/directory')).data.directory.length >= 3);
});

test('food requests are rate limited per device', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await call('POST', '/api/requests', { people: 1, lat: 12.97, lng: 77.59 });
  assert.equal(last.status, 429);
});

test('stale demo data refreshes itself and keeps accounts people created', async () => {
  const { generateSeedData } = require('../src/seed/seedFaker');
  const { hashAllPasswords, hashPassword } = require('../src/utils/auth');
  const staleDb = path.join(os.tmpdir(), `cfs-stale-${process.pid}-${Date.now()}.json`);
  const port = PORT + 1;
  const data = generateSeedData();
  hashAllPasswords(data);
  // simulate "seeded yesterday": nothing is open any more
  data.listings.forEach((l) => { if (l.status === 'posted' || l.status === 'claimed') { l.status = 'expired'; l.useBefore = new Date(Date.now() - 20 * 3600000).toISOString(); } });
  data.users.push({ id: 'usr-custom-1', name: 'Custom Donor', email: 'custom@example.com', password: hashPassword('secret123'), role: 'donor', organization: 'Custom Kitchen', phone: '', verified: true });
  fs.writeFileSync(staleDb, JSON.stringify(data));
  const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DB_FILE_PATH: staleDb }, cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  try {
    const base = `http://localhost:${port}`;
    for (let i = 0; i < 50; i++) { try { if ((await fetch(`${base}/api/checklist`)).ok) break; } catch (e) { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }
    const open = await (await fetch(`${base}/api/listings?status=posted`)).json();
    assert.ok(open.count >= 3, 'demo has open listings again');
    const login = await fetch(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'custom@example.com', password: 'secret123', role: 'donor' }) });
    assert.equal(login.status, 200, 'accounts created by people are kept');
  } finally { srv.kill(); try { fs.unlinkSync(staleDb); } catch (e) { /* ignore */ } }
});

/* ---- helpers for tests that need their own server / database ---- */
async function bootServer(port, dbFile, env = {}) {
  const proc = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DB_FILE_PATH: dbFile, ...env }, cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${base}/api/checklist`)).ok) break; } catch (e) { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }
  const api = async (m, u, body, token) => {
    const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    let data = {}; try { data = await r.json(); } catch (e) { /* empty */ }
    return { status: r.status, data };
  };
  return { proc, api, stop: () => new Promise((res) => { proc.once('exit', res); proc.kill(); setTimeout(res, 1500); }) };
}
const tmpDb = (tag) => path.join(os.tmpdir(), `cfs-${tag}-${process.pid}-${Date.now()}.json`);

test('sign-in survives a server restart', async () => {
  const file = tmpDb('sess');
  let srv = await bootServer(PORT + 2, file, { DEMO_MODE: 'off' });
  try {
    const login = await srv.api('POST', '/api/auth/signin', { email: 'ngo@campusfoodshare.org', password: 'ngo123', role: 'ngo' });
    assert.equal(login.status, 200);
    const token = login.data.token;
    await srv.stop();
    srv = await bootServer(PORT + 2, file, { DEMO_MODE: 'off' });
    const me = await srv.api('GET', '/api/auth/me', undefined, token);
    assert.equal(me.status, 200, 'the same token still works after a restart');
    assert.equal(me.data.user.email, 'ngo@campusfoodshare.org');
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(raw.sessions.every((x) => x.h && !JSON.stringify(x).includes(token)), 'tokens are stored hashed');
    await srv.api('POST', '/api/auth/signout', {}, token);
    assert.equal((await srv.api('GET', '/api/auth/me', undefined, token)).status, 401, 'sign-out revokes the session');
  } finally { await srv.stop(); try { fs.unlinkSync(file); } catch (e) { /* ignore */ } }
});

test('password reset with a one-time code, and change password', async () => {
  const file = tmpDb('pw');
  const srv = await bootServer(PORT + 3, file, { DEMO_MODE: 'off', SHOW_RESET_CODE: '1' });
  const D = 'donor@campusfoodshare.org';
  try {
    assert.equal((await srv.api('POST', '/api/auth/forgot', { email: 'nope' })).status, 400);
    const unknown = await srv.api('POST', '/api/auth/forgot', { email: 'nobody@example.com' });
    assert.equal(unknown.status, 200);
    assert.equal(unknown.data.demoCode, undefined, 'unknown emails get no code and no hint');
    const old = (await srv.api('POST', '/api/auth/signin', { email: D, password: 'donor123', role: 'donor' })).data.token;
    const f = await srv.api('POST', '/api/auth/forgot', { email: D });
    assert.match(f.data.demoCode, /^\d{6}$/);
    assert.equal((await srv.api('POST', '/api/auth/reset', { email: D, code: '000000', password: 'newpass1' })).status, 400, 'wrong code');
    assert.equal((await srv.api('POST', '/api/auth/reset', { email: D, code: f.data.demoCode, password: '123' })).status, 400, 'short password');
    assert.equal((await srv.api('POST', '/api/auth/reset', { email: D, code: f.data.demoCode, password: 'newpass1' })).status, 200);
    assert.equal((await srv.api('POST', '/api/auth/reset', { email: D, code: f.data.demoCode, password: 'newpass2' })).status, 400, 'a code works once');
    assert.equal((await srv.api('GET', '/api/auth/me', undefined, old)).status, 401, 'old sessions are revoked');
    assert.equal((await srv.api('POST', '/api/auth/signin', { email: D, password: 'donor123', role: 'donor' })).status, 401);
    const t = (await srv.api('POST', '/api/auth/signin', { email: D, password: 'newpass1', role: 'donor' })).data.token;
    assert.ok(t);
    assert.equal((await srv.api('POST', '/api/auth/password', { current: 'wrong', password: 'another1' }, t)).status, 400);
    assert.equal((await srv.api('POST', '/api/auth/password', { current: 'newpass1', password: 'another1' }, t)).status, 200);
    assert.equal((await srv.api('GET', '/api/auth/me', undefined, t)).status, 200, 'this device stays signed in');
    assert.equal((await srv.api('POST', '/api/auth/signin', { email: D, password: 'another1', role: 'donor' })).status, 200);
    assert.equal((await srv.api('POST', '/api/auth/password', { current: 'x', password: 'y12345' })).status, 401, 'must be signed in');
  } finally { await srv.stop(); try { fs.unlinkSync(file); } catch (e) { /* ignore */ } }
});

test('old requests expire, and "start empty" is respected after a restart', async () => {
  const { generateSeedData } = require('../src/seed/seedFaker');
  const { hashAllPasswords } = require('../src/utils/auth');
  const file = tmpDb('fresh');
  const data = generateSeedData(); hashAllPasswords(data);
  data.requests.unshift({ id: 'req-old-1', people: 1, phone: '', name: '', note: '', lat: 12.97, lng: 77.59, status: 'open', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() });
  fs.writeFileSync(file, JSON.stringify(data));
  let srv = await bootServer(PORT + 4, file, { DEMO_MODE: 'off' });
  try {
    assert.equal((await srv.api('GET', '/api/requests/req-old-1')).data.request.status, 'expired');
    const ngo = (await srv.api('POST', '/api/auth/signin', { email: 'ngo@campusfoodshare.org', password: 'ngo123', role: 'ngo' })).data.token;
    assert.ok(!(await srv.api('GET', '/api/requests', undefined, ngo)).data.requests.some((r) => r.id === 'req-old-1'), 'expired requests leave the queue');
    assert.equal((await srv.api('POST', '/api/requests/req-old-1/accept', {}, ngo)).status, 409);
    assert.equal((await srv.api('GET', '/api/meta')).data.demo, true);
    const adm = (await srv.api('POST', '/api/auth/signin', { email: 'admin@campusfoodshare.org', password: 'admin123', role: 'admin' })).data.token;
    assert.equal((await srv.api('POST', '/api/admin/start-fresh', {}, ngo)).status, 403);
    assert.equal((await srv.api('POST', '/api/admin/start-fresh', {}, adm)).status, 200);
    assert.equal((await srv.api('GET', '/api/listings?includeExpired=true')).data.count, 0);
    assert.equal((await srv.api('GET', '/api/meta')).data.demo, false);
    await srv.stop();
    srv = await bootServer(PORT + 4, file); // demo refresh is ON, but the data was deliberately emptied
    assert.equal((await srv.api('GET', '/api/listings?includeExpired=true')).data.count, 0, 'an emptied platform is not re-seeded');
    assert.equal((await srv.api('POST', '/api/auth/signin', { email: 'ngo@campusfoodshare.org', password: 'ngo123', role: 'ngo' })).status, 200, 'accounts are kept');
  } finally { await srv.stop(); try { fs.unlinkSync(file); } catch (e) { /* ignore */ } }
});

/* ---- public website: donate without an account ---- */
const guestDonation = (over = {}) => ({
  donorName: 'Sunrise Hostel Mess', phone: '+91 98450 12345', foodTitle: 'Vegetable pulao and raita', foodType: 'Veg', quantityMeals: 30,
  useBefore: new Date(Date.now() + 3 * 3600000).toISOString(), address: 'Hostel Block A, reception', notes: 'Packed in steel containers',
  safetyConfirmed: true, ...over,
});

test('anyone can donate from the website without an account, and validation protects the platform', async () => {
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ phone: 'abc' }))).status, 400, 'phone required');
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ safetyConfirmed: false }))).status, 400, 'safety confirmation required');
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ useBefore: new Date(Date.now() - 1000).toISOString() }))).status, 400, 'deadline in the past');
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ useBefore: new Date(Date.now() + 30 * 3600000).toISOString() }))).status, 400, 'deadline beyond 24 hours');
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ foodType: 'Soup' }))).status, 400, 'unknown food type');
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ address: '' }))).status, 400, 'pickup location required');
  const before = (await call('GET', '/api/listings?includeExpired=true')).data.count;
  assert.equal((await call('POST', '/api/public/donations', guestDonation({ website: 'http://spam.example' }))).status, 201, 'bots are told it worked');
  assert.equal((await call('GET', '/api/listings?includeExpired=true')).data.count, before, 'but nothing is created');

  const ok = await call('POST', '/api/public/donations', guestDonation());
  assert.equal(ok.status, 201);
  assert.ok(ok.data.id && ok.data.token);
  assert.equal(ok.data.approximateLocation, true, 'no coordinates means an approximate campus location');
  const feed = await call('GET', '/api/listings?status=posted');
  const mine = feed.data.listings.find((l) => l.id === ok.data.id);
  assert.ok(mine, 'the donation shows up for NGOs and volunteers');
  assert.equal(mine.donorId, 'guest');
  assert.ok(!JSON.stringify(feed.data).includes(ok.data.token), 'the tracking secret never appears in public feeds');
});

test('a guest donor can track the donation, receives the handover PIN, and can withdraw', async () => {
  const d = (await call('POST', '/api/public/donations', guestDonation({ foodTitle: 'Tracking test rice', lat: 12.97, lng: 77.59 }))).data;
  const track = (token) => call('GET', `/api/public/donations/${d.id}?token=${token}`);
  assert.equal((await track('wrong')).status, 404, 'wrong token');
  assert.equal((await call('GET', `/api/public/donations/${d.id}`)).status, 404, 'no token');
  const first = await track(d.token);
  assert.equal(first.status, 200);
  assert.equal(first.data.donation.status, 'posted');
  assert.equal(first.data.donation.handoverCode, null);

  const claim = await call('POST', `/api/listings/${d.id}/claim`, { ngoName: 'Robin Hood Army', volunteerName: 'Harsha S' }, tok.ngo);
  assert.equal(claim.status, 200);
  const pin = claim.data.listing.claimedBy.handoverCode;
  const claimed = (await track(d.token)).data.donation;
  assert.equal(claimed.status, 'claimed');
  assert.equal(claimed.claimedBy.ngoName, 'Robin Hood Army', 'the donor can see who is coming');
  assert.equal(claimed.handoverCode, pin, 'the donor gets the PIN to share at pickup');
  const publicView = (await call('GET', '/api/listings?status=claimed')).data.listings.find((l) => l.id === d.id);
  assert.equal(publicView.claimedBy.handoverCode, undefined, 'strangers never see the PIN');
  assert.equal((await call('POST', `/api/public/donations/${d.id}/withdraw`, { token: d.token })).status, 409, 'claimed food cannot be withdrawn');

  assert.equal((await call('POST', `/api/listings/${d.id}/collect`, { code: pin }, tok.ngo)).status, 200);
  assert.equal((await track(d.token)).data.donation.status, 'collected');

  const second = (await call('POST', '/api/public/donations', guestDonation({ foodTitle: 'Withdraw me' }))).data;
  assert.equal((await call('POST', `/api/public/donations/${second.id}/withdraw`, { token: 'nope' })).status, 404);
  assert.equal((await call('POST', `/api/public/donations/${second.id}/withdraw`, { token: second.token })).status, 200);
  assert.equal((await call('GET', `/api/public/donations/${second.id}?token=${second.token}`)).status, 404);
});

test('contact form reaches the admin inbox; impact numbers include partners', async () => {
  assert.equal((await call('POST', '/api/public/contact', { name: 'A', email: 'bad', message: 'short' })).status, 400);
  assert.equal((await call('POST', '/api/public/contact', { name: 'Spam', email: 'a@b.co', message: 'buy cheap things now please', website: 'x' })).status, 201);
  const sent = await call('POST', '/api/public/contact', { name: 'Asha Rao', email: 'asha@example.com', message: 'How do I register my hostel mess as a donor?' });
  assert.equal(sent.status, 201);
  assert.equal((await call('GET', '/api/admin/messages')).status, 401);
  assert.equal((await call('GET', '/api/admin/messages', undefined, tok.donor)).status, 403);
  const inbox = await call('GET', '/api/admin/messages', undefined, tok.admin);
  assert.equal(inbox.status, 200);
  assert.ok(inbox.data.messages.some((m) => m.email === 'asha@example.com'));
  assert.ok(!inbox.data.messages.some((m) => m.name === 'Spam'), 'bot messages are dropped');
  const msg = inbox.data.messages.find((m) => m.email === 'asha@example.com');
  assert.equal(msg.read, false);
  assert.equal((await call('PATCH', `/api/admin/messages/${msg.id}`, { read: true }, tok.admin)).status, 200);
  assert.equal((await call('GET', '/api/admin/messages', undefined, tok.admin)).data.messages.find((m) => m.id === msg.id).read, true);
  assert.equal((await call('PATCH', '/api/admin/messages/nope', { read: true }, tok.admin)).status, 404);
  const impact = (await call('GET', '/api/impact')).data.metrics;
  assert.ok(impact.partners >= 6, 'NGOs and volunteers are counted as community partners');
});

test('public forms are rate limited per device', async () => {
  const file = tmpDb('rate');
  const srv = await bootServer(PORT + 5, file, { DEMO_MODE: 'off' });
  try {
    let last;
    for (let i = 0; i < 6; i++) last = await srv.api('POST', '/api/public/donations', guestDonation({ foodTitle: `Rate test ${i}` }));
    assert.equal(last.status, 429);
    let c;
    for (let i = 0; i < 6; i++) c = await srv.api('POST', '/api/public/contact', { name: 'Tester', email: 'rate@example.com', message: 'This is a rate limit test message' });
    assert.equal(c.status, 429);
  } finally { await srv.stop(); try { fs.unlinkSync(file); } catch (e) { /* ignore */ } }
});
