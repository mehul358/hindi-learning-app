// portugal-kids/js/pages/PackingPage.js

const PackingPage = () => {
  const [packed, setPacked] = React.useState({});
  const togglePack = (item) => {
    // This safely strips the emojis from the beginning so it speaks clearly
    const itemName = item.replace(/[^\x00-\x7F]/g, "").trim(); 
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

        sections.map((sec, i) => (
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
        ))
      )
    )
  );
};
