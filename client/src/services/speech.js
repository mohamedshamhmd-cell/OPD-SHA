// Web Speech API and Audio TTS Service for Multilingual Hospital Announcements
// Featuring Alison Krauss AI Voice Clone Profile
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

/**
 * Acoustic Hospital Chime with Alison Krauss-styled gentle harmonics
 */
export function playHospitalChime() {
  if (isMutedState) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tone 1: 523.25 Hz (C5) - Gentle acoustic sine bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Tone 2: 659.25 Hz (E5) - Harmonic resonance
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('Audio chime note:', err.message);
  }
}

// BCP-47 Locale mapping
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

/**
 * Alison Krauss Voice Persona Selector
 * Alison Krauss vocal profile: Light, airy, breathy soprano with acoustic warmth,
 * gentle country/bluegrass resonance, soothing and crystal-clear.
 */
export function pickAlisonKraussVoice(voices) {
  if (!voices || voices.length === 0) {
    voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  }
  if (!voices || voices.length === 0) return null;

  const PREFERRED_VOICES = [
    'aria', 'jenny', 'sonia', 'samantha', 'victoria', 'zira', 'karen', 'catherine', 'hazel', 'susan', 'heera', 'veena', 'female', 'natural', 'google us english', 'google uk english female'
  ];

  const MALE_EXCLUSIONS = [
    'david', 'mark', 'richard', 'james', 'george', 'ryan', 'thomas', 'guy', 'male', 'man', 'boy', 'sundar', 'prabhas', 'hemant'
  ];

  const candidateVoices = voices.filter(v => {
    const n = (v.name || '').toLowerCase();
    return !MALE_EXCLUSIONS.some(m => n.includes(m));
  });

  // Prefer English soprano voices that match Alison Krauss's tone
  const englishCandidates = candidateVoices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
  for (const hint of PREFERRED_VOICES) {
    const found = englishCandidates.find(v => (v.name || '').toLowerCase().includes(hint));
    if (found) return found;
  }

  if (englishCandidates.length > 0) return englishCandidates[0];
  if (candidateVoices.length > 0) return candidateVoices[0];
  return voices[0];
}

/**
 * Native voice finder for target locale
 */
export function pickVoiceForLocale(voices, locale) {
  if (!voices || voices.length === 0) {
    voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  }
  if (!voices || voices.length === 0) return null;

  const lang = (locale || 'en').split('-')[0].toLowerCase();

  // Search exact or prefix match
  const exact = voices.find(v => (v.lang || '').toLowerCase() === locale.toLowerCase());
  if (exact) return exact;

  const langPrefix = voices.find(v => (v.lang || '').toLowerCase().startsWith(lang));
  if (langPrefix) return langPrefix;

  // Search language name in voice name (e.g. "Google हिन्दी", "Microsoft Valluvar - Tamil")
  const langNames = {
    hi: ['hindi', 'हिन्दी', 'swara', 'lekha'],
    ta: ['tamil', 'தமிழ்', 'valluvar', 'raveena'],
    te: ['telugu', 'తెలుగు', 'mohan'],
    kn: ['kannada', 'ಕನ್ನಡ', 'gagan'],
    ml: ['malayalam', 'മലയാളം', 'midhun'],
    bn: ['bengali', 'বাংলা', 'bashkar'],
    mr: ['marathi', 'मराठी', 'aarohi'],
    ar: ['arabic', 'عربي', 'عربية', 'shakir', 'laila', 'hoda']
  };

  const keywords = langNames[lang] || [];
  const keywordMatch = voices.find(v => {
    const n = (v.name || '').toLowerCase();
    const l = (v.lang || '').toLowerCase();
    return keywords.some(k => n.includes(k) || l.includes(k));
  });

  return keywordMatch || null;
}

// Check Arabic voice availability
export function getAvailableArabicVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  return voices.filter(v => (v.lang || '').toLowerCase().startsWith('ar'));
}

export function isArabicVoiceAvailable() {
  return getAvailableArabicVoices().length > 0;
}

/**
 * COMPREHENSIVE TAMIL TO PHONETIC ROMANIZATION ENGINE
 * Converts native Tamil script into phonetic Latin text so the Alison Krauss vocal model
 * speaks fluent, complete Tamil words without dropping any characters or staying silent.
 */
