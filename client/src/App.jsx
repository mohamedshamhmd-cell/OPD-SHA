import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import DoctorsList from './components/DoctorsList';
import OPDSlip from './components/OPDSlip';
import QueueTracker from './components/QueueTracker';
import StaffDashboard from './components/StaffDashboard';
import PatientSorting from './components/PatientSorting';
import NearbyHospitalsMap from './components/NearbyHospitalsMap';
import LoginPage from './components/LoginPage';
import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import PatientPortal from './components/PatientPortal';
import PrescriptionGenerator from './components/PrescriptionGenerator';
import ReportsAnalytics from './components/ReportsAnalytics';
import AdminDashboard from './components/AdminDashboard';
import { translations } from './translations';
import { fetchDepartments, registerPatient, fetchSlip } from './services/api';
import { 
  speakText, 
  playHospitalChime, 
  handleLanguageChangeAnnouncement, 
  speakFullAnnouncement 
} from './services/speech';
import { getCurrentUser, logout } from './services/auth';
import { seedDemoData } from './services/db';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('hospital_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem('hospital_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const [fontSizeLevel, setFontSizeLevel] = useState(1); // default large for hospital readability
  const [highContrast, setHighContrast] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);

  const [slipData, setSlipData] = useState(() => {
    try {
      const saved = localStorage.getItem('hospital_last_slip');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [trackedToken, setTrackedToken] = useState(() => {
    try {
      return localStorage.getItem('hospital_last_token') || 'CARD-102';
    } catch {
      return 'CARD-102';
    }
  });

  const t = translations[currentLang] || translations.en;

  // Initial setup: ensure database demo records and departments exist
  useEffect(() => {
    try {
      seedDemoData();
    } catch (e) {
      console.warn('Seeding note:', e);
    }
    loadDepartments();
  }, []);

  // Sync dark mode class to root HTML element
  useEffect(() => {
    try {
      localStorage.setItem('hospital_dark_mode', darkMode ? 'true' : 'false');
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load departments
  const loadDepartments = async () => {
    try {
      const res = await fetchDepartments();
      if (res.success) {
        setDepartments(res.departments);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  // Sync language selection, persistence, RTL/LTR, and trigger full voice announcement
  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('hospital_lang', newLang);
    } catch {}

    if (newLang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', newLang);
    }

    // Immediately generate and speak the announcement in the exact newly selected language
    handleLanguageChangeAnnouncement(newLang);
  };

  useEffect(() => {
    if (currentLang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', currentLang);
    }
  }, [currentLang]);

  // Auth handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'doctor') {
      setActiveTab('doctor');
    } else if (user.role === 'nurse') {
      setActiveTab('nurse');
    } else {
      setActiveTab('patient');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setActiveTab('register');
  };

  // Handle successful patient registration
  const handleRegistered = async (formData) => {
    const res = await registerPatient(formData);
    if (res.success) {
      playHospitalChime();

      // Fetch full slip
      const slipRes = await fetchSlip(res.token);
      if (slipRes.success) {
        setSlipData(slipRes);
        setTrackedToken(res.token);
        try {
          localStorage.setItem('hospital_last_slip', JSON.stringify(slipRes));
          localStorage.setItem('hospital_last_token', res.token);
        } catch {}

        // Full multilingual spoken announcement
        const isEmer = res.patient.is_emergency;
        speakFullAnnouncement({
          type: isEmer ? 'emergency' : 'registered',
          patientName: res.patient.name,
          tokenNumber: res.token,
          department: res.patient.department,
          roomNumber: res.patient.room || 'Room 1'
        }, currentLang);

        setActiveTab('slip');
      }
      loadDepartments();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleNavigateToTrack = (token) => {
    setTrackedToken(token);
    setActiveTab('track');
  };

  const handleDoctorSelectedForBooking = (doctor) => {
    setSelectedDoctorForBooking(doctor);
    setActiveTab('register');
  };

  const handleTriggerSOS = () => {
    setActiveTab('register');
    speakFullAnnouncement({
      type: 'emergency',
      patientName: 'Emergency Trauma Patient',
      tokenNumber: 'SOS-999',
      department: 'Emergency & Trauma Bay',
      roomNumber: 'Bay 1'
    }, currentLang);
  };

  const handleOpenPrescription = (patient) => {
    setPrescriptionPatient(patient);
    setActiveTab('prescription');
  };

  return (
    <div className={`min-h-screen flex flex-col font-scale-${fontSizeLevel} ${highContrast ? 'high-contrast dark' : ''} ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Accessible Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLang={currentLang}
        onLangChange={handleLanguageChange}
        fontSizeLevel={fontSizeLevel}
        onFontSizeChange={setFontSizeLevel}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(!highContrast)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onTriggerSOS={handleTriggerSOS}
        hasSlip={Boolean(slipData)}
        t={t}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* LOGIN PORTAL TAB */}
        {activeTab === 'login' && (
          <LoginPage
            onLogin={handleLoginSuccess}
            currentLang={currentLang}
            darkMode={darkMode}
            t={t}
          />
        )}

        {/* TAB 1: OPD REGISTRATION & APPOINTMENTS */}
        {activeTab === 'register' && (
          <RegistrationForm
            departments={departments}
            initialDoctor={selectedDoctorForBooking}
            onRegistered={handleRegistered}
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 2: DOCTORS AVAILABLE & OPD ROSTER */}
        {activeTab === 'doctors' && (
          <DoctorsList
            departments={departments}
            onSelectDoctorForBooking={handleDoctorSelectedForBooking}
            onBookDirectly={handleRegistered}
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 3: OPD SLIP */}
        {activeTab === 'slip' && (
          <OPDSlip
            slipData={slipData}
            onNavigateToTrack={handleNavigateToTrack}
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 4: TRACK QUEUE & WAYFINDING MAP */}
        {activeTab === 'track' && (
          <QueueTracker
            initialToken={trackedToken}
            departments={departments}
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 5: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <ReportsAnalytics
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
          />
        )}

        {/* TAB 6: NEARBY HOSPITALS & DOCTOR AVAILABILITY */}
        {activeTab === 'nearby' && (
          <NearbyHospitalsMap
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 7: PATIENT SORTING */}
        {activeTab === 'sorting' && (
          <PatientSorting
            currentLang={currentLang}
            t={t}
            onDataChanged={loadDepartments}
          />
        )}

        {/* TAB 8: STAFF & TRIAGE DASHBOARD */}
        {activeTab === 'staff' && (
          <StaffDashboard
            currentLang={currentLang}
            t={t}
            onDataChanged={loadDepartments}
            onTabChange={setActiveTab}
          />
        )}

        {/* TAB 9: DOCTOR DASHBOARD */}
        {activeTab === 'doctor' && (
          <DoctorDashboard
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
            onWritePrescription={(patient) => handleOpenPrescription(patient)}
            onViewPatient={(patientId) => {
              setTrackedToken(patientId);
              setActiveTab('track');
            }}
          />
        )}

        {/* TAB 10: NURSE DASHBOARD */}
        {activeTab === 'nurse' && (
          <NurseDashboard
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
          />
        )}

        {/* TAB 11: PATIENT SELF-SERVICE PORTAL */}
        {activeTab === 'patient' && (
          <PatientPortal
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
          />
        )}

        {/* TAB 12: DIGITAL PRESCRIPTION GENERATOR */}
        {activeTab === 'prescription' && (
          <PrescriptionGenerator
            patient={prescriptionPatient}
            doctor={{
              id: currentUser?.username || 'DOC-101',
              name: currentUser?.name || 'Dr. Vikram Sharma',
              department: currentUser?.department || 'General Medicine',
              room: 'Room 101'
            }}
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
            onClose={() => setActiveTab(currentUser?.role === 'doctor' ? 'doctor' : 'register')}
            onSaved={() => {
              if (currentUser?.role === 'doctor') setActiveTab('doctor');
            }}
          />
        )}

        {/* TAB 13: ADMIN MASTER DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard
            currentLang={currentLang}
            t={t}
            darkMode={darkMode}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 sm:px-8 border-t border-slate-800 print:hidden mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <p className="text-white font-bold text-sm">
                OPD SHA Hospital
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Accessible OPD Registration, Multilingual AI Voice Announcements & Navigation Companion
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ayushman Bharat ABDM Connected</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Full 9-Language Voice System</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>24x7 Emergency Trauma Care</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
