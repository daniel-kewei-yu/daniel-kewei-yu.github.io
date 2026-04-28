<?php
/*
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Second page of extended guessing game. Generates a random secret
 * number within the range provided, stores it in the session,
 * and presents a form for the user to guess.
 * 
 * Modified: Now supports resuming an existing game (when the user returns
 * from a wrong guess) without requiring POST data.
 */
session_start();

// Check if this is a new game (valid POST range)
$min = filter_input(INPUT_POST, 'min', FILTER_VALIDATE_INT);
$max = filter_input(INPUT_POST, 'max', FILTER_VALIDATE_INT);
$isNewGame = ($min !== false && $min !== null && $max !== false && $max !== null && $min < $max);

if ($isNewGame) {
    // Start a brand new game: store the range and generate a secret
    $_SESSION['min'] = $min;
    $_SESSION['max'] = $max;
    $_SESSION['secret'] = rand($min, $max);
} elseif (isset($_SESSION['min']) && isset($_SESSION['max']) && isset($_SESSION['secret'])) {
    // Continue existing game – use stored range and secret
    $min = $_SESSION['min'];
    $max = $_SESSION['max'];
} else {
    // No valid POST and no active session → redirect to start
    header('Location: index.html');
    exit;
}

// Ensure session variables are set (they are, but keep for safety)
$_SESSION['min'] = $min;
$_SESSION['max'] = $max;
// Secret is already set (either newly generated or carried over)
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Guessing Game – Guess the Number</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 2rem auto;
            padding: 1rem;
        }

        input,
        button {
            padding: 0.5rem;
            margin: 0.5rem 0;
            width: 100%;
            box-sizing: border-box;
        }
    </style>
</head>

<body>
    <h1>🔢 Guess the Number</h1>
    <p>I've picked a secret number between <?php echo $_SESSION['min']; ?> and <?php echo $_SESSION['max']; ?>.</p>

    <form action="result.php" method="POST">
        <label for="guess">Your guess:</label>
        <input type="number" id="guess" name="guess" required>
        <button type="submit">Submit Guess</button>
    </form>
</body>

</html>