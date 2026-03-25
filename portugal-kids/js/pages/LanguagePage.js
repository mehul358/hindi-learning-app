// portugal-kids/js/pages/LanguagePage.js

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
