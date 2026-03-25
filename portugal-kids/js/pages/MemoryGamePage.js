// portugal-kids/js/pages/MemoryGamePage.js

const MemoryGamePage = () => {
  const emojis = ['🇵🇹', '🚃', '🏖️', '🥧', '🐬', '🐓'];
  const emojiNames = {'🇵🇹': 'Portugal', '🚃': 'Yellow Tram', '🏖️': 'Beach', '🥧': 'Pastel de nata', '🐬': 'Dolphin', '🐓': 'Lucky Rooster'};
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
            const isMatched = matched.includes(i);
            return (
              React.createElement('div', { 
                key: i, 
                onClick: () => handleFlip(i),
                className: `aspect-square rounded-2xl flex items-center justify-center text-5xl md:text-6xl cursor-pointer transition-all duration-300 border-b-4 shadow-md ${isFlipped ? (isMatched ? 'bg-green-200 border-green-400' : 'bg-white border-gray-200') : 'bg-blue-500 border-blue-700 hover:-translate-y-1 active:translate-y-1'}`
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
