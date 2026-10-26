import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Clock, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  PhoneCall, 
  UserCheck, 
  UserPlus, 
  Zap, 
  ArrowRight,
  Filter,
  Search,
  Stethoscope
} from 'lucide-react';
import { 
  fetchStaffQueues, 
  updatePatientStatus, 
  callNextPatient, 
  simulateWalkins, 
  resetDatabase 
} from '../services/api';
import { playHospitalChime, announcePatientCalling, announceNoWaitingPatients, speakText } from '../services/speech';

export default function StaffDashboard({ 
  currentLang = 'en',
  t = {},
  onDataChanged = () => {}
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState('triage'); // 'triage', 'doctor', 'reception', 'admin'
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadDashboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetchStaffQueues();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load staff queues:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (patientId, newStatus) => {
    setActionLoading(true);
    try {
      await updatePatientStatus(patientId, { status: newStatus });
      setFeedback(`Updated status to ${newStatus}`);
      await loadDashboard(true);
      onDataChanged();

      if (newStatus === 'CALLED') {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          announcePatientCalling(patient.token_number, patient.name, currentLang);
        } else {
          playHospitalChime();
        }
      } else {
        playHospitalChime();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleCallNext = async (deptId) => {
    setActionLoading(true);
    try {
      const res = await callNextPatient(deptId);
      setFeedback(res.message);
      await loadDashboard(true);
      onDataChanged();

      if (res.calledPatient) {
        announcePatientCalling(res.calledPatient.token_number, res.calledPatient.name, currentLang);
      } else {
        announceNoWaitingPatients(currentLang);
      }
    } catch (err) {
      alert(err.message || 'Failed calling next patient');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSimulateWalkins = async () => {
    setActionLoading(true);
    try {
      const res = await simulateWalkins();
      setFeedback(res.message);
      await loadDashboard(true);
      onDataChanged();
    } catch (err) {
      alert(err.message || 'Simulation failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all queues to pristine initial seed state?')) return;
    setActionLoading(true);
    try {
      const res = await resetDatabase();
      setFeedback(res.message);
      await loadDashboard(false);
      onDataChanged();
    } catch (err) {
      alert(err.message || 'Reset failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Loading Hospital Staff Console...</p>
      </div>
    );
  }

  const { stats, departments, patients } = data || { stats: {}, departments: [], patients: [] };

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesDept = selectedDeptFilter === 'ALL' || 
      (selectedDeptFilter === 'EMERGENCY' ? p.is_emergency === 1 : p.department_id === selectedDeptFilter);
    const matchesSearch = !searchQuery || 
      p.token_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const emergencyQueue = patients.filter(p => p.is_emergency === 1 && p.status !== 'COMPLETED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Role Switcher */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Real-Time Clinical Operations Console</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {t.staff?.title || 'Hospital Staff & Triage Management Dashboard'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.staff?.subtitle || 'Simulated real-time multi-department queue console, triage assessment, and capacity monitoring.'}
            </p>
          </div>

          {/* Role selector chips */}
          <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80 self-start lg:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-2 mb-1">
              {t.staff?.roleLabel || 'Active Staff Role:'}
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'triage', label: t.staff?.roles?.triage || 'Triage Nurse' },
                { id: 'doctor', label: t.staff?.roles?.doctor || 'OPD Doctor' },
                { id: 'reception', label: t.staff?.roles?.reception || 'Receptionist' },
                { id: 'admin', label: t.staff?.roles?.admin || 'Administrator' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeRole === r.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mt-4 p-3 bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.total || 'Total Today'}
          </span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.total || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.waiting || 'In Waiting Queues'}
          </span>
          <span className="text-2xl font-black text-amber-500">{stats.waiting || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.active || 'In Consultation'}
          </span>
          <span className="text-2xl font-black text-blue-500">{stats.active || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.completed || 'Completed'}
          </span>
          <span className="text-2xl font-black text-emerald-500">{stats.completed || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-sm">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.emergency || 'Emergency'}
          </span>
          <span className="text-2xl font-black text-red-600">{stats.emergency || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.staff?.stats?.capacity || 'Capacity Load'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.hospitalCapacity || 0}%</span>
          </div>
        </div>
      </div>

      {/* EMERGENCY PRIORITY TRAUMA SECTION (ALWAYS PINNED) */}
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-500 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-red-900 dark:text-red-200 uppercase tracking-wide">
                  {t.staff?.emergencyTab || '🚨 Emergency Trauma Triage (Red Corridor)'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white">
                  {emergencyQueue.length} Active
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Trauma Bay 1 • Direct doctor intervention • Can never be delayed
              </p>
            </div>
          </div>
        </div>

        {emergencyQueue.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-red-200 dark:border-red-900 text-center text-xs text-red-700 dark:text-red-300 font-semibold">
            ✓ No critical emergency cases waiting at this moment. Triage bay is ready.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyQueue.map(p => (
              <div 
                key={p.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-red-300 dark:border-red-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-red-600 dark:text-red-400 tracking-wider font-mono">
                      {p.token_number}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {p.name} ({p.age} Yrs / {p.gender})
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.triage_notes || 'Immediate triage requested'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 shrink-0">
                    {p.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {p.status === 'WAITING' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'IN_CONSULTATION')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{t.staff?.markAssessed || 'Mark Assessed / In Progress'}</span>
                    </button>
                  )}
                  {p.status === 'IN_CONSULTATION' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'COMPLETED')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.staff?.markCompleted || 'Mark Stabilized / Completed'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEPARTMENT QUEUE OVERVIEW & OVERCROWDING ALERTS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Department OPD Queues & Overcrowding Monitoring
            </h3>
            <p className="text-xs text-slate-500">
              Live capacity breakdown per specialty clinic with 1-click patient calling.
            </p>
          </div>

          {/* Quick Simulation Toolkit */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulateWalkins}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.staff?.simulateWalkins || '⚡ Simulate 5 Walk-ins'}</span>
            </button>
            <button
              onClick={handleResetData}
              disabled={actionLoading}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.staff?.resetData || '🔄 Reset Data'}</span>
            </button>
          </div>
        </div>

        {/* Department Queue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.filter(d => d.id !== 'EMER').map(d => {
            const isOvercrowded = d.overcrowding === 'OVERCROWDED';
            const isModerate = d.overcrowding === 'MODERATE';

            return (
              <div 
                key={d.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOvercrowded 
                    ? 'border-red-400 bg-red-50/40 dark:bg-red-950/20' 
                    : isModerate
                      ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentLang === 'hi' ? d.hindi_name : currentLang === 'ta' ? d.tamil_name : d.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {d.room_number} • {d.doctor_in_charge}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isOvercrowded 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : isModerate
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {d.overcrowding}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-500 block">Waiting:</span>
                    <strong className="text-base font-black text-amber-600">{d.waiting_count}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Active:</span>
                    <strong className="text-base font-black text-blue-600">{d.active_count}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Completed:</span>
                    <strong className="text-base font-black text-emerald-600">{d.completed_count}</strong>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedDeptFilter(d.id)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Queue List →
                  </button>

                  <button
                    onClick={() => handleCallNext(d.id)}
                    disabled={actionLoading || d.waiting_count === 0}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{t.staff?.callNext || 'Call Next'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALL PATIENTS QUEUE TABLE & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Patient Queue List & Status Operations
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPatients.length} patients in queue
            </p>
          </div>

          {/* Department Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              <option value="EMERGENCY">🚨 Emergency Only</option>
              {departments.filter(d => d.id !== 'EMER').map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token or name..."
                className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Department / Room</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                  {/* Token */}
                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                      p.is_emergency ? 'bg-red-100 text-red-700' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {p.token_number}
                    </span>
                  </td>

                  {/* Name & Age */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.age} Yrs • {p.gender}</div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{p.dept_name}</div>
                    <div className="text-[11px] text-slate-500">{p.room_number} ({p.floor_name})</div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      p.is_emergency 
                        ? 'bg-red-100 text-red-700 font-black' 
                        : p.triage_level === 'SENIOR'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.triage_level}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      p.status === 'CALLED'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        : p.status === 'IN_CONSULTATION'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {p.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === 'WAITING' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'CALLED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          title="Call patient into room"
                        >
                          Call
                        </button>
                      )}
                      {(p.status === 'CALLED' || p.status === 'WAITING') && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'IN_CONSULTATION')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          title="Start consultation"
                        >
                          Start
                        </button>
                      )}
                      {p.status === 'IN_CONSULTATION' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'COMPLETED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          title="Mark completed"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
