// --- Text-to-Speech Helper ---
let availableVoices = [];
let voiceMap = {}; // Cache for selected voices by language

const loadVoices = () => {
  availableVoices = window.speechSynthesis.getVoices();
  // console.log("Available voices loaded:", availableVoices);

  // Function to find the best voice for a given language
  const findBestVoice = (langPrefix) => {
    // Prioritize Google voices, then Microsoft, then any other
    const googleVoice = availableVoices.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Google'));
    if (googleVoice) return googleVoice;

    const microsoftVoice = availableVoices.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Microsoft'));
    if (microsoftVoice) return microsoftVoice;

    return availableVoices.find(v => v.lang.startsWith(langPrefix));
  };

  voiceMap['en-US'] = findBestVoice('en-');
  voiceMap['pt-PT'] = findBestVoice('pt-');
};

// Load voices initially and whenever they change
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const speakText = (text, lang = 'en-US') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang;
    msg.rate = 0.85;
    msg.pitch = 1.1;

    // Assign a voice from our cached map
    if (voiceMap[lang]) {
      msg.voice = voiceMap[lang];
    } else {
      // Fallback if voice not found in map (should not happen if loadVoices worked)
      msg.voice = availableVoices.find(v => v.lang.startsWith(lang.substring(0, 2))) || null;
    }

    window.speechSynthesis.speak(msg);
  }
};
