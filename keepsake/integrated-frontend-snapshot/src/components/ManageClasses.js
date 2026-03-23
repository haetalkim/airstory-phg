import React, { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap } from 'lucide-react';
import { getRoster } from '../api/auth';

const TEMPLATE_GROUPS = {
  'P1 G1': ['Jiin', 'Ada', 'Davin', 'Stella'],
  'P1 G2': ['Ida', 'Lucy', 'Yimei', 'Jay'],
  'P1 G3': ['Liz', 'Min', 'Bella', 'Juun'],
  'P1 G4': ['Julia', 'Jennifer', 'Niki', 'Bea'],
};

export default function ManageClasses({ workspaceId, theme }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workspaceId) return;
      try {
        const roster = await getRoster(workspaceId);
        if (!cancelled) setMembers(roster.members || []);
      } catch {
        if (!cancelled) setMembers([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const grouped = useMemo(() => {
    const map = { ...Object.fromEntries(Object.keys(TEMPLATE_GROUPS).map((k) => [k, []])) };
    members
      .filter((m) => m.role === 'student')
      .forEach((m) => {
        const key = `${m.period || 'P1'} ${m.group_code || 'G1'}`;
        if (!map[key]) map[key] = [];
        map[key].push(m.full_name);
      });

    Object.keys(TEMPLATE_GROUPS).forEach((key) => {
      const existing = new Set(map[key] || []);
      TEMPLATE_GROUPS[key].forEach((name) => {
        if (!existing.has(name)) map[key].push(name);
      });
      map[key] = map[key].slice(0, 4);
    });
    return map;
  }, [members]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Classes</h1>
          <p className="text-gray-600">View class structure by period and group</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(grouped).map(([bucket, names]) => (
          <div key={bucket} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{bucket}</h3>
              <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              {names.map((name, idx) => (
                <div key={`${bucket}-${name}-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                    {name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{name}</span>
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
          <h3 className="text-xl font-bold text-gray-900">Teacher Management Notes</h3>
        </div>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>Review class composition by period/group before each session.</li>
          <li>Track student edit annotations in Raw Data and validate corrections.</li>
          <li>Use Heat Map and Analysis tabs for trend-based classroom discussion.</li>
        </ul>
      </div>
    </div>
  );
}
