// --- DATA (will be fetched) ---
let lessons = [];
let stories = [];
let allSentences = [];

let starCount = 0;
let currentSpeakSentence, currentQuizWord, currentQuestion;
let languageMode = 'hindi'; // 'dual' or 'hindi'
let currentLessonIndex = 0;
let currentSentenceIndex = 0;
let availableVoices = [];
let packGameData = {};
let currentPackLevel = 0;
let itemsToPack = [];
let packedItems = [];
let packScore = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Levenshtein Distance ---
function levenshtein(s1, s2) {
    if (s1.length < s2.length) {
        return levenshtein(s2, s1);
    }
    if (s2.length === 0) {
        return s1.length;
    }
    let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
    for (let i = 0; i < s1.length; i++) {
        let currentRow = [i + 1];
        for (let j = 0; j < s2.length; j++) {
            let insertions = previousRow[j + 1] + 1;
            let deletions = currentRow[j] + 1;
            let substitutions = previousRow[j] + (s1[i] !== s2[j]);
            currentRow.push(Math.min(insertions, deletions, substitutions));
        }
        previousRow = currentRow;
    }
    return previousRow[s2.length];
}


// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false;
let recognitionMode = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { isRecognizing = true; const el = document.getElementById(recognitionMode === 'speak' ? 'speech-feedback' : 'qa-feedback'); if (el) el.textContent = 'Listening... 👂'; document.getElementById(recognitionMode === 'speak' ? 'record-btn' : 'qa-record-btn').classList.add('recording'); };
    recognition.onend = () => { isRecognizing = false; const el = document.getElementById(recognitionMode === 'speak' ? 'speech-feedback' : 'qa-feedback'); if (el && el.textContent === 'Listening... 👂') el.textContent = ''; document.getElementById(recognitionMode === 'speak' ? 'record-btn' : 'qa-record-btn').classList.remove('recording'); };
    recognition.onresult = (event) => { const transcript = event.results[0][0].transcript.toLowerCase(); if (recognitionMode === 'speak') processSpeakResult(transcript); else if (recognitionMode === 'qa') processQaResult(transcript); };
    recognition.onerror = (event) => { console.error("Speech recognition error", event.error); const el = document.getElementById(recognitionMode === 'speak' ? 'speech-feedback' : 'qa-feedback'); if (event.error === 'not-allowed' || event.error === 'service-not-allowed') el.textContent = 'Please allow microphone!'; else el.textContent = 'Oops! Try again.'; };
}

// --- TTS using Web Speech API ---
function stopAllAudio() {
    window.speechSynthesis.cancel();
    // If there were other audio sources, I would stop them here as well.
}

