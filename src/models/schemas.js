/**
 * src/models/schemas.js
 * Defines data models (Donors, NGOs, Listings, Claims) and the Listing Life Cycle
 * (posted -> claimed -> collected -> expired), plus the Donor Food-Safety Checklist.
 */

const LISTING_STATUS = {
  POSTED: 'posted',
  CLAIMED: 'claimed',
  COLLECTED: 'collected',
  EXPIRED: 'expired',
};

const FOOD_SAFETY_CHECKLIST = [
  {
    id: 'temp_control',
    label: 'Food was cooked within the last 4 hours and kept covered at safe temperature.',
  },
  {
    id: 'hygienic_containers',
    label: 'Food is packed in clean, food-grade containers with no cross-contamination.',
  },
  {
    id: 'no_spoilage',
    label: 'Sensory check passed (normal smell, appearance, and texture; no spoilage signs).',
  },
  {
    id: 'allergen_labeled',
    label: 'Dietary category (Veg / Non-Veg / Allergens) and preparation time are clearly noted.',
  },
];

function validateListingPayload(body) {
  const errors = [];
  if (!body.donorName || String(body.donorName).trim() === '') {
    errors.push('donorName is required');
  }
  if (!body.foodTitle || String(body.foodTitle).trim() === '') {
    errors.push('foodTitle is required');
  }
  if (!body.foodType || !['Veg', 'Non-Veg', 'Vegan', 'Bakery'].includes(body.foodType)) {
    errors.push('foodType must be one of Veg, Non-Veg, Vegan, Bakery');
  }
  if (!body.quantityMeals || Number(body.quantityMeals) <= 0) {
    errors.push('quantityMeals must be a positive number');
  }
  if (!body.useBefore || isNaN(new Date(body.useBefore).getTime())) {
    errors.push('Valid useBefore timestamp is required');
  }
  if (
    !body.location ||
    typeof body.location.lat !== 'number' ||
    typeof body.location.lng !== 'number'
  ) {
    errors.push('location with numeric lat and lng is required');
  }
  if (!body.safetyChecklistConfirmed) {
    errors.push('Donor must confirm the food-safety checklist before posting');
  }
  return errors;
}

module.exports = {
  LISTING_STATUS,
  FOOD_SAFETY_CHECKLIST,
  validateListingPayload,
};
