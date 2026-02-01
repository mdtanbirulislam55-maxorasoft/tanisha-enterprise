// ==================== DATE & NUMBER UTILITIES ====================
// Keep this file dependency-free to reduce production risk.

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Format a Date to ISO string without milliseconds.
 */
function toIsoNoMs(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const iso = d.toISOString();
  // Remove .sss from 2026-01-18T00:00:00.000Z
  return iso.replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Generate a service number like: SRV-20260118-0001
 *
 * This is collision-resistant for single-node deployments.
 * If you need strict sequencing across multiple servers, store a counter in the database.
 */
function generateServiceNumber(prefix = 'SRV') {
  const now = new Date();
  const ymd = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const rnd = Math.floor(Math.random() * 10000);
  return `${prefix}-${ymd}-${pad4(rnd)}`;
}

module.exports = {
  toIsoNoMs,
  generateServiceNumber,
};
