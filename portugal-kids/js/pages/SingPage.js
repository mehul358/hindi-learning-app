// portugal-kids/js/pages/SingPage.js

const SingPage = () => {
  const songs = [
    {
      title: "Galo de Barcelos (The Lucky Rooster)",
      emoji: "🐓",
      lyrics: [
        "The rooster of Barcelos, so colorful and bright,",
        "Stood up on the table, and crowed with all his might!",
        "He saved a man from trouble, a lucky thing to see,",
        "Now he brings good fortune, to you and to me!"
      ],
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-600"
    },
    {
      title: "Vamos à Praia (Let's Go to the Beach)",
      emoji: "🏖️",
      lyrics: [
        "Let's go to the beach, a praia so grand,",
        "With golden sand, the best in the land.",
        "Build a big sandcastle, dig a deep hole,",
        "Splash in the water, it's good for the soul!"
      ],
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      textColor: "text-sky-600"
    },
    {
      title: "Pastel de Nata",
      emoji: "🥧",
      lyrics: [
        "Yummy, yummy, in my tummy,",
        "A sweet little tart for me.",
        "Crispy, flaky, warm, and yellow,",
        "The best treat, you will agree!"
      ],
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-600"
    }
  ];
  
  const singSong = (song) => {
      const fullText = song.title + ". " + song.lyrics.join(". ");
      speakText(fullText, "en-US");
  }

  return (
    React.createElement('div', { className: "animate-fade-in pb-12" },
      React.createElement(SectionHero, { emoji: "🎶", title: "Sing Along!", subtitle: "Learn these fun songs about Portugal!", bgClass: "bg-gradient-to-br from-rose-400 to-cyan-400" }),
      
      React.createElement('div', { className: "grid grid-cols-1 gap-6" },
        songs.map((song, i) => (
          React.createElement('div', { key: i, className: `p-6 rounded-3xl shadow-lg border-b-4 ${song.bgColor} ${song.borderColor}` },
            React.createElement('div', { className: "flex items-start justify-between" }, 
              React.createElement('div', null,
                React.createElement('h2', { className: `font-fredoka text-2xl mb-2 ${song.textColor}` }, song.emoji + " " + song.title),
                React.createElement('div', { className: "font-nunito text-lg text-gray-700 space-y-1" },
                  song.lyrics.map((line, j) => React.createElement('p', { key: j }, line))
                )
              ),
              React.createElement('button', { onClick: () => singSong(song), className: "text-5xl hover:scale-110 active:scale-90 transition-transform ml-4" }, "🎤")
            )
          )
        ))
      )
    )
  );
};