function playSound(primaryText, secondaryText = null) {
    stopAllAudio(); // Stop any currently playing speech

    if (languageMode === 'dual' && secondaryText) {
        const englishUtterance = new SpeechSynthesisUtterance(secondaryText);
        const savedEnglishVoiceURI = localStorage.getItem('englishVoiceURI');
        const englishVoice = availableVoices.find(v => v.voiceURI === savedEnglishVoiceURI);
        englishUtterance.voice = englishVoice || availableVoices.find(v => v.lang.startsWith('en-'));
        englishUtterance.lang = 'en-US';
        englishUtterance.rate = 0.9;

        const hindiUtterance = new SpeechSynthesisUtterance(primaryText);
        const savedHindiVoiceURI = localStorage.getItem('hindiVoiceURI');
        const hindiVoice = availableVoices.find(v => v.voiceURI === savedHindiVoiceURI);
        hindiUtterance.voice = hindiVoice || availableVoices.find(v => v.lang.startsWith('hi-'));
        hindiUtterance.lang = 'hi-IN';
        hindiUtterance.rate = 0.9;

        englishUtterance.onend = () => {
            window.speechSynthesis.speak(hindiUtterance);
        };
        window.speechSynthesis.speak(englishUtterance);
    } else {
        const utterance = new SpeechSynthesisUtterance(primaryText);
        if (/^[a-zA-Z0-9\s.,?!']+$/.test(primaryText)) {
            const savedEnglishVoiceURI = localStorage.getItem('englishVoiceURI');
            utterance.voice = availableVoices.find(v => v.voiceURI === savedEnglishVoiceURI);
            utterance.lang = 'en-US';
        } else {
            const savedHindiVoiceURI = localStorage.getItem('hindiVoiceURI');
            utterance.voice = availableVoices.find(v => v.voiceURI === savedHindiVoiceURI);
            utterance.lang = 'hi-IN';
        }
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// --- UI Control ---
async function loadComponent(sectionId) {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement.innerHTML.trim() === '') {
        try {
            const response = await fetch(`components/${sectionId}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${sectionId}`);
            }
            sectionElement.innerHTML = await response.text();
        } catch (error) {
            console.error(error);
            sectionElement.innerHTML = `<p class="text-red-500 text-center">Error loading content.</p>`;
        }
    }
}

async function showSection(sectionId) {
    stopAllAudio();
    await loadComponent(sectionId);

    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navButton = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (navButton) {
        navButton.classList.add('active');
    }

    const handler = {
        lessons: () => loadLessons(currentLessonIndex),
        speak: loadSpeakSection,
        stories: loadStoriesSection,
        quiz: startQuiz,
        pack: loadPackGame,
    };

    if(handler[sectionId]) {
        handler[sectionId]();
    }

    // Close side panel after navigation
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('side-panel-overlay');
    sidePanel.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
}

function updateStarCount() { starCount++; const el = document.getElementById('star-count'); el.innerText = starCount; el.parentElement.style.transform = 'scale(1.1)'; setTimeout(() => el.parentElement.style.transform = 'scale(1)', 200); }
function showFeedback(correct, customText = null) {
    if (customText) {
        const modal = document.getElementById('feedback-modal');
        const emoji = document.getElementById('feedback-emoji');
        const text = document.getElementById('feedback-text');
        if (correct) {
            emoji.innerText = '🎉';
            text.innerText = customText || 'शाबाश!';
            text.style.color = 'var(--accent-green)';
            playSound(customText || 'शाबाश!');
            updateStarCount();
            triggerConfetti();
        } else {
            emoji.innerText = '🤔';
            text.innerText = customText || 'फिर से कोशिश करो';
            text.style.color = 'var(--accent-red)';
            playSound(customText || 'ओह! फिर से कोशिश करो');
        }
        modal.classList.add('visible');
        setTimeout(() => modal.classList.remove('visible'), 2000);
    } else if (!correct) {
        playSound('ओह! फिर से कोशिश करो');
    }
}

// --- Side Panel ---
function toggleSidePanel() {
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('side-panel-overlay');
    sidePanel.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function populateSidePanel() {
    const panel = document.getElementById('side-panel');
    panel.innerHTML = `
        <div class="p-6">
            <img src="melo.png" alt="App Logo" class="h-20 w-auto mx-auto mb-4">
            <h2 class="text-2xl font-balsamiq text-center text-primary mb-8">Hindi Fun!</h2>

            <div class="space-y-2">
                <a href="#" onclick="showSection('lessons')" class="side-panel-link" data-section="lessons">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <span>Learn</span>
                </a>
                <a href="#" onclick="showSection('stories')" class="side-panel-link" data-section="stories">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    <span>Stories</span>
                </a>
                <a href="#" onclick="showSection('speak')" class="side-panel-link" data-section="speak">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                    <span>Speak</span>
                </a>
                <a href="#" onclick="showSection('quiz')" class="side-panel-link" data-section="quiz">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    <span>Quiz</span>
                </a>
                <a href="#" onclick="showSection('pack')" class="side-panel-link" data-section="pack">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"></path><path d="M8 6v-2h8v2"></path><path d="M12 12v4"></path><path d="M10 14h4"></path></svg>
                    <span>Pack</span>
                </a>
            </div>

            <hr class="my-6 border-gray-200">

            <h3 class="text-lg font-balsamiq text-gray-600 mb-4">Settings</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Language Mode</label>
                    <div class="flex p-1 bg-gray-200 rounded-full">
                        <button id="toggle-dual-lessons" onclick="setLanguageMode('dual')" class="lang-toggle-btn font-bold py-1 px-3 rounded-full text-sm w-full">A / अ</button>
                        <button id="toggle-hindi-lessons" onclick="setLanguageMode('hindi')" class="lang-toggle-btn font-bold py-1 px-3 rounded-full text-sm w-full">अ</button>
                    </div>
                </div>
                <div>
                    <label for="english-voice-select" class="block text-sm font-medium text-gray-700">English Voice</label>
                    <select id="english-voice-select" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></select>
                </div>
                <div>
                    <label for="hindi-voice-select" class="block text-sm font-medium text-gray-700">Hindi Voice</label>
                    <select id="hindi-voice-select" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></select>
                </div>
            </div>
        </div>
    `;
    populateVoiceSelectors();
    setLanguageMode(languageMode); // Re-apply current language mode to buttons
}


// --- Confetti ---
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.classList.add('confetti-piece');
        confettiPiece.style.left = Math.random() * 100 + 'vw';
        confettiPiece.style.animation = `fall ${Math.random() * 2 + 3}s linear ${Math.random() * 2}s forwards`;
        container.appendChild(confettiPiece);
        setTimeout(() => confettiPiece.remove(), 5000);
    }
}
const keyframes = `@keyframes fall { to { transform: translateY(120vh) rotate(${Math.random() * 360}deg); opacity: 1; } }`;
const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = keyframes; document.head.appendChild(styleSheet);

// --- Lessons Logic ---
function setLanguageMode(mode) {
    languageMode = mode;
    document.getElementById('toggle-dual-lessons').classList.toggle('active', mode === 'dual');
    document.getElementById('toggle-hindi-lessons').classList.toggle('active', mode === 'hindi');

    const activeSection = document.querySelector('.page-section.active');
    if (activeSection) {
        if (activeSection.id === 'lessons') {
            renderCurrentSentence();
        } else if (activeSection.id === 'stories') {
            loadStoryContent(0); // Assuming we reload the first story topic
        }
    }
}

function handleLessonChange(index) {
    currentLessonIndex = index;
    const dropdownButton = document.getElementById('custom-dropdown-button');
    const optionsContainer = document.getElementById('custom-dropdown-options');
    dropdownButton.innerHTML = `${lessons[index].emoji} ${lessons[index].title} <span class="ml-auto text-xs">▼</span>`;
    optionsContainer.classList.remove('show');
    loadLessons(index);
}

function populateLessonDropdown() {
    const container = document.getElementById('custom-dropdown-container');
    if (!container) return;
    container.innerHTML = ''; // Clear previous

    const dropdownButton = document.createElement('button');
    dropdownButton.id = 'custom-dropdown-button';
    dropdownButton.className = 'text-white font-bold py-3 px-4 rounded-xl w-full flex items-center justify-between text-left';
    dropdownButton.style.backgroundColor = '#36D9D9';
    dropdownButton.innerHTML = `<div>${lessons[currentLessonIndex].emoji} ${lessons[currentLessonIndex].title}</div> <span class="ml-auto text-xs">▼</span>`;

    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'custom-dropdown-options';
    optionsContainer.className = 'custom-dropdown-options';

    lessons.forEach((lesson, index) => {
        const option = document.createElement('div');
        option.className = 'custom-dropdown-option';
        option.textContent = `${lesson.emoji} ${lesson.title}`;
        option.dataset.index = index;
        option.onclick = (e) => {
            e.stopPropagation();
            handleLessonChange(index);
        };
        optionsContainer.appendChild(option);
    });

    container.appendChild(dropdownButton);
    container.appendChild(optionsContainer);

    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsContainer.classList.toggle('show');
    });
}

function loadLessons(lessonIndex) {
    currentLessonIndex = lessonIndex;
    currentSentenceIndex = 0;
    populateLessonDropdown();
    renderCurrentSentence();
    document.getElementById('prev-sentence-btn').addEventListener('click', showPreviousSentence);
    document.getElementById('next-sentence-btn').addEventListener('click', showNextSentence);
}

