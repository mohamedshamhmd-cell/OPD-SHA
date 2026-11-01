import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Clock,
  Star,
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Stethoscope,
  ArrowRight,
  Heart,
  Bell,
  Clipboard,
  RefreshCw,
  MessageSquare,
  Send,
  Hash,
  Timer
} from 'lucide-react';

const i18n = {
  en: {
    title: 'Patient Portal',
    myProfile: 'My Profile',
    name: 'Name',
    token: 'Token',
    department: 'Department',
    doctor: 'Doctor',
    queuePosition: 'Queue Position',
    status: 'Status',
    tabs: {
      queueStatus: 'Queue Status',
      visitHistory: 'Visit History',
      prescriptions: 'Prescriptions',
      rateDoctor: 'Rate Doctor',
    },
    queueLive: 'Live Queue Position',
    estimatedWait: 'Estimated Wait',
    minutes: 'minutes',
    youAre: 'You are',
    inQueue: 'in queue',
    positionPrefix: '#',
    waitingForDoctor: 'Waiting for Doctor',
    yourTurnSoon: 'Your turn is coming up soon!',
    yourTurnNow: 'Your turn is now! Please proceed.',
    progressLabel: 'Queue Progress',
    visitDate: 'Date',
    visitDoctor: 'Doctor',
    visitDepartment: 'Department',
    visitDiagnosis: 'Diagnosis',
    visitStatus: 'Status',
    noVisits: 'No visit history found',
    prescriptionDate: 'Date',
    prescriptionDoctor: 'Doctor',
    prescriptionMedicines: 'Medicines',
    prescriptionDiagnosis: 'Diagnosis',
    noPrescriptions: 'No prescriptions found',
    rateYourDoctor: 'Rate Your Doctor',
    selectRating: 'Select your rating',
    writeReview: 'Write a review (optional)',
    reviewPlaceholder: 'Share your experience with the doctor...',
    submitRating: 'Submit Rating',
    ratingSubmitted: 'Thank you! Your rating has been submitted.',
    waiting: 'Waiting',
    inProgress: 'In Progress',
    completed: 'Completed',
    emergency: 'Emergency',
    appointmentType: 'Type',
    walkIn: 'Walk-In',
    appointment: 'Appointment',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    stars: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
    lastUpdated: 'Last updated',
    secondsAgo: 'seconds ago',
    liveIndicator: 'LIVE',
  },
  ar: {
    title: 'بوابة المريض',
    myProfile: 'ملفي الشخصي',
    name: 'الاسم',
    token: 'رقم التذكرة',
    department: 'القسم',
    doctor: 'الطبيب',
    queuePosition: 'الموقع في الصف',
    status: 'الحالة',
    tabs: {
      queueStatus: 'حالة الصف',
      visitHistory: 'سجل الزيارات',
      prescriptions: 'الوصفات',
      rateDoctor: 'تقييم الطبيب',
    },
    queueLive: 'موقع الصف المباشر',
    estimatedWait: 'الوقت المقدر',
    minutes: 'دقائق',
    youAre: 'أنت',
    inQueue: 'في الصف',
    positionPrefix: '#',
    waitingForDoctor: 'في انتظار الطبيب',
    yourTurnSoon: 'دورك قريبًا!',
    yourTurnNow: 'دورك الآن! يرجى التوجه.',
    progressLabel: 'تقدم الصف',
    visitDate: 'التاريخ',
    visitDoctor: 'الطبيب',
    visitDepartment: 'القسم',
    visitDiagnosis: 'التشخيص',
    visitStatus: 'الحالة',
    noVisits: 'لا يوجد سجل زيارات',
    prescriptionDate: 'التاريخ',
    prescriptionDoctor: 'الطبيب',
    prescriptionMedicines: 'الأدوية',
    prescriptionDiagnosis: 'التشخيص',
    noPrescriptions: 'لا توجد وصفات',
    rateYourDoctor: 'قيّم طبيبك',
    selectRating: 'اختر تقييمك',
    writeReview: 'اكتب مراجعة (اختياري)',
    reviewPlaceholder: 'شارك تجربتك مع الطبيب...',
    submitRating: 'إرسال التقييم',
    ratingSubmitted: 'شكرًا لك! تم إرسال تقييمك.',
    waiting: 'في الانتظار',
    inProgress: 'قيد التنفيذ',
    completed: 'مكتمل',
    emergency: 'طوارئ',
    appointmentType: 'النوع',
    walkIn: 'حضور مباشر',
    appointment: 'موعد',
    refresh: 'تحديث',
    refreshing: 'جارٍ التحديث...',
    stars: ['ضعيف', 'مقبول', 'جيد', 'جيد جدًا', 'ممتاز'],
    lastUpdated: 'آخر تحديث',
    secondsAgo: 'ثوانٍ مضت',
    liveIndicator: 'مباشر',
  }
};

