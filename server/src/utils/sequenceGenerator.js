import { Counter } from '../modules/settings/counter.model.js';

/**
 * Generate an atomic, concurrency-safe unique document sequence number
 * Format: {PREFIX}-{YEAR}-{0001}
 * Example: PO-2026-0001, WO-2026-0001, INV-2026-0001
 *
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {string} key - e.g., 'PO', 'WO', 'INV', 'GRN', 'SO', 'DSP'
 * @param {string} prefix - Optional custom prefix, defaults to key
 * @param {number} padLength - Defaults to 4 digits
 * @param {import('mongoose').ClientSession} session - Optional mongoose session
 * @returns {Promise<string>} e.g. "PO-2026-0001"
 */
export const getNextSequence = async (companyId, key, prefix = key, padLength = 4, session = null) => {
  const currentYear = new Date().getFullYear();

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };
  if (session) {
    options.session = session;
  }

  const counter = await Counter.findOneAndUpdate(
    { companyId, key, year: currentYear },
    { $inc: { seq: 1 } },
    options
  );

  const paddedSeq = String(counter.seq).padStart(padLength, '0');
  return `${prefix}-${currentYear}-${paddedSeq}`;
};
