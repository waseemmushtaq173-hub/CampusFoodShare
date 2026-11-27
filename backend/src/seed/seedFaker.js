const fs = require('fs');
const path = require('path');
const { DB_FILE_PATH } = require('../storage/db');

const H = 3600 * 1000;
const D = 24 * H;

/** Believable demo data: five Bengaluru areas, a week of history, several donors / NGOs / volunteers. */
function generateSeedData() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();

  const users = [
    { id: 'usr-admin-1', name: 'Waseem Mushtaq Mir', email: 'admin@campusfoodshare.org', password: 'admin123', role: 'admin', organization: 'CampusFoodShare Operations', phone: '+91 60065 61291' },
    { id: 'usr-donor-1', name: 'Ramesh Kulkarni', email: 'donor@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'Block-A Boys Hostel Mess', phone: '+91 98450 11223' },
    { id: 'usr-donor-2', name: 'Meera Iyer', email: 'meera@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'Central Engineering Canteen', phone: '+91 98450 44556' },
    { id: 'usr-donor-3', name: 'Arjun Rao', email: 'arjun@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'Girls Hostel Mess, Block-C', phone: '+91 98450 99001' },
    { id: 'usr-donor-4', name: 'Farah Khan', email: 'farah@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'South Campus Food Court', phone: '+91 98450 77889' },
    { id: 'usr-donor-5', name: 'Naveen Prasad', email: 'naveen@campusfoodshare.org', password: 'donor123', role: 'donor', organization: 'Tech Symposium Catering Committee', phone: '+91 98450 22110' },
    { id: 'usr-ngo-1', name: 'Sneha Nair', email: 'ngo@campusfoodshare.org', password: 'ngo123', role: 'ngo', organization: 'Robin Hood Army, Campus Chapter', phone: '+91 99001 22334' },
    { id: 'usr-ngo-2', name: 'Imran Sheikh', email: 'imran@campusfoodshare.org', password: 'ngo123', role: 'ngo', organization: 'Akshaya Seva Trust & Shelter', phone: '+91 99001 55667' },
    { id: 'usr-ngo-3', name: 'Lakshmi Devi', email: 'lakshmi@campusfoodshare.org', password: 'ngo123', role: 'ngo', organization: 'Annapurna Community Kitchen', phone: '+91 99001 88990' },
    { id: 'usr-vol-1', name: 'Harsha S', email: 'volunteer@campusfoodshare.org', password: 'vol123', role: 'volunteer', organization: 'Campus NSS Volunteer Wing', phone: '+91 99001 44556' },
    { id: 'usr-vol-2', name: 'Mohammed Irfan', email: 'irfan@campusfoodshare.org', password: 'vol123', role: 'volunteer', organization: 'Akshaya Seva Trust & Shelter', phone: '+91 99001 66778' },
    { id: 'usr-vol-3', name: 'Priya Menon', email: 'priya@campusfoodshare.org', password: 'vol123', role: 'volunteer', organization: 'Annapurna Community Kitchen', phone: '+91 99001 33445' },
  ].map((u, i) => ({ ...u, verified: true, createdAt: iso(now - (30 - i) * D) }));

  const CL = { central: [12.9716, 77.5946], south: [12.9128, 77.5618], north: [13.0358, 77.597], east: [12.9784, 77.6408], west: [12.9352, 77.5365] };
  const donor = { d1: users[1], d2: users[2], d3: users[3], d4: users[4], d5: users[5] };
  const ngo = { n1: users[6], n2: users[7], n3: users[8] };
  const vol = { 'Harsha S': users[9], 'Mohammed Irfan': users[10], 'Priya Menon': users[11] };
  const place = (c, dLat, dLng) => ({ lat: Number((CL[c][0] + dLat).toFixed(5)), lng: Number((CL[c][1] + dLng).toFixed(5)) });
  let seq = 100;
  const CHECK = ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'];

  function listing(o) {
    const id = `lst-${++seq}`;
    const d = donor[o.d];
    const created = now - o.postedAgoH * H;
    const l = {
      id, donorId: d.id, donorName: d.organization, donorPhone: d.phone, foodTitle: o.title, foodType: o.type,
      quantityMeals: o.meals, weightKg: Number((o.meals * 0.35).toFixed(1)),
      aiFreshnessScore: o.fresh || 94, aiFreshnessStatus: 'Excellent Freshness (Grade A)',
      preparedAt: iso(created - 0.5 * H), useBefore: iso(now + o.expiresInH * H), status: o.status, safetyChecklistConfirmed: true, checklistItems: CHECK,
      location: { address: o.addr, ...place(o.c, o.dLat, o.dLng) }, claimedBy: null, feedback: null, createdAt: iso(created),
    };
    if (o.claim) {
      const n = ngo[o.claim.n];
      l.claimedBy = {
        userId: n.id, ngoName: n.organization, volunteerName: o.claim.vol, volunteerPhone: vol[o.claim.vol].phone,
        claimedAt: iso(now - o.claim.claimedAgoH * H), collectedAt: o.claim.collectedAgoH != null ? iso(now - o.claim.collectedAgoH * H) : null,
      };
      if (o.status === 'claimed') { l.claimedBy.handoverCode = o.claim.pin; l.claimedBy.sim = true; }
    }
    if (o.rating) l.feedback = { id: `fb-${seq}`, rating: o.rating, comment: o.comment, ratedBy: l.claimedBy.ngoName, createdAt: l.claimedBy.collectedAt };
    return l;
  }

  const listings = [];
  // ---- available right now (spread over five areas) ----
  const open = [
    ['d1', 'Steamed Rice, Dal Tadka & Mixed Veg Curry', 'Veg', 65, 'central', 0.0022, -0.0011, 'Block-A Hostel Mess, loading bay', 1.0, 2.3, 96],
    ['d2', 'Vegetable Pulao, Raita & Chapati Packs', 'Veg', 45, 'central', -0.0018, 0.0022, 'Central Canteen, rear entrance', 0.8, 1.3, 92],
    ['d3', 'Poha, Upma & Filter Coffee Flasks', 'Veg', 42, 'central', 0.0031, 0.0027, 'Girls Hostel Mess, side gate', 0.3, 3.8, 97],
    ['d4', 'Lemon Rice, Curd Rice & Pickle Packets', 'Veg', 40, 'south', 0.0014, 0.0009, 'South Campus Food Court, Gate 2', 0.6, 2.6, 95],
    ['d4', 'Veg Sandwich & Fruit Salad Boxes', 'Vegan', 30, 'south', -0.0021, -0.0016, 'South Campus Food Court, counter 4', 0.4, 3.2, 96],
    ['d3', 'Idli, Sambar & Coconut Chutney', 'Veg', 55, 'south', 0.0035, -0.003, 'Hostel Block-C Mess, main gate', 0.9, 1.8, 93],
    ['d5', 'Chicken Biryani & Raita Trays', 'Non-Veg', 70, 'north', 0.0019, 0.0012, 'Seminar Hall, service entrance', 1.2, 1.9, 94],
    ['d2', 'Bread Loaves, Buns & Veg Puff Packs', 'Bakery', 36, 'east', 0.001, -0.0014, 'Canteen Annexe, east campus', 0.5, 5.0, 91],
    ['d1', 'Chapati, Paneer Sabzi & Jeera Rice', 'Veg', 48, 'west', -0.0012, 0.0016, 'West Block Mess, main gate', 0.7, 2.0, 95],
  ];
  open.forEach(([d, title, type, meals, c, dLat, dLng, addr, postedAgoH, expiresInH, fresh]) =>
    listings.push(listing({ d, title, type, meals, c, dLat, dLng, addr, postedAgoH, expiresInH, fresh, status: 'posted' })));

  // ---- claimed, volunteers on the way ----
  listings.push(listing({ d: 'd5', title: 'Paneer Biryani & Assorted Sandwich Trays', type: 'Veg', meals: 90, c: 'central', dLat: 0.0036, dLng: 0.0045, addr: 'Main Auditorium, VIP gate', postedAgoH: 1.1, expiresInH: 2.4, status: 'claimed', claim: { n: 'n1', vol: 'Harsha S', claimedAgoH: 0.4, pin: '4821' }, fresh: 96 }));
  listings.push(listing({ d: 'd4', title: 'Rajma Chawal & Salad Boxes', type: 'Veg', meals: 50, c: 'south', dLat: -0.0006, dLng: 0.0024, addr: 'South Campus Food Court, Gate 1', postedAgoH: 0.7, expiresInH: 2.8, status: 'claimed', claim: { n: 'n3', vol: 'Priya Menon', claimedAgoH: 0.2, pin: '7305' }, fresh: 95 }));

  // ---- a week of rescued meals ----
  const hist = [
    [0, 3.2, 'd1', 'Idli, Vada & Sambar Containers', 'Veg', 80, 'central', 'n2', 'Mohammed Irfan', 5, 'Hygienically packed and still warm when we arrived.'],
    [0, 6.5, 'd2', 'Veg Fried Rice & Gobi Manchurian', 'Veg', 60, 'central', 'n1', 'Harsha S', 4, 'Good quantity, clearly labelled.'],
    [1, 2.0, 'd3', 'Dosa, Sambar & Chutney', 'Veg', 70, 'south', 'n3', 'Priya Menon', 5, 'Fresh and well packed. Distributed within the hour.'],
    [1, 5.5, 'd4', 'Pasta & Garlic Bread Boxes', 'Veg', 45, 'south', 'n3', 'Priya Menon', 4, 'Boxes were clean, a little cold but fine.'],
    [2, 1.5, 'd5', 'Veg Biryani & Raita', 'Veg', 85, 'north', 'n2', 'Mohammed Irfan', 5, 'Excellent. Fed two shelters from this.'],
    [2, 7.0, 'd1', 'Roti, Dal & Aloo Gobi', 'Veg', 75, 'central', 'n1', 'Harsha S', 5, 'Smooth pickup, donor was ready on time.'],
    [2, 9.0, 'd4', 'Fruit Salad & Sandwiches', 'Vegan', 38, 'south', 'n1', 'Harsha S', 5, 'Loved by the children.'],
    [3, 2.5, 'd2', 'Egg Curry & Rice', 'Non-Veg', 40, 'east', 'n2', 'Mohammed Irfan', 4, 'Hot and tasty.'],
    [3, 6.0, 'd3', 'Upma & Banana', 'Veg', 50, 'south', 'n3', 'Priya Menon', 5, 'Great breakfast for the morning shelter.'],
    [4, 3.0, 'd4', 'Bakery Assortment Packs', 'Bakery', 60, 'south', 'n1', 'Harsha S', 4, 'Fresh bread, well wrapped.'],
    [4, 7.5, 'd5', 'Fried Rice & Manchurian', 'Veg', 55, 'north', 'n2', 'Mohammed Irfan', 5, 'On time and well packed.'],
    [5, 2.2, 'd1', 'Sambar Rice & Papad', 'Veg', 65, 'central', 'n1', 'Harsha S', 5, 'Perfect portions.'],
    [5, 6.8, 'd2', 'Chicken Curry & Chapati', 'Non-Veg', 48, 'east', 'n3', 'Priya Menon', 4, 'Good, container could be sturdier.'],
    [6, 2.8, 'd3', 'Poori Bhaji', 'Veg', 58, 'south', 'n2', 'Mohammed Irfan', 5, 'Everyone enjoyed it.'],
    [6, 5.2, 'd4', 'Vegan Buddha Bowls', 'Vegan', 35, 'south', 'n3', 'Priya Menon', 5, 'Creative and healthy.'],
    [6, 8.4, 'd1', 'Curd Rice & Lemon Rice', 'Veg', 52, 'central', 'n1', 'Harsha S', 4, 'Good, picked up quickly.'],
  ];
  hist.forEach(([daysAgo, hrs, d, title, type, meals, c, n, v, rating, comment], i) => {
    const collectedAgo = daysAgo * 24 + hrs;
    listings.push(listing({
      d, title, type, meals, c, dLat: ((i % 5) - 2) * 0.0011, dLng: ((i % 3) - 1) * 0.0014, addr: `${donor[d].organization}, pickup point`,
      postedAgoH: collectedAgo + 2.3, expiresInH: -(collectedAgo - 0.7), status: 'collected',
      claim: { n, vol: v, claimedAgoH: collectedAgo + 0.8, collectedAgoH: collectedAgo }, rating, comment,
    }));
  });

  // ---- food that expired before anyone could collect it ----
  [[1, 'd2', 'Leftover Chapati Packs', 'Veg', 30, 'east'], [3, 'd5', 'Samosa & Tea Snacks', 'Bakery', 25, 'north'], [5, 'd3', 'Pav Bhaji', 'Veg', 40, 'west']].forEach(([daysAgo, d, title, type, meals, c]) =>
    listings.push(listing({ d, title, type, meals, c, dLat: 0.001, dLng: -0.001, addr: `${donor[d].organization}, pickup point`, postedAgoH: daysAgo * 24 + 4, expiresInH: -(daysAgo * 24 + 1), status: 'expired' })));

  listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ---- activity feed ----
  const notifications = [];
  const push = (type, title, message, agoMs) => notifications.push({ id: `ntf-${notifications.length + 1}`, type, title, message, channel: 'In-app', createdAt: iso(now - agoMs) });
  push('CLAIMED', 'Listing Claimed for Pickup', 'Annapurna Community Kitchen (volunteer Priya Menon) claimed "Rajma Chawal & Salad Boxes".', 0.2 * H);
  push('CLAIMED', 'Listing Claimed for Pickup', 'Robin Hood Army, Campus Chapter (volunteer Harsha S) claimed "Paneer Biryani & Assorted Sandwich Trays".', 0.4 * H);
  push('NEW_LISTING', 'New Surplus Food Posted', 'Girls Hostel Mess, Block-C posted 42 Veg meals ("Poha, Upma & Filter Coffee Flasks").', 0.3 * H);
  push('NEW_LISTING', 'New Surplus Food Posted', 'South Campus Food Court posted 30 Vegan meals ("Veg Sandwich & Fruit Salad Boxes").', 0.4 * H);
  push('FOOD_REQUEST', 'Someone needs food', '2 people need food near 12.970, 77.597.', 0.15 * H);
  push('COLLECTED', 'Food Rescued & Collected', '80 meals ("Idli, Vada & Sambar Containers") collected by Akshaya Seva Trust & Shelter.', 3.2 * H);
  push('COLLECTED', 'Food Rescued & Collected', '60 meals ("Veg Fried Rice & Gobi Manchurian") collected by Robin Hood Army, Campus Chapter.', 6.5 * H);
  push('EXPIRY_AUTO_SWEEP', 'Listing Auto-Expired', '"Leftover Chapati Packs" from Central Engineering Canteen passed its use-before time.', 22 * H);

  // ---- people asking for food ----
  const requests = [
    { id: 'req-seed-1', people: 4, phone: '+91 90000 41234', name: '', note: '', lat: 12.9142, lng: 77.5601, status: 'open', createdAt: iso(now - 22 * 60000) },
    { id: 'req-seed-2', people: 2, phone: '', name: '', note: '', lat: 12.9701, lng: 77.597, status: 'open', createdAt: iso(now - 9 * 60000) },
    { id: 'req-seed-3', people: 3, phone: '+91 90000 77812', name: '', note: '', lat: 13.0349, lng: 77.5988, status: 'accepted', createdAt: iso(now - 30 * 60000), acceptedAt: iso(now - 15 * 60000), acceptedBy: { name: 'Mohammed Irfan', org: 'Akshaya Seva Trust & Shelter', phone: '+91 99001 66778' } },
    { id: 'req-seed-4', people: 5, phone: '', name: '', note: '', lat: 12.9784, lng: 77.6401, status: 'helped', createdAt: iso(now - 26 * H), acceptedAt: iso(now - 25.6 * H), helpedAt: iso(now - 25 * H), helpedBy: 'Priya Menon', acceptedBy: { name: 'Priya Menon', org: 'Annapurna Community Kitchen', phone: '+91 99001 33445' } },
    { id: 'req-seed-5', people: 2, phone: '', name: '', note: '', lat: 12.9352, lng: 77.5361, status: 'helped', createdAt: iso(now - 50 * H), acceptedAt: iso(now - 49.5 * H), helpedAt: iso(now - 49 * H), helpedBy: 'Harsha S', acceptedBy: { name: 'Harsha S', org: 'Campus NSS Volunteer Wing', phone: '+91 99001 44556' } },
  ];

  // ---- helplines and community kitchens (demo numbers) ----
  const directory = [
    { name: 'Annapurna Community Kitchen', area: 'Jayanagar', phone: '+91 80000 12001', hours: 'Daily, 7 am to 9 pm' },
    { name: 'Akshaya Seva Trust & Shelter', area: 'Basavanagudi', phone: '+91 80000 12002', hours: 'Daily, 6 am to 10 pm' },
    { name: 'Robin Hood Army, Campus Chapter', area: 'Central Campus', phone: '+91 80000 12003', hours: 'Mon to Sat, 8 am to 8 pm' },
    { name: 'City Hunger Helpline (demo)', area: 'All areas', phone: '+91 80000 12004', hours: '24 hours' },
  ];

  return { meta: { demo: true, seededAt: iso(now) }, users, donors: [], ngos: [], listings, claims: [], notifications, feedbacks: [], requests, directory };
}

if (require.main === module) {
  const data = generateSeedData();
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Seeded CampusFoodShare database at:', DB_FILE_PATH);
}

module.exports = { generateSeedData };
