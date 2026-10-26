import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  User, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Languages,
  CalendarCheck,
  Zap,
  X,
  Phone,
  AlertCircle
} from 'lucide-react';
import { fetchDoctors, fetchAppointmentSlots, registerPatient } from '../services/api';
import { playHospitalChime, speakText } from '../services/speech';

export default function DoctorsList({ 
  departments = [], 
  onSelectDoctorForBooking = () => {},
  onBookDirectly = null,
  currentLang = 'en',
  t = {}
}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Quick Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('09:30 AM - 10:00 AM');
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientContact, setPatientContact] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Standard doctor consultancy slots
  const DEFAULT_SLOTS = [
    { time: '09:00 AM - 09:30 AM', shift: 'Morning' },
    { time: '09:30 AM - 10:00 AM', shift: 'Morning' },
    { time: '10:00 AM - 10:30 AM', shift: 'Morning' },
    { time: '10:30 AM - 11:00 AM', shift: 'Morning' },
    { time: '11:30 AM - 12:00 PM', shift: 'Morning' },
    { time: '02:00 PM - 02:30 PM', shift: 'Afternoon' },
    { time: '02:30 PM - 03:00 PM', shift: 'Afternoon' },
    { time: '03:00 PM - 03:30 PM', shift: 'Afternoon' }
  ];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDoctors(selectedDept === 'ALL' ? null : selectedDept);
        if (res.success) {
          setDoctors(res.doctors);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedDept]);

  // Load slots when booking modal opens
  useEffect(() => {
    async function loadSlots() {
      if (!bookingDoctor) return;
      try {
        const res = await fetchAppointmentSlots(bookingDoctor.department_id);
        if (res.success && res.slots && res.slots.length > 0) {
          setDoctorSlots(res.slots.map(s => ({ time: s.time, shift: s.shift })));
          setSelectedSlot(res.slots[0].time);
        } else {
          setDoctorSlots(DEFAULT_SLOTS);
          setSelectedSlot(DEFAULT_SLOTS[0].time);
        }
      } catch {
        setDoctorSlots(DEFAULT_SLOTS);
        setSelectedSlot(DEFAULT_SLOTS[0].time);
      }
    }
    loadSlots();
  }, [bookingDoctor]);

  const openQuickBooking = (doc, preselectedSlot = null) => {
    setBookingDoctor(doc);
    setSelectedSlot(preselectedSlot || '09:30 AM - 10:00 AM');
    setBookingError(null);
  };

  const handleConfirmDirectBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);

    if (!patientName.trim()) {
      setBookingError('Please enter patient name.');
      return;
    }
    if (!patientAge || isNaN(patientAge) || parseInt(patientAge) <= 0) {
      setBookingError('Please enter a valid age.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        name: patientName.trim(),
        age: parseInt(patientAge, 10),
        gender: patientGender,
        contact: patientContact.trim(),
        govt_id: 'OPD-' + Math.floor(1000 + Math.random() * 9000),
        department_id: bookingDoctor.department_id,
        doctor_id: bookingDoctor.id,
        appointment_type: 'APPOINTMENT',
        slot_time: selectedSlot,
        is_emergency: false,
        preferred_language: currentLang
      };

      if (onBookDirectly) {
        const result = await onBookDirectly(payload);
        if (result?.success) {
          setBookingDoctor(null);
        } else {
          throw new Error(result?.error || 'Booking failed');
        }
      } else {
        const result = await registerPatient(payload);
        if (result?.success) {
          playHospitalChime();
          setBookingDoctor(null);
          // Preselect doctor and redirect
          onSelectDoctorForBooking(bookingDoctor);
        } else {
          throw new Error(result?.error || 'Booking failed');
        }
      }
    } catch (err) {
      setBookingError(err.message || 'Appointment booking failed');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      doc.name.toLowerCase().includes(q) ||
      doc.qualification.toLowerCase().includes(q) ||
      doc.designation.toLowerCase().includes(q) ||
      doc.department_name.toLowerCase().includes(q)
    );
    const matchesAvailability = availableOnly ? doc.availability_status === 'AVAILABLE' : true;
    return matchesSearch && matchesAvailability;
  });

  const totalDoctorsCount = doctors.length;
  const availableDoctorsCount = doctors.filter(d => d.availability_status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-indigo-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur tracking-wide">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
              <span>OPD SHAATHI • Doctor Availability & Appointments</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              {t.doctors?.title || 'Doctors Available & OPD Roster'}
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {t.doctors?.subtitle || 'View live availability, qualifications, consultation rooms, shift hours, and book instant appointment slots.'}
            </p>
          </div>

          {/* Availability live counter */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-white/15 backdrop-blur px-4 py-2.5 rounded-2xl border border-white/20">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left">
              <div className="text-xs font-bold text-white leading-tight">
                {availableDoctorsCount} of {totalDoctorsCount} Available Now
              </div>
              <div className="text-[10px] text-teal-200">Live Doctor Roster</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 flex-1">
            <button
              onClick={() => setSelectedDept('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedDept === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t.doctors?.allDepts || 'All Departments'}
            </button>
            {departments.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDept(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedDept === d.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{currentLang === 'hi' ? d.hindi_name : currentLang === 'ta' ? d.tamil_name : d.name}</span>
              </button>
            ))}
          </div>

          {/* Available Now Toggle & Search */}
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t.doctors?.availableNow || 'Available Now Only'}</span>
              </span>
            </label>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor or specialty..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading available doctors roster & consultancy slots...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No doctors found matching your criteria.</p>
          <button
            onClick={() => { setSelectedDept('ALL'); setAvailableOnly(false); setSearchQuery(''); }}
            className="mt-3 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map(doc => {
            const isAvailable = doc.availability_status === 'AVAILABLE';
            const isOnRound = doc.availability_status === 'ON_ROUND';

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Dept badge & Availability Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span 
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: doc.department_color || '#6366f1' }}
                    >
                      {doc.department_name}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isOnRound
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isAvailable ? 'bg-emerald-500 animate-pulse' : isOnRound ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      <span>{doc.availability_status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Doctor Profile Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl shrink-0 border border-indigo-100 dark:border-slate-700 shadow-xs">
                      👨‍⚕️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                        {doc.name}
                      </h4>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {doc.designation} • {doc.department_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.qualification}
                      </p>
                    </div>
                  </div>

                  {/* Details row: Room & Timings */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Room / Floor:</span>
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">{doc.room_number} ({doc.floor_name})</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>OPD Shift:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.opd_timing}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Experience & Rating:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{doc.experience_years} Yrs ({doc.rating} ★)</span>
                    </div>
                  </div>

                  {/* Consultancy Timing Slots Section */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>{t.doctors?.timingSlots || 'Consultancy Slots:'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Click slot to book
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {DEFAULT_SLOTS.slice(0, 4).map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openQuickBooking(doc, slot.time)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 hover:border-indigo-400 dark:hover:bg-indigo-950/40 text-[11px] font-mono text-slate-700 dark:text-slate-300 text-left transition-colors flex items-center justify-between"
                          title="Click to book this consultancy slot"
                        >
                          <span className="truncate">{slot.time.split('-')[0].trim()}</span>
                          <span className="text-[9px] font-sans font-bold text-indigo-600 dark:text-indigo-400">Book</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Booking Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => openQuickBooking(doc)}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>{t.doctors?.bookWithDoc || 'Book Appointment'}</span>
                  </button>
                  <button
                    onClick={() => onSelectDoctorForBooking(doc)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                    title="Fill full OPD slip form with this doctor"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK APPOINTMENT BOOKING MODAL */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  CONFIRM APPOINTMENT
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {bookingDoctor.name}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {bookingDoctor.designation} • {bookingDoctor.department_name} ({bookingDoctor.room_number})
                </p>
              </div>

              <button
                onClick={() => setBookingDoctor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleConfirmDirectBooking} className="space-y-4">
              {/* Select Consultancy Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  {t.doctors?.selectSlot || 'Select Consultancy Timing Slot:'}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                  {(doctorSlots.length > 0 ? doctorSlots : DEFAULT_SLOTS).map((slot, i) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="text-xs font-mono">{slot.time}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {slot.shift} Shift
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                  Patient Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                    Age (Years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {submittingBooking ? (
                    <span>Confirming Appointment Slot...</span>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>{t.doctors?.confirmBooking || 'Confirm Appointment & Generate Slip'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