function renderCurrentSentence() {
    const lesson = lessons[currentLessonIndex];
    if (!lesson || !lesson.sentences) return;
    const item = lesson.sentences[currentSentenceIndex];
    const container = document.getElementById('lesson-card-container');
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'custom-card p-4 text-center flex flex-col items-center justify-between';
    card.innerHTML = `
        <div class="text-6xl h-24 flex items-center justify-center">${item.image}</div>
        <div class="mt-2">
            <p class="text-md font-semibold ${languageMode === 'hindi' ? 'hidden' : ''}">${item.english}</p>
            <p class="text-xl font-balsamiq text-gray-700">${item.hindi}</p>
        </div>
    `;
    card.onclick = () => playSound(item.hindi, item.english);
    container.appendChild(card);

    document.getElementById('sentence-counter').textContent = `${currentSentenceIndex + 1} / ${lesson.sentences.length}`;
    document.getElementById('prev-sentence-btn').disabled = currentSentenceIndex === 0;
    document.getElementById('next-sentence-btn').disabled = currentSentenceIndex === lesson.sentences.length - 1;
}

function showNextSentence() {
    const lesson = lessons[currentLessonIndex];
    if (currentSentenceIndex < lesson.sentences.length - 1) {
        currentSentenceIndex++;
        renderCurrentSentence();
        const currentSentence = lesson.sentences[currentSentenceIndex];
        playSound(currentSentence.hindi, currentSentence.english);
    }
}

function showPreviousSentence() {
    if (currentSentenceIndex > 0) {
        currentSentenceIndex--;
        renderCurrentSentence();
        const currentSentence = lessons[currentLessonIndex].sentences[currentSentenceIndex];
        playSound(currentSentence.hindi, currentSentence.english);
    }
}

// --- Speak & Repeat Logic ---
function loadSpeakSection() {
    allSentences = lessons.flatMap(lesson => lesson.sentences);
    currentSpeakSentence = allSentences[Math.floor(Math.random() * allSentences.length)];
    const card = document.getElementById('speak-card');
    card.innerHTML = `
        <p class="text-md text-gray-500 mb-2">Listen and then repeat:</p>
        <p class="text-3xl font-balsamiq text-gray-800 mb-4">${currentSpeakSentence.hindi}</p>
        <div class="text-8xl h-32 flex items-center justify-center">${currentSpeakSentence.image}</div>
        <button onclick="playSound('${currentSpeakSentence.hindi}')" class="bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold p-3 rounded-full text-2xl mt-4 transition-colors">🔊</button>
    `;
    document.getElementById('speech-feedback').textContent = '';
    document.getElementById('record-btn').onclick = () => { recognitionMode = 'speak'; if (!isRecognizing) recognition.start(); };
    document.getElementById('prev-speak-btn').addEventListener('click', loadSpeakSection);
    document.getElementById('next-speak-btn').addEventListener('click', loadSpeakSection);
}
function updateSpeakProgress(similarity) {
    const progressBar = document.getElementById('speak-progress');
    const percentage = Math.round(similarity * 100);
    progressBar.style.width = `${percentage}%`;

    if (similarity > 0.8) {
        progressBar.style.backgroundColor = 'var(--accent-green)';
        showFeedback(true, null); // Play clap sound
    } else if (similarity > 0.5) {
        progressBar.style.backgroundColor = 'var(--accent-yellow)';
        showFeedback(false, null); // Play buzzer sound
    } else {
        progressBar.style.backgroundColor = 'var(--accent-red)';
        showFeedback(false, null); // Play buzzer sound
    }
}

function processSpeakResult(transcript) {
    const expected = currentSpeakSentence.hindi.toLowerCase();
    const distance = levenshtein(transcript, expected);
    const similarity = 1 - distance / Math.max(transcript.length, expected.length);
    const feedbackEl = document.getElementById('speech-feedback');

    updateSpeakProgress(similarity);

    if (similarity > 0.8) {
        feedbackEl.textContent = 'Perfect!';
        feedbackEl.style.color = 'var(--accent-green)';
        setTimeout(() => {
            loadSpeakSection();
            document.getElementById('speak-progress').style.width = '0%';
            feedbackEl.textContent = '';
        }, 2500);
    } else if (similarity > 0.5) {
        feedbackEl.textContent = 'So close! Try again.';
        feedbackEl.style.color = 'var(--accent-yellow)';
    } else {
        feedbackEl.textContent = 'Give it another try!';
        feedbackEl.style.color = 'var(--accent-red)';
    }
}