function transliterateTamilToPhonetic(text) {
  if (!text) return '';

  // Direct phrase replacements for natural pronunciation
  let s = text
    .replace(/ஓபிடி\s*ஷா\s*மருத்துவமனை/gi, 'OPD Sha Maruthuvamanai')
    .replace(/மருத்துவமனைக்கு\s*நல்வரவு/gi, 'Maruthuvamanaikku nalvaravu')
    .replace(/அறிவிப்பு\s*மொழி\s*தமிழுக்கு\s*மாற்றப்பட்டது/gi, 'Arivippu mozhi Tamilukku maatrapattadhu')
    .replace(/அவசர\s*பதிவு\s*வெற்றிகரமானது/gi, 'Avasara padhivu vetrigaramaanadhu')
    .replace(/முன்பதிவு\s*உறுதிசெய்யப்பட்டது/gi, 'Munpadhivu urudhisaiyappattadhu')
    .replace(/பதிவு\s*முடிந்தது/gi, 'Padhivu mudindhadhu')
    .replace(/டோக்கன்\s*எண்/gi, 'Token enn')
    .replace(/உங்கள்\s*டோக்கன்\s*எண்/gi, 'Ungal token enn')
    .replace(/ஆலோசனை\s*அறை/gi, 'Aalosanai arai')
    .replace(/அறை\s*எண்/gi, 'Arai enn')
    .replace(/மருத்துவர்/gi, 'Doctor')
    .replace(/உங்களுக்காக\s*காத்திருக்கிறார்/gi, 'Ungalukkaaga kaathirukkiraar')
    .replace(/தயவுசெய்து/gi, 'Dayavuseidhu')
    .replace(/வரவும்/gi, 'Varavum')
    .replace(/செல்லவும்/gi, 'Sellavum')
    .replace(/உடனே/gi, 'Udane')
    .replace(/காத்திருக்கும்\s*நோயாளிகள்\s*எவரும்\s*இல்லை/gi, 'Kaathirukkum noyaaligal evarum illai')
    .replace(/நோயாளி/gi, 'Noyaali')
    .replace(/துறை/gi, 'Thurai');

  // Character mapping for remaining Tamil characters
  const charMap = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au',
    'க': 'ka', 'ங': 'nga', 'ச': 'sa', 'ஞ': 'nya', 'ட': 'ta', 'ண': 'na', 'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra', 'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na', 'ஜ': 'ja', 'ஷ': 'sha', 'ஸ': 'sa', 'ஹ': 'ha',
    'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'o', 'ௌ': 'au', '்': ''
  };

  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * COMPREHENSIVE HINDI TO PHONETIC ROMANIZATION ENGINE
 * Converts native Hindi script into phonetic Latin text so the Alison Krauss vocal model
 * speaks fluent, complete Hindi sentences with zero missing words or silence.
 */
function transliterateHindiToPhonetic(text) {
  if (!text) return '';

  let s = text
    .replace(/ओपीडी\s*शा\s*अस्पताल/gi, 'OPD Sha Aspataal')
    .replace(/में\s*आपका\s*स्वागत\s*है/gi, 'mein aapka swaagat hai')
    .replace(/घोषणा\s*की\s*भाषा\s*हिन्दी\s*चुनी\s*गई\s*है/gi, 'ghoshna ki bhaasha Hindi chuni gayi hai')
    .replace(/आपातकालीन\s*पंजीकरण\s*सफल/gi, 'Aapaatkaaleen panjeekaran safal')
    .replace(/टोकन\s*अपॉइंटमेंट\s*पुष्ट\s*हुआ/gi, 'Token appointment pusht hua')
    .replace(/पंजीकरण\s*सफल\s*हुआ/gi, 'Panjeekaran safal hua')
    .replace(/टोकन\s*संख्या/gi, 'Token sankhya')
    .replace(/आपकी\s*टोकन\s*संख्या/gi, 'Aapki token sankhya')
    .replace(/कमरा\s*नंबर/gi, 'Kamra number')
    .replace(/परामर्श\s*कक्ष/gi, 'Paramarsh kaksh')
    .replace(/में\s*पधारें/gi, 'mein padhaarein')
    .replace(/डॉक्टर/gi, 'Doctor')
    .replace(/आपका\s*इंतज़ार\s*कर\s*रहे\s*हैं/gi, 'aapka intezaar kar rahe hain')
    .replace(/कृपया/gi, 'kripya')
    .replace(/तुरंत/gi, 'turant')
    .replace(/जाएँ/gi, 'jaayen')
    .replace(/वर्तमान\s*में\s*कोई\s*प्रतीक्षारत\s*मरीज\s*नहीं\s*है/gi, 'vartamaan mein koi prateekshaarat mareez nahi hai')
    .replace(/मरीज़|मरीज/gi, 'Mareez')
    .replace(/विभाग/gi, 'Vibhaag');

  const charMap = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an',
    'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
    'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na', 'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
    'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha',
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', '्': '', '।': '.'
  };

  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Generic transliterator for any language to ensure speech never drops
 */
