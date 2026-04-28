<?php
// --- Process form submission and calculate results ---
$wheels = 3;                // default number of wheels
$bet = 1.00;                 // default bet amount
$fruit_numbers = [];         // will hold random fruit numbers
$payout = 0;
$win_message = "";

// Check if form was submitted (via GET)
if (isset($_GET['wheels']) && isset($_GET['bet'])) {
    // Validate wheels – must be integer between 1 and 10
    $wheels_input = filter_input(INPUT_GET, 'wheels', FILTER_VALIDATE_INT);
    if ($wheels_input !== false && $wheels_input > 0 && $wheels_input <= 10) {
        $wheels = $wheels_input;
    } else {
        $win_message = "Invalid number of wheels. Using default ($wheels).";
    }

    // Validate bet – must be positive float
    $bet_input = filter_input(INPUT_GET, 'bet', FILTER_VALIDATE_FLOAT);
    if ($bet_input !== false && $bet_input > 0) {
        $bet = $bet_input;
    } else {
        $win_message = $win_message ? $win_message . "<br>Invalid bet amount. Using default ($bet)." : "Invalid bet amount. Using default ($bet).";
    }

    // Generate random fruit numbers (1 to 7)
    for ($i = 0; $i < $wheels; $i++) {
        $fruit_numbers[] = rand(1, 7);
    }

    // Calculate payout
    $freq = array_count_values($fruit_numbers);
    $max_freq = max($freq);

    if ($max_freq == $wheels) {
        // All wheels match
        $payout = $bet * 100 * $wheels;
        $win_message = "JACKPOT! All $wheels match! You win $" . number_format($payout, 2);
    } elseif ($max_freq >= ceil($wheels / 2)) {
        // At least half match
        $payout = $bet * $wheels;
        $win_message = "Half or more match! You win $" . number_format($payout, 2);
    } else {
        $win_message = "No luck this time. Better luck next spin!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Configurable Slot Machine</title>
    <style>
        body {
            background: #2e1b0e;
            font-family: 'Courier New', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }

        .slot-machine {
            background: #d4af37;
            padding: 30px 20px;
            border-radius: 40px;
            border: 8px solid #8b5a2b;
            box-shadow: 0 20px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px #aa7c4f;
            max-width: 800px;
            width: 100%;
        }

        h1 {
            color: #ffd966;
            text-align: center;
            font-size: 40px;
            text-shadow: 4px 4px 0 #7a4f1a;
            margin-top: 0;
        }

        .form-section {
            background: #f9f3d9;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            border: 5px groove #d4af37;
        }

        .form-group {
            margin: 15px 0;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
        }

        .form-group label {
            font-weight: bold;
            min-width: 150px;
            color: #2c1e0e;
        }

        .form-group input {
            padding: 8px 12px;
            border: 2px solid #c0a062;
            border-radius: 8px;
            font-size: 16px;
            flex: 1 1 200px;
        }

        button {
            background: #e62e2e;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 24px;
            font-weight: bold;
            border-radius: 40px;
            border-bottom: 8px solid #8b1a1a;
            cursor: pointer;
            width: 100%;
            transition: 0.1s;
            box-shadow: 0 10px 0 #4d2e1b;
            text-transform: uppercase;
        }

        button:hover {
            background: #ff4d4d;
            transform: translateY(3px);
            border-bottom-width: 5px;
            box-shadow: 0 7px 0 #4d2e1b;
        }

        .reels {
            background: #000;
            padding: 30px 20px;
            border-radius: 30px;
            border: 5px inset #bba77e;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            margin: 20px 0;
            box-shadow: inset 0 0 20px #333;
        }

        .reel {
            background: #fff;
            border-radius: 20px;
            padding: 10px;
            box-shadow: 0 0 0 4px #c0a062, 0 10px 15px rgba(0, 0, 0, 0.5);
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .reel img {
            max-width: 60px;
            max-height: 60px;
        }

        .message {
            background: #f9f3d9;
            font-size: 29px;
            font-weight: bold;
            padding: 20px;
            border-radius: 60px;
            border: 5px groove #d4af37;
            text-align: center;
            color: #2c1e0e;
            text-shadow: 2px 2px 0 #e6c78c;
            margin: 20px 0;
        }

        .details {
            color: #ecd9b4;
            text-align: center;
            font-size: 19px;
        }
    </style>
</head>

<body>
    <div class="slot-machine">
        <h1>CONFIGURABLE SLOT</h1>

        <!-- Form to set wheels and bet -->
        <div class="form-section">
            <form method="get" action="">
                <div class="form-group">
                    <label>Number of Wheels (1-10):</label>
                    <input type="number" name="wheels" min="1" max="10" value="<?= htmlspecialchars($wheels) ?>" required>
                </div>
                <div class="form-group">
                    <label>Bet Amount ($):</label>
                    <input type="number" name="bet" step="0.01" min="0.01" value="<?= htmlspecialchars($bet) ?>" required>
                </div>
                <button type="submit">SPIN</button>
            </form>
        </div>

        <?php if (!empty($fruit_numbers)): ?>
            <!-- Display the reels -->
            <div class="reels">
                <?php foreach ($fruit_numbers as $fruit): ?>
                    <div class="reel">
                        <img src="fruits/<?= $fruit ?>.png" alt="Fruit <?= $fruit ?>">
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Display win message and payout -->
            <div class="message">
                <?= $win_message ?>
            </div>

            <div class="details">
                Bet: $<?= number_format($bet, 2) ?> | Wheels: <?= $wheels ?>
            </div>
        <?php else: ?>
            <!-- Initial state: show placeholder -->
            <div class="message">
                Set your bet and number of wheels, then click SPIN!
            </div>
        <?php endif; ?>
    </div>
</body>

</html>