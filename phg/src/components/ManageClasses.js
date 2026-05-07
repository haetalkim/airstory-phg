import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, GraduationCap } from 'lucide-react';
import { getClassStructure, getRoster, updateClassStructure } from '../api/auth';
import { getMeasurements } from '../api/data';
import { normalizeGroupToken, normalizePeriodToken } from '../utils/hierarchyTokens';
import { PHG_PERIOD_LABELS } from '../utils/studentContext';

export default function ManageClasses({
  workspaceId,
  theme,
  onGroupSelect,
  onClassStructureChanged,
}) {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [periodCount, setPeriodCount] = useState(1);
  const [groupCount, setGroupCount] = useState(6);

  const load = async () => {
    if (!workspaceId) return;
    try {
      const [roster, structure] = await Promise.all([
        getRoster(workspaceId),
        getClassStructure(workspaceId),
      ]);
      setMembers(roster.members || []);
      setPeriodCount(structure.periodCount || 1);
      setGroupCount(structure.groupCount || 4);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load class management data.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const groups = useMemo(() => {
    // Pilot: hardcode period labels to match classroom schedule.
    const periods = [...PHG_PERIOD_LABELS];
    const groupsForPeriod = Array.from({ length: groupCount || 4 }, (_, i) => `G${i + 1}`);
    const map = {};
    periods.forEach((period) => {
      groupsForPeriod.forEach((group) => {
        const key = `${period} ${group}`;
        map[key] = { period, group, students: [] };
      });
    });
    // PHG variant: drop the implicit "Unknowns" buckets the original site
    // built for students whose period/group fell outside the configured grid.
    // With the no-login group flow, every student picks a real group on the
    // landing page, so off-grid placements are noise rather than signal.
    members
      .filter((m) => m.role === 'student')
      .forEach((m) => {
        const period = m.period || '';
        const group = m.group_code || '';
        const key = `${period} ${group}`;
        if (!map[key]) return;
        map[key].students.push(m);
      });
    return Object.values(map).sort((a, b) => `${a.period}${a.group}`.localeCompare(`${b.period}${b.group}`));
  }, [members, groupCount]);

  /** Count distinct sessions per (period, group_code) for the session-count
   *  badge on each group card. Pulls from the workspace measurements pull
   *  the rest of the app already issues; if it fails (offline / cold start),
   *  the badge silently falls back to "—". */
  const [sessionCounts, setSessionCounts] = useState({});
  useEffect(() => {
    if (!workspaceId) {
      setSessionCounts({});
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await getMeasurements(workspaceId, { limit: 10000 });
        if (cancelled) return;
        const seen = {};
        (result?.measurements || []).forEach((m) => {
          // Pilot alignment: buckets use raw labels "3"/"5"; normalizePeriodToken("3") => "P3".
          // Convert back to the raw label so sessionCounts keys match `${bucket.period} ${bucket.group}`.
          const normalized = normalizePeriodToken(m.period || '');
          const period = String(normalized).toUpperCase().startsWith('P')
            ? String(normalized).slice(1)
            : String(m.period || '');
          const group = normalizeGroupToken(m.group_code || m.group || '');
          const sid = m.session_id || m.session_code || '';
          if (!sid) return;
          const key = `${period} ${group}`;
          if (!seen[key]) seen[key] = new Set();
          seen[key].add(sid);
        });
        const counts = {};
        Object.keys(seen).forEach((k) => {
          counts[k] = seen[k].size;
        });
        setSessionCounts(counts);
      } catch {
        if (!cancelled) setSessionCounts({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, members]);

  const handleSaveClassStructure = async () => {
    try {
      setBusy(true);
      const updated = await updateClassStructure(workspaceId, {
        periodCount: Number(periodCount),
        groupCount: Number(groupCount),
      });
      setPeriodCount(updated.periodCount || Number(periodCount));
      setGroupCount(updated.groupCount || Number(groupCount));
      setError('');
      onClassStructureChanged?.(updated);
    } catch (e) {
      setError(e.message || 'Failed to update class structure.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Classes</h1>
          <p className="text-gray-600">Teacher controls for class structure and opening group raw data</p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Class Structure</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period Count</label>
            <input
              type="number"
              min={1}
              max={12}
              value={periodCount}
              onChange={(e) => setPeriodCount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Groups per Period</label>
            <input
              type="number"
              min={1}
              max={12}
              value={groupCount}
              onChange={(e) => setGroupCount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled={busy}
              onClick={handleSaveClassStructure}
              className={`${theme.bg} ${theme.hover} text-white rounded-lg px-4 py-2 w-full disabled:opacity-60`}
            >
              Save Structure
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Student sign-up period/group options follow this structure.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 relative overflow-hidden min-h-[200px]">
        <div className="pointer-events-none select-none filter blur-[3px] opacity-40" aria-hidden="true">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Student Join Codes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input readOnly className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. X7KD2" />
            <input readOnly className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="PHG01" />
            <input readOnly className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="Instructor" />
            <div className={`${theme.bg} text-white rounded-lg px-4 py-2 text-center text-sm`}>Create Code</div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
          <div className="max-w-md text-center bg-white/95 border border-gray-200 rounded-xl shadow-md px-6 py-5">
            <p className="text-sm font-semibold text-gray-800">Student join codes</p>
            <p className="text-xs text-gray-600 mt-1">
              Not used for the PHG group flow — students pick a group on the landing page. This section is hidden on purpose.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((bucket) => {
          const bucketKey = `${bucket.period} ${bucket.group}`;
          const sessionCount = sessionCounts[bucketKey] ?? null;
          const periodLabel = normalizePeriodToken(bucket.period);
          const periodBadgeClass =
            String(bucket.period) === '3'
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : String(bucket.period) === '5'
                ? 'text-purple-700 bg-purple-50 border-purple-100'
                : 'text-slate-700 bg-slate-50 border-slate-100';
          const openBtnClass =
            String(bucket.period) === '3'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : String(bucket.period) === '5'
                ? 'bg-purple-600 hover:bg-purple-700'
                : `${theme.bg} ${theme.hover}`;
          return (
            <div
              key={`${bucket.period}-${bucket.group}`}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-extrabold uppercase tracking-wider px-2 py-1 rounded-md border ${periodBadgeClass}`}>
                    {periodLabel}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{periodLabel}-{bucket.group}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                    title="Distinct lab sessions with measurements for this group"
                  >
                    {sessionCount == null
                      ? '— sessions'
                      : `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onGroupSelect?.({ period: bucket.period, group: bucket.group })}
                    className={`text-sm px-4 py-2 rounded-lg text-white ${openBtnClass}`}
                  >
                    Open Raw Data
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Teacher Workflow</h3>
        </div>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>Adjust period and group counts above, then save — filters elsewhere follow this grid.</li>
          <li>Use <strong>Open Raw Data</strong> on a card to jump to that group&apos;s measurements.</li>
        </ul>
      </div>
    </div>
  );
}
