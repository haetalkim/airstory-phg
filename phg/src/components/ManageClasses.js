import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, GraduationCap, LockKeyhole, Trash2, MoveRight, UserCog } from 'lucide-react';
import {
  createJoinCode,
  getClassStructure,
  getJoinCodes,
  getRoster,
  setJoinCodeActive,
  updateClassStructure,
} from '../api/auth';
import { getMeasurements } from '../api/data';

export default function ManageClasses({
  workspaceId,
  theme,
  onGroupSelect,
  viewerProfile,
  onClassStructureChanged,
}) {
  const [members, setMembers] = useState([]);
  const [joinCodes, setJoinCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [newCodeSchool, setNewCodeSchool] = useState(viewerProfile?.school || '');
  const [newCodeInstructor, setNewCodeInstructor] = useState(viewerProfile?.instructor || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [periodCount, setPeriodCount] = useState(1);
  const [groupCount, setGroupCount] = useState(6);

  const generateRandomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from(
      { length: 5 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
    setNewCode(code);
  };

  const load = async () => {
    if (!workspaceId) return;
    try {
      const [roster, codes, structure] = await Promise.all([
        getRoster(workspaceId),
        getJoinCodes(workspaceId),
        getClassStructure(workspaceId),
      ]);
      setMembers(roster.members || []);
      setJoinCodes(codes.joinCodes || []);
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

  // Join-code defaults always follow the teacher's saved profile (not stale typed values like old Shim/MTN12).
  useEffect(() => {
    setNewCodeSchool(viewerProfile?.school ?? '');
    setNewCodeInstructor(viewerProfile?.instructor ?? '');
  }, [viewerProfile?.school, viewerProfile?.instructor]);

  const groups = useMemo(() => {
    const periods = Array.from({ length: periodCount || 1 }, (_, i) => `P${i + 1}`);
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
  }, [members, periodCount, groupCount]);

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
          const period = m.period || '';
          const group = m.group_code || '';
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

  const handleCreateCode = async () => {
    if (!newCode.trim()) return;
    if (!/^[A-Z0-9]{5}$/.test(newCode.trim().toUpperCase())) {
      setError('Join code must be exactly 5 letters/numbers.');
      return;
    }
    try {
      const created = await createJoinCode(workspaceId, {
        code: newCode.trim().toUpperCase(),
        schoolCode: newCodeSchool,
        instructor: newCodeInstructor,
        active: true,
      });
      setJoinCodes((prev) => [created.joinCode, ...prev]);
      setNewCode('');
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to create join code.');
    }
  };

  const handleToggleCode = async (code) => {
    try {
      const updated = await setJoinCodeActive(workspaceId, code.id, !code.active);
      setJoinCodes((prev) => prev.map((c) => (c.id === code.id ? updated.joinCode : c)));
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to update join code.');
    }
  };

  // PHG variant: student profile management actions are intentionally paused.
  // The UI is blurred and no longer exposes controls for password reset/move/remove.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Classes</h1>
          <p className="text-gray-600">Teacher controls for groups, join codes, and student access</p>
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

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Student Join Codes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="e.g. X7KD2"
            maxLength={5}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={newCodeSchool}
            onChange={(e) => setNewCodeSchool(e.target.value)}
            placeholder="PHG01"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={newCodeInstructor}
            onChange={(e) => setNewCodeInstructor(e.target.value)}
            placeholder="Mr. Sikich"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button onClick={handleCreateCode} className={`${theme.bg} ${theme.hover} text-white rounded-lg px-4 py-2`}>
            Create Code
          </button>
        </div>
        <div className="mb-4">
          <button
            onClick={generateRandomCode}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Generate Random Code
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Share one class code. Students use this code to join your class, then choose their own period and group during signup.
            School code and instructor above default from My Page; edit here if needed, then click <strong>Create Code</strong>—codes appear in the list below only after you create them.
          </p>
        </div>
        <div className="space-y-2">
          {joinCodes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{code.code}</p>
                <p className="text-xs text-gray-500">{code.school_code || 'N/A'} • {code.instructor || 'N/A'}</p>
              </div>
              <button
                onClick={() => handleToggleCode(code)}
                className={`px-3 py-1 rounded text-xs font-semibold ${code.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
              >
                {code.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
          {!joinCodes.length && (
            <p className="text-sm text-gray-500">
              No join codes yet. Fill the five-character code (or random generate), confirm PHG01 / instructor name, then click Create Code.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((bucket) => {
          const bucketKey = `${bucket.period} ${bucket.group}`;
          const sessionCount = sessionCounts[bucketKey] ?? null;
          const hasStudents = bucket.students.length > 0;
          return (
            <div
              key={`${bucket.period}-${bucket.group}`}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{bucket.period} {bucket.group}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                    title="Distinct lab sessions uploaded for this group"
                  >
                    {sessionCount == null
                      ? '— sessions'
                      : `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`}
                  </span>
                  <button
                    onClick={() => onGroupSelect?.({ period: bucket.period, group: bucket.group })}
                    className="text-sm px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Open Lab Data
                  </button>
                </div>
              </div>

              {/* Student profiles section: blurred for the PHG variant since
                  per-student management isn't needed in a no-login group
                  flow. The roster is preserved underneath so a non-PHG
                  fallback or future toggle could re-enable it. */}
              <div className="relative">
                <div className="pointer-events-none select-none filter blur-[2px] opacity-50" aria-hidden="true">
                  <div className="space-y-3">
                    {hasStudents ? (
                      bucket.students.map((student) => (
                        <div key={student.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-500 mb-2">{student.email}</p>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="px-3 py-1.5 rounded text-xs bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                              <LockKeyhole className="w-3.5 h-3.5" /> PW
                            </span>
                            <span className="px-3 py-1.5 rounded text-xs bg-blue-50 text-blue-700 inline-flex items-center gap-1">
                              <MoveRight className="w-3.5 h-3.5" /> Move
                            </span>
                            <span className="px-3 py-1.5 rounded text-xs bg-red-50 text-red-700 inline-flex items-center gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> X
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-400 italic">
                        No registered students for this group yet.
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/95 border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-gray-600">
                    <UserCog className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-700">Student profiles paused</span>
                    <span className="text-gray-400">— not needed right now</span>
                  </div>
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
          <li>Create and share join codes with students for signup.</li>
          <li>Click a group card to jump directly into that group&apos;s Raw Data.</li>
          <li>Use period/group selections here to drive Raw Data and Analysis comparisons.</li>
        </ul>
      </div>
    </div>
  );
}
