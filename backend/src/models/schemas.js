const USER_ROLES = { ADMIN: 'admin', DONOR: 'donor', NGO: 'ngo', VOLUNTEER: 'volunteer' };
const SIGNUP_ROLES = [USER_ROLES.DONOR, USER_ROLES.NGO, USER_ROLES.VOLUNTEER];
const LISTING_STATUS = { POSTED: 'posted', CLAIMED: 'claimed', COLLECTED: 'collected', EXPIRED: 'expired' };
const FOOD_TYPES = ['Veg', 'Non-Veg', 'Vegan', 'Bakery'];
const FOOD_SAFETY_CHECKLIST = [
  { id: 'temp_control', label: 'Food was cooked within the last 4 hours and kept covered at safe temperature.' },
  { id: 'hygienic_containers', label: 'Food is packed in clean, food-grade containers with no cross-contamination.' },
  { id: 'no_spoilage', label: 'Sensory & AI freshness check passed (normal smell, appearance, and texture).' },
  { id: 'allergen_labeled', label: 'Dietary category (Veg / Non-Veg / Vegan / Bakery) and prep time are clearly labeled.' },
];

function validateListingPayload(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Request body is required'];
  if (!body.donorName || String(body.donorName).trim() === '') errors.push('donorName is required');
  if (!body.foodTitle || String(body.foodTitle).trim() === '') errors.push('foodTitle is required');
  else if (String(body.foodTitle).length > 140) errors.push('foodTitle must be 140 characters or fewer');
  if (!FOOD_TYPES.includes(body.foodType)) errors.push('foodType must be Veg, Non-Veg, Vegan, or Bakery');
  const qty = Number(body.quantityMeals);
  if (!qty || qty <= 0 || qty > 5000) errors.push('quantityMeals must be between 1 and 5000');
  const expiry = new Date(body.useBefore).getTime();
  if (!body.useBefore || isNaN(expiry)) errors.push('Valid useBefore timestamp is required');
  else if (expiry <= Date.now()) errors.push('useBefore must be in the future');
  const loc = body.location;
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number' || isNaN(loc.lat) || isNaN(loc.lng)) {
    errors.push('Valid GPS coordinates required');
  } else if (Math.abs(loc.lat) > 90 || Math.abs(loc.lng) > 180) {
    errors.push('GPS coordinates are out of range');
  }
  const items = Array.isArray(body.checklistItems) ? body.checklistItems : [];
  const missing = FOOD_SAFETY_CHECKLIST.filter((c) => !items.includes(c.id));
  if (!body.safetyChecklistConfirmed || missing.length > 0) errors.push('Donor must confirm all 4 food-safety checklist items');
  return errors;
}

module.exports = { USER_ROLES, SIGNUP_ROLES, LISTING_STATUS, FOOD_TYPES, FOOD_SAFETY_CHECKLIST, validateListingPayload };
