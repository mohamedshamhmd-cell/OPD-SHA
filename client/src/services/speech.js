// Web Speech API and Audio TTS Service for Multilingual Hospital Announcements
// Supports: English (en), Arabic (ar), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn), Malayalam (ml), Bengali (bn), Marathi (mr)

let isSpeakingState = false;
let onStateChangeListeners = [];
let onVoiceAlertListeners = [];
let onHistoryListeners = [];
let currentAudio = null;

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

// BCP-47 Locale mapping for supported languages including Arabic
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

// Voice name hints for speech synthesis
const FEMALE_VOICE_HINTS = [
  'female', 'woman', 'lady', 'girl',
  // English
  'zira', 'heera', 'hazel', 'susan', 'catherine', 'victoria',
  'samantha', 'karen', 'moira', 'veena', 'fiona', 'tessa',
  'aria', 'jenny', 'sonia', 'libby', 'mia', 'neerja',
  // Arabic
  'laila', 'mariam', 'salma', 'hoda', 'zeina', 'fatima', 'nour',
  'maged', 'tarik', 'naayf', 'arabic', 'عربي', 'عربية',
  // Hindi
  'lekha', 'priya', 'kalpana', 'swara',
  // Tamil
  'raveena', 'tamil', 'தமிழ்', 'nanmalar', 'vani',
  // Telugu
  'telugu', 'తెలుగు', 'chitra', 'keerthi',
  // Kannada
  'kannada', 'ಕನ್ನಡ', 'sapna', 'radha',
  // Malayalam
  'malayalam', 'മലയാളം', 'shobhana', 'anjali',
  // Bengali
  'bengali', 'বাংলা', 'tanisha', 'roshni',
  // Marathi
  'marathi', 'मराठी', 'aarohi', 'manisha',
  // Google TTS default female identifiers
  'google'
];

const MALE_VOICE_EXCLUSIONS = [
  'david', 'mark', 'richard', 'james', 'george', 'ryan', 'thomas', 'guy',
  'hemant', 'sundar', 'prabhas', 'male', 'man', 'boy'
];

/**
 * Detect available Arabic voices in Web Speech API
 */
export function getAvailableArabicVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
}

export function isArabicVoiceAvailable() {
  return getAvailableArabicVoices().length > 0;
}

// Find a matching voice for the target locale
export function pickVoiceForLocale(voices, locale) {
  if (!voices || voices.length === 0) return null;
  const lang = locale.split('-')[0].toLowerCase();

  const exactLocale  = voices.filter(v => v.lang && v.lang.toLowerCase() === locale.toLowerCase());
  const prefixLocale = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(lang));
  const broadLocale  = voices.filter(v => (v.lang && v.lang.toLowerCase().includes(lang)) || (v.name && v.name.toLowerCase().includes(lang)));

  const isFemaleHint = (v) => FEMALE_VOICE_HINTS.some(h => v.name.toLowerCase().includes(h));
  const notMale      = (v) => !MALE_VOICE_EXCLUSIONS.some(h => v.name.toLowerCase().includes(h));

  // 1. Exact locale female
  const v1 = exactLocale.find(isFemaleHint);
  if (v1) return v1;

  // 2. Exact locale non-male
  const v2 = exactLocale.find(notMale);
  if (v2) return v2;

  // 3. Exact locale any
  if (exactLocale.length > 0) return exactLocale[0];

  // 4. Prefix locale female
  const v4 = prefixLocale.find(isFemaleHint);
  if (v4) return v4;

  // 5. Prefix locale any
  if (prefixLocale.length > 0) return prefixLocale[0];

  // 6. Broad locale
  if (broadLocale.length > 0) return broadLocale[0];

  // STRICT: Do NOT return a voice of a different language family!
  // Speaking Arabic/Tamil with an English voice sounds incomprehensible and fails in Chrome/Windows.
  return null;
}

// Clean text for speech synthesis
function sanitizeSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•|*#_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build Google TTS Audio stream URL
function buildGoogleTTSUrl(text, lang) {
  const shortText = text.length > 180 ? text.substring(0, 180) : text;
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(shortText)}`;
}

// Play TTS Audio using HTML5 Audio
function playAudioStream(cleanedText, lang) {
  return new Promise((resolve, reject) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      const url = buildGoogleTTSUrl(cleanedText, lang);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onplay = () => {
        notifyState(true);
      };

      audio.onended = () => {
        notifyState(false);
        currentAudio = null;
        resolve();
      };

      audio.onerror = (err) => {
        notifyState(false);
        currentAudio = null;
        reject(err);
      };

      audio.play().catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Main speakText function
 * Accurately speaks in English, Arabic, or Indian regional languages
 */
export function speakText(text, lang = 'en') {
  if (isMutedState) {
    console.info('[TTS] Voice announcements are currently muted by user.');
    return;
  }

  if (!text || text.trim() === '') return;

  // Stop any ongoing speech
  stopSpeaking();

  const cleaned = sanitizeSpeechText(text);
  if (!cleaned) return;

  const locale = LANG_LOCALE_MAP[lang] || 'en-IN';

  // Play realistic hospital chime first
  playHospitalChime();

  setTimeout(() => {
    // Check if Web Speech API has a genuine matching voice for this language
    let matchingVoice = null;
    let allVoices = [];
    if ('speechSynthesis' in window) {
      allVoices = window.speechSynthesis.getVoices();
      matchingVoice = pickVoiceForLocale(allVoices, locale);
    }

    // SPECIAL HANDLING FOR ARABIC:
    // If user requested Arabic and no native Arabic voice is present in the browser:
    // Do NOT silently speak English voice for Arabic text!
    if (lang === 'ar' && !matchingVoice) {
      console.warn('[TTS] No native Arabic voice detected in browser speech synthesis.');
      notifyVoiceAlert({
        type: 'ARABIC_VOICE_MISSING',
        message: 'No Arabic voice found installed on this device/browser. Please enable an Arabic voice in system settings or use the audio stream fallback.',
        lang: 'ar'
      });

      // Try playing online Google TTS audio stream for authentic native Arabic
      playAudioStream(cleaned, 'ar').catch(() => {
        notifyState(false);
      });
      return;
    }

    if (matchingVoice) {
      // Use native Web Speech API with the found voice
      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.rate = lang === 'ar' ? 0.88 : 0.92;
        utterance.pitch = 1.15;
        utterance.lang = matchingVoice.lang || locale;
        utterance.voice = matchingVoice;

        utterance.onstart = () => notifyState(true);
        utterance.onend = () => notifyState(false);
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted') {
            console.warn('[TTS] Web Speech failed, falling back to Audio stream:', e.error);
            playAudioStream(cleaned, lang).catch(() => notifyState(false));
          } else {
            notifyState(false);
          }
        };

        window.speechSynthesis.speak(utterance);
        console.info(`[TTS] Speaking with native voice: "${matchingVoice.name}" (${matchingVoice.lang}) for lang="${lang}"`);
      } catch (err) {
        console.warn('[TTS] Synthesis exception, falling back to Audio stream:', err);
        playAudioStream(cleaned, lang).catch(() => notifyState(false));
      }
    } else {
      // For non-Arabic regional languages (Tamil, Hindi, etc.) without native voice packs:
      // Use Google TTS Audio stream which provides authentic crystal-clear speech
      console.info(`[TTS] No native voice found in browser for "${locale}". Using high-fidelity audio stream for lang="${lang}".`);
      playAudioStream(cleaned, lang).catch((err) => {
        console.warn('[TTS] Audio stream failed, attempting browser speech synthesis fallback:', err);
        if ('speechSynthesis' in window) {
          const fallbackUtterance = new SpeechSynthesisUtterance(cleaned);
          fallbackUtterance.rate = 0.92;
          fallbackUtterance.pitch = 1.15;
          fallbackUtterance.lang = locale;
          fallbackUtterance.onstart = () => notifyState(true);
          fallbackUtterance.onend = () => notifyState(false);
          fallbackUtterance.onerror = () => notifyState(false);
          window.speechSynthesis.speak(fallbackUtterance);
        }
      });
    }
  }, 350);
}

/**
 * AUTOMATIC NURSE / CARETAKER VOICE ANNOUNCEMENT
 * Instructs nurses or caretakers to collect patients and escort them to the doctor's room.
 *
 * English:
 * "Attention Nurse Sarah. Please take responsibility for Patient ID P1025, John Smith. Escort the patient to Dr. Kumar's consultation room, Room Number 204. Please collect the patient from the waiting area."
 *
 * Arabic:
 * "انتباه، الممرضة سارة. يرجى استلام المريض رقم P1025، جون سميث، ومرافقته إلى غرفة الاستشارة الخاصة بالدكتور كومار، رقم الغرفة 204. يرجى اصطحاب المريض من منطقة الانتظار."
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

  // Duplicate prevention key
  const assignmentKey = `${patientId}_${nurseName}_${doctorName}_${roomNumber}`;
  if (!force && announcedKeys.has(assignmentKey)) {
    console.info(`[TTS] Announcement already made for ${assignmentKey}. Skipping duplicate.`);
    return { announced: false, reason: 'DUPLICATE_SKIPPED' };
  }

  // Construct announcement text based on selected language
  let announcementText = '';
  const cleanPatientName = patientName && patientName.trim() ? patientName.trim() : `ID ${patientId}`;

  if (lang === 'ar') {
    announcementText = `انتباه، الممرض(ة) ${nurseName}. يُرجى تولي مسؤولية المريض صاحب المعرف ${patientId}، ${cleanPatientName}. ومرافقته إلى غرفة استشارة الدكتور ${doctorName}، رقم الغرفة ${roomNumber}. يُرجى استلام المريض من منطقة الانتظار.`;
  } else if (lang === 'hi') {
    announcementText = `ध्यान दें नर्स ${nurseName}। कृपया मरीज आईडी ${patientId}, ${cleanPatientName} की जिम्मेदारी लें। मरीज को डॉक्टर ${doctorName} के परामर्श कक्ष संख्या ${roomNumber} में ले जाएँ। कृपया मरीज को प्रतीक्षालय से प्राप्त करें।`;
  } else if (lang === 'ta') {
    announcementText = `கவனிக்கவும் செவிலியர் ${nurseName}. நோயாளி எண் ${patientId}, ${cleanPatientName}-ஐ பொறுப்பேற்று, மருத்துவர் ${doctorName} அவர்களின் ஆலோசனை அறை எண் ${roomNumber}-க்கு அழைத்துச் செல்லவும். காத்திருப்பு அறையிலிருந்து நோயாளியை அழைத்துச் செல்லவும்.`;
  } else {
    // Default English
    announcementText = `Attention Nurse ${nurseName}. Please take responsibility for Patient ID ${patientId}, ${cleanPatientName}. Escort the patient to Dr. ${doctorName}'s consultation room, Room Number ${roomNumber}. Please collect the patient from the waiting area.`;
  }

  // Mark assignment as announced
  announcedKeys.add(assignmentKey);

  // Add to announcement history
  const historyEntry = {
    id: `ANNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    patientId,
    patientName: cleanPatientName,
    nurseName,
    doctorName,
    roomNumber,
    text: announcementText,
    lang,
    status: isMutedState ? 'Pending (Muted)' : 'Announced'
  };

  announcementHistory.unshift(historyEntry);
  if (announcementHistory.length > 50) {
    announcementHistory = announcementHistory.slice(0, 50);
  }
  notifyHistory();

  // Trigger speech
  speakText(announcementText, lang);

  return {
    announced: true,
    text: announcementText,
    historyEntry
  };
}

// Patient calling announcement helper
export function announcePatientCalling(tokenNumber, patientName, lang = 'en') {
  let message = '';
  switch (lang) {
    case 'ar':
      message = `رقم المريض ${tokenNumber}، ${patientName}، يرجى التوجه إلى غرفة الاستشارة فوراً.`;
      break;
    case 'ta':
      message = `டோக்கன் எண் ${tokenNumber}, ${patientName}, தயவுசெய்து ஆலோசனை அறைக்கு வரவும்.`;
      break;
    case 'hi':
      message = `टोकन संख्या ${tokenNumber}, ${patientName}, कृपया परामर्श कक्ष में पधारें।`;
      break;
    case 'te':
      message = `టోకెన్ సంఖ్య ${tokenNumber}, ${patientName}, దయచేసి సంప్రదింపుల గదికి రండి.`;
      break;
    case 'kn':
      message = `ಟೋಕನ್ ಸಂಖ್ಯೆ ${tokenNumber}, ${patientName}, ದಯವಿಟ್ಟು ಸಮಾಲೋಚನೆ ಕೊಠಡಿಗೆ ಬನ್ನಿ.`;
      break;
    case 'ml':
      message = `ടോക്കൺ നമ്പർ ${tokenNumber}, ${patientName}, ദയവായി കൺസൾട്ടേഷൻ മുറിയിലേക്ക് വരൂ.`;
      break;
    case 'bn':
      message = `টোকেন নম্বর ${tokenNumber}, ${patientName}, অনুগ্রহ করে পরামর্শ কক্ষে আসুন।`;
      break;
    case 'mr':
      message = `टोकन क्रमांक ${tokenNumber}, ${patientName}, कृपया सल्लागार कक्षात यावे.`;
      break;
    default:
      message = `Token number ${tokenNumber}, patient ${patientName}, please proceed to the consultation room.`;
      break;
  }
  speakText(message, lang);
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

export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  notifyState(false);
}

export function isCurrentlySpeaking() {
  return isSpeakingState;
}
