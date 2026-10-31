import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Search, 
  Filter, 
  RefreshCw, 
  UserPlus, 
  ArrowUpDown, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Stethoscope, 
  Building2, 
  Calendar, 
  Phone, 
  FileText, 
  History, 
  X,
  Play,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { 
  fetchStaffQueues, 
  fetchDoctors, 
  assignPatientPersonnel, 
  updatePatientStatus, 
  simulateWalkins 
} from '../services/api';
import { 
  announceNurseEscort, 
  isSpeechMuted, 
  setSpeechMuted, 
  getAnnouncementHistory, 
  subscribeAnnouncementHistory, 
  subscribeVoiceAlert,
  isArabicVoiceAvailable,
  getAvailableArabicVoices,
  playHospitalChime,
  speakText
} from '../services/speech';

// Nurse and Caretaker Staff Roster
const DEFAULT_NURSES = [
  { id: 'N-1', name: 'Nurse Sarah Jenkins', role: 'Senior Triage Nurse', floor: 'Ground Floor' },
  { id: 'N-2', name: 'Nurse Fatima Al-Hassan', role: 'Emergency Response Nurse', floor: 'East Wing Trauma' },
  { id: 'N-3', name: 'Nurse Anita Sharma', role: 'OPD Escort Nurse', floor: 'First Floor' },
  { id: 'N-4', name: 'Nurse Priya Nair', role: 'Clinical Staff Nurse', floor: 'Second Floor' },
  { id: 'N-5', name: 'Caretaker Ramesh Kumar', role: 'Mobility & Wheelchair Caretaker', floor: 'All Floors' },
  { id: 'N-6', name: 'Caretaker John Mathew', role: 'Patient Escort Attendant', floor: 'Central Lobby' }
];

