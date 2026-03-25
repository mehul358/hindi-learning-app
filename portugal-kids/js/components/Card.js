// portugal-kids/js/components/Card.js

const Card = ({ emoji, title, text, fact, colorClass, borderClass }) => (
  React.createElement('div', { className: `bg-white rounded-3xl p-6 shadow-lg border-b-4 ${borderClass} hover:-translate-y-2 transition-transform cursor-pointer relative`, onClick: () => speakText(`${title}. ${text} ${fact || ''}`) },
    React.createElement('span', { className: "text-5xl block mb-3" }, emoji),
    React.createElement('h3', { className: `font-fredoka text-2xl mb-2 ${colorClass}` }, title),
    React.createElement('p', { className: "font-nunito font-bold text-gray-600 leading-relaxed mb-2" }, text),
    fact && (
      React.createElement('div', { className: "bg-orange-50 rounded-xl p-3 mt-3 text-sm font-bold text-gray-800 border border-orange-100" },
        "🌟 ", fact
      )
    )
  )
);
