// Web Speech API and Audio TTS Service for Multilingual Hospital Announcements
// Supports: English (en), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn), Malayalam (ml), Bengali (bn), Marathi (mr)

let isSpeakingState = false;
let onStateChangeListeners = [];
let currentAudio = null;

export function subscribeSpeechState(listener) {
  onStateChangeListeners.push(listener);
  return () => {
    onStateChangeListeners = onStateChangeListeners.filter(l => l !== listener);
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

// Synthesizes a realistic 2-tone hospital chime using Web Audio API
export function playHospitalChime() {
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

// BCP-47 Locale mapping for all 8 supported languages
export const LANG_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
};

// Female voice name hints used across Google Chrome, Windows OneCore, Edge, iOS, Android
const FEMALE_VOICE_HINTS = [
  'female', 'woman', 'lady', 'girl',
  // English
  'zira', 'heera', 'hazel', 'susan', 'catherine', 'victoria',
  'samantha', 'karen', 'moira', 'veena', 'fiona', 'tessa',
  'aria', 'jenny', 'sonia', 'libby', 'mia', 'neerja',
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

// Male exclusions to prevent picking male voices when looking for lady voices
const MALE_VOICE_EXCLUSIONS = [
  'david', 'mark', 'richard', 'james', 'george', 'ryan', 'thomas', 'guy',
  'hemant', 'sundar', 'prabhas', 'male', 'man', 'boy'
];

// Try finding a matching female voice in Web Speech API
function pickFemaleVoice(voices, locale) {
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

  // DO NOT fallback to voices[0] if language doesn't match, because speaking Tamil/Hindi/Telugu
  // text with an English voice causes speech synthesis failure in Chrome/Windows!
  return null;
}

// Clean text for speech
function sanitizeSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•|*#_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build Google TTS Audio URL (natural female voice stream in all 8 languages)
function buildGoogleTTSUrl(text, lang) {
  const shortText = text.length > 180 ? text.substring(0, 180) : text;
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(shortText)}`;
}

// Play TTS Audio using HTML5 Audio (super lady voice fallback)
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

// Main speakText function
export function speakText(text, lang = 'en') {
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
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      matchingVoice = pickFemaleVoice(voices, locale);
    }

    if (matchingVoice) {
      // Use native Web Speech API with the found voice
      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.rate = 0.92;
        utterance.pitch = 1.18; // feminine pitch
        utterance.lang = locale;
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
      // No native voice for this language in browser (e.g. Tamil on Windows with only English voice pack):
      // Use Google TTS Audio stream which provides authentic crystal-clear native female speech!
      console.info(`[TTS] No native voice found in browser for "${locale}". Using high-fidelity female audio stream for lang="${lang}".`);
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

// Patient calling announcement helper in all 8 languages
export function announcePatientCalling(tokenNumber, patientName, lang = 'en') {
  let message = '';
  switch (lang) {
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

// No waiting patients announcement helper in all 8 languages
export function announceNoWaitingPatients(lang = 'en') {
  let message = '';
  switch (lang) {
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