// Demo data
const getDemoSession = () => ({
  role: 'patient',
  id: 'pat1',
  name: 'Ravi Kumar',
  token_number: 'GEN-101',
  department: 'General Medicine',
  doctor_name: 'Dr. Aisha Patel',
  is_emergency: false,
  age: 34,
  gender: 'Male',
  queue_position: 3,
  status: 'WAITING',
  appointment_type: 'WALKIN',
});

const getDemoHistory = () => [
  { id: 'v1', date: '2024-01-10', doctor: 'Dr. Aisha Patel', department: 'General Medicine', diagnosis: 'Seasonal Flu', status: 'completed', patient_id: 'pat1' },
  { id: 'v2', date: '2023-12-15', doctor: 'Dr. Vikram Shah', department: 'Cardiology', diagnosis: 'Routine Checkup', status: 'completed', patient_id: 'pat1' },
  { id: 'v3', date: '2023-11-20', doctor: 'Dr. Sara Khan', department: 'ENT', diagnosis: 'Sinusitis', status: 'completed', patient_id: 'pat1' },
];

const getDemoPrescriptions = () => [
  { id: 'rx1', date: '2024-01-10', doctor: 'Dr. Aisha Patel', diagnosis: 'Seasonal Flu', medicines: ['Paracetamol 650mg - 3 times daily', 'Cetirizine 10mg - Once at night', 'Steam Inhalation - Twice daily'], patient_id: 'pat1' },
  { id: 'rx2', date: '2023-11-20', doctor: 'Dr. Sara Khan', diagnosis: 'Sinusitis', medicines: ['Amoxicillin 500mg - 3 times daily', 'Nasal Spray - Twice daily', 'Montelukast 10mg - Once at night'], patient_id: 'pat1' },
];

