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

    function startNewGame() {
        currentGame = new GuessingGame();
        updateDisplay(null);
        guessInput.value = '';
        guessInput.focus();
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

        if (result === 'correct') {
            setTimeout(() => {
                startNewGame();
                updateDisplay('new number generated!');
            }, 800);
            return;
        }

        if (currentGame.guessCount >= 10) {
            updateDisplay('GAME OVER · 10 incorrect guesses');
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

    startNewGame();
})();