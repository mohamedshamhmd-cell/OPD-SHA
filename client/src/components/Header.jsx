import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  ShieldAlert, 
  FileText, 
  Clock, 
  UserCheck, 
  Accessibility,
  Languages,
  Sparkles,
  Stethoscope,
  MapPin,
  ArrowUpDown,
  LogIn,
  LogOut,
  User,
  BarChart3,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { subscribeSpeechState, stopSpeaking } from '../services/speech';

export default function Header({
  activeTab = 'register',
  onTabChange = () => {},
  currentLang = 'en',
  onLangChange = () => {},
  fontSizeLevel = 1, // 0 = standard, 1 = large, 2 = extra-large
  onFontSizeChange = () => {},
  highContrast = false,
  onToggleContrast = () => {},
  darkMode = false,
  onToggleDarkMode = () => {},
  currentUser = null,
  onLogout = () => {},
  onTriggerSOS = () => {},
  hasSlip = false,
  t = {}
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsub = subscribeSpeechState((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
      {/* TOP ACCESSIBILITY & EMERGENCY BAR */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Government Mission Badge */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">
              {t.hospitalSub || 'OPD SHA • Smart Government Hospital System • Ayushman Bharat ABDM'}
            </span>
          </div>

          {/* Accessibility Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Active Voice Indicator / Stop Audio */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 animate-pulse text-[11px]"
                title="Stop speaking"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t.accessibility?.ttsStop || 'Stop Voice'}</span>
              </button>
            )}

            {/* Language Selector (All 9 Languages Supported) */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <Languages className="w-3.5 h-3.5 text-indigo-400 ml-1.5 shrink-0" />
              <select
                value={currentLang}
                onChange={(e) => onLangChange(e.target.value)}
                className="bg-transparent text-white text-xs font-bold py-0.5 px-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                aria-label="Select Language"
              >
                <option value="en" className="bg-slate-900 text-white">English (English)</option>
                <option value="ar" className="bg-slate-900 text-white">العربية (Arabic)</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
                <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
                <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
                <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
                <option value="ml" className="bg-slate-900 text-white">മലയാളം (Malayalam)</option>
                <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
                <option value="mr" className="bg-slate-900 text-white">मराठी (Marathi)</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {/* Font Size Adjuster (A- / A / A+) */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold px-1">Size:</span>
              {[
                { level: 0, label: 'A-' },
                { level: 1, label: 'A' },
                { level: 2, label: 'A+' }
              ].map(f => (
                <button
                  key={f.level}
                  onClick={() => onFontSizeChange(f.level)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    fontSizeLevel === f.level
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={`Adjust text size`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={onToggleContrast}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Toggle high contrast accessibility theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.accessibility?.contrast || 'Contrast'}</span>
            </button>

            {/* Quick Emergency SOS button */}
            <button
              onClick={onTriggerSOS}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg flex items-center gap-1 text-[11px] shadow-sm animate-pulse"
              title="Instant Emergency Trauma Registration"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>{t.accessibility?.sos || '🚨 SOS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN NAV BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Hospital Branding */}
        <div 
          onClick={() => onTabChange('register')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center shadow-md font-bold text-2xl">
            🏥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t.hospitalName || 'OPD SHA Hospital'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                AIIMS MODEL
              </span>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide">
              Smart Queue Management & Accessible Navigation Companion
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'register', label: t.tabs?.register || 'OPD Registration', icon: FileText },
            { id: 'doctors', label: t.tabs?.doctors || 'Doctors Roster', icon: Stethoscope },
            { id: 'sorting', label: t.tabs?.sorting || 'Patient Sorting', icon: ArrowUpDown },
            { id: 'slip', label: t.tabs?.slip || 'My OPD Slip', icon: Sparkles, badge: hasSlip },
            { id: 'track', label: t.tabs?.track || 'Track Queue', icon: Clock },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'nearby', label: 'Nearby Map', icon: MapPin },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
                )}
              </button>
            );
          })}

          {/* User Auth Portal / Profile Button */}
          {currentUser ? (
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  if (currentUser.role === 'admin') onTabChange('admin');
                  else if (currentUser.role === 'doctor') onTabChange('doctor');
                  else if (currentUser.role === 'nurse') onTabChange('nurse');
                  else onTabChange('patient');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  ['admin', 'doctor', 'nurse', 'patient', 'prescription'].includes(activeTab)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
                }`}
                title={`Open ${currentUser.role} dashboard`}
              >
                <span>{currentUser.avatar || '👤'}</span>
                <span className="hidden sm:inline font-semibold">{currentUser.name?.split(' ')[0]}</span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Sign out of portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onTabChange('login')}
              className={`ml-1 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
