const { calculateHaversineDistance } = require('./haversine');

const KG_PER_MEAL = 0.35;
const ORG_TYPES = ['Ashram', 'Old-age home', 'Orphanage', 'Shelter', 'Community kitchen', 'Hostel', 'NGO'];
const DIETS = ['Veg', 'Non-Veg', 'Vegan', 'Bakery'];

const round1 = (n) => Math.round(n * 10) / 10;
const toMinutes = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const fmtTime = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'pm' : 'am'}`;
};

/** Is the organisation open at `now` (handles hours that run past midnight)? */
function isOpen(org, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const o = toMinutes(org.hours && org.hours.open), c = toMinutes(org.hours && org.hours.close);
  return c > o ? mins >= o && mins <= c : mins >= o || mins <= c;
}

/** Kilograms already received or committed to this organisation today (claimed, collected, or directed to it and still open). */
function receivedTodayKg(db, org, now = new Date()) {
  const day = now.toDateString();
  return round1((db.listings || []).reduce((sum, l) => {
    if (l.status === 'expired' || new Date(l.createdAt).toDateString() !== day) return sum;
    const mine = l.targetOrgId === org.id || (org.userId && l.claimedBy && l.claimedBy.userId === org.userId);
    return mine ? sum + Number(l.weightKg || 0) : sum;
  }, 0));
}

/** Organisation with live numbers added: what it still needs and can take today, and whether it is open. */
function describe(db, org, now = new Date()) {
  const received = receivedTodayKg(db, org, now);
  return {
    id: org.id, name: org.name, type: org.type, address: org.address, area: org.area, lat: org.lat, lng: org.lng, phone: org.phone,
    hours: org.hours, acceptsDiets: org.acceptsDiets, capacityKgPerDay: org.capacityKgPerDay, needsKgToday: org.needsKgToday,
    peopleServed: org.peopleServed, canPickup: Boolean(org.canPickup), notes: org.notes || '', verified: org.verified !== false,
    updatedAt: org.updatedAt,
    receivedTodayKg: received,
    capacityLeftKg: Math.max(0, round1(org.capacityKgPerDay - received)),
    needLeftKg: Math.max(0, round1(org.needsKgToday - received)),
    openNow: isOpen(org, now),
  };
}

/**
 * Rank organisations for a donation of `kg` kilograms of `foodType` from (lat, lng).
 * Score (0-100) = 40% how much of the food it can take + 25% closeness + 20% how much it still needs today + 15% open now.
 * Also builds a split plan when no single organisation can take everything.
 */
function match(db, { kg, foodType, lat, lng, orgType, now = new Date() }) {
  const amount = Number(kg);
  const results = (db.organizations || []).filter((o) => o.active !== false && (!orgType || o.type === orgType)).map((o) => {
    const org = describe(db, o, now);
    const distanceKm = Number(calculateHaversineDistance(lat, lng, o.lat, o.lng));
    const dietOk = !foodType || org.acceptsDiets.includes(foodType);
    const canTakeKg = Math.min(amount, org.capacityLeftKg);
    const fit = amount > 0 ? canTakeKg / amount : 0;
    const closeness = 1 / (1 + distanceKm / 3);
    const need = org.needLeftKg > 0 ? Math.min(1, org.needLeftKg / amount) : 0;
    const open = org.openNow ? 1 : 0.4;
    const score = dietOk ? Math.round(100 * (0.4 * fit + 0.25 * closeness + 0.2 * need + 0.15 * open)) : 0;
    const reasons = [];
    const warnings = [];
    if (!dietOk) warnings.push(`Does not accept ${foodType} food`);
    else {
      reasons.push(canTakeKg >= amount ? `Can take all ${round1(amount)} kg` : `Can take ${round1(canTakeKg)} kg of your ${round1(amount)} kg`);
      reasons.push(`${distanceKm.toFixed(1)} km away`);
      reasons.push(org.needLeftKg > 0 ? `Still needs about ${org.needLeftKg} kg today` : 'No urgent need left today');
      if (org.openNow) reasons.push(`Open now until ${fmtTime(org.hours.close)}`);
      else warnings.push(`Closed now. Opens at ${fmtTime(org.hours.open)}`);
      reasons.push(org.canPickup ? 'Can send a volunteer to collect' : 'You need to drop it off');
    }
    if (dietOk && canTakeKg <= 0) warnings.push('Daily capacity is already full');
    return { organization: org, distanceKm: Number(distanceKm.toFixed(2)), canTakeKg: round1(canTakeKg), takesAll: canTakeKg >= amount, dietOk, openNow: org.openNow, score, reasons, warnings };
  });

  const matches = results.filter((r) => r.dietOk && r.canTakeKg > 0).sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
  const excluded = results.filter((r) => !r.dietOk).map((r) => ({ organization: { id: r.organization.id, name: r.organization.name, type: r.organization.type }, reason: r.warnings[0] }));

  // If no single organisation can take it all, split it across the best ones.
  const plan = [];
  let remaining = amount;
  if (!matches.some((m) => m.takesAll)) {
    for (const m of matches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, m.canTakeKg);
      if (take > 0) { plan.push({ organizationId: m.organization.id, name: m.organization.name, kg: round1(take), distanceKm: m.distanceKm }); remaining -= take; }
    }
  }
  const leftoverKg = plan.length ? round1(Math.max(0, remaining)) : 0;

  let summary;
  if (!matches.length) summary = 'No organisation nearby can take this right now. You can still post it and let any team claim it.';
  else if (matches[0].takesAll) summary = `${matches[0].organization.name} can take all ${round1(amount)} kg (${matches[0].distanceKm} km away).`;
  else summary = `${round1(amount)} kg is more than one place can take today. Suggested split: ${plan.map((p) => `${p.kg} kg to ${p.name}`).join(', ')}${leftoverKg ? `, leaving ${leftoverKg} kg unplaced` : ''}.`;

  return { request: { kg: round1(amount), meals: Math.round(amount / KG_PER_MEAL), foodType: foodType || null, orgType: orgType || null, lat, lng }, summary, matches, plan, leftoverKg, excluded };
}

/** Validate and normalise an organisation's requirements profile. Returns { errors, value }. */
function validateOrganization(b) {
  const errors = [];
  const v = {};
  const text = (k, label, min, max) => { const s = String(b[k] ?? '').trim(); if (s.length < min || s.length > max) errors.push(`${label} must be ${min}-${max} characters`); v[k] = s; };
  text('name', 'Name', 3, 80); text('address', 'Address', 3, 140); text('area', 'Area', 0, 60); text('notes', 'Notes', 0, 300);
  if (!ORG_TYPES.includes(b.type)) errors.push(`Type must be one of ${ORG_TYPES.join(', ')}`); v.type = b.type;
  const phone = String(b.phone || '').trim();
  if (!/^[0-9+() -]{7,20}$/.test(phone)) errors.push('A valid phone number is required'); v.phone = phone;
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) errors.push('A valid location (latitude and longitude) is required');
  v.lat = lat; v.lng = lng;
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  const hours = b.hours || {};
  if (!hhmm.test(hours.open || '') || !hhmm.test(hours.close || '')) errors.push('Opening and closing times must look like 06:00');
  v.hours = { open: hours.open, close: hours.close };
  const diets = Array.isArray(b.acceptsDiets) ? b.acceptsDiets.filter((d) => DIETS.includes(d)) : [];
  if (!diets.length) errors.push('Choose at least one kind of food you accept'); v.acceptsDiets = [...new Set(diets)];
  const cap = Number(b.capacityKgPerDay), need = Number(b.needsKgToday), served = Number(b.peopleServed || 0);
  if (!(cap >= 1 && cap <= 5000)) errors.push('Daily capacity must be between 1 and 5000 kg');
  if (!(need >= 0 && need <= 5000)) errors.push("Today's requirement must be between 0 and 5000 kg");
  if (!(served >= 0 && served <= 100000)) errors.push('People served must be 0 or more');
  v.capacityKgPerDay = cap; v.needsKgToday = need; v.peopleServed = Math.round(served); v.canPickup = b.canPickup === true || b.canPickup === 'true';
  return { errors, value: v };
}

module.exports = { KG_PER_MEAL, ORG_TYPES, DIETS, isOpen, receivedTodayKg, describe, match, validateOrganization };
