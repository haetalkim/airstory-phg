import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, GraduationCap, LockKeyhole, Trash2, MoveRight, X } from 'lucide-react';
import {
  createJoinCode,
  getClassStructure,
  getJoinCodes,
  getRoster,
  removeStudent,
  resetStudentPassword,
  setJoinCodeActive,
  updateClassStructure,
  updateStudentPlacement,
} from '../api/auth';

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
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeAction, setActiveAction] = useState('');
  const [draftPassword, setDraftPassword] = useState('');
  const [draftPeriod, setDraftPeriod] = useState('P1');
  const [draftGroup, setDraftGroup] = useState('G1');
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

  useEffect(() => {
    if (viewerProfile?.school) setNewCodeSchool(viewerProfile.school);
    if (viewerProfile?.instructor) setNewCodeInstructor(viewerProfile.instructor);
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
    members
      .filter((m) => m.role === 'student')
      .forEach((m) => {
        const period = m.period || 'P1';
        const group = m.group_code || 'G1';
        const key = `${period} ${group}`;
        if (!map[key]) map[key] = { period, group, students: [] };
        map[key].students.push(m);
      });
    return Object.values(map).sort((a, b) => `${a.period}${a.group}`.localeCompare(`${b.period}${b.group}`));
  }, [members, periodCount, groupCount]);

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
      onClassStructureChanged?.();
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

  const handleResetPassword = async (student) => {
    if (!draftPassword) return;
    try {
      setBusy(true);
      await resetStudentPassword(workspaceId, student.id, draftPassword);
      setDraftPassword('');
      setActiveStudent(null);
      setActiveAction('');
      setError('');
      // eslint-disable-next-line no-alert
      alert(`Password reset for ${student.full_name}`);
    } catch (e) {
      setError(e.message || 'Failed to reset student password.');
    } finally {
      setBusy(false);
    }
  };

  const openStudentAction = (student, action) => {
    setActiveStudent(student);
    setActiveAction(action);
    setDraftPassword('');
    setDraftPeriod(student.period || 'P1');
    setDraftGroup(student.group_code || 'G1');
  };

  const handleMoveStudent = async () => {
    if (!activeStudent) return;
    try {
      setBusy(true);
      await updateStudentPlacement(workspaceId, activeStudent.id, { period: draftPeriod, groupCode: draftGroup });
      await load();
      setActiveStudent(null);
      setActiveAction('');
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to move student.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!activeStudent) return;
    try {
      setBusy(true);
      await removeStudent(workspaceId, activeStudent.id);
      await load();
      setActiveStudent(null);
      setActiveAction('');
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to remove student.');
    } finally {
      setBusy(false);
    }
  };

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
            placeholder="School code"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={newCodeInstructor}
            onChange={(e) => setNewCodeInstructor(e.target.value)}
            placeholder="Instructor"
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
          {!joinCodes.length && <p className="text-sm text-gray-500">No join codes yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((bucket) => (
          <div key={`${bucket.period}-${bucket.group}`} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{bucket.period} {bucket.group}</h3>
              <button
                onClick={() => onGroupSelect?.({ period: bucket.period, group: bucket.group })}
                className="text-sm px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Open Raw Data
              </button>
            </div>
            <div className="space-y-3">
              {bucket.students.map((student) => (
                <div key={student.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{student.full_name}</p>
                  <p className="text-xs text-gray-500 mb-2">{student.email}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openStudentAction(student, 'password')}
                      className="px-3 py-1.5 rounded text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 inline-flex items-center gap-1"
                      title="Reset password"
                    >
                      <LockKeyhole className="w-3.5 h-3.5" />
                      PW
                    </button>
                    <button
                      onClick={() => openStudentAction(student, 'move')}
                      className="px-3 py-1.5 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1"
                      title="Move period/group"
                    >
                      <MoveRight className="w-3.5 h-3.5" />
                      Move
                    </button>
                    <button
                      onClick={() => openStudentAction(student, 'delete')}
                      className="px-3 py-1.5 rounded text-xs bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-1"
                      title="Remove student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeStudent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setActiveStudent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">
                  {activeAction === 'password' && 'Reset Password'}
                  {activeAction === 'move' && 'Move Student'}
                  {activeAction === 'delete' && 'Remove Student'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{activeStudent.full_name} • {activeStudent.email}</p>
              </div>
              <button
                onClick={() => !busy && setActiveStudent(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {activeAction === 'password' && (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={draftPassword}
                    onChange={(e) => setDraftPassword(e.target.value)}
                    placeholder="New password (8+ chars)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    disabled={busy || draftPassword.length < 8}
                    onClick={() => handleResetPassword(activeStudent)}
                      className="px-3 py-1.5 rounded text-sm bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                    Apply Password
                  </button>
                </div>
              )}
              {activeAction === 'move' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={draftPeriod}
                      onChange={(e) => setDraftPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Array.from({ length: periodCount || 1 }, (_, i) => `P${i + 1}`).map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                      value={draftGroup}
                      onChange={(e) => setDraftGroup(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Array.from({ length: groupCount || 4 }, (_, i) => `G${i + 1}`).map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <button
                    disabled={busy}
                    onClick={handleMoveStudent}
                    className="px-3 py-1.5 rounded text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Move Student
                  </button>
                </div>
              )}
              {activeAction === 'delete' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Remove this student from the class roster?
                  </p>
                  <button
                    disabled={busy}
                    onClick={handleRemoveStudent}
                    className="px-3 py-1.5 rounded text-sm bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Remove Student
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          <li>Reset student passwords when needed (teacher support flow).</li>
          <li>Use period/group selections here to drive Raw Data and Analysis comparisons.</li>
        </ul>
      </div>
    </div>
  );
}
