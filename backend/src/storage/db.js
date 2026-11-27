const fs = require('fs');
const path = require('path');
const { LISTING_STATUS } = require('../models/schemas');
const DB_FILE_PATH = process.env.DB_FILE_PATH
  ? path.resolve(process.env.DB_FILE_PATH)
  : path.join(__dirname, '../../data/db.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({ users: [], donors: [], ngos: [], listings: [], claims: [], notifications: [], feedbacks: [] }, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
}

function writeDb(data) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function addNotification(db, { type, title, message, channel = 'In-App + SMS/Telegram Alert', audience }) {
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: 'ntf-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    type,
    title,
    message,
    channel,
    ...(audience ? { audience } : {}),
    createdAt: new Date().toISOString(),
  });
  db.notifications = db.notifications.slice(0, 30);
}

function sweepExpiredListings() {
  const db = readDb();
  const now = Date.now();
  let updatedCount = 0;
  db.listings = (db.listings || []).map((listing) => {
    if (listing.status === LISTING_STATUS.POSTED && new Date(listing.useBefore).getTime() <= now) {
      updatedCount++;
      addNotification(db, {
        type: 'EXPIRY_AUTO_SWEEP',
        title: 'Listing Auto-Expired',
        message: `"${listing.foodTitle}" from ${listing.donorName} passed its Use-Before window and was removed.`,
      });
      return { ...listing, status: LISTING_STATUS.EXPIRED, expiredAt: new Date().toISOString() };
    }
    return listing;
  });
  if (updatedCount > 0) writeDb(db);
  return { db, expiredSwept: updatedCount };
}

module.exports = { readDb, writeDb, sweepExpiredListings, addNotification, DB_FILE_PATH };
