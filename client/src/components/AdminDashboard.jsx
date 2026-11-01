import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Activity, 
  Volume2, 
  Settings, 
  Plus, 
  Clock, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  UserCheck,
  Stethoscope,
  Megaphone,
  Radio,
  Fingerprint,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  Scan,
  Sparkles,
  Smartphone,
  Server,
  Loader2,
  CheckCircle2,
  XCircle,
  LogOut
} from 'lucide-react';
import { getDepartmentStats, seedDemoData } from '../services/db';
import { speakText } from '../services/speech';
import { 
  getBiometricSecurityStatus, 
  registerPasskey, 
  deleteAdminFace, 
  registerAdminFace, 
  startCamera, 
  stopCamera, 
  extractFaceEmbedding, 
  analyzeLiveness,
  checkPasskeyAvailability
} from '../services/biometrics';

export default function AdminDashboard({
  currentLang = 'en',
  t = {},
  darkMode = false,
  onNavigate = () => {}
}) {
  const [departments, setDepartments] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'security', 'announcement', 'doctors', 'system'

  // Security & Biometrics State
  const [securityData, setSecurityData] = useState({
    passkeyEnabled: true,
    passkeysCount: 0,
    passkeys: [],
    faceEnabled: true,
    faceRegistered: false,
    faceDetails: null,
    lastSuccessfulLogin: null,
    lastLoginMethod: 'PASSWORD',
    failedAttempts: 0,
    backendConnected: false
  });

  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
  
  // Face Registration Modal State
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalStep, setFaceModalStep] = useState('READY'); // 'READY', 'CAPTURING', 'ANALYZING', 'DONE'
  const [faceLiveness, setFaceLiveness] = useState(0);
  const [faceFeedback, setFaceFeedback] = useState('');
  const [faceProgress, setFaceProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const isRtl = currentLang === 'ar';

  useEffect(() => {
    try {
      const stats = getDepartmentStats();
      setDepartments(stats);
      loadSecurityStatus();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const data = await getBiometricSecurityStatus('admin');
      setSecurityData(data);
    } catch (e) {
      console.error('Error reading security status:', e);
    }
  };

  const handleBroadcast = () => {
    if (!announcementText.trim()) return;
    setBroadcasting(true);
    speakText(announcementText, currentLang);
    setTimeout(() => {
      setBroadcasting(false);
      setAnnouncementText('');
    }, 2000);
  };

  const handleQuickResetDemo = () => {
    if (window.confirm('Reset demo data to initial realistic hospital records?')) {
      seedDemoData();
      window.location.reload();
    }
  };

  // PASSKEY REGISTRATION (OPTION A)
  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setSecurityMessage({ type: '', text: '' });
    try {
      const deviceName = prompt('Enter a label for this device (e.g. Admin Windows Laptop, iPad Pro):', 'Admin Primary Device') || 'Admin Device';
      const res = await registerPasskey('admin', deviceName);
      if (res.success) {
        setSecurityMessage({ type: 'success', text: res.message });
        await loadSecurityStatus();
      } else {
        setSecurityMessage({ type: 'error', text: res.error });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: err.message || 'Passkey enrollment failed' });
    } finally {
      setPasskeyLoading(false);
    }
  };

  // FACE ENROLLMENT MODAL (OPTION B)
  const openFaceEnrollment = async () => {
    setShowFaceModal(true);
    setFaceModalStep('READY');
    setFaceLiveness(0);
    setFaceProgress(0);
    setFaceFeedback('Click Start to activate camera');
  };

  const startFaceEnrollmentScan = async () => {
    try {
      setFaceModalStep('CAPTURING');
      setFaceFeedback('Position face inside circle and blink naturally...');
      const stream = await startCamera(videoRef.current);
      streamRef.current = stream;

      const frameHistory = [];
      let captureCount = 0;

      const scanTimer = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        captureCount++;

        const embedding = extractFaceEmbedding(videoRef.current, canvasRef.current);
        if (embedding) {
          frameHistory.push(embedding);
          if (frameHistory.length > 5) frameHistory.shift();

          const liveness = analyzeLiveness(frameHistory);
          setFaceLiveness(Math.round(liveness.score * 100));
          setFaceFeedback(liveness.message);
          setFaceProgress(prev => Math.min(prev + 20, 90));

          if (liveness.isLive && frameHistory.length >= 4) {
            clearInterval(scanTimer);
            setFaceModalStep('ANALYZING');
            setFaceFeedback('Calibrating biometrics template...');
            setFaceProgress(95);

            // Register face embedding
            const res = await registerAdminFace(embedding, liveness.score, 'admin');
            if (res.success) {
              setFaceProgress(100);
              setFaceModalStep('DONE');
              setFaceFeedback('✓ Admin face enrolled successfully!');
              setTimeout(() => {
                closeFaceEnrollment();
                loadSecurityStatus();
              }, 1200);
            } else {
              setFaceFeedback(res.error || 'Registration failed');
              setFaceModalStep('READY');
            }
          }
        }

        if (captureCount > 40) {
          clearInterval(scanTimer);
          setFaceFeedback('Scan timed out. Please try again with good lighting.');
          setFaceModalStep('READY');
        }
      }, 350);

    } catch (err) {
      setFaceFeedback(err.message || 'Camera permission denied.');
      setFaceModalStep('READY');
    }
  };

  const closeFaceEnrollment = () => {
    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }
    setShowFaceModal(false);
  };

  const handleDeleteFace = async () => {
    if (window.confirm('Are you sure you want to delete your registered face template? You will need to use Passkey or Password to sign in.')) {
      const res = await deleteAdminFace('admin');
      setSecurityMessage({ type: 'success', text: res.message });
      await loadSecurityStatus();
    }
  };

  const handleSignOutAllSessions = () => {
    if (window.confirm('Revoke all active administrator sessions on all devices?')) {
      localStorage.removeItem('hospital_auth_user');
      window.location.reload();
    }
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Top Admin Welcome Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrative Operations Portal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Hospital Master Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Facility governance, passkey biometrics, webcam face security & ABDM compliance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              View Analytics
            </button>
            <button
              onClick={handleQuickResetDemo}
              className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/50 transition"
              title="Reset mock hospital database"
            >
              Reset Demo Data
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Facility Overview', icon: Building2 },
            { id: 'security', label: '🔐 Security & Biometrics', icon: Lock, badge: 'High Security' },
            { id: 'announcement', label: 'Live PA Broadcast', icon: Megaphone },
            { id: 'doctors', label: 'Doctor Roster', icon: Stethoscope },
            { id: 'system', label: 'System & ABDM Health', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. SECURITY & BIOMETRICS SETTINGS TAB (OPTIONS A & B)          */}
      {/* ============================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {securityMessage.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              securityMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-800'
            }`}>
              {securityMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{securityMessage.text}</span>
            </div>
          )}

          {/* Top Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Passkey Status (Primary)</span>
                <Fingerprint className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {securityData.passkeysCount > 0 ? `${securityData.passkeysCount} Enrolled` : 'Ready to Enroll'}
              </p>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                Windows Hello / Face ID / Touch ID
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Face Recognition</span>
                <Scan className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {securityData.faceRegistered ? 'Active & Enrolled' : 'Not Registered'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {securityData.faceRegistered ? '128D Anti-Spoof Template' : 'Enroll your face below'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Backend Security Mode</span>
                <Server className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white truncate">
                {securityData.backendConnected ? 'Express / SQLite API' : 'Standalone Resilient Mode'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {securityData.backendConnected ? 'Connected to local server' : 'GitHub Pages compatible'}
              </p>
            </div>
          </div>

          {/* OPTION A: Passkey Management Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Fingerprint className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Option A: Device Biometric Authentication (Passkeys)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                      Primary Security Method
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                  Sign in instantly using your device's built-in biometrics: Windows Hello (face recognition or fingerprint), Apple Face ID, or Touch ID. No raw biometrics are ever transmitted or stored on any server.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition shrink-0 disabled:opacity-50"
              >
                {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{passkeyLoading ? 'Authenticating Device...' : 'Register This Device / Passkey'}</span>
              </button>
            </div>

            {/* Registered Passkeys List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Registered Authenticators
              </span>
              {securityData.passkeys && securityData.passkeys.length > 0 ? (
                <div className="space-y-2">
                  {securityData.passkeys.map((p, idx) => (
                    <div 
                      key={p.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {p.deviceName || p.device_name || `Passkey #${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Registered: {new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold">
                        ✓ Verified
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500">
                    No passkeys enrolled yet on this browser. Click "Register This Device" above to enable 1-click biometric login.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* OPTION B: Custom Face Recognition Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <Scan className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Option B: Custom Webcam Face Recognition (My Face)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase">
                      Additional Biometric Option
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                  Enrolls your live face via the computer/mobile camera with multi-frame liveness detection (blink & micro-motion analysis). Differentiates living humans from static photographs or screen replays.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openFaceEnrollment}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>{securityData.faceRegistered ? 'Update My Face' : 'Register My Face'}</span>
                </button>

                {securityData.faceRegistered && (
                  <button
                    type="button"
                    onClick={handleDeleteFace}
                    className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    title="Delete registered face template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Face Status Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">
                  Enrollment Status: {securityData.faceRegistered ? '✓ Registered' : 'Not Enrolled'}
                </p>
                <p className="text-slate-400 mt-0.5">
                  Biometric Format: 128-Dimensional Normalized Facial Descriptor • Liveness Threshold: 75%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${securityData.faceRegistered ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {securityData.faceRegistered ? 'Camera login ready' : 'Enrollment required'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Audit Trail & Sessions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Security Audit Trail & Session Control
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recent administrator logins, method used, and global session management
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOutAllSessions}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-bold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out All Devices</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold">Last Successful Login</span>
                <p className="font-bold text-slate-800 dark:text-white">
                  {securityData.lastSuccessfulLogin ? new Date(securityData.lastSuccessfulLogin).toLocaleString() : 'Active session'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold">Failed Login Attempts Counter</span>
                <p className="font-bold text-emerald-500">
                  {securityData.failedAttempts} Failed Attempts (Zero Locks)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FACE REGISTRATION MODAL                                        */}
      {/* ============================================================== */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Enroll Administrator Face
                </h3>
              </div>
              <button
                type="button"
                onClick={closeFaceEnrollment}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Look directly into the camera. We analyze natural facial micro-movements to ensure liveness and prevent spoofing.
            </p>

            {/* Viewfinder HUD */}
            <div className="relative aspect-square w-full rounded-3xl bg-slate-950 overflow-hidden border-2 border-purple-500/50 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Guide Reticle */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-52 h-60 rounded-full border-2 border-dashed border-purple-400/80 relative flex items-center justify-center">
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan-laser shadow-[0_0_10px_#c084fc]" />
                </div>
              </div>
            </div>

            {/* Feedback & Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{faceFeedback}</span>
                <span className="font-mono text-purple-500">{faceProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${faceProgress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeFaceEnrollment}
                className="px-4 py-2 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              {faceModalStep === 'READY' && (
                <button
                  type="button"
                  onClick={startFaceEnrollmentScan}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Scan className="w-4 h-4" />
                  <span>Start Enrollment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clinics</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">8 Wings</p>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1">100% operational</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctors On Duty</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">12 Doctors</p>
              <p className="text-[11px] text-slate-400 mt-1">Across morning & day shifts</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients in Queue</span>
              <p className="text-3xl font-black text-amber-500 mt-1">47 Waiting</p>
              <p className="text-[11px] text-slate-400 mt-1">Estimated avg wait: 14 mins</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Trauma</span>
              <p className="text-3xl font-black text-red-500 mt-1">Ready</p>
              <p className="text-[11px] text-slate-400 mt-1">2 Bays Available</p>
            </div>
          </div>

          {/* Department Monitoring Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Real-Time Department Workload & Capacity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((d) => (
                <div 
                  key={d.department}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.department}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {d.doctor_count} Doctor(s) • Avg Wait {d.avg_wait_minutes}m
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-black">
                      {d.active_queue} Patients
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. LIVE PA BROADCAST TAB */}
      {activeTab === 'announcement' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hospital Public Address (PA) Voice Announcement
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast critical audio notifications directly through the hospital voice system in the selected language.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Announcement Message
            </label>
            <textarea
              rows={3}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Attention all visitors: General Medicine OPD consultation is now calling tokens 20 to 35. Please assemble outside Room 101."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleBroadcast}
              disabled={broadcasting || !announcementText.trim()}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{broadcasting ? 'Broadcasting Audio...' : 'Broadcast to All Speakers'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. DOCTORS ROSTER TAB */}
      {activeTab === 'doctors' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Medical Staff Roster & Timetable
              </h3>
              <p className="text-xs text-slate-400">Consultant availability and allocated OPD rooms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Dr. Vikram Sharma', dept: 'General Medicine', room: 'Room 101', shift: '08:00 - 14:00', status: 'Available' },
              { name: 'Dr. Priya Patel', dept: 'Pediatrics', room: 'Room 104', shift: '09:00 - 15:00', status: 'Consulting' },
              { name: 'Dr. Rajesh Kumar', dept: 'Cardiology', room: 'Room 201', shift: '10:00 - 16:00', status: 'Available' },
              { name: 'Dr. Sunita Rao', dept: 'Orthopedics', room: 'Room 205', shift: '08:30 - 13:30', status: 'In Procedure' },
              { name: 'Dr. Arun Verma', dept: 'ENT', room: 'Room 108', shift: '09:00 - 14:00', status: 'Available' },
              { name: 'Dr. Meera Iyer', dept: 'Gynecology', room: 'Room 110', shift: '08:00 - 14:00', status: 'Available' },
            ].map((doc) => (
              <div 
                key={doc.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.dept}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'Available'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-between text-xs text-slate-400 font-mono">
                  <span>{doc.room}</span>
                  <span>{doc.shift}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SYSTEM & ABDM HEALTH TAB */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              National ABDM / Ayushman Bharat Digital Gateway
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              FHIR R4 health information network connectivity status
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">ABHA Token Generation Engine</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Active • 99.98% uptime</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">OPD Voice TTS Broadcasting Engine</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Alison Krauss AI Voice Active</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
