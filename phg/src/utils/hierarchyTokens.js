/**
 * Normalize period/group strings so CSV "2" matches filter "G2", "1" matches "P1".
 */

function isBlankHierarchyValue(value) {
  return !String(value ?? "").trim();
}

/** e.g. G2, g2, 2, 02 → G2 */
export function normalizeGroupToken(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const compact = s.toUpperCase().replace(/\s+/g, "");
  const gPrefix = compact.match(/^G(\d+)$/);
  if (gPrefix) return `G${Number(gPrefix[1])}`;
  const digitsOnly = compact.match(/^(\d+)$/);
  if (digitsOnly) return `G${Number(digitsOnly[1])}`;
  return compact;
}

/** e.g. P1, p1, 1 → P1 */
export function normalizePeriodToken(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const compact = s.toUpperCase().replace(/\s+/g, "");
  const pPrefix = compact.match(/^P(\d+)$/);
  if (pPrefix) return `P${Number(pPrefix[1])}`;
  const digitsOnly = compact.match(/^(\d+)$/);
  if (digitsOnly) return `P${Number(digitsOnly[1])}`;
  return compact;
}

/** Filter UI uses G2; uploaded rows may use "2". Empty row.group still passes any selection. */
export function groupsMatch(filterVal, rowVal) {
  const f = String(filterVal ?? "").trim();
  if (!f) return true;
  if (isBlankHierarchyValue(rowVal)) return true;
  return normalizeGroupToken(f) === normalizeGroupToken(rowVal);
}

export function periodsMatch(filterVal, rowVal) {
  const f = String(filterVal ?? "").trim();
  if (!f) return true;
  if (isBlankHierarchyValue(rowVal)) return true;
  return normalizePeriodToken(f) === normalizePeriodToken(rowVal);
}
