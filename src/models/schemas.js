const USER_ROLES = { ADMIN: 'admin', DONOR: 'donor', NGO: 'ngo', VOLUNTEER: 'volunteer' };
const LISTING_STATUS = { POSTED: 'posted', CLAIMED: 'claimed', COLLECTED: 'collected', EXPIRED: 'expired' };
const FOOD_SAFETY_CHECKLIST = [
  { id: 'temp_control', label: 'Food was cooked within the last 4 hours and kept covered at safe temperature.' },
  { id: 'hygienic_containers', label: 'Food is packed in clean, food-grade containers with no cross-contamination.' },
  { id: 'no_spoilage', label: 'Sensory & AI freshness check passed (normal smell, appearance, and texture).' },
  { id: 'allergen_labeled', label: 'Dietary category (Veg / Non-Veg / Vegan / Bakery) and prep time are clearly labeled.' },
];

function validateListingPayload(body) {
  const errors = [];
  if (!body.donorName || String(body.donorName).trim() === '') errors.push('donorName is required');
  if (!body.foodTitle || String(body.foodTitle).trim() === '') errors.push('foodTitle is required');
  if (!body.foodType || !['Veg', 'Non-Veg', 'Vegan', 'Bakery'].includes(body.foodType)) errors.push('foodType must be Veg, Non-Veg, Vegan, or Bakery');
  if (!body.quantityMeals || Number(body.quantityMeals) <= 0) errors.push('quantityMeals must be positive');
  if (!body.useBefore || isNaN(new Date(body.useBefore).getTime())) errors.push('Valid useBefore timestamp is required');
  if (!body.location || typeof body.location.lat !== 'number' || typeof body.location.lng !== 'number') errors.push('Valid GPS coordinates required');
  if (!body.safetyChecklistConfirmed) errors.push('Donor must confirm the 4-point food-safety checklist');
  return errors;
}

module.exports = { USER_ROLES, LISTING_STATUS, FOOD_SAFETY_CHECKLIST, validateListingPayload };