// --- Stories Logic ---
function loadStoriesSection() {
    const topicsContainer = document.getElementById('story-topics-container');
    topicsContainer.innerHTML = '';
    stories.forEach((topic, index) => {
        const button = document.createElement('button');
        button.className = 'custom-card p-4 text-center text-lg font-bold topic-button';
        button.innerHTML = `<div class="text-4xl mb-2">${topic.emoji}</div><div>${topic.topic}</div>`;
        button.onclick = () => loadStoryContent(index);
        topicsContainer.appendChild(button);
    });
    // Initially load the first topic's stories
    if (stories.length > 0) {
        loadStoryContent(0);
    }
}

function loadStoryContent(topicIndex) {
    const storyDisplay = document.getElementById('story-display-container');
    const topic = stories[topicIndex];
    storyDisplay.innerHTML = '';

    topic.content.forEach(story => {
        const card = document.createElement('div');
        card.className = 'custom-card p-4';
        card.innerHTML = `
            <h3 class="text-xl font-balsamiq mb-2">${story.title}</h3>
            <p class="text-gray-600">${languageMode === 'dual' ? story.english : story.hindi}</p>
        `;
        card.onclick = () => playSound(story.hindi, story.english);
        storyDisplay.appendChild(card);
    });
}

// --- Quiz Logic ---
function startQuiz() {
    allSentences = lessons.flatMap(lesson => lesson.sentences);
    currentQuizWord = allSentences[Math.floor(Math.random() * allSentences.length)];
    let options = allSentences.filter(item => item.id !== currentQuizWord.id);
    options = options.sort(() => 0.5 - Math.random()).slice(0, 3);
    options.push(currentQuizWord);
    options = options.sort(() => 0.5 - Math.random());

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'custom-card p-2 flex items-center justify-center aspect-square'; // Reduced padding
        card.innerHTML = `<div class="text-5xl">${option.image}</div>`; // Reduced text size
        card.onclick = () => checkAnswer(option.id);
        optionsContainer.appendChild(card);
    });
    document.getElementById('play-quiz-audio').onclick = () => playSound(currentQuizWord.hindi);
}
function checkAnswer(selectedId) {
    const feedbackEl = document.getElementById('quiz-feedback');
    if (selectedId === currentQuizWord.id) {
        feedbackEl.innerHTML = `<div class="text-6xl">🎉</div><p class="font-bold" style="color: var(--accent-green);">Correct!</p>`;
        showFeedback(true, null);
        updateStarCount();
        setTimeout(startQuiz, 1500);
    } else {
        feedbackEl.innerHTML = `<div class="text-6xl">🤔</div><p class="font-bold" style="color: var(--accent-red);">Try again!</p>`;
        showFeedback(false, null);
    }
}

// --- Pack Game Logic ---
function loadPackGame() {
    const levelData = packGameData.levels[currentPackLevel];
    itemsToPack = [...levelData.commands];
    packedItems = [];
    document.getElementById('pack-score').textContent = packScore;

    const conveyorBelt = document.getElementById('conveyor-belt');
    const meloTripImage = document.getElementById('melo-trip-image');
    if (meloTripImage) {
        const theme = levelData.theme.toLowerCase().replace(' ', '-');
        meloTripImage.src = `melo-${theme}.png`;
    }

    const correctItems = levelData.commands.map(c => c.item);
    const allItems = [...correctItems, ...levelData.distractor_items];
    const shuffledItems = allItems.sort(() => 0.5 - Math.random());

    const conveyorContent = shuffledItems.map(item => `
        <div class="inline-block p-2 m-2 bg-white rounded-lg shadow-md draggable text-6xl" data-item="${item}">
            ${item}
        </div>
    `).join('');

    conveyorBelt.innerHTML = conveyorContent + conveyorContent; // Duplicate for seamless loop

    addItemClickListener();
    playNextPackCommand();

    document.getElementById('repeat-pack-instruction').addEventListener('click', () => {
        if (itemsToPack.length > 0) {
            playSound(itemsToPack[0].text);
        }
    });

    document.getElementById('prev-pack-level-btn').addEventListener('click', () => {
        if (currentPackLevel > 0) {
            currentPackLevel--;
            loadPackGame();
        }
    });
    document.getElementById('next-pack-level-btn').addEventListener('click', () => {
        if (currentPackLevel < packGameData.levels.length - 1) {
            currentPackLevel++;
            loadPackGame();
        }
    });
}

function showRewardAnimation() {
    const rewardContainer = document.getElementById('reward-animation');
    rewardContainer.innerHTML = `
        <div class="text-center">
            <img src="melo.png" alt="Melo Waving" class="h-64 w-auto mx-auto mb-8">
            <h2 class="text-3xl font-balsamiq text-primary">You did it!</h2>
            <p class="text-lg text-gray-600 mt-2">Melo is ready for his trip!</p>
            <button onclick="hideRewardAnimation()" class="mt-8 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-full">Play Again</button>
        </div>
    `;
    rewardContainer.classList.remove('hidden');
    rewardContainer.classList.add('flex');
    localStorage.setItem('packScore', 0);
}

function hideRewardAnimation() {
    const rewardContainer = document.getElementById('reward-animation');
    rewardContainer.classList.add('hidden');
    rewardContainer.classList.remove('flex');
    showSection('lessons'); // Go back to the main screen
}

function playNextPackCommand() {
    if (itemsToPack.length > 0) {
        const command = itemsToPack[0];
        playSound(command.text);
    } else {
        // Level complete
        currentPackLevel++;
        if (currentPackLevel >= packGameData.levels.length) {
            showRewardAnimation();
            // Reset game
            currentPackLevel = 0;
            packScore = 0;
        } else {
            showFeedback(true, "Great job packing! Time for the next trip.");
            setTimeout(loadPackGame, 2000);
        }
    }
}

function addItemClickListener() {
    const items = document.querySelectorAll('.draggable');
    items.forEach(itemElement => {
        itemElement.addEventListener('click', () => {
            const item = itemElement.dataset.item;
            if (item === itemsToPack[0].item) {
                // Correct item
                packScore += 10;
            localStorage.setItem('packScore', packScore);
                document.getElementById('pack-score').textContent = packScore;
                itemElement.classList.add('glow');
                setTimeout(() => {
                    itemElement.classList.add('swoosh');
                    setTimeout(() => {
                        itemElement.classList.add('hidden');
                    }, 500);
                }, 1000);
                packedItems.push(itemsToPack.shift());
                setTimeout(playNextPackCommand, 1500);
            } else {
                // Incorrect item
                itemElement.classList.add('shake');
                setTimeout(() => itemElement.classList.remove('shake'), 500);
                showFeedback(false);
            }
        });
    });
}


// --- Settings Logic ---
function populateVoiceSelectors() {
    console.log("Attempting to populate voice selectors...");
    try {
        let voices = window.speechSynthesis.getVoices();
        console.log(`Found ${voices.length} voices initially.`);

        if (voices.length === 0) {
            console.log("No voices found initially, will try to trigger loading.");
            let utterance = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(utterance);
            window.speechSynthesis.cancel();

            // Re-check after the trick
            voices = window.speechSynthesis.getVoices();
            console.log(`Found ${voices.length} voices after trigger.`);
        }

        availableVoices = voices;
        const englishSelect = document.getElementById('english-voice-select');
        const hindiSelect = document.getElementById('hindi-voice-select');

        if (!englishSelect || !hindiSelect) {
            console.error("Voice select elements not found in the DOM.");
            return;
        }

        englishSelect.innerHTML = '';
        hindiSelect.innerHTML = '';

        if (availableVoices.length > 0) {
            console.log("Populating dropdowns with available voices.");
            availableVoices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = voice.voiceURI;
                if (voice.lang.startsWith('en-')) {
                    englishSelect.appendChild(option);
                } else if (voice.lang.startsWith('hi-')) {
                    hindiSelect.appendChild(option);
                }
            });

            const savedEnglishVoice = localStorage.getItem('englishVoiceURI');
            const savedHindiVoice = localStorage.getItem('hindiVoiceURI');

            if (savedEnglishVoice) {
                englishSelect.value = savedEnglishVoice;
            }
            if (savedHindiVoice) {
                hindiSelect.value = savedHindiVoice;
            }
        } else {
            console.warn("No voices available to populate selectors.");
        }

        englishSelect.onchange = (e) => localStorage.setItem('englishVoiceURI', e.target.value);
        hindiSelect.onchange = (e) => localStorage.setItem('hindiVoiceURI', e.target.value);

    } catch (error) {
        console.error("An error occurred in populateVoiceSelectors:", error);
    }
}

