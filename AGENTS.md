This is a simple web application for learning Hindi. The application is built with HTML, CSS, and vanilla JavaScript.

## Project Structure

- `index.html`: The main entry point of the application.
- `js/app.js`: Contains the core application logic.
- `css/style.css`: Contains the custom styles for the application.
- `components/`: Contains the HTML for the different sections of the application.
- `content.json`: Contains the data for the lessons and stories.
- `pack_game.json`: Contains the data for the pack game.

## Development

The application is self-contained and does not require any build tools. Simply open `index.html` in a browser to run the application.

## TTS (Text-to-Speech)

The application uses the Web Speech API for text-to-speech functionality. The voice selection logic is in `js/app.js`. When working with the TTS functionality, be aware of the following:

- **Voice Loading:** The list of available voices is loaded asynchronously by the browser. The `speechSynthesis.onvoiceschanged` event is used to detect when the voices are available. The `loadVoices` function in `js/app.js` handles this.
- **Cross-browser Compatibility:** The Web Speech API has varying levels of support across different browsers. The code should be tested on all major browsers, including Chrome, Firefox, Safari, and Edge. Special attention should be paid to mobile browsers, as they may have different behavior.
- **iOS:** The Web Speech API on iOS has some quirks. For example, `speechSynthesis.getVoices()` may return an empty array until the user interacts with the page. The current implementation attempts to handle this, but it's important to be aware of this when making changes.
