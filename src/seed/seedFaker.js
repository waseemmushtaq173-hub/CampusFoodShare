const fs = require('fs');
const path = require('path');
const { DB_FILE_PATH } = require('../storage/db');

function generateSeedData() {
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const users = [
    { id: 'usr-admin-1', name: 'Waseem Mushtaq Mir (Admin)', email: 'admin@campusfoodshare.org', password: 'admin123', role: 'admin', organization: 'CampusFoodShare CSE Control Center', phone: '+91 60065 61291', verified: true },
    { id: 'usr-donor-1', name: 'Ramesh Kulkarni (Mess Warden)', email: 'donor@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'Block-A Boys Hostel Mess', phone: '+91 98450 11223', verified: true },
    { id: 'usr-ngo-1', name: 'Sneha Nair (NGO Coordinator)', email: 'ngo@campusfoodshare.org', password: 'ngo123', role: 'ngo', organization: 'Robin Hood Army - Campus Chapter', phone: '+91 99001 22334', verified: true },
    { id: 'usr-vol-1', name: 'Harsha S (Lead Volunteer)', email: 'volunteer@campusfoodshare.org', password: 'vol123', role: 'volunteer', organization: 'Campus NSS & Robin Hood Volunteer Wing', phone: '+91 99001 44556', verified: true }
  ];
  const listings = [
    {
      id: 'lst-101', donorId: 'usr-donor-1', donorName: 'Block-A Boys Hostel Mess', donorPhone: '+91 98450 11223',
      foodTitle: 'Steamed Rice, Dal Tadka & Mixed Veg Curry', foodType: 'Veg', quantityMeals: 65, weightKg: 22.5,
      aiFreshnessScore: 95, aiFreshnessStatus: 'Excellent Freshness (Grade A)',
      preparedAt: new Date(now - 1.2 * hourMs).toISOString(), useBefore: new Date(now + 2.3 * hourMs).toISOString(),
      status: 'posted', safetyChecklistConfirmed: true,
      checklistItems: ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'],
      location: { address: 'Block-A Hostel Mess Loading Bay', lat: 12.9738, lng: 77.5935 },
      claimedBy: null, feedback: null, createdAt: new Date(now - 1.0 * hourMs).toISOString()
    },
    {
      id: 'lst-102', donorId: 'donor-2', donorName: 'Central Engineering Canteen', donorPhone: '+91 98450 44556',
      foodTitle: 'Vegetable Pulao, Raita & Chapati Packs', foodType: 'Veg', quantityMeals: 45, weightKg: 15.8,
      aiFreshnessScore: 92, aiFreshnessStatus: 'Excellent Freshness (Grade A)',
      preparedAt: new Date(now - 1.8 * hourMs).toISOString(), useBefore: new Date(now + 1.2 * hourMs).toISOString(),
      status: 'posted', safetyChecklistConfirmed: true,
      checklistItems: ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'],
      location: { address: 'Central Canteen Rear Entrance', lat: 12.9698, lng: 77.5968 },
      claimedBy: null, feedback: null, createdAt: new Date(now - 0.8 * hourMs).toISOString()
    },
    {
      id: 'lst-103', donorId: 'donor-3', donorName: 'IEEE Annual Tech Symposium Catering', donorPhone: '+91 98450 77889',
      foodTitle: 'Paneer Biryani & Assorted Sandwich Trays', foodType: 'Veg', quantityMeals: 90, weightKg: 31.5,
      aiFreshnessScore: 96, aiFreshnessStatus: 'Excellent Freshness (Grade A)',
      preparedAt: new Date(now - 2.0 * hourMs).toISOString(), useBefore: new Date(now + 3.0 * hourMs).toISOString(),
      status: 'claimed', safetyChecklistConfirmed: true,
      checklistItems: ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'],
      location: { address: 'Main Auditorium VIP Gate', lat: 12.9752, lng: 77.5991 },
      claimedBy: { userId: 'usr-ngo-1', handoverCode: '4821', ngoName: 'Robin Hood Army - Campus Chapter', volunteerName: 'Harsha S', volunteerPhone: '+91 99001 44556', claimedAt: new Date(now - 0.3 * hourMs).toISOString(), collectedAt: null },
      feedback: null, createdAt: new Date(now - 1.2 * hourMs).toISOString()
    },
    {
      id: 'lst-104', donorId: 'usr-donor-1', donorName: 'Girls Hostel Mess Block-C', donorPhone: '+91 98450 99001',
      foodTitle: 'Idli, Vada & Sambar Containers', foodType: 'Veg', quantityMeals: 80, weightKg: 28.0,
      aiFreshnessScore: 94, aiFreshnessStatus: 'Excellent Freshness (Grade A)',
      preparedAt: new Date(now - 6.0 * hourMs).toISOString(), useBefore: new Date(now - 1.0 * hourMs).toISOString(),
      status: 'collected', safetyChecklistConfirmed: true,
      checklistItems: ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'],
      location: { address: 'Girls Hostel Block-C Gate', lat: 12.9682, lng: 77.5918 },
      claimedBy: { userId: 'usr-ngo-1', ngoName: 'Akshaya Seva Trust & Shelter', volunteerName: 'Mohammed Irfan', volunteerPhone: '+91 99001 55667', claimedAt: new Date(now - 3.5 * hourMs).toISOString(), collectedAt: new Date(now - 2.8 * hourMs).toISOString() },
      feedback: { rating: 5, comment: 'Hygienically packed and still warm upon pickup.', ratedBy: 'Akshaya Seva Trust & Shelter' },
      createdAt: new Date(now - 5.0 * hourMs).toISOString()
    }
  ];
  const notifications = [
    { id: 'ntf-1', type: 'NEW_LISTING', title: 'Surplus Alert Broadcasted', message: 'Block-A Boys Hostel Mess posted 65 Veg meals.', channel: 'In-App + SMS/Telegram Alert', createdAt: new Date(now - 0.9 * hourMs).toISOString() },
    { id: 'ntf-2', type: 'CLAIMED', title: 'NGO Claimed Listing #lst-103', message: 'Robin Hood Army (Volunteer: Harsha S) claimed 90 meals.', channel: 'In-App + SMS/Telegram Alert', createdAt: new Date(now - 0.3 * hourMs).toISOString() }
  ];
  return { users, donors: [], ngos: [], listings, claims: [], notifications, feedbacks: [] };
}

if (require.main === module) {
  const data = generateSeedData();
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Seeded CampusFoodShare database at:', DB_FILE_PATH);
}

module.exports = { generateSeedData };
