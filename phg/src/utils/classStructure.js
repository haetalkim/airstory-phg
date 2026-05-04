/** Normalize workspace class grid from API (periods + groupsByPeriod or counts only). */

/** Sort P1…P9 / G1…G9 numerically (not lexicographic P1, P10, P2). */
export function compareHierarchyToken(a, b) {
  const na = Number(String(a).replace(/\D/g, '')) || 0;
  const nb = Number(String(b).replace(/\D/g, '')) || 0;
  if (na !== nb) return na - nb;
  return String(a).localeCompare(String(b));
}

export function periodsFromClassStructure(cs) {
  if (!cs) return [];
  if (Array.isArray(cs.periods) && cs.periods.length) return [...cs.periods];
  const n = Number(cs.periodCount);
  if (Number.isFinite(n) && n > 0) {
    return Array.from({ length: n }, (_, i) => `P${i + 1}`);
  }
  return [];
}

export function groupsForPeriodFromStructure(cs, period) {
  if (!cs || !period) return [];
  const fromMap = cs.groupsByPeriod?.[period];
  if (Array.isArray(fromMap) && fromMap.length) return [...fromMap];
  const n = Number(cs.groupCount);
  if (Number.isFinite(n) && n > 0) {
    return Array.from({ length: n }, (_, i) => `G${i + 1}`);
  }
  return [];
}
