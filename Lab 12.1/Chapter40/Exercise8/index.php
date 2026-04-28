<?php
/* 
 * File: index.php
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Slot machine game with AJAX spins.
 * Displays current credits, a bet input, and the slot wheels.
 * Sends spins to slot.php via AJAX and updates the UI.
 */
session_start();

// Initialize session if this is a new game
if (!isset($_SESSION['credits'])) {
    $_SESSION['credits'] = 10;      // start with 10 credits
}
$initialCredits = $_SESSION['credits'];
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slot Machine</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #2c3e50, #3498db);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            padding: 30px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }

        h1 {
            margin-bottom: 20px;
            color: #2c3e50;
            font-size: 28px;
        }

        .credits {
            font-size: 24px;
            font-weight: bold;
            background: #f39c12;
            display: inline-block;
            padding: 8px 20px;
            border-radius: 40px;
            color: white;
            margin-bottom: 20px;
        }

        .slot-machine {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 30px 0;
        }

        .reel {
            background: #ecf0f1;
            border-radius: 12px;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
        }

        .bet-area {
            margin: 20px 0;
        }

        .bet-area label {
            font-weight: bold;
            margin-right: 10px;
            font-size: 16px;
        }

        input {
            padding: 8px;
            font-size: 16px;
            width: 100px;
            text-align: center;
            border: 2px solid #bdc3c7;
            border-radius: 8px;
        }

        button {
            background: #27ae60;
            color: white;
            border: none;
            padding: 10px 25px;
            font-size: 18px;
            border-radius: 40px;
            cursor: pointer;
            transition: background 0.2s;
            margin-left: 10px;
        }

        button:disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }

        .message {
            margin-top: 20px;
            font-size: 18px;
            padding: 10px;
            border-radius: 8px;
        }

        .win {
            background: #d4edda;
            color: #155724;
        }

        .lose {
            background: #f8d7da;
            color: #721c24;
        }

        .error {
            background: #fff3cd;
            color: #856404;
        }

        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top-color: #27ae60;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            vertical-align: middle;
            margin-left: 10px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        footer {
            margin-top: 25px;
            font-size: 13px;
            color: #7f8c8d;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>SLOT MACHINE</h1>
        <div class="credits">Credits: <span id="credits"><?php echo $initialCredits; ?></span></div>

        <div class="slot-machine">
            <div class="reel" id="reel1">🍒</div>
            <div class="reel" id="reel2">🍒</div>
            <div class="reel" id="reel3">🍒</div>
        </div>

        <div class="bet-area">
            <label for="bet">Bet amount:</label>
            <input type="number" id="bet" min="1" value="1" step="1">
            <button id="spinBtn">SPIN</button>
            <span id="loadingSpinner" style="display: none;">
                <div class="spinner"></div>
            </span>
        </div>

        <div id="message" class="message"></div>
        <footer>Match all three to win 5× bet! Two of a kind wins 2× bet.</footer>
    </div>

    <script>
        // Get DOM elements
        const spinBtn = document.getElementById('spinBtn');
        const creditsSpan = document.getElementById('credits');
        const reel1 = document.getElementById('reel1');
        const reel2 = document.getElementById('reel2');
        const reel3 = document.getElementById('reel3');
        const betInput = document.getElementById('bet');
        const messageDiv = document.getElementById('message');
        const loadingSpinner = document.getElementById('loadingSpinner');

        let currentCredits = parseInt(creditsSpan.innerText);
        let abortController = null;

        // Helper to show messages
        function showMessage(text, type = 'info') {
            messageDiv.textContent = text;
            messageDiv.className = 'message ' + type;
        }

        // Update UI with new symbols and credits
        function updateUI(symbols, newCredits) {
            reel1.textContent = symbols[0];
            reel2.textContent = symbols[1];
            reel3.textContent = symbols[2];
            creditsSpan.textContent = newCredits;
            currentCredits = newCredits;
        }

        // Enable/disable spin button and loading indicator
        function setLoading(isLoading) {
            if (isLoading) {
                spinBtn.disabled = true;
                loadingSpinner.style.display = 'inline-block';
            } else {
                spinBtn.disabled = false;
                loadingSpinner.style.display = 'none';
            }
        }

        // Spin the machine
        function spin(bet) {
            // Cancel any ongoing request
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            setLoading(true);
            showMessage('Spinning...', 'info');

            // Prepare POST data
            const formData = new URLSearchParams();
            formData.append('bet', bet);

            fetch('slot.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                    signal: abortController.signal
                })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        // Error from server (invalid bet, session lost, etc.)
                        showMessage(data.error, 'error');
                        if (data.error === 'Game over! No credits left.') {
                            spinBtn.disabled = true;
                        }
                        // If session was destroyed, credits might be 0; update UI accordingly
                        if (data.credits !== undefined) {
                            creditsSpan.textContent = data.credits;
                            currentCredits = data.credits;
                        }
                    } else {
                        // Successful spin
                        updateUI(data.symbols, data.credits);
                        if (data.payout > 0) {
                            showMessage(`WIN! You won ${data.payout} credits! ${data.result}`, 'win');
                        } else {
                            showMessage(`LOSE! No win this time. ${data.result}`, 'lose');
                        }
                        // If credits became 0, disable further spins (game over)
                        if (data.credits <= 0) {
                            showMessage('GAME OVER – you ran out of credits. Reload the page to start a new game.', 'error');
                            spinBtn.disabled = true;
                        }
                    }
                })
                .catch(error => {
                    if (error.name === 'AbortError') {
                        // Request aborted – ignore
                        return;
                    }
                    console.error('Fetch error:', error);
                    showMessage('Network error. Please try again.', 'error');
                })
                .finally(() => {
                    setLoading(false);
                    abortController = null;
                });
        }

        // Event listener for spin button
        spinBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (isNaN(bet) || bet < 1) {
                showMessage('Please enter a bet amount of at least 1 credit.', 'error');
                return;
            }
            if (bet > currentCredits) {
                showMessage(`You only have ${currentCredits} credits. Cannot bet more than you have.`, 'error');
                return;
            }
            spin(bet);
        });

        // Enable Enter key to spin
        betInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                spinBtn.click();
            }
        });
    </script>
</body>

</html>