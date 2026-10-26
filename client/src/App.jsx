import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import DoctorsList from './components/DoctorsList';
import OPDSlip from './components/OPDSlip';
import QueueTracker from './components/QueueTracker';
import StaffDashboard from './components/StaffDashboard';
import NearbyHospitalsMap from './components/NearbyHospitalsMap';
import { translations } from './translations';
import { fetchDepartments, registerPatient, fetchSlip } from './services/api';
import { speakText, playHospitalChime } from './services/speech';
import { 
  HeartPulse, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Accessibility, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [currentLang, setCurrentLang] = useState('en');
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // default large for hospital readability
  const [highContrast, setHighContrast] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
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

  useEffect(() => {
    loadDepartments();
  }, []);

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

        // Multilingual announcement for all 8 languages
        const isEmer = res.patient.is_emergency;
        let announcement = '';
        if (isEmer) {
          switch (currentLang) {
            case 'ta': announcement = `அவசர பதிவு வெற்றிகரமானது! டோக்கன் எண் ${res.token}. ட்ராமா பே 1-க்கு உடனே செல்லவும்.`; break;
            case 'hi': announcement = `आपातकालीन पंजीकरण सफल! टोकन संख्या ${res.token}। कृपया तुरंत ट्रॉमा बे 1 पर जाएँ।`; break;
            case 'te': announcement = `అత్యవసర రిజిస్ట్రేషన్ పూర్తయింది! టోకెన్ సంఖ్య ${res.token}. వెంటనే ట్రామా బే 1కి వెళ్లండి.`; break;
            case 'kn': announcement = `ತುರ್ತು ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ಟೋಕನ್ ಸಂಖ್ಯೆ ${res.token}. ತಕ್ಷಣ ಟ್ರಾಮಾ ಬೇ 1 ಕ್ಕೆ ಹೋಗಿ.`; break;
            case 'ml': announcement = `അടിയന്തര രജിസ്ട്രേഷൻ വിജയകരം! ടോക്കൺ നമ്പർ ${res.token}. ഉടൻ ട്രോമ ബേ 1 ലേക്ക് പോകുക.`; break;
            case 'bn': announcement = `জরুরি নিবন্ধন সফল হয়েছে! টোকেন নম্বর ${res.token}। অবিলম্বে ট্রমা বে ১-এ যান।`; break;
            case 'mr': announcement = `आपत्कालीन नोंदणी यशस्वी! टोकन क्रमांक ${res.token}. त्वरित ट्रॉमा बे १ मध्ये जावे.`; break;
            default: announcement = `Emergency Registration Confirmed! Token number ${res.token}. Please proceed directly to Trauma Bay 1.`; break;
          }
        } else if (res.patient.appointment_type === 'APPOINTMENT') {
          switch (currentLang) {
            case 'ta': announcement = `முன்பதிவு உறுதிசெய்யப்பட்டது! டோக்கன் எண் ${res.token}.`; break;
            case 'hi': announcement = `टोकन अपॉइंटमेंट पुष्ट हुआ! टोकन संख्या ${res.token}।`; break;
            case 'te': announcement = `అపాయింట్‌మెంట్ నిర్ధారించబడింది! మీ టోకెన్ సంఖ్య ${res.token}.`; break;
            case 'kn': announcement = `ನೇಮಕಾತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ ${res.token}.`; break;
            case 'ml': announcement = `അപ്പോയിന്റ്മെന്റ് സ്ഥിരീകരിച്ചു! നിങ്ങളുടെ ടോക്കൺ നമ്പർ ${res.token}.`; break;
            case 'bn': announcement = `অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে! আপনার টোকেন নম্বর ${res.token}।`; break;
            case 'mr': announcement = `अपॉइंटमेंट निश्चित झाली! आपला टोकन क्रमांक ${res.token} आहे.`; break;
            default: announcement = `Token Appointment Confirmed! Your token is ${res.token}.`; break;
          }
        } else {
          switch (currentLang) {
            case 'ta': announcement = `பதிவு முடிந்தது! உங்கள் டோக்கன் எண் ${res.token}.`; break;
            case 'hi': announcement = `पंजीकरण सफल हुआ! आपकी टोकन संख्या ${res.token} है।`; break;
            case 'te': announcement = `రిజిస్ట్రేషన్ విజయవంతమైంది! మీ టోకెన్ సంఖ్య ${res.token}.`; break;
            case 'kn': announcement = `ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ ${res.token}.`; break;
            case 'ml': announcement = `രജിസ്ട്രേഷൻ വിജയകരം! നിങ്ങളുടെ ടോക്കൺ നമ്പർ ${res.token}.`; break;
            case 'bn': announcement = `নিবন্ধন সফল হয়েছে! আপনার টোকেন নম্বর ${res.token}।`; break;
            case 'mr': announcement = `नोंदणी यशस्वी झाली! आपला टोकन क्रमांक ${res.token} आहे.`; break;
            default: announcement = `Registration successful! Your token number is ${res.token}.`; break;
          }
        }
        speakText(announcement, currentLang);

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
    let msg = '';
    switch (currentLang) {
      case 'ta': msg = 'அவசர சிகிச்சை சேவை இயக்கப்பட்டது. ட்ராமா பே 1-க்கு உடனே செல்லவும்.'; break;
      case 'hi': msg = 'आपातकालीन ट्राइएज सेवा सक्रिय की गई। कृपया सीधे भू-तल ट्रॉमा बे 1 पर संपर्क करें।'; break;
      case 'te': msg = 'అత్యవసర ట్రామా సేవ ప్రారంభించబడింది. వెంటనే గ్రౌండ్ ఫ్లోర్ ట్రామా బే 1కి వెళ్లండి.'; break;
      case 'kn': msg = 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ಸೇವೆ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ತಕ್ಷಣ ನೆಲಮಹಡಿ ಟ್ರಾಮಾ ಬೇ 1 ಕ್ಕೆ ಹೋಗಿ.'; break;
      case 'ml': msg = 'അടിയന്തര ട്രോമ സർവീസ് സജീവമാക്കി. ഉടൻ ഗ്രൗണ്ട് ഫ്ലോർ ട്രോമ ബേ 1 ലേക്ക് പോകുക.'; break;
      case 'bn': msg = 'জরুরি সেবা সক্রিয় করা হয়েছে। অনুগ্রহ করে নিচতলার ট্রমা বে ১-এ যোগাযোগ করুন।'; break;
      case 'mr': msg = 'आपत्कालीन सेवा सक्रिय केली गेली आहे. कृपया त्वरित तळमजल्यावरील ट्रॉमा बे १ मध्ये जावे.'; break;
      default: msg = 'Emergency trauma service activated. Proceed directly to Ground Floor Trauma Bay 1.'; break;
    }
    speakText(msg, currentLang);
  };

  return (
    <div className={`min-h-screen flex flex-col font-scale-${fontSizeLevel} ${highContrast ? 'high-contrast dark' : ''}`}>
      {/* Accessible Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        fontSizeLevel={fontSizeLevel}
        onFontSizeChange={setFontSizeLevel}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(!highContrast)}
        onTriggerSOS={handleTriggerSOS}
        hasSlip={Boolean(slipData)}
        t={t}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

        {/* TAB 5: NEARBY HOSPITALS & DOCTOR AVAILABILITY */}
        {activeTab === 'nearby' && (
          <NearbyHospitalsMap
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* TAB 6: STAFF & TRIAGE DASHBOARD */}
        {activeTab === 'staff' && (
          <StaffDashboard
            currentLang={currentLang}
            t={t}
            onDataChanged={loadDepartments}
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
                OPD SHAATHI Hospital (ओपीडी साथी)
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Accessible OPD Registration, Doctor Appointments & Smart Navigation Companion
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
              <span>Doctor Appointment System</span>
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
