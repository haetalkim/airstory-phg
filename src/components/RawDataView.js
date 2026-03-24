import React, { useState } from 'react';
import { Download, Filter, Search, Calendar, ChevronDown, TrendingUp, TrendingDown, Info, ChevronRight, Image as ImageIcon, X, Upload } from 'lucide-react';
import { addMeasurementEdit, getMeasurements, importCsvMeasurements } from '../api/data';
import {
  clearImportedMeasurements,
  getImportedMeasurements,
  parseImportedCsv,
  parseImportedCsvRaw,
  setImportedMeasurements,
} from '../utils/importedData';

const INDOOR_OUTDOOR_OPTIONS = ['INDOOR', 'OUTDOOR'];

const RawDataView = ({
  workspaceId,
  viewerProfile,
  selectedMetric,
  setSelectedMetric,
  filters,
  setFilters,
  theme,
  metricThemes,
  onImportedDataChanged,
}) => {
  const [rawData, setRawData] = useState(getImportedMeasurements());
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [importError, setImportError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [dateFilter, setDateFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  
  // Hierarchy Filters
  const [selectedSchool, setSelectedSchool] = useState(filters.school || '');
  const [selectedInstructor, setSelectedInstructor] = useState(filters.instructor || '');
  const [selectedPeriod, setSelectedPeriod] = useState(filters.period || '');
  const [selectedGroup, setSelectedGroup] = useState(filters.group || '');

  const [currentPage, setCurrentPage] = useState(1);
  const [editingNotes, setEditingNotes] = useState(null);
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [editedCells, setEditedCells] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const itemsPerPage = 50;

  const groupRowsForDisplay = React.useCallback((rows) => {
    const byChunk = new Map();
    rows.forEach((row) => {
      const captured = row.capturedAt ? new Date(row.capturedAt) : new Date(`${row.date}T${row.time || '00:00'}`);
      if (Number.isNaN(captured.getTime())) return;
      const minuteBucket = new Date(captured);
      minuteBucket.setSeconds(0, 0);
      const key = [
        row.sessionId,
        row.location,
        row.latitude,
        row.longitude,
        row.school,
        row.instructor,
        row.period,
        row.group,
        row.indoorOutdoor,
        minuteBucket.toISOString(),
      ].join('|');

      if (!byChunk.has(key)) {
        byChunk.set(key, {
          ...row,
          id: `chunk-${row.id}`,
          date: minuteBucket.toISOString().split('T')[0],
          time: minuteBucket.toTimeString().slice(0, 5),
          capturedAt: minuteBucket.toISOString(),
          count: 0,
          pm25Sum: 0,
          coSum: 0,
          tempSum: 0,
          humiditySum: 0,
          detailedData: [],
        });
      }
      const agg = byChunk.get(key);
      agg.count += 1;
      agg.pm25Sum += Number(row.pm25) || 0;
      agg.coSum += Number(row.co) || 0;
      agg.tempSum += Number(row.temp) || 0;
      agg.humiditySum += Number(row.humidity) || 0;
      agg.detailedData.push({
        id: row.id,
        time: captured.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pm25: Number(row.pm25) || 0,
        co: Number((Number(row.co) || 0).toFixed(2)),
        temp: Number(row.temp) || 0,
        humidity: Number(row.humidity) || 0,
      });
    });

    return Array.from(byChunk.values())
      .map((agg) => ({
        ...agg,
        pm25: Math.round(agg.pm25Sum / Math.max(agg.count, 1)),
        co: (agg.coSum / Math.max(agg.count, 1)).toFixed(2),
        temp: Math.round(agg.tempSum / Math.max(agg.count, 1)),
        humidity: Math.round(agg.humiditySum / Math.max(agg.count, 1)),
        detailedData: agg.detailedData.sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function loadFromBackend() {
      if (!workspaceId) return;
      setLoadingBackend(true);
      try {
        const result = await getMeasurements(workspaceId, { limit: 1000 });
        if (cancelled) return;
        const nonDemoMeasurements = (result.measurements || []).filter((m) => {
          const code = String(m.session_code || "").toUpperCase();
          return !code.startsWith("DEMO-");
        });
        const mappedRaw = nonDemoMeasurements.map((m) => ({
          id: m.id,
          date: new Date(m.captured_at).toISOString().split('T')[0],
          time: new Date(m.captured_at).toTimeString().slice(0, 8),
          sessionId: m.session_id || m.session_code || 'SESSION',
          sessionName: m.session_name || m.session_code || 'Session',
          sessionNotes: m.session_notes || '',
          location: m.location_name || 'Unknown',
          latitude: m.latitude ?? 40.78,
          longitude: m.longitude ?? -73.96,
          indoorOutdoor: m.indoor_outdoor || 'OUTDOOR',
          school: m.school_code || '',
          instructor: m.instructor || '',
          period: m.period || '',
          group: m.group_code || '',
          pm25: Number(m.edits?.pm25?.editedValue ?? m.pm25 ?? 0),
          co: Number(m.edits?.co?.editedValue ?? m.co ?? 0).toFixed(2),
          temp: Number(m.edits?.temp?.editedValue ?? m.temp ?? 0),
          humidity: Number(m.edits?.humidity?.editedValue ?? m.humidity ?? 0),
          photos: [],
          edits: m.edits || {},
          capturedAt: new Date(m.captured_at).toISOString(),
        }));
        const mapped = groupRowsForDisplay(mappedRaw);
        if (mapped.length) {
          setRawData(mapped);
          setImportedMeasurements(mapped);
          onImportedDataChanged?.();
        }
      } catch {
        // Fall back to imported CSV data when backend is unavailable.
      } finally {
        if (!cancelled) setLoadingBackend(false);
      }
    }
    loadFromBackend();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, onImportedDataChanged, groupRowsForDisplay]);

  React.useEffect(() => {
    setSelectedSchool(filters.school || '');
    setSelectedInstructor(filters.instructor || '');
    setSelectedPeriod(filters.period || '');
    setSelectedGroup(filters.group || '');
  }, [filters.school, filters.instructor, filters.period, filters.group]);

  // Get unique locations, sessions, groups, and schools
  const locations = [...new Set(rawData.map(d => d.location))];
  const sessions = [...new Set(rawData.map(d => d.sessionId))].map(id => {
    const session = rawData.find(d => d.sessionId === id);
    return { id, name: session.sessionName };
  });
  
  const allSchools = [...new Set(rawData.map((d) => d.school).filter(Boolean))].sort();
  const allInstructors = [...new Set(
    rawData
      .filter((d) => !selectedSchool || d.school === selectedSchool)
      .map((d) => d.instructor)
      .filter(Boolean)
  )].sort();
  const allPeriods = [...new Set(
    rawData
      .filter((d) => (!selectedSchool || d.school === selectedSchool) && (!selectedInstructor || d.instructor === selectedInstructor))
      .map((d) => d.period)
      .filter(Boolean)
  )].sort();
  const allGroups = [...new Set(
    rawData
      .filter(
        (d) =>
          (!selectedSchool || d.school === selectedSchool) &&
          (!selectedInstructor || d.instructor === selectedInstructor) &&
          (!selectedPeriod || d.period === selectedPeriod)
      )
      .map((d) => d.group)
      .filter(Boolean)
  )].sort();

  // Filter data
  let filteredData = rawData.filter(row => {
    const matchesSearch = 
      row.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${row.latitude}, ${row.longitude}`.includes(searchTerm) ||
      row.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.date.includes(searchTerm) ||
      row.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.period.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || row.location === locationFilter;
    const matchesSession = sessionFilter === 'all' || row.sessionId === sessionFilter;
    
    const matchesSchool = !selectedSchool || row.school === selectedSchool;
    const matchesInstructor = !selectedInstructor || row.instructor === selectedInstructor;
    const matchesPeriod = !selectedPeriod || row.period === selectedPeriod;
    const matchesGroup = !selectedGroup || row.group === selectedGroup;
    
    const matchesDate = () => {
      if (dateFilter === 'all') return true;
      const rowDate = new Date(row.date);
      const today = new Date();
      
      switch(dateFilter) {
        case 'today':
          return rowDate.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rowDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return rowDate >= monthAgo;
        default:
          return true;
      }
    };
    
    return matchesSearch && matchesLocation && matchesSession && matchesDate() && 
           matchesSchool && matchesInstructor && matchesPeriod && matchesGroup;
  });

  // Sort data
  if (sortConfig.key) {
    filteredData.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle numeric values
      if (sortConfig.key === 'pm25' || sortConfig.key === 'co' || sortConfig.key === 'temp' || sortConfig.key === 'humidity') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  React.useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Date', 'Time', 'Session ID', 'Session Name', 'School', 'Class (Instructor)', 'Period', 'Group', 'Location', 'Latitude', 'Longitude', 'INDOOR/OUTDOOR', 'PM 2.5 (µg/m³)', 'CO (ppm)', 'Temperature (°C)', 'Humidity (%)'];
    
    // Generate full second-by-second data for export
    const rows = [];
    filteredData.forEach(row => {
      const detailed = generateDetailedData(row);
      detailed.forEach(second => {
        rows.push([
          `${row.date} ${second.time}`,
      row.date,
          second.time,
      row.sessionId,
      row.sessionName,
          row.school,
          row.instructor,
          row.period,
          row.group,
      row.location,
          row.latitude,
          row.longitude,
          row.indoorOutdoor,
          second.pm25,
          second.co,
          second.temp,
          second.humidity
        ]);
      });
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Construct filename: air-quality-data-YYYY-MM-DD-SCHOOL-CLASS-PERIOD-GROUP.csv
    const dateStr = new Date().toISOString().split('T')[0];
    const schoolStr = selectedSchool || filters.school || 'ALL';
    const instructorStr = selectedInstructor || filters.instructor || 'ALL';
    const periodStr = selectedPeriod || filters.period || 'ALL';
    const groupStr = selectedGroup || filters.group || 'ALL';
    
    a.download = `air-quality-data-${dateStr}-${schoolStr}-${instructorStr}-${periodStr}-${groupStr}.csv`;
    a.click();
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rawRows = parseImportedCsvRaw(text);
      const imported = parseImportedCsv(text);
      if (workspaceId && rawRows.length) {
        await importCsvMeasurements(
          workspaceId,
          rawRows.map((r) => ({
            capturedAt: r.capturedAt,
            sessionCode: r.sessionId,
            sessionName: r.sessionName,
            sessionNotes: r.sessionNotes || '',
            location: r.location || '',
            school: r.school || '',
            instructor: r.instructor || '',
            period: r.period || '',
            group: r.group || '',
            indoorOutdoor: r.indoorOutdoor || 'OUTDOOR',
            latitude: Number.isFinite(Number(r.latitude)) ? Number(r.latitude) : null,
            longitude: Number.isFinite(Number(r.longitude)) ? Number(r.longitude) : null,
            pm25: Number(r.pm25) || 0,
            co: Number(r.co) || 0,
            temp: Number(r.temp) || 0,
            humidity: Number(r.humidity) || 0,
          }))
        );
      }
      setRawData(imported);
      setImportError('');
      setImportedMeasurements(imported);
      onImportedDataChanged?.();
    } catch (error) {
      setImportError(error.message || 'Failed to import CSV.');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearImportedData = () => {
    clearImportedMeasurements();
    setRawData([]);
    onImportedDataChanged?.();
  };

  const markEdited = (rowIds, field) => {
    setEditedCells(prev => {
      const updated = { ...prev };
      rowIds.forEach(id => {
        updated[id] = {
          ...(updated[id] || {}),
          [field]: true
        };
      });
      return updated;
    });
  };

  const handleSessionNotesEdit = (rowId, newNotes) => {
    setRawData(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, sessionNotes: newNotes }
        : row
    ));
    markEdited([rowId], 'sessionNotes');
    setEditingNotes(null);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  const FIELD_FORMATTERS = {
    pm25: (value) => Math.max(0, parseInt(value || 0, 10)),
    temp: (value) => Math.round(value || 0),
    humidity: (value) => Math.min(100, Math.max(0, Math.round(value || 0))),
    co: (value) => parseFloat(value || 0).toFixed(2),
    indoorOutdoor: (value) => value
  };

  const handleFieldEdit = (rowId, field, value) => {
    const formatter = FIELD_FORMATTERS[field] || ((v) => v);
    const formattedValue = formatter(value);

    setRawData(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, [field]: formattedValue }
          : row
      )
    );

    markEdited([rowId], field);
    if (workspaceId && ['pm25', 'co', 'temp', 'humidity'].includes(field)) {
      addMeasurementEdit(workspaceId, rowId, {
        fieldName: field,
        editedValue: Number(formattedValue),
        editNote: 'Dashboard manual correction',
      }).catch(() => {
        // Keep UI responsive even if backend edit write fails.
      });
    }

    setEditingCell({ rowId: null, field: null });
  };

  const isEdited = (rowId, field) => editedCells[rowId]?.[field];

  // Generate detailed second-by-second data for a row
  const generateDetailedData = (row) => {
    if (Array.isArray(row.detailedData) && row.detailedData.length > 0) {
      return row.detailedData;
    }
    const detailed = [];
    const baseTime = new Date(`${row.date}T${row.time}`);
    // Generate 60 seconds of data (1 minute of readings)
    for (let i = 0; i < 60; i++) {
      const time = new Date(baseTime.getTime() + i * 1000);
      detailed.push({
        id: `${row.id}-${i}`,
        time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pm25: Math.max(0, row.pm25 + Math.floor(Math.random() * 5) - 2),
        co: parseFloat((parseFloat(row.co) + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        temp: row.temp + Math.floor(Math.random() * 3) - 1,
        humidity: Math.max(0, Math.min(100, row.humidity + Math.floor(Math.random() * 5) - 2))
      });
    }
    return detailed;
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Raw Data</h1>
          <p className="text-gray-600">
            Complete dataset with all measurements {workspaceId ? '(backend/import)' : '(import CSV to begin)'}
          </p>
          {loadingBackend && <p className="text-xs text-gray-500 mt-1">Loading backend data...</p>}
          {importError && <p className="text-xs text-red-600 mt-1">{importError}</p>}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />
          </label>
          <button
            onClick={handleClearImportedData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
          >
            Clear Data
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" />
            How to Use Raw Data
          </button>
        <button 
          onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        </div>
      </div>

      {/* Team/Group Hierarchy Selectors */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Team Data</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Select School, Class, Period, and Group to view specific data</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* School Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">School</label>
            <select
              value={selectedSchool}
              onChange={(e) => {
                const nextSchool = e.target.value;
                setSelectedSchool(nextSchool);
                setSelectedInstructor('');
                setSelectedPeriod('');
                setSelectedGroup('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select School</option>
              {allSchools.map(s => <option key={s} value={s}>{s === viewerProfile?.school ? `${s} (My School)` : s}</option>)}
            </select>
          </div>

          {/* Class (Instructor) Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class (Instructor)</label>
            <select
              value={selectedInstructor}
              disabled={!selectedSchool}
              onChange={(e) => {
                const nextInstructor = e.target.value;
                setSelectedInstructor(nextInstructor);
                setSelectedPeriod('');
                setSelectedGroup('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Class</option>
              {allInstructors.map(i => <option key={i} value={i}>{i === viewerProfile?.instructor ? `${i} (My Class)` : i}</option>)}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              disabled={!selectedInstructor}
              onChange={(e) => {
                const nextPeriod = e.target.value;
                setSelectedPeriod(nextPeriod);
                setSelectedGroup('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Period</option>
              {allPeriods.map(p => <option key={p} value={p}>{p === viewerProfile?.period ? `${p} (My Period)` : p}</option>)}
            </select>
          </div>

          {/* Group Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Group</label>
            <select
              value={selectedGroup}
              disabled={!selectedPeriod}
              onChange={(e) => {
                const nextGroup = e.target.value;
                setSelectedGroup(nextGroup);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Group</option>
              {allGroups.map(g => <option key={g} value={g}>{g === viewerProfile?.group ? `${g} (My Team)` : g}</option>)}
            </select>
          </div>
        </div>
        {(selectedSchool || selectedInstructor || selectedPeriod || selectedGroup) && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setSelectedSchool('');
                setSelectedInstructor('');
                setSelectedPeriod('');
                setSelectedGroup('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset Hierarchy
            </button>
        </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location, session, date, school, or group..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Session</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{paginatedData.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{filteredData.length}</span> records
          </p>
          {(searchTerm || dateFilter !== 'all' || locationFilter !== 'all' || sessionFilter !== 'all' || selectedSchool || selectedInstructor || selectedPeriod || selectedGroup) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('all');
                setLocationFilter('all');
                setSessionFilter('all');
                setSelectedSchool('');
                setSelectedInstructor('');
                setSelectedPeriod('');
                setSelectedGroup('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredData.length === 0 && (
          <div className="px-6 py-16 text-center border-b border-gray-200">
            <p className="text-lg font-semibold text-gray-800">NO DATA IMPORTED</p>
            <p className="text-sm text-gray-500 mt-2">Import a CSV from your app export, or connect backend data.</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                </th>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Date
                    <SortIcon columnKey="date" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('time')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Time
                    <SortIcon columnKey="time" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('sessionName')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Session
                    <SortIcon columnKey="sessionName" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('location')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Location (Lat, Lng)
                    <SortIcon columnKey="location" />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  INDOOR/OUTDOOR
                </th>
                <th 
                  onClick={() => handleSort('school')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    School
                    <SortIcon columnKey="school" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('instructor')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Class
                    <SortIcon columnKey="instructor" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('period')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Period
                    <SortIcon columnKey="period" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('group')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Group
                    <SortIcon columnKey="group" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    setSelectedMetric('pm25');
                    handleSort('pm25');
                  }}
                  className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedMetric === 'pm25' ? `${theme.bg} text-white hover:opacity-90` : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    PM 2.5 (µg/m³)
                    <SortIcon columnKey="pm25" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    setSelectedMetric('co');
                    handleSort('co');
                  }}
                  className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedMetric === 'co' ? `${theme.bg} text-white hover:opacity-90` : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    CO (ppm)
                    <SortIcon columnKey="co" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    setSelectedMetric('temp');
                    handleSort('temp');
                  }}
                  className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedMetric === 'temp' ? `${theme.bg} text-white hover:opacity-90` : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    Temp (°F)
                    <SortIcon columnKey="temp" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    setSelectedMetric('humidity');
                    handleSort('humidity');
                  }}
                  className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedMetric === 'humidity' ? `${theme.bg} text-white hover:opacity-90` : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    Humidity (%)
                    <SortIcon columnKey="humidity" />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, idx) => {
                const isExpanded = expandedRows[row.id];
                const detailedData = isExpanded ? generateDetailedData(row) : [];
                return (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRowExpansion(row.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={isExpanded ? "Collapse" : "Expand to see detailed data"}
                        >
                          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.time}</td>
                  
                  {/* Session Name */}
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.sessionName}</span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
                      title="Open in Google Maps"
                    >
                      {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                    </a>
                  </td>

                  {/* INDOOR/OUTDOOR */}
                  <td className="px-4 py-3 text-sm">
                    {editingCell.rowId === row.id && editingCell.field === 'indoorOutdoor' ? (
                      <select
                        defaultValue={row.indoorOutdoor}
                        autoFocus
                        onChange={(e) => handleFieldEdit(row.id, 'indoorOutdoor', e.target.value)}
                        onBlur={(e) => handleFieldEdit(row.id, 'indoorOutdoor', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: row.id, field: 'indoorOutdoor' })}
                        className="flex items-center gap-2"
                        title="Click to edit INDOOR/OUTDOOR"
                      >
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          row.indoorOutdoor === 'INDOOR' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {row.indoorOutdoor}
                        </span>
                        {isEdited(row.id, 'indoorOutdoor') && (
                          <span className="text-xs text-orange-600 font-semibold">*</span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* School */}
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.school}</span>
                  </td>

                  {/* Class */}
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.instructor}</span>
                  </td>

                  {/* Period */}
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.period}</span>
                  </td>

                  {/* Group */}
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.group}</span>
                  </td>

                  {/* PM 2.5 */}
                  <td className={`px-4 py-3 text-sm font-semibold ${selectedMetric === 'pm25' ? 'bg-blue-50' : ''}`}>
                    {editingCell.rowId === row.id && editingCell.field === 'pm25' ? (
                      <input
                        type="number"
                        defaultValue={row.pm25}
                        autoFocus
                        min="0"
                        onBlur={(e) => handleFieldEdit(row.id, 'pm25', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFieldEdit(row.id, 'pm25', e.target.value);
                          if (e.key === 'Escape') setEditingCell({ rowId: null, field: null });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: row.id, field: 'pm25' })}
                        className="flex items-center gap-1 text-left w-full"
                        title="Click to edit PM 2.5"
                      >
                        <span>{row.pm25}</span>
                        {isEdited(row.id, 'pm25') && (
                          <span className="text-xs text-orange-600 font-semibold">*</span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* CO */}
                  <td className={`px-4 py-3 text-sm font-semibold ${selectedMetric === 'co' ? 'bg-purple-50' : ''}`}>
                    {editingCell.rowId === row.id && editingCell.field === 'co' ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={row.co}
                        autoFocus
                        min="0"
                        onBlur={(e) => handleFieldEdit(row.id, 'co', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFieldEdit(row.id, 'co', e.target.value);
                          if (e.key === 'Escape') setEditingCell({ rowId: null, field: null });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-purple-500 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: row.id, field: 'co' })}
                        className="flex items-center gap-1 text-left w-full"
                        title="Click to edit CO"
                      >
                        <span>{row.co}</span>
                        {isEdited(row.id, 'co') && (
                          <span className="text-xs text-orange-600 font-semibold">*</span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Temperature */}
                  <td className={`px-4 py-3 text-sm font-semibold ${selectedMetric === 'temp' ? 'bg-red-50' : ''}`}>
                    {editingCell.rowId === row.id && editingCell.field === 'temp' ? (
                      <input
                        type="number"
                        defaultValue={row.temp}
                        autoFocus
                        onBlur={(e) => handleFieldEdit(row.id, 'temp', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFieldEdit(row.id, 'temp', e.target.value);
                          if (e.key === 'Escape') setEditingCell({ rowId: null, field: null });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: row.id, field: 'temp' })}
                        className="flex items-center gap-1 text-left w-full"
                        title="Click to edit temperature"
                      >
                        <span>{row.temp}</span>
                        {isEdited(row.id, 'temp') && (
                          <span className="text-xs text-orange-600 font-semibold">*</span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Humidity */}
                  <td className={`px-4 py-3 text-sm font-semibold ${selectedMetric === 'humidity' ? 'bg-green-50' : ''}`}>
                    {editingCell.rowId === row.id && editingCell.field === 'humidity' ? (
                      <input
                        type="number"
                        defaultValue={row.humidity}
                        autoFocus
                        min="0"
                        max="100"
                        onBlur={(e) => handleFieldEdit(row.id, 'humidity', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFieldEdit(row.id, 'humidity', e.target.value);
                          if (e.key === 'Escape') setEditingCell({ rowId: null, field: null });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-green-500 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: row.id, field: 'humidity' })}
                        className="flex items-center gap-1 text-left w-full"
                        title="Click to edit humidity"
                      >
                        <span>{row.humidity}</span>
                        {isEdited(row.id, 'humidity') && (
                          <span className="text-xs text-orange-600 font-semibold">*</span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 text-sm max-w-xs">
                    {editingNotes === row.id ? (
                      <textarea
                        defaultValue={row.sessionNotes}
                        autoFocus
                        rows="2"
                        onBlur={(e) => handleSessionNotesEdit(row.id, e.target.value)}
                        placeholder="Add notes about this measurement..."
                        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingNotes(row.id)}
                        className="text-left w-full text-gray-600 hover:text-blue-600 transition-colors group"
                        title="Click to add/edit notes"
                      >
                        {row.sessionNotes ? (
                          <span className="flex items-center gap-2">
                            <span className="truncate">
                              {row.sessionNotes}
                            </span>
                            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                            {isEdited(row.id, 'sessionNotes') && (
                              <span className="text-xs text-orange-600 font-semibold">*</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic opacity-0 group-hover:opacity-100 transition-opacity">
                            Add notes...
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan="12" className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Detailed Second-by-Second Data</h4>
                          <span className="text-xs text-gray-500">{detailedData.length} readings</span>
                        </div>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left font-semibold">Time</th>
                                <th className="px-2 py-2 text-left font-semibold">PM 2.5</th>
                                <th className="px-2 py-2 text-left font-semibold">CO</th>
                                <th className="px-2 py-2 text-left font-semibold">Temp</th>
                                <th className="px-2 py-2 text-left font-semibold">Humidity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {detailedData.map((detail) => (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                  <td className="px-2 py-1 font-mono">{detail.time}</td>
                                  <td className="px-2 py-1">{detail.pm25}</td>
                                  <td className="px-2 py-1">{detail.co}</td>
                                  <td className="px-2 py-1">{detail.temp}</td>
                                  <td className="px-2 py-1">{detail.humidity}</td>
                </tr>
              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Photo Gallery */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                            <h5 className="font-semibold text-gray-700 text-sm">Session Photos</h5>
                            {row.photos && row.photos.length > 0 && (
                              <span className="text-xs text-gray-500">({row.photos.length})</span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {row.photos && row.photos.length > 0 ? (
                              row.photos.map((photo, photoIdx) => {
                                const photoTimestamp = photo.timestamp 
                                  ? new Date(photo.timestamp).toLocaleString('en-US', {
                                      dateStyle: 'short',
                                      timeStyle: 'medium'
                                    })
                                  : `${row.date} ${row.time}`;
                                return (
                                  <button
                                    key={photoIdx}
                                    onClick={() => setSelectedPhoto({ ...photo, rowDate: row.date, rowTime: row.time, location: row.location })}
                                    className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors group"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`Capture ${photoIdx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="10"%3EImage%3C/text%3E%3C/svg%3E';
                                      }}
                                    />
                                    {/* Timestamp overlay on photo */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[8px] px-1 py-0.5 font-mono">
                                      {photoTimestamp}
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No photos
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Session Photo</h3>
                <p className="text-sm text-gray-600">{selectedPhoto.location} - {selectedPhoto.rowDate} {selectedPhoto.rowTime}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt="Enlarged capture"
                  className="max-w-full max-h-[60vh] rounded-lg shadow-lg mb-4"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                />
                {/* Timestamp overlay on photo */}
                {selectedPhoto.timestamp && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-sm px-3 py-2 rounded font-mono">
                    {new Date(selectedPhoto.timestamp).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Photo Information</p>
                    <p className="text-sm text-gray-600">
                      {selectedPhoto.timestamp 
                        ? new Date(selectedPhoto.timestamp).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'medium'
                          })
                        : `${selectedPhoto.rowDate} ${selectedPhoto.rowTime}`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const timestamp = selectedPhoto.timestamp 
                        ? new Date(selectedPhoto.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5)
                        : `${selectedPhoto.rowDate}-${selectedPhoto.rowTime.replace(':', '-')}`;
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = `air-quality-${timestamp}.jpg`;
                      link.target = '_blank';
                      link.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold">How to Use Raw Data</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Viewing Data</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Click the <strong>chevron (▶)</strong> to expand rows and see detailed second-by-second sensor data</li>
                  <li>• Click <strong>location coordinates</strong> to open Google Maps</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✏️ Editing Data</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>Click any data value</strong> to edit it - edited values show a <span className="font-bold text-orange-600">*</span> badge</li>
                  <li>• <strong>Click notes</strong> to add context about measurement conditions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📷 Photos</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>Click photos</strong> in expanded rows to view full-size images</li>
                  <li>• Photos show timestamps automatically</li>
                  <li>• Use the <strong>Download button</strong> to save photos with timestamp filenames</li>
                </ul>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawDataView;