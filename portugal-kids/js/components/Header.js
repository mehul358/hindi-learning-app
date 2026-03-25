// portugal-kids/js/components/Header.js

const Header = ({ title, onOpenMenu }) => (
  React.createElement('div', { className: "sticky top-0 z-50 bg-gradient-to-r from-sky-500 to-blue-500 p-4 shadow-lg flex items-center justify-between text-white rounded-b-3xl mb-6 border-b-4 border-blue-600" },
    React.createElement('button', { onClick: onOpenMenu, className: "bg-white/20 hover:bg-white/30 p-2 rounded-xl font-fredoka flex items-center gap-2 transition-all active:scale-95 border-2 border-white/50" },
      React.createElement('span', { className: "text-xl" }, "☰"), " ", React.createElement('span', { className: "hidden sm:inline" }, "Menu")
    ),
    React.createElement('h1', { className: "font-fredoka text-2xl md:text-3xl tracking-wide drop-shadow-md text-center flex-1" }, title),
    React.createElement('div', { className: "w-12 text-3xl animate-bounce text-center" }, "🇵🇹")
  )
);
