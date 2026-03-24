import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import HeatMapDashboard from "./components/HeatMapDashboard";
import RawDataView from "./components/RawDataView";
import AnalysisView from "./components/AnalysisView";
import MyPage from "./components/MyPage";
import ManageClasses from "./components/ManageClasses";
import { MapPin, Table, BarChart3, User, LogOut, Users } from "lucide-react";
import { login as loginApi, register as registerApi, getMe, logout as logoutApi } from "./api/auth";
import { getStoredAuth } from "./api/http";

// Metric configurations with colors
// Using a colorblind-friendly palette with similar blue/teal tones
// Distinguishable by saturation and lightness rather than hue
const METRIC_THEMES = {
  pm25: {
    label: 'PM 2.5',
    unit: 'µg/m³',
    key: 'pm25',
    primary: '#0EA5E9', // sky blue - medium saturation
    light: '#E0F2FE',
    gradient: 'from-sky-500 to-sky-700',
    bg: 'bg-sky-600',
    hover: 'hover:bg-sky-700',
    text: 'text-sky-600',
    border: 'border-sky-200'
  },
  co: {
    label: 'CO',
    unit: 'ppm',
    key: 'co',
    primary: '#0284C7', // darker blue - higher saturation
    light: '#BAE6FD',
    gradient: 'from-sky-600 to-sky-800',
    bg: 'bg-sky-700',
    hover: 'hover:bg-sky-800',
    text: 'text-sky-700',
    border: 'border-sky-300'
  },
  temp: {
    label: 'Temperature',
    unit: '°C',
    key: 'temp',
    primary: '#06B6D4', // cyan - medium saturation
    light: '#CFFAFE',
    gradient: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-600',
    hover: 'hover:bg-cyan-700',
    text: 'text-cyan-600',
    border: 'border-cyan-200'
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    key: 'humidity',
    primary: '#0891B2', // teal - darker, more saturated
    light: '#A5F3FC',
    gradient: 'from-cyan-600 to-cyan-800',
    bg: 'bg-cyan-700',
    hover: 'hover:bg-cyan-800',
    text: 'text-cyan-700',
    border: 'border-cyan-300'
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getStoredAuth()?.accessToken));
  const [activeSection, setActiveSection] = useState("heatmap");
  const [selectedMetric, setSelectedMetric] = useState("pm25");
  const [isPublicMode] = useState(false); // Public mode is off when we have a landing/login
  const [workspaceId, setWorkspaceId] = useState(getStoredAuth()?.user?.workspaceId || "");
  const [userRole, setUserRole] = useState("student");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [importedDataVersion, setImportedDataVersion] = useState(0);
  const [filters, setFilters] = useState({
    country: "US",
    state: "NY",
    school: "MTN12",
    instructor: "Shim",
    period: "P1",
    group: "G4",
    studentId: "STU003",
  });

  // Handle auto-login for specific user if needed, or just let the landing page handle it
  const handleLogin = async ({ email, password }) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const session = await loginApi(email, password);
      let me = null;
      try {
        me = await getMe();
      } catch {
        // Render cold starts can make /auth/me briefly fail after login.
        // Keep the user logged in using the login payload and hydrate profile later.
      }
      const membership = me?.memberships?.[0] || null;
      const profile = me?.profile || null;
      setWorkspaceId(session?.user?.workspaceId || membership?.workspace_id || "");
      setUserRole(membership?.role || "student");
      setIsLoggedIn(true);
      setActiveSection((membership?.role === "teacher" || membership?.role === "owner") ? "manageclasses" : "heatmap");
      setFilters((prev) => ({
        ...prev,
        school: profile?.school_code ?? prev.school,
        instructor: profile?.instructor ?? prev.instructor,
        period: profile?.period ?? prev.period,
        group: profile?.group_code ?? prev.group,
        studentId: profile?.student_code || email.split("@")[0].toUpperCase(),
      }));
    } catch (error) {
      setAuthError(error.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async ({ email, password, fullName, mode, period, group }) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const auth = getStoredAuth();
      const session = await registerApi({
        email,
        password,
        fullName,
        workspaceName: mode === "student" ? "Demo Sensor Platform Workspace" : `${fullName || "User"} Workspace`,
        role: mode === "teacher" ? "teacher" : "student",
        schoolCode: filters.school,
        instructor: filters.instructor,
        period: period || filters.period,
        groupCode: group || filters.group,
        studentCode: email.split("@")[0].toUpperCase(),
        joinWorkspaceId: auth?.user?.workspaceId || undefined,
      });
      let me = null;
      try {
        me = await getMe();
      } catch {
        // Keep newly registered users signed in even if profile fetch is delayed.
      }
      const membership = me?.memberships?.[0] || null;
      const profile = me?.profile || null;
      setWorkspaceId(session?.user?.workspaceId || membership?.workspace_id || "");
      setUserRole(membership?.role || "student");
      setIsLoggedIn(true);
      setActiveSection((membership?.role === "teacher" || membership?.role === "owner") ? "manageclasses" : "heatmap");
      setFilters((prev) => ({
        ...prev,
        school: profile?.school_code ?? prev.school,
        instructor: profile?.instructor ?? prev.instructor,
        period: profile?.period ?? prev.period,
        group: profile?.group_code ?? prev.group,
        studentId: profile?.student_code || email.split("@")[0].toUpperCase(),
      }));
    } catch (error) {
      setAuthError(error.message || "Sign up failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API errors and still clear local UI session.
    } finally {
      setIsLoggedIn(false);
      setWorkspaceId("");
      setUserRole("student");
      setActiveSection("heatmap");
      setAuthError("");
    }
  };

  const currentTheme = METRIC_THEMES[selectedMetric];

  const isTeacher = userRole === "teacher" || userRole === "owner";
  const navItems = isTeacher
    ? [
        { id: 'manageclasses', label: 'Manage Classes', icon: Users },
        { id: 'heatmap', label: 'Heat Map', icon: MapPin },
        { id: 'rawdata', label: 'Raw Data', icon: Table },
        { id: 'analysis', label: 'Analysis', icon: BarChart3 },
        { id: 'mypage', label: 'My Page', icon: User },
      ]
    : [
        { id: 'heatmap', label: 'Heat Map', icon: MapPin },
        { id: 'rawdata', label: 'Raw Data', icon: Table },
        { id: 'analysis', label: 'Analysis', icon: BarChart3 },
        { id: 'mypage', label: 'My Page', icon: User },
      ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100"
           style={{
             backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }}
      >
        <div className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 sticky top-0 z-50" />
        <main className="min-h-screen flex flex-col justify-center py-12">
          <LandingPage
            onLogin={handleLogin}
            onRegister={handleRegister}
            filters={filters}
            authError={authError}
            authLoading={authLoading}
          />
        </main>
        <footer className="py-8 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
          <p>ABC • TAMGU LAB @TC</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <button
              type="button"
              onClick={() => setActiveSection('heatmap')}
              className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity"
              aria-label="Go to Heat Map"
            >
              <img 
                src="/logo.svg" 
                alt="ABC" 
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{display: 'none'}}>
                ABC
              </h1>
            </button>

            {/* Main Navigation */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeSection === item.id
                        ? `bg-blue-600 text-white shadow-lg`
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* User Info - Only show if not in public mode */}
            {!isPublicMode && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                    {isTeacher ? (filters.instructor || "Instructor") : filters.studentId}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isTeacher
                      ? `${filters.school} • Teacher Portal`
                      : `${filters.school} - Group ${filters.group.replace('G', '')}`}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-white text-sm font-semibold">
                    {isTeacher ? "T" : filters.studentId.slice(3)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeSection === 'heatmap' && (
          <HeatMapDashboard
            workspaceId={workspaceId}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            filters={filters}
            setFilters={setFilters}
            theme={currentTheme}
            metricThemes={METRIC_THEMES}
            importedDataVersion={importedDataVersion}
          />
        )}
        {activeSection === 'rawdata' && (
          <RawDataView
            workspaceId={workspaceId}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            filters={filters}
            setFilters={setFilters}
            theme={currentTheme}
            metricThemes={METRIC_THEMES}
            onImportedDataChanged={() => setImportedDataVersion((v) => v + 1)}
          />
        )}
        {activeSection === 'analysis' && (
          <AnalysisView
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            filters={filters}
            theme={currentTheme}
            metricThemes={METRIC_THEMES}
            importedDataVersion={importedDataVersion}
          />
        )}
        {activeSection === 'mypage' && (
          <MyPage
            workspaceId={workspaceId}
            userRole={userRole}
            filters={filters}
            setFilters={setFilters}
            theme={currentTheme}
            onLogout={handleLogout}
          />
        )}
        {activeSection === 'manageclasses' && isTeacher && (
          <ManageClasses workspaceId={workspaceId} theme={currentTheme} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 Project ABC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}