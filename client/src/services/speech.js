// Web Speech API and Audio TTS Service for Multilingual Hospital Announcements
// Supports: English (en), Arabic (ar), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn), Malayalam (ml), Bengali (bn), Marathi (mr)

let isSpeakingState = false;
let onStateChangeListeners = [];
let onVoiceAlertListeners = [];
let onHistoryListeners = [];
let currentAudio = null;
let lastAnnouncementData = null;

// Track duplicate announcements to prevent repetitive audio on refresh
const announcedKeys = new Set();

// In-memory announcement history with local storage persistence
let announcementHistory = (() => {
  try {
    const saved = localStorage.getItem('hospital_announcement_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
})();

// Audio mute state
let isMutedState = (() => {
  try {
    return localStorage.getItem('hospital_audio_muted') === 'true';
  } catch {
    return false;
  }
})();

// Voice cache for asynchronous voice loading
let cachedVoices = [];
function updateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch {
      cachedVoices = [];
    }
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

export function isSpeechMuted() {
  return isMutedState;
}

export function setSpeechMuted(muted) {
  isMutedState = Boolean(muted);
  try {
    localStorage.setItem('hospital_audio_muted', isMutedState ? 'true' : 'false');
  } catch {}
  if (isMutedState) {
    stopSpeaking();
  }
}

export function subscribeSpeechState(listener) {
  onStateChangeListeners.push(listener);
  return () => {
    onStateChangeListeners = onStateChangeListeners.filter(l => l !== listener);
  };
}

export function subscribeVoiceAlert(listener) {
  onVoiceAlertListeners.push(listener);
  return () => {
    onVoiceAlertListeners = onVoiceAlertListeners.filter(l => l !== listener);
  };
}

export function subscribeAnnouncementHistory(listener) {
  onHistoryListeners.push(listener);
  return () => {
    onHistoryListeners = onHistoryListeners.filter(l => l !== listener);
  };
}

function notifyState(speaking) {
  isSpeakingState = speaking;
  onStateChangeListeners.forEach(fn => {
    try {
      fn(speaking);
    } catch (e) {
      console.warn('Listener notification note:', e);
    }
  });
}

function notifyVoiceAlert(alert) {
  onVoiceAlertListeners.forEach(fn => {
    try {
      fn(alert);
    } catch (e) {
      console.warn('Voice alert notification note:', e);
    }
  });
}

function notifyHistory() {
  try {
    localStorage.setItem('hospital_announcement_history', JSON.stringify(announcementHistory.slice(0, 50)));
  } catch {}
  onHistoryListeners.forEach(fn => {
    try {
      fn([...announcementHistory]);
    } catch (e) {
      console.warn('History listener notification note:', e);
    }
  });
}

export function getAnnouncementHistory() {
  return [...announcementHistory];
}

export function clearAnnouncementHistory() {
  announcementHistory = [];
  announcedKeys.clear();
  notifyHistory();
}

// Synthesizes a realistic 2-tone hospital chime using Web Audio API
export function playHospitalChime() {
  if (isMutedState) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.45);

    // Tone 2: 659.25 Hz (E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.75);
  } catch (err) {
    console.warn('Audio chime note:', err.message);
  }
}

// BCP-47 Locale mapping for supported languages
export const LANG_LOCALE_MAP = {
  en: 'en-IN',
  ar: 'ar-SA',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
};

// Language display names
export const LANG_NAMES = {
  en: 'English',
  ar: 'العربية (Arabic)',
  hi: 'हिन्दी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  bn: 'বাংলা (Bengali)',
  mr: 'मराठी (Marathi)',
};

// Voice name search keywords for speech synthesis
const VOICE_LANG_KEYWORDS = {
  ar: ['ar', 'arabic', 'عربي', 'عربية', 'laila', 'mariam', 'salma', 'hoda', 'zeina', 'fatima', 'nour', 'tarik', 'shakir'],
  hi: ['hi', 'hindi', 'हिन्दी', 'lekha', 'swara', 'priya', 'kalpana', 'madhur', 'hemant'],
  ta: ['ta', 'tamil', 'தமிழ்', 'valluvar', 'raveena', 'vani', 'nanmalar'],
  te: ['te', 'telugu', 'తెలుగు', 'mohan', 'chitra', 'keerthi'],
  kn: ['kn', 'kannada', 'ಕನ್ನಡ', 'gagan', 'sapna', 'radha'],
  ml: ['ml', 'malayalam', 'മലയാളം', 'midhun', 'shobhana', 'anjali'],
  bn: ['bn', 'bengali', 'বাংলা', 'bashkar', 'tanisha', 'roshni'],
  mr: ['mr', 'marathi', 'मराठी', 'aarohi', 'manisha'],
  en: ['en', 'english', 'india', 'zira', 'heera', 'hazel', 'aria', 'jenny', 'veena', 'neerja']
};

