// portugal-kids/js/pages/HistoryPage.js

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
