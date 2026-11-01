import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ShieldCheck, 
  Stethoscope, 
  HeartPulse, 
  UserCircle,
  KeyRound,
  Fingerprint,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scan,
  Shield,
  Smartphone
} from 'lucide-react';
import { login } from '../services/auth';
import { 
  checkPasskeyAvailability, 
  loginWithPasskey, 
  startCamera, 
  stopCamera, 
  extractFaceEmbedding, 
  analyzeLiveness, 
  verifyAdminFace 
} from '../services/biometrics';

const loginTranslations = {
  en: {
    title: 'OPD SHA Hospital',
    subtitle: 'Smart Government Hospital Management System',
    signIn: 'Sign In',
    signInSub: 'Access your hospital portal securely',
    roles: { admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse', patient: 'Patient' },
    methods: {
      password: 'Password',
      passkey: 'Device Passkey',
      face: 'Face Recognition'
    },
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Enter your username',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    loginBtn: 'Sign In',
    loggingIn: 'Signing in...',
    demoCredentials: 'Demo Credentials',
    demoHint: 'Use these credentials to explore the system:',
    forgotPassword: 'Forgot password?',
    secureLogin: 'Secured with 256-bit encryption & ABDM compliance',
    patientUserLabel: 'Token Number',
    patientPassLabel: 'Mobile Number',
    patientUserPlaceholder: 'Enter your token number (e.g. CARD-101)',
    patientPassPlaceholder: 'Enter registered mobile',
    passkeyTitle: 'Device Biometric Authentication',
    passkeyDesc: 'Authenticate using Windows Hello (Face/Fingerprint/PIN), Touch ID, or Face ID.',
    passkeyBtn: 'Sign In with Device Biometrics',
    faceTitle: 'Custom Webcam Face Recognition',
    faceDesc: 'Live anti-spoof biometric scanning calibrated to your registered administrator template.',
    startScan: 'Activate Camera & Scan Face',
    cancelScan: 'Cancel Scan',
    faceScanning: 'Scanning live facial landmarks...',
    facePrompt: 'Position your face inside the circle & blink naturally',
    faceVerified: 'Face Recognized! Authenticating...',
    faceFailed: 'Face mismatch or liveness check failed.',
    cameraDenied: 'Camera permission denied. Please allow camera access in browser settings.'
  },
  ar: {
    title: 'مستشفى OPD SHA',
    subtitle: 'نظام إدارة المستشفى الحكومي الذكي',
    signIn: 'تسجيل الدخول',
    signInSub: 'الوصول إلى بوابة المستشفى بأمان',
    roles: { admin: 'مدير', doctor: 'طبيب', nurse: 'ممرض/ة', patient: 'مريض' },
    methods: {
      password: 'كلمة المرور',
      passkey: 'مفتاح المرور للجهاز',
      face: 'التعرف على الوجه'
    },
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    usernamePlaceholder: 'أدخل اسم المستخدم',
    passwordPlaceholder: 'أدخل كلمة المرور',
    rememberMe: 'تذكرني',
    loginBtn: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول...',
    demoCredentials: 'بيانات تجريبية',
    demoHint: 'استخدم هذه البيانات لاستكشاف النظام:',
    forgotPassword: 'نسيت كلمة المرور؟',
    secureLogin: 'مؤمن بتشفير 256 بت',
    patientUserLabel: 'رقم الرمز',
    patientPassLabel: 'رقم الجوال',
    patientUserPlaceholder: 'أدخل رقم الرمز الخاص بك',
    patientPassPlaceholder: 'أدخل رقم الجوال المسجل',
    passkeyTitle: 'المصادقة البيومترية للجهاز',
    passkeyDesc: 'المصادقة باستخدام Windows Hello أو Face ID أو بصمة الإصبع.',
    passkeyBtn: 'تسجيل الدخول بالبصمة البيومترية',
    faceTitle: 'التعرف على الوجه بالكاميرا',
    faceDesc: 'مسح بيومتري حي ومقاوم للتزييف مطابق لنموذج المسؤول.',
    startScan: 'تفعيل الكاميرا والمسح',
    cancelScan: 'إلغاء المسح',
    faceScanning: 'جارٍ مسح ملامح الوجه...',
    facePrompt: 'ضع وجهك داخل الدائرة واطرف بعينيك بشكل طبيعي',
    faceVerified: 'تم التحقق من الوجه بنجاح!',
    faceFailed: 'فشل التعرف على الوجه أو فحص الحيوية.',
    cameraDenied: 'تم رفض إذن الكاميرا. يرجى تفعيل إذن الكاميرا.'
  },
  hi: {
    title: 'OPD SHA अस्पताल',
    subtitle: 'स्मार्ट सरकारी अस्पताल प्रबंधन प्रणाली',
    signIn: 'साइन इन',
    signInSub: 'अपने अस्पताल पोर्टल को सुरक्षित रूप से एक्सेस करें',
    roles: { admin: 'प्रशासक', doctor: 'डॉक्टर', nurse: 'नर्स', patient: 'मरीज़' },
    methods: {
      password: 'पासवर्ड',
      passkey: 'डिवाइस पासकी',
      face: 'चेहरा पहचान'
    },
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    usernamePlaceholder: 'उपयोगकर्ता नाम दर्ज करें',
    passwordPlaceholder: 'पासवर्ड दर्ज करें',
    rememberMe: 'मुझे याद रखें',
    loginBtn: 'साइन इन',
    loggingIn: 'साइन इन हो रहा है...',
    demoCredentials: 'डेमो क्रेडेंशियल',
    demoHint: 'सिस्टम एक्सप्लोर करने के लिए इन्हें उपयोग करें:',
    forgotPassword: 'पासवर्ड भूल गए?',
    secureLogin: '256-बिट एन्क्रिप्शन से सुरक्षित',
    patientUserLabel: 'टोकन नंबर',
    patientPassLabel: 'मोबाइल नंबर',
    patientUserPlaceholder: 'अपना टोकन नंबर दर्ज करें',
    patientPassPlaceholder: 'पंजीकृत मोबाइल दर्ज करें',
    passkeyTitle: 'डिवाइस बायोमेट्रिक पासकी',
    passkeyDesc: 'Windows Hello (चेहरा/फ़िंगरप्रिंट) या Face ID से सुरक्षित रूप से साइन इन करें।',
    passkeyBtn: 'डिवाइस बायोमेट्रिक्स से साइन इन करें',
    faceTitle: 'कस्टम वेबकैम चेहरा पहचान',
    faceDesc: 'लाइव एंटी-स्पूफ फेशियल स्कैन आपके पंजीकृत टेम्पलेट से मिलान करता है।',
    startScan: 'कैमरा चालू करें और स्कैन करें',
    cancelScan: 'रद्द करें',
    faceScanning: 'चेहरे के लक्षणों का स्कैन जारी...',
    facePrompt: 'चेहरे को सर्कल के अंदर रखें और स्वाभाविक रूप से पलकें झपकाएं',
    faceVerified: 'चेहरा सत्यापित हुआ! लॉगिन हो रहा है...',
    faceFailed: 'चेहरा मिलान या लाइव परीक्षण विफल रहा।',
    cameraDenied: 'कैमरा अनुमति अस्वीकृत है।'
  },
  ta: {
    title: 'OPD SHA மருத்துவமனை',
    subtitle: 'ஸ்மார்ட் அரசு மருத்துவமனை மேலாண்மை அமைப்பு',
    signIn: 'உள்நுழைக',
    signInSub: 'உங்கள் மருத்துவமனை போர்ட்டலை அணுகவும்',
    roles: { admin: 'நிர்வாகி', doctor: 'மருத்துவர்', nurse: 'செவிலியர்', patient: 'நோயாளி' },
    methods: {
      password: 'கடவுச்சொல்',
      passkey: 'சாதன பாஸ்கீ',
      face: 'முக அங்கீகாரம்'
    },
    username: 'பயனர் பெயர்',
    password: 'கடவுச்சொல்',
    usernamePlaceholder: 'பயனர் பெயரை உள்ளிடவும்',
    passwordPlaceholder: 'கடவுச்சொல்லை உள்ளிடவும்',
    rememberMe: 'என்னை நினைவில் கொள்',
    loginBtn: 'உள்நுழைக',
    loggingIn: 'உள்நுழைகிறது...',
    demoCredentials: 'டெமோ சான்றுகள்',
    demoHint: 'அமைப்பை ஆராய இவற்றைப் பயன்படுத்தவும்:',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    secureLogin: '256-பிட் குறியாக்கத்துடன் பாதுகாக்கப்படுகிறது',
    patientUserLabel: 'டோக்கன் எண்',
    patientPassLabel: 'கைபேசி எண்',
    patientUserPlaceholder: 'உங்கள் டோக்கன் எண்ணை உள்ளிடவும்',
    patientPassPlaceholder: 'பதிவு செய்த கைபேசி எண்ணை உள்ளிடவும்',
    passkeyTitle: 'சாதன பயோமெட்ரிக் அங்கீகாரம்',
    passkeyDesc: 'Windows Hello அல்லது Face ID மூலம் பாதுகாப்பாக உள்நுழையவும்.',
    passkeyBtn: 'சாதன பயோமெட்ரிக்ஸ் மூலம் உள்நுழைக',
    faceTitle: 'வலைக்கமரா முக அங்கீகாரம்',
    faceDesc: 'நேரடி முக ஸ்கேன் மூலம் நிர்வாகி அங்கீகாரம்.',
    startScan: 'கேமராவை இயக்கி ஸ்கேன் செய்க',
    cancelScan: 'ரத்து செய்',
    faceScanning: 'முகம் ஸ்கேன் செய்யப்படுகிறது...',
    facePrompt: 'வட்டத்திற்குள் முகத்தை வைத்து இயல்பாக கண் சிமிட்டவும்',
    faceVerified: 'முகம் சரிபார்க்கப்பட்டது! உள்நுழைகிறது...',
    faceFailed: 'முக பொருத்தம் அல்லது உயிருள்ள சரிபார்ப்பு தோல்வியடைந்தது.',
    cameraDenied: 'கேமரா அனுமதி மறுக்கப்பட்டது.'
  },
  te: {
    title: 'OPD SHA ఆసుపత్రి',
    subtitle: 'స్మార్ట్ ప్రభుత్వ ఆసుపత్రి నిర్వహణ వ్యవస్థ',
    signIn: 'సైన్ ఇన్',
    signInSub: 'మీ ఆసుపత్రి పోర్టల్‌ను సురక్షితంగా యాక్సెస్ చేయండి',
    roles: { admin: 'నిర్వాహకుడు', doctor: 'వైద్యుడు', nurse: 'నర్సు', patient: 'రోగి' },
    methods: {
      password: 'పాస్‌వర్డ్',
      passkey: 'డివైస్ పాస్కీ',
      face: 'ఫేస్ రికగ్నిషన్'
    },
    username: 'వినియోగదారు పేరు',
    password: 'పాస్‌వర్డ్',
    usernamePlaceholder: 'వినియోగదారు పేరు నమోదు చేయండి',
    passwordPlaceholder: 'పాస్‌వర్డ్ నమోదు చేయండి',
    rememberMe: 'నన్ను గుర్తుంచుకో',
    loginBtn: 'సైన్ ఇన్',
    loggingIn: 'సైన్ ఇన్ అవుతోంది...',
    demoCredentials: 'డెమో ఆధారాలు',
    demoHint: 'వ్యవస్థను అన్వేషించడానికి వీటిని ఉపయోగించండి:',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    secureLogin: '256-బిట్ ఎన్‌క్రిప్షన్‌తో భద్రం',
    patientUserLabel: 'టోకెన్ నంబర్',
    patientPassLabel: 'మొబైల్ నంబర్',
    patientUserPlaceholder: 'మీ టోకెన్ నంబర్ నమోదు చేయండి',
    patientPassPlaceholder: 'నమోదిత మొబైల్ నమోదు చేయండి',
    passkeyTitle: 'డివైస్ బయోమెట్రిక్ ప్రమాణీకరణ',
    passkeyDesc: 'Windows Hello లేదా Face ID తో సైన్ ఇన్ చేయండి.',
    passkeyBtn: 'బయోమెట్రిక్స్‌తో సైన్ ఇన్ చేయండి',
    faceTitle: 'వెబ్‌క్యామ్ ఫేస్ రికగ్నిషన్',
    faceDesc: 'నమోదిత ఫేస్ టెంప్లేట్‌తో లైవ్ బయోమెట్రిక్ స్కానింగ్.',
    startScan: 'కెమెరా ప్రారంభించి స్కాన్ చేయండి',
    cancelScan: 'రద్దు చేయండి',
    faceScanning: 'ఫేస్ స్కానింగ్ జరుగుతోంది...',
    facePrompt: 'సర్కిల్‌లో ముఖాన్ని ఉంచి సహజంగా కనురెప్పలు వేయండి',
    faceVerified: 'ముఖం సరిచూడబడింది! లాగిన్ అవుతోంది...',
    faceFailed: 'ఫేస్ సరిపోలలేదు లేదా లైవ్‌నెస్ పరీక్ష విఫలమైంది.',
    cameraDenied: 'కెమెరా అనుమతి నిరాకరించబడింది.'
  }
};

const DEMO_CREDENTIALS = {
  admin: { user: 'admin', pass: 'admin123' },
  doctor: { user: 'dr.vikram', pass: 'doc123' },
  nurse: { user: 'nurse.sarah', pass: 'nurse123' },
  patient: { user: 'CARD-101', pass: '9876543210' },
};

const ROLE_COLORS = {
  admin: 'from-violet-500 to-purple-600',
  doctor: 'from-blue-500 to-cyan-600',
  nurse: 'from-emerald-500 to-teal-600',
  patient: 'from-amber-500 to-orange-600',
};

export default function LoginPage({ onLogin, currentLang = 'en', darkMode = false, t: parentT }) {
  const [activeRole, setActiveRole] = useState('admin');
  const [authMethod, setAuthMethod] = useState('password'); // 'password', 'passkey', 'face'
  
  // Password State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Passkey State
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(true);
  const [passkeyStatusMsg, setPasskeyStatusMsg] = useState('');

  // Face Recognition State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [faceStatus, setFaceStatus] = useState('');
  const [livenessScore, setLivenessScore] = useState(0);
  const [faceProgress, setFaceProgress] = useState(0);
  const [faceVerified, setFaceVerified] = useState(false);

  const usernameRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const isRtl = currentLang === 'ar';
  const lt = loginTranslations[currentLang] || loginTranslations.en;

  // Check device passkey capabilities
  useEffect(() => {
    checkPasskeyAvailability().then(status => {
      setPasskeyAvailable(status.supported);
      if (status.platformBiometrics) {
        setPasskeyStatusMsg('✓ Device Biometrics Available (Windows Hello / Touch ID / Face ID)');
      }
    });
  }, []);

  // Stop camera when unmounting or switching methods
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        stopCamera(cameraStreamRef.current);
        cameraStreamRef.current = null;
      }
    };
  }, []);

  const handleRoleChange = useCallback((role) => {
    setActiveRole(role);
    if (role !== 'admin' && (authMethod === 'face' || authMethod === 'passkey')) {
      setAuthMethod('password');
    }
    setUsername('');
    setPassword('');
    setError('');
    setShaking(false);
  }, [authMethod]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  // 1. STANDARD PASSWORD SUBMIT
  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(username, password, activeRole);
      if (result.success) {
        if (rememberMe) {
          try {
            localStorage.setItem('hospital_remember_login', JSON.stringify({ username, role: activeRole }));
          } catch {}
        }
        onLogin(result.user);
      } else {
        setError(result.error);
        triggerShake();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // 2. PASSKEY BIOMETRIC AUTHENTICATION (OPTION A - PRIMARY)
  const handlePasskeyLogin = async () => {
    setError('');
    setPasskeyLoading(true);
    try {
      const res = await loginWithPasskey('admin');
      if (res.success) {
        onLogin(res.user);
      } else {
        setError(res.error);
        triggerShake();
      }
    } catch (err) {
      setError(err.message || 'Passkey authentication failed.');
      triggerShake();
    } finally {
      setPasskeyLoading(false);
    }
  };

  // 3. WEBCAM FACE RECOGNITION (OPTION B - WEBCAM SCANNER)
  const startFaceScanning = async () => {
    setError('');
    setCameraLoading(true);
    setFaceVerified(false);
    setFaceProgress(10);
    setFaceStatus(lt.faceScanning);

    try {
      const stream = await startCamera(videoRef.current);
      cameraStreamRef.current = stream;
      setCameraActive(true);
      setCameraLoading(false);

      const frameHistory = [];
      let attempts = 0;

      const scanInterval = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        attempts++;

        const embedding = extractFaceEmbedding(videoRef.current, canvasRef.current);
        if (embedding) {
          frameHistory.push(embedding);
          if (frameHistory.length > 5) frameHistory.shift();

          const liveness = analyzeLiveness(frameHistory);
          setLivenessScore(Math.round(liveness.score * 100));
          setFaceStatus(liveness.message);
          setFaceProgress(prev => Math.min(prev + 18, 85));

          if (liveness.isLive && frameHistory.length >= 3) {
            clearInterval(scanInterval);
            setFaceStatus(lt.faceVerified);
            setFaceProgress(95);

            const res = await verifyAdminFace(embedding, liveness.score, 'admin');
            if (res.success) {
              setFaceProgress(100);
              setFaceVerified(true);
              setTimeout(() => {
                if (cameraStreamRef.current) {
                  stopCamera(cameraStreamRef.current);
                  cameraStreamRef.current = null;
                }
                onLogin(res.user);
              }, 600);
            } else {
              setFaceStatus('Face mismatch');
              setError(res.error || lt.faceFailed);
              setFaceProgress(0);
              triggerShake();
            }
          }
        }

        // Timeout after 15 seconds
        if (attempts > 35) {
          clearInterval(scanInterval);
          setError('Face scanning timed out. Please try again or use Passkey/Password.');
          if (cameraStreamRef.current) {
            stopCamera(cameraStreamRef.current);
            cameraStreamRef.current = null;
          }
          setCameraActive(false);
        }
      }, 350);

    } catch (err) {
      setCameraLoading(false);
      setCameraActive(false);
      setError(err.name === 'NotAllowedError' ? lt.cameraDenied : err.message || 'Camera error');
    }
  };

  const cancelFaceScanning = () => {
    if (cameraStreamRef.current) {
      stopCamera(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
    setFaceProgress(0);
    setFaceStatus('');
  };

  const handleUseDemo = (role) => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      setActiveRole(role);
      setAuthMethod('password');
      setUsername(cred.user);
      setPassword(cred.pass);
      setError('');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #090d16 0%, #111827 50%, #090d16 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      }}
    >
      <div className={`relative w-full max-w-lg z-10 ${shaking ? 'animate-shake' : ''}`}>
        <div
          className={`rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
            darkMode
              ? 'bg-slate-900/95 border-slate-800 backdrop-blur-xl'
              : 'bg-white/95 border-white/20 backdrop-blur-xl'
          }`}
        >
          {/* Header Banner */}
          <div className={`px-6 pt-7 pb-6 text-center bg-gradient-to-r ${ROLE_COLORS[activeRole]} text-white relative`}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 text-3xl">
              🏥
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{lt.title}</h1>
            <p className="text-xs text-white/80 mt-1 font-medium">{lt.subtitle}</p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="p-4 sm:p-6 pb-0">
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              {(['admin', 'doctor', 'nurse', 'patient']).map((role) => {
                const active = activeRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      active
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{role === 'admin' ? '👨‍💼' : role === 'doctor' ? '👨‍⚕️' : role === 'nurse' ? '👩‍⚕️' : '🧑'}</span>
                    <span className="truncate">{lt.roles[role]}</span>
                  </button>
                );
              })}
            </div>

            {/* Admin Biometric & Method Switcher (When Admin is selected) */}
            {activeRole === 'admin' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Select Admin Authentication Mode
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMethod('passkey'); cancelFaceScanning(); }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 relative ${
                      authMethod === 'passkey'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs">Passkey / Biometrics</span>
                    <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
                      Primary
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthMethod('face'); }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      authMethod === 'face'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Scan className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs">Face Recognition</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthMethod('password'); cancelFaceScanning(); }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      authMethod === 'password'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs">Password</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form / Scanner Body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* METHOD 1: PASSKEY / DEVICE BIOMETRICS (OPTION A)              */}
            {/* ============================================================== */}
            {activeRole === 'admin' && authMethod === 'passkey' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner relative">
                  <Fingerprint className="w-10 h-10 animate-pulse" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 absolute top-2 right-2 ring-4 ring-white dark:ring-slate-900" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {lt.passkeyTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {lt.passkeyDesc}
                  </p>
                  {passkeyStatusMsg && (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5">
                      {passkeyStatusMsg}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-60"
                  >
                    {passkeyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Windows Hello / Biometrics...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        <span>{lt.passkeyBtn}</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Hardware-backed FIDO2 challenge verification • Zero raw biometrics stored
                </p>
              </div>
            )}

            {/* ============================================================== */}
            {/* METHOD 2: CUSTOM WEBCAM FACE RECOGNITION (OPTION B)           */}
            {/* ============================================================== */}
            {activeRole === 'admin' && authMethod === 'face' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {lt.faceTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lt.faceDesc}
                  </p>
                </div>

                {/* Camera Viewfinder & HUD */}
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500/50 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${!cameraActive ? 'hidden' : ''}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Idle Overlay when camera is off */}
                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Click below to grant camera access and initiate live facial verification.
                      </p>
                      <button
                        type="button"
                        onClick={startFaceScanning}
                        disabled={cameraLoading}
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 mx-auto transition"
                      >
                        {cameraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                        <span>{cameraLoading ? 'Initializing Camera...' : lt.startScan}</span>
                      </button>
                    </div>
                  )}

                  {/* Active Scanning HUD Reticle */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      {/* Targeting Oval / Guide */}
                      <div className="w-48 h-56 rounded-full border-2 border-dashed border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.5)] relative flex items-center justify-center">
                        {/* Laser Scan Line Animation */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-laser shadow-[0_0_10px_#10b981]" />
                        
                        {/* Corner Target Indicators */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                      </div>

                      {/* Status Tag */}
                      <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-bold border border-slate-700 flex items-center gap-1.5 shadow-md">
                        {faceVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        )}
                        <span>{faceStatus || lt.facePrompt}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress & Actions when active */}
                {cameraActive && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Liveness & Biometric Confidence</span>
                      <span className="font-mono text-indigo-500">{faceProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${faceProgress}%` }}
                      />
                    </div>
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={cancelFaceScanning}
                        className="text-xs text-red-500 hover:text-red-700 font-bold transition"
                      >
                        {lt.cancelScan}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* METHOD 3: STANDARD USERNAME & PASSWORD                        */}
            {/* ============================================================== */}
            {(authMethod === 'password' || activeRole !== 'admin') && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {activeRole === 'patient' ? lt.patientUserLabel : lt.username}
                  </label>
                  <div className="relative">
                    <input
                      ref={usernameRef}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={activeRole === 'patient' ? lt.patientUserPlaceholder : lt.usernamePlaceholder}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {activeRole === 'patient' ? lt.patientPassLabel : lt.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={activeRole === 'patient' ? lt.patientPassPlaceholder : lt.passwordPlaceholder}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{lt.rememberMe}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lt.loggingIn}</span>
                    </>
                  ) : (
                    <span>{lt.loginBtn}</span>
                  )}
                </button>
              </form>
            )}

            {/* Demo Credentials Quick-Fill Helper */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <span>🔑 {lt.demoCredentials} (1-Click Fill)</span>
                <span>{showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
              </button>

              {showDemo && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(['admin', 'doctor', 'nurse', 'patient']).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleUseDemo(role)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-left text-xs transition"
                    >
                      <p className="font-bold text-slate-800 dark:text-white capitalize">{role}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {DEMO_CREDENTIALS[role].user} / {DEMO_CREDENTIALS[role].pass}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-5">
              {lt.secureLogin}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
