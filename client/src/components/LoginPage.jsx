import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Loader2, ShieldCheck, Stethoscope, HeartPulse, UserCircle } from 'lucide-react';
import { login } from '../services/auth';

const loginTranslations = {
  en: {
    title: 'OPD SHA Hospital',
    subtitle: 'Smart Government Hospital Management System',
    signIn: 'Sign In',
    signInSub: 'Access your hospital portal securely',
    roles: { admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse', patient: 'Patient' },
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
    contactAdmin: 'Contact hospital administration for password reset',
    secureLogin: 'Secured with 256-bit encryption',
    patientUserLabel: 'Token Number',
    patientPassLabel: 'Mobile Number',
    patientUserPlaceholder: 'Enter your token number',
    patientPassPlaceholder: 'Enter registered mobile',
  },
  ar: {
    title: 'مستشفى OPD SHA',
    subtitle: 'نظام إدارة المستشفى الحكومي الذكي',
    signIn: 'تسجيل الدخول',
    signInSub: 'الوصول إلى بوابة المستشفى بأمان',
    roles: { admin: 'مدير', doctor: 'طبيب', nurse: 'ممرض/ة', patient: 'مريض' },
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
    contactAdmin: 'اتصل بإدارة المستشفى لإعادة تعيين كلمة المرور',
    secureLogin: 'مؤمن بتشفير 256 بت',
    patientUserLabel: 'رقم الرمز',
    patientPassLabel: 'رقم الجوال',
    patientUserPlaceholder: 'أدخل رقم الرمز الخاص بك',
    patientPassPlaceholder: 'أدخل رقم الجوال المسجل',
  },
  hi: {
    title: 'OPD SHA अस्पताल',
    subtitle: 'स्मार्ट सरकारी अस्पताल प्रबंधन प्रणाली',
    signIn: 'साइन इन',
    signInSub: 'अपने अस्पताल पोर्टल को सुरक्षित रूप से एक्सेस करें',
    roles: { admin: 'प्रशासक', doctor: 'डॉक्टर', nurse: 'नर्स', patient: 'मरीज़' },
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
    contactAdmin: 'पासवर्ड रीसेट के लिए अस्पताल प्रशासन से संपर्क करें',
    secureLogin: '256-बिट एन्क्रिप्शन से सुरक्षित',
    patientUserLabel: 'टोकन नंबर',
    patientPassLabel: 'मोबाइल नंबर',
    patientUserPlaceholder: 'अपना टोकन नंबर दर्ज करें',
    patientPassPlaceholder: 'पंजीकृत मोबाइल दर्ज करें',
  },
  ta: {
    title: 'OPD SHA மருத்துவமனை',
    subtitle: 'ஸ்மார்ட் அரசு மருத்துவமனை மேலாண்மை அமைப்பு',
    signIn: 'உள்நுழைக',
    signInSub: 'உங்கள் மருத்துவமனை போர்ட்டலை பாதுகாப்பாக அணுகவும்',
    roles: { admin: 'நிர்வாகி', doctor: 'மருத்துவர்', nurse: 'செவிலியர்', patient: 'நோயாளி' },
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
    contactAdmin: 'கடவுச்சொல் மீட்டமைக்க மருத்துவமனை நிர்வாகத்தைத் தொடர்பு கொள்ளவும்',
    secureLogin: '256-பிட் குறியாக்கத்துடன் பாதுகாக்கப்படுகிறது',
    patientUserLabel: 'டோக்கன் எண்',
    patientPassLabel: 'கைபேசி எண்',
    patientUserPlaceholder: 'உங்கள் டோக்கன் எண்ணை உள்ளிடவும்',
    patientPassPlaceholder: 'பதிவு செய்த கைபேசி எண்ணை உள்ளிடவும்',
  },
  te: {
    title: 'OPD SHA ఆసుపత్రి',
    subtitle: 'స్మార్ట్ ప్రభుత్వ ఆసుపత్రి నిర్వహణ వ్యవస్థ',
    signIn: 'సైన్ ఇన్',
    signInSub: 'మీ ఆసుపత్రి పోర్టల్‌ను సురక్షితంగా యాక్సెస్ చేయండి',
    roles: { admin: 'నిర్వాహకుడు', doctor: 'వైద్యుడు', nurse: 'నర్సు', patient: 'రోగి' },
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
    contactAdmin: 'పాస్‌వర్డ్ రీసెట్ కోసం ఆసుపత్రి నిర్వహణను సంప్రదించండి',
    secureLogin: '256-బిట్ ఎన్‌క్రిప్షన్‌తో భద్రం',
    patientUserLabel: 'టోకెన్ నంబర్',
    patientPassLabel: 'మొబైల్ నంబర్',
    patientUserPlaceholder: 'మీ టోకెన్ నంబర్ నమోదు చేయండి',
    patientPassPlaceholder: 'నమోదిత మొబైల్ నమోదు చేయండి',
  },
  kn: {
    title: 'OPD SHA ಆಸ್ಪತ್ರೆ',
    subtitle: 'ಸ್ಮಾರ್ಟ್ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ',
    signIn: 'ಸೈನ್ ಇನ್',
    signInSub: 'ನಿಮ್ಮ ಆಸ್ಪತ್ರೆ ಪೋರ್ಟಲ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಪ್ರವೇಶಿಸಿ',
    roles: { admin: 'ನಿರ್ವಾಹಕ', doctor: 'ವೈದ್ಯ', nurse: 'ದಾದಿ', patient: 'ರೋಗಿ' },
    username: 'ಬಳಕೆದಾರ ಹೆಸರು',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    usernamePlaceholder: 'ಬಳಕೆದಾರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ',
    rememberMe: 'ನನ್ನನ್ನು ನೆನಪಿಟ್ಟುಕೊ',
    loginBtn: 'ಸೈನ್ ಇನ್',
    loggingIn: 'ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...',
    demoCredentials: 'ಡೆಮೋ ರುಜುವಾತುಗಳು',
    demoHint: 'ವ್ಯವಸ್ಥೆಯನ್ನು ಅನ್ವೇಷಿಸಲು ಇವುಗಳನ್ನು ಬಳಸಿ:',
    forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
    contactAdmin: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಲು ಆಸ್ಪತ್ರೆ ಆಡಳಿತವನ್ನು ಸಂಪರ್ಕಿಸಿ',
    secureLogin: '256-ಬಿಟ್ ಎನ್‌ಕ್ರಿಪ್ಶನ್‌ನೊಂದಿಗೆ ಸುರಕ್ಷಿತ',
    patientUserLabel: 'ಟೋಕನ್ ಸಂಖ್ಯೆ',
    patientPassLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    patientUserPlaceholder: 'ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    patientPassPlaceholder: 'ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ನಮೂದಿಸಿ',
  },
  ml: {
    title: 'OPD SHA ആശുപത്രി',
    subtitle: 'സ്മാർട്ട് ഗവൺമെന്റ് ഹോസ്പിറ്റൽ മാനേജ്മെന്റ് സിസ്റ്റം',
    signIn: 'സൈൻ ഇൻ',
    signInSub: 'നിങ്ങളുടെ ആശുപത്രി പോർട്ടൽ സുരക്ഷിതമായി ആക്സസ് ചെയ്യുക',
    roles: { admin: 'അഡ്മിൻ', doctor: 'ഡോക്ടർ', nurse: 'നഴ്‌സ്', patient: 'രോഗി' },
    username: 'ഉപയോക്തൃ നാമം',
    password: 'പാസ്‌വേഡ്',
    usernamePlaceholder: 'ഉപയോക്തൃ നാമം നൽകുക',
    passwordPlaceholder: 'പാസ്‌വേഡ് നൽകുക',
    rememberMe: 'എന്നെ ഓർക്കുക',
    loginBtn: 'സൈൻ ഇൻ',
    loggingIn: 'സൈൻ ഇൻ ചെയ്യുന്നു...',
    demoCredentials: 'ഡെമോ ക്രെഡൻഷ്യലുകൾ',
    demoHint: 'സിസ്റ്റം പര്യവേക്ഷണം ചെയ്യാൻ ഇവ ഉപയോഗിക്കുക:',
    forgotPassword: 'പാസ്‌വേഡ് മറന്നോ?',
    contactAdmin: 'പാസ്‌വേഡ് റീസെറ്റിന് ആശുപത്രി ഭരണവിഭാഗവുമായി ബന്ധപ്പെടുക',
    secureLogin: '256-ബിറ്റ് എൻക്രിപ്ഷനിൽ സുരക്ഷിതം',
    patientUserLabel: 'ടോക്കൺ നമ്പർ',
    patientPassLabel: 'മൊബൈൽ നമ്പർ',
    patientUserPlaceholder: 'നിങ്ങളുടെ ടോക്കൺ നമ്പർ നൽകുക',
    patientPassPlaceholder: 'രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നൽകുക',
  },
  bn: {
    title: 'OPD SHA হাসপাতাল',
    subtitle: 'স্মার্ট সরকারি হাসপাতাল ব্যবস্থাপনা সিস্টেম',
    signIn: 'সাইন ইন',
    signInSub: 'আপনার হাসপাতাল পোর্টাল নিরাপদে অ্যাক্সেস করুন',
    roles: { admin: 'প্রশাসক', doctor: 'ডাক্তার', nurse: 'নার্স', patient: 'রোগী' },
    username: 'ব্যবহারকারীর নাম',
    password: 'পাসওয়ার্ড',
    usernamePlaceholder: 'ব্যবহারকারীর নাম লিখুন',
    passwordPlaceholder: 'পাসওয়ার্ড লিখুন',
    rememberMe: 'আমাকে মনে রাখুন',
    loginBtn: 'সাইন ইন',
    loggingIn: 'সাইন ইন হচ্ছে...',
    demoCredentials: 'ডেমো শংসাপত্র',
    demoHint: 'সিস্টেম অন্বেষণ করতে এগুলি ব্যবহার করুন:',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    contactAdmin: 'পাসওয়ার্ড রিসেটের জন্য হাসপাতাল প্রশাসনের সাথে যোগাযোগ করুন',
    secureLogin: '256-বিট এনক্রিপশনে সুরক্ষিত',
    patientUserLabel: 'টোকেন নম্বর',
    patientPassLabel: 'মোবাইল নম্বর',
    patientUserPlaceholder: 'আপনার টোকেন নম্বর লিখুন',
    patientPassPlaceholder: 'নিবন্ধিত মোবাইল লিখুন',
  },
  mr: {
    title: 'OPD SHA रुग्णालय',
    subtitle: 'स्मार्ट सरकारी रुग्णालय व्यवस्थापन प्रणाली',
    signIn: 'साइन इन',
    signInSub: 'तुमचे रुग्णालय पोर्टल सुरक्षितपणे ॲक्सेस करा',
    roles: { admin: 'प्रशासक', doctor: 'डॉक्टर', nurse: 'नर्स', patient: 'रुग्ण' },
    username: 'वापरकर्ता नाव',
    password: 'पासवर्ड',
    usernamePlaceholder: 'वापरकर्ता नाव प्रविष्ट करा',
    passwordPlaceholder: 'पासवर्ड प्रविष्ट करा',
    rememberMe: 'मला लक्षात ठेवा',
    loginBtn: 'साइन इन',
    loggingIn: 'साइन इन होत आहे...',
    demoCredentials: 'डेमो क्रेडेन्शियल',
    demoHint: 'सिस्टम एक्सप्लोर करण्यासाठी हे वापरा:',
    forgotPassword: 'पासवर्ड विसरलात?',
    contactAdmin: 'पासवर्ड रीसेटसाठी रुग्णालय प्रशासनाशी संपर्क साधा',
    secureLogin: '256-बिट एनक्रिप्शनने सुरक्षित',
    patientUserLabel: 'टोकन क्रमांक',
    patientPassLabel: 'मोबाइल क्रमांक',
    patientUserPlaceholder: 'तुमचा टोकन क्रमांक प्रविष्ट करा',
    patientPassPlaceholder: 'नोंदणीकृत मोबाइल प्रविष्ट करा',
  },
};

const ROLES = ['admin', 'doctor', 'nurse', 'patient'];

const ROLE_ICONS = {
  admin: ShieldCheck,
  doctor: Stethoscope,
  nurse: HeartPulse,
  patient: UserCircle,
};

const ROLE_CREDENTIALS = {
  admin: { user: 'admin', pass: 'admin123' },
  doctor: { user: 'dr.vikram', pass: 'doc123' },
  nurse: { user: 'nurse.sarah', pass: 'nurse123' },
  patient: { user: 'Token Number', pass: 'Mobile' },
};

const ROLE_COLORS = {
  admin: 'from-violet-500 to-purple-600',
  doctor: 'from-blue-500 to-cyan-600',
  nurse: 'from-emerald-500 to-teal-600',
  patient: 'from-amber-500 to-orange-600',
};

export default function LoginPage({ onLogin, currentLang = 'en', darkMode = false, t: parentT }) {
  const [activeRole, setActiveRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const usernameRef = useRef(null);
  const isRtl = currentLang === 'ar';
  const lt = loginTranslations[currentLang] || loginTranslations.en;

  // Auto-focus username on mount and role change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usernameRef.current) {
        usernameRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeRole]);

  // Restore remembered credentials
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hospital_remember_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username && parsed.role) {
          setUsername(parsed.username);
          setActiveRole(parsed.role);
          setRememberMe(true);
        }
      }
    } catch (e) {
      console.error('Failed to restore remembered login:', e);
    }
  }, []);

  // Clear fields on role switch
  const handleRoleChange = useCallback((role) => {
    setActiveRole(role);
    setUsername('');
    setPassword('');
    setError('');
    setShaking(false);
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(username, password, activeRole);

      if (result.success) {
        // Save remember-me preference
        if (rememberMe) {
          try {
            localStorage.setItem('hospital_remember_login', JSON.stringify({ username, role: activeRole }));
          } catch (err) {
            console.error('Failed to save remember-me:', err);
          }
        } else {
          try {
            localStorage.removeItem('hospital_remember_login');
          } catch (err) {
            console.error('Failed to clear remember-me:', err);
          }
        }
        onLogin(result.user);
      } else {
        setError(result.error);
        triggerShake();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      triggerShake();
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }, [username, password, activeRole, loading, rememberMe, onLogin, triggerShake]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const isPatient = activeRole === 'patient';
  const usernameLabel = isPatient ? lt.patientUserLabel : lt.username;
  const passwordLabel = isPatient ? lt.patientPassLabel : lt.password;
  const userPlaceholder = isPatient ? lt.patientUserPlaceholder : lt.usernamePlaceholder;
  const passPlaceholder = isPatient ? lt.patientPassPlaceholder : lt.passwordPlaceholder;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      }}
    >
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      {/* Login Card */}
      <div
        className={`relative w-full max-w-md z-10 ${shaking ? 'animate-shake' : ''}`}
      >
        {/* Card */}
        <div
          className={`rounded-2xl shadow-2xl border overflow-hidden ${
            darkMode
              ? 'bg-slate-800/95 border-slate-700/50 backdrop-blur-xl'
              : 'bg-white/95 border-white/20 backdrop-blur-xl'
          }`}
        >
          {/* Header / Branding */}
          <div className={`px-6 pt-8 pb-6 text-center bg-gradient-to-r ${ROLE_COLORS[activeRole]} relative overflow-hidden`}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
            </div>

            <div className="relative">
              <div className="text-5xl mb-3" role="img" aria-label="Hospital">🏥</div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {lt.title}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {lt.subtitle}
              </p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className={`px-6 pt-5 ${darkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}>
            <div className={`flex rounded-xl p-1 ${
              darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
            }`}>
              {ROLES.map((role) => {
                const Icon = ROLE_ICONS[role];
                const isActive = activeRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-md dark:bg-slate-600 dark:text-indigo-300'
                        : darkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                    aria-pressed={isActive}
                    aria-label={lt.roles[role]}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate max-w-full">{lt.roles[role]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={`px-6 pb-6 pt-4 space-y-4 ${darkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}
          >
            <div className="text-center mb-2">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {lt.signIn}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lt.signInSub}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800" role="alert">
                <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label
                htmlFor="login-username"
                className={`block text-sm font-medium mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {usernameLabel}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <User className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <input
                  ref={usernameRef}
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder={userPlaceholder}
                  autoComplete="username"
                  className={`w-full rounded-xl border py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none ${
                    isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  } ${
                    darkMode
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className={`block text-sm font-medium mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <Lock className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder={passPlaceholder}
                  autoComplete="current-password"
                  className={`w-full rounded-xl border py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none ${
                    isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  } ${
                    darkMode
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center ${
                    darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {lt.rememberMe}
                </span>
              </label>
              <button
                type="button"
                onClick={() => alert(lt.contactAdmin)}
                className="text-sm text-indigo-500 hover:text-indigo-400 font-medium"
              >
                {lt.forgotPassword}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                loading || !username.trim() || !password.trim()
                  ? 'bg-indigo-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lt.loggingIn}
                </>
              ) : (
                <>
                  {lt.loginBtn}
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className={`w-3.5 h-3.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {lt.secureLogin}
              </span>
            </div>
          </form>

          {/* Demo Credentials Collapsible */}
          <div className={`border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className={`w-full px-6 py-3 flex items-center justify-between text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>💡 {lt.demoCredentials}</span>
              {showDemo
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </button>

            {showDemo && (
              <div className={`px-6 pb-5 ${darkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}>
                <p className={`text-xs mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lt.demoHint}
                </p>
                <div className="space-y-2">
                  {ROLES.map((role) => {
                    const Icon = ROLE_ICONS[role];
                    const cred = ROLE_CREDENTIALS[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          handleRoleChange(role);
                          if (role !== 'patient') {
                            setUsername(cred.user);
                            setPassword(cred.pass);
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-150 group ${
                          isRtl ? 'text-right' : 'text-left'
                        } ${
                          darkMode
                            ? 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700/50'
                            : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${ROLE_COLORS[role]} text-white shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {lt.roles[role]}
                          </p>
                          <p className={`text-xs font-mono truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {cred.user} / {cred.pass}
                          </p>
                        </div>
                        <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-500'
                        }`}>
                          ↵
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500/60">
            © {new Date().getFullYear()} OPD SHA Hospital • Ministry of Health & Family Welfare
          </p>
          <p className="text-xs text-slate-500/40 mt-1">
            National Smart Hospital Initiative • Ayushman Bharat ABDM
          </p>
        </div>
      </div>
    </div>
  );
}