async function loadContentAndInitialize() {
    try {
        const [lessonsResponse, packGameResponse] = await Promise.all([
            fetch('content.json'),
            fetch('pack_game.json')
        ]);

        if (!lessonsResponse.ok || !packGameResponse.ok) {
            throw new Error(`Network response was not ok`);
        }

        const lessonsData = await lessonsResponse.json();
        const packGameDataResponse = await packGameResponse.json();

        lessons = lessonsData.lessons;
        stories = lessonsData.stories;
        packGameData = packGameDataResponse;

        lessons.forEach(lesson => shuffleArray(lesson.sentences));
        allSentences = lessons.flatMap(lesson => lesson.sentences.map(sentence => ({...sentence, sound: sentence.hindi})));

        packScore = parseInt(localStorage.getItem('packScore')) || 0;

        initializeApp();

    } catch (error) {
        console.error("Failed to load content:", error);
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.innerHTML = `<p class="text-red-500 text-center">Failed to load content.<br>Please check the console and refresh.</p>`;
        }
    }
}

function initializeApp() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if(loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    if (!SpeechRecognition) {
        const speakButton = document.querySelector('.side-panel-link[data-section="speak"]');
        if(speakButton) speakButton.style.display = 'none';
    }

    populateSidePanel();
    populateVoiceSelectors();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceSelectors;
    }
    currentLessonIndex = Math.floor(Math.random() * lessons.length);
    setLanguageMode('hindi'); // Set initial mode
    showSection('lessons');

    window.addEventListener('click', (e) => {
        const optionsContainer = document.getElementById('custom-dropdown-options');
        const dropdownButton = document.getElementById('custom-dropdown-button');
        if (optionsContainer && dropdownButton && !dropdownButton.contains(e.target)) {
            optionsContainer.classList.remove('show');
        }
    });

    // Side Panel Event Listeners
    const menuBtn = document.getElementById('menu-btn');
    const sidePanelOverlay = document.getElementById('side-panel-overlay');
    if (menuBtn) menuBtn.addEventListener('click', toggleSidePanel);
    if (sidePanelOverlay) sidePanelOverlay.addEventListener('click', toggleSidePanel);

    const splashScreen = document.getElementById('splash-screen');
    const splashVideo = document.getElementById('splash-video');
    const skipSplashBtn = document.getElementById('skip-splash-btn');
    const playSplashBtn = document.getElementById('play-splash-btn');
    const main = document.querySelector('main');

    if (splashScreen && splashVideo && skipSplashBtn && playSplashBtn && main) {
        let splashHidden = false;

        function hideSplashScreen() {
            if (splashHidden) return;
            splashHidden = true;

            splashVideo.pause();
            splashScreen.classList.add('fade-out');
            main.classList.remove('opacity-0');
            document.getElementById('menu-btn').style.display = 'block';

            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }

        splashVideo.addEventListener('ended', () => {
            setTimeout(hideSplashScreen, 1000); // 1-second delay
        });

        skipSplashBtn.addEventListener('click', hideSplashScreen);

        // Attempt to play video with sound
        let playPromise = splashVideo.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Autoplay was prevented. Show a "Play" button.
                playSplashBtn.classList.remove('hidden');
                playSplashBtn.addEventListener('click', () => {
                    splashVideo.play();
                    playSplashBtn.classList.add('hidden');
                });
            });
        }
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadContentAndInitialize();
});
