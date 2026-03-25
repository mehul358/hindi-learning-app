// portugal-kids/js/pages/AnimalsPage.js

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