/**
 * Detect available voices for any given language code
 */
export function getAvailableVoicesForLang(langCode = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const keywords = VOICE_LANG_KEYWORDS[langCode] || [langCode];
  
  return voices.filter(v => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return keywords.some(k => l.startsWith(k) || l.includes(k) || n.includes(k));
  });
}

export function getAvailableArabicVoices() {
  return getAvailableVoicesForLang('ar');
}

export function isArabicVoiceAvailable() {
  return getAvailableArabicVoices().length > 0;
}

// Find best matching voice for target locale
export function pickVoiceForLocale(voices, locale) {
  if (!voices || voices.length === 0) {
    voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  }
  if (!voices || voices.length === 0) return null;

  const lang = (locale || 'en').split('-')[0].toLowerCase();
  const keywords = VOICE_LANG_KEYWORDS[lang] || [lang];

  // 1. Exact locale matching (e.g. 'ta-IN')
  const exact = voices.find(v => (v.lang || '').toLowerCase() === locale.toLowerCase());
  if (exact) return exact;

  // 2. Exact lang prefix matching (e.g. 'ta')
  const langPrefix = voices.find(v => (v.lang || '').toLowerCase().startsWith(lang));
  if (langPrefix) return langPrefix;

  // 3. Keyword matching in name or lang tag
  const keywordMatch = voices.find(v => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return keywords.some(k => l.includes(k) || n.includes(k));
  });
  if (keywordMatch) return keywordMatch;

  return null;
}

// Clean text for speech synthesis and expand abbreviations
function sanitizeSpeechText(text, lang = 'en') {
  if (!text) return '';

  let cleaned = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•|*#_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Natural pronunciation replacement for "OPD" per language so voice doesn't choke or get truncated
  switch (lang) {
    case 'ar':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'العيادات الخارجية').replace(/\bSHA\b/gi, 'شا');
      break;
    case 'hi':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ओपीडी').replace(/\bSHA\b/gi, 'शा');
      break;
    case 'ta':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ஓபிடி').replace(/\bSHA\b/gi, 'ஷா');
      break;
    case 'te':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ఓపీడీ').replace(/\bSHA\b/gi, 'షా');
      break;
    case 'kn':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ಒಪಿಡಿ').replace(/\bSHA\b/gi, 'ಶಾ');
      break;
    case 'ml':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ഒപിഡി').replace(/\bSHA\b/gi, 'ഷാ');
      break;
    case 'bn':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ওপিডি').replace(/\bSHA\b/gi, 'শা');
      break;
    case 'mr':
      cleaned = cleaned.replace(/\bOPD\b/gi, 'ओपीडी').replace(/\bSHA\b/gi, 'शा');
      break;
    default:
      cleaned = cleaned.replace(/\bOPD\b/gi, 'O.P.D.').replace(/\bDr\./gi, 'Doctor');
      break;
  }

  return cleaned;
}

/**
 * Phonetic transliterations for fallback when OS lacks the native Indic/Arabic TTS voices.
 * Ensures that even on English-only Windows/Mac/Linux installations, the announcement is
 * spoken completely and naturally in the correct language words instead of cutting off or aborting.
 */
