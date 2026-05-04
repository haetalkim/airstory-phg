import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Filter, Search, Calendar, ChevronDown, TrendingUp, TrendingDown, Info, ChevronRight, X, Upload } from 'lucide-react';
import { addMeasurementEdit, clearWorkspaceMeasurements, getMeasurements, importCsvMeasurements } from '../api/data';
import { getRoster, getClassStructure } from '../api/auth';
import {
  clearImportedMeasurements,
  getImportedMeasurements,
  parseImportedCsv,
  parseImportedCsvRaw,
  setImportedMeasurements,
  normalizeIndoorOutdoor,
  isBlankHierarchyField,
  uniqueHierarchyFromImportedRows,
  collapseGroupKeyForRow,
} from '../utils/importedData';
import {
  compareHierarchyToken,
  groupsForPeriodFromStructure,
  periodsFromClassStructure,
} from '../utils/classStructure';
import { getStudentContext, PHG_SCHOOL_CODE } from '../utils/studentContext';
import { groupsMatch, periodsMatch, schoolsMatch } from '../utils/hierarchyTokens';
import { workspaceMeasurementsToDisplayRows } from '../utils/measurementRows';
import {
  SENSOR_CSV_EXPORT_HEADERS,
  csvEscapeCell,
  formatSensorTimestamp,
} from '../constants/sensorCsv';

