import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Clock,
  Bell,
  Activity,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  ArrowRight,
  Users,
  Heart,
  Volume2,
  Shield,
  HelpCircle,
  RefreshCw,
  Search,
  MapPin,
  Clipboard,
  PhoneCall
} from 'lucide-react';
import { speakFullAnnouncement } from '../services/speech';

const i18n = {
  en: {
    title: 'Nurse Dashboard',
    assignedPatients: 'Assigned Patients',
    pendingEscorts: 'Pending Escorts',
    completed: 'Completed',
    activeAlerts: 'Active Alerts',
    priority: 'Priority',
    token: 'Token',
    patient: 'Patient',
    age: 'Age',
    doctor: 'Doctor',
    room: 'Room',
    status: 'Status',
    actions: 'Actions',
    escortToRoom: 'Escort to Room',
    markCollected: 'Mark Collected',
    requestHelp: 'Request Help',
    announce: 'Announce',
    noPatients: 'No patients assigned',
    emergency: 'Emergency',
    senior: 'Senior',
    normal: 'Normal',
    waiting: 'Waiting',
    inTransit: 'In Transit',
    collected: 'Collected',
    atDoctor: 'At Doctor',
    searchPatient: 'Search patient...',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    markRead: 'Mark as Read',
    clearAll: 'Clear All',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    yrs: 'yrs',
    welcome: 'Welcome, Nurse',
    patientManagement: 'Patient Management',
    escortQueue: 'Escort Queue',
    today: 'Today',
    announceEscort: 'Call patient for escort',
    helpRequested: 'Help requested successfully',
    escorted: 'Patient marked as escorted',
    voiceAnnouncement: 'Voice Announcement',
    filterAll: 'All',
    filterPending: 'Pending',
    filterCompleted: 'Completed',
  },
  ar: {
    title: 'لوحة تحكم التمريض',
    assignedPatients: 'المرضى المعينون',
    pendingEscorts: 'المرافقات المعلقة',
    completed: 'مكتمل',
    activeAlerts: 'التنبيهات النشطة',
    priority: 'الأولوية',
    token: 'رقم',
    patient: 'المريض',
    age: 'العمر',
    doctor: 'الطبيب',
    room: 'الغرفة',
    status: 'الحالة',
    actions: 'الإجراءات',
    escortToRoom: 'مرافقة إلى الغرفة',
    markCollected: 'تم الاستلام',
    requestHelp: 'طلب مساعدة',
    announce: 'إعلان',
    noPatients: 'لا يوجد مرضى معينون',
    emergency: 'طوارئ',
    senior: 'كبير السن',
    normal: 'عادي',
    waiting: 'في الانتظار',
    inTransit: 'في الطريق',
    collected: 'تم الجمع',
    atDoctor: 'عند الطبيب',
    searchPatient: 'البحث عن مريض...',
    notifications: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات جديدة',
    markRead: 'تحديد كمقروء',
    clearAll: 'مسح الكل',
    refresh: 'تحديث',
    refreshing: 'جارٍ التحديث...',
    yrs: 'سنة',
    welcome: 'مرحباً، الممرضة',
    patientManagement: 'إدارة المرضى',
    escortQueue: 'قائمة المرافقة',
    today: 'اليوم',
    announceEscort: 'نداء المريض للمرافقة',
    helpRequested: 'تم طلب المساعدة بنجاح',
    escorted: 'تم تحديد المريض كمرافق',
    voiceAnnouncement: 'إعلان صوتي',
    filterAll: 'الكل',
    filterPending: 'معلق',
    filterCompleted: 'مكتمل',
  }
};

// Demo data
const getDemoSession = () => ({
  role: 'nurse',
  id: 'nurse1',
  name: 'Nurse Priya Menon',
  department: 'General Ward',
});

const getDemoPatients = () => [
  { id: 'p1', token_number: 'GEN-101', name: 'Ravi Kumar', age: 34, status: 'WAITING', is_emergency: false, department: 'General Medicine', doctor_name: 'Dr. Aisha Patel', room: 'Room 201', assigned_nurse: 'Nurse Priya Menon', escort_status: 'pending', gender: 'Male' },
  { id: 'p2', token_number: 'GEN-102', name: 'Fatima Begum', age: 67, status: 'WAITING', is_emergency: false, department: 'Cardiology', doctor_name: 'Dr. Vikram Shah', room: 'Room 305', assigned_nurse: 'Nurse Priya Menon', escort_status: 'pending', gender: 'Female' },
  { id: 'p3', token_number: 'EMER-103', name: 'Arjun Singh', age: 45, status: 'IN_PROGRESS', is_emergency: true, department: 'Emergency', doctor_name: 'Dr. Aisha Patel', room: 'Trauma Bay 1', assigned_nurse: 'Nurse Priya Menon', escort_status: 'in_transit', gender: 'Male' },
  { id: 'p4', token_number: 'GEN-104', name: 'Lakshmi Devi', age: 72, status: 'WAITING', is_emergency: false, department: 'Orthopedics', doctor_name: 'Dr. Rajesh Iyer', room: 'Room 112', assigned_nurse: 'Nurse Priya Menon', escort_status: 'pending', gender: 'Female' },
  { id: 'p5', token_number: 'GEN-105', name: 'Mohammed Ali', age: 28, status: 'COMPLETED', is_emergency: false, department: 'ENT', doctor_name: 'Dr. Sara Khan', room: 'Room 210', assigned_nurse: 'Nurse Priya Menon', escort_status: 'collected', gender: 'Male' },
  { id: 'p6', token_number: 'EMER-106', name: 'Deepa Nair', age: 55, status: 'WAITING', is_emergency: true, department: 'Cardiology', doctor_name: 'Dr. Vikram Shah', room: 'Room 305', assigned_nurse: 'Nurse Priya Menon', escort_status: 'pending', gender: 'Female' },
];

const getDemoNotifications = () => [
  { id: 'n1', message: 'Emergency patient Arjun Singh requires immediate escort to Trauma Bay 1', type: 'emergency', time: '2 min ago', read: false },
  { id: 'n2', message: 'Dr. Aisha Patel requested vitals check for Room 201', type: 'info', time: '5 min ago', read: false },
  { id: 'n3', message: 'Lab results ready for patient Fatima Begum - Token GEN-102', type: 'info', time: '12 min ago', read: false },
  { id: 'n4', message: 'Shift change reminder: Evening shift starts at 14:00', type: 'warning', time: '30 min ago', read: true },
];

export default function NurseDashboard({
  currentLang = 'en',
  t: parentT = {},
  darkMode = false
}) {
  const lang = i18n[currentLang] || i18n.en;

  const [session, setSession] = useState(null);
  const [patients, setPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const loadData = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('opd_sha_session');
      const sess = savedSession ? JSON.parse(savedSession) : getDemoSession();
      setSession(sess);

      const savedPatients = localStorage.getItem('opd_sha_mock_patients');
      const allPatients = savedPatients ? JSON.parse(savedPatients) : getDemoPatients();
      const nursePatients = allPatients.filter(p => p.assigned_nurse === (sess.name || 'Nurse Priya Menon'));
      setPatients(nursePatients);

      const savedNotifs = localStorage.getItem('opd_sha_notifications');
      setNotifications(savedNotifs ? JSON.parse(savedNotifs) : getDemoNotifications());
    } catch (err) {
      console.error('NurseDashboard: Failed to load data', err);
      setSession(getDemoSession());
      setPatients(getDemoPatients());
      setNotifications(getDemoNotifications());
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Feedback auto-dismiss
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const announceNurseEscort = (patient) => {
    try {
      speakFullAnnouncement({
        type: 'call',
        patientName: patient.name,
        tokenNumber: patient.token_number,
        doctorName: patient.doctor || 'Doctor',
        roomNumber: patient.room || 'Room 101'
      }, currentLang);
    } catch (err) {
      console.error('Voice announcement failed', err);
    }
  };

  const handleEscort = (patientId) => {
    try {
      const updated = patients.map(p =>
        p.id === patientId ? { ...p, escort_status: 'in_transit', status: 'IN_PROGRESS' } : p
      );
      setPatients(updated);
      const allSaved = localStorage.getItem('opd_sha_mock_patients');
      if (allSaved) {
        const all = JSON.parse(allSaved);
        const newAll = all.map(p => p.id === patientId ? { ...p, escort_status: 'in_transit', status: 'IN_PROGRESS' } : p);
        localStorage.setItem('opd_sha_mock_patients', JSON.stringify(newAll));
      }
      setFeedback(lang.escorted);
    } catch (err) {
      console.error('Failed to escort patient', err);
    }
  };

  const handleMarkCollected = (patientId) => {
    try {
      const updated = patients.map(p =>
        p.id === patientId ? { ...p, escort_status: 'collected', status: 'COMPLETED' } : p
      );
      setPatients(updated);
      const allSaved = localStorage.getItem('opd_sha_mock_patients');
      if (allSaved) {
        const all = JSON.parse(allSaved);
        const newAll = all.map(p => p.id === patientId ? { ...p, escort_status: 'collected', status: 'COMPLETED' } : p);
        localStorage.setItem('opd_sha_mock_patients', JSON.stringify(newAll));
      }
    } catch (err) {
      console.error('Failed to mark collected', err);
    }
  };

  const handleRequestHelp = (patient) => {
    try {
      const newNotif = {
        id: `n_${Date.now()}`,
        message: `Help requested for patient ${patient.name} (${patient.token_number}) in ${patient.room}`,
        type: 'emergency',
        time: 'Just now',
        read: false
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      localStorage.setItem('opd_sha_notifications', JSON.stringify(updatedNotifs));
      setFeedback(lang.helpRequested);
    } catch (err) {
      console.error('Failed to request help', err);
    }
  };

  const handleMarkNotifRead = (notifId) => {
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifications(updated);
    try {
      localStorage.setItem('opd_sha_notifications', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update notification', err);
    }
  };

  const handleClearNotifs = () => {
    setNotifications([]);
    try {
      localStorage.setItem('opd_sha_notifications', JSON.stringify([]));
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
    setShowNotifications(false);
  };

  // Stats
  const pendingEscorts = patients.filter(p => p.escort_status === 'pending').length;
  const completedCount = patients.filter(p => p.escort_status === 'collected' || p.status === 'COMPLETED').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const alertCount = patients.filter(p => p.is_emergency).length;

  // Filtering
  let filteredPatients = patients.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.token_number.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (statusFilter === 'pending') {
    filteredPatients = filteredPatients.filter(p => p.escort_status === 'pending' || p.escort_status === 'in_transit');
  } else if (statusFilter === 'completed') {
    filteredPatients = filteredPatients.filter(p => p.escort_status === 'collected' || p.status === 'COMPLETED');
  }

  // Sort: emergency first, then seniors, then rest
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const pa = a.is_emergency ? 0 : (a.age >= 60 ? 1 : 2);
    const pb = b.is_emergency ? 0 : (b.age >= 60 ? 1 : 2);
    return pa - pb;
  });

  const getPriorityBadge = (patient) => {
    if (patient.is_emergency) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-300 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          {lang.emergency}
        </span>
      );
    }
    if (patient.age >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300">
          <Heart className="w-3 h-3" />
          {lang.senior}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        {lang.normal}
      </span>
    );
  };

  const getEscortStatusBadge = (patient) => {
    if (patient.escort_status === 'in_transit') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Activity className="w-3 h-3" />
          {lang.inTransit}
        </span>
      );
    }
    if (patient.escort_status === 'collected' || patient.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle className="w-3 h-3" />
          {lang.collected}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
        <Clock className="w-3 h-3" />
        {lang.waiting}
      </span>
    );
  };

  const cardBase = darkMode
    ? 'bg-slate-800 border-slate-700 text-white'
    : 'bg-white border-slate-200 text-slate-900';
  const containerBg = darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen ${containerBg} p-4 md:p-6 lg:p-8 relative`}>
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="px-4 py-3 rounded-lg shadow-lg bg-emerald-600 text-white text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {feedback}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-500" />
              {lang.title}
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {session?.name || lang.welcome} • {session?.department}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-lg transition-colors
                  ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'}`}
              >
                <Bell className={`w-5 h-5 ${unreadNotifs > 0 ? 'text-indigo-500' : (darkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 top-12 w-80 sm:w-96 rounded-xl border shadow-xl z-40 ${cardBase} max-h-96 overflow-hidden`}>
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-sm">{lang.notifications}</h3>
                    <button
                      onClick={handleClearNotifs}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      {lang.clearAll}
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang.noNotifications}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors
                            ${n.read
                              ? (darkMode ? 'bg-slate-800' : 'bg-white')
                              : (darkMode ? 'bg-indigo-900/10' : 'bg-indigo-50/50')
                            } hover:${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}
                          onClick={() => handleMarkNotifRead(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              n.type === 'emergency' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed">{n.message}</p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{n.time}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${darkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                } ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? lang.refreshing : lang.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang.assignedPatients, value: patients.length, icon: Users, color: 'indigo' },
          { label: lang.pendingEscorts, value: pendingEscorts, icon: MapPin, color: 'amber' },
          { label: lang.completed, value: completedCount, icon: CheckCircle, color: 'emerald' },
          { label: lang.activeAlerts, value: alertCount, icon: AlertTriangle, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl border p-4 ${cardBase} transition-shadow hover:shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {stat.label}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                ${stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''}
                ${stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' : ''}
                ${stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}
                ${stat.color === 'red' ? 'bg-red-100 dark:bg-red-900/40' : ''}
              `}>
                <stat.icon className={`w-5 h-5
                  ${stat.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  ${stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                  ${stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                  ${stat.color === 'red' ? 'text-red-600 dark:text-red-400' : ''}
                `} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content: Patient Table */}
      <div className={`rounded-xl border ${cardBase}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-indigo-500" />
              {lang.patientManagement}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Status Filter */}
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                {['all', 'pending', 'completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors
                      ${statusFilter === f
                        ? 'bg-indigo-600 text-white'
                        : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-slate-600 hover:bg-slate-50')
                      }`}
                  >
                    {f === 'all' ? lang.filterAll : f === 'pending' ? lang.filterPending : lang.filterCompleted}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder={lang.searchPatient}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-3 py-2 rounded-lg text-sm border w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {sortedPatients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang.noPatients}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  <th className="px-4 py-3 text-left font-medium">{lang.priority}</th>
                  <th className="px-4 py-3 text-left font-medium">{lang.token}</th>
                  <th className="px-4 py-3 text-left font-medium">{lang.patient}</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{lang.age}</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{lang.doctor}</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{lang.room}</th>
                  <th className="px-4 py-3 text-left font-medium">{lang.status}</th>
                  <th className="px-4 py-3 text-right font-medium">{lang.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`border-b transition-colors
                      ${patient.is_emergency
                        ? (darkMode ? 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20' : 'bg-red-50/60 border-red-100 hover:bg-red-50')
                        : patient.age >= 60
                          ? (darkMode ? 'bg-amber-900/10 border-amber-900/30 hover:bg-amber-900/20' : 'bg-amber-50/40 border-amber-100/50 hover:bg-amber-50')
                          : (darkMode ? 'border-slate-700 hover:bg-slate-750' : 'border-slate-50 hover:bg-slate-50')
                      }`}
                  >
                    <td className="px-4 py-3">{getPriorityBadge(patient)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${
                        darkMode ? 'bg-slate-700 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {patient.token_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {patient.name.charAt(0)}
                        </div>
                        <span className="font-medium">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                        {patient.age} {lang.yrs}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-indigo-400" />
                        <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{patient.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{patient.room}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getEscortStatusBadge(patient)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Voice Announcement */}
                        <button
                          onClick={() => announceNurseEscort(patient)}
                          title={lang.voiceAnnouncement}
                          className={`p-1.5 rounded-lg transition-colors
                            ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {patient.escort_status === 'pending' && (
                          <button
                            onClick={() => handleEscort(patient.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span className="hidden xl:inline">{lang.escortToRoom}</span>
                          </button>
                        )}
                        {patient.escort_status === 'in_transit' && (
                          <button
                            onClick={() => handleMarkCollected(patient.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden xl:inline">{lang.markCollected}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRequestHelp(patient)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm
                            ${darkMode
                              ? 'bg-slate-700 hover:bg-slate-600 text-red-400'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span className="hidden xl:inline">{lang.requestHelp}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Click-away for notification dropdown */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
