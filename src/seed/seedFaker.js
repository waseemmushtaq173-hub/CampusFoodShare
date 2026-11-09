/**
 * src/seed/seedFaker.js
 * Generates realistic dummy data for CampusFoodShare using @faker-js/faker
 * (or built-in deterministic campus presets if run without faker).
 */

const fs = require('fs');
const path = require('path');
const { DB_FILE_PATH } = require('../storage/db');

function generateSeedData() {
  const now = Date.now();
  const hourMs = 3600 * 1000;

  const donors = [
    {
      id: 'donor-1',
      name: 'Block-A Boys Hostel Mess',
      organizationType: 'Hostel Mess',
      contactPerson: 'Ramesh Kulkarni',
      phone: '+91 98450 11223',
      location: {
        address: 'Main Campus North Gate, Bengaluru',
        lat: 12.9738,
        lng: 77.5935,
      },
    },
    {
      id: 'donor-2',
      name: 'Central Engineering Canteen',
      organizationType: 'Campus Canteen',
      contactPerson: 'Annapurna Devi',
      phone: '+91 98450 44556',
      location: {
        address: 'Academic Block C, Bengaluru',
        lat: 12.9698,
        lng: 77.5968,
      },
    },
    {
      id: 'donor-3',
      name: 'IEEE Annual Tech Symposium Catering',
      organizationType: 'Campus Event',
      contactPerson: 'Prof. विक्रम Rao',
      phone: '+91 98450 77889',
      location: {
        address: 'Main Auditorium Lawn, Bengaluru',
        lat: 12.9752,
        lng: 77.5991,
      },
    },
  ];

  const ngos = [
    {
      id: 'ngo-1',
      name: 'Robin Hood Army - Campus Chapter',
      registrationNo: 'NGO-KA-2021-889',
      contactPerson: 'Sneha Nair',
      phone: '+91 99001 22334',
      location: {
        address: 'Indiranagar Community Hub, Bengaluru',
        lat: 12.9784,
        lng: 77.6050,
      },
    },
    {
      id: 'ngo-2',
      name: 'Akshaya Seva Trust & Shelter',
      registrationNo: 'NGO-KA-2019-312',
      contactPerson: 'Mohammed Irfan',
      phone: '+91 99001 55667',
      location: {
        address: 'Shivajinagar Relief Center, Bengaluru',
        lat: 12.9815,
        lng: 77.6012,
      },
    },
  ];

  const listings = [
    {
      id: 'lst-101',
      donorId: 'donor-1',
      donorName: 'Block-A Boys Hostel Mess',
      donorPhone: '+91 98450 11223',
      foodTitle: 'Steamed Rice, Dal Tadka & Mixed Veg Curry',
      foodType: 'Veg',
      quantityMeals: 65,
      weightKg: 22.5,
      preparedAt: new Date(now - 1.5 * hourMs).toISOString(),
      useBefore: new Date(now + 2.2 * hourMs).toISOString(),
      status: 'posted',
      safetyChecklistConfirmed: true,
      checklistItems: [
        'temp_control',
        'hygienic_containers',
        'no_spoilage',
        'allergen_labeled',
      ],
      location: {
        address: 'Block-A Hostel Mess Loading Bay',
        lat: 12.9738,
        lng: 77.5935,
      },
      claimedBy: null,
      createdAt: new Date(now - 1 * hourMs).toISOString(),
    },
    {
      id: 'lst-102',
      donorId: 'donor-2',
      donorName: 'Central Engineering Canteen',
      donorPhone: '+91 98450 44556',
      foodTitle: 'Vegetable Pulao, Raita & Chapati Packs',
      foodType: 'Veg',
      quantityMeals: 45,
      weightKg: 15.8,
      preparedAt: new Date(now - 2 * hourMs).toISOString(),
      useBefore: new Date(now + 1.2 * hourMs).toISOString(),
      status: 'posted',
      safetyChecklistConfirmed: true,
      checklistItems: [
        'temp_control',
        'hygienic_containers',
        'no_spoilage',
        'allergen_labeled',
      ],
      location: {
        address: 'Central Canteen Rear Entrance',
        lat: 12.9698,
        lng: 77.5968,
      },
      claimedBy: null,
      createdAt: new Date(now - 0.8 * hourMs).toISOString(),
    },
    {
      id: 'lst-103',
      donorId: 'donor-3',
      donorName: 'IEEE Annual Tech Symposium Catering',
      donorPhone: '+91 98450 77889',
      foodTitle: 'Paneer Biryani & Assorted Sandwich Trays',
      foodType: 'Veg',
      quantityMeals: 90,
      weightKg: 31.5,
      preparedAt: new Date(now - 2.5 * hourMs).toISOString(),
      useBefore: new Date(now + 3.0 * hourMs).toISOString(),
      status: 'claimed',
      safetyChecklistConfirmed: true,
      checklistItems: [
        'temp_control',
        'hygienic_containers',
        'no_spoilage',
        'allergen_labeled',
      ],
      location: {
        address: 'Main Auditorium VIP Gate',
        lat: 12.9752,
        lng: 77.5991,
      },
      claimedBy: {
        ngoName: 'Robin Hood Army - Campus Chapter',
        volunteerName: 'Sneha Nair',
        volunteerPhone: '+91 99001 22334',
        claimedAt: new Date(now - 0.3 * hourMs).toISOString(),
      },
      createdAt: new Date(now - 1.2 * hourMs).toISOString(),
    },
    {
      id: 'lst-104',
      donorId: 'donor-1',
      donorName: 'Girls Hostel Mess Block-C',
      donorPhone: '+91 98450 99001',
      foodTitle: 'Idli, Vada & Sambar Containers',
      foodType: 'Veg',
      quantityMeals: 80,
      weightKg: 28.0,
      preparedAt: new Date(now - 6 * hourMs).toISOString(),
      useBefore: new Date(now - 1 * hourMs).toISOString(),
      status: 'collected',
      safetyChecklistConfirmed: true,
      checklistItems: [
        'temp_control',
        'hygienic_containers',
        'no_spoilage',
        'allergen_labeled',
      ],
      location: {
        address: 'Girls Hostel Block-C Gate',
        lat: 12.9682,
        lng: 77.5918,
      },
      claimedBy: {
        ngoName: 'Akshaya Seva Trust & Shelter',
        volunteerName: 'Mohammed Irfan',
        volunteerPhone: '+91 99001 55667',
        claimedAt: new Date(now - 3.5 * hourMs).toISOString(),
        collectedAt: new Date(now - 2.8 * hourMs).toISOString(),
      },
      createdAt: new Date(now - 5 * hourMs).toISOString(),
    },
    {
      id: 'lst-105',
      donorId: 'donor-2',
      donorName: 'MBA Seminar Hall Refreshments',
      donorPhone: '+91 98450 33441',
      foodTitle: 'Chicken Curry & Ghee Rice Tray',
      foodType: 'Non-Veg',
      quantityMeals: 55,
      weightKg: 19.2,
      preparedAt: new Date(now - 8 * hourMs).toISOString(),
      useBefore: new Date(now - 3 * hourMs).toISOString(),
      status: 'collected',
      safetyChecklistConfirmed: true,
      checklistItems: [
        'temp_control',
        'hygienic_containers',
        'no_spoilage',
        'allergen_labeled',
      ],
      location: {
        address: 'Management Block Ground Floor',
        lat: 12.9765,
        lng: 77.5910,
      },
      claimedBy: {
        ngoName: 'Robin Hood Army - Campus Chapter',
        volunteerName: 'Karthik Raj',
        volunteerPhone: '+91 99001 88776',
        claimedAt: new Date(now - 5.5 * hourMs).toISOString(),
        collectedAt: new Date(now - 4.7 * hourMs).toISOString(),
      },
      createdAt: new Date(now - 7 * hourMs).toISOString(),
    },
  ];

  const claims = [
    {
      id: 'clm-201',
      listingId: 'lst-103',
      ngoName: 'Robin Hood Army - Campus Chapter',
      volunteerName: 'Sneha Nair',
      volunteerPhone: '+91 99001 22334',
      status: 'claimed',
      claimedAt: new Date(now - 0.3 * hourMs).toISOString(),
      collectedAt: null,
    },
    {
      id: 'clm-202',
      listingId: 'lst-104',
      ngoName: 'Akshaya Seva Trust & Shelter',
      volunteerName: 'Mohammed Irfan',
      volunteerPhone: '+91 99001 55667',
      status: 'collected',
      claimedAt: new Date(now - 3.5 * hourMs).toISOString(),
      collectedAt: new Date(now - 2.8 * hourMs).toISOString(),
    },
    {
      id: 'clm-203',
      listingId: 'lst-105',
      ngoName: 'Robin Hood Army - Campus Chapter',
      volunteerName: 'Karthik Raj',
      volunteerPhone: '+91 99001 88776',
      status: 'collected',
      claimedAt: new Date(now - 5.5 * hourMs).toISOString(),
      collectedAt: new Date(now - 4.7 * hourMs).toISOString(),
    },
  ];

  return { donors, ngos, listings, claims };
}

if (require.main === module) {
  const data = generateSeedData();
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Seeded CampusFoodShare database successfully at:', DB_FILE_PATH);
}

module.exports = { generateSeedData };
