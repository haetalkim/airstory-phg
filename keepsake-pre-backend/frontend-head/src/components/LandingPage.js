import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Calendar, MapPin, Wind, Activity, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';

const LandingPage = ({ selectedMetric, setSelectedMetric, reflection, setReflection }) => {
  const [showReflection, setShowReflection] = useState(false);

  // Sample data for the week
  const weekData = [
    { day: 'Mon', date: 'Nov 4', pm25: 12, co: 0.4, temp: 68, humidity: 45 },
    { day: 'Tue', date: 'Nov 5', pm25: 8, co: 0.3, temp: 70, humidity: 42 },
    { day: 'Wed', date: 'Nov 6', pm25: 15, co: 0.5, temp: 72, humidity: 50 },
    { day: 'Thu', date: 'Nov 7', pm25: 22, co: 0.7, temp: 71, humidity: 55 },
    { day: 'Fri', date: 'Nov 8', pm25: 18, co: 0.6, temp: 69, humidity: 48 },
    { day: 'Sat', date: 'Nov 9', pm25: 9, co: 0.3, temp: 67, humidity: 40 },
    { day: 'Sun', date: 'Nov 10', pm25: 7, co: 0.2, temp: 68, humidity: 38 }
  ];

  const avgPM25 = Math.round(weekData.reduce((sum, d) => sum + d.pm25, 0) / weekData.length);
  const lastWeekAvg = 9;
  const trend = avgPM25 - lastWeekAvg;
  const overallAQI = avgPM25 <= 12 ? 'Good' : avgPM25 <= 35 ? 'Moderate' : 'Unhealthy';
  const overallColor = avgPM25 <= 12 ? '#A7E8B1' : avgPM25 <= 35 ? '#FFF3B0' : '#FFD6A5';

  const getMetricData = () => weekData.map((d) => ({ day: d.day, value: d[selectedMetric] }));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                <Activity className="w-4 h-4" />
                Real-time Air Quality Monitoring
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Breathe Easy with <span className="text-blue-200">Real Data</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Monitor air quality in real-time, analyze trends, and make informed decisions for a healthier environment.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  View Demo
                </button>
              </div>
              <div className="flex items-center gap-8 mt-12">
                <div>
                  <p className="text-3xl font-bold">250+</p>
                  <p className="text-blue-200 text-sm">Active Stations</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-blue-200 text-sm">Daily Readings</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">98%</p>
                  <p className="text-blue-200 text-sm">Accuracy</p>
                </div>
              </div>
            </div>

            {/* Right Column - Current Status Card */}
            <div className="lg:mt-0">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Air Quality</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-bold text-gray-900">{avgPM25}</span>
                      <span className="text-xl text-gray-500">µg/m³</span>
                    </div>
                  </div>
                  <div className="text-6xl">
                    {overallAQI === 'Good' ? '😊' : overallAQI === 'Moderate' ? '😐' : '😷'}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="px-4 py-2 rounded-full text-base font-semibold"
                    style={{ backgroundColor: overallColor, color: "#1F2937" }}
                  >
                    {overallAQI}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {trend < 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">{Math.abs(trend)} lower</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span className="text-orange-600 font-medium">{trend} higher</span>
                      </>
                    )}
                    <span>than last week</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>New York, NY</span>
                    </div>
                    <span className="text-gray-400">Updated 3 min ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TAMGU Air?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive air quality monitoring with advanced analytics and educational resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Monitoring</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Track PM 2.5, CO, temperature, and humidity levels with live updates every minute.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant alerts</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Historical data</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Multi-sensor network</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Driven</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Collaborate with schools and communities to improve local air quality together.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Group analytics</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Share insights</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Compare regions</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Educational Resources</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Learn about air quality, health impacts, and how to make a positive environmental impact.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Daily facts</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Reflections</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Action tips</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Visualization Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Live Data Dashboard</h2>
            <p className="text-xl text-gray-600">Visualize trends and patterns in air quality metrics</p>
          </div>

          {/* Metric Selector */}
          <div className="flex justify-center gap-3 mb-12">
            {[
              { key: "pm25", label: "PM 2.5", icon: Wind },
              { key: "co", label: "CO" },
              { key: "temp", label: "Temperature" },
              { key: "humidity", label: "Humidity" },
            ].map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedMetric === metric.key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                }`}
              >
                {metric.icon && <metric.icon className="w-4 h-4" />}
                {metric.label}
              </button>
            ))}
          </div>

          {/* Chart and Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart - 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">7-Day Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMetricData()}>
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
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    dot={{ fill: '#3B82F6', r: 6 }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Cards */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100">
                <p className="text-sm text-gray-600 mb-1">Best Reading</p>
                <p className="text-3xl font-bold text-green-600">7</p>
                <p className="text-xs text-gray-500 mt-1">Sunday</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100">
                <p className="text-sm text-gray-600 mb-1">Worst Reading</p>
                <p className="text-3xl font-bold text-orange-600">22</p>
                <p className="text-xs text-gray-500 mt-1">Thursday</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                <p className="text-sm text-gray-600 mb-1">Weekly Average</p>
                <p className="text-3xl font-bold text-blue-600">{avgPM25}</p>
                <p className="text-xs text-gray-500 mt-1">PM 2.5 µg/m³</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Monitoring Today
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of schools and communities making data-driven decisions for cleaner air.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
              Create Free Account
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;