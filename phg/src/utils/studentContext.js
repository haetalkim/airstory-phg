/**
 * Student context for the PHG variant.
 *
 * Students never log in — they pick a group on the landing page. The chosen
 * group + school are persisted in localStorage so heat-map / raw-data filters
 * can pre-populate themselves and so the group can be switched mid-session
 * from the navbar without re-routing.
 *
 * The backend still requires a JWT for measurement reads/writes, so the
 * landing page silently signs the browser into a single shared "PHG students"
 * account (seeded in backend/src/db/seed.js). Per-group attribution is
 * handled client-side by stamping `groupCode` onto each measurement on
 * upload, NOT by giving each group its own account.
 */

const STORAGE_KEY = "phg.studentContext";

/** Default school stamped into context when a student picks a group. Matches backend seed. */
export const PHG_SCHOOL_CODE = "PHG01";

/** Shared backend account that all PHG student browsers silently log into. */
export const PHG_STUDENT_EMAIL =
  process.env.REACT_APP_PHG_STUDENT_EMAIL?.trim() ||
  "phg-students@airstory.local";

/**
 * NOT a real user secret — it's a known credential that just satisfies the
 * existing /auth/login schema for a class-only, no-login UX. Anyone hitting
 * the PHG site already has access to the same data as anyone else picking a
 * group. Keep it readable; rotate via env if desired.
 */
export const PHG_STUDENT_PASSWORD =
  process.env.REACT_APP_PHG_STUDENT_PASSWORD?.trim() ||
  "phg-students-2026";

/** Allowed group codes shown on the landing page. */
export const PHG_GROUP_CODES = Object.freeze(["G1", "G2", "G3", "G4"]);

/** Analysis/teacher-side can still reference a larger set. */
export const PHG_ANALYSIS_GROUP_CODES = Object.freeze(["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"]);

/** Allowed period labels for the PHG pilot. */
export const PHG_PERIOD_LABELS = Object.freeze(["3", "5"]);

export function getStudentContext() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!PHG_GROUP_CODES.includes(parsed.group)) return null;
    if (parsed.period && !PHG_PERIOD_LABELS.includes(String(parsed.period))) return null;
    return {
      group: parsed.group,
      school: parsed.school || PHG_SCHOOL_CODE,
      period: parsed.period ? String(parsed.period) : "",
    };
  } catch {
    return null;
  }
}

export function setStudentContext({ group, period = "", school = PHG_SCHOOL_CODE } = {}) {
  if (!PHG_GROUP_CODES.includes(group)) return;
  const p = period ? String(period) : "";
  if (p && !PHG_PERIOD_LABELS.includes(p)) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ group, period: p, school })
    );
  } catch {
    // localStorage may be disabled (private browsing); the rest of the app
    // still works for the current tab via in-memory state.
  }
}

export function clearStudentContext() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
