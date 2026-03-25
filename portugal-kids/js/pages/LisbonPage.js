// portugal-kids/js/pages/LisbonPage.js

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
