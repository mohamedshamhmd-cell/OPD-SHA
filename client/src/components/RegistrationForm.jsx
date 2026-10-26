import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  CreditCard, 
  ShieldAlert, 
  HeartPulse, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Accessibility,
  Stethoscope,
  CalendarCheck,
  Zap
} from 'lucide-react';
import { speakText } from '../services/speech';
import { fetchAppointmentSlots } from '../services/api';

export default function RegistrationForm({ 
  departments = [], 
  initialDoctor = null,
  onRegistered = () => {},
  currentLang = 'en',
  t = {}
}) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [contact, setContact] = useState('');
  const [govtId, setGovtId] = useState('');
  const [departmentId, setDepartmentId] = useState(initialDoctor?.department_id || 'GENMED');
  const [doctorId, setDoctorId] = useState(initialDoctor?.id || '');
  const [bookingMode, setBookingMode] = useState('WALKIN'); // 'WALKIN', 'APPOINTMENT'
  const [slotTime, setSlotTime] = useState('09:30 AM - 10:00 AM');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [preferredLang, setPreferredLang] = useState(currentLang);

  // Keep preferredLang in sync whenever the user switches UI language
  useEffect(() => {
    setPreferredLang(currentLang);
  }, [currentLang]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync if initialDoctor changes
  useEffect(() => {
    if (initialDoctor) {
      setDepartmentId(initialDoctor.department_id);
      setDoctorId(initialDoctor.id);
      setBookingMode('APPOINTMENT');
    }
  }, [initialDoctor]);

  // Load appointment slots & doctors for active department
  useEffect(() => {
    async function loadSlots() {
      if (!departmentId || isEmergency) return;
      try {
        const res = await fetchAppointmentSlots(departmentId);
        if (res.success) {
          setAvailableSlots(res.slots || []);
          setDeptDoctors(res.doctors || []);
          if (res.slots && res.slots.length > 0 && !slotTime) {
            setSlotTime(res.slots[0].time);
          }
        }
      } catch (err) {
        console.warn('Slot load note:', err.message);
      }
    }
    loadSlots();
  }, [departmentId, isEmergency]);

  // Instructions TTS for all 8 languages
  const handleReadInstructions = () => {
    let msg = '';
    switch (preferredLang) {
      case 'ta':
        msg = 'OPD சாதி மருத்துவமனைக்கு வரவேற்கிறோம். உடனடி டோக்கன் அல்லது நேர ஸ்லாட் முன்பதிவு செய்யலாம். அவசர சிகிச்சைக்கு சிவப்பு சுவிட்சை இயக்கவும்.';
        break;
      case 'hi':
        msg = 'ओपीडी साथी अस्पताल में आपका स्वागत है। तत्काल वॉक-इन टोकन लें या अपनी सुविधानुसार समय स्लॉट बुक करें। आपातकाल के लिए लाल स्विच चालू करें।';
        break;
      case 'te':
        msg = 'ఓపీడీ సాథీ ఆసుపత్రికి స్వాగతం. తక్షణ వాక్-ఇన్ టోకెన్ లేదా డాక్టర్ అపాయింట్‌మెంట్ సమయ స్లాట్ ఎంచుకోండి. అత్యవసర పరిస్థితికి ఎరుపు స్విచ్ ఆన్ చేయండి.';
        break;
      case 'kn':
        msg = 'ಒಪಿಡಿ ಸಾಥಿ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ತಕ್ಷಣದ ವಾಕ್-ಇನ್ ಟೋಕನ್ ಅಥವಾ ವೈದ್ಯರ ನೇಮಕಾತಿ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ. ತುರ್ತು ಚಿಕಿತ್ಸೆಗೆ ಕೆಂಪು ಸ್ವಿಚ್ ಆನ್ ಮಾಡಿ.';
        break;
      case 'ml':
        msg = 'ഒപിഡി സാഥി ആശുപത്രിയിലേക്ക് സ്വാഗതം. തൽക്ഷണ ടോക്കൺ എടുക്കുക അല്ലെങ്കിൽ ഡോക്ടർ അപ്പോയിന്റ്മെന്റ് സമയം തിരഞ്ഞെടുക്കുക. അടിയന്തര സാഹചര്യത്തിന് ചുവന്ന സ്വിച്ച് ഓൺ ചെയ്യുക.';
        break;
      case 'bn':
        msg = 'ওপিডি সাথি হাসপাতালে আপনাকে স্বাগতম। তাৎক্ষণিক ওয়াক-ইন টোকেন নিন অথবা ডাক্তারের অ্যাপয়েন্টমেন্ট স্লট বুক করুন। জরুরি চিকিৎসার জন্য লাল সুইচটি চালু করুন।';
        break;
      case 'mr':
        msg = 'ओपीडी साथी रुग्णालयात आपले स्वागत आहे. त्वरित वॉक-इन टोकन घ्या किंवा डॉक्टरांचा वेळ स्लॉट बुक करा. आणीबाणीसाठी लाल स्विच चालू करा.';
        break;
      default:
        msg = 'Welcome to OPD SHAATHI Hospital. Choose instant walk-in token or schedule a doctor appointment slot. Turn ON emergency switch for immediate trauma resuscitation.';
        break;
    }
    speakText(msg, preferredLang);
  };

  const handleQuickAge = (val) => {
    setAge(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(preferredLang === 'hi' ? 'कृपया रोगी का नाम दर्ज करें' : preferredLang === 'ta' ? 'நோயாளி பெயரை உள்ளிடவும்' : 'Please enter patient name.');
      return;
    }
    if (!age || isNaN(age) || parseInt(age) <= 0 || parseInt(age) > 120) {
      setError(preferredLang === 'hi' ? 'कृपया वैध आयु दर्ज करें (1 - 120 वर्ष)' : preferredLang === 'ta' ? 'சரியான வயதை உள்ளிடவும்' : 'Please enter a valid age (1-120).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        age: parseInt(age, 10),
        gender: gender || 'Not Specified',
        contact: contact.trim(),
        govt_id: govtId.trim(),
        department_id: isEmergency ? 'EMER' : departmentId,
        doctor_id: isEmergency ? null : (doctorId || null),
        appointment_type: isEmergency ? 'WALKIN' : bookingMode,
        slot_time: (bookingMode === 'APPOINTMENT' && !isEmergency) ? slotTime : null,
        is_emergency: isEmergency,
        preferred_language: preferredLang
      };

      const result = await onRegistered(payload);
      if (!result?.success) {
        throw new Error(result?.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Error creating registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title & Speech Guidance Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>OPD SHAATHI • Accessible Smart Healthcare</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              {t.form?.title || 'OPD SHAATHI • Accessible Registration & Appointments'}
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t.form?.subtitle || 'Fast, minimal-step walk-in token or scheduled doctor appointment.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReadInstructions}
            className="self-start sm:self-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-white/20 transition-all shadow-sm active:scale-95"
            aria-label="Listen to registration instructions"
          >
            <Volume2 className="w-4 h-4 text-cyan-300" />
            <span>{t.form?.listenInstructions || '🔊 Listen to Instructions'}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* EMERGENCY PRIORITY SWITCH */}
        <div className={`p-5 rounded-2xl transition-all border-2 ${
          isEmergency 
            ? 'bg-red-500/10 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-500/20' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="emergency-toggle" className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer">
                  <span>{t.form?.emergencyToggleTitle || '🚨 Medical Emergency / Critical Condition?'}</span>
                  {isEmergency && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white tracking-widest">
                      CRITICAL PRIORITY
                    </span>
                  )}
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {t.form?.emergencyToggleDesc || 'Turn ON for severe chest pain, breathlessness, heavy bleeding, accident, or trauma. Bypasses regular OPD queues.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                id="emergency-toggle"
                type="checkbox" 
                checked={isEmergency} 
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600" />
            </label>
          </div>

          {isEmergency && (
            <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/60 text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{t.form?.emergencyActiveAlert || 'EMERGENCY PROTOCOL ACTIVATED: Instant Trauma Bay routing with zero queue wait time.'}</span>
            </div>
          )}
        </div>

        {/* REGISTRATION MODE SELECTOR (WALK-IN VS APPOINTMENT SLOT) */}
        {!isEmergency && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {t.form?.tokenModeLabel || 'Select Registration Type:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBookingMode('WALKIN')}
                className={`p-4 rounded-xl text-left border-2 transition-all flex items-start gap-3 ${
                  bookingMode === 'WALKIN'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.form?.modeWalkin || '⚡ Instant Walk-In Token (Today)'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immediate queue token for walk-in consultation right now.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingMode('APPOINTMENT')}
                className={`p-4 rounded-xl text-left border-2 transition-all flex items-start gap-3 ${
                  bookingMode === 'APPOINTMENT'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.form?.modeAppointment || '📅 Book Token Appointment (Slot)'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select guaranteed time slot & preferred doctor.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: PATIENT IDENTITY */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs flex items-center justify-center font-black">1</span>
            <span>{t.slip?.patientDetails || 'Patient Information'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.form?.fullName || 'Patient Full Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.form?.fullNamePlaceholder || 'e.g. Ramesh Kumar'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-base transition-all"
                />
              </div>
            </div>

            {/* Age & Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.form?.age || 'Age (Years)'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t.form?.agePlaceholder || 'e.g. 45'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-base transition-all"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickAge('5')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {t.form?.quickAge?.child || 'Child (5)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAge('35')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {t.form?.quickAge?.adult || 'Adult (35)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAge('65')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold transition-colors"
                >
                  {t.form?.quickAge?.senior || 'Senior (65+)'}
                </button>
              </div>
              {parseInt(age) >= 60 && (
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  ✓ {t.form?.seniorNotice || 'Senior Citizen Priority Assigned'}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.form?.gender || 'Gender'} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-base transition-all"
              >
                <option value="">{t.form?.genderOptions?.select || 'Select gender'}</option>
                <option value="Male">{t.form?.genderOptions?.male || 'Male'}</option>
                <option value="Female">{t.form?.genderOptions?.female || 'Female'}</option>
                <option value="Other">{t.form?.genderOptions?.other || 'Other'}</option>
                <option value="Prefer not to say">{t.form?.genderOptions?.preferNot || 'Prefer not to say'}</option>
              </select>
            </div>

            {/* Mobile Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.form?.contact || 'Mobile Number'} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t.form?.contactPlaceholder || 'e.g. 9876543210'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-base transition-all"
                />
              </div>
            </div>

            {/* Health ID / ABHA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.form?.govtId || 'ABHA / Aadhaar / MRN'} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={govtId}
                  onChange={(e) => setGovtId(e.target.value)}
                  placeholder={t.form?.govtIdPlaceholder || 'e.g. ABHA-1234-5678'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-base transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: DEPARTMENT SELECTOR */}
        {!isEmergency ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs flex items-center justify-center font-black">2</span>
                <span>{t.form?.department || 'Select Clinical Department / OPD Service'}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {departments.filter(d => d.id !== 'EMER').length} OPD Clinics
              </span>
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {departments
                .filter(d => d.id !== 'EMER')
                .map(d => {
                  const isSelected = departmentId === d.id;
                  const waitMins = d.queue?.totalEstimatedWaitMins || (d.avg_service_time_mins * 2);
                  const waitingCount = d.queue?.waiting ?? 1;

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDepartmentId(d.id);
                        setDoctorId(''); // reset doctor to any
                      }}
                      className={`p-4 rounded-xl text-left transition-all border-2 flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: d.color || '#6366f1' }}
                          />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {currentLang === 'hi' ? d.hindi_name : currentLang === 'ta' ? d.tamil_name : d.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {d.room_number}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{d.floor_name}</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{waitMins}m wait ({waitingCount} in line)</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* DOCTOR SELECTION IN DEPARTMENT */}
            {deptDoctors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t.form?.selectDoctorLabel || 'Choose Preferred Consulting Doctor (Optional)'}
                </label>
                <div className="relative">
                  <Stethoscope className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
                  >
                    <option value="">{t.form?.anyDoctor || 'Any Available Specialist Doctor (Fastest Turn)'}</option>
                    {deptDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} • {doc.qualification} ({doc.room_number}) [{doc.availability_status}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* APPOINTMENT SLOT PICKER IF IN APPOINTMENT MODE */}
            {bookingMode === 'APPOINTMENT' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.form?.slotLabel || 'Select Appointment Time Slot'}
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Guaranteed Token Window
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map(s => {
                    const isSelected = slotTime === s.time;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlotTime(s.time)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-mono">{s.time}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {s.shift} Shift ({s.available} slots free)
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-red-600 text-white shadow-md flex items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider">
                DIRECT RED CORRIDOR ASSIGNMENT
              </span>
              <h4 className="text-xl font-black mt-2">Emergency & Trauma Care Bay 1</h4>
              <p className="text-red-100 text-xs mt-1">
                Dr. Vikram Singhania (Head of Trauma) • Ground Floor East Wing
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white animate-bounce" />
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] ${
            isEmergency
              ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-500/30 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-500/20'
          }`}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.form?.submitting || 'Processing Registration...'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>
                {isEmergency 
                  ? '🚨 Emergency Triage Registration' 
                  : bookingMode === 'APPOINTMENT'
                    ? (t.form?.submitAppointment || 'Confirm Token Appointment & Slip')
                    : (t.form?.submit || 'Generate OPD Slip & Token')}
              </span>
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
