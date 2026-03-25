// portugal-kids/js/pages/QuizPage.js

const QuizPage = () => {
  const questions = [
    { q: "What is the capital of Portugal?", a: "Lisbon", options: ["Porto", "Lisbon", "Faro"], emoji: "🏙️" },
    { q: "What is the lucky animal of Portugal?", a: "Rooster", options: ["Dolphin", "Rooster", "Cat"], emoji: "🐓" },
    { q: "What is the famous yellow tram number?", a: "28", options: ["10", "28", "1"], emoji: "🚃" },
    { q: "What is the yummy egg tart called?", a: "Pastel de Nata", options: ["Pastel de Nata", "Sardine", "Sumol"], emoji: "🥧" },
    { q: "Where are the best beaches?", a: "Algarve", options: ["Lisbon", "Porto", "Algarve"], emoji: "🏖️" },
  ];
  const [currentQ, setCurrentQ] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [result, setResult] = React.useState(null); // null, 'correct', or 'wrong'

  const handleAnswer = (answer) => {
    if (showAnswer) return;
    const isCorrect = answer === questions[currentQ].a;
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore(score + 1);
      speakText("Correct! Well done!", "en-US");
    } else {
      speakText(`Oh no! The right answer was ${questions[currentQ].a}`, "en-US");
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setResult(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // End of quiz
      speakText(`Quiz finished! You got ${score} out of ${questions.length}.`, "en-US");
    }
  };
  
  const resetQuiz = () => {
      setCurrentQ(0);
      setScore(0);
      setShowAnswer(false);
      setResult(null);
  }

  const isQuizFinished = currentQ === questions.length - 1 && showAnswer;

  return (
    React.createElement('div', { className: 'animate-fade-in pb-12' },
      React.createElement(SectionHero, { emoji: "❓", title: "Portugal Quiz!", subtitle: "Test your knowledge!", bgClass: "bg-gradient-to-br from-green-400 to-cyan-400" }),
      
      React.createElement('div', {className: 'bg-white rounded-3xl p-6 shadow-xl border-4 border-green-300 max-w-2xl mx-auto'},
          
          isQuizFinished ? (
              React.createElement('div', {className: 'text-center'},
                  React.createElement('h2', {className: 'font-fredoka text-3xl text-green-700 mb-2'}, 'Quiz Complete!'),
                  React.createElement('p', {className: 'font-nunito font-bold text-xl text-gray-600 mb-4'}, `Your final score is:`),
                  React.createElement('div', {className: 'text-7xl font-fredoka text-green-500 mb-6 animate-bounce'}, `${score} / ${questions.length}`),
                  React.createElement('button', {onClick: resetQuiz, className: 'bg-green-500 text-white font-fredoka text-xl py-3 px-6 rounded-full shadow-lg border-b-4 border-green-700 hover:-translate-y-1 transition-all'}, 'Play Again!')
              )
          ) : (
              React.createElement(React.Fragment, null, 
                  React.createElement('div', {className: 'flex justify-between items-center mb-4'},
                      React.createElement('div', {className: 'font-nunito font-bold text-lg text-gray-600'}, `Question ${currentQ + 1} of ${questions.length}`),
                      React.createElement('div', {className: 'font-nunito font-bold text-lg text-green-600'}, `Score: ${score}`)
                  ),

                  React.createElement('div', {className: 'bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-6'},
                      React.createElement('span', {className: 'text-6xl mb-3 block'}, questions[currentQ].emoji),
                      React.createElement('h2', { className: 'font-fredoka text-2xl md:text-3xl text-green-800' }, questions[currentQ].q)
                  ),

                  React.createElement('div', {className: 'grid grid-cols-1 gap-3'},
                      questions[currentQ].options.map(option => {
                          const isCorrect = option === questions[currentQ].a;
                          let buttonClass = 'bg-white border-b-4 border-gray-300 hover:bg-gray-100';
                          if(showAnswer) {
                              if(isCorrect) buttonClass = 'bg-green-300 border-green-500 animate-pulse';
                              else buttonClass = 'bg-red-200 border-red-400 opacity-60';
                          }

                          return React.createElement('button', {
                              key: option,
                              onClick: () => handleAnswer(option),
                              disabled: showAnswer,
                              className: `w-full text-left font-nunito font-bold text-xl p-4 rounded-xl shadow-sm transition-all ${buttonClass}`
                          }, option)
                      })
                  ),

                  showAnswer && (
                      React.createElement('div', {className: 'text-center mt-6 animate-fade-in'},
                          React.createElement('p', {className: `font-fredoka text-2xl ${result === 'correct' ? 'text-green-600' : 'text-red-600'}`}, result === 'correct' ? "Correct! 🎉" : "Oh no! 😥"),
                          result === 'wrong' && React.createElement('p', {className: 'font-nunito font-bold text-gray-600 mt-1'}, `The correct answer was: ${questions[currentQ].a}`),
                          React.createElement('button', { onClick: handleNext, className: 'mt-4 bg-blue-500 text-white font-fredoka text-xl py-3 px-8 rounded-full shadow-lg border-b-4 border-blue-700 hover:-translate-y-1 transition-all'},
                              currentQ < questions.length - 1 ? 'Next Question' : 'Finish Quiz'
                          )
                      )
                  )
              )
          )

      )
    )
  );
};
