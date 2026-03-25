// portugal-kids/js/components/SectionHero.js

const SectionHero = ({ emoji, title, subtitle, bgClass }) => (
  React.createElement('div', { className: `rounded-3xl p-8 mb-8 text-center text-white shadow-xl border-4 border-white/20 relative overflow-hidden ${bgClass}` },
    React.createElement('div', { className: "absolute top-2 left-4 text-3xl opacity-50 animate-pulse" }, "⭐"),
    React.createElement('div', { className: "absolute bottom-4 right-8 text-4xl opacity-50 animate-pulse delay-300" }, "🌟"),
    React.createElement('span', { className: "text-6xl md:text-7xl block mb-2 drop-shadow-lg animate-bounce" }, emoji),
    React.createElement('h1', { className: "font-fredoka text-4xl md:text-5xl mb-2 drop-shadow-md" }, title),
    React.createElement('p', { className: "font-nunito font-bold text-xl md:text-2xl opacity-90" }, subtitle),
    React.createElement('div', { className: "absolute top-2 right-2" },
      React.createElement(SpeakerButton, { text: `${title}. ${subtitle}`, className: "text-black" })
    )
  )
);
