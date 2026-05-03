/** Normalize workspace class grid from API (periods + groupsByPeriod or counts only). */

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
