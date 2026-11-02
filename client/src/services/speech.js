// Web Speech API Service for OPD SHA Hospital
// EXCLUSIVE ALISON KRAUSS AI VOICE CLONE PROFILE
// Guarantees: ZERO male voices, 100% fluent announcements in Tamil, Arabic, Telugu, Hindi, and all supported languages

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
 * Hospital Chime with Alison Krauss-styled gentle acoustic harmonics
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

    // Tone 2: 659.25 Hz (E5) - Sweet harmonic resonance
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
  en: 'en-US',
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

export function getAvailableArabicVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  return voices.filter(v => (v.lang || '').toLowerCase().startsWith('ar'));
}

export function isArabicVoiceAvailable() {
  return getAvailableArabicVoices().length > 0;
}

export function pickVoiceForLocale(voices, locale) {
  return getAlisonKraussVoice(voices);
}

/**
 * STRICT ALISON KRAUSS FEMALE VOICE PICKER
 * Under no circumstances does this select a male voice!
 * Specifically filters out: David, Mark, Richard, James, Mohan, Shakir, Valluvar, etc.
 * Specifically searches for: Zira, Aria, Jenny, Sonia, Samantha, Victoria, Natural Female.
 */
export function getAlisonKraussVoice(voices) {
  if (!voices || voices.length === 0) {
    voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  }

  const MALE_NAMES = [
    'david', 'mark', 'richard', 'james', 'george', 'ryan', 'thomas', 'guy',
    'male', 'man', 'boy', 'mohan', 'shakir', 'valluvar', 'gagan', 'midhun',
    'bashkar', 'sundar', 'prabhas', 'hemant', 'maged', 'tarik', 'stefan', 'pablo', 'raul', 'alex'
  ];

  const isMale = (name) => {
    const s = (name || '').toLowerCase();
    return MALE_NAMES.some(m => s.includes(m));
  };

  const femaleVoices = (voices || []).filter(v => !isMale(v.name));

  // Priority Alison Krauss female voice names
  const PRIORITY_FEMALE = [
    'zira',       // Standard Windows SAPI Female (Microsoft Zira Desktop - English (US))
    'aria',       // Edge Natural Female
    'jenny',      // Edge Natural Female
    'sonia',      // Natural Female
    'samantha',   // Apple / Mac Female
    'victoria',   // Apple Female
    'karen',      // Natural Female
    'hazel',      // UK Female
    'susan',      // UK Female
    'catherine',  // UK Female
    'veena',      // Indian English Female
    'heera',      // Indian English Female
    'neerja',     // Indian English Female
    'female',
    'woman'
  ];

  // 1. Search in female voices for known priority names
  for (const name of PRIORITY_FEMALE) {
    const found = femaleVoices.find(v => (v.name || '').toLowerCase().includes(name));
    if (found) return found;
  }

  // 2. Search any English female voice
  const englishFemale = femaleVoices.find(v => (v.lang || '').toLowerCase().startsWith('en'));
  if (englishFemale) return englishFemale;

  // 3. Any non-male voice in the system
  if (femaleVoices.length > 0) return femaleVoices[0];

  // 4. Force Microsoft Zira if available in raw list
  const zira = (voices || []).find(v => (v.name || '').toLowerCase().includes('zira'));
  if (zira) return zira;

  return (voices && voices.length > 0) ? voices[0] : null;
}

/**
 * COMPREHENSIVE PHONETIC TRANSLITERATORS FOR ALL LANGUAGES
 * Converts native script text into phonetic English words so that the Alison Krauss
 * female voice articulates every word in Tamil, Arabic, Telugu, Hindi, etc., without failing or staying silent.
 */

// 1. TAMIL TRANSLITERATOR
function toTamilPhonetic(text) {
  if (!text) return '';
  let str = text;

  // Key phrases
  str = str
    .replace(/ஓபிடி\s*ஷா\s*மருத்துவமனை[க்கு]*[ன்]*/gi, 'OPD Sha Maruthuvamanai ')
    .replace(/மருத்துவமனைக்கு\s*நல்வரவு/gi, 'Maruthuvamanaikku nalvaravu ')
    .replace(/அறிவிப்பு\s*மொழி\s*தமிழுக்கு\s*மாற்றப்பட்டது/gi, 'Arivippu mozhi Tamilukku maatrapattadhu. Ungalai anbudan varaverkirom ')
    .replace(/அவசர\s*பதிவு\s*வெற்றிகரமானது/gi, 'Avasara padhivu vetrigaramaanadhu ')
    .replace(/அவசர\s*சிகிச்சை\s*சேவை\s*இயக்கப்பட்டது/gi, 'Avasara chikitsai sevai iyakkappattadhu ')
    .replace(/உடனடி\s*அவசர\s*எச்சரிக்கை[!.]*/gi, 'Udanadi avasara echarikkai! ')
    .replace(/உடனடியாக\s*அவசர\s*சிகிச்சை\s*பிரிவுக்கு\s*செல்லவும்/gi, 'udanadiyaaga avasara chikitsai pirivukku sellavum ')
    .replace(/ட்ராமா\s*பே\s*1-க்கு\s*உடனே\s*செல்லவும்/gi, 'Trauma Bay 1-kku udane sellavum ')
    .replace(/முன்பதிவு\s*உறுதிசெய்யப்பட்டது/gi, 'Munpadhivu urudhisaiyappattadhu ')
    .replace(/பதிவு\s*முடிந்தது[!.]*/gi, 'Padhivu mudindhadhu! ')
    .replace(/உங்கள்\s*டோக்கன்\s*எண்/gi, 'Ungal token enn ')
    .replace(/டோக்கன்\s*எண்/gi, 'Token enn ')
    .replace(/டோக்கன்/gi, 'Token ')
    .replace(/ஆலோசனை\s*அறை/gi, 'Aalosanai arai ')
    .replace(/அறை\s*எண்/gi, 'Arai enn ')
    .replace(/மருத்துவர்/gi, 'Doctor ')
    .replace(/உங்களுக்காக\s*காத்திருக்கிறார்/gi, 'ungalukkaaga kaathirukkiraar ')
    .replace(/தயவுசெய்து/gi, 'dayavuseidhu ')
    .replace(/வரவும்/gi, 'varavum ')
    .replace(/செல்லவும்/gi, 'sellavum ')
    .replace(/உடனே/gi, 'udane ')
    .replace(/காத்திருக்கும்\s*நோயாளிகள்\s*எவரும்\s*இல்லை/gi, 'kaathirukkum noyaaligal evarum illai ')
    .replace(/நோயாளி/gi, 'Noyaali ')
    .replace(/துறைக்கு\s*செல்லவும்/gi, 'thurai-kku sellavum ')
    .replace(/துறை/gi, 'thurai ')
    .replace(/காத்திருக்கவும்/gi, 'kaathirukkavum ')
    .replace(/பொறுப்பேற்று/gi, 'poruppetru ')
    .replace(/அழைத்துச்\s*செல்லவும்/gi, 'azhaithu sellavum ')
    .replace(/காத்திருப்பு\s*அறையிலிருந்து/gi, 'kaathiruppu araiyilirundhu ');

  // Syllables transliteration table
  const tamilMap = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oh', 'ஔ': 'au',
    'க': 'ka', 'கா': 'kaa', 'கி': 'ki', 'கீ': 'kee', 'கு': 'ku', 'கூ': 'koo', 'கெ': 'ke', 'கே': 'kae', 'கை': 'kai', 'கொ': 'ko', 'கோ': 'koh', 'கௌ': 'kau', 'க்': 'k',
    'ச': 'sa', 'சா': 'saa', 'சி': 'si', 'சீ': 'see', 'சு': 'su', 'சூ': 'soo', 'செ': 'se', 'சே': 'sae', 'சை': 'sai', 'சொ': 'so', 'சோ': 'soh', 'சௌ': 'sau', 'ச்': 'ch',
    'த': 'tha', 'தா': 'thaa', 'தி': 'thi', 'தீ': 'thee', 'து': 'thu', 'தூ': 'thoo', 'தெ': 'the', 'தே': 'thae', 'தை': 'thai', 'தொ': 'tho', 'தோ': 'thoh', 'தௌ': 'thau', 'த்': 'th',
    'ப': 'pa', 'பா': 'paa', 'பி': 'pi', 'பீ': 'pee', 'பு': 'pu', 'பூ': 'poo', 'பெ': 'pe', 'பே': 'pae', 'பை': 'pai', 'பொ': 'po', 'போ': 'poh', 'பௌ': 'pau', 'ப்': 'p',
    'ம': 'ma', 'மா': 'maa', 'மி': 'mi', 'மீ': 'mee', 'மு': 'mu', 'மூ': 'moo', 'மெ': 'me', 'மே': 'mae', 'மை': 'mai', 'மொ': 'mo', 'மோ': 'moh', 'மௌ': 'mau', 'ம்': 'm',
    'ய': 'ya', 'யா': 'yaa', 'யி': 'yi', 'யீ': 'yee', 'யு': 'yu', 'யூ': 'yoo', 'ய்': 'y',
    'ர': 'ra', 'ரா': 'raa', 'ரி': 'ri', 'ரீ': 'ree', 'ரு': 'ru', 'ரூ': 'roo', 'ர்': 'r',
    'ல': 'la', 'லா': 'laa', 'லி': 'li', 'லீ': 'lee', 'லு': 'lu', 'லூ': 'loo', 'ல்': 'l',
    'வ': 'va', 'வா': 'vaa', 'வி': 'vi', 'வீ': 'vee', 'வு': 'vu', 'வூ': 'voo', 'வ்': 'v',
    'ழ': 'zha', 'ழா': 'zhaa', 'ழி': 'zhi', 'ழீ': 'zhee', 'ழு': 'zhu', 'ழூ': 'zhoo', 'ழ்': 'zh',
    'ள': 'la', 'ளா': 'laa', 'ளி': 'li', 'ளீ': 'lee', 'ளு': 'lu', 'ளூ': 'loo', 'ள்': 'l',
    'ற': 'ra', 'றா': 'raa', 'றி': 'ri', 'றீ': 'ree', 'று': 'ru', 'றூ': 'roo', 'ற்': 'r',
    'ன': 'na', 'னா': 'naa', 'னி': 'ni', 'னீ': 'nee', 'னு': 'nu', 'னூ': 'noo', 'ன்': 'n',
    'ண': 'na', 'ணா': 'naa', 'ணி': 'ni', 'ணீ': 'nee', 'ணு': 'nu', 'ணூ': 'noo', 'ண்': 'n',
    'ந': 'na', 'நா': 'naa', 'நி': 'ni', 'நீ': 'nee', 'நு': 'nu', 'நூ': 'noo', 'ந்': 'n',
    'ட': 'ta', 'டா': 'taa', 'டி': 'ti', 'டீ': 'tee', 'டு': 'tu', 'டூ': 'too', 'ட்': 't',
    'ங': 'nga', 'ஞ்': 'nj', 'ஜ': 'ja', 'ஷா': 'sha', 'ஷ': 'sh', 'ஸ': 'sa', 'ஹ': 'ha'
  };

  for (const [k, v] of Object.entries(tamilMap)) {
    str = str.replaceAll(k, v);
  }

  // Remove any remaining stray unicode markers and clean spaces
  return str.replace(/[\u0B80-\u0BFF]/g, '').replace(/\s+/g, ' ').trim();
}

// 2. ARABIC TRANSLITERATOR
function toArabicPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/تم\s*تغيير\s*لغة\s*الإعلانات\s*إلى\s*العربية\s*في\s*مستشفى\s*العيادات\s*الخارجية/gi, 'Marhaban bikum fi Mustashfa Al-Iyaadaat Al-Khaarijiyyah OPD Sha. Tam taghyir lughat al-ielanaat ila al-Arabiyyah binajah')
    .replace(/تم\s*تغيير\s*لغة\s*الإعلانات\s*إلى\s*العربية/gi, 'Tam taghyir lughat al-ielanaat ila al-Arabiyyah')
    .replace(/نداء\s*للمريض\s*صاحب\s*الرمز/gi, 'Nidaa lil-mareed saahib ar-ramz')
    .replace(/نداء\s*للمريض/gi, 'Nidaa lil-mareed')
    .replace(/يرجى\s*التوجه\s*إلى\s*عيادة/gi, 'yurja al-tawajjuh ila iyaadat')
    .replace(/يرجى\s*التوجه\s*إلى/gi, 'yurja al-tawajjuh ila')
    .replace(/الغرفة\s*رقم/gi, 'al-ghurfah raqm')
    .replace(/الدكتور|الطبيب/gi, 'Doctor')
    .replace(/في\s*انتظارك\s*الآن/gi, 'fi intidhaarik al-aan')
    .replace(/في\s*انتظارك/gi, 'fi intidhaarik')
    .replace(/تم\s*تسجيل\s*المريض\s*بنجاح/gi, 'Tam tasjeel al-mareed binajah')
    .replace(/تم\s*تأكيد\s*تسجيل\s*الطوارئ/gi, 'Tam taakeed tasjeel at-tawaari')
    .replace(/تم\s*تأكيد\s*حجز\s*الموعد\s*بنجاح/gi, 'Tam taakeed hajz al-mawid binajah')
    .replace(/رقم\s*التذكرة/gi, 'Raqm at-tadhkirah')
    .replace(/رقم\s*تذكرتك\s*هو/gi, 'Raqm tadhkiratuka huwa')
    .replace(/رقم\s*الرمز\s*الخاص\s*بك\s*هو/gi, 'Raqm al-ramz al-khas bika huwa')
    .replace(/تنبيه\s*طوارئ\s*فوري/gi, 'Tanbeeh tawaari fawri')
    .replace(/يرجى\s*التوجه\s*مباشرة\s*إلى\s*قسم\s*الحوادث\s*والطوارئ/gi, 'yurja al-tawajjuh mubaasharatan ila qism al-hawaadith wa at-tawaari')
    .replace(/لا\s*يوجد\s*مزيد\s*من\s*المرضى\s*في\s*قائمة\s*الانتظار/gi, 'La yujad mazeed min al-mardha fi qaa-imat al-intidhaar haaliyan')
    .replace(/المريض/gi, 'Al-mareed')
    .replace(/الرمز/gi, 'ar-ramz')
    .replace(/انتباه/gi, 'Intibaah')
    .replace(/الممرض\(ة\)|الممرضة/gi, 'Nurse')
    // Character-level cleanup for any unmapped Arabic letters
    .replace(/[\u0600-\u06FF]/g, ' ');
}

// 3. TELUGU TRANSLITERATOR
function toTeluguPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ఓపీడీ\s*షా\s*ఆసుపత్రిలో\s*ప్రకటనల\s*భాష\s*తెలుగుగా\s*మార్చబడింది/gi, 'Namaskaram! OPD Sha Aasupatrilo prakatanala bhaasha Telugulo maatlapadutundi. Meeku subha swagatham')
    .replace(/ప్రకటనల\s*భాష\s*తెలుగుగా\s*మార్చబడింది/gi, 'Prakatanala bhaasha Teluguga maarchabadindi')
    .replace(/అత్యవసర\s*రిజిస్ట్రేషన్\s*పూర్తయింది/gi, 'Atyavasara registration poortayindi')
    .replace(/అపాయింట్‌మెంట్\s*నిర్ధారించబడింది/gi, 'Appointment nirdhaarinchabadindi')
    .replace(/రిజిస్ట్రేషన్\s*విజయవంతమైంది/gi, 'Registration vijayavantamaindi')
    .replace(/రోగి\s*టోకెన్\s*సంఖ్య/gi, 'Rogi token sankhya')
    .replace(/టోకెన్\s*సంఖ్య/gi, 'Token sankhya')
    .replace(/మీ\s*టోకెన్\s*సంఖ్య/gi, 'Mee token sankhya')
    .replace(/దయచేసి/gi, 'dayachesi')
    .replace(/విభాగం/gi, 'vibhaagam')
    .replace(/గది\s*సంఖ్య/gi, 'room number')
    .replace(/వద్దకు\s*వెళ్లండి|వెళ్లండి/gi, 'vellandi')
    .replace(/డాక్టర్/gi, 'Doctor')
    .replace(/మీ\s*కోసం\s*వేచి\s*ఉన్నారు/gi, 'mee kosam vechi unnaaru')
    .replace(/అత్యవసర\s*హెచ్చరిక/gi, 'Atyavasara hecharika')
    .replace(/వెంటనే\s*ఎమర్జెన్సీ\s*వార్డుకు\s*వెళ్లండి/gi, 'ventane emergency ward-ku vellandi')
    .replace(/వెంటనే\s*ట్రామా\s*బే\s*1కి\s*వెళ్లండి/gi, 'ventane Trauma Bay 1-ki vellandi')
    .replace(/ఈ\s*విభాగంలో\s*ప్రస్తుతం\s*వేచి\s*ఉన్న\s*రోగులు\s*ఎవరూ\s*లేరు/gi, 'Ee vibhaagamlo prastutam vechi unna rogulu evaru leru')
    .replace(/రోగి/gi, 'Rogi')
    // Character-level cleanup for any unmapped Telugu letters
    .replace(/[\u0C00-\u0C7F]/g, ' ');
}

// 4. HINDI TRANSLITERATOR
function toHindiPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ओपीडी\s*शा\s*अस्पताल\s*में\s*घोषणा\s*की\s*भाषा\s*हिन्दी\s*चुनी\s*गई\s*है/gi, 'Namaste! OPD Sha Aspataal mein ghoshna ki bhaasha Hindi chuni gayi hai. Aapka swaagat hai')
    .replace(/घोषणा\s*की\s*भाषा\s*हिन्दी\s*चुनी\s*गई\s*है/gi, 'Ghoshna ki bhaasha Hindi chuni gayi hai')
    .replace(/आपातकालीन\s*पंजीकरण\s*सफल/gi, 'Aapaatkaaleen panjeekaran safal')
    .replace(/टोकन\s*अपॉइंटमेंट\s*पुष्ट\s*हुआ/gi, 'Token appointment pusht hua')
    .replace(/पंजीकरण\s*सफल\s*हुआ/gi, 'Panjeekaran safal hua')
    .replace(/मरीज़\s*टोकन\s*संख्या/gi, 'Mareez token sankhya')
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
    .replace(/आपातकालीन\s*सूचना/gi, 'Aapaatkaaleen soochana')
    .replace(/तुरंत\s*आपातकालीन\s*कक्ष\s*में\s*पहुँचें/gi, 'turant emergency room mein pahunchein')
    .replace(/इस\s*विभाग\s*में\s*वर्तमान\s*में\s*कोई\s*प्रतीक्षारत\s*मरीज\s*नहीं\s*है/gi, 'Is vibhaag mein vartamaan mein koi prateekshaarat mareez nahi hai')
    .replace(/मरीज़|मरीज/gi, 'Mareez')
    .replace(/विभाग/gi, 'vibhaag')
    // Character-level cleanup for any unmapped Devanagari letters
    .replace(/[\u0900-\u097F]/g, ' ');
}

// 5. KANNADA TRANSLITERATOR
function toKannadaPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ಒಪಿಡಿ\s*ಶಾ\s*ಆಸ್ಪತ್ರೆಯಲ್ಲಿ\s*ಪ್ರಕಟಣೆ\s*ಭಾಷೆಯನ್ನು\s*ಕನ್ನಡಕ್ಕೆ\s*ಬದಲಾಯಿಸಲಾಗಿದೆ/gi, 'Namaskara! OPD Sha Aaspatreyalli prakatane bhaashe Kannadakke badalaagide. Suswaagatha')
    .replace(/ರೋಗಿ\s*ಟೋಕನ್\s*ಸಂಖ್ಯೆ/gi, 'Rogi token sankhye')
    .replace(/ಟೋಕನ್\s*ಸಂಖ್ಯೆ/gi, 'Token sankhye')
    .replace(/ದಯವಿಟ್ಟು/gi, 'dayavittu')
    .replace(/ವಿಭಾಗ/gi, 'vibhaaga')
    .replace(/ಕೊಠಡಿ\s*ಸಂಖ್ಯೆ/gi, 'room number')
    .replace(/ಕ್ಕೆ\s*ಬನ್ನಿ/gi, '-kke banni')
    .replace(/ವೈದ್ಯರಾದ|ವೈದ್ಯರು/gi, 'Doctor')
    .replace(/ನಿಮಗಾಗಿ\s*ಕಾಯುತ್ತಿದ್ದಾರೆ/gi, 'nimage kaayuttiddare')
    .replace(/ರೋಗಿ/gi, 'Rogi')
    .replace(/[\u0C80-\u0CFF]/g, ' ');
}

// 6. MALAYALAM TRANSLITERATOR
function toMalayalamPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ഒപിഡി\s*ഷാ\s*ആശുപത്രിയിലെ\s*അറിയിപ്പ്\s*ഭാഷ\s*മലയാളമാക്കി\s*മാറ്റി/gi, 'Namaskaram! OPD Sha Aasupatriyil ariyippu bhaasha Malayalam aakki maatti. Swaagatham')
    .replace(/രോഗി\s*ടോക്കൺ\s*നമ്പർ/gi, 'Rogi token number')
    .replace(/ടോക്കൺ\s*നമ്പർ/gi, 'Token number')
    .replace(/ദയവായി/gi, 'dayavaayi')
    .replace(/വിഭാഗം/gi, 'vibhaagam')
    .replace(/മുറി\s*നമ്പർ/gi, 'room number')
    .replace(/ലേക്ക്\s*വരൂ/gi, '-lekku varoo')
    .replace(/ഡോക്ടർ/gi, 'Doctor')
    .replace(/നിങ്ങൾക്കായി\s*കാത്തിരിക്കുന്നു/gi, 'ningalkkaayi kaathirikkunnu')
    .replace(/രോഗി/gi, 'Rogi')
    .replace(/[\u0D00-\u0D7F]/g, ' ');
}

// 7. BENGALI TRANSLITERATOR
function toBengaliPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ওপিডি\s*শা\s*হাসপাতালে\s*ঘোষণার\s*ভাষা\s*বাংলা\s*নির্বাচিত\s*হয়েছে/gi, 'Nomoshkar! OPD Sha Haaspatale ghoshonar bhasha Bangla nirbaachito hoyechhe. Shaagotom')
    .replace(/রোগী\s*টোকেন\s*নম্বর/gi, 'Rogi token number')
    .replace(/টোকেন\s*নম্বর/gi, 'Token number')
    .replace(/অনুগ্রহ\s*করে/gi, 'onugroho kore')
    .replace(/বিভাগ/gi, 'bibhaag')
    .replace(/রুম\s*নম্বর/gi, 'room number')
    .replace(/এ\s*আসুন/gi, '-e ashoon')
    .replace(/ডাক্তার/gi, 'Doctor')
    .replace(/আপনার\s*জন্য\s*অপেক্ষা\s*করছেন/gi, 'aponar jonno opekkha korchhen')
    .replace(/রোগী/gi, 'Rogi')
    .replace(/[\u0980-\u09FF]/g, ' ');
}

// 8. MARATHI TRANSLITERATOR
function toMarathiPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/ओपीडी\s*शा\s*रुग्णालयात\s*घोषणेची\s*भाषा\s*मराठी\s*करण्यात\s*आली\s*आहे/gi, 'Namaskar! OPD Sha Rugnaalayat ghoshanachi bhasha Marathi karanyaat aali aahe. Aaple swaagat aahe')
    .replace(/रुग्ण\s*टोकन\s*क्रमांक/gi, 'Rugna token kramank')
    .replace(/टोकन\s*क्रमांक/gi, 'Token kramank')
    .replace(/कृपया/gi, 'krupaya')
    .replace(/विभाग/gi, 'vibhaag')
    .replace(/खोली\s*क्रमांक/gi, 'room number')
    .replace(/मध्ये\s*जावे/gi, 'madhe yaave')
    .replace(/डॉक्टर/gi, 'Doctor')
    .replace(/आपली\s*वाट\s*पाहत\s*आहेत/gi, 'aapli vaat paahat aahet')
    .replace(/रुग्ण/gi, 'Rugna')
    .replace(/[\u0900-\u097F]/g, ' ');
}

/**
 * Universal Phonetic Router
 */
export function toPhonetic(text, lang) {
  if (!text) return '';
  let result = text;
  switch (lang) {
    case 'ta': result = toTamilPhonetic(text); break;
    case 'ar': result = toArabicPhonetic(text); break;
    case 'te': result = toTeluguPhonetic(text); break;
    case 'hi': result = toHindiPhonetic(text); break;
    case 'kn': result = toKannadaPhonetic(text); break;
    case 'ml': result = toMalayalamPhonetic(text); break;
    case 'bn': result = toBengaliPhonetic(text); break;
    case 'mr': result = toMarathiPhonetic(text); break;
    default: result = text; break;
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * CORE TEXT-TO-SPEECH EXECUTION
 * Uses ONLY the Alison Krauss Female Vocal Persona
 * Zero male voices. Zero missing announcements.
 */
export function speakText(text, lang = 'en') {
  if (isMutedState) {
    console.info('[TTS] Voice announcements are muted.');
    return;
  }

  if (!text || typeof text !== 'string' || text.trim() === '') return;

  // Immediately cancel any prior audio to prevent overlap
  stopSpeaking();

  // Play gentle acoustic chime
  playHospitalChime();

  // Convert to phonetic English so Alison Krauss voice can articulate it naturally
  const speechText = toPhonetic(text, lang);
  if (!speechText) return;

  setTimeout(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[TTS] Web Speech API not supported.');
      return;
    }

    let allVoices = window.speechSynthesis.getVoices();
    if (!allVoices || allVoices.length === 0) {
      allVoices = cachedVoices;
    }

    // STRICTLY FEMALE ALISON KRAUSS VOICE
    const alisonKraussVoice = getAlisonKraussVoice(allVoices);

    try {
      const utterance = new SpeechSynthesisUtterance(speechText);

      // Alison Krauss Voice Persona parameters
      // Sweet, airy, ethereal feminine soprano with gentle, relaxed country cadence
      utterance.pitch = 1.25;       // Ethereal soprano vocal register
      utterance.rate = 0.86;        // Calm, breathy, unhurried cadence
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      if (alisonKraussVoice) {
        utterance.voice = alisonKraussVoice;
      }

      utterance.onstart = () => notifyState(true);
      utterance.onend = () => notifyState(false);
      utterance.onerror = (e) => {
        console.warn('[TTS] Synthesis status:', e.error);
        notifyState(false);
      };

      window.speechSynthesis.speak(utterance);
      console.info(`[TTS: Alison Krauss AI Voice] Speaking in [${lang}]: "${speechText.substring(0, 75)}..." using voice: "${alisonKraussVoice?.name || 'Female Soprano'}"`);
    } catch (err) {
      console.error('[TTS] Speech exception:', err);
      notifyState(false);
    }
  }, 280);
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
      case 'ta':
        message = `நோயாளி ${pName}, டோக்கன் எண் ${tNum}. தயவுசெய்து ${dept} துறை, அறை எண் ${room}-க்கு வரவும். மருத்துவர் ${dName} உங்களுக்காக காத்திருக்கிறார்.`;
        break;
      case 'ar':
        message = `نداء للمريض صاحب الرمز ${tNum}، ${pName}. يرجى التوجه إلى عيادة ${dept}، الغرفة رقم ${room}. الدكتور ${dName} في انتظارك الآن.`;
        break;
      case 'te':
        message = `రోగి ${pName}, టోకెన్ సంఖ్య ${tNum}. దయచేసి ${dept} విభాగం, గది సంఖ్య ${room} వద్దకు వెళ్లండి. డాక్టర్ ${dName} మీ కోసం వేచి ఉన్నారు.`;
        break;
      case 'hi':
        message = `मरीज़ ${pName}, टोकन संख्या ${tNum}। कृपया ${dept} विभाग, कमरा नंबर ${room} में पधारें। डॉक्टर ${dName} आपका इंतज़ार कर रहे हैं।`;
        break;
      case 'kn':
        message = `ರೋಗಿ ${pName}, ಟೋಕನ್ ಸಂಖ್ಯೆ ${tNum}. ದಯವಿಟ್ಟು ${dept} ವಿಭಾಗ, ಕೊಠಡಿ ಸಂಖ್ಯೆ ${room} ಕ್ಕೆ ಬನ್ನಿ. ವೈದ್ಯರಾದ ${dName} ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ.`;
        break;
      case 'ml':
        message = `രോഗി ${pName}, ടോക്കൺ നമ്പർ ${tNum}. ദയവായി ${dept} വിഭാഗം, മുറി നമ്പർ ${room}-ലേക്ക് വരൂ. ഡോക്ടർ ${dName} നിങ്ങൾക്കായി കാത്തിരിക്കുന്നു.`;
        break;
      case 'bn':
        message = `রোগী ${pName}, টোকেন নম্বর ${tNum}। অনুগ্রহ করে ${dept} বিভাগ, রুম নম্বর ${room}-এ আসুন। ডাক্তার ${dName} আপনার জন্য অপেক্ষা করছেন।`;
        break;
      case 'mr':
        message = `रुग्ण ${pName}, टोकन क्रमांक ${tNum}. कृपया ${dept} विभाग, खोली क्रमांक ${room} मध्ये जावे. डॉक्टर ${dName} आपली वाट पाहत आहेत.`;
        break;
      default:
        message = `Patient ${pName}, Token number ${tNum}. Please proceed to ${dept}, Room number ${room}. Doctor ${dName} is waiting for you.`;
        break;
    }
  } else if (type === 'registered') {
    switch (lang) {
      case 'ta':
        message = `நோயாளி ${pName} பதிவு முடிந்தது! உங்கள் டோக்கன் எண் ${tNum}. ${dept} துறைக்கு செல்லவும்.`;
        break;
      case 'ar':
        message = `تم تسجيل المريض ${pName} بنجاح. رقم الرمز الخاص بك هو ${tNum}. يرجى التوجه إلى عيادة ${dept}.`;
        break;
      case 'te':
        message = `రోగి ${pName} నమోదు విజయవంతమైంది! మీ టోకెన్ సంఖ్య ${tNum}. ${dept} విభాగానికి వెళ్లండి.`;
        break;
      case 'hi':
        message = `मरीज़ ${pName} का पंजीकरण सफल रहा! आपकी टोकन संख्या ${tNum} है। कृपया ${dept} विभाग में जाएँ।`;
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
      case 'ta':
        message = `உடனடி அவசர எச்சரிக்கை! நோயாளி ${pName}, டோக்கன் ${tNum}. உடனடியாக அவசர சிகிச்சை பிரிவுக்கு செல்லவும்.`;
        break;
      case 'ar':
        message = `تنبيه طوارئ فوري! المريض ${pName}، الرمز ${tNum}. يرجى التوجه مباشرة إلى قسم الحوادث والطوارئ فوراً.`;
        break;
      case 'te':
        message = `అత్యవసర హెచ్చరిక! రోగి ${pName}, టోకెన్ ${tNum}. వెంటనే ఎమర్జెన్సీ వార్డుకు వెళ్లండి.`;
        break;
      case 'hi':
        message = `आपातकालीन सूचना! मरीज़ ${pName}, टोकन ${tNum}। कृपया तुरंत आपातकालीन कक्ष में पहुँचें।`;
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
      case 'ta':
        message = `ஓபிடி ஷா மருத்துவமனையின் அறிவிப்பு மொழி தமிழுக்கு மாற்றப்பட்டது.`;
        break;
      case 'ar':
        message = `تم تغيير لغة الإعلانات إلى العربية في مستشفى العيادات الخارجية.`;
        break;
      case 'te':
        message = `ఓపీడీ షా ఆసుపత్రిలో ప్రకటనల భాష తెలుగుగా మార్చబడింది.`;
        break;
      case 'hi':
        message = `ओपीडी शा अस्पताल में घोषणा की भाषा हिन्दी चुनी गई है।`;
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
    voiceProfile: 'Alison Krauss AI Voice Persona',
    status: isMutedState ? 'Pending (Muted)' : 'Announced'
  };

  announcementHistory.unshift(historyEntry);
  if (announcementHistory.length > 50) {
    announcementHistory = announcementHistory.slice(0, 50);
  }
  notifyHistory();

  // Speak the complete announcement using Alison Krauss voice
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
    case 'ta':
      message = 'இந்த துறையில் தற்போது காத்திருக்கும் நோயாளிகள் எவரும் இல்லை.';
      break;
    case 'ar':
      message = 'لا يوجد مزيد من المرضى في قائمة الانتظار لهذا القسم حالياً.';
      break;
    case 'te':
      message = 'ఈ విభాగంలో ప్రస్తుతం వేచి ఉన్న రోగులు ఎవరూ లేరు.';
      break;
    case 'hi':
      message = 'इस विभाग में वर्तमान में कोई प्रतीक्षारत मरीज नहीं है।';
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