export default function PatientPortal({
  currentLang = 'en',
  t: parentT = {},
  darkMode = false
}) {
  const lang = i18n[currentLang] || i18n.en;

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Rating state
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const loadData = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('opd_sha_session');
      const sess = savedSession ? JSON.parse(savedSession) : getDemoSession();
      setPatient(sess);

      const savedHistory = localStorage.getItem('opd_sha_patient_history');
      const allHistory = savedHistory ? JSON.parse(savedHistory) : getDemoHistory();
      setVisits(allHistory.filter(v => v.patient_id === (sess.id || 'pat1')));

      const savedRx = localStorage.getItem('opd_sha_prescriptions');
      const allRx = savedRx ? JSON.parse(savedRx) : getDemoPrescriptions();
      setPrescriptions(allRx.filter(rx => rx.patient_id === (sess.id || 'pat1')));

      setLastUpdate(0);
    } catch (err) {
      console.error('PatientPortal: Failed to load data', err);
      setPatient(getDemoSession());
      setVisits(getDemoHistory());
      setPrescriptions(getDemoPrescriptions());
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // "Last updated" counter
  useEffect(() => {
    const ticker = setInterval(() => setLastUpdate(prev => prev + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Countdown timer (estimated wait)
  useEffect(() => {
    if (patient) {
      const estimatedMin = (patient.queue_position || 3) * 4;
      setCountdown(estimatedMin * 60);
    }
  }, [patient]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) return;
    try {
      const newRating = {
        id: `r_${Date.now()}`,
        patient_name: patient?.name || 'Patient',
        patient_id: patient?.id || 'pat1',
        doctor_id: 'doc1',
        doctor_name: patient?.doctor_name || 'Doctor',
        rating: selectedRating,
        review: reviewText,
        date: new Date().toISOString().split('T')[0]
      };
      const savedRatings = localStorage.getItem('opd_sha_doctor_ratings');
      const allRatings = savedRatings ? JSON.parse(savedRatings) : [];
      allRatings.push(newRating);
      localStorage.setItem('opd_sha_doctor_ratings', JSON.stringify(allRatings));
      setRatingSubmitted(true);
      setSelectedRating(0);
      setReviewText('');
    } catch (err) {
      console.error('Failed to submit rating', err);
    }
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const queuePosition = patient?.queue_position || 3;
  const totalInQueue = 8; // Demo total
  const progressPercent = Math.max(5, Math.min(95, ((totalInQueue - queuePosition) / totalInQueue) * 100));
  const estimatedMinutes = queuePosition * 4;

  const cardBase = darkMode
    ? 'bg-slate-800 border-slate-700 text-white'
    : 'bg-white border-slate-200 text-slate-900';
  const containerBg = darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900';

  const tabClasses = (tabId) => `flex-1 sm:flex-initial px-4 py-2.5 text-sm font-medium rounded-lg transition-all
    ${activeTab === tabId
      ? 'bg-indigo-600 text-white shadow-md'
      : (darkMode
          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')
    }`;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'in_progress' || s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Activity className="w-3 h-3" />
          {lang.inProgress}
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle className="w-3 h-3" />
          {lang.completed}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
        <Clock className="w-3 h-3" />
        {lang.waiting}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${containerBg} p-4 md:p-6 lg:p-8`}>
      {/* Profile Card */}
      <div className={`rounded-xl border ${cardBase} p-4 md:p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Avatar */}
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0
            ${patient?.is_emergency
              ? 'bg-red-100 text-red-600 ring-2 ring-red-300'
              : 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200'
            }`}
          >
            {patient?.name?.charAt(0) || 'P'}
          </div>

          {/* Info */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: lang.name, value: patient?.name || '—', icon: User },
              { label: lang.token, value: patient?.token_number || '—', icon: Hash, highlight: true },
              { label: lang.department, value: patient?.department || '—', icon: Clipboard },
              { label: lang.doctor, value: patient?.doctor_name || '—', icon: Stethoscope },
              { label: lang.queuePosition, value: `#${queuePosition}`, icon: Timer },
              { label: lang.status, value: null, icon: Activity, badge: getStatusBadge(patient?.status) },
            ].map((item, i) => (
              <div key={i}>
                <p className={`text-xs font-medium mb-0.5 flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </p>
                {item.badge || (
                  <p className={`text-sm font-semibold ${
                    item.highlight
                      ? (darkMode ? 'text-indigo-400 font-mono' : 'text-indigo-600 font-mono')
                      : ''
                  }`}>
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`self-start inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0
              ${darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              } ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {patient?.is_emergency && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">{lang.emergency}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('queue')} className={tabClasses('queue')}>
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            {lang.tabs.queueStatus}
          </span>
        </button>
        <button onClick={() => setActiveTab('history')} className={tabClasses('history')}>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {lang.tabs.visitHistory}
          </span>
        </button>
        <button onClick={() => setActiveTab('prescriptions')} className={tabClasses('prescriptions')}>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {lang.tabs.prescriptions}
          </span>
        </button>
        <button onClick={() => setActiveTab('rate')} className={tabClasses('rate')}>
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            {lang.tabs.rateDoctor}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Queue Status */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Live Position Card */}
            <div className={`rounded-xl border ${cardBase} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  {lang.queueLive}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {lang.liveIndicator}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                {/* Position */}
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-black border-4 ${
                    queuePosition <= 1
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                      : queuePosition <= 3
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/30'
                  }`}>
                    #{queuePosition}
                  </div>
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang.youAre} <strong>{lang.positionPrefix}{queuePosition}</strong> {lang.inQueue}
                  </p>
                </div>

                {/* Estimated Wait */}
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center border-4 ${
                    darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <span className="text-2xl font-black">{estimatedMinutes}</span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang.minutes}</span>
                  </div>
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang.estimatedWait}
                  </p>
                </div>

                {/* Countdown */}
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-2xl font-mono font-black border-4 ${
                    countdown < 120
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                      : (darkMode ? 'border-slate-600 bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700')
                  }`}>
                    {formatCountdown(countdown)}
                  </div>
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang.waitingForDoctor}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang.progressLabel}
                  </span>
                  <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang.lastUpdated}: {lastUpdate} {lang.secondsAgo}
                  </span>
                </div>
                <div className={`w-full h-4 rounded-full overflow-hidden ${
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang.positionPrefix}{queuePosition} / {totalInQueue}
                  </span>
                  <span className={`text-xs font-medium ${
                    queuePosition <= 1
                      ? 'text-emerald-500'
                      : queuePosition <= 3
                        ? 'text-indigo-500'
                        : (darkMode ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {queuePosition <= 1 ? lang.yourTurnNow : queuePosition <= 3 ? lang.yourTurnSoon : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visit History */}
        {activeTab === 'history' && (
          <div className={`rounded-xl border ${cardBase}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                {lang.tabs.visitHistory}
              </h3>
            </div>
            {visits.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang.noVisits}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {visits.map(visit => (
                  <div key={visit.id} className={`p-4 hover:${darkMode ? 'bg-slate-750' : 'bg-slate-50'} transition-colors`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{visit.diagnosis}</p>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {visit.doctor} • {visit.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{visit.date}</span>
                        {getStatusBadge(visit.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className={`rounded-xl border ${cardBase} p-12 text-center`}>
                <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang.noPrescriptions}</p>
              </div>
            ) : (
              prescriptions.map(rx => (
                <div key={rx.id} className={`rounded-xl border ${cardBase} p-4 md:p-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rx.diagnosis}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {rx.doctor} • {rx.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-medium mb-2 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {lang.prescriptionMedicines}
                    </p>
                    <ul className="space-y-1.5">
                      {rx.medicines.map((med, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rate Doctor */}
        {activeTab === 'rate' && (
          <div className={`rounded-xl border ${cardBase} p-4 md:p-6`}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-yellow-500" />
              {lang.rateYourDoctor}
            </h3>

            {ratingSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-lg mb-2">{lang.ratingSubmitted}</p>
                <button
                  onClick={() => setRatingSubmitted(false)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {lang.tabs.rateDoctor}
                </button>
              </div>
            ) : (
              <>
                {/* Doctor info */}
                <div className={`flex items-center gap-3 p-3 rounded-lg mb-6 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{patient?.doctor_name || 'Doctor'}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{patient?.department}</p>
                  </div>
                </div>

                {/* Star Selection */}
                <div className="mb-6">
                  <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {lang.selectRating}
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(s)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star className={`w-10 h-10 transition-colors ${
                          s <= (hoverRating || selectedRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : (darkMode ? 'text-slate-600' : 'text-slate-300')
                        }`} />
                      </button>
                    ))}
                    {(hoverRating || selectedRating) > 0 && (
                      <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {lang.stars[(hoverRating || selectedRating) - 1]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {lang.writeReview}
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder={lang.reviewPlaceholder}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none
                      ${darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitRating}
                  disabled={selectedRating === 0}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-md
                    ${selectedRating > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                    }`}
                >
                  <Send className="w-4 h-4" />
                  {lang.submitRating}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