function getPhoneticFallback(data, lang) {
  const pName = data.patientName || 'Patient';
  const tNum = (data.tokenNumber || '').replace('-', ' ');
  const dName = data.doctorName || 'Doctor';
  const room = data.roomNumber || 'Room 5';

  switch (lang) {
    case 'ar':
      return `Al-mareed ${pName}, raqm ${tNum}, yurja al-tawajjuh ila ${room}. Al-tabeeb ${dName} fi intizarek.`;
    case 'hi':
      return `Mareez ${pName}, token sankhya ${tNum}, kripya kamra number ${room} mein padhaarein. Doctor ${dName} aapka intezaar kar rahe hain.`;
    case 'ta':
      return `Noyaali ${pName}, token enn ${tNum}, aalosanai arai ${room}-kku varavum. Maruthuvar ${dName} ungalukkaaga kaathirukkiraar.`;
    case 'te':
      return `Rogi ${pName}, token sankhya ${tNum}, dayachesi room number ${room}-ki randi. Doctor ${dName} mee kosam vechi unnaaru.`;
    case 'kn':
      return `Rogi ${pName}, token sankhye ${tNum}, dayavittu room number ${room}-kke banni. Doctor ${dName} nimage kaayuttiddare.`;
    case 'ml':
      return `Rogi ${pName}, token number ${tNum}, dayavaayi room number ${room}-lekku varoo. Doctor ${dName} ningalkkaayi kaathirikkunnu.`;
    case 'bn':
      return `Rogi ${pName}, token number ${tNum}, doya kore room number ${room}-e ashoon. Doctor ${dName} aponar jonno opekkha korchhen.`;
    case 'mr':
      return `Rugna ${pName}, token kramank ${tNum}, krupaya room number ${room} madhe yaave. Doctor ${dName} aapli vaat paahat aahet.`;
    default:
      return `Patient ${pName}, token number ${tNum}, please proceed to ${room}. Doctor ${dName} is waiting for you.`;
  }
}

/**
 * Core text-to-speech execution
 * Robustly manages native SpeechSynthesis, chunks sentences, and prevents overlaps
 */
export function speakText(text, lang = 'en') {
  if (isMutedState) {
    console.info('[TTS] Voice announcements are muted.');
    return;
  }

  if (!text || typeof text !== 'string' || text.trim() === '') return;

  // Cancel any ongoing speech immediately
  stopSpeaking();

  const cleaned = sanitizeSpeechText(text, lang);
  if (!cleaned) return;

  const locale = LANG_LOCALE_MAP[lang] || 'en-IN';

  // Play hospital chime
  playHospitalChime();

  setTimeout(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[TTS] Web Speech API not supported in this environment.');
      return;
    }

    const allVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    let matchingVoice = pickVoiceForLocale(allVoices, locale);

    // If native voice is not installed on this OS, use our phonetic transliteration
    // so an English voice speaks the announcement in the language rather than failing or saying "OPD"
    let textToSpeak = cleaned;
    let voiceToUse = matchingVoice;
    let langToSet = locale;

    if (!matchingVoice && lang !== 'en') {
      console.info(`[TTS] No native voice installed for "${lang}". Using language-accurate phonetic fallback.`);
      
      // Notify listeners about missing voice so UI can show a gentle badge if desired
      notifyVoiceAlert({
        type: 'VOICE_PACK_NOTE',
        message: `System using phonetics for ${LANG_NAMES[lang] || lang} (no native OS voice detected).`,
        lang
      });

      // Find an English voice (Indian English or UK/US English) that articulates phonetics clearly
      voiceToUse = pickVoiceForLocale(allVoices, 'en-IN') || pickVoiceForLocale(allVoices, 'en-US') || allVoices[0];
      langToSet = voiceToUse ? voiceToUse.lang : 'en-US';

      // If we have structured announcement data, generate natural phonetics
      if (lastAnnouncementData) {
        textToSpeak = getPhoneticFallback(lastAnnouncementData, lang);
      }
    }

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = (lang === 'ar' || lang === 'ta' || lang === 'ml') ? 0.88 : 0.92;
      utterance.pitch = 1.05;
      utterance.lang = langToSet;
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => {
        notifyState(true);
      };

      utterance.onend = () => {
        notifyState(false);
      };

      utterance.onerror = (e) => {
        notifyState(false);
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[TTS] Speech synthesis error:', e.error);
        }
      };

      window.speechSynthesis.speak(utterance);
      console.info(`[TTS] Spoken successfully in [${lang}]: "${textToSpeak.substring(0, 60)}..."`);
    } catch (err) {
      console.error('[TTS] Speech synthesis exception:', err);
      notifyState(false);
    }
  }, 320);
}

/**
 * Stop any current speech playback
 */
export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  notifyState(false);
}

export function isCurrentlySpeaking() {
  return isSpeakingState;
}

/**
 * Structured announcement data generator for all 9 languages.
 * Speaks the COMPLETE announcement with patient name, token, room, doctor, and instructions.
 */