export default function PatientSorting({
  currentLang = 'en',
  t = {},
  onDataChanged = () => {}
}) {
  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL', 'EMERGENCY', 'ELDERLY', 'NORMAL'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Voice & Audio States
  const [muted, setMuted] = useState(isSpeechMuted());
  const [arabicVoiceReady, setArabicVoiceReady] = useState(false);
  const [arabicVoiceWarning, setArabicVoiceWarning] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState(getAnnouncementHistory());

  // Modal States
  const [assignModalPatient, setAssignModalPatient] = useState(null);
  const [detailsModalPatient, setDetailsModalPatient] = useState(null);

  // Assignment Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignedRoom, setAssignedRoom] = useState('');
  const [selectedNurseName, setSelectedNurseName] = useState('');
  const [customNurseName, setCustomNurseName] = useState('');
  const [autoAnnounce, setAutoAnnounce] = useState(true);

  const langSorting = t.sorting || {};

  // Check Arabic voice availability
  const checkVoiceStatus = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const arVoices = getAvailableArabicVoices();
      const hasAr = arVoices.length > 0;
      setArabicVoiceReady(hasAr);
      if (currentLang === 'ar' && !hasAr) {
        setArabicVoiceWarning(true);
      } else {
        setArabicVoiceWarning(false);
      }
    }
  };

  useEffect(() => {
    checkVoiceStatus();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoiceStatus;
    }
    const unsubAlert = subscribeVoiceAlert((alert) => {
      if (alert.type === 'ARABIC_VOICE_MISSING') {
        setArabicVoiceWarning(true);
      }
    });
    const unsubHist = subscribeAnnouncementHistory((hist) => {
      setHistoryList(hist);
    });
    return () => {
      unsubAlert();
      unsubHist();
    };
  }, [currentLang]);

  // Load patient queue data and doctors
  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [queueRes, docRes] = await Promise.all([
        fetchStaffQueues().catch(() => ({ success: false })),
        fetchDoctors().catch(() => ({ success: false }))
      ]);

      if (queueRes?.success && queueRes.patients) {
        setPatients(queueRes.patients);
      }
      if (docRes?.success && docRes.doctors) {
        setDoctorsList(docRes.doctors);
      }
    } catch (err) {
      console.warn('Queue data load note:', err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 4 seconds to sync patient queues
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Priority Calculation & Categorization
  const getPatientPriorityData = (patient) => {
    const isEmer = Boolean(patient.is_emergency);
    const age = Number(patient.age) || 0;
    const isElderly = age >= 60;

    let score = 100;
    let categoryKey = 'normal';
    let categoryLabel = langSorting.categories?.normal || 'Standard Priority';
    let badgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';

    if (isEmer && isElderly) {
      score = 1000;
      categoryKey = 'emergencySenior';
      categoryLabel = langSorting.categories?.emergencySenior || '🚨 Emergency + Senior (60+)';
      badgeClass = 'bg-red-600 text-white font-extrabold animate-pulse shadow-md border-red-700';
    } else if (isEmer) {
      score = 900;
      categoryKey = 'emergency';
      categoryLabel = langSorting.categories?.emergency || '🚨 Critical Emergency';
      badgeClass = 'bg-red-500 text-white font-bold shadow-xs border-red-600';
    } else if (isElderly) {
      score = 500;
      categoryKey = 'elderly';
      categoryLabel = langSorting.categories?.elderly || '👴 Senior Citizen (60+)';
      badgeClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold border-amber-300 dark:border-amber-700';
    }

    return {
      score,
      categoryKey,
      categoryLabel,
      badgeClass,
      isEmergency: isEmer,
      isElderly
    };
  };

  // Strictly Sorted Patient List
  // Emergency cases ALWAYS have highest priority regardless of age.
  // Within same priority, ordered by waiting time (longest waiting first).
  const sortedPatients = useMemo(() => {
    const enriched = patients.map(p => {
      const prio = getPatientPriorityData(p);
      return {
        ...p,
        priorityScoreComputed: prio.score,
        priorityMeta: prio
      };
    });

    return enriched.sort((a, b) => {
      // Completed or cancelled go to the very bottom
      const aDone = a.status === 'COMPLETED' || a.status === 'CANCELLED';
      const bDone = b.status === 'COMPLETED' || b.status === 'CANCELLED';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      // 1. Primary: Priority Score (Emergency 900-1000 > Senior 500 > Normal 100)
      if (b.priorityScoreComputed !== a.priorityScoreComputed) {
        return b.priorityScoreComputed - a.priorityScoreComputed;
      }

      // 2. Secondary: Waiting Time (longest waiting first -> earliest created_at)
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [patients, langSorting]);

  // Filtered List based on search and category
  const filteredPatients = useMemo(() => {
    return sortedPatients.filter(p => {
      // Category filter
      if (categoryFilter === 'EMERGENCY' && !p.is_emergency) return false;
      if (categoryFilter === 'ELDERLY' && (p.is_emergency || p.age < 60)) return false;
      if (categoryFilter === 'NORMAL' && (p.is_emergency || p.age >= 60)) return false;

      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      // Search Query (Token or Name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesToken = (p.token_number || '').toLowerCase().includes(q);
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesDoctor = (p.doctor_name || '').toLowerCase().includes(q);
        const matchesNurse = (p.assigned_nurse || '').toLowerCase().includes(q);
        if (!matchesToken && !matchesName && !matchesDoctor && !matchesNurse) return false;
      }

      return true;
    });
  }, [sortedPatients, categoryFilter, statusFilter, searchQuery]);

  // Dynamic Dashboard Counters
  const stats = useMemo(() => {
    const activeList = patients.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
    const waiting = activeList.filter(p => p.status === 'WAITING' || p.status === 'PRIORITY_ASSIGNED');
    const emergencies = activeList.filter(p => Boolean(p.is_emergency));
    const elderly = activeList.filter(p => !p.is_emergency && Number(p.age) >= 60);
    const assignedDoctor = activeList.filter(p => Boolean(p.doctor_id));
    const awaitingCollection = activeList.filter(p => Boolean(p.assigned_nurse) && (p.status === 'NURSE_ASSIGNED' || p.status === 'ANNOUNCED'));
    const inConsultation = activeList.filter(p => p.status === 'IN_CONSULTATION');

    return {
      totalWaiting: waiting.length,
      emergency: emergencies.length,
      elderly: elderly.length,
      assignedDoctor: assignedDoctor.length,
      awaitingCollection: awaitingCollection.length,
      inConsultation: inConsultation.length
    };
  }, [patients]);

  // Compute live waiting time string
  const formatWaitingTime = (createdAt) => {
    if (!createdAt) return '—';
    const created = new Date(createdAt);
    const now = new Date();
    const diffMins = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 60000));
    if (diffMins === 0) return currentLang === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${currentLang === 'ar' ? 'دقيقة' : 'mins'}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Open Modal for Assigning Doctor and Nurse
  const handleOpenAssignModal = (patient) => {
    setAssignModalPatient(patient);
    setSelectedDoctorId(patient.doctor_id || '');
    setAssignedRoom(patient.doctor_room || patient.room_number || 'Room 101');
    setSelectedNurseName(patient.assigned_nurse || DEFAULT_NURSES[0].name);
    setCustomNurseName('');
    setAutoAnnounce(true);
  };

  // Sync Room Number when Doctor is selected
  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    const doc = doctorsList.find(d => d.id === docId);
    if (doc?.room_number) {
      setAssignedRoom(doc.room_number);
    }
  };

  // Submit Assignment and trigger Voice Announcement
  const handleSaveAssignment = async () => {
    if (!assignModalPatient) return;
    const patientId = assignModalPatient.id;
    const finalNurse = (customNurseName.trim() || selectedNurseName || 'Nurse On Duty').trim();
    const doc = doctorsList.find(d => d.id === selectedDoctorId);
    const doctorName = doc ? doc.name : (assignModalPatient.doctor_name || 'Specialist Doctor');
    const doctorRoom = assignedRoom.trim() || doc?.room_number || 'Consultation Room';

    setActionLoading(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId || assignModalPatient.doctor_id,
        doctor_room: doctorRoom,
        assigned_nurse: finalNurse,
        status: 'ANNOUNCED',
        announcement_status: 'ANNOUNCED'
      };

      await assignPatientPersonnel(patientId, payload);
      setFeedback(`Assigned ${finalNurse} to Patient ${assignModalPatient.token_number}!`);

      // Trigger automatic nurse voice escort announcement
      if (autoAnnounce && !muted) {
        announceNurseEscort({
          patientId: assignModalPatient.token_number,
          patientName: assignModalPatient.name,
          nurseName: finalNurse,
          doctorName: doctorName,
          roomNumber: doctorRoom,
          lang: currentLang,
          force: true
        });
      }

      setAssignModalPatient(null);
      await loadData(true);
      onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to save patient assignment.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Manual Trigger: Announce Again
  const handleAnnounceAgain = (patient) => {
    const nurse = patient.assigned_nurse || 'Nurse Sarah';
    const doctor = patient.doctor_name || 'Consulting Specialist';
    const room = patient.doctor_room || patient.room_number || 'Room 101';

    playHospitalChime();
    setTimeout(() => {
      announceNurseEscort({
        patientId: patient.token_number,
        patientName: patient.name,
        nurseName: nurse,
        doctorName: doctor,
        roomNumber: room,
        lang: currentLang,
        force: true
      });
    }, 200);

    setFeedback(`Announced escort instructions for ${patient.token_number}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Status Lifecycle Progression Buttons
  const handleUpdateStatus = async (patientId, newStatus) => {
    setActionLoading(true);
    try {
      await updatePatientStatus(patientId, { status: newStatus });
      setFeedback(`Status updated to ${newStatus}`);
      await loadData(true);
      onDataChanged();
      playHospitalChime();
    } catch (err) {
      alert(err.message || 'Failed to update patient status.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Simulate Walk-in patient to test real-time sorting
  const handleSimulatePatient = async () => {
    setActionLoading(true);
    try {
      const res = await simulateWalkins();
      setFeedback(res.message || 'Simulated patient added to queue.');
      await loadData(true);
      onDataChanged();
    } catch (err) {
      alert(err.message || 'Simulation failed.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Toggle Mute Audio
  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setSpeechMuted(newMuted);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 backdrop-blur">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>OPD SHA • {langSorting.title || 'Patient Prioritization & Sorting Console'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-white">
              {langSorting.title || 'Patient Sorting & Prioritization'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {langSorting.subtitle || 'Automated real-time queue sorting based on emergency urgency and age (60+ priority), with nurse escort voice dispatch.'}
            </p>
          </div>

          {/* Voice Engine Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mute / Unmute Button */}
            <button
              onClick={handleToggleMute}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm border ${
                muted 
                  ? 'bg-rose-900/80 text-rose-200 border-rose-700 hover:bg-rose-800' 
                  : 'bg-emerald-900/80 text-emerald-200 border-emerald-700 hover:bg-emerald-800'
              }`}
              title={muted ? 'Unmute voice announcements' : 'Mute voice announcements'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />}
              <span>{muted ? (langSorting.voice?.unmute || 'Unmute Voice') : (langSorting.voice?.mute || 'Mute Voice')}</span>
            </button>

            {/* Announcement History Button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors shadow-sm"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>{langSorting.voice?.historyTitle || 'Voice History'}</span>
              {historyList.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px]">
                  {historyList.length}
                </span>
              )}
            </button>

            {/* Refresh Data */}
            <button
              onClick={() => loadData(false)}
              disabled={loading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{langSorting.actions?.refresh || 'Refresh'}</span>
            </button>

            {/* Simulate Walk-in */}
            <button
              onClick={handleSimulatePatient}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
              title="Add simulated patient to test real-time sorting"
            >
              <Zap className="w-4 h-4" />
              <span>{langSorting.actions?.simulatePatient || '⚡ Add Test Patient'}</span>
            </button>
          </div>
        </div>

        {/* Arabic Voice Warning / Readiness Banner */}
        {currentLang === 'ar' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${arabicVoiceReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="font-semibold text-slate-300">
                {arabicVoiceReady 
                  ? (langSorting.voice?.voiceReady || 'الصوت العربي متوفر ومفعل في متصفحك.')
                  : (langSorting.voice?.voiceWarning || 'تنبيه: لا يوجد صوت عربي مثبت في متصفحك. سيتم استخدام محرك الصوت السحابي.')}
              </span>
            </div>
            {!arabicVoiceReady && (
              <button 
                onClick={checkVoiceStatus}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-bold border border-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{langSorting.voice?.retryVoice || 'إعادة فحص الصوت'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-shake">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* DYNAMIC DASHBOARD SUMMARY CARDS (6 METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Waiting */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>{langSorting.stats?.totalWaiting || 'Total Waiting'}</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalWaiting}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">In OPD Queue</div>
        </div>

        {/* 2. Critical Emergency */}
        <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border-2 border-red-300 dark:border-red-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-700 dark:text-red-300 text-xs font-black mb-2">
            <span>{langSorting.stats?.emergency || 'Emergency'}</span>
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
            {stats.emergency}
          </div>
          <div className="text-[10px] text-red-700/80 font-bold mt-1">Highest Priority #1</div>
        </div>

        {/* 3. Elderly Patients (60+) */}
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-black mb-2">
            <span>{langSorting.stats?.elderly || 'Elderly (60+)'}</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.elderly}
          </div>
          <div className="text-[10px] text-amber-800/80 font-bold mt-1">Senior Priority #2</div>
        </div>

        {/* 4. Doctor Assigned */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>{langSorting.stats?.assignedDoctor || 'Doctor Assigned'}</span>
            <Stethoscope className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.assignedDoctor}
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-1">Room Allocated</div>
        </div>

        {/* 5. Awaiting Collection */}
        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border-2 border-indigo-300 dark:border-indigo-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-black mb-2">
            <span>{langSorting.stats?.awaitingCollection || 'Awaiting Escort'}</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.awaitingCollection}
          </div>
          <div className="text-[10px] text-indigo-700/80 font-bold mt-1">Nurse Dispatched</div>
        </div>

        {/* 6. In Consultation */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-black mb-2">
            <span>{langSorting.stats?.inConsultation || 'Consulting'}</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.inConsultation}
          </div>
          <div className="text-[10px] text-emerald-800/80 font-semibold mt-1">Inside Room</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={langSorting.filters?.searchPlaceholder || 'Search by Patient ID (Token) or Name...'}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'ALL', label: langSorting.filters?.all || 'All Patients' },
            { id: 'EMERGENCY', label: langSorting.filters?.emergencyOnly || '🚨 Emergency', isRed: true },
            { id: 'ELDERLY', label: langSorting.filters?.elderlyOnly || '👴 Elderly (60+)', isAmber: true },
            { id: 'NORMAL', label: langSorting.filters?.normalOnly || 'Standard' }
          ].map(f => {
            const isActive = categoryFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? f.isRed 
                      ? 'bg-red-600 text-white shadow-xs'
                      : f.isAmber
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">{langSorting.filters?.allStatuses || 'All Statuses'}</option>
            <option value="WAITING">Waiting in Queue</option>
            <option value="ANNOUNCED">Announced / Escort Dispatched</option>
            <option value="PATIENT_COLLECTED">Patient Collected</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* PATIENT SORTING TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{langSorting.columns?.priority || 'Priority #'}</th>
                <th className="py-3.5 px-4">{langSorting.columns?.patientId || 'Patient ID'}</th>
                <th className="py-3.5 px-4">{langSorting.columns?.patientName || 'Patient Name'}</th>
                <th className="py-3.5 px-3">{langSorting.columns?.age || 'Age'}</th>
                <th className="py-3.5 px-3">{langSorting.columns?.emergency || 'Emergency'}</th>
                <th className="py-3.5 px-4">{langSorting.columns?.category || 'Priority Category'}</th>
                <th className="py-3.5 px-4">{langSorting.columns?.doctor || 'Assigned Doctor'}</th>
                <th className="py-3.5 px-3">{langSorting.columns?.room || 'Room'}</th>
                <th className="py-3.5 px-3">{langSorting.columns?.waitTime || 'Waiting'}</th>
                <th className="py-3.5 px-4">{langSorting.columns?.nurse || 'Assigned Nurse / Caretaker'}</th>
                <th className="py-3.5 px-4 text-center">{langSorting.columns?.action || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500 font-medium">
                    No patients matching the selected filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => {
                  const prio = patient.priorityMeta || getPatientPriorityData(patient);
                  const isSenior = Number(patient.age) >= 60;
                  const isEmer = Boolean(patient.is_emergency);
                  const isDone = patient.status === 'COMPLETED';

                  return (
                    <tr 
                      key={patient.id || patient.token_number}
                      className={`transition-colors ${
                        isDone 
                          ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/40' 
                          : isEmer 
                            ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70' 
                            : isSenior 
                              ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60' 
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* 1. Priority Number */}
                      <td className="py-3.5 px-4 font-black">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-xs ${
                          isEmer
                            ? 'bg-red-600 text-white'
                            : isSenior
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>

                      {/* 2. Patient ID / Token */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{patient.token_number}</span>
                          {patient.appointment_type === 'APPOINTMENT' && (
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-sans font-bold">
                              Slot
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Patient Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div>
                          <div>{patient.name}</div>
                          {patient.govt_id && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {patient.govt_id}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Age */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{patient.age} yrs</span>
                          {isSenior && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              60+
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Emergency Status */}
                      <td className="py-3.5 px-3">
                        {isEmer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-black animate-pulse shadow-xs">
                            <ShieldAlert className="w-3 h-3" />
                            <span>EMERGENCY</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Standard</span>
                        )}
                      </td>

                      {/* 6. Priority Category */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${prio.badgeClass}`}>
                          {prio.categoryLabel}
                        </span>
                      </td>

                      {/* 7. Assigned Doctor */}
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {patient.doctor_name ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <span>{patient.doctor_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{patient.dept_name || 'General OPD'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* 8. Doctor Room */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs">
                          {patient.doctor_room || 'Room 101'}
                        </span>
                      </td>

                      {/* 9. Waiting Time */}
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatWaitingTime(patient.created_at)}</span>
                        </div>
                      </td>

                      {/* 10. Assigned Nurse / Caretaker */}
                      <td className="py-3.5 px-4">
                        {patient.assigned_nurse ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {patient.assigned_nurse}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Needs Escort</span>
                          </span>
                        )}
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Assign Nurse & Doctor */}
                          <button
                            onClick={() => handleOpenAssignModal(patient)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs"
                            title="Assign doctor, room & nurse"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Announce Voice (Manual) */}
                          <button
                            onClick={() => handleAnnounceAgain(patient)}
                            className="px-2.5 py-1.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-bold border border-cyan-200 dark:border-cyan-800 transition-colors shadow-xs"
                            title="Broadcast nurse voice announcement"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Workflow Progression */}
                          {patient.status === 'ANNOUNCED' && (
                            <button
                              onClick={() => handleUpdateStatus(patient.id, 'PATIENT_COLLECTED')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              title="Mark patient collected by nurse"
                            >
                              Collect
                            </button>
                          )}

                          {patient.status === 'PATIENT_COLLECTED' && (
                            <button
                              onClick={() => handleUpdateStatus(patient.id, 'IN_CONSULTATION')}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              title="Start doctor consultation"
                            >
                              Consult
                            </button>
                          )}

                          {patient.status === 'IN_CONSULTATION' && (
                            <button
                              onClick={() => handleUpdateStatus(patient.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              title="Mark consultation completed"
                            >
                              Done
                            </button>
                          )}

                          {/* View Patient Details */}
                          <button
                            onClick={() => setDetailsModalPatient(patient)}
                            className="px-2 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            title="View patient dossier"
                          >
                            <Info className="w-4 h-4" />
                          </button>
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

      {/* MODAL 1: ASSIGN DOCTOR & NURSE / CARETAKER */}
      {assignModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-shake">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {langSorting.modals?.assignTitle || 'Assign Doctor & Escort Personnel'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <span className="font-bold text-slate-900 dark:text-white">{assignModalPatient.name}</span> ({assignModalPatient.token_number})
                </p>
              </div>
              <button
                onClick={() => setAssignModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Doctor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {langSorting.modals?.selectDoctor || 'Select Consulting Doctor'}
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose Available Doctor...</option>
                {doctorsList.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.department_name} ({doc.room_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Consultation Room */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {langSorting.modals?.roomNumber || 'Doctor Room Number'}
              </label>
              <input
                type="text"
                value={assignedRoom}
                onChange={(e) => setAssignedRoom(e.target.value)}
                placeholder="e.g. Room 204-A, Bay 1"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Select Nurse or Caretaker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {langSorting.modals?.selectNurse || 'Assign Nurse / Caretaker Escort'}
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {DEFAULT_NURSES.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setSelectedNurseName(n.name);
                      setCustomNurseName('');
                    }}
                    className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                      selectedNurseName === n.name && !customNurseName
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <div>{n.name}</div>
                    <div className="text-[10px] font-normal opacity-80">{n.role}</div>
                  </button>
                ))}
              </div>

              {/* Custom Nurse Name option */}
              <input
                type="text"
                value={customNurseName}
                onChange={(e) => {
                  setCustomNurseName(e.target.value);
                  setSelectedNurseName('');
                }}
                placeholder={langSorting.modals?.nurseCustom || 'Or type custom nurse / caretaker name...'}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Checkbox for Voice Announcement */}
            <div className="flex items-center gap-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <input
                type="checkbox"
                id="autoAnnounce"
                checked={autoAnnounce}
                onChange={(e) => setAutoAnnounce(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="autoAnnounce" className="text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                {langSorting.modals?.autoAnnounceCheckbox || 'Broadcast voice announcement to nurse immediately'}
              </label>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalPatient(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                {langSorting.modals?.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>{langSorting.modals?.saveAndAnnounce || 'Confirm Assignment & Announce'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT CLINICAL DETAILS */}
      {detailsModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{detailsModalPatient.token_number}</span>
                  <span className="text-sm font-semibold text-slate-500">• {detailsModalPatient.name}</span>
                </h3>
                <p className="text-xs text-indigo-600 font-bold">
                  {langSorting.modals?.detailsTitle || 'Patient Clinical & Queue Dossier'}
                </p>
              </div>
              <button
                onClick={() => setDetailsModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Age & Gender</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsModalPatient.age} yrs • {detailsModalPatient.gender || 'Not Specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Contact</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsModalPatient.contact || 'None'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Govt Health ID</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsModalPatient.govt_id || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Triage Category</span>
                <span className="font-bold text-red-600 dark:text-red-400">{detailsModalPatient.is_emergency ? '🚨 CRITICAL EMERGENCY' : detailsModalPatient.age >= 60 ? '👴 SENIOR CITIZEN' : 'STANDARD'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Assigned Doctor & Room</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsModalPatient.doctor_name || 'Pending'} ({detailsModalPatient.doctor_room || 'Room 101'})</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold">Assigned Nurse / Caretaker</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsModalPatient.assigned_nurse || 'Unassigned'}</span>
              </div>
            </div>

            {/* Clinical & Triage Notes */}
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block mb-1">Triage Assessment Notes:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {detailsModalPatient.triage_notes || 'Standard clinical registration. No acute distress reported.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailsModalPatient(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {langSorting.modals?.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VOICE ANNOUNCEMENT HISTORY */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {langSorting.voice?.historyTitle || 'Voice Announcement History'}
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  {langSorting.voice?.noHistory || 'No voice announcements recorded yet.'}
                </div>
              ) : (
                historyList.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Patient {item.patientId}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          {item.status || 'Announced'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium text-xs line-clamp-2 leading-relaxed">
                        "{item.text}"
                      </p>
                    </div>

                    <button
                      onClick={() => speakText(item.text, item.lang)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Re-play</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {langSorting.modals?.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
