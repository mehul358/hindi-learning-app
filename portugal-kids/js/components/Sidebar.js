// portugal-kids/js/components/Sidebar.js

const Sidebar = ({ isOpen, onClose, onSelect, currentPage }) => {
  const menuItems = [
    { id: 'home', icon: '🏠', title: 'Home' },
    { id: 'lisbon', icon: '🏙️', title: 'Lisbon' },
    { id: 'algarve', icon: '🏖️', title: 'Algarve' },
    { id: 'food', icon: '🍽️', title: 'Food' },
    { id: 'words', icon: '💬', title: 'Say It!' },
    { id: 'animals', icon: '🐬', title: 'Animals' },
    { id: 'history', icon: '⛵', title: 'Stories' },
    { id: 'quiz', icon: '🎯', title: 'Quiz!' },
    { id: 'game', icon: '🃏', title: 'Memory' },
    { id: 'packing', icon: '🧳', title: 'Packing' },
    { id: 'sing', icon: '🎵', title: 'Sing!' }
  ];

  return (
    React.createElement(React.Fragment, null,
      React.createElement('div', {
        className: `fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`,
        onClick: onClose
      }),
      React.createElement('div', { className: `fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-gradient-to-b from-sky-400 to-blue-500 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}` },
        React.createElement('div', { className: "p-4 border-b-4 border-white/20 flex justify-between items-center bg-white/10" },
          React.createElement('span', { className: "font-fredoka text-2xl text-white drop-shadow-md" }, "🧭 Explore!"),
          React.createElement('button', { onClick: onClose, className: "text-white text-2xl bg-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/30 border-2 border-white/50 active:scale-95 transition-transform" }, "❌")
        ),
        React.createElement('div', { className: "flex-1 overflow-y-auto p-4 flex flex-col gap-2" },
          menuItems.map(btn => (
            React.createElement('button', {
              key: btn.id,
              onClick: () => { onSelect(btn.id); onClose(); window.speechSynthesis.cancel(); },
              className: `font-fredoka text-xl p-3 rounded-2xl flex items-center gap-4 transition-all border-2 ${currentPage === btn.id ? 'bg-white text-blue-600 border-white translate-x-2 shadow-md' : 'bg-white/10 text-white border-transparent hover:bg-white/20 hover:translate-x-1'}`
            },
              React.createElement('span', { className: "text-3xl" }, btn.icon),
              btn.title
            )
          ))
        )
      )
    )
  );
};
