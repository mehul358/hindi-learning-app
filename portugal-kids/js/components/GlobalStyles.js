// portugal-kids/js/components/GlobalStyles.js

const GlobalStyles = () => (
  React.createElement('style', null, `@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;800;900&display=swap');
    .font-fredoka { font-family: 'Fredoka One', cursive; }
    .font-nunito { font-family: 'Nunito', sans-serif; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    body {
      background-color: #FFF9F0;
      background-image: radial-gradient(circle, #ffd93d44 2px, transparent 2px), radial-gradient(circle, #ff6b3533 1px, transparent 1px);
      background-size: 60px 60px, 30px 30px;
      background-position: 0 0, 15px 15px;
    }`)
);
