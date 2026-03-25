// portugal-kids/js/components/SpeakerButton.js

const SpeakerButton = ({ text, lang = 'en-US', className = '' }) => (
  React.createElement('button', {
    onClick: (e) => {
      e.stopPropagation();
      speakText(text, lang);
    },
    className: `bg-white rounded-full p-2 shadow-md hover:bg-yellow-100 active:scale-90 transition-transform flex items-center justify-center shrink-0 ${className}`,
    'aria-label': "Read to me"
  },
    React.createElement('span', { className: "text-xl" }, "🔊")
  )
);
