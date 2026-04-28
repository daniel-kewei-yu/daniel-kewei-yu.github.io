(function () {
    // GuessingGame class
    class GuessingGame {
        constructor() {
            this.secretNumber = Math.floor(Math.random() * 100) + 1;
            this.guessCount = 0;
            this.lastGuess = null;
            this.lastResult = null;
        }

        guess(number) {
            this.guessCount++;
            this.lastGuess = number;

            if (number === this.secretNumber) {
                this.lastResult = 'correct';
                return 'correct';
            } else if (number > this.secretNumber) {
                this.lastResult = 'high';
                return 'high';
            } else {
                this.lastResult = 'low';
                return 'low';
            }
        }

        render() {
            let resultText = '';
            if (this.lastResult === 'correct') {
                resultText = 'correct!';
            } else if (this.lastResult === 'high') {
                resultText = 'too high';
            } else if (this.lastResult === 'low') {
                resultText = 'too low';
            } else {
                resultText = 'no guess yet';
            }

            let lastGuessInfo = '';
            if (this.lastGuess !== null) {
                lastGuessInfo = `last guess: ${this.lastGuess}`;
            } else {
                lastGuessInfo = 'no previous guess';
            }

            return `
                <div>secret number: ${this.secretNumber} (hidden)</div>
                <div>guesses used: ${this.guessCount}</div>
                <div>${lastGuessInfo}</div>
                <div>last result: ${resultText}</div>
            `;
        }
    }

    // DOM elements
    const renderArea = document.getElementById('renderArea');
    const feedbackDiv = document.getElementById('feedbackMessage');
    const guessForm = document.getElementById('guessForm');
    const guessInput = document.getElementById('guessInput');
    const newGameBtn = document.getElementById('newGameBtn');

    let currentGame;

    const STORAGE_KEY = 'guessingGame';

    function saveGame() {
        const gameState = {
            secretNumber: currentGame.secretNumber,
            guessCount: currentGame.guessCount,
            lastGuess: currentGame.lastGuess,
            lastResult: currentGame.lastResult
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }

    function loadGame() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        try {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null &&
                typeof parsed.secretNumber === 'number' &&
                typeof parsed.guessCount === 'number' &&
                (parsed.lastGuess === null || typeof parsed.lastGuess === 'number') &&
                (parsed.lastResult === null || ['correct', 'high', 'low'].includes(parsed.lastResult))) {
                return parsed;
            }
        } catch (e) {
            // ignore
        }
        return null;
    }

    function resumeGameFromData(data) {
        const game = new GuessingGame();
        game.secretNumber = data.secretNumber;
        game.guessCount = data.guessCount;
        game.lastGuess = data.lastGuess;
        game.lastResult = data.lastResult;
        return game;
    }

    function clearSavedGame() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function startNewGame() {
        currentGame = new GuessingGame();
        updateDisplay(null);
        guessInput.value = '';
        guessInput.focus();
        saveGame();
    }

    function updateDisplay(feedbackText) {
        renderArea.innerHTML = currentGame.render();

        if (feedbackText !== undefined && feedbackText !== null) {
            feedbackDiv.textContent = feedbackText;

            if (feedbackText.includes('correct') || feedbackText.includes('Correct')) {
                feedbackDiv.className = 'feedback correct';
            } else if (feedbackText.includes('high') || feedbackText.includes('High')) {
                feedbackDiv.className = 'feedback high';
            } else if (feedbackText.includes('low') || feedbackText.includes('Low')) {
                feedbackDiv.className = 'feedback low';
            } else if (feedbackText.includes('GAME OVER')) {
                feedbackDiv.className = 'feedback gameover';
            } else {
                feedbackDiv.className = 'feedback';
            }
        } else {
            feedbackDiv.textContent = 'enter a guess';
            feedbackDiv.className = 'feedback';
        }
    }

    guessForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const rawValue = guessInput.value.trim();
        if (rawValue === '') {
            return;
        }

        const guess = Number(rawValue);
        if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
            updateDisplay('please enter a whole number 1–100');
            guessInput.value = '';
            guessInput.focus();
            return;
        }

        const result = currentGame.guess(guess);

        let feedbackMessage = '';
        if (result === 'correct') {
            feedbackMessage = `Correct! (${currentGame.guessCount} guesses)`;
        } else if (result === 'high') {
            feedbackMessage = `${guess} is too high`;
        } else {
            feedbackMessage = `${guess} is too low`;
        }

        updateDisplay(feedbackMessage);
        saveGame();

        if (result === 'correct') {
            clearSavedGame();               // game won – remove saved state
            setTimeout(() => {
                startNewGame();
                updateDisplay('new number generated!');
            }, 800);
            return;
        }

        if (currentGame.guessCount >= 10) {
            updateDisplay('GAME OVER · 10 incorrect guesses');
            clearSavedGame();               // game lost – remove saved state
            setTimeout(() => {
                startNewGame();
                updateDisplay('try again with a new number');
            }, 1400);
            return;
        }

        guessInput.value = '';
        guessInput.focus();
    });

    newGameBtn.addEventListener('click', function () {
        startNewGame();
        updateDisplay('new game started');
    });

    // Initialization
    const savedData = loadGame();
    if (savedData) {
        currentGame = resumeGameFromData(savedData);
        updateDisplay('resumed previous game');

        if (currentGame.lastResult === 'correct') {
            updateDisplay(`Correct! (${currentGame.guessCount} guesses) – resuming...`);
            clearSavedGame();
            setTimeout(() => {
                startNewGame();
                updateDisplay('new number generated!');
            }, 800);
        } else if (currentGame.guessCount >= 10) {
            updateDisplay('GAME OVER · 10 incorrect guesses');
            clearSavedGame();
            setTimeout(() => {
                startNewGame();
                updateDisplay('try again with a new number');
            }, 1400);
        }
    } else {
        startNewGame();
    }
})();