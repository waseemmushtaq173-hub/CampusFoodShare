const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

function verifyPassword(password, stored) {
  if (!isHashed(stored)) return String(password) === stored;
  const [, salt, hash] = stored.split('$');
  const candidate = crypto.scryptSync(String(password), salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

/** Hash any plaintext passwords in a db object. Returns true if something changed. */
function hashAllPasswords(db) {
  let changed = false;
  for (const u of db.users || []) {
    if (u.password && !isHashed(u.password)) {
      u.password = hashPassword(u.password);
      changed = true;
    }
  }
  return changed;
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

module.exports = { hashPassword, verifyPassword, hashAllPasswords, publicUser };