const CSV_UPLOAD_CHUNK_SIZE = 2500;

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
  classStructure,
  isPhgStudent = false,
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
  /** PHG variant: each CSV import collapses to one row keyed by sessionId; expand to reveal underlying minute-bucket rows. */
  const [expandedSessions, setExpandedSessions] = useState({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [rosterRows, setRosterRows] = useState([]);
  /** When App has not loaded workspace grid yet (or /class-structure failed once), fetch here so period/group match Manage Classes. */
  const [fetchedClassStructure, setFetchedClassStructure] = useState(null);
  const itemsPerPage = 50;
  const importGenerationRef = useRef(0);

  const resolvedClassStructure = classStructure || fetchedClassStructure;

  useEffect(() => {
    if (!workspaceId) {
      setFetchedClassStructure(null);
      return;
    }
    if (classStructure) {
      setFetchedClassStructure(null);
      return;
    }
    let cancelled = false;
    getClassStructure(workspaceId)
      .then((s) => {
        if (!cancelled) setFetchedClassStructure(s);
      })
      .catch(() => {
        if (!cancelled) setFetchedClassStructure(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, classStructure]);

  const loadFromBackend = useCallback(async () => {
    if (!workspaceId) return;
    const genAtStart = importGenerationRef.current;
    setLoadingBackend(true);
    try {
      const result = await getMeasurements(workspaceId, { limit: 10000 });
      if (genAtStart !== importGenerationRef.current) return;
      const mapped = workspaceMeasurementsToDisplayRows(result.measurements || []);
      if (mapped.length) {
        setRawData(mapped);
        setImportedMeasurements(mapped);
        onImportedDataChanged?.();
      }
    } catch {
      // Fall back to imported CSV data when backend is unavailable.
    } finally {
      if (genAtStart === importGenerationRef.current) {
        setLoadingBackend(false);
      }
    }
  }, [workspaceId, onImportedDataChanged]);

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  // PHG students: don’t hide imported rows behind “today” / a single session chip.
  useEffect(() => {
    if (!isPhgStudent) return;
    setDateFilter('all');
    setLocationFilter('all');
    setSessionFilter('all');
  }, [isPhgStudent]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadRosterMeta() {
      if (!workspaceId) return;
      try {
        const data = await getRoster(workspaceId);
        if (!cancelled) setRosterRows(data.members || []);
      } catch {
        if (!cancelled) setRosterRows([]);
      }
    }
    loadRosterMeta();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

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
  
  const rosterPeriods = rosterRows.map((m) => m.period).filter(Boolean);
  const rosterGroups = rosterRows.map((m) => m.group_code).filter(Boolean);

  const allPeriods = [...new Set(
    (rosterPeriods.length
      ? rosterRows
          .filter((m) => (!selectedSchool || m.school_code === selectedSchool) && (!selectedInstructor || m.instructor === selectedInstructor))
          .map((m) => m.period)
      : rawData
          .filter((d) => (!selectedSchool || d.school === selectedSchool) && (!selectedInstructor || d.instructor === selectedInstructor))
          .map((d) => d.period))
      .filter(Boolean)
  )].sort();
  const allGroups = [...new Set(
    (rosterGroups.length
      ? rosterRows
          .filter(
            (m) =>
              (!selectedSchool || m.school_code === selectedSchool) &&
              (!selectedInstructor || m.instructor === selectedInstructor) &&
              (!selectedPeriod || m.period === selectedPeriod)
          )
          .map((m) => m.group_code)
      : rawData
          .filter(
            (d) =>
              (!selectedSchool || d.school === selectedSchool) &&
              (!selectedInstructor || d.instructor === selectedInstructor) &&
              (!selectedPeriod || d.period === selectedPeriod)
          )
          .map((d) => d.group))
      .filter(Boolean)
  )].sort();

  const structurePeriods = periodsFromClassStructure(resolvedClassStructure);
  const periodForGroups =
    selectedPeriod ||
    filters.period ||
    structurePeriods[0] ||
    allPeriods[0] ||
    'P1';
  const structureGroups = groupsForPeriodFromStructure(resolvedClassStructure, periodForGroups);

  const mergedGroups = [...new Set([...structureGroups, ...allGroups])];
  const effectiveGroups = structureGroups.length
    ? [...structureGroups].sort(compareHierarchyToken)
    : mergedGroups.length > 0
      ? mergedGroups.sort(compareHierarchyToken)
      : ['G1', 'G2', 'G3', 'G4'].sort(compareHierarchyToken);

  // Filter data
  let filteredData = rawData.filter(row => {
    const matchesSearch = 
      String(row.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${row.latitude}, ${row.longitude}`.includes(searchTerm) ||
      String(row.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.date.includes(searchTerm) ||
      row.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.period.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || row.location === locationFilter;
    const matchesSession = sessionFilter === 'all' || row.sessionId === sessionFilter;
    
    const matchesSchool = !selectedSchool || schoolsMatch(selectedSchool, row.school);
    const matchesInstructor =
      !selectedInstructor || isBlankHierarchyField(row.instructor) || row.instructor === selectedInstructor;
    const matchesPeriod =
      !selectedPeriod || periodsMatch(selectedPeriod, row.period);
    const matchesGroup = !selectedGroup || groupsMatch(selectedGroup, row.group);
    
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
      
      if (sortConfig.key === 'capturedAt') {
        aVal = new Date(a.capturedAt || `${a.date}T${a.time || '00:00'}`).getTime();
        bVal = new Date(b.capturedAt || `${b.date}T${b.time || '00:00'}`).getTime();
      } else if (sortConfig.key === 'latitude' || sortConfig.key === 'longitude') {
        aVal = parseFloat(a[sortConfig.key]);
        bVal = parseFloat(b[sortConfig.key]);
      } else if (sortConfig.key === 'pm25' || sortConfig.key === 'co' || sortConfig.key === 'temp' || sortConfig.key === 'humidity') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleExport = () => {
    const rows = [];
    filteredData.forEach((row) => {
      const detailed = generateDetailedData(row);
      detailed.forEach((second) => {
        const indoorOutdoorLabel =
          row.indoorOutdoor === 'INDOOR' ? 'Indoor' : 'Outdoor';
        const line = [
          csvEscapeCell(`${row.date} ${second.time}`),
          csvEscapeCell(row.date),
          csvEscapeCell(second.time),
          csvEscapeCell(row.sessionId),
          csvEscapeCell(row.sessionName),
          csvEscapeCell(row.school),
          csvEscapeCell(row.instructor),
          csvEscapeCell(row.period),
          csvEscapeCell(row.group),
          csvEscapeCell(row.location),
          csvEscapeCell(row.latitude),
          csvEscapeCell(row.longitude),
          csvEscapeCell(indoorOutdoorLabel),
          csvEscapeCell(second.pm25),
          csvEscapeCell(second.co),
          csvEscapeCell(second.temp),
          csvEscapeCell(second.humidity),
        ].join(',');
        rows.push(line);
      });
    });

    const csvContent = [SENSOR_CSV_EXPORT_HEADERS.join(','), ...rows].join('\n');
    
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
      const importBatchId = `csv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const imported = parseImportedCsv(text, importBatchId);
      const studentCtx = isPhgStudent ? getStudentContext() : null;
      const importContext = {
        school: filters.school || studentCtx?.school || PHG_SCHOOL_CODE,
        instructor: filters.instructor || '',
        period: filters.period || (isPhgStudent ? 'P1' : ''),
        group: filters.group || studentCtx?.group || '',
      };
      const withContext = (row) => ({
        ...row,
        school: row.school || importContext.school,
        instructor: row.instructor || importContext.instructor,
        period: row.period || importContext.period,
        group: row.group || importContext.group,
      });
      const stampedImported = imported.map(withContext);
      const stampedRawRows = rawRows.map(withContext);
      importGenerationRef.current += 1;
      // Always show imported data in UI immediately.
      setRawData(stampedImported);
      setImportedMeasurements(stampedImported);
      onImportedDataChanged?.();
      setImportError('');
      // Historical CSVs are often hidden by "today" or session chips; widen filters after import.
      setDateFilter('all');
      setLocationFilter('all');
      setSessionFilter('all');
      setSearchTerm('');

      const inferred = uniqueHierarchyFromImportedRows(stampedImported);
      setFilters((prev) => ({
        ...prev,
        school: inferred.school || (isPhgStudent ? prev.school : ''),
        instructor: inferred.instructor || (isPhgStudent ? prev.instructor : ''),
        period: inferred.period || (isPhgStudent ? prev.period : ''),
        group: inferred.group || (isPhgStudent ? prev.group : ''),
      }));

      if (workspaceId && stampedRawRows.length) {
        const payloadRows = stampedRawRows.map((r) => ({
          capturedAt: r.capturedAt,
          // One CSV import = one cloud session (so Manage Classes shows 1 session, not 40).
          sessionCode: importBatchId,
          sessionName: r.sessionName || 'Imported Session',
          sessionNotes: r.sessionNotes || '',
          location: r.location || '',
          school: r.school || '',
          instructor: r.instructor || '',
          period: r.period || '',
          group: r.group || '',
          indoorOutdoor: normalizeIndoorOutdoor(r.indoorOutdoor),
          latitude: Number.isFinite(Number(r.latitude)) ? Number(r.latitude) : null,
          longitude: Number.isFinite(Number(r.longitude)) ? Number(r.longitude) : null,
          pm25: Number(r.pm25) || 0,
          co: Number(r.co) || 0,
          temp: Number(r.temp) || 0,
          humidity: Number(r.humidity) || 0,
        }));
        try {
          for (let i = 0; i < payloadRows.length; i += CSV_UPLOAD_CHUNK_SIZE) {
            const chunk = payloadRows.slice(i, i + CSV_UPLOAD_CHUNK_SIZE);
            await importCsvMeasurements(workspaceId, chunk);
          }
          await loadFromBackend();
        } catch (persistError) {
          setImportError(
            persistError?.message
              ? `Imported locally, but cloud save failed: ${persistError.message}`
              : 'Imported locally, but cloud save failed.'
          );
        }
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import CSV.');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearImportedData = async () => {
    try {
      if (workspaceId) {
        await clearWorkspaceMeasurements(workspaceId);
      }
      clearImportedMeasurements();
      setRawData([]);
      onImportedDataChanged?.();
      setImportError('');
    } catch (error) {
      setImportError(error.message || 'Failed to clear data.');
    }
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
    const baseTime = new Date(`${row.date}T${row.time}`);
    if (Number.isNaN(baseTime.getTime())) {
      return [
        {
          id: `${row.id}-0`,
          time: String(row.time || '—'),
          pm25: row.pm25,
          co: row.co,
          temp: row.temp,
          humidity: row.humidity,
        },
      ];
    }
    const detailed = [];
    for (let i = 0; i < 60; i++) {
      const time = new Date(baseTime.getTime() + i * 1000);
      detailed.push({
        id: `${row.id}-${i}`,
        time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pm25: row.pm25,
        co: row.co,
        temp: row.temp,
        humidity: row.humidity,
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

  const toggleSessionExpansion = (groupKey) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  /**
   * One collapsible row per CSV import (importBatchId) or per API session
   * (sess:…). Built from the full filtered set — pagination applies to these
   * groups, not to raw chunk rows (so one import never splits across pages).
   */
  const sessionGroups = React.useMemo(() => {
    const order = [];
    const map = new Map();
    filteredData.forEach((row) => {
      const gkey = collapseGroupKeyForRow(row);
      if (!map.has(gkey)) {
        order.push(gkey);
        const sample = row;
        map.set(gkey, {
          groupKey: gkey,
          sessionId: sample.sessionId,
          sessionName: sample.sessionName,
          school: sample.school,
          instructor: sample.instructor,
          period: sample.period,
          group: sample.group,
          location: sample.location,
          rows: [],
        });
      }
      map.get(gkey).rows.push(row);
    });
    return order.map((gkey) => {
      const g = map.get(gkey);
      const sample = g.rows[0];
      g.school = sample.school;
      g.instructor = sample.instructor;
      g.period = sample.period;
      g.group = sample.group;
      g.sessionName = sample.sessionName;
      g.sessionId = sample.sessionId;
      g.location = sample.location;
      return {
        ...g,
        totalReadings: g.rows.length,
      };
    });
  }, [filteredData]);

  const totalGroupPages = Math.max(1, Math.ceil(sessionGroups.length / itemsPerPage));
  React.useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalGroupPages));
  }, [totalGroupPages]);
  const paginatedSessionGroups = sessionGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          {rawData.length > 0 && filteredData.length === 0 && (
            <p className="text-sm text-amber-900 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-semibold">Nothing registered for your group in this view yet.</span>{' '}
              {isPhgStudent
                ? 'Import a CSV above, or switch to another group in the filter bar — your pick!'
                : 'Try importing data, or adjust the group and other filters so they match what’s in your file.'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />
          </label>
          {!isPhgStudent && (
            <button
              onClick={handleClearImportedData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
            >
              Clear Data
            </button>
          )}
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

      {/* Filters and Search — PHG variant collapses the standalone "Select
          Team Data" picker into a single inline row: Search | Group | Section
          | Date Range | Location. Group is pre-populated from the student's
          chosen group (or the teacher's currently-selected group). */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          {/* Group Filter (pre-populated from logged-in group) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Group</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedGroup(v);
                  setFilters((prev) => ({ ...prev, group: v }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">All Groups</option>
                {effectiveGroups.map((g) => (
                  <option key={g} value={g}>
                    {g === viewerProfile?.group ? `${g} (My Team)` : g}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
            Showing <span className="font-semibold text-gray-900">{paginatedSessionGroups.length}</span> import
            {paginatedSessionGroups.length === 1 ? '' : 's'} / session
            {paginatedSessionGroups.length === 1 ? '' : 's'} (page of{' '}
            <span className="font-semibold text-gray-900">{sessionGroups.length}</span> total) ·{' '}
            <span className="font-semibold text-gray-900">{filteredData.length}</span> data rows
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
                setFilters((prev) => ({
                  ...prev,
                  school: '',
                  instructor: '',
                  period: '',
                  group: '',
                }));
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              No filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredData.length === 0 && (
          <div className="px-6 py-16 text-center border-b border-gray-200">
            {rawData.length > 0 ? (
              <>
                <p className="text-lg font-semibold text-gray-800">Nothing here for this group yet</p>
                <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                  {isPhgStudent
                    ? 'There’s no data under your current group filter. Import a CSV or choose another group to see rows.'
                    : 'No rows match your current filters. Import a CSV or widen the group / hierarchy filters.'}{' '}
                  <span className="text-gray-500">
                    ({rawData.length} row{rawData.length === 1 ? '' : 's'} loaded elsewhere in the dataset.)
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-gray-800">NO DATA IMPORTED</p>
                <p className="text-sm text-gray-500 mt-2">
                  Import a CSV from your app export, or connect backend data.
                </p>
              </>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                </th>
                <th
                  onClick={() => handleSort('capturedAt')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    <SortIcon columnKey="capturedAt" />
                  </div>
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
                  onClick={() => handleSort('sessionId')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Session ID
                    <SortIcon columnKey="sessionId" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('sessionName')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Session Name
                    <SortIcon columnKey="sessionName" />
                  </div>
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
                    Class (Instructor)
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
                  onClick={() => handleSort('location')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Location
                    <SortIcon columnKey="location" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('latitude')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Latitude
                    <SortIcon columnKey="latitude" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('longitude')}
                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Longitude
                    <SortIcon columnKey="longitude" />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  INDOOR/OUTDOOR
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
                    PM 2.5
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
                    CO
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
                    Temperature (°C)
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
                    Humidity
                    <SortIcon columnKey="humidity" />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSessionGroups.map((session) => {
                const gk = session.groupKey;
                const sessionExpanded = !!expandedSessions[gk];
                const rep = session.rows[0];
                const n = session.totalReadings;
                return (
                  <React.Fragment key={`grp-${gk}`}>
                    <tr
                      onClick={() => toggleSessionExpansion(gk)}
                      className="bg-blue-50 hover:bg-blue-100 cursor-pointer border-y border-blue-200"
                    >
                      <td className="px-4 py-3 align-middle">
                        <ChevronRight
                          className={`w-4 h-4 text-blue-700 transition-transform inline-block ${sessionExpanded ? 'rotate-90' : ''}`}
                          aria-hidden
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap font-mono text-xs align-middle">
                        {formatSensorTimestamp(rep.capturedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium align-middle">{rep.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 align-middle">{rep.time}</td>
                      <td className="px-4 py-3 text-sm font-mono text-xs text-gray-800 max-w-[180px] truncate align-middle" title={String(rep.sessionId ?? '')}>
                        {rep.sessionId}
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className="font-medium text-gray-900">{rep.sessionName}</span>
                        {n > 1 && (
                          <span className="ml-2 text-xs font-semibold text-blue-700">+{n - 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className="font-medium text-gray-900">{rep.school}</span>
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className="font-medium text-gray-900">{rep.instructor}</span>
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className="font-medium text-gray-900">{rep.period}</span>
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className="font-medium text-gray-900">{rep.group}</span>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[220px] align-middle">
                        <span className="truncate block" title={String(rep.location ?? '')}>{rep.location || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono align-middle">
                        {rep.latitude != null && rep.longitude != null && Number.isFinite(Number(rep.latitude)) && Number.isFinite(Number(rep.longitude)) ? (
                          <a
                            href={`https://www.google.com/maps?q=${rep.latitude},${rep.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Number(rep.latitude).toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono align-middle">
                        {rep.latitude != null && rep.longitude != null && Number.isFinite(Number(rep.latitude)) && Number.isFinite(Number(rep.longitude)) ? (
                          <a
                            href={`https://www.google.com/maps?q=${rep.latitude},${rep.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Number(rep.longitude).toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm align-middle">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          rep.indoorOutdoor === 'INDOOR' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {rep.indoorOutdoor}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold align-middle ${selectedMetric === 'pm25' ? 'bg-blue-100/80' : ''}`}>
                        {rep.pm25}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold align-middle ${selectedMetric === 'co' ? 'bg-purple-100/80' : ''}`}>
                        {rep.co}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold align-middle ${selectedMetric === 'temp' ? 'bg-orange-100/80' : ''}`}>
                        {rep.temp}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold align-middle ${selectedMetric === 'humidity' ? 'bg-cyan-100/80' : ''}`}>
                        {rep.humidity}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs align-middle text-gray-600">
                        {rep.sessionNotes ? (
                          <span className="truncate block" title={rep.sessionNotes}>{rep.sessionNotes}</span>
                        ) : (
                          <span className="text-gray-400">{n > 1 ? `Expand for ${n} rows` : '—'}</span>
                        )}
                      </td>
                    </tr>
                    {sessionExpanded && session.rows.map((row, idx) => {
                      const isExpanded = expandedRows[row.id];
                      const detailedData = isExpanded ? generateDetailedData(row) : [];
                      return (
                        <React.Fragment key={row.id}>
                    <tr className={`hover:bg-blue-50 transition-colors border-l-4 border-blue-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 pl-6">
                        <button
                          onClick={() => toggleRowExpansion(row.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={isExpanded ? "Collapse" : "Expand to see detailed data"}
                        >
                          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap font-mono text-xs">
                        {formatSensorTimestamp(row.capturedAt)}
                      </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.time}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs text-gray-800 max-w-[180px] truncate" title={String(row.sessionId ?? '')}>
                    {row.sessionId}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.sessionName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.school}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.instructor}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.period}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.group}</span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[220px]">
                    <span className="truncate block" title={String(row.location ?? '')}>{row.location || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {row.latitude != null && row.longitude != null && Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)) ? (
                      <a
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="Open in Google Maps"
                      >
                        {Number(row.latitude).toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {row.latitude != null && row.longitude != null && Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)) ? (
                      <a
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="Open in Google Maps"
                      >
                        {Number(row.longitude).toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
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
                    <td colSpan="19" className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300">
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
                                <th className="px-2 py-2 text-left font-semibold">Temperature (°C)</th>
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
                      </div>
                    </td>
                  </tr>
                )}
                        </React.Fragment>
                      );
                    })}
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
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalGroupPages}</span>
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
                onClick={() => setCurrentPage(Math.min(totalGroupPages, currentPage + 1))}
                disabled={currentPage === totalGroupPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

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