// portugal-kids/js/pages/AlgarvePage.js

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
