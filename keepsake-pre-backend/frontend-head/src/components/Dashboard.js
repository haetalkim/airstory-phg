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
    const pm25 = Math.floor(Math.random() * 25) + 3;
    const co = (Math.random() * 0.8 + 0.2).toFixed(2);
    const temp = Math.floor(Math.random() * 15) + 60;
    const humidity = Math.floor(Math.random() * 30) + 35;

    week[dayOfWeek] = {
      day,
      pm25,
      co: parseFloat(co),
      temp,
      humidity,
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
  const avgValue = Math.round(
    allDaysData.reduce((sum, d) => sum + d[selectedMetric], 0) / allDaysData.length
  );

  const getViewLabel = () => {
    return `${filters.studentId} - ${filters.school} - Group ${filters.group.replace('G', '')}`;
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

  // Weekly data for line chart - dynamic based on selected metric
  const generateWeekData = () => {
    const baseData = [
      { day: 'Mon', pm25: 10, co: 0.4, temp: 68, humidity: 45 },
      { day: 'Tue', pm25: 12, co: 0.5, temp: 70, humidity: 42 },
      { day: 'Wed', pm25: 15, co: 0.6, temp: 72, humidity: 50 },
      { day: 'Thu', pm25: 20, co: 0.8, temp: 71, humidity: 55 },
      { day: 'Fri', pm25: 17, co: 0.7, temp: 69, humidity: 48 },
      { day: 'Sat', pm25: 13, co: 0.5, temp: 67, humidity: 40 },
      { day: 'Sun', pm25: 11, co: 0.3, temp: 68, humidity: 38 },
    ];
    return baseData.map(d => ({ day: d.day, value: d[selectedMetric] }));
  };

  const weekData = generateWeekData();

  const trend = avgValue - 12;

  // Analytics calculations
  const monthData = allDaysData.map(d => d[selectedMetric]);
  const minValue = Math.min(...monthData);
  const maxValue = Math.max(...monthData);
  const medianValue = monthData.sort((a, b) => a - b)[Math.floor(monthData.length / 2)];
  const standardDeviation = Math.sqrt(
    monthData.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / monthData.length
  ).toFixed(2);

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
                  <span>Last updated: 22:00 Nov 5 2025</span>
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
                  <h2 className="text-lg font-semibold text-gray-900">Manhattan Air Quality Map</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>New York, NY</span>
                  </div>
                </div>
                
                {/* Map Container */}
                <div className="relative bg-gradient-to-br from-blue-50 to-gray-100 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                  {/* Simplified Manhattan Map */}
                  <svg viewBox="0 0 400 800" className="w-full h-full">
                    {/* Manhattan outline (simplified) */}
                    <path
                      d="M 150 50 L 180 100 L 190 200 L 200 300 L 210 400 L 220 500 L 230 600 L 240 700 L 220 750 L 180 720 L 150 700 L 130 600 L 120 500 L 110 400 L 100 300 L 110 200 L 120 100 Z"
                      fill="#f0f0f0"
                      stroke="#888"
                      strokeWidth="2"
                    />
                    
                    {/* Heat map data points */}
                    {[
                      { name: 'Upper Manhattan', x: 155, y: 150, value: 8 },
                      { name: 'Central Park', x: 165, y: 280, value: 12 },
                      { name: 'Midtown', x: 175, y: 380, value: 22 },
                      { name: 'Chelsea', x: 170, y: 480, value: 18 },
                      { name: 'Greenwich Village', x: 165, y: 550, value: 15 },
                      { name: 'Lower Manhattan', x: 160, y: 680, value: 10 },
                      { name: 'East Side', x: 200, y: 400, value: 20 },
                      { name: 'West Side', x: 140, y: 420, value: 14 },
                    ].map((location, idx) => {
                      const color = getColorForValue(location.value);
                      const radius = 35;
                      
                      return (
                        <g key={idx}>
                          {/* Heat circle with gradient */}
                          <circle
                            cx={location.x}
                            cy={location.y}
                            r={radius}
                            fill={color}
                            opacity="0.6"
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <title>{location.name}: {location.value} {METRICS[selectedMetric].unit}</title>
                          </circle>
                          {/* Data point */}
                          <circle
                            cx={location.x}
                            cy={location.y}
                            r="8"
                            fill="white"
                            stroke={color}
                            strokeWidth="3"
                            className="cursor-pointer"
                          />
                          {/* Value label */}
                          <text
                            x={location.x}
                            y={location.y + 4}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="#333"
                          >
                            {location.value}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Air Quality Index</p>
                    <div className="space-y-1">
                      {AQI_RANGES.pm25.slice(0, -1).map((range, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div 
                            className="w-6 h-3 rounded"
                            style={{ backgroundColor: range.color }}
                          />
                          <span className="text-xs text-gray-600">{range.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  * Heat map shows aggregated data to protect location privacy
                </p>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Current Average */}
                <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${getColorForValue(avgValue)}30 0%, white 100%)` }}>
                  <p className="text-sm font-semibold text-gray-600 mb-2">CITY AVERAGE</p>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-bold text-gray-900">{avgValue}</span>
                    <span className="text-xl text-gray-600 mb-2">{METRICS[selectedMetric].unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ backgroundColor: getColorForValue(avgValue), color: "#1F2937" }}
                    >
                      {avgValue <= 12 ? 'Good' : avgValue <= 35 ? 'Moderate' : 'Unhealthy'}
                    </span>
                  </div>
                </div>

                {/* Best Location */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-lg border border-green-100">
                  <p className="text-sm font-semibold text-gray-600 mb-2">BEST AREA</p>
                  <p className="text-3xl font-bold text-green-600 mb-1">8</p>
                  <p className="text-sm text-gray-600">Upper Manhattan</p>
                </div>

                {/* Worst Location */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-lg border border-orange-100">
                  <p className="text-sm font-semibold text-gray-600 mb-2">NEEDS ATTENTION</p>
                  <p className="text-3xl font-bold text-orange-600 mb-1">22</p>
                  <p className="text-sm text-gray-600">Midtown Area</p>
                </div>

                {/* Active Stations */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-lg border border-blue-100">
                  <p className="text-sm font-semibold text-gray-600 mb-2">ACTIVE STATIONS</p>
                  <p className="text-3xl font-bold text-blue-600 mb-1">8</p>
                  <p className="text-sm text-gray-600">Monitoring locations</p>
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
                    {[
                      { name: 'Upper Manhattan', value: 8, trend: 'down' },
                      { name: 'Lower Manhattan', value: 10, trend: 'down' },
                      { name: 'Central Park Area', value: 12, trend: 'stable' },
                      { name: 'West Side', value: 14, trend: 'up' },
                      { name: 'Greenwich Village', value: 15, trend: 'stable' },
                      { name: 'Chelsea', value: 18, trend: 'up' },
                      { name: 'East Side', value: 20, trend: 'up' },
                      { name: 'Midtown', value: 22, trend: 'up' },
                    ].map((location, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{location.name}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold text-gray-900">{location.value} {METRICS[selectedMetric].unit}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: getColorForValue(location.value), color: "#1F2937" }}
                          >
                            {location.value <= 12 ? 'Good' : location.value <= 35 ? 'Moderate' : 'Unhealthy'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {location.trend === 'down' && (
                              <>
                                <TrendingDown className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">Improving</span>
                              </>
                            )}
                            {location.trend === 'up' && (
                              <>
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                <span className="text-xs text-orange-600 font-medium">Worsening</span>
                              </>
                            )}
                            {location.trend === 'stable' && (
                              <span className="text-xs text-gray-600 font-medium">Stable</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time Series for Selected Area */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Trend - City Average</h2>
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
                      PM 2.5 particles are 30× smaller than a human hair — they can travel deep into your lungs and enter your bloodstream. Urban areas like Midtown often have higher readings due to vehicle traffic and building density.
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
              </div>

              {/* Quality Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Air Quality Distribution</h2>
                <div className="space-y-4">
                  {AQI_RANGES.pm25.slice(0, -1).map((range, idx) => {
                    const count = allDaysData.filter(d => {
                      const val = d[selectedMetric];
                      const prevMax = idx > 0 ? AQI_RANGES.pm25[idx - 1].max : 0;
                      return val > prevMax && val <= range.max;
                    }).length;
                    const percentage = ((count / allDaysData.length) * 100).toFixed(1);
                    
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
                  {filters.studentId} - {filters.school} - Group {filters.group.replace('G', '')}
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