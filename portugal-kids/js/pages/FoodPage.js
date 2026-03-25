// portugal-kids/js/pages/FoodPage.js

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
