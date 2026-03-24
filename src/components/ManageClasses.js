import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, GraduationCap } from 'lucide-react';
import {
  createJoinCode,
  getJoinCodes,
  getRoster,
  resetStudentPassword,
  setJoinCodeActive,
} from '../api/auth';

export default function ManageClasses({ workspaceId, theme, onGroupSelect }) {
  const [members, setMembers] = useState([]);
  const [joinCodes, setJoinCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [newCodeSchool, setNewCodeSchool] = useState('MTN12');
  const [newCodeInstructor, setNewCodeInstructor] = useState('Shim');
  const [resetPasswordDraft, setResetPasswordDraft] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    if (!workspaceId) return;
    try {
      const [roster, codes] = await Promise.all([getRoster(workspaceId), getJoinCodes(workspaceId)]);
      setMembers(roster.members || []);
      setJoinCodes(codes.joinCodes || []);
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
    const map = {};
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
  }, [members]);

  const handleCreateCode = async () => {
    if (!newCode.trim()) return;
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
    const next = resetPasswordDraft[student.id];
    if (!next) return;
    try {
      await resetStudentPassword(workspaceId, student.id, next);
      setResetPasswordDraft((prev) => ({ ...prev, [student.id]: '' }));
      setError('');
      // eslint-disable-next-line no-alert
      alert(`Password reset for ${student.full_name}`);
    } catch (e) {
      setError(e.message || 'Failed to reset student password.');
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
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Student Join Codes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="e.g. SHIM-P1"
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
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={resetPasswordDraft[student.id] || ''}
                      onChange={(e) =>
                        setResetPasswordDraft((prev) => ({ ...prev, [student.id]: e.target.value }))
                      }
                      placeholder="New password"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleResetPassword(student)}
                      className="px-3 py-1.5 rounded text-sm bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
          <li>Reset student passwords when needed (teacher support flow).</li>
          <li>Use period/group selections here to drive Raw Data and Analysis comparisons.</li>
        </ul>
      </div>
    </div>
  );
}
