// portugal-kids/js/app.js

const App = () => {
  const [page, setPage] = React.useState('home');

  const pages = {
    home: { component: HomePage, title: 'Home', icon: '🏠' },
    lisbon: { component: LisbonPage, title: 'Lisbon', icon: '🚃' },
    algarve: { component: AlgarvePage, title: 'Algarve', icon: '🏖️' },
    food: { component: FoodPage, title: 'Food', icon: '😋' },
    lang: { component: LanguagePage, title: 'Language', icon: '💬' },
    animals: { component: AnimalsPage, title: 'Animals', icon: '🐬' },
    history: { component: HistoryPage, title: 'History', icon: '⛵' },
    quiz: { component: QuizPage, title: 'Quiz', icon: '❓' },
    memory: { component: MemoryGamePage, title: 'Memory Game', icon: '🃏' },
    packing: { component: PackingPage, title: 'Packing List', icon: '🧳' },
    sing: { component: SingPage, title: 'Sing Along', icon: '🎶' },
  };

  const PageComponent = pages[page].component;

  return (
    React.createElement(React.Fragment, null,
      React.createElement(GlobalStyles, null),
      React.createElement('div', { className: 'flex' },
        React.createElement(Sidebar, { pages, page, setPage }),
        React.createElement('div', { className: "flex-grow pl-16 md:pl-56 transition-all duration-300" },
          React.createElement(Header, { title: pages[page].title, icon: pages[page].icon }),
          React.createElement('main', { className: "p-4 md:p-8" },
            React.createElement(PageComponent, null)
          )
        )
      )
    )
  );
};

ReactDOM.render(React.createElement(App), document.getElementById('root'));