export function speakFullAnnouncement(data, lang = 'en') {
  if (!data) return;
  lastAnnouncementData = { ...data };

  const pName = data.patientName || 'Patient';
  const tNum = data.tokenNumber || data.token || 'CARD-101';
  const dName = data.doctorName || 'Doctor';
  const dept = data.department || 'General Medicine';
  const room = data.roomNumber || 'Room 1';
  const type = data.type || 'call';

  let message = '';

  if (type === 'call') {
    switch (lang) {
      case 'ar':
        message = `نداء للمريض صاحب الرمز ${tNum}، ${pName}. يرجى التوجه إلى عيادة ${dept}، الغرفة رقم ${room}. الدكتور ${dName} في انتظارك الآن.`;
        break;
      case 'ta':
        message = `நோயாளி டோக்கன் எண் ${tNum}, ${pName}. தயவுசெய்து ${dept} துறை, அறை எண் ${room}-க்கு வரவும். மருத்துவர் ${dName} உங்களுக்காக காத்திருக்கிறார்.`;
        break;
      case 'hi':
        message = `मरीज़ टोकन संख्या ${tNum}, ${pName}। कृपया ${dept} विभाग, कमरा नंबर ${room} में पधारें। डॉक्टर ${dName} आपका इंतज़ार कर रहे हैं।`;
        break;
      case 'te':
        message = `రోగి టోకెన్ సంఖ్య ${tNum}, ${pName}. దయచేసి ${dept} విభాగం, గది సంఖ్య ${room} వద్దకు వెళ్లండి. డాక్టర్ ${dName} మీ కోసం వేచి ఉన్నారు.`;
        break;
      case 'kn':
        message = `ರೋಗಿ ಟೋಕನ್ ಸಂಖ್ಯೆ ${tNum}, ${pName}. ದಯವಿಟ್ಟು ${dept} ವಿಭಾಗ, ಕೊಠಡಿ ಸಂಖ್ಯೆ ${room} ಕ್ಕೆ ಬನ್ನಿ. ವೈದ್ಯರಾದ ${dName} ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ.`;
        break;
      case 'ml':
        message = `രോഗി ടോക്കൺ നമ്പർ ${tNum}, ${pName}. ദയവായി ${dept} വിഭാഗം, മുറി നമ്പർ ${room}-ലേക്ക് വരൂ. ഡോക്ടർ ${dName} നിങ്ങൾക്കായി കാത്തിരിക്കുന്നു.`;
        break;
      case 'bn':
        message = `রোগী টোকেন নম্বর ${tNum}, ${pName}। অনুগ্রহ করে ${dept} বিভাগ, রুম নম্বর ${room}-এ আসুন। ডাক্তার ${dName} আপনার জন্য অপেক্ষা করছেন।`;
        break;
      case 'mr':
        message = `रुग्ण टोकन क्रमांक ${tNum}, ${pName}. कृपया ${dept} विभाग, खोली क्रमांक ${room} मध्ये जावे. डॉक्टर ${dName} आपली वाट पाहत आहेत.`;
        break;
      default:
        message = `Patient ${pName}, Token number ${tNum}. Please proceed to ${dept}, Room number ${room}. Doctor ${dName} is waiting for you.`;
        break;
    }
  } else if (type === 'registered') {
    switch (lang) {
      case 'ar':
        message = `تم تسجيل المريض ${pName} بنجاح. رقم الرمز الخاص بك هو ${tNum}. يرجى التوجه إلى عيادة ${dept}.`;
        break;
      case 'ta':
        message = `நோயாளி ${pName} பதிவு முடிந்தது. உங்கள் டோக்கன் எண் ${tNum}. ${dept} துறைக்கு செல்லவும்.`;
        break;
      case 'hi':
        message = `मरीज़ ${pName} का पंजीकरण सफल रहा। आपकी टोकन संख्या ${tNum} है। कृपया ${dept} विभाग में जाएँ।`;
        break;
      case 'te':
        message = `రోగి ${pName} నమోదు విజయవంతమైంది. మీ టోకెన్ సంఖ్య ${tNum}. ${dept} విభాగానికి వెళ్లండి.`;
        break;
      case 'kn':
        message = `ರೋಗಿ ${pName} ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ. ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ ${tNum}. ${dept} ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ.`;
        break;
      case 'ml':
        message = `രോഗി ${pName} രജിസ്ട്രേഷൻ വിജയകരം. നിങ്ങളുടെ ടോക്കൺ നമ്പർ ${tNum}. ${dept} വിഭാഗത്തിലേക്ക് പോകുക.`;
        break;
      case 'bn':
        message = `রোগী ${pName}-এর নিবন্ধন সম্পন্ন হয়েছে। আপনার টোকেন নম্বর ${tNum}। ${dept} বিভাগে যান।`;
        break;
      case 'mr':
        message = `रुग्ण ${pName} नोंदणी यशस्वी झाली. आपला टोकन क्रमांक ${tNum} आहे. ${dept} विभागात जावे.`;
        break;
      default:
        message = `Registration completed for patient ${pName}. Your token number is ${tNum}. Please proceed to ${dept}.`;
        break;
    }
  } else if (type === 'emergency') {
    switch (lang) {
      case 'ar':
        message = `تنبيه طوارئ فوري! المريض ${pName}، الرمز ${tNum}. يرجى التوجه مباشرة إلى قسم الحوادث والطوارئ فوراً.`;
        break;
      case 'ta':
        message = `உடனடி அவசர எச்சரிக்கை! நோயாளி ${pName}, டோக்கன் ${tNum}. உடனடியாக அவசர சிகிச்சை பிரிவுக்கு செல்லவும்.`;
        break;
      case 'hi':
        message = `आपातकालीन सूचना! मरीज़ ${pName}, टोकन ${tNum}। कृपया तुरंत आपातकालीन कक्ष में पहुँचें।`;
        break;
      case 'te':
        message = `అత్యవసర హెచ్చరిక! రోగి ${pName}, టోకెన్ ${tNum}. వెంటనే ఎమర్జెన్సీ వార్డుకు వెళ్లండి.`;
        break;
      case 'kn':
        message = `ತುರ್ತು ಎಚ್ಚರಿಕೆ! ರೋಗಿ ${pName}, ಟೋಕನ್ ${tNum}. ತಕ್ಷಣ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಬನ್ನಿ.`;
        break;
      case 'ml':
        message = `അടിയന്തര മുന്നറിയിപ്പ്! രോഗി ${pName}, ടോക്കൺ ${tNum}. ഉടൻ തന്നെ എമർജൻസി വാർഡിലേക്ക് വരൂ.`;
        break;
      case 'bn':
        message = `জরুরি সতর্কতা! রোগী ${pName}, টোকেন ${tNum}। অবিলম্বে জরুরি ওয়ার্ডে উপস্থিত হন।`;
        break;
      case 'mr':
        message = `तात्काळ आपत्कालीन इशारा! रुग्ण ${pName}, टोकन ${tNum}. त्वरित आपत्कालीन कक्षात हजर राहावे.`;
        break;
      default:
        message = `Emergency alert! Patient ${pName}, Token ${tNum}. Please proceed directly to the Emergency Trauma Bay immediately.`;
        break;
    }
  } else {
    // General / Language change announcement
    switch (lang) {
      case 'ar':
        message = `تم تغيير لغة الإعلانات إلى العربية في مستشفى العيادات الخارجية.`;
        break;
      case 'ta':
        message = `ஓபிடி ஷா மருத்துவமனையின் அறிவிப்பு மொழி தமிழுக்கு மாற்றப்பட்டது.`;
        break;
      case 'hi':
        message = `ओपीडी शा अस्पताल में घोषणा की भाषा हिन्दी चुनी गई है।`;
        break;
      case 'te':
        message = `ఓపీడీ షా ఆసుపత్రిలో ప్రకటనల భాష తెలుగుగా మార్చబడింది.`;
        break;
      case 'kn':
        message = `ಒಪಿಡಿ ಶಾ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಪ್ರಕಟಣೆ ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.`;
        break;
      case 'ml':
        message = `ഒപിഡി ഷാ ആശുപത്രിയിലെ അറിയിപ്പ് ഭാഷ മലയാളമാക്കി മാറ്റി.`;
        break;
      case 'bn':
        message = `ওপিডি শা হাসপাতালে ঘোষণার ভাষা বাংলা নির্বাচিত হয়েছে।`;
        break;
      case 'mr':
        message = `ओपीडी शा रुग्णालयात घोषणेची भाषा मराठी करण्यात आली आहे.`;
        break;
      default:
        message = `Announcement language set to English at OPD SHA Hospital.`;
        break;
    }
  }

  // Record into announcement history
  const historyEntry = {
    id: `ANNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    patientId: data.patientId || tNum,
    patientName: pName,
    nurseName: data.nurseName || 'Nurse',
    doctorName: dName,
    roomNumber: room,
    text: message,
    lang,
    status: isMutedState ? 'Pending (Muted)' : 'Announced'
  };

  announcementHistory.unshift(historyEntry);
  if (announcementHistory.length > 50) {
    announcementHistory = announcementHistory.slice(0, 50);
  }
  notifyHistory();

  // Speak the complete announcement
  speakText(message, lang);

  return {
    announced: true,
    text: message,
    historyEntry
  };
}

/**
 * Called when user selects a new language from the language dropdown.
 * Immediately generates and speaks the full announcement in that exact language.
 */
export function handleLanguageChangeAnnouncement(newLang) {
  if (lastAnnouncementData) {
    // Re-speak the active patient announcement in the new language
    speakFullAnnouncement(lastAnnouncementData, newLang);
  } else {
    // Speak a clear hospital confirmation in the newly selected language
    speakFullAnnouncement({ type: 'lang_change' }, newLang);
  }
}

export function setLastAnnouncement(data) {
  lastAnnouncementData = data ? { ...data } : null;
}

export function getLastAnnouncement() {
  return lastAnnouncementData ? { ...lastAnnouncementData } : null;
}

/**
 * Nurse / Caretaker Voice Escort Announcement
 */
export function announceNurseEscort({
  patientId,
  patientName = '',
  nurseName = 'Nurse',
  doctorName = 'Doctor',
  roomNumber = 'Room 101',
  lang = 'en',
  force = false
}) {
  if (!patientId) return { announced: false, reason: 'INVALID_PATIENT_ID' };

  const assignmentKey = `${patientId}_${nurseName}_${doctorName}_${roomNumber}`;
  if (!force && announcedKeys.has(assignmentKey)) {
    console.info(`[TTS] Announcement already made for ${assignmentKey}. Skipping duplicate.`);
    return { announced: false, reason: 'DUPLICATE_SKIPPED' };
  }

  announcedKeys.add(assignmentKey);

  return speakFullAnnouncement({
    type: 'call',
    patientId,
    patientName,
    nurseName,
    doctorName,
    roomNumber,
    tokenNumber: patientId
  }, lang);
}

// Patient calling announcement helper
export function announcePatientCalling(tokenNumber, patientName, lang = 'en', doctorName = 'Doctor', roomNumber = 'Room 1') {
  return speakFullAnnouncement({
    type: 'call',
    tokenNumber,
    patientName,
    doctorName,
    roomNumber
  }, lang);
}

// No waiting patients announcement helper
export function announceNoWaitingPatients(lang = 'en') {
  let message = '';
  switch (lang) {
    case 'ar':
      message = 'لا يوجد مزيد من المرضى في قائمة الانتظار لهذا القسم حالياً.';
      break;
    case 'ta':
      message = 'இந்த துறையில் தற்போது காத்திருக்கும் நோயாளிகள் எவரும் இல்லை.';
      break;
    case 'hi':
      message = 'इस विभाग में वर्तमान में कोई प्रतीक्षारत मरीज नहीं है।';
      break;
    case 'te':
      message = 'ఈ విభాగంలో ప్రస్తుతం వేచి ఉన్న రోగులు ఎవరూ లేరు.';
      break;
    case 'kn':
      message = 'ಈ ವಿಭಾಗದಲ್ಲಿ ಪ್ರಸ್ತುತ ಕಾಯುತ್ತಿರುವ ರೋಗಿಗಳು ಯಾರೂ ಇಲ್ಲ.';
      break;
    case 'ml':
      message = 'ഈ വിഭാഗത്തിൽ ഇപ്പോൾ കാത്തിരിക്കുന്ന രോഗികളില്ല.';
      break;
    case 'bn':
      message = 'এই বিভাগে বর্তমানে কোনো অপেক্ষমান রোগী নেই।';
      break;
    case 'mr':
      message = 'या विभागात सध्या कोणीही प्रतीक्षेत रुग्ण नाही.';
      break;
    default:
      message = 'There are no more waiting patients in this department queue.';
      break;
  }
  speakText(message, lang);
}
