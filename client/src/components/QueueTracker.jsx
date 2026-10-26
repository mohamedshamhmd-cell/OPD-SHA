import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Users, 
  MapPin, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  BellRing,
  Building2,
  Footprints
} from 'lucide-react';
import { fetchQueueStatus, fetchNavigation } from '../services/api';
import { speakText, playHospitalChime } from '../services/speech';
import HospitalMap from './HospitalMap';

export default function QueueTracker({ 
  initialToken = '', 
  departments = [], 
  currentLang = 'en',
  t = {}
}) {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [queueData, setQueueData] = useState(null);
  const [navigationData, setNavigationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [lastChimedToken, setLastChimedToken] = useState(null);

  // Sync with prop
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      setActiveToken(initialToken);
    }
  }, [initialToken]);

  // Load status and navigation
  const loadStatus = async (tokenToLoad, isBackground = false) => {
    if (!tokenToLoad) return;
    if (!isBackground) setLoading(true);
    setError(null);

    try {
      const qRes = await fetchQueueStatus(tokenToLoad);
      if (qRes.success) {
        setQueueData(qRes);

        // Chime if your turn is near and haven't chimed yet
        if (qRes.queue.isNearTurn && lastChimedToken !== `${tokenToLoad}-${qRes.status}`) {
          playHospitalChime();
          setLastChimedToken(`${tokenToLoad}-${qRes.status}`);
        }

        // Fetch navigation for this department
        if (qRes.department?.id) {
          const navRes = await fetchNavigation(qRes.department.id);
          if (navRes.success) {
            setNavigationData(navRes);
          }
        }
      }
    } catch (err) {
      if (!isBackground) {
        setError(err.message || 'Token not found. Please check your token number.');
        setQueueData(null);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeToken) {
      loadStatus(activeToken);
    }
  }, [activeToken]);

  // Polling interval
  useEffect(() => {
    if (!isPolling || !activeToken) return;

    const interval = setInterval(() => {
      loadStatus(activeToken, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPolling, activeToken, lastChimedToken]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setActiveToken(tokenInput.trim().toUpperCase());
  };

  const handleSelectDemoToken = (tok) => {
    setTokenInput(tok);
    setActiveToken(tok);
  };

  // Text-to-speech for queue status
  const handleReadQueueStatus = () => {
    if (!queueData) return;
    let msg = '';
    const alert = currentLang === 'hi' ? queueData.alert.hindi : currentLang === 'ta' ? queueData.alert.tamil : queueData.alert.message;
    const dept = queueData.department.name;
    const pos = queueData.queue.position;
    const wait = queueData.queue.estimatedWaitMins;

    if (queueData.isEmergency) {
      msg = alert;
    } else {
      switch (currentLang) {
        case 'ta':
          msg = `டோக்கன் ${queueData.tokenNumber}. துறை ${dept}. ${alert}. வரிசையில் இடம் #${pos}. காத்திருப்பு நேரம் ${wait} நிமிடங்கள்.`;
          break;
        case 'hi':
          msg = `टोकन ${queueData.tokenNumber}। विभाग ${dept}। ${alert}। कतार में स्थान संख्या ${pos}। अनुमानित प्रतीक्षा समय लगभग ${wait} मिनट।`;
          break;
        case 'te':
          msg = `టోకెన్ ${queueData.tokenNumber}. విభాగం ${dept}. ${alert}. క్యూ స్థానం #${pos}. నిరీక్షణ సమయం ${wait} నిమిషాలు.`;
          break;
        case 'kn':
          msg = `ಟೋಕನ್ ${queueData.tokenNumber}. ವಿಭಾಗ ${dept}. ${alert}. ಸರತಿ ಸಾಲಿನ ಸ್ಥಾನ #${pos}. ಕಾಯುವ ಸಮಯ ${wait} ನಿಮಿಷಗಳು.`;
          break;
        case 'ml':
          msg = `ടോക്കൺ ${queueData.tokenNumber}. വിഭാഗം ${dept}. ${alert}. ക്യൂ സ്ഥാനം #${pos}. കാത്തിരിപ്പ് സമയം ${wait} മിനിറ്റ്.`;
          break;
        case 'bn':
          msg = `টোকেন ${queueData.tokenNumber}। বিভাগ ${dept}। ${alert}। কিউ অবস্থান #${pos}। অপেক্ষার সময় প্রায় ${wait} মিনিট।`;
          break;
        case 'mr':
          msg = `टोकन ${queueData.tokenNumber}. विभाग ${dept}. ${alert}. रांग क्रमांक #${pos}. प्रतीक्षा वेळ सुमारे ${wait} मिनिटे.`;
          break;
        default:
          msg = `Token ${queueData.tokenNumber}. Department ${dept}. ${alert}. Your position is number ${pos}. Estimated wait time is approximately ${wait} minutes.`;
          break;
      }
    }

    speakText(msg, currentLang);
  };

  // Text-to-speech for directions
  const handleReadDirections = () => {
    if (!navigationData) return;
    const stepsText = navigationData.steps.map(s => {
      return currentLang === 'hi' ? s.instructionHindi : currentLang === 'ta' ? s.instructionTamil : s.instruction;
    }).join('. ');
    speakText(stepsText, currentLang);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Token Input Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-time OPD Queue Tracker</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {t.track?.title || 'Smart Queue Tracker & Wayfinding Navigation'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.track?.subtitle || 'Enter or scan your token to view real-time queue position, wait time, and floor route.'}
            </p>
          </div>

          {/* Polling status badge */}
          {activeToken && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isPolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isPolling ? 'Live Sync Active (4s)' : 'Sync Paused'}
              </span>
              <button 
                onClick={() => loadStatus(activeToken)}
                className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 ml-1"
                title="Refresh now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={t.track?.inputPlaceholder || 'Enter Token ID (e.g. CARD-102, ORTH-102, EMER-001)'}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 font-mono text-base font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">{t.track?.trackButton || 'Track Status'}</span>
          </button>
        </form>

        {/* Sample Token Quick-Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">
            {t.track?.quickTokens || 'Quick Demo Tokens:'}
          </span>
          {['EMER-001', 'CARD-101', 'CARD-102', 'ORTH-101', 'GEN-102', 'PEDI-102'].map(tok => (
            <button
              key={tok}
              type="button"
              onClick={() => handleSelectDemoToken(tok)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                activeToken === tok
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {tok}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ACTIVE QUEUE STATUS CARD */}
      {queueData && (
        <div className="space-y-6">
          {/* URGENT NOTIFICATION / TURN IS NEAR ALERT */}
          <div className={`p-6 rounded-3xl border-2 transition-all shadow-sm ${
            queueData.isEmergency
              ? 'bg-red-600 text-white border-red-700 animate-pulse'
              : queueData.status === 'CALLED'
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : queueData.queue.isNearTurn
                  ? 'bg-indigo-900 text-white border-indigo-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  queueData.isEmergency || queueData.status === 'CALLED'
                    ? 'bg-white/20 text-white'
                    : queueData.queue.isNearTurn
                      ? 'bg-indigo-700 text-white'
                      : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {queueData.isEmergency ? (
                    <ShieldAlert className="w-7 h-7 text-white" />
                  ) : (
                    <BellRing className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      queueData.isEmergency || queueData.status === 'CALLED'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {queueData.status === 'CALLED' ? 'DOCTOR READY NOW' : queueData.status}
                    </span>
                    <span className="text-xs opacity-80">
                      Token: <strong className="font-mono">{queueData.tokenNumber}</strong> ({queueData.patientName})
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold mt-1 leading-snug">
                    {currentLang === 'hi' 
                      ? queueData.alert.hindi 
                      : currentLang === 'ta' 
                        ? queueData.alert.tamil 
                        : queueData.alert.message}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReadQueueStatus}
                className={`self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  queueData.isEmergency || queueData.status === 'CALLED' || queueData.queue.isNearTurn
                    ? 'bg-white text-slate-900 hover:bg-slate-100 shadow'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.track?.listenStatus || '🔊 Read Status Out Loud'}</span>
              </button>
            </div>
          </div>

          {/* REAL-TIME METRICS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Currently Serving */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t.track?.currentServing || 'Serving in Room'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {queueData.queue.currentlyActiveToken || 'Calling Next'}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {queueData.department.roomNumber}
              </span>
            </div>

            {/* 2. Your Position */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t.track?.yourPosition || 'Your Queue Position'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {queueData.isEmergency ? (
                  <span className="text-red-500 text-xl font-bold">Priority #1</span>
                ) : queueData.status === 'CALLED' ? (
                  <span className="text-emerald-500 text-xl font-bold">Calling Now</span>
                ) : (
                  `#${queueData.queue.position}`
                )}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {queueData.isEmergency ? 'Emergency bypass' : `${queueData.queue.aheadCount} patients ahead`}
              </span>
            </div>

            {/* 3. Estimated Wait */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t.track?.estimatedWait || 'Estimated Wait'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {queueData.isEmergency ? (
                  <span className="text-red-500 text-xl font-bold">0 mins</span>
                ) : (
                  `~${queueData.queue.estimatedWaitMins}m`
                )}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Avg ~8m per consultation
              </span>
            </div>

            {/* 4. Overcrowding Indicator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                OPD Rush Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3.5 h-3.5 rounded-full ${
                  queueData.queue.overcrowding === 'OVERCROWDED'
                    ? 'bg-red-500 animate-ping'
                    : queueData.queue.overcrowding === 'MODERATE'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`} />
                <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                  {queueData.queue.overcrowding}
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {queueData.queue.totalWaitingInDept} waiting in dept
              </span>
            </div>
          </div>

          {/* STEP-BY-STEP WAYFINDING NAVIGATION */}
          {navigationData && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                    <Footprints className="w-4 h-4" />
                    <span>Slip-to-Destination Turn-by-Turn Guidance</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Route to {queueData.department.name} ({queueData.department.roomNumber})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Floor: {navigationData.floor.name} • {navigationData.ward.wing} • {navigationData.ward.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReadDirections}
                  className="self-start sm:self-auto px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-2 border border-indigo-200 dark:border-indigo-800"
                >
                  <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.track?.listenDirections || '🔊 Listen to Route Steps'}</span>
                </button>
              </div>

              {/* Steps timeline */}
              <div className="space-y-4">
                {navigationData.steps.map((st, idx) => (
                  <div key={st.stepNumber} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {st.stepNumber}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentLang === 'hi' ? st.titleHindi : currentLang === 'ta' ? st.titleTamil : st.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {currentLang === 'hi' ? st.instructionHindi : currentLang === 'ta' ? st.instructionTamil : st.instruction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTERACTIVE BLUEPRINT MAP */}
          <HospitalMap
            departments={departments}
            selectedDepartmentId={queueData.department.id}
            currentLang={currentLang}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
