// portugal-kids/js/pages/HomePage.js

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
          onClick: () => { window.dispatchEvent(new CustomEvent('navTo', { detail: btn.id })); },
          className: `${btn.color} border-b-4 hover:-translate-y-1 hover:brightness-110 active:translate-y-1 active:border-b-0 rounded-3xl p-4 flex flex-col items-center justify-center shadow-md transition-all group`
        },
          React.createElement('span', { className: "text-4xl md:text-5xl mb-2 group-hover:scale-110 transition-transform" }, btn.icon),
          React.createElement('span', { className: "font-fredoka text-lg md:text-xl" }, btn.title)
        )
      )
    )
  )
);