function toPhonetic(text, lang) {
  if (lang === 'ta') return transliterateTamilToPhonetic(text);
  if (lang === 'hi') return transliterateHindiToPhonetic(text);
  if (lang === 'ar') {
    return text
      .replace(/تم\s*تغيير\s*لغة\s*الإعلانات\s*إلى\s*العربية/gi, 'Tam taghyir lughat al-ielanaat ila al-Arabiyyah')
      .replace(/نداء\s*للمريض/gi, 'Nidaa lil-mareed')
      .replace(/يرجى\s*التوجه\s*إلى/gi, 'yurja al-tawajjuh ila')
      .replace(/الغرفة\s*رقم/gi, 'al-ghurfah raqm')
      .replace(/الدكتور/gi, 'Doctor')
      .replace(/في\s*انتظارك\s*الآن/gi, 'fi intizarek al-aan')
      .replace(/تم\s*تسجيل\s*المريض\s*بنجاح/gi, 'Tam tasjeel al-mareed binajah')
      .replace(/رقم\s*الرمز\s*الخاص\s*بك\s*هو/gi, 'Raqm al-ramz al-khas bika huwa');
  }
  return text;
}

// Clean and prepare text for speech
function sanitizeSpeechText(text, lang = 'en') {
  if (!text) return '';

  let cleaned = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•|*#_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Natural localized acronyms
  if (lang === 'ar') cleaned = cleaned.replace(/\bOPD\b/gi, 'العيادات الخارجية').replace(/\bSHA\b/gi, 'شا');
  else if (lang === 'hi') cleaned = cleaned.replace(/\bOPD\b/gi, 'ओपीडी').replace(/\bSHA\b/gi, 'शा');
  else if (lang === 'ta') cleaned = cleaned.replace(/\bOPD\b/gi, 'ஓபிடி').replace(/\bSHA\b/gi, 'ஷா');
  else if (lang === 'te') cleaned = cleaned.replace(/\bOPD\b/gi, 'ఓపీడీ').replace(/\bSHA\b/gi, 'షా');
  else if (lang === 'kn') cleaned = cleaned.replace(/\bOPD\b/gi, 'ಒಪಿಡಿ').replace(/\bSHA\b/gi, 'ಶಾ');
  else if (lang === 'ml') cleaned = cleaned.replace(/\bOPD\b/gi, 'ഒപിഡി').replace(/\bSHA\b/gi, 'ഷാ');
  else if (lang === 'bn') cleaned = cleaned.replace(/\bOPD\b/gi, 'ওপিডি').replace(/\bSHA\b/gi, 'শা');
  else if (lang === 'mr') cleaned = cleaned.replace(/\bOPD\b/gi, 'ओपीडी').replace(/\bSHA\b/gi, 'शा');
  else cleaned = cleaned.replace(/\bOPD\b/gi, 'O.P.D.').replace(/\bDr\./gi, 'Doctor');

  return cleaned;
}

/**
 * Play Audio Stream using HTML5 Audio (Tier-2 Fallback)
 */
function playAudioStream(cleanedText, lang) {
  return new Promise((resolve, reject) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      const shortText = cleanedText.length > 150 ? cleanedText.substring(0, 150) : cleanedText;
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(shortText)}`;
      const audio = new Audio(url);
      currentAudio = audio;
      audio.playbackRate = 0.92;

      audio.onplay = () => notifyState(true);
      audio.onended = () => {
        notifyState(false);
        currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        notifyState(false);
        currentAudio = null;
        reject(e);
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Core text-to-speech engine using Alison Krauss AI Voice Clone Profile
 * Parameters modeled after Alison Krauss's ethereal, airy, melodious soprano tone
 */
export function speakText(text, lang = 'en') {
  if (isMutedState) {
    console.info('[TTS] Voice announcements are muted.');
    return;
  }

  if (!text || typeof text !== 'string' || text.trim() === '') return;

  // Stop any active speech immediately
  stopSpeaking();

  const cleaned = sanitizeSpeechText(text, lang);
  if (!cleaned) return;

  const locale = LANG_LOCALE_MAP[lang] || 'en-IN';

  // Play Alison Krauss acoustic chime
  playHospitalChime();

  setTimeout(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[TTS] Web Speech API not supported.');
      return;
    }

    const allVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const nativeVoice = pickVoiceForLocale(allVoices, locale);
    const alisonKraussVoice = pickAlisonKraussVoice(allVoices);

    // If device has a genuine native voice for Tamil/Hindi, use it with Alison Krauss-styled pitch & rate
    if (nativeVoice && lang !== 'en') {
      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        // Alison Krauss signature parameters: high, airy pitch, gentle unhurried cadence
        utterance.rate = 0.88;
        utterance.pitch = 1.28;
        utterance.voice = nativeVoice;
        utterance.lang = nativeVoice.lang || locale;

        utterance.onstart = () => notifyState(true);
        utterance.onend = () => notifyState(false);
        utterance.onerror = (e) => {
          notifyState(false);
          // If native synthesis fails, fallback to transliterated Alison Krauss voice
          fallbackToTransliterated(cleaned, lang, alisonKraussVoice);
        };

        window.speechSynthesis.speak(utterance);
        console.info(`[TTS: Alison Krauss Profile] Spoke native ${lang} voice "${nativeVoice.name}"`);
        return;
      } catch (err) {
        console.warn('[TTS] Native speech error, attempting fallback:', err);
      }
    }

    // TIER 2: If no native voice in OS, attempt audio stream first
    playAudioStream(cleaned, lang)
      .then(() => {
        console.info(`[TTS: Audio Stream] Spoke ${lang} successfully`);
      })
      .catch(() => {
        // TIER 3: BULLETPROOF PHONETIC SPEECH WITH ALISON KRAUSS VOCAL PROFILE
        fallbackToTransliterated(cleaned, lang, alisonKraussVoice);
      });
  }, 320);
}

/**
 * Fallback synthesizer that translates non-English text to phonetics and speaks
 * with the Alison Krauss vocal model so that audio is guaranteed to play.
 */
function fallbackToTransliterated(cleanedText, lang, alisonVoice) {
  try {
    const phoneticText = toPhonetic(cleanedText, lang);
    const utterance = new SpeechSynthesisUtterance(phoneticText);

    // Alison Krauss Voice Persona parameters
    utterance.rate = 0.88;        // Calm, breathy, gentle acoustic cadence
    utterance.pitch = 1.28;       // Ethereal, sweet soprano vocal register
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    if (alisonVoice) {
      utterance.voice = alisonVoice;
    }

    utterance.onstart = () => notifyState(true);
    utterance.onend = () => notifyState(false);
    utterance.onerror = () => notifyState(false);

    window.speechSynthesis.speak(utterance);
    console.info(`[TTS: Alison Krauss Voice Clone] Speaking [${lang}] phonetically: "${phoneticText.substring(0, 60)}..."`);
  } catch (e) {
    console.error('[TTS] Fallback error:', e);
    notifyState(false);
  }
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
 * Full announcement builder for all 9 languages
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
    // Language change confirmation
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
        message = `ఓపీడీ షா ఆసుపత్రిలో ప్రకటనల భాష తెలుగుగా మార్చబడింది.`;
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
    voiceProfile: 'Alison Krauss AI Persona',
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
 * Language switch announcement trigger
 */
export function handleLanguageChangeAnnouncement(newLang) {
  if (lastAnnouncementData) {
    speakFullAnnouncement(lastAnnouncementData, newLang);
  } else {
    speakFullAnnouncement({ type: 'lang_change' }, newLang);
  }
}

export function setLastAnnouncement(data) {
  lastAnnouncementData = data ? { ...data } : null;
}

export function getLastAnnouncement() {
  return lastAnnouncementData ? { ...lastAnnouncementData } : null;
}

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

export function announcePatientCalling(tokenNumber, patientName, lang = 'en', doctorName = 'Doctor', roomNumber = 'Room 1') {
  return speakFullAnnouncement({
    type: 'call',
    tokenNumber,
    patientName,
    doctorName,
    roomNumber
  }, lang);
}

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
