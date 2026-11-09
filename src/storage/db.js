/**
 * src/storage/db.js
 * JSON persistent data store (with automatic expiry sweeping for listings).
 * Readily extensible to MongoDB via Mongoose when MONGODB_URI is configured.
 */

const fs = require('fs');
const path = require('path');
const { LISTING_STATUS } = require('../models/schemas');

const DB_FILE_PATH = path.join(__dirname, '../../data/db.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData = {
      donors: [],
      ngos: [],
      listings: [],
      claims: [],
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Automatically transitions any 'posted' listing whose 'useBefore' timestamp has passed
 * into the 'expired' state (Objective 4).
 */
function sweepExpiredListings() {
  const db = readDb();
  const now = Date.now();
  let updatedCount = 0;

  db.listings = db.listings.map((listing) => {
    if (
      listing.status === LISTING_STATUS.POSTED &&
      new Date(listing.useBefore).getTime() <= now
    ) {
      updatedCount++;
      return {
        ...listing,
        status: LISTING_STATUS.EXPIRED,
        expiredAt: new Date().toISOString(),
      };
    }
    return listing;
  });

  if (updatedCount > 0) {
    writeDb(db);
  }
  return { db, expiredSwept: updatedCount };
}

module.exports = {
  readDb,
  writeDb,
  sweepExpiredListings,
  DB_FILE_PATH,
};
