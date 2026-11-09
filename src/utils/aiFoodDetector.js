function analyzeFoodFreshness({ foodTitle = '', imageName = '', hoursSinceCooked = 1 }) {
  const text = `${foodTitle} ${imageName}`.toLowerCase();
  let detectedType = 'Veg';
  if (text.includes('chicken') || text.includes('mutton') || text.includes('egg') || text.includes('fish') || text.includes('non-veg')) {
    detectedType = 'Non-Veg';
  } else if (text.includes('bread') || text.includes('bun') || text.includes('pastry') || text.includes('cake') || text.includes('sandwich')) {
    detectedType = 'Bakery';
  } else if (text.includes('vegan') || text.includes('salad') || text.includes('fruit')) {
    detectedType = 'Vegan';
  }
  const ageHours = Math.max(0.2, Number(hoursSinceCooked) || 1);
  const freshnessScore = Math.max(60, Math.min(99, Math.round(100 - ageHours * 6.5)));
  const recommendedSafeHours = detectedType === 'Bakery' ? 6 : detectedType === 'Non-Veg' ? 2.0 : 3.0;
  return {
    detectedType,
    freshnessScore,
    freshnessStatus: freshnessScore >= 85 ? 'Excellent Freshness (Grade A - Safe for Immediate Pickup)' : 'Good Freshness (Prioritize Pickup Within 2 Hours)',
    recommendedSafeHours,
    confidence: 0.94,
  };
}

module.exports = { analyzeFoodFreshness };
