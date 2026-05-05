import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, X, MapPin } from 'lucide-react';
import {
  getImportedMeasurements,
  isBlankHierarchyField,
  setImportedMeasurements,
} from '../utils/importedData';
import { getMeasurements } from '../api/data';
import { workspaceMeasurementsToDisplayRows } from '../utils/measurementRows';
import { groupsForPeriodFromStructure, periodsFromClassStructure } from '../utils/classStructure';
import { REFERENCE_LOCATIONS, getReferenceWeekSeries } from '../utils/referenceTrends';
import { apiRequest } from '../api/http';
import { groupsMatch, normalizeGroupToken, periodsMatch, schoolsMatch } from '../utils/hierarchyTokens';

/** Metrics we try to load from OpenAQ near the reference pin (when a sensor exists). */
const OPENAQ_REFERENCE_METRICS = ['pm25', 'co', 'temp', 'humidity'];

const COMPARISON_PALETTE = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6'];

const ComparisonModal = ({
  isOpen,
  onClose,
  selectedMetric,
  theme,
  metricThemes,
  currentFilters,
  workspaceGroups,
  comparisonSchoolCodes,
}) => {
  const schoolChipList =
    comparisonSchoolCodes?.length > 0
      ? comparisonSchoolCodes
      : [...new Set([currentFilters?.school, 'PHG01'].filter(Boolean))];
  const groupButtonList =
    workspaceGroups?.length > 0
      ? workspaceGroups
      : ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  const [comparisonType, setComparisonType] = useState('location'); // 'group', 'school', 'location', 'time'
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState(() =>
    REFERENCE_LOCATIONS.slice(0, 3).map((l) => l.name)
  );
  const [timeRange, setTimeRange] = useState('week');

  if (!isOpen) return null;

  const getComparisonData = () => {
    switch (comparisonType) {
      case 'location': {
        if (!selectedLocations.length) return [];
        return selectedLocations.map((loc, idx) => {
          const series = getReferenceWeekSeries(loc, selectedMetric);
          const values = series.map((s) => s.value);
          const rawAvg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          const avg =
            selectedMetric === 'co'
              ? Math.round(rawAvg * 100) / 100
              : Math.round(rawAvg);
          return {
            name: loc,
            values,
            avg,
            color: COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length],
          };
        });
      }
      case 'group':
      case 'school':
      case 'time':
        return [];
      default:
        return [];
    }
  };

  const comparisonData = getComparisonData();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create chart data
  const chartData = days.map((day, idx) => {
    const dataPoint = { day };
    comparisonData.forEach(item => {
      dataPoint[item.name] = item.values[idx];
    });
    return dataPoint;
  });

  const toggleGroupSelection = (group) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const toggleSchoolSelection = (school) => {
    setSelectedSchools(prev => 
      prev.includes(school) 
        ? prev.filter(s => s !== school)
        : [...prev, school]
    );
  };

  const toggleLocationSelection = (location) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`${theme.bg} text-white p-6 rounded-t-2xl flex items-center justify-between sticky top-0 z-10`}>
          <div>
            <h3 className="text-xl font-bold">Compare Data - {metricThemes[selectedMetric].label}</h3>
            <p className="text-sm opacity-90 mt-1">Compare across groups, schools, locations, and time periods</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Comparison Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Comparison Type</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'group', label: 'By Group', icon: '👥' },
                { id: 'school', label: 'By School', icon: '🏫' },
                { id: 'location', label: 'By Location', icon: '📍' },
                { id: 'time', label: 'By Time', icon: '📅' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setComparisonType(type.id)}
                  className={`p-4 rounded-xl text-sm font-medium transition-all ${
                    comparisonType === type.id
                      ? `${theme.bg} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div>{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selection Panel */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            {comparisonType === 'group' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Groups to Compare</h4>
                <div className="flex flex-wrap gap-2">
                  {groupButtonList.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroupSelection(group)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedGroups.includes(group)
                          ? `${theme.bg} text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      Group {group.replace('G', '')}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Currently viewing: {currentFilters.school} - Your group is G{currentFilters.group.replace('G', '')}</p>
              </div>
            )}

            {comparisonType === 'school' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Schools to Compare</h4>
                <div className="flex flex-wrap gap-2">
                  {schoolChipList.map((school) => (
                    <button
                      key={school}
                      onClick={() => toggleSchoolSelection(school)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedSchools.includes(school)
                          ? `${theme.bg} text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {school}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Your school: {currentFilters.school}</p>
              </div>
            )}

            {comparisonType === 'location' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Locations to Compare</h4>
                <div className="flex flex-wrap gap-2">
                  {REFERENCE_LOCATIONS.map((ref) => (
                    <button
                      key={ref.name}
                      onClick={() => toggleLocationSelection(ref.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLocations.includes(ref.name)
                          ? `${theme.bg} text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {ref.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Curves use the same illustrative Philadelphia reference series as Analysis (not random mock values).
                </p>
              </div>
            )}

            {comparisonType === 'time' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Time Period</h4>
                <div className="flex gap-2">
                  {['week', 'month', 'year'].map(period => (
                    <button
                      key={period}
                      onClick={() => setTimeRange(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeRange === period
                          ? `${theme.bg} text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {comparisonType !== 'location' && (
            <p className="mb-4 text-sm text-gray-600 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
              By group, school, and time comparisons are not shown with sample numbers here. Use <strong>By Location</strong> for
              Philadelphia reference curves, or rely on imported measurements in the main Analysis charts.
            </p>
          )}

          {/* Comparison Chart */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparison Visualization</h4>
            {comparisonData.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-center text-sm text-gray-500 px-6">
                {comparisonType === 'location'
                  ? 'Select at least one Philadelphia area above to plot reference trends.'
                  : 'No chart for this comparison type until workspace data is wired in.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="day"
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                  />
                  <Legend />
                  {comparisonData.map((item, idx) => (
                    <Line
                      key={idx}
                      type="monotone"
                      dataKey={item.name}
                      stroke={item.color}
                      strokeWidth={2}
                      dot={{ fill: item.color, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Comparison Statistics Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">Statistical Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Average</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Min</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Range</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No comparison rows. Choose locations (reference series) or another view with real data.
                      </td>
                    </tr>
                  ) : (
                    comparisonData.map((item, idx) => {
                      const min = Math.min(...item.values);
                      const max = Math.max(...item.values);
                      const trend =
                        item.values[item.values.length - 1] > item.values[0] ? 'increasing' : 'decreasing';

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">{item.avg}</td>
                          <td className="px-4 py-3 text-green-600 font-semibold">{min}</td>
                          <td className="px-4 py-3 text-orange-600 font-semibold">{max}</td>
                          <td className="px-4 py-3 text-gray-700">{max - min}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {trend === 'increasing' ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm text-orange-600 font-medium">Rising</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Falling</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Insights */}
          {comparisonData.length > 0 && (
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Highest average:{' '}
                  <strong>
                    {comparisonData.reduce((max, item) => (item.avg > max.avg ? item : max), comparisonData[0]).name}
                  </strong>{' '}
                  (
                  {comparisonData.reduce((max, item) => (item.avg > max.avg ? item : max), comparisonData[0]).avg}{' '}
                  {metricThemes[selectedMetric].unit})
                </li>
                <li>
                  • Lowest average:{' '}
                  <strong>
                    {comparisonData.reduce((min, item) => (item.avg < min.avg ? item : min), comparisonData[0]).name}
                  </strong>{' '}
                  (
                  {comparisonData.reduce((min, item) => (item.avg < min.avg ? item : min), comparisonData[0]).avg}{' '}
                  {metricThemes[selectedMetric].unit})
                </li>
                <li>
                  • Range across series:{' '}
                  {Math.max(...comparisonData.map((d) => d.avg)) - Math.min(...comparisonData.map((d) => d.avg))}{' '}
                  {metricThemes[selectedMetric].unit}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Shared “all groups + reference” session-style week chart for Overview and Quick Compare. */
function MultiGroupSessionCompareChart({
  chartData,
  groups,
  theme,
  metricUnit,
  accentGroup,
  fmt,
  isCo,
  height = 320,
}) {
  const yTickFmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '';
    return isCo ? n.toFixed(2) : String(Math.round(n));
  };

  if (!chartData.length || !groups.length) {
    return (
      <p className="text-sm text-gray-500 py-10 text-center">
        Not enough timed measurements across groups for this week window yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        {height >= 300 && (
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        )}
        <XAxis
          dataKey="label"
          stroke="#9CA3AF"
          style={{ fontSize: '11px' }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={yTickFmt}
          label={{
            value: metricUnit,
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '11px' },
          }}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '12px',
          }}
          formatter={(value, name) => [value == null ? '—' : fmt(value), name]}
        />
        <Legend wrapperStyle={{ paddingTop: 8 }} />
        {groups.map((g, idx) => {
          const isAccent = accentGroup && normalizeGroupToken(accentGroup) === g;
          const color = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];
          return (
            <Line
              key={g}
              type="monotone"
              dataKey={g}
              name={`${g} (session)`}
              stroke={color}
              strokeWidth={isAccent ? 3.5 : 2}
              dot={false}
              connectNulls={false}
              opacity={isAccent ? 1 : 0.88}
            />
          );
        })}
        <Line
          type="monotone"
          dataKey="reference"
          name="City reference (OpenAQ / simulated)"
          stroke="#64748b"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const TrendModal = ({ isOpen, onClose, selectedMetric, theme, metricThemes, dailyData }) => {
  if (!isOpen) return null;

  const chartData = dailyData || [];
  const hasPoints = chartData.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`${theme.bg} text-white p-6 rounded-t-2xl flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-bold">Your measurements — {metricThemes[selectedMetric].label}</h3>
            <p className="text-sm opacity-90 mt-1">Daily averages from imported / saved data (same as Analysis overview)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!hasPoints ? (
            <p className="text-center text-gray-600 py-12">No data yet. Import or collect measurements, then open this again.</p>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={theme.primary}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Average</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Minimum</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.min(...chartData.map(d => d.value))}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Maximum</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.max(...chartData.map(d => d.value))}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Range</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value))}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisView = ({
  selectedMetric,
  setSelectedMetric,
  filters,
  theme,
  metricThemes,
  importedDataVersion,
  onImportedDataChanged,
  classStructure,
  workspaceId,
}) => {
  const isCo = selectedMetric === 'co';
  const CO_DECIMALS = 3;
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'compare'
  const [referenceLocation, setReferenceLocation] = useState(REFERENCE_LOCATIONS[0]?.name || 'Center City');
  const [seriesMode, setSeriesMode] = useState('points'); // daily | points — default session points
  const [openaqPoints, setOpenaqPoints] = useState(null);
  const [openaqMeta, setOpenaqMeta] = useState({ status: 'idle', message: '' });

  const imported = useMemo(
    () => getImportedMeasurements(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importedDataVersion]
  );

  useEffect(() => {
    if (!workspaceId) return undefined;
    let cancelled = false;
    (async () => {
      if (getImportedMeasurements().length > 0) return;
      try {
        const result = await getMeasurements(workspaceId, { limit: 10000 });
        if (cancelled) return;
        const mapped = workspaceMeasurementsToDisplayRows(result.measurements || []);
        if (mapped.length) {
          setImportedMeasurements(mapped);
          onImportedDataChanged?.();
        }
      } catch {
        /* keep empty state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, onImportedDataChanged]);
  const scopedData = useMemo(() => {
    const pool = imported.length ? imported : [];
    // Use isBlankHierarchyField on every hierarchy field so rows with empty
    // / "-" / "n/a" / placeholder values still count under any filter — this
    // matches the gating already applied below in classScopeData and was the
    // cause of "Analysis shows NO DATA even after a CSV import".
    return pool.filter((row) => {
      if (filters.school && !schoolsMatch(filters.school, row.school))
        return false;
      if (
        filters.instructor &&
        !isBlankHierarchyField(row.instructor) &&
        row.instructor !== filters.instructor
      )
        return false;
      if (filters.period && !periodsMatch(filters.period, row.period)) return false;
      if (filters.group && !groupsMatch(filters.group, row.group)) return false;
      return true;
    });
  }, [imported, filters]);

  const hasData = scopedData.length > 0;

  const classScopeData = useMemo(() => {
    return imported.filter((row) => {
      if (filters.school && !schoolsMatch(filters.school, row.school))
        return false;
      if (
        filters.instructor &&
        !isBlankHierarchyField(row.instructor) &&
        row.instructor !== filters.instructor
      )
        return false;
      if (filters.period && !periodsMatch(filters.period, row.period)) return false;
      return true;
    });
  }, [imported, filters.school, filters.instructor, filters.period]);

  const monthData = useMemo(() => {
    if (!scopedData.length) return [];
    const byDate = {};
    scopedData.forEach((row) => {
      const key = row.date;
      const value = Number(row[selectedMetric] ?? 0);
      if (!byDate[key]) byDate[key] = { sum: 0, count: 0 };
      byDate[key].sum += value;
      byDate[key].count += 1;
    });
    return Object.entries(byDate)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, agg]) => {
        const raw = agg.sum / agg.count;
        return {
          date,
          value: Number((isCo ? raw.toFixed(CO_DECIMALS) : raw.toFixed(2))),
        };
      });
  }, [scopedData, selectedMetric, isCo]);

  const weekData = useMemo(() => {
    if (!monthData.length) return [];
    return monthData.slice(-7).map((d) => ({
      day: new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value,
      date: d.date,
    }));
  }, [monthData]);

  const openaqByDate = useMemo(() => {
    if (!openaqPoints?.length) return null;
    return Object.fromEntries(openaqPoints.map((p) => [p.date, p.value]));
  }, [openaqPoints]);

  useEffect(() => {
    if (!weekData.length || !OPENAQ_REFERENCE_METRICS.includes(selectedMetric)) {
      setOpenaqPoints(null);
      setOpenaqMeta({ status: 'idle', message: '' });
      return;
    }
    const loc = REFERENCE_LOCATIONS.find((l) => l.name === referenceLocation);
    if (loc?.lat == null || loc?.lng == null) return;

    let cancelled = false;
    (async () => {
      setOpenaqMeta({ status: 'loading', message: '' });
      try {
        const dateFrom = weekData[0].date;
        const dateTo = weekData[weekData.length - 1].date;
        const q = new URLSearchParams({
          lat: String(loc.lat),
          lng: String(loc.lng),
          date_from: dateFrom,
          date_to: dateTo,
          metric: selectedMetric,
        });
        const data = await apiRequest(`/analytics/openaq/daily?${q.toString()}`);
        if (cancelled) return;
        if (data.error === 'no_sensor') {
          setOpenaqPoints(null);
          setOpenaqMeta({
            status: 'error',
            message: data.message || 'No OpenAQ sensor for this metric near the selected pin — using simulated reference.',
          });
          return;
        }
        setOpenaqPoints(data.points || []);
        const label = data.locationName ? `OpenAQ @ ${data.locationName}` : 'OpenAQ';
        setOpenaqMeta({ status: 'ok', message: label });
      } catch (e) {
        if (cancelled) return;
        setOpenaqPoints(null);
        setOpenaqMeta({
          status: 'error',
          message: e?.message || 'OpenAQ unavailable — using simulated reference.',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weekData, referenceLocation, selectedMetric]);

  /** Your week vs OpenAQ when a nearby sensor exists for this metric, else simulated reference. */
  const weekCompareData = useMemo(() => {
    if (!weekData.length) return [];
    const sim = getReferenceWeekSeries(referenceLocation, selectedMetric);
    return weekData.map((row, i) => {
      let reference;
      if (
        OPENAQ_REFERENCE_METRICS.includes(selectedMetric) &&
        openaqByDate &&
        openaqByDate[row.date] != null
      ) {
        reference = openaqByDate[row.date];
      } else {
        reference = sim[i]?.value ?? sim[sim.length - 1]?.value;
      }
      return {
        label: row.day,
        date: row.date,
        yours: row.value,
        reference,
      };
    });
  }, [weekData, referenceLocation, selectedMetric, openaqByDate]);

  const rowTimestampMs = (row) => {
    if (row.capturedAt) return new Date(row.capturedAt).getTime();
    return new Date(`${row.date || '1970-01-01'}T${row.time || '00:00'}`).getTime();
  };

  /** Overview + Quick Compare: all groups on one timeline vs reference (time-aligned session comparison). */
  const multiGroupWeekChart = useMemo(() => {
    const pool = classScopeData;
    if (!pool.length) {
      return { chartData: [], groups: [], groupAverages: {}, hasAnyLine: false };
    }

    const times = pool.map(rowTimestampMs).filter((t) => Number.isFinite(t));
    if (!times.length) {
      return { chartData: [], groups: [], groupAverages: {}, hasAnyLine: false };
    }

    let minTs = Math.min(...times);
    let maxTs = Math.max(...times);
    if (weekData.length) {
      const d0 = new Date(`${weekData[0].date}T00:00:00`).getTime();
      const d1 = new Date(`${weekData[weekData.length - 1].date}T23:59:59`).getTime();
      const clampedMin = Math.max(minTs, d0);
      const clampedMax = Math.min(maxTs, d1);
      if (clampedMin <= clampedMax) {
        minTs = clampedMin;
        maxTs = clampedMax;
      }
    }

    const period = filters.period || periodsFromClassStructure(classStructure)[0];
    let groups = groupsForPeriodFromStructure(classStructure, period);
    if (!groups.length) groups = ['G1', 'G2', 'G3', 'G4'];
    const fromData = [...new Set(pool.map((r) => normalizeGroupToken(r.group)).filter(Boolean))];
    groups = [...new Set([...groups, ...fromData])].sort((a, b) => {
      const na = Number(String(a).replace(/\D/g, '')) || 0;
      const nb = Number(String(b).replace(/\D/g, '')) || 0;
      return na - nb;
    });

    const byGroup = new Map();
    for (const g of groups) byGroup.set(g, []);
    for (const row of pool) {
      const g = normalizeGroupToken(row.group);
      if (!g || !groups.includes(g)) continue;
      const ts = rowTimestampMs(row);
      if (ts < minTs || ts > maxTs) continue;
      const value = Number(row[selectedMetric] ?? 0);
      if (!Number.isFinite(value)) continue;
      byGroup.get(g).push({ ts, value });
    }
    for (const g of groups) {
      byGroup.get(g).sort((a, b) => a.ts - b.ts);
    }

    const groupAverages = {};
    for (const g of groups) {
      const pts = byGroup.get(g);
      if (!pts.length) {
        groupAverages[g] = null;
        continue;
      }
      const raw = pts.reduce((s, p) => s + p.value, 0) / pts.length;
      groupAverages[g] = isCo ? Number(raw.toFixed(CO_DECIMALS)) : Math.round(raw);
    }

    const span = maxTs - minTs;
    const STEPS = span <= 0 ? 1 : Math.min(180, Math.max(48, Math.ceil(span / (45 * 60 * 1000))));
    const WINDOW_MS = 50 * 60 * 1000;

    const nearestInSorted = (pts, t) => {
      if (!pts.length) return null;
      let lo = 0;
      let hi = pts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].ts < t) lo = mid + 1;
        else hi = mid;
      }
      let best = lo;
      let bestD = Math.abs(pts[lo].ts - t);
      if (lo > 0) {
        const d = Math.abs(pts[lo - 1].ts - t);
        if (d < bestD) {
          best = lo - 1;
          bestD = d;
        }
      }
      if (lo < pts.length - 1) {
        const d = Math.abs(pts[lo + 1].ts - t);
        if (d < bestD) best = lo + 1;
      }
      if (Math.abs(pts[best].ts - t) > WINDOW_MS) return null;
      return pts[best].value;
    };

    const simRef = getReferenceWeekSeries(referenceLocation, selectedMetric);
    const refForLocalYmd = (ymd) => {
      if (
        OPENAQ_REFERENCE_METRICS.includes(selectedMetric) &&
        openaqByDate &&
        openaqByDate[ymd] != null
      ) {
        return openaqByDate[ymd];
      }
      if (weekData.length) {
        let bestI = 0;
        let bestAbs = Infinity;
        weekData.forEach((w, wi) => {
          const diff = Math.abs(new Date(`${w.date}T12:00:00`).getTime() - new Date(`${ymd}T12:00:00`).getTime());
          if (diff < bestAbs) {
            bestAbs = diff;
            bestI = wi;
          }
        });
        return simRef[bestI % simRef.length]?.value ?? simRef[simRef.length - 1]?.value;
      }
      return simRef[0]?.value ?? 0;
    };

    const chartData = [];
    for (let i = 0; i < STEPS; i++) {
      const t = STEPS <= 1 ? minTs : minTs + (span * i) / (STEPS - 1);
      const d = new Date(t);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const row = {
        label: d.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ts: t,
        reference: refForLocalYmd(ymd),
      };
      let any = false;
      for (const g of groups) {
        const v = nearestInSorted(byGroup.get(g), t);
        row[g] = v;
        if (v != null) any = true;
      }
      if (row.reference != null) any = true;
      if (any) chartData.push(row);
    }

    const hasAnyLine =
      chartData.some((r) => groups.some((g) => r[g] != null)) ||
      chartData.some((r) => r.reference != null);

    return { chartData, groups, groupAverages, hasAnyLine };
  }, [
    classScopeData,
    weekData,
    selectedMetric,
    referenceLocation,
    openaqByDate,
    filters.period,
    classStructure,
    isCo,
  ]);

  const pointSeries = useMemo(() => {
    if (!scopedData.length) return [];
    const points = scopedData
      .map((row) => {
        const ts = row.capturedAt
          ? new Date(row.capturedAt)
          : new Date(`${row.date || '1970-01-01'}T${row.time || '00:00'}`);
        const t = ts.getTime();
        const value = Number(row[selectedMetric] ?? 0);
        if (Number.isNaN(t) || !Number.isFinite(value)) return null;
        return {
          ts: t,
          label: ts.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          value,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);

    const MAX_POINTS = 700;
    if (points.length <= MAX_POINTS) return points;
    const step = Math.ceil(points.length / MAX_POINTS);
    return points.filter((_, idx) => idx % step === 0);
  }, [scopedData, selectedMetric]);

  const stats = useMemo(() => {
    const allValues = monthData.map((d) => Number(d.value));
    if (!allValues.length) return null;
    const rawAvg = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const avgValue = isCo ? Number(rawAvg.toFixed(CO_DECIMALS)) : Math.round(rawAvg);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const sortedValues = [...allValues].sort((a, b) => a - b);
    const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];
    const standardDeviation = Math.sqrt(
      allValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / allValues.length
    ).toFixed(2);
    return { avgValue, minValue, maxValue, medianValue, standardDeviation, allValues };
  }, [monthData, isCo]);

  const classAverage = useMemo(() => {
    const schoolRows = classScopeData;
    if (!schoolRows.length) return null;
    const rawAvg =
      schoolRows.reduce((sum, row) => sum + Number(row[selectedMetric] || 0), 0) / schoolRows.length;
    return isCo ? Number(rawAvg.toFixed(CO_DECIMALS)) : Math.round(rawAvg);
  }, [classScopeData, selectedMetric, isCo]);

  // City/reference average: uses the same OpenAQ/simulated reference line shown in Overview.
  const cityAverage = useMemo(() => {
    const refs = weekCompareData.map((d) => Number(d.reference)).filter((n) => Number.isFinite(n));
    if (!refs.length) return null;
    const rawAvg = refs.reduce((a, b) => a + b, 0) / refs.length;
    return isCo ? Number(rawAvg.toFixed(CO_DECIMALS)) : Math.round(rawAvg);
  }, [weekCompareData, isCo]);

  const workspaceGroupsForCompare = useMemo(() => {
    const p = filters.period || periodsFromClassStructure(classStructure)[0];
    const g = groupsForPeriodFromStructure(classStructure, p);
    if (g.length) return g;
    return ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  }, [classStructure, filters.period]);

  const comparisonSchoolCodes = useMemo(() => {
    const fromFile = [...new Set(imported.map((r) => r.school).filter(Boolean))];
    const merged = [...new Set([filters.school, ...fromFile, 'PHG01'])].filter(Boolean);
    return merged.sort();
  }, [imported, filters.school]);

  const avgValue = stats?.avgValue ?? 0;
  const minValue = stats?.minValue ?? 0;
  const maxValue = stats?.maxValue ?? 0;
  const medianValue = stats?.medianValue ?? 0;
  const standardDeviation = stats?.standardDeviation ?? '0';
  const allValues = stats?.allValues ?? [];

  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return isCo ? n.toFixed(CO_DECIMALS) : Math.round(n);
  };

  const chartYTickFmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '';
    return isCo ? n.toFixed(2) : String(Math.round(n));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Dashboard</h1>
          <p className="text-gray-600">Statistical analysis and trends</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasData}
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-lg ${
              hasData ? `${theme.bg} ${theme.hover} text-white` : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Compare Data
          </button>
          <button
            type="button"
            onClick={() => setShowTrendModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            View Trends
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200 inline-flex">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? `${theme.bg} text-white shadow-md`
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'compare'
              ? `${theme.bg} text-white shadow-md`
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🔄 Quick Compare
        </button>
      </div>

      {/* Metric Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Metric</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(metricThemes).map(([key, metric]) => (
            <button 
              key={key} 
              onClick={() => setSelectedMetric(key)}
              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                selectedMetric === key 
                  ? `${metric.bg} text-white shadow-lg scale-105` 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Content based on Active Tab */}
      {!hasData ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center max-w-2xl mx-auto">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No data for Analysis yet</h2>
          <p className="text-gray-600 mb-4">
            With your current filters, there are no measurements. Collect sessions in the field or import CSV on{' '}
            <strong>Raw Data</strong>, then come back here.
          </p>
          <p className="text-sm text-gray-500">
            We no longer show placeholder charts — the Analysis page only uses <strong>your</strong> workspace data.
            When you have data, you can compare it to a <strong>reference location trend</strong> (illustrative Philadelphia-area
            baselines for class discussion, not live regulatory feeds).
          </p>
        </div>
      ) : activeTab === 'overview' ? (
        <>
          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 transition-all" style={{ borderColor: theme.primary }}>
          <p className="text-sm font-semibold text-gray-600 mb-2">AVERAGE (MEAN)</p>
          <p className="text-4xl font-bold mb-1" style={{ color: theme.primary }}>{fmt(avgValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MEDIAN</p>
          <p className="text-4xl font-bold text-purple-600 mb-1">{fmt(medianValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MINIMUM</p>
          <p className="text-4xl font-bold text-green-600 mb-1">{fmt(minValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MAXIMUM</p>
          <p className="text-4xl font-bold text-orange-600 mb-1">{fmt(maxValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">STD DEVIATION</p>
          <p className="text-4xl font-bold text-indigo-600 mb-1">{standardDeviation}</p>
          <p className="text-sm text-gray-500">Variability</p>
        </div>
      </div>

      {/* Charts Grid — your recent week vs reference; your full series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 shadow-lg border-2 border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/50 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">All groups · this week vs city reference</h2>
              <p className="text-xs text-gray-600 mt-1.5 max-w-xl leading-relaxed">
                Colored lines = each team&apos;s <strong>session measurements</strong> (time-aligned). Thicker line = your
                current group filter. Gray dashed = <strong>Philadelphia reference</strong> (OpenAQ daily when available, else
                simulated) — not classroom data.
              </p>
              {OPENAQ_REFERENCE_METRICS.includes(selectedMetric) && openaqMeta.status === 'loading' && (
                <p className="text-xs text-blue-600 mt-1">Loading OpenAQ reference…</p>
              )}
              {OPENAQ_REFERENCE_METRICS.includes(selectedMetric) && openaqMeta.status === 'ok' && (
                <p className="text-xs text-green-700 mt-1">{openaqMeta.message}</p>
              )}
              {OPENAQ_REFERENCE_METRICS.includes(selectedMetric) && openaqMeta.status === 'error' && (
                <p className="text-xs text-amber-700 mt-1">{openaqMeta.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-gray-500" />
              <select
                value={referenceLocation}
                onChange={(e) => setReferenceLocation(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white max-w-[220px] shadow-sm"
              >
                {REFERENCE_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {multiGroupWeekChart.groups.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {multiGroupWeekChart.groups.map((g, idx) => {
                const avg = multiGroupWeekChart.groupAverages[g];
                const isYou = filters.group && normalizeGroupToken(filters.group) === g;
                const color = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];
                return (
                  <div
                    key={g}
                    className={`inline-flex items-baseline gap-2 rounded-xl px-3 py-2 text-xs font-semibold border shadow-sm ${
                      isYou ? 'border-2' : 'border'
                    }`}
                    style={{
                      borderColor: color,
                      background: isYou ? `${color}18` : 'white',
                    }}
                  >
                    <span className="uppercase tracking-wide text-gray-500">{g}</span>
                    <span style={{ color }}>{avg == null ? '—' : fmt(avg)}</span>
                    <span className="text-gray-400 font-medium">{metricThemes[selectedMetric].unit}</span>
                    <span className="text-[10px] text-gray-400 font-normal">avg</span>
                  </div>
                );
              })}
              {cityAverage != null && (
                <div className="inline-flex items-baseline gap-2 rounded-xl px-3 py-2 text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 shadow-sm">
                  <span className="uppercase tracking-wide text-slate-500">City ref</span>
                  <span>{fmt(cityAverage)}</span>
                  <span className="text-gray-400 font-medium">{metricThemes[selectedMetric].unit}</span>
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl bg-white/90 border border-gray-100 p-2 sm:p-3">
            {multiGroupWeekChart.hasAnyLine ? (
              <MultiGroupSessionCompareChart
                chartData={multiGroupWeekChart.chartData}
                groups={multiGroupWeekChart.groups}
                theme={theme}
                metricUnit={metricThemes[selectedMetric].unit}
                accentGroup={filters.group}
                fmt={fmt}
                isCo={isCo}
                height={340}
              />
            ) : weekCompareData.length ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Week window is set, but there aren&apos;t enough timestamped points per group yet. Import CSV with time, or
                widen filters.
              </p>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">Not enough dated points in this filter for a week chart.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your measurements over time</h2>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs text-gray-500">
              {seriesMode === 'daily'
                ? 'Daily average for the selected metric (all days in your current filter).'
                : 'Session points (downsampled) — all measurements in your current filter.'}
            </p>
            <select
              value={seriesMode}
              onChange={(e) => setSeriesMode(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="daily">Daily averages</option>
              <option value="points">Session points</option>
            </select>
          </div>
          {seriesMode === 'points' ? (
            pointSeries.length >= 2 ? (
              <div className="h-56 sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pointSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="label" stroke="#9CA3AF" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: '13px' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={chartYTickFmt}
                    domain={[
                      (dataMin) => {
                        const n = Number(dataMin);
                        if (!Number.isFinite(n)) return dataMin;
                        const pad = Math.max(1, Math.round(Math.abs(n) * 0.05));
                        return n - pad;
                      },
                      (dataMax) => {
                        const n = Number(dataMax);
                        if (!Number.isFinite(n)) return dataMax;
                        const pad = Math.max(1, Math.round(Math.abs(n) * 0.05));
                        return n + pad;
                      },
                    ]}
                    label={{
                      value: metricThemes[selectedMetric].unit,
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    formatter={(value) => fmt(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={`${metricThemes[selectedMetric].label} readings`}
                    stroke={theme.primary}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">Not enough points yet for a session chart.</p>
            )
          ) : monthData.length >= 2 ? (
            <div className="h-56 sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '13px' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={chartYTickFmt}
                  domain={[
                    (dataMin) => {
                      const n = Number(dataMin);
                      if (!Number.isFinite(n)) return dataMin;
                      const pad = Math.max(1, Math.round(Math.abs(n) * 0.05));
                      return n - pad;
                    },
                    (dataMax) => {
                      const n = Number(dataMax);
                      if (!Number.isFinite(n)) return dataMax;
                      const pad = Math.max(1, Math.round(Math.abs(n) * 0.05));
                      return n + pad;
                    },
                  ]}
                  label={{
                    value: metricThemes[selectedMetric].unit,
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '12px',
                  }}
                  formatter={(value) => fmt(value)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={`${metricThemes[selectedMetric].label} daily avg`}
                  stroke={theme.primary}
                  strokeWidth={2}
                  dot={{ fill: theme.primary, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">
              Add more days of data (or relax filters) to see a time series.
            </p>
          )}
        </div>
      </div>

      {/* Distribution Analysis */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Value Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { range: '0-10', count: allValues.filter(v => v >= 0 && v <= 10).length },
            { range: '11-15', count: allValues.filter(v => v > 10 && v <= 15).length },
            { range: '16-20', count: allValues.filter(v => v > 15 && v <= 20).length },
            { range: '21-25', count: allValues.filter(v => v > 20 && v <= 25).length },
            { range: '26+', count: allValues.filter(v => v > 25).length }
          ]}>
            <XAxis 
              dataKey="range" 
              stroke="#9CA3AF" 
              style={{ fontSize: '13px' }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9CA3AF" 
              style={{ fontSize: '13px' }} 
              tickLine={false}
              axisLine={false}
              label={{ value: metricThemes[selectedMetric].unit, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' } }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                padding: '12px'
              }} 
            />
            <Bar dataKey="count" fill={theme.primary} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Insights */}
      <div 
        className="rounded-2xl p-8 shadow-lg border-2"
        style={{ 
          background: `linear-gradient(135deg, ${theme.light} 0%, white 100%)`,
          borderColor: theme.primary
        }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistical Summary:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span style={{ color: theme.primary }}>•</span>
                <span>
                  Average {metricThemes[selectedMetric].label} is{' '}
                  <strong>
                    {fmt(avgValue)} {metricThemes[selectedMetric].unit}
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: theme.primary }}>•</span>
                <span>
                  Values range from <strong>{fmt(minValue)}</strong> to{' '}
                  <strong>
                    {fmt(maxValue)} {metricThemes[selectedMetric].unit}
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: theme.primary }}>•</span>
                <span>Standard deviation of <strong>{standardDeviation}</strong> indicates {parseFloat(standardDeviation) < avgValue * 0.3 ? 'consistent' : 'variable'} readings</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Observations:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Data collected over {allValues.length} time points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Median value of {fmt(medianValue)} shows central tendency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Use <strong>View Trends</strong> for the full daily series in a modal</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
        </>
      ) : (
        /* Quick Compare View */
        <div className="space-y-6">
          {/* Quick Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group Average */}
            <div className={`bg-white rounded-2xl p-6 shadow-lg border-2`} style={{ borderColor: theme.primary }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Group Average</h3>
                <span className={`px-3 py-1 ${theme.bg} text-white text-sm font-semibold rounded-full`}>
                  G{filters.group.replace('G', '')}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold mb-1" style={{ color: theme.primary }}>{fmt(avgValue)}</p>
                <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min</span>
                  <span className="font-semibold text-green-600">{fmt(minValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max</span>
                  <span className="font-semibold text-orange-600">{fmt(maxValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Range</span>
                  <span className="font-semibold text-gray-900">{fmt(maxValue - minValue)}</span>
                </div>
              </div>
            </div>

            {/* Class Average */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Class Average</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  All Groups
                </span>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold text-purple-600 mb-1">{classAverage == null ? 'NO DATA' : fmt(classAverage)}</p>
                {classAverage != null && (
                  <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-xs text-gray-500">
                  Average across all groups in your class period (same school + period in imported data).
                </p>
                <div className="flex justify-between">
                  <span className="text-gray-600">vs your group</span>
                  <span className="font-semibold text-gray-900">
                    {classAverage != null
                      ? avgValue <= classAverage
                        ? `${fmt(Math.abs(avgValue - classAverage))} lower`
                        : `${fmt(Math.abs(avgValue - classAverage))} higher`
                      : 'NO DATA'}
                  </span>
                </div>
              </div>
            </div>

            {/* City Average (reference) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">City Average</h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-semibold rounded-full">
                  Reference
                </span>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold text-slate-700 mb-1">{cityAverage == null ? 'NO DATA' : fmt(cityAverage)}</p>
                {cityAverage != null && (
                  <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-xs text-gray-500">
                  Philadelphia-area reference line from <strong>OpenAQ</strong> when available (else simulated). Not based on your classroom measurements.
                </p>
                <div className="flex justify-between">
                  <span className="text-gray-600">vs your group</span>
                  <span className="font-semibold text-gray-900">
                    {cityAverage != null
                      ? avgValue <= cityAverage
                        ? `${fmt(Math.abs(avgValue - cityAverage))} lower`
                        : `${fmt(Math.abs(avgValue - cityAverage))} higher`
                      : 'NO DATA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* All groups week comparison — same session chart as Overview */}
          <div className="rounded-2xl p-6 shadow-lg border-2 border-slate-200/80 bg-gradient-to-br from-violet-50/40 via-white to-teal-50/40">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your recent week comparison</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                  Default view: <strong>every group at once</strong> on a shared timeline (session-style points), plus each
                  team&apos;s <strong>average</strong> chips and the dashed <strong>city reference</strong> line (OpenAQ when
                  available, else simulated — not your classroom readings).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <MapPin className="w-4 h-4 text-gray-500" />
                <select
                  value={referenceLocation}
                  onChange={(e) => setReferenceLocation(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm max-w-[220px]"
                >
                  {REFERENCE_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {multiGroupWeekChart.groups.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {multiGroupWeekChart.groups.map((g, idx) => {
                  const avg = multiGroupWeekChart.groupAverages[g];
                  const isYou = filters.group && normalizeGroupToken(filters.group) === g;
                  const color = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];
                  return (
                    <div
                      key={g}
                      className={`inline-flex items-baseline gap-2 rounded-xl px-3 py-2 text-xs font-semibold border shadow-sm ${
                        isYou ? 'border-2' : 'border'
                      }`}
                      style={{
                        borderColor: color,
                        background: isYou ? `${color}18` : 'white',
                      }}
                    >
                      <span className="uppercase tracking-wide text-gray-500">{g}</span>
                      <span style={{ color }}>{avg == null ? '—' : fmt(avg)}</span>
                      <span className="text-gray-400 font-medium">{metricThemes[selectedMetric].unit}</span>
                    </div>
                  );
                })}
                {cityAverage != null && (
                  <div className="inline-flex items-baseline gap-2 rounded-xl px-3 py-2 text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 shadow-sm">
                    <span className="uppercase tracking-wide text-slate-500">City ref</span>
                    <span>{fmt(cityAverage)}</span>
                    <span className="text-gray-400 font-medium">{metricThemes[selectedMetric].unit}</span>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-xl bg-white/95 border border-gray-100 p-2 sm:p-3">
              {multiGroupWeekChart.hasAnyLine ? (
                <MultiGroupSessionCompareChart
                  chartData={multiGroupWeekChart.chartData}
                  groups={multiGroupWeekChart.groups}
                  theme={theme}
                  metricUnit={metricThemes[selectedMetric].unit}
                  accentGroup={filters.group}
                  fmt={fmt}
                  isCo={isCo}
                  height={360}
                />
              ) : (
                <p className="text-sm text-gray-500 py-12 text-center">
                  Add timestamped measurements for more than one group this week to see a full comparison chart.
                </p>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-lg border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Quick read</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>
                    <strong>Your group</strong> average for this metric: {fmt(avgValue)}{' '}
                    {metricThemes[selectedMetric].unit}.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>
                    {classAverage != null
                      ? `Class-wide (same period) average is ${fmt(classAverage)} ${metricThemes[selectedMetric].unit}.`
                      : 'Class average needs more imported rows (other groups in the same period).'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-lg border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Compare further</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    On <strong>Overview</strong>, the left card <strong>All groups · this week vs city reference</strong>{' '}
                    shows the same multi-team session view with Philadelphia reference context.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    The large chart above always overlays <strong>every group</strong> (thicker stroke = your current group
                    filter) plus the dashed city reference line.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA for Full Comparison */}
          <div className={`bg-gradient-to-r ${theme.bg} ${theme.hover} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Want to explore more comparisons?</h3>
                <p className="text-sm opacity-90">Compare with other schools, locations, and time periods</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-md"
              >
                Reference locations tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ComparisonModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        selectedMetric={selectedMetric}
        theme={theme}
        metricThemes={metricThemes}
        currentFilters={filters}
        workspaceGroups={workspaceGroupsForCompare}
        comparisonSchoolCodes={comparisonSchoolCodes}
      />

      <TrendModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        selectedMetric={selectedMetric}
        theme={theme}
        metricThemes={metricThemes}
        dailyData={monthData}
      />
    </div>
  );
};

export default AnalysisView;