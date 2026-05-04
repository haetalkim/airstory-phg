import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  Filter, X, Download, Link as LinkIcon, Share2,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, MapPin, Calendar as CalendarIcon
} from 'lucide-react';

const METRICS = {
  pm25: { label: 'PM 2.5', unit: 'µg/m³', key: 'pm25' },
  co: { label: 'CO', unit: 'ppm', key: 'co' },
  temp: { label: 'Temperature', unit: '°F', key: 'temp' },
  humidity: { label: 'Humidity', unit: '%', key: 'humidity' }
};

const AQI_RANGES = {
  pm25: [
    { max: 12, label: 'Good', color: '#A7E8B1' },
    { max: 35, label: 'Moderate', color: '#FFF3B0' },
    { max: 55, label: 'Unhealthy (Sensitive)', color: '#FFD6A5' },
    { max: 150, label: 'Unhealthy', color: '#FFB8B8' },
    { max: Infinity, label: 'Very Unhealthy', color: '#DDA0DD' },
  ],
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const getColorForValue = (value, metric = 'pm25') => {
  const ranges = AQI_RANGES[metric] || AQI_RANGES.pm25;
  for (let range of ranges) {
    if (value <= range.max) return range.color;
  }
  return ranges[ranges.length - 1].color;
};

const generateCalendarData = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendar = [];
  let week = new Array(7).fill(null);

  for (let i = 0; i < startingDayOfWeek; i++) {
    week[i] = null;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
    week[dayOfWeek] = {
      day,
      pm25: null,
      co: null,
      temp: null,
      humidity: null,
      date: new Date(year, month, day),
    };

    if (dayOfWeek === 6 || day === daysInMonth) {
      calendar.push([...week]);
      week = new Array(7).fill(null);
    }
  }

  return calendar;
};

const Dashboard = ({ activeView, setActiveView, selectedMetric, setSelectedMetric, filters, setFilters, reflection, setReflection }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showReflection, setShowReflection] = useState(false);

  const today = new Date();
  const calendarData = generateCalendarData(currentYear, currentMonth);
  const allDaysData = calendarData.flat().filter((d) => d !== null);
  const metricSeries = allDaysData
    .map((d) => d[selectedMetric])
    .filter((v) => v != null && !Number.isNaN(Number(v)))
    .map((v) => Number(v));
  const hasMonthMetric = metricSeries.length > 0;
  const avgValue = hasMonthMetric
    ? Math.round(metricSeries.reduce((sum, v) => sum + v, 0) / metricSeries.length)
    : 0;

  const getViewLabel = () => {
    const g = filters.group || '';
    const groupLabel = g.startsWith('G') ? g.replace('G', '') : g || '—';
    return `${filters.studentId || '—'} - ${filters.school || '—'} - Group ${groupLabel}`;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDownloadData = () => alert('Data download will be implemented');
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const weekData = [];

  const monthData = metricSeries;
  const minValue = hasMonthMetric ? Math.min(...monthData) : 0;
  const maxValue = hasMonthMetric ? Math.max(...monthData) : 0;
  const sortedMonth = hasMonthMetric ? [...monthData].sort((a, b) => a - b) : [];
  const medianValue = hasMonthMetric ? sortedMonth[Math.floor(sortedMonth.length / 2)] : 0;
  const standardDeviation = hasMonthMetric
    ? Math.sqrt(
        monthData.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / monthData.length
      ).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Air Quality Data</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Viewing: {getViewLabel()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowFilters(true)} 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
            >
              <Filter className="w-5 h-5" />
              Compare Data
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('heatmap')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeView === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Heat Map
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeView === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'heatmap' ? (
          <>
            {/* GEOGRAPHIC HEATMAP VIEW */}
            {/* Metric Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Metric to Display</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button 
                    onClick={handleDownloadData}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(METRICS).map(([key, metric]) => (
                  <button 
                    key={key} 
                    onClick={() => setSelectedMetric(key)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedMetric === key 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map and Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Map - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Philadelphia overview</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Philadelphia, PA</span>
                  </div>
                </div>

                <div
                  className="relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-slate-100 px-6 text-center"
                  style={{ minHeight: '500px' }}
                >
                  <MapPin className="mb-3 h-10 w-10 text-sky-600" aria-hidden />
                  <p className="text-lg font-semibold text-gray-900">Map view: use Heat Map in the app toolbar</p>
                  <p className="mt-2 max-w-lg text-sm text-gray-600">
                    Live OpenAQ points and the Google heat map are centered on Philadelphia. This classroom dashboard no longer shows a decorative SVG with fake readings.
                  </p>
                  <div className="absolute bottom-4 left-4 rounded-lg bg-white p-4 shadow-lg">
                    <p className="mb-2 text-xs font-semibold text-gray-700">PM 2.5 index (legend)</p>
                    <div className="space-y-1">
                      {AQI_RANGES.pm25.slice(0, -1).map((range, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="h-3 w-6 rounded" style={{ backgroundColor: range.color }} />
                          <span className="text-xs text-gray-600">{range.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                  Aggregated maps in the Heat Map view protect exact GPS paths while still showing regional patterns.
                </p>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Current Average */}
                <div
                  className="rounded-2xl bg-white p-6 shadow-lg"
                  style={{
                    background: hasMonthMetric
                      ? `linear-gradient(135deg, ${getColorForValue(avgValue)}30 0%, white 100%)`
                      : undefined,
                  }}
                >
                  <p className="text-sm font-semibold text-gray-600 mb-2">CITY AVERAGE</p>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-bold text-gray-900">{hasMonthMetric ? avgValue : '—'}</span>
                    <span className="text-xl text-gray-600 mb-2">{METRICS[selectedMetric].unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasMonthMetric ? (
                      <span
                        className="rounded-full px-3 py-1 text-sm font-semibold"
                        style={{ backgroundColor: getColorForValue(avgValue), color: '#1F2937' }}
                      >
                        {avgValue <= 12 ? 'Good' : avgValue <= 35 ? 'Moderate' : 'Unhealthy'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                        No sample data
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-2">BEST AREA</p>
                  <p className="mb-1 text-3xl font-bold text-green-600">{hasMonthMetric ? Math.round(minValue) : '—'}</p>
                  <p className="text-sm text-gray-600">{hasMonthMetric ? 'Lowest day in grid (no place labels)' : 'Connect measurements'}</p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-2">NEEDS ATTENTION</p>
                  <p className="mb-1 text-3xl font-bold text-orange-600">{hasMonthMetric ? Math.round(maxValue) : '—'}</p>
                  <p className="text-sm text-gray-600">{hasMonthMetric ? 'Highest day in grid' : 'No readings yet'}</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-2">DAYS IN MONTH</p>
                  <p className="mb-1 text-3xl font-bold text-blue-600">{allDaysData.length}</p>
                  <p className="text-sm text-gray-600">Calendar days (metric empty until data is linked)</p>
                </div>
              </div>
            </div>

            {/* Location List */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current Reading</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                        No location rows. Use Raw Data or the Heat Map for Philadelphia sensor listings and OpenAQ points.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time Series for Selected Area */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Trend - City Average</h2>
              {weekData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-500 px-4 text-center">
                  No weekly trend data in this preview. Import class measurements or open the Heat Map for Philadelphia OpenAQ trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bottom Row - Reflection and Educational Fact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Reflection Card */}
              <div className="bg-gradient-to-br from-purple-50 via-white to-white rounded-2xl p-8 shadow-lg border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💭</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Weekly Reflection</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      What patterns do you notice in the city's air quality data?
                    </p>
                    {showReflection ? (
                      <div>
                        <textarea
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          placeholder="Share your thoughts and observations..."
                          className="w-full p-4 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none"
                          rows="4"
                        />
                        <button
                          onClick={() => {
                            setShowReflection(false);
                            alert('Reflection saved!');
                          }}
                          className="mt-3 px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                        >
                          Save Reflection
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReflection(true)}
                        className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                      >
                        Add Reflection
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Educational Card */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-white rounded-2xl p-8 shadow-lg border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Did You Know?</h3>
                    <p className="text-sm text-blue-800 leading-relaxed mb-4">
                      PM 2.5 particles are 30× smaller than a human hair — they can travel deep into your lungs and enter your bloodstream. Dense corridors like Center City often show higher readings from traffic and buildings.
                    </p>
                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      Learn more about air quality
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ANALYTICS VIEW */}
            {/* Metric Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Metric</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button 
                    onClick={handleDownloadData}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(METRICS).map(([key, metric]) => (
                  <button 
                    key={key} 
                    onClick={() => setSelectedMetric(key)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedMetric === key 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Average */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">AVERAGE (MEAN)</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">{avgValue}</p>
                <p className="text-sm text-gray-500">{METRICS[selectedMetric].unit}</p>
              </div>

              {/* Median */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">MEDIAN</p>
                <p className="text-4xl font-bold text-purple-600 mb-1">{Math.round(medianValue)}</p>
                <p className="text-sm text-gray-500">{METRICS[selectedMetric].unit}</p>
              </div>

              {/* Min */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">MINIMUM</p>
                <p className="text-4xl font-bold text-green-600 mb-1">{Math.round(minValue)}</p>
                <p className="text-sm text-gray-500">{METRICS[selectedMetric].unit}</p>
              </div>

              {/* Max */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">MAXIMUM</p>
                <p className="text-4xl font-bold text-orange-600 mb-1">{Math.round(maxValue)}</p>
                <p className="text-sm text-gray-500">{METRICS[selectedMetric].unit}</p>
              </div>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Standard Deviation */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">STANDARD DEVIATION</p>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{standardDeviation}</p>
                <p className="text-sm text-gray-500">Variability measure</p>
              </div>

              {/* Range */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">RANGE</p>
                <p className="text-3xl font-bold text-teal-600 mb-1">{Math.round(maxValue - minValue)}</p>
                <p className="text-sm text-gray-500">{METRICS[selectedMetric].unit} spread</p>
              </div>

              {/* Days Recorded */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 mb-2">DAYS RECORDED</p>
                <p className="text-3xl font-bold text-gray-700 mb-1">{allDaysData.length}</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Trend</h2>
                {weekData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-sm text-gray-500 px-4 text-center">
                    No weekly series until measurements are linked to this dashboard view.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weekData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Quality Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Air Quality Distribution</h2>
                <div className="space-y-4">
                  {AQI_RANGES.pm25.slice(0, -1).map((range, idx) => {
                    const count = allDaysData.filter((d) => {
                      const val = d[selectedMetric];
                      if (val == null || Number.isNaN(Number(val))) return false;
                      const prevMax = idx > 0 ? AQI_RANGES.pm25[idx - 1].max : 0;
                      return val > prevMax && val <= range.max;
                    }).length;
                    const denom =
                      allDaysData.filter((d) => {
                        const val = d[selectedMetric];
                        return val != null && !Number.isNaN(Number(val));
                      }).length || 1;
                    const percentage = ((count / denom) * 100).toFixed(1);
                    
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{range.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{count} days ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: range.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Insights */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Monthly Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Findings:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {!hasMonthMetric ? (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>No metric values for this month in this preview. Link workspace or CSV data to populate analytics.</span>
                      </li>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Average {METRICS[selectedMetric].label} was <strong>{avgValue} {METRICS[selectedMetric].unit}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Values ranged from <strong>{Math.round(minValue)}</strong> to <strong>{Math.round(maxValue)} {METRICS[selectedMetric].unit}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Standard deviation of <strong>{standardDeviation}</strong> indicates {parseFloat(standardDeviation) < avgValue * 0.3 ? 'consistent' : 'variable'} readings</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommendations:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Continue monitoring daily for trends</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Compare with other groups in your area</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Note any patterns related to weather or activities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setShowFilters(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">View Data From</h2>
              <button 
                onClick={() => setShowFilters(false)} 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Current User Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">Currently Logged In As</p>
                <p className="text-sm font-semibold text-green-900">
                  {filters.studentId || '—'} - {filters.school || '—'} - Group {(filters.group || '—').replace(/^G/, '') || '—'}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-4">Compare with data from other locations:</p>
              </div>

              {/* Country Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select 
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              {/* State/Province Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
                <select 
                  value={filters.state}
                  onChange={(e) => setFilters({...filters, state: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="PA">Pennsylvania</option>
                  <option value="NY">New York</option>
                  <option value="CA">California</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>

              {/* School/Site Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School/Site Code</label>
                <input 
                  type="text"
                  value={filters.school}
                  onChange={(e) => setFilters({...filters, school: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Enter school code"
                />
              </div>

              {/* Class/Group Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class/Group</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFilters({...filters, group: `G${num}`})}
                      className={`py-3 rounded-lg text-sm font-medium transition-all ${
                        filters.group === `G${num}`
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      G{num}
                    </button>
                  ))}
                </div>
                <button
                  className="mt-2 w-full py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                >
                  <span className="text-lg">+</span>
                  <span>More Groups</span>
                </button>
              </div>

              {/* Student ID to Compare */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID to View</label>
                <input 
                  type="text"
                  value={filters.studentId}
                  onChange={(e) => setFilters({...filters, studentId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Enter student ID"
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank to view group average</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button 
                onClick={() => setShowFilters(false)} 
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                View Selected Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;