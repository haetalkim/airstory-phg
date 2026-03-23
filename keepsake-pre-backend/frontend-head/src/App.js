import React, { useState } from "react";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [activeView, setActiveView] = useState("heatmap");
  const [selectedMetric, setSelectedMetric] = useState("pm25");
  const [filters, setFilters] = useState({
    country: "US",
    state: "NY",
    school: "MTN12",
    group: "G4",
    studentId: "STU003",
  });
  const [reflection, setReflection] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                AIR <span className="font-normal">@</span>TAMGU
              </h1>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{filters.studentId}</p>
                <p className="text-xs text-gray-500">{filters.school} - Group {filters.group.replace('G', '')}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{filters.studentId.slice(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Dashboard
        activeView={activeView}
        setActiveView={setActiveView}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        filters={filters}
        setFilters={setFilters}
        reflection={reflection}
        setReflection={setReflection}
      />
    </div>
  );
}


