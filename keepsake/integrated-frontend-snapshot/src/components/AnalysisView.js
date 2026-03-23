import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, X } from 'lucide-react';
import { getImportedMeasurements } from '../utils/importedData';

const generateWeekData = (metric) => {
  const baseData = {
    pm25: [10, 12, 15, 20, 17, 13, 11],
    co: [0.4, 0.5, 0.6, 0.8, 0.7, 0.5, 0.3],
    temp: [18, 20, 22, 21, 19, 17, 18], // Celsius
    humidity: [45, 42, 50, 55, 48, 40, 38]
  };
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    value: baseData[metric][i]
  }));
};

const generateMonthData = (metric) => {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 5
    });
  }
  return data;
};

const ComparisonModal = ({ isOpen, onClose, selectedMetric, theme, metricThemes, currentFilters }) => {
  const [comparisonType, setComparisonType] = useState('group'); // 'group', 'school', 'location', 'time'
  const [selectedGroups, setSelectedGroups] = useState(['G4', 'G5', 'G6']);
  const [selectedSchools, setSelectedSchools] = useState(['MTN12', 'MTN15', 'BRK08']);
  const [selectedLocations, setSelectedLocations] = useState(['Upper Manhattan', 'Midtown', 'Lower Manhattan']);
  const [timeRange, setTimeRange] = useState('week');

  if (!isOpen) return null;

  // Generate comparison data based on type
  const getComparisonData = () => {
    switch (comparisonType) {
      case 'group':
        return selectedGroups.map(group => ({
          name: `Group ${group.replace('G', '')}`,
          values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5),
          avg: Math.floor(Math.random() * 20) + 5,
          color: group === 'G4' ? theme.primary : group === 'G5' ? '#8B5CF6' : '#10B981'
        }));
      case 'school':
        return selectedSchools.map((school, idx) => ({
          name: school,
          values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5),
          avg: Math.floor(Math.random() * 20) + 5,
          color: ['#3B82F6', '#8B5CF6', '#10B981'][idx]
        }));
      case 'location':
        return selectedLocations.map((loc, idx) => ({
          name: loc,
          values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5),
          avg: Math.floor(Math.random() * 20) + 5,
          color: ['#3B82F6', '#EF4444', '#10B981'][idx]
        }));
      case 'time':
        return [
          {
            name: 'This Week',
            values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5),
            avg: Math.floor(Math.random() * 20) + 5,
            color: theme.primary
          },
          {
            name: 'Last Week',
            values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5),
            avg: Math.floor(Math.random() * 20) + 5,
            color: '#9CA3AF'
          }
        ];
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
                  {['G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(group => (
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
                  {['MTN12', 'MTN15', 'BRK08', 'QNS20', 'BRX03'].map(school => (
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
                  {['Upper Manhattan', 'Midtown', 'Lower Manhattan', 'Central Park', 'East Village', 'Chelsea'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocationSelection(loc)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLocations.includes(loc)
                          ? `${theme.bg} text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
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

          {/* Comparison Chart */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparison Visualization</h4>
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
                    padding: '12px'
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
                  {comparisonData.map((item, idx) => {
                    const min = Math.min(...item.values);
                    const max = Math.max(...item.values);
                    const trend = item.values[item.values.length - 1] > item.values[0] ? 'increasing' : 'decreasing';
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
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
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Highest average: <strong>{comparisonData.reduce((max, item) => item.avg > max.avg ? item : max).name}</strong> ({comparisonData.reduce((max, item) => item.avg > max.avg ? item : max).avg} {metricThemes[selectedMetric].unit})</li>
              <li>• Lowest average: <strong>{comparisonData.reduce((min, item) => item.avg < min.avg ? item : min).name}</strong> ({comparisonData.reduce((min, item) => item.avg < min.avg ? item : min).avg} {metricThemes[selectedMetric].unit})</li>
              <li>• Range across groups: {Math.max(...comparisonData.map(d => d.avg)) - Math.min(...comparisonData.map(d => d.avg))} {metricThemes[selectedMetric].unit}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendModal = ({ isOpen, onClose, selectedMetric, theme, metricThemes }) => {
  const [aggregation, setAggregation] = useState('daily');
  
  if (!isOpen) return null;

  const getChartData = () => {
    switch(aggregation) {
      case 'hourly':
        return Array.from({ length: 24 }, (_, i) => ({
          label: `${i}:00`,
          value: Math.floor(Math.random() * 20) + 5
        }));
      case 'daily':
        return generateMonthData(selectedMetric);
      case 'weekly':
        return generateWeekData(selectedMetric);
      case 'monthly':
        return Array.from({ length: 12 }, (_, i) => ({
          label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          value: Math.floor(Math.random() * 20) + 5
        }));
      default:
        return [];
    }
  };

  const chartData = getChartData();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`${theme.bg} text-white p-6 rounded-t-2xl flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-bold">Trend Analysis - {metricThemes[selectedMetric].label}</h3>
            <p className="text-sm opacity-90 mt-1">Detailed time-series visualization</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Aggregation Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Time Aggregation</label>
            <div className="flex gap-2">
              {['hourly', 'daily', 'weekly', 'monthly'].map((agg) => (
                <button
                  key={agg}
                  onClick={() => setAggregation(agg)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    aggregation === agg
                      ? `${theme.bg} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {agg.charAt(0).toUpperCase() + agg.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
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
                  dataKey={aggregation === 'daily' ? 'date' : 'label'} 
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

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
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
        </div>
      </div>
    </div>
  );
};

const AnalysisView = ({ selectedMetric, setSelectedMetric, filters, theme, metricThemes, importedDataVersion }) => {
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'compare'

  const imported = useMemo(() => {
    void importedDataVersion;
    return getImportedMeasurements();
  }, [importedDataVersion]);
  const scopedData = useMemo(() => {
    const pool = imported.length ? imported : [];
    return pool.filter((row) => {
      if (filters.school && row.school && row.school !== filters.school) return false;
      if (filters.instructor && row.instructor && row.instructor !== filters.instructor) return false;
      if (filters.period && row.period && row.period !== filters.period) return false;
      if (filters.group && row.group && row.group !== filters.group) return false;
      return true;
    });
  }, [imported, filters]);

  const monthData = useMemo(() => {
    if (!scopedData.length) return generateMonthData(selectedMetric);
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
      .map(([date, agg]) => ({ date, value: Number((agg.sum / agg.count).toFixed(2)) }));
  }, [scopedData, selectedMetric]);

  const weekData = useMemo(() => {
    if (!monthData.length) return generateWeekData(selectedMetric);
    return monthData.slice(-7).map((d) => ({
      day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value,
    }));
  }, [monthData, selectedMetric]);

  // Calculate statistics
  const allValues = monthData.map(d => Number(d.value));
  const avgValue = Math.round(allValues.reduce((sum, val) => sum + val, 0) / allValues.length);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const sortedValues = [...allValues].sort((a, b) => a - b);
  const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];
  const standardDeviation = Math.sqrt(
    allValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / allValues.length
  ).toFixed(2);

  const classAverage = useMemo(() => {
    const schoolRows = imported.filter((row) => row.school === filters.school && row.period === filters.period);
    if (!schoolRows.length) return avgValue + 2;
    return Math.round(
      schoolRows.reduce((sum, row) => sum + Number(row[selectedMetric] || 0), 0) / schoolRows.length
    );
  }, [imported, filters.school, filters.period, selectedMetric, avgValue]);

  const schoolAverage = useMemo(() => {
    const schoolRows = imported.filter((row) => row.school === filters.school);
    if (!schoolRows.length) return avgValue + 4;
    return Math.round(
      schoolRows.reduce((sum, row) => sum + Number(row[selectedMetric] || 0), 0) / schoolRows.length
    );
  }, [imported, filters.school, selectedMetric, avgValue]);

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
            onClick={() => setShowCompareModal(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${theme.bg} ${theme.hover} text-white rounded-lg transition-all shadow-lg`}
          >
            <TrendingUp className="w-4 h-4" />
            Compare Data
          </button>
          <button
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
      {activeTab === 'overview' ? (
        <>
          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 transition-all" style={{ borderColor: theme.primary }}>
          <p className="text-sm font-semibold text-gray-600 mb-2">AVERAGE (MEAN)</p>
          <p className="text-4xl font-bold mb-1" style={{ color: theme.primary }}>{avgValue}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MEDIAN</p>
          <p className="text-4xl font-bold text-purple-600 mb-1">{Math.round(medianValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MINIMUM</p>
          <p className="text-4xl font-bold text-green-600 mb-1">{Math.round(minValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">MAXIMUM</p>
          <p className="text-4xl font-bold text-orange-600 mb-1">{Math.round(maxValue)}</p>
          <p className="text-sm text-gray-500">{metricThemes[selectedMetric].unit}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">STD DEVIATION</p>
          <p className="text-4xl font-bold text-indigo-600 mb-1">{standardDeviation}</p>
          <p className="text-sm text-gray-500">Variability</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">7-Day Trend</h2>
            <div className="flex items-center gap-2">
              {avgValue > 15 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Above Average</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Below Average</span>
                </>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="colorWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
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
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={theme.primary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWeek)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 30-Day Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">30-Day Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthData}>
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
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={theme.primary}
                strokeWidth={2}
                dot={{ fill: theme.primary, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
                <span>Average {metricThemes[selectedMetric].label} is <strong>{avgValue} {metricThemes[selectedMetric].unit}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: theme.primary }}>•</span>
                <span>Values range from <strong>{Math.round(minValue)}</strong> to <strong>{Math.round(maxValue)} {metricThemes[selectedMetric].unit}</strong></span>
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
                <span>Median value of {Math.round(medianValue)} shows central tendency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Click "View Detailed Trends" for time-based analysis</span>
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
            {/* Your Group */}
            <div className={`bg-white rounded-2xl p-6 shadow-lg border-2`} style={{ borderColor: theme.primary }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Your Group</h3>
                <span className={`px-3 py-1 ${theme.bg} text-white text-sm font-semibold rounded-full`}>
                  G{filters.group.replace('G', '')}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold mb-1" style={{ color: theme.primary }}>{avgValue}</p>
                <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min</span>
                  <span className="font-semibold text-green-600">{Math.round(minValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max</span>
                  <span className="font-semibold text-orange-600">{Math.round(maxValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Range</span>
                  <span className="font-semibold text-gray-900">{Math.round(maxValue - minValue)}</span>
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
                <p className="text-4xl font-bold text-purple-600 mb-1">{classAverage}</p>
                <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Groups</span>
                  <span className="font-semibold text-gray-900">6 total</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Ranking</span>
                  <span className="font-semibold text-purple-600">#3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">vs Class</span>
                  <span className="font-semibold text-green-600">
                    {avgValue <= classAverage
                      ? `${Math.abs(avgValue - classAverage)} better`
                      : `${Math.abs(avgValue - classAverage)} higher`}
                  </span>
                </div>
              </div>
            </div>

            {/* School Average */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">School Average</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                  {filters.school}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold text-blue-600 mb-1">{schoolAverage}</p>
                <p className="text-sm text-gray-600">{metricThemes[selectedMetric].unit}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Classes</span>
                  <span className="font-semibold text-gray-900">4 total</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold text-gray-900">{filters.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">vs School</span>
                  <span className="font-semibold text-green-600">
                    {avgValue <= schoolAverage
                      ? `${Math.abs(avgValue - schoolAverage)} better`
                      : `${Math.abs(avgValue - schoolAverage)} higher`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Group Comparison - Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={weekData.map((d) => ({
                day: d.day,
                'Your Group': d.value,
                'Class Avg': classAverage,
                'School Avg': schoolAverage
              }))}>
                <XAxis 
                  dataKey="day" 
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
                <Legend />
                <Line type="monotone" dataKey="Your Group" stroke={theme.primary} strokeWidth={3} dot={{ fill: theme.primary, r: 5 }} />
                <Line type="monotone" dataKey="Class Avg" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#9CA3AF', r: 4 }} />
                <Line type="monotone" dataKey="School Avg" stroke="#3B82F6" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#3B82F6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-lg border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🎯 Your Strengths</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Your group's readings differ by <strong>{Math.abs(avgValue - classAverage)} {metricThemes[selectedMetric].unit}</strong> from class average</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>More consistent measurements (lower variability)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Trending in a positive direction this week</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-lg border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Observations</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Group 2 shows similar patterns to your measurements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>School-wide average is higher - explore why in the comparison tool</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Thursday showed highest readings across all groups</span>
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
                onClick={() => setShowCompareModal(true)}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-md"
              >
                Open Comparison Tool
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
      />

      <TrendModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        selectedMetric={selectedMetric}
        theme={theme}
        metricThemes={metricThemes}
      />
    </div>
  );
};

export default AnalysisView;