import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Clock,
  Star,
  FileText,
  Clipboard,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Stethoscope,
  ArrowRight,
  Users,
  Heart,
  Bell,
  Play,
  PenLine,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const i18n = {
  en: {
    title: "Doctor's Dashboard",
    todaysPatients: 'Today\'s Patients',
    inQueue: 'In Queue',
    completed: 'Completed',
    avgRating: 'Average Rating',
    currentQueue: 'Current Queue',
    quickActions: 'Quick Actions',
    writePrescription: 'Write Prescription',
    viewSchedule: 'View Schedule',
    viewRatings: 'View Ratings',
    startConsultation: 'Start Consultation',
    markComplete: 'Mark Complete',
    noPatients: 'No patients in queue',
    token: 'Token',
    name: 'Name',
    age: 'Age',
    status: 'Status',
    priority: 'Priority',
    actions: 'Actions',
    emergency: 'Emergency',
    senior: 'Senior',
    normal: 'Normal',
    waiting: 'Waiting',
    inProgress: 'In Progress',
    todaySchedule: "Today's Schedule",
    slotTime: 'Time Slot',
    department: 'Department',
    room: 'Room',
    consultation: 'Consultation',
    searchPatient: 'Search patient...',
    noSchedule: 'No schedule found for today',
    refreshing: 'Refreshing...',
    refresh: 'Refresh',
    patients: 'patients',
    yrs: 'yrs',
    viewAll: 'View All',
    recentPrescriptions: 'Recent Prescriptions',
    noPrescriptions: 'No prescriptions yet',
    patientReviews: 'Patient Reviews',
    noReviews: 'No reviews yet',
    stars: 'stars',
    outOf: 'out of 5',
    welcome: 'Welcome, Dr.',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
  },
  ar: {
    title: 'لوحة تحكم الطبيب',
    todaysPatients: 'مرضى اليوم',
    inQueue: 'في الانتظار',
    completed: 'مكتمل',
    avgRating: 'متوسط التقييم',
    currentQueue: 'قائمة الانتظار الحالية',
    quickActions: 'إجراءات سريعة',
    writePrescription: 'كتابة وصفة',
    viewSchedule: 'عرض الجدول',
    viewRatings: 'عرض التقييمات',
    startConsultation: 'بدء الاستشارة',
    markComplete: 'تحديد كمكتمل',
    noPatients: 'لا يوجد مرضى في الانتظار',
    token: 'رقم',
    name: 'الاسم',
    age: 'العمر',
    status: 'الحالة',
    priority: 'الأولوية',
    actions: 'الإجراءات',
    emergency: 'طوارئ',
    senior: 'كبير السن',
    normal: 'عادي',
    waiting: 'في الانتظار',
    inProgress: 'قيد التنفيذ',
    todaySchedule: 'جدول اليوم',
    slotTime: 'وقت الموعد',
    department: 'القسم',
    room: 'الغرفة',
    consultation: 'الاستشارة',
    searchPatient: 'البحث عن مريض...',
    noSchedule: 'لا يوجد جدول لليوم',
    refreshing: 'جارٍ التحديث...',
    refresh: 'تحديث',
    patients: 'مرضى',
    yrs: 'سنة',
    viewAll: 'عرض الكل',
    recentPrescriptions: 'الوصفات الأخيرة',
    noPrescriptions: 'لا توجد وصفات بعد',
    patientReviews: 'تقييمات المرضى',
    noReviews: 'لا توجد تقييمات بعد',
    stars: 'نجوم',
    outOf: 'من 5',
    welcome: 'مرحباً، د.',
    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
  }
};

// Demo data factories
const getDemoPatients = () => [
  { id: 'p1', token_number: 'GEN-101', name: 'Ravi Kumar', age: 34, status: 'WAITING', is_emergency: false, department: 'General Medicine', doctor_id: 'doc1', priority: 'normal', gender: 'Male' },
  { id: 'p2', token_number: 'GEN-102', name: 'Fatima Begum', age: 67, status: 'WAITING', is_emergency: false, department: 'General Medicine', doctor_id: 'doc1', priority: 'senior', gender: 'Female' },
  { id: 'p3', token_number: 'EMER-103', name: 'Arjun Singh', age: 45, status: 'IN_PROGRESS', is_emergency: true, department: 'General Medicine', doctor_id: 'doc1', priority: 'emergency', gender: 'Male' },
  { id: 'p4', token_number: 'GEN-104', name: 'Lakshmi Devi', age: 72, status: 'WAITING', is_emergency: false, department: 'General Medicine', doctor_id: 'doc1', priority: 'senior', gender: 'Female' },
  { id: 'p5', token_number: 'GEN-105', name: 'Mohammed Ali', age: 28, status: 'COMPLETED', is_emergency: false, department: 'General Medicine', doctor_id: 'doc1', priority: 'normal', gender: 'Male' },
  { id: 'p6', token_number: 'GEN-106', name: 'Priya Sharma', age: 52, status: 'WAITING', is_emergency: false, department: 'General Medicine', doctor_id: 'doc1', priority: 'normal', gender: 'Female' },
];

const getDemoPrescriptions = () => [
  { id: 'rx1', patient_name: 'Mohammed Ali', patient_id: 'p5', date: '2024-01-15', medicines: ['Amoxicillin 500mg', 'Paracetamol 650mg'], diagnosis: 'Upper Respiratory Infection', doctor_id: 'doc1' },
  { id: 'rx2', patient_name: 'Sita Rao', patient_id: 'p7', date: '2024-01-15', medicines: ['Metformin 500mg', 'Glimepiride 1mg'], diagnosis: 'Type 2 Diabetes', doctor_id: 'doc1' },
];

const getDemoRatings = () => [
  { id: 'r1', patient_name: 'Ahmed Khan', rating: 5, review: 'Excellent doctor, very thorough examination.', date: '2024-01-14', doctor_id: 'doc1' },
  { id: 'r2', patient_name: 'Deepa Nair', rating: 4, review: 'Very professional and caring.', date: '2024-01-13', doctor_id: 'doc1' },
  { id: 'r3', patient_name: 'Ramesh Gupta', rating: 5, review: 'Best doctor in the hospital!', date: '2024-01-12', doctor_id: 'doc1' },
];

const getDemoSchedule = () => [
  { id: 's1', time: '09:00 - 10:00', department: 'General Medicine', room: 'Room 201', type: 'OPD', doctor_id: 'doc1' },
  { id: 's2', time: '10:00 - 11:00', department: 'General Medicine', room: 'Room 201', type: 'OPD', doctor_id: 'doc1' },
  { id: 's3', time: '11:30 - 12:30', department: 'General Medicine', room: 'Room 201', type: 'Follow-up', doctor_id: 'doc1' },
  { id: 's4', time: '14:00 - 15:00', department: 'General Medicine', room: 'Room 201', type: 'OPD', doctor_id: 'doc1' },
  { id: 's5', time: '15:00 - 16:00', department: 'General Medicine', room: 'Room 201', type: 'Emergency', doctor_id: 'doc1' },
];

const getDemoSession = () => ({
  role: 'doctor',
  id: 'doc1',
  name: 'Dr. Aisha Patel',
  department: 'General Medicine',
  specialization: 'Internal Medicine',
});

export default function DoctorDashboard({
  currentLang = 'en',
  t: parentT = {},
  darkMode = false,
  onWritePrescription = () => {},
  onViewPatient = () => {}
}) {
  const lang = i18n[currentLang] || i18n.en;

  const [session, setSession] = useState(null);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePanel, setActivePanel] = useState('queue'); // queue | schedule | ratings
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('opd_sha_session');
      const sess = savedSession ? JSON.parse(savedSession) : getDemoSession();
      setSession(sess);

      const savedPatients = localStorage.getItem('opd_sha_mock_patients');
      const allPatients = savedPatients ? JSON.parse(savedPatients) : getDemoPatients();
      const doctorPatients = allPatients.filter(p => p.doctor_id === (sess.id || 'doc1'));
      setPatients(doctorPatients);

      const savedRx = localStorage.getItem('opd_sha_prescriptions');
      const allRx = savedRx ? JSON.parse(savedRx) : getDemoPrescriptions();
      setPrescriptions(allRx.filter(rx => rx.doctor_id === (sess.id || 'doc1')));

      const savedRatings = localStorage.getItem('opd_sha_doctor_ratings');
      const allRatings = savedRatings ? JSON.parse(savedRatings) : getDemoRatings();
      setRatings(allRatings.filter(r => r.doctor_id === (sess.id || 'doc1')));

      const savedSchedule = localStorage.getItem('opd_sha_doctor_schedules');
      const allSchedules = savedSchedule ? JSON.parse(savedSchedule) : getDemoSchedule();
      setSchedule(Array.isArray(allSchedules) ? allSchedules.filter(s => s.doctor_id === (sess.id || 'doc1')) : []);
    } catch (err) {
      console.error('DoctorDashboard: Failed to load data', err);
      setSession(getDemoSession());
      setPatients(getDemoPatients());
      setPrescriptions(getDemoPrescriptions());
      setRatings(getDemoRatings());
      setSchedule(getDemoSchedule());
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleStartConsultation = (patientId) => {
    try {
      const updated = patients.map(p =>
        p.id === patientId ? { ...p, status: 'IN_PROGRESS' } : p
      );
      setPatients(updated);
      const allSaved = localStorage.getItem('opd_sha_mock_patients');
      if (allSaved) {
        const all = JSON.parse(allSaved);
        const newAll = all.map(p => p.id === patientId ? { ...p, status: 'IN_PROGRESS' } : p);
        localStorage.setItem('opd_sha_mock_patients', JSON.stringify(newAll));
      }
    } catch (err) {
      console.error('Failed to start consultation', err);
    }
    onViewPatient(patientId);
  };

  const handleMarkComplete = (patientId) => {
    try {
      const updated = patients.map(p =>
        p.id === patientId ? { ...p, status: 'COMPLETED' } : p
      );
      setPatients(updated);
      const allSaved = localStorage.getItem('opd_sha_mock_patients');
      if (allSaved) {
        const all = JSON.parse(allSaved);
        const newAll = all.map(p => p.id === patientId ? { ...p, status: 'COMPLETED' } : p);
        localStorage.setItem('opd_sha_mock_patients', JSON.stringify(newAll));
      }
    } catch (err) {
      console.error('Failed to mark complete', err);
    }
  };

  // Computed stats
  const waitingPatients = patients.filter(p => p.status === 'WAITING' || p.status === 'IN_PROGRESS');
  const inQueue = patients.filter(p => p.status === 'WAITING').length;
  const completedCount = patients.filter(p => p.status === 'COMPLETED').length;
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '—';

  const filteredPatients = waitingPatients.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.token_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: emergency first, then seniors, then normal
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const priorityOrder = { emergency: 0, senior: 1, normal: 2 };
    const pa = a.is_emergency ? 0 : (a.age >= 60 ? 1 : 2);
    const pb = b.is_emergency ? 0 : (b.age >= 60 ? 1 : 2);
    return pa - pb;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang.goodMorning;
    if (hour < 17) return lang.goodAfternoon;
    return lang.goodEvening;
  };

  const getPriorityBadge = (patient) => {
    if (patient.is_emergency) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-300">
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

  const getStatusBadge = (status) => {
    if (status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Activity className="w-3 h-3" />
          {lang.inProgress}
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle className="w-3 h-3" />
          {lang.completed}
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
    <div className={`min-h-screen ${containerBg} p-4 md:p-6 lg:p-8`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {getGreeting()}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-indigo-500" />
              {session?.name || lang.welcome}
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {session?.department} • {session?.specialization}
            </p>
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang.todaysPatients, value: patients.length, icon: Users, color: 'indigo', sub: lang.patients },
          { label: lang.inQueue, value: inQueue, icon: Clock, color: 'amber', sub: lang.waiting },
          { label: lang.completed, value: completedCount, icon: CheckCircle, color: 'emerald', sub: lang.patients },
          { label: lang.avgRating, value: avgRating, icon: Star, color: 'yellow', sub: `${ratings.length} ${lang.patientReviews?.split(' ')[0] || 'reviews'}` },
        ].map((stat, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${cardBase} transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {stat.label}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                ${stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''}
                ${stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' : ''}
                ${stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/40' : ''}
              `}>
                <stat.icon className={`w-5 h-5
                  ${stat.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  ${stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                  ${stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                  ${stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                `} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Current Queue (2/3 width) */}
        <div className={`lg:col-span-2 rounded-xl border ${cardBase}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {lang.currentQueue}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {sortedPatients.length}
                </span>
              </h2>
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

          <div className="overflow-x-auto">
            {sortedPatients.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lang.noPatients}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <th className="px-4 py-3 text-left font-medium">{lang.token}</th>
                    <th className="px-4 py-3 text-left font-medium">{lang.name}</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{lang.age}</th>
                    <th className="px-4 py-3 text-left font-medium">{lang.priority}</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{lang.status}</th>
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
                      <td className="px-4 py-3">{getPriorityBadge(patient)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{getStatusBadge(patient.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {patient.status === 'WAITING' && (
                            <button
                              onClick={() => handleStartConsultation(patient.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                            >
                              <Play className="w-3 h-3" />
                              <span className="hidden sm:inline">{lang.startConsultation}</span>
                            </button>
                          )}
                          <button
                            onClick={() => onWritePrescription(patient.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm
                              ${darkMode
                                ? 'bg-slate-700 hover:bg-slate-600 text-emerald-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                          >
                            <PenLine className="w-3 h-3" />
                            <span className="hidden lg:inline">{lang.writePrescription}</span>
                          </button>
                          {patient.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleMarkComplete(patient.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">{lang.markComplete}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Quick Actions + Mini Panels (1/3 width) */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className={`rounded-xl border p-4 ${cardBase}`}>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              {lang.quickActions}
            </h3>
            <div className="space-y-2">
              {[
                { label: lang.writePrescription, icon: FileText, color: 'emerald', action: () => onWritePrescription(null) },
                { label: lang.viewSchedule, icon: Calendar, color: 'indigo', action: () => setActivePanel('schedule') },
                { label: lang.viewRatings, icon: Star, color: 'yellow', action: () => setActivePanel('ratings') },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${darkMode
                      ? 'bg-slate-700/50 hover:bg-slate-700 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4
                      ${item.color === 'emerald' ? 'text-emerald-500' : ''}
                      ${item.color === 'indigo' ? 'text-indigo-500' : ''}
                      ${item.color === 'yellow' ? 'text-yellow-500' : ''}
                    `} />
                    {item.label}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className={`rounded-xl border p-4 ${cardBase}`}>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-emerald-500" />
              {lang.recentPrescriptions}
            </h3>
            {prescriptions.length === 0 ? (
              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang.noPrescriptions}</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.slice(0, 3).map(rx => (
                  <div key={rx.id} className={`p-3 rounded-lg text-xs ${
                    darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{rx.patient_name}</span>
                      <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>{rx.date}</span>
                    </div>
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{rx.diagnosis}</p>
                    <p className={`mt-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {rx.medicines.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rating Summary */}
          <div className={`rounded-xl border p-4 ${cardBase}`}>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              {lang.patientReviews}
            </h3>
            {ratings.length === 0 ? (
              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang.noReviews}</p>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-bold text-yellow-500">{avgRating}</span>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${
                          s <= Math.round(Number(avgRating))
                            ? 'text-yellow-400 fill-yellow-400'
                            : (darkMode ? 'text-slate-600' : 'text-slate-300')
                        }`} />
                      ))}
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {ratings.length} {lang.patientReviews?.split(' ')[0]}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ratings.slice(0, 2).map(r => (
                    <div key={r.id} className={`p-2 rounded-lg text-xs ${
                      darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${
                            s <= r.rating ? 'text-yellow-400 fill-yellow-400' : (darkMode ? 'text-slate-600' : 'text-slate-300')
                          }`} />
                        ))}
                        <span className={`ml-2 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{r.patient_name}</span>
                      </div>
                      <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{r.review}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule Timeline */}
      <div className={`rounded-xl border ${cardBase}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            {lang.todaySchedule}
          </h2>
        </div>
        {schedule.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className={`w-10 h-10 mx-auto mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{lang.noSchedule}</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {schedule.map((slot, i) => {
                const now = new Date();
                const hour = now.getHours();
                const slotHour = parseInt(slot.time.split(':')[0], 10);
                const isActive = hour >= slotHour && hour < slotHour + 1;
                const isPast = hour > slotHour;

                return (
                  <div
                    key={slot.id || i}
                    className={`p-3 rounded-lg border-2 transition-all relative
                      ${isActive
                        ? (darkMode ? 'border-indigo-500 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50')
                        : isPast
                          ? (darkMode ? 'border-slate-700 bg-slate-800/50 opacity-60' : 'border-slate-200 bg-slate-50 opacity-60')
                          : (darkMode ? 'border-slate-700' : 'border-slate-200')
                      }`}
                  >
                    {isActive && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-4 h-4 ${isActive ? 'text-indigo-500' : (darkMode ? 'text-slate-500' : 'text-slate-400')}`} />
                      <span className={`text-sm font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{slot.time}</span>
                    </div>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{slot.department}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{slot.room}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium
                      ${slot.type === 'Emergency'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : slot.type === 'Follow-up'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      }`}>
                      {slot.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
