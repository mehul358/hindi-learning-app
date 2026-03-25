// portugal-kids/js/app.js

const App = () => {
  const [page, setPage] = React.useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false); // Add sidebar state

  // Allow dispatching custom event to navigate from the HomePage Quick Links safely without breaking React rules
  React.useEffect(() => {
    const handleNav = (e) => setPage(e.detail);
    window.addEventListener('navTo', handleNav);
    return () => window.removeEventListener('navTo', handleNav);
  }, []);

  const pages = {
    home: { component: HomePage, title: "Aarit & Keev's Adventure!", icon: '🏠' },
    lisbon: { component: LisbonPage, title: 'Lisbon', icon: '🏙️' },
    algarve: { component: AlgarvePage, title: 'Algarve', icon: '🏖️' },
    food: { component: FoodPage, title: 'Yummy Food', icon: '😋' },
    words: { component: LanguagePage, title: 'Say It!', icon: '💬' }, // Changed from 'lang' to 'words' to match sidebar menu items
    animals: { component: AnimalsPage, title: 'Animals', icon: '🐬' },
    history: { component: HistoryPage, title: 'Fun Stories!', icon: '⛵' },
    quiz: { component: QuizPage, title: 'Quiz Time!', icon: '🎯' }, // Changed icon
    game: { component: MemoryGamePage, title: 'Memory Game', icon: '🃏' },
    packing: { component: PackingPage, title: 'Pack My Bag', icon: '🧳' },
    sing: { component: SingPage, title: 'Sing Along!', icon: '🎵' },
  };

  const PageComponent = pages[page].component;

  return (
    React.createElement(React.Fragment, null,
      React.createElement(GlobalStyles, null),
      React.createElement('div', { className: "font-nunito text-gray-800 selection:bg-yellow-300 antialiased min-h-screen relative max-w-5xl mx-auto px-4 sm:px-6" }, // Moved from main div to here
        React.createElement(Sidebar, { 
          isOpen: isSidebarOpen, 
          onClose: () => setIsSidebarOpen(false), 
          onSelect: setPage, // Pass setPage directly
          currentPage: page 
        }),
        React.createElement('div', { className: `flex-grow transition-all duration-300 ${isSidebarOpen ? 'pl-72' : 'pl-0'}` }, // Adjust padding based on sidebar
          React.createElement(Header, { title: pages[page].title, onOpenMenu: () => setIsSidebarOpen(true) }), // Pass onOpenMenu
          React.createElement('main', { className: "p-4 md:p-8" },
            React.createElement(PageComponent, { onOpenMenu: () => setIsSidebarOpen(true) }) // Pass onOpenMenu to HomePage for quick links button
          )
        )
      )
    )
  );
};

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
