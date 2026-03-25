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
  // voiceMap['hi-IN'] = findBestVoice('hi-'); // Not used here, but good for consistency if needed elsewhere
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

// --- Reusable UI Components ---
const SpeakerButton = ({ text, lang = 'en-US', className = '' }) => (
  React.createElement('button', {
    onClick: (e) => {
      e.stopPropagation();
      speakText(text, lang);
    },
    className: `bg-white rounded-full p-2 shadow-md hover:bg-yellow-100 active:scale-90 transition-transform flex items-center justify-center shrink-0 ${className}`,
    'aria-label': "Read to me"
  },
    React.createElement('span', { className: "text-xl" }, "🔊")
  )
);

const WeatherWidget = ({ city, lat, lon }) => {
  const [weather, setWeather] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=Europe%2FLisbon`)
      .then(res => res.json())
      .then(data => {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          code: data.current_weather.weathercode
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch weather", err);
        setLoading(false);
      });
  }, [lat, lon]);

  if (loading) return React.createElement('div', { className: "text-center font-nunito p-4 text-gray-500 font-bold mb-8" }, "Fetching real weather... 🌤️");
  if (!weather) return null;

  let weatherEmoji = "☀️";
  let weatherDesc = "Clear & Sunny";
  if (weather.code >= 1 && weather.code <= 3) { weatherEmoji = "⛅"; weatherDesc = "Partly Cloudy"; }
  if (weather.code >= 45 && weather.code <= 48) { weatherEmoji = "🌫️"; weatherDesc = "Foggy"; }
  if (weather.code >= 51 && weather.code <= 67) { weatherEmoji = "🌧️"; weatherDesc = "Rainy"; }
  if (weather.code >= 71 && weather.code <= 77) { weatherEmoji = "❄️"; weatherDesc = "Snowy"; }
  if (weather.code >= 95) { weatherEmoji = "⛈️"; weatherDesc = "Stormy"; }

  let wearEmoji = "🩳🕶️";
  let wearDesc = "Shorts & shades!";
  if (weather.code >= 51 && weather.code <= 67) { wearEmoji = "🧥☔"; wearDesc = "Raincoat & umbrella!"; }
  else if (weather.temp < 15) { wearEmoji = "🧥👖"; wearDesc = "Warm jacket & pants!"; }
  else if (weather.temp < 22) { wearEmoji = "👖👕"; wearDesc = "T-shirt & jeans!"; }

  return (
    React.createElement('div', { className: "grid grid-cols-2 gap-4 mb-8" },
      React.createElement('div', { className: "bg-white p-4 rounded-2xl shadow-md text-center border-b-4 border-sky-200 cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText(`The weather in ${city} is ${weather.temp} degrees, ${weatherDesc}. High of ${weather.max} and low of ${weather.min}.`) },
        React.createElement('h3', { className: "font-fredoka text-sky-600" }, weatherEmoji, " ", city),
        React.createElement('div', { className: "text-3xl font-fredoka text-orange-500 my-2" }, weather.temp, "°C"),
        React.createElement('p', { className: "font-nunito font-bold text-sm text-gray-500" }, weatherDesc),
        React.createElement('p', { className: "font-nunito text-xs text-gray-400 mt-1" }, "H: ", weather.max, "° L: ", weather.min, "°")
      ),
      React.createElement('div', { className: "bg-white p-4 rounded-2xl shadow-md text-center border-b-4 border-orange-200 cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText(`You should wear ${wearDesc}`) },
        React.createElement('h3', { className: "font-fredoka text-orange-600" }, "👕 Wear"),
        React.createElement('div', { className: "text-3xl my-2" }, wearEmoji),
        React.createElement('p', { className: "font-nunito font-bold text-sm text-gray-500" }, wearDesc)
      )
    )
  );
};

const Sidebar = ({ isOpen, onClose, onSelect, currentPage }) => {
  const menuItems = [
    { id: 'home', icon: '🏠', title: 'Home' },
    { id: 'lisbon', icon: '🏙️', title: 'Lisbon' },
    { id: 'algarve', icon: '🏖️', title: 'Algarve' },
    { id: 'food', icon: '🍽️', title: 'Food' },
    { id: 'words', icon: '💬', title: 'Say It!' },
    { id: 'animals', icon: '🐬', title: 'Animals' },
    { id: 'history', icon: '⛵', title: 'Stories' },
    { id: 'quiz', icon: '🎯', title: 'Quiz!' },
    { id: 'game', icon: '🃏', title: 'Memory' },
    { id: 'packing', icon: '🧳', title: 'Packing' },
    { id: 'sing', icon: '🎵', title: 'Sing!' }
  ];

  return (
    React.createElement(React.Fragment, null,
      React.createElement('div', {
        className: `fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`,
        onClick: onClose
      }),
      React.createElement('div', { className: `fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-gradient-to-b from-sky-400 to-blue-500 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}` },
        React.createElement('div', { className: "p-4 border-b-4 border-white/20 flex justify-between items-center bg-white/10" },
          React.createElement('span', { className: "font-fredoka text-2xl text-white drop-shadow-md" }, "🧭 Explore!"),
          React.createElement('button', { onClick: onClose, className: "text-white text-2xl bg-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/30 border-2 border-white/50 active:scale-95 transition-transform" }, "❌")
        ),
        React.createElement('div', { className: "flex-1 overflow-y-auto p-4 flex flex-col gap-2" },
          menuItems.map(btn => (
            React.createElement('button', {
              key: btn.id,
              onClick: () => { onSelect(btn.id); onClose(); window.speechSynthesis.cancel(); },
              className: `font-fredoka text-xl p-3 rounded-2xl flex items-center gap-4 transition-all border-2 ${currentPage === btn.id ? 'bg-white text-blue-600 border-white translate-x-2 shadow-md' : 'bg-white/10 text-white border-transparent hover:bg-white/20 hover:translate-x-1'}`
            },
              React.createElement('span', { className: "text-3xl" }, btn.icon),
              btn.title
            )
          ))
        )
      )
    )
  );
};

const Header = ({ title, onOpenMenu }) => (
  React.createElement('div', { className: "sticky top-0 z-50 bg-gradient-to-r from-sky-500 to-blue-500 p-4 shadow-lg flex items-center justify-between text-white rounded-b-3xl mb-6 border-b-4 border-blue-600" },
    React.createElement('button', { onClick: onOpenMenu, className: "bg-white/20 hover:bg-white/30 p-2 rounded-xl font-fredoka flex items-center gap-2 transition-all active:scale-95 border-2 border-white/50" },
      React.createElement('span', { className: "text-xl" }, "☰"), " ", React.createElement('span', { className: "hidden sm:inline" }, "Menu")
    ),
    React.createElement('h1', { className: "font-fredoka text-2xl md:text-3xl tracking-wide drop-shadow-md text-center flex-1" }, title),
    React.createElement('div', { className: "w-12 text-3xl animate-bounce text-center" }, "🇵🇹")
  )
);

const SectionHero = ({ emoji, title, subtitle, bgClass }) => (
  React.createElement('div', { className: `rounded-3xl p-8 mb-8 text-center text-white shadow-xl border-4 border-white/20 relative overflow-hidden ${bgClass}` },
    React.createElement('div', { className: "absolute top-2 left-4 text-3xl opacity-50 animate-pulse" }, "⭐"),
    React.createElement('div', { className: "absolute bottom-4 right-8 text-4xl opacity-50 animate-pulse delay-300" }, "🌟"),
    React.createElement('span', { className: "text-6xl md:text-7xl block mb-2 drop-shadow-lg animate-bounce" }, emoji),
    React.createElement('h1', { className: "font-fredoka text-4xl md:text-5xl mb-2 drop-shadow-md" }, title),
    React.createElement('p', { className: "font-nunito font-bold text-xl md:text-2xl opacity-90" }, subtitle),
    React.createElement('div', { className: "absolute top-2 right-2" },
      React.createElement(SpeakerButton, { text: `${title}. ${subtitle}`, className: "text-black" })
    )
  )
);

const Card = ({ emoji, title, text, fact, colorClass, borderClass }) => (
  React.createElement('div', { className: `bg-white rounded-3xl p-6 shadow-lg border-b-4 ${borderClass} hover:-translate-y-2 transition-transform cursor-pointer relative`, onClick: () => speakText(`${title}. ${text} ${fact || ''}`) },
    React.createElement('span', { className: "text-5xl block mb-3" }, emoji),
    React.createElement('h3', { className: `font-fredoka text-2xl mb-2 ${colorClass}` }, title),
    React.createElement('p', { className: "font-nunito font-bold text-gray-600 leading-relaxed mb-2" }, text),
    fact && (
      React.createElement('div', { className: "bg-orange-50 rounded-xl p-3 mt-3 text-sm font-bold text-gray-800 border border-orange-100" },
        "🌟 ", fact
      )
    )
  )
);

// --- Pages ---

const HomePage = ({ onOpenMenu }) => (
  React.createElement('div', { className: "animate-fade-in pb-12" },
    React.createElement(SectionHero, {
      emoji: "🇵🇹",
      title: "Aarit & Keev's Big Adventure!",
      subtitle: "Get ready for a super fun trip to Portugal!",
      bgClass: "bg-gradient-to-br from-orange-400 to-yellow-400"
    }),

    React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-lg border-4 border-blue-200 mb-8 max-w-3xl mx-auto" },
      React.createElement('h2', { className: "font-fredoka text-2xl text-blue-600 mb-4 flex items-center gap-2" },
        "🗺️ Where are we going? ", React.createElement(SpeakerButton, { text: "Portugal is in Europe, right next to the big Atlantic Ocean! We will fly on an airplane, then visit the capital city Lisbon, and the beautiful beaches of the Algarve!" })
      ),

      React.createElement('div', { className: "relative pl-8 border-l-4 border-dashed border-sky-300 space-y-8 my-6" },
        React.createElement('div', { className: "relative cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText("Fly to Portugal! You, Mommy, Daddy, and Keev will fly high in the sky!") },
          React.createElement('div', { className: "absolute -left-[42px] bg-sky-100 rounded-full p-2 text-2xl border-4 border-sky-400 shadow-sm z-10" }, "✈️"),
          React.createElement('h3', { className: "font-fredoka text-xl text-sky-700" }, "1. Fly to Portugal!"),
          React.createElement('p', { className: "font-nunito font-bold text-gray-600" }, "You, Mommy, Daddy, and Keev will fly high in the sky!")
        ),
        React.createElement('div', { className: "relative cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText("Visit Lisbon! See the big castles and ride the yellow trams.") },
          React.createElement('div', { className: "absolute -left-[42px] bg-yellow-100 rounded-full p-2 text-2xl border-4 border-yellow-400 shadow-sm z-10" }, "🏙️"),
          React.createElement('h3', { className: "font-fredoka text-xl text-yellow-700" }, "2. Visit Lisbon!"),
          React.createElement('p', { className: "font-nunito font-bold text-gray-600" }, "See the big castles and ride the yellow trams.")
        ),
        React.createElement('div', { className: "relative cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText("Algarve Beaches! Play in the sand and look for jumping dolphins!") },
          React.createElement('div', { className: "absolute -left-[42px] bg-orange-100 rounded-full p-2 text-2xl border-4 border-orange-400 shadow-sm z-10" }, "🏖️"),
          React.createElement('h3', { className: "font-fredoka text-xl text-orange-700" }, "3. Algarve Beaches!"),
          React.createElement('p', { className: "font-nunito font-bold text-gray-600" }, "Play in the sand and look for jumping dolphins!")
        )
      )
    ),

    React.createElement('div', { className: "text-center mt-8" },
      React.createElement('button', { onClick: onOpenMenu, className: "bg-blue-500 text-white font-fredoka text-2xl py-4 px-8 rounded-full shadow-lg border-b-4 border-blue-700 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all animate-bounce inline-flex items-center gap-3" },
        React.createElement('span', null, "🧭"), " Open Menu to Explore!"
      )
    ),

    React.createElement('h2', { className: "font-fredoka text-3xl text-center text-sky-700 mt-12 mb-6 drop-shadow-sm" }, "Quick Links! 👇"),

    React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-2" },
      [
        { id: 'lisbon', icon: '🏙️', title: 'Lisbon', color: 'bg-yellow-300 border-yellow-500 text-yellow-900' },
        { id: 'algarve', icon: '🏖️', title: 'Algarve', color: 'bg-orange-300 border-orange-500 text-orange-900' },
        { id: 'food', icon: '🍽️', title: 'Food', color: 'bg-rose-300 border-rose-500 text-rose-900' },
        { id: 'history', icon: '⛵', title: 'Stories', color: 'bg-amber-300 border-amber-500 text-amber-900' },
        { id: 'words', icon: '💬', title: 'Say It!', color: 'bg-purple-300 border-purple-500 text-purple-900' },
        { id: 'animals', icon: '🐬', title: 'Animals', color: 'bg-teal-300 border-teal-500 text-teal-900' }
      ].map(btn =>
        React.createElement('button', {
          key: btn.id,
          onClick: () => { document.querySelector('.animate-fade-in').parentElement.parentElement.__reactFiber$?.return?.stateNode?.setCurrentPage?.(btn.id) || window.dispatchEvent(new CustomEvent('navTo', { detail: btn.id })); },
          className: `${btn.color} border-b-4 hover:-translate-y-1 hover:brightness-110 active:translate-y-1 active:border-b-0 rounded-3xl p-4 flex flex-col items-center justify-center shadow-md transition-all group`
        },
          React.createElement('span', { className: "text-4xl md:text-5xl mb-2 group-hover:scale-110 transition-transform" }, btn.icon),
          React.createElement('span', { className: "font-fredoka text-lg md:text-xl" }, btn.title)
        )
      )
    )
  )
);

const LisbonPage = () => {
  const [tramDing, setTramDing] = React.useState(false);
  const ringBell = () => {
    setTramDing(true); speakText("Ding ding! All aboard!", "en-US");
    setTimeout(() => setTramDing(false), 500);
  };

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🏙️", title: "Welcome to Lisbon!", subtitle: "The city of hills and castles! 🌟", bgClass: "bg-gradient-to-br from-sky-400 to-teal-400" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl mb-8 border-4 border-yellow-400 flex flex-col items-center" },
        React.createElement('h2', { className: "font-fredoka text-3xl text-yellow-600 mb-4 flex items-center gap-2" },
          "Tap the Tram! ", React.createElement(SpeakerButton, { text: "Lisbon has big hills and cool yellow trams! Tap the tram to ring the bell." })
        ),
        React.createElement('div', { className: "flex flex-col md:flex-row gap-8 items-center justify-center" },
          React.createElement('div', { className: "flex flex-col items-center cursor-pointer group", onClick: ringBell },
            React.createElement('div', { className: `text-8xl md:text-9xl transition-transform ${tramDing ? 'scale-110 -rotate-6' : 'hover:scale-105'}` }, "🚋")
          ),
          React.createElement('div', { className: "flex flex-col items-center" },
            React.createElement('div', { className: "text-8xl md:text-9xl animate-pulse" }, "🏰")
          )
        )
      ),

      React.createElement(WeatherWidget, { city: "Lisbon", lat: 38.7169, lon: -9.1399 }),

      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        React.createElement(Card, { emoji: "🚃", title: "The Yellow Tram!", text: "Lisbon has very old, famous yellow trams that go up and down the steep hills like a rollercoaster!", fact: "Tram 28 is the most famous one!", colorClass: "text-yellow-600", borderClass: "border-yellow-400" }),
        React.createElement(Card, { emoji: "🏰", title: "St. George's Castle", text: "On top of the biggest hill, there's a real castle where kings lived a long time ago. You can walk on the walls!", fact: "It has real peacocks walking around!", colorClass: "text-orange-600", borderClass: "border-orange-400" }),
        React.createElement(Card, { emoji: "🌉", title: "Big Red Bridge", text: "Lisbon has a huge red bridge over the river. It looks just like the Golden Gate Bridge in America!", colorClass: "text-red-600", borderClass: "border-red-400" }),
        React.createElement(Card, { emoji: "🛗", title: "Outdoor Elevators", text: "Because the hills are so steep, they built outdoor elevators to help people go up! It's a lift on the street!", colorClass: "text-purple-600", borderClass: "border-purple-400" })
      )
    )
  );
};

const AlgarvePage = () => {
  const [jump, setJump] = React.useState(false);
  const makeDolphinJump = () => {
    setJump(true); speakText("Splash! Squeak squeak!", "en-US");
    setTimeout(() => setJump(false), 1000);
  };

  return (
    React.createElement('div', { className: "animate-fade-in pb-12 overflow-hidden" },
      React.createElement(SectionHero, { emoji: "🏖️", title: "The Algarve!", subtitle: "The most beautiful beaches in the world! 🌊", bgClass: "bg-gradient-to-br from-orange-400 to-rose-400" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl mb-8 border-4 border-blue-400" },
        React.createElement('h2', { className: "font-fredoka text-3xl text-blue-600 mb-4 text-center flex items-center justify-center gap-2" },
          "Tap the water! ", React.createElement(SpeakerButton, { text: "The Algarve has the best beaches and blue water. Tap the ocean to make the dolphin jump!" })
        ),
        React.createElement('div', { className: "relative w-full h-48 md:h-64 bg-sky-200 rounded-2xl overflow-hidden border-4 border-sky-300 flex items-end justify-center pb-2 cursor-pointer", onClick: makeDolphinJump },
          React.createElement('div', { className: "absolute bottom-0 w-full h-1/2 bg-blue-500 opacity-60 rounded-t-[100px]" }),
          React.createElement('div', { className: `text-7xl md:text-8xl transition-all duration-500 z-10 ${jump ? '-translate-y-24 md:-translate-y-32 rotate-12 scale-125' : 'translate-y-4 hover:-translate-y-2'}` }, "🐬")
        )
      ),

      React.createElement(WeatherWidget, { city: "Algarve", lat: 37.0194, lon: -7.9322 }),

      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        React.createElement(Card, { emoji: "🏖️", title: "Golden Beaches!", text: "The sand is soft, golden, and warm! Perfect for digging and building huge sandcastles with Keev!", colorClass: "text-yellow-600", borderClass: "border-yellow-400" }),
        React.createElement(Card, { emoji: "🪨", title: "Amazing Sea Caves", text: "The sea carved cool orange rocks into arches and caves. You can explore them on a boat ride!", fact: "Look out for pirate hiding spots!", colorClass: "text-orange-600", borderClass: "border-orange-400" }),
        React.createElement(Card, { emoji: "🐚", title: "Shell Hunting", text: "The beaches have beautiful shells. You can collect them to bring home, but remember to leave the starfish in the sea!", colorClass: "text-teal-600", borderClass: "border-teal-400" }),
        React.createElement(Card, { emoji: "🧴", title: "Sun Safety!", text: "The sun is super strong. Always wear sunscreen, a hat, and swim close to Mommy and Daddy!", colorClass: "text-red-500", borderClass: "border-red-400" })
      )
    )
  );
};

const FoodPage = () => {
  const [bites, setBites] = React.useState(0);
  const eatTart = () => {
    if (bites < 3) { setBites(bites + 1); speakText("Nom nom nom!", "en-US"); }
    else { setBites(0); speakText("Let's bake another one!", "en-US"); }
  };
  const getTartEmoji = () => ['🥧', '🥟', '🥐', '✨'][bites];

  const foods = [
    { emoji: '🐟', title: 'Grilled Sardines', desc: 'Fresh fish cooked over charcoal. Super yummy and healthy!', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { emoji: '🍞', title: 'Pão com Manteiga', desc: 'Warm, soft bread with butter. The best breakfast ever!', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { emoji: '🥤', title: 'Sumol', desc: 'A fizzy, sparkly orange drink that kids absolutely love!', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { emoji: '🍗', title: 'Frango Grelhado', desc: 'Grilled chicken with chips and rice. You will eat this a lot!', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { emoji: '🦐', title: 'Gambas', desc: 'Giant prawns! They are fun and messy to peel!', color: 'bg-red-50 text-red-700 border-red-200' },
    { emoji: '🍦', title: 'Gelado', desc: 'Ice cream! Perfect after a hot day at the beach.', color: 'bg-sky-50 text-sky-700 border-sky-200' }
  ];

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "😋", title: "Yummy Food!", subtitle: "Get ready to try delicious things!", bgClass: "bg-gradient-to-br from-rose-400 to-orange-400" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl mb-8 border-4 border-orange-400 flex flex-col items-center" },
        React.createElement('h2', { className: "font-fredoka text-3xl text-orange-600 mb-2 flex items-center justify-center gap-2" },
          "Pastéis de Nata! ", React.createElement(SpeakerButton, { text: "Pastéis de Nata! The most famous Portuguese treat. Sweet egg custard in crispy pastry! Tap the tart below to eat it!" })
        ),
        React.createElement('p', { className: "font-nunito font-bold text-gray-600 mb-6 text-center max-w-md" },
          "The most famous Portuguese treat. Sweet egg custard in crispy pastry! Tap to eat it!"
        ),
        React.createElement('button', { onClick: eatTart, className: "text-8xl md:text-9xl transform transition-transform hover:scale-110 active:scale-90 bg-orange-50 rounded-full w-40 h-40 md:w-48 md:h-48 flex items-center justify-center shadow-inner border-4 border-orange-200" },
          getTartEmoji()
        )
      ),

      React.createElement('h2', { className: "font-fredoka text-2xl text-rose-600 mb-4 ml-2" }, "More Yummy Foods to Try:"),
      React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" },
        foods.map((f, i) =>
          React.createElement('div', { key: i, onClick: () => speakText(`${f.title}. ${f.desc}`), className: `rounded-2xl p-5 border-b-4 ${f.color} shadow-md flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform` },
            React.createElement('span', { className: "text-6xl mb-2" }, f.emoji),
            React.createElement('h3', { className: "font-fredoka text-xl mb-1" }, f.title),
            React.createElement('p', { className: "font-nunito font-bold text-sm opacity-80" }, f.desc),
            React.createElement('div', { className: "mt-2 text-yellow-500" }, "⭐⭐⭐⭐⭐")
          )
        )
      )
    )
  );
};

const LanguagePage = () => {
  const words = [
    { pt: "Olá", en: "Hello", emoji: "👋", say: "oh-LAH" },
    { pt: "Tchau", en: "Goodbye", emoji: "🚶‍♂️", say: "CHOW" },
    { pt: "Obrigado", en: "Thank you (for boys)", emoji: "🙏", say: "oh-bree-GAH-doo" },
    { pt: "Por favor", en: "Please", emoji: "🥺", say: "por fah-VOR" },
    { pt: "Sim", en: "Yes", emoji: "👍", say: "SEENG" },
    { pt: "Não", en: "No", emoji: "👎", say: "NOW" },
    { pt: "Água", en: "Water", emoji: "💧", say: "AH-gwah" },
    { pt: "Gelado", en: "Ice cream", emoji: "🍦", say: "jeh-LAH-doo" },
    { pt: "Mãe", en: "Mommy", emoji: "👩", say: "MY" },
    { pt: "Pai", en: "Daddy", emoji: "👨", say: "PIE" },
    { pt: "Irmão", en: "Brother (Keev!)", emoji: "👦", say: "eer-MOW" },
    { pt: "Brincar", en: "To Play", emoji: "⚽", say: "breen-CAR" },
    { pt: "Praia", en: "Beach", emoji: "🏖️", say: "PRY-ah" },
    { pt: "Castelo", en: "Castle", emoji: "🏰", say: "cas-TEH-loo" }
  ];

  const numbers = [
    { n: 1, pt: "um", color: "text-red-500 border-red-300" }, { n: 2, pt: "dois", color: "text-orange-500 border-orange-300" },
    { n: 3, pt: "três", color: "text-yellow-500 border-yellow-400" }, { n: 4, pt: "quatro", color: "text-green-500 border-green-300" },
    { n: 5, pt: "cinco", color: "text-blue-500 border-blue-300" }, { n: 6, pt: "seis", color: "text-indigo-500 border-indigo-300" },
    { n: 7, pt: "sete", color: "text-purple-500 border-purple-300" }, { n: 8, pt: "oito", color: "text-pink-500 border-pink-300" },
    { n: 9, pt: "nove", color: "text-rose-500 border-rose-300" }, { n: 10, pt: "dez", color: "text-teal-500 border-teal-300" }
  ];

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "💬", title: "Speak Portuguese!", subtitle: "Learn words to surprise everyone!", bgClass: "bg-gradient-to-br from-purple-400 to-sky-400" }),

      React.createElement('h2', { className: "font-fredoka text-2xl text-purple-600 mb-4 ml-2 flex items-center gap-2" },
        "Words & Phrases ", React.createElement(SpeakerButton, { text: "Tap the buttons to hear how to say these words in Portuguese!", lang: "en-US" })
      ),
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-10" },
        words.map((w, i) =>
          React.createElement('button', { key: i, onClick: () => speakText(w.pt, 'pt-PT'), className: "bg-white border-b-4 border-purple-300 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-purple-50 active:scale-95 transition-all group" },
            React.createElement('div', { className: "text-left" },
              React.createElement('div', { className: "font-fredoka text-2xl text-purple-700" }, w.pt),
              React.createElement('div', { className: "font-nunito font-bold text-gray-500" }, w.en),
              React.createElement('div', { className: "text-xs font-bold text-gray-400 mt-1 bg-gray-100 rounded px-2 py-1 inline-block" }, "Say it: ", w.say)
            ),
            React.createElement('div', { className: "text-5xl group-hover:scale-110 transition-transform" }, w.emoji)
          )
        )
      ),

      React.createElement('h2', { className: "font-fredoka text-2xl text-sky-600 mb-4 ml-2" }, "Count to 10!"),
      React.createElement('div', { className: "flex flex-wrap gap-3 justify-center" },
        numbers.map((num, i) =>
          React.createElement('button', { key: i, onClick: () => speakText(num.pt, 'pt-PT'), className: `bg-white border-b-4 ${num.color} rounded-2xl p-4 min-w-[90px] shadow-sm hover:scale-105 active:scale-95 transition-all flex flex-col items-center` },
            React.createElement('span', { className: `font-fredoka text-4xl ${num.color.split(' ')[0]}` }, num.n),
            React.createElement('span', { className: "font-nunito font-bold text-gray-600 text-lg" }, num.pt)
          )
        )
      )
    )
  );
};

const AnimalsPage = () => {
  const animals = [
    { emoji: '🐬', name: 'Golfinhos', en: 'Dolphins', text: 'They love swimming near boats. You might see them jump in the Algarve!', tag: '🌊 In the sea' },
    { emoji: '🐓', name: 'Galo de Barcelos', en: 'Lucky Rooster', text: 'The colourful rooster is the symbol of Portugal! It brings good luck!', tag: '🍀 Lucky symbol' },
    { emoji: '🦢', name: 'Cegonhas', en: 'Storks', text: 'These big white birds build giant nests on top of chimneys and towers!', tag: '🏠 On rooftops' },
    { emoji: '🐙', name: 'Polvos', en: 'Octopus', text: 'These clever creatures with 8 arms live in the sea nearby!', tag: '🌊 In the sea' },
    { emoji: '🦩', name: 'Flamingos', en: 'Flamingos', text: 'Beautiful pink birds that stand on one leg in the lagoons!', tag: '🌸 Pink birds' },
    { emoji: '🐢', name: 'Tartarugas', en: 'Sea Turtles', text: 'Gentle sea turtles swim in the warm ocean waters.', tag: '🌊 In the ocean' }
  ];

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🐬", title: "Amazing Animals!", subtitle: "Look out for these creatures!", bgClass: "bg-gradient-to-br from-teal-400 to-sky-400" }),

      React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-3 gap-4" },
        animals.map((a, i) =>
          React.createElement('div', { key: i, onClick: () => speakText(`${a.en}! ${a.text}`), className: "bg-white rounded-3xl p-5 shadow-lg border-b-4 border-teal-200 text-center cursor-pointer hover:scale-105 transition-transform flex flex-col items-center" },
            React.createElement('span', { className: "text-6xl md:text-7xl mb-2" }, a.emoji),
            React.createElement('h3', { className: "font-fredoka text-lg text-teal-700" }, a.name),
            React.createElement('p', { className: "font-nunito font-bold text-gray-500 text-sm mb-2" }, a.en),
            React.createElement('span', { className: "bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-300" }, a.tag)
          )
        )
      )
    )
  );
};

const HistoryPage = () => {
  const [sail, setSail] = React.useState(false);
  const startSailing = () => {
    setSail(true);
    speakText("Whoosh! The explorers are sailing across the ocean!", "en-US");
    setTimeout(() => setSail(false), 4000);
  };

  return (
    React.createElement('div', { className: "animate-fade-in pb-12 overflow-hidden" },
      React.createElement(SectionHero, { emoji: "⛵", title: "Fun Stories!", subtitle: "Tales of explorers and magic roosters!", bgClass: "bg-gradient-to-br from-amber-400 to-orange-500" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl mb-8 border-4 border-blue-400" },
        React.createElement('h2', { className: "font-fredoka text-3xl text-blue-600 mb-4 text-center flex items-center justify-center gap-2" },
          "Sail the Ship! ", React.createElement(SpeakerButton, { text: "Long ago, Portuguese explorers sailed giant ships across the ocean! Tap the water to make the ship sail!" })
        ),
        React.createElement('div', { className: "relative w-full h-48 md:h-64 bg-sky-300 rounded-2xl overflow-hidden border-4 border-sky-400 flex items-end justify-center pb-2 cursor-pointer", onClick: startSailing },
          React.createElement('div', { className: "absolute bottom-0 w-full h-1/2 bg-blue-600 opacity-70 rounded-t-[100px]" }),
          React.createElement('div', { className: `text-7xl md:text-8xl absolute bottom-8 transition-all duration-[4000ms] ease-in-out z-10 ${sail ? 'translate-x-[150%] md:translate-x-[250%]' : '-translate-x-[150%] md:-translate-x-[250%]'}` }, "⛵")
        )
      ),

      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        React.createElement(Card, {
          emoji: "🗺️",
          title: "The Brave Explorers",
          text: "A long time ago, brave sailors from Portugal built giant wooden ships with big white sails. A famous captain named Vasco da Gama sailed all the way to India! They braved huge waves to discover new lands, amazing animals, and yummy spices like cinnamon and pepper that no one in Europe had ever tasted before!",
          fact: "Another Portuguese explorer named Ferdinand Magellan was the very first person to plan a trip all the way around the world!",
          colorClass: "text-blue-600",
          borderClass: "border-blue-400"
        }),
        React.createElement(Card, {
          emoji: "🐓",
          title: "The Magic Rooster",
          text: "There is a famous legend about a colourful rooster in a town called Barcelos. A man was in trouble, but a cooked dinner rooster magically stood up on the table and crowed to prove the man was innocent and a good friend! Now, you will see this bright painted rooster all over Portugal.",
          fact: "The Galo de Barcelos brings good luck to everyone who has one!",
          colorClass: "text-red-600",
          borderClass: "border-red-400"
        }),
        React.createElement(Card, {
          emoji: "👨‍🍳",
          title: "The Secret Recipe",
          text: "Did you know that long ago, monks living in a beautiful monastery in Lisbon invented the yummy Pastel de Nata? They used the white parts of eggs to wash and starch their clothes! That left them with lots of yellow egg yolks. Instead of throwing them away, they mixed them with sugar to bake the best sweet treat ever!",
          fact: "The recipe is still a big secret today, known by only a few bakers!",
          colorClass: "text-orange-600",
          borderClass: "border-orange-400"
        }),
        React.createElement(Card, {
          emoji: "🏰",
          title: "Knights and Castles",
          text: "Portugal is a super old country! Almost a thousand years ago, brave knights and kings built giant stone castles on top of big hills to keep their towns safe. The very first king was named Afonso. Today, you and Keev can explore these very same castles, climb their tall towers, and pretend to be knights protecting the city!",
          fact: "The borders of Portugal haven't changed in over 800 years!",
          colorClass: "text-slate-600",
          borderClass: "border-slate-400"
        })
      )
    )
  );
};

const QuizPage = () => {
  const questions = [
    { q: "What is the capital city of Portugal?", emoji: "🏙️", opts: ["Madrid", "Lisbon", "Paris"], ans: 1, fact: "Lisbon is the capital! It has yellow trams and a big castle!" },
    { q: "What colour is Portugal's most famous tram?", emoji: "🚃", opts: ["Red", "Yellow", "Blue"], ans: 1, fact: "The trams in Lisbon are bright yellow!" },
    { q: "What yummy treat is Lisbon famous for?", emoji: "😋", opts: ["Pizza", "Pastel de Nata", "Doughnut"], ans: 1, fact: "Pasteis de Nata are delicious egg custard tarts!" },
    { q: "What is the Portuguese word for Hello?", emoji: "👋", opts: ["Bonjour", "Olá", "Hola"], ans: 1, fact: "Olá is hello in Portuguese!" },
    { q: "Which animal is the symbol of Portugal?", emoji: "🐓", opts: ["Rooster", "Lion", "Bear"], ans: 0, fact: "The colourful rooster is Portugal's lucky symbol!" }
  ];

  const [qIdx, setQIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [quizFinished, setQuizFinished] = React.useState(false);

  const handleAnswer = (idx) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    const isCorrect = idx === questions[qIdx].ans;
    if (isCorrect) {
      setScore(s => s + 1);
      speakText("Correct! " + questions[qIdx].fact);
    } else {
      speakText("Oops! " + questions[qIdx].fact);
    }
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelected(null);
    if (qIdx < questions.length - 1) setQIdx(qIdx + 1);
    else {
      setQuizFinished(true);
      speakText(`Quiz finished! You got ${score + (selected === questions[qIdx].ans ? 1 : 0)} out of ${questions.length}!`);
    }
  };

  const resetQuiz = () => { speakText("Play again!"); setQIdx(0); setScore(0); setShowFeedback(false); setSelected(null); setQuizFinished(false); };

  if (quizFinished) {
    return (
      React.createElement('div', { className: "animate-fade-in pb-12 text-center" },
        React.createElement(SectionHero, { emoji: "🏆", title: "Quiz Complete!", subtitle: `You scored ${score} out of ${questions.length}!`, bgClass: "bg-gradient-to-br from-yellow-400 to-orange-400" }),
        React.createElement('div', { className: "text-8xl mb-6" }, "⭐"),
        React.createElement('button', { onClick: resetQuiz, className: "bg-blue-500 text-white font-fredoka text-xl py-4 px-8 rounded-full shadow-lg border-b-4 border-blue-700 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all" }, "Play Again!")
      )
    );
  }

  const q = questions[qIdx];
  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🎯", title: "Quiz Time!", subtitle: "How much do you know?", bgClass: "bg-gradient-to-br from-sky-400 to-blue-500" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl border-4 border-sky-300 max-w-2xl mx-auto text-center" },
        React.createElement('span', { className: "text-6xl block mb-4" }, q.emoji),
        React.createElement('h2', { className: "font-fredoka text-2xl text-gray-800 mb-6 flex items-center justify-center gap-3" },
          q.q, " ", React.createElement(SpeakerButton, { text: q.q })
        ),

        React.createElement('div', { className: "grid grid-cols-1 gap-4 mb-6" },
          q.opts.map((opt, i) => {
            let btnClass = "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100";
            if (showFeedback) {
              if (i === q.ans) btnClass = "bg-green-500 border-green-600 text-white";
              else if (i === selected) btnClass = "bg-red-500 border-red-600 text-white";
              else btnClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-50";
            }
            return (
              React.createElement('button', {
                key: i,
                onClick: () => handleAnswer(i),
                disabled: showFeedback,
                className: `font-fredoka text-xl p-4 rounded-2xl border-b-4 transition-all ${btnClass}`
              },
                opt
              )
            );
          })
        ),

        showFeedback && (
          React.createElement('button', { onClick: () => { speakText(qIdx < questions.length - 1 ? "Next question" : "See score!"); nextQuestion(); }, className: "bg-orange-500 text-white font-fredoka text-xl py-3 px-8 rounded-full shadow-md border-b-4 border-orange-600 active:translate-y-1 active:border-b-0 transition-all" },
            qIdx < questions.length - 1 ? 'Next Question ➡️' : 'See Score! 🏆'
          )
        )
      )
    )
  );
};

const MemoryGamePage = () => {
  const emojis = ['🇵🇹', '🚃', '🏖️', '🥐', '🐬', '🐓'];
  const emojiNames = {'🇵🇹': 'Portugal', '🚃': 'Yellow Tram', '🏖️': 'Beach', '🥐': 'Pastel de nata', '🐬': 'Dolphin', '🐓': 'Lucky Rooster'};
  const [cards, setCards] = React.useState([]);
  const [flipped, setFlipped] = React.useState([]);
  const [matched, setMatched] = React.useState([]);
  const [moves, setMoves] = React.useState(0);

  const initGame = () => {
    speakText("New game started!");
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setCards(shuffled); setFlipped([]); setMatched([]); setMoves(0);
  };

  React.useEffect(() => { initGame(); }, []);

  const handleFlip = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;

    speakText(emojiNames[cards[idx]]);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
        if (matched.length + 2 === cards.length) setTimeout(() => speakText("You won! Amazing job!", "en-US"), 800);
        else setTimeout(() => speakText("Match!", "en-US"), 800);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🃏", title: "Memory Game!", subtitle: "Match the Portugal pairs!", bgClass: "bg-gradient-to-br from-pink-400 to-purple-500" }),

      React.createElement('div', { className: "max-w-md mx-auto text-center" },
        React.createElement('div', { className: "font-fredoka text-xl text-purple-700 mb-4" },
          matched.length === cards.length ? `🏆 All pairs found in ${moves} moves!` : '🎮 Find the matching pairs!'
        ),

        React.createElement('div', { className: "grid grid-cols-3 gap-3 md:gap-4 mb-8" },
          cards.map((emoji, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              React.createElement('div', {
                key: i,
                onClick: () => handleFlip(i),
                className: `aspect-square rounded-2xl flex items-center justify-center text-5xl md:text-6xl cursor-pointer transition-all duration-300 border-b-4 shadow-md ${isFlipped ? (matched.includes(i) ? 'bg-green-200 border-green-400' : 'bg-white border-gray-200') : 'bg-blue-500 border-blue-700 hover:-translate-y-1 active:translate-y-1'}`
              },
                isFlipped ? emoji : React.createElement('span', { className: "text-white opacity-80 text-4xl" }, "🇵🇹")
              )
            );
          })
        ),

        React.createElement('button', { onClick: initGame, className: "bg-orange-500 text-white font-fredoka text-xl py-3 px-8 rounded-full shadow-md border-b-4 border-orange-600 active:translate-y-1 active:border-b-0 transition-all" }, "🔄 New Game")
      )
    )
  );
};

const PackingPage = () => {
  const [packed, setPacked] = React.useState({});
  const togglePack = (item) => {
    // This safely strips the emojis from the beginning so it speaks clearly
    const itemName = item.replace(/[^ -]/g, "").trim();
    setPacked(p => ({ ...p, [item]: !p[item] }));
    if (!packed[item]) speakText(`Packed ${itemName}!`, "en-US");
    else speakText(`Unpacked ${itemName}!`, "en-US");
  };

  const sections = [
    { title: '☀️ Beach & Sun', color: 'text-orange-500', items: ['🧴 Sunscreen', '🩱 Swimsuit', '🕶️ Sunglasses', '👒 Sun hat', '🏖️ Towel', '🪣 Bucket & spade'] },
    { title: '👕 Clothes', color: 'text-blue-500', items: ['🩳 Shorts', '👕 T-shirts', '👟 Comfy shoes', '🧦 Socks', '🧥 Light jacket'] },
    { title: '🎒 Fun Stuff', color: 'text-purple-500', items: ['🧸 Favourite toy', '🖍️ Colouring pens', '📚 Books', '🎧 Headphones'] }
  ];

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const packedCount = Object.values(packed).filter(Boolean).length;

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🧳", title: "Pack My Bag!", subtitle: "Help mommy, daddy, and baby Keev pack!", bgClass: "bg-gradient-to-br from-green-400 to-teal-500" }),

      React.createElement('div', { className: "bg-white rounded-3xl p-6 shadow-xl max-w-2xl mx-auto border-4 border-green-300" },
        React.createElement('div', { className: "font-fredoka text-2xl text-center text-green-600 mb-6 cursor-pointer hover:scale-105 transition-transform", onClick: () => speakText(packedCount === totalItems ? 'All packed! Ready to fly!' : `${packedCount} of ${totalItems} items packed!`) },
          packedCount === totalItems ? '🎉 All packed! Ready to fly! ✈️' : `✅ ${packedCount} of ${totalItems} items packed!`
        ),

        sections.map((sec, i) =>
          React.createElement('div', { key: i, className: "mb-6" },
            React.createElement('h3', { className: `font-fredoka text-xl mb-3 ${sec.color}` }, sec.title),
            React.createElement('div', { className: "flex flex-wrap gap-2 md:gap-3" },
              sec.items.map(item => {
                const isPacked = packed[item];
                return (
                  React.createElement('button', {
                    key: item,
                    onClick: () => togglePack(item),
                    className: `font-nunito font-bold text-sm md:text-base py-2 px-4 rounded-full border-2 transition-all select-none ${isPacked ? 'bg-green-500 border-green-600 text-white' : 'bg-orange-50 border-orange-200 text-gray-700 hover:bg-orange-100'}`
                  },
                    isPacked && React.createElement('span', { className: "mr-1" }, "✅"),
                    item
                  )
                );
              })
            )
          )
        )
      )
    )
  );
};

const SingPage = () => {
  const singSong = () => {
    speakText("Portugal, Portugal, sunny land by the sea! Yellow trams and golden sands, that is the place to be! Ola, Ola, how do you do? The ocean is sparkling blue! Eat pasteis, yummy yum! Pat your happy tum! Dolphins jump, storks fly high, Rooster crows up in the sky! Portugal, Portugal, I love you, it is true!", "en-US");
  };

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🎵", title: "Sing Along!", subtitle: "A fun song about Portugal!", bgClass: "bg-gradient-to-br from-indigo-400 to-pink-500" }),

      React.createElement('div', { className: "bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-8 text-white text-center shadow-xl max-w-2xl mx-auto border-4 border-white/20 relative overflow-hidden" },
        React.createElement('div', { className: "absolute top-4 left-4 text-4xl opacity-50 animate-bounce" }, "🎵"),
        React.createElement('div', { className: "absolute top-12 right-6 text-3xl opacity-50 animate-bounce delay-150" }, "🎶"),

        React.createElement('h2', { className: "font-fredoka text-3xl mb-6 drop-shadow-md" }, "🇵🇹 My Portugal Song 🇵🇹"),

        React.createElement('div', { className: "space-y-4 font-nunito font-bold text-lg md:text-xl bg-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8" },
          React.createElement('p', null, "Portugal, Portugal, sunny land by the sea! 🌊"),
          React.createElement('p', null, "Yellow trams and golden sands, that's the place to be! 🚃🏖️"),
          React.createElement('p', null, "Olá, Olá, how do you do? The ocean is sparkling blue! 💙"),
          React.createElement('p', null, "Eat pastéis, yummy yum! Pat your happy tum! 🥐😋"),
          React.createElement('p', null, "Dolphins jump, storks fly high, Rooster crows up in the sky! 🐬🐓"),
          React.createElement('p', null, "Portugal, Portugal, I love you, it's true! ❤️🇵🇹")
        ),

        React.createElement('button', { onClick: singSong, className: "bg-white text-purple-600 font-fredoka text-xl py-4 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-3 mx-auto" },
          React.createElement('span', { className: "text-2xl" }, "🎤"), " Read the song!"
        )
      )
    )
  );
};


// --- Global Styles Injection ---
const GlobalStyles = () => (
  React.createElement('style', null, `@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;800;900&display=swap');
    .font-fredoka { font-family: 'Fredoka One', cursive; }
    .font-nunito { font-family: 'Nunito', sans-serif; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); } \n      to { opacity: 1; transform: translateY(0); }
    }
    body {
      background-color: #FFF9F0;
      background-image: radial-gradient(circle, #ffd93d44 2px, transparent 2px), radial-gradient(circle, #ff6b3533 1px, transparent 1px);
      background-size: 60px 60px, 30px 30px;
      background-position: 0 0, 15px 15px;
    }`))
);

// --- Main App Component ---
function App() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Allow dispatching custom event to navigate from the HomePage Quick Links safely without breaking React rules
  React.useEffect(() => {
    const handleNav = (e) => setCurrentPage(e.detail);
    window.addEventListener('navTo', handleNav);
    return () => window.removeEventListener('navTo', handleNav);
  }, []);

  // Page routing
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return React.createElement(HomePage, { onOpenMenu: () => setIsSidebarOpen(true) });
      case 'lisbon': return React.createElement(LisbonPage, null);
      case 'algarve': return React.createElement(AlgarvePage, null);
      case 'food': return React.createElement(FoodPage, null);
      case 'words': return React.createElement(LanguagePage, null);
      case 'animals': return React.createElement(AnimalsPage, null);
      case 'history': return React.createElement(HistoryPage, null);
      case 'quiz': return React.createElement(QuizPage, null);
      case 'game': return React.createElement(MemoryGamePage, null);
      case 'packing': return React.createElement(PackingPage, null);
      case 'sing': return React.createElement(SingPage, null);
      default: return React.createElement(HomePage, { onOpenMenu: () => setIsSidebarOpen(true) });
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return "Aarit & Keev's Adventure!";
      case 'lisbon': return "Lisbon";
      case 'algarve': return "Algarve";
      case 'food': return "Yummy Food";
      case 'words': return "Say It!";
      case 'animals': return "Animals";
      case 'history': return "Fun Stories!";
      case 'quiz': return "Quiz Time!";
      case 'game': return "Memory Game";
      case 'packing': return "Pack My Bag";
      case 'sing': return "Sing Along!";
      default: return "Adventure!";
    }
  };

  return (
    React.createElement('div', { className: "font-nunito text-gray-800 selection:bg-yellow-300 antialiased min-h-screen relative max-w-5xl mx-auto px-4 sm:px-6" },
      React.createElement(GlobalStyles, null),
      React.createElement(Sidebar, { isOpen: isSidebarOpen, onClose: () => setIsSidebarOpen(false), onSelect: setCurrentPage, currentPage: currentPage }),
      React.createElement(Header, {
        title: getPageTitle(),
        onOpenMenu: () => setIsSidebarOpen(true)
      }),
      renderPage()
    )
  );
}

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));