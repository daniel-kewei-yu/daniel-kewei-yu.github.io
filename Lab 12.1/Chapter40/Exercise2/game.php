<?php
/* 
 * File: game.php
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Second page of guessing game. Generates a random secret
 * number within the range provided, stores it in the session,
 * and presents a form for the user to guess.
 */
session_start();

$min = filter_input(INPUT_POST, 'min', FILTER_VALIDATE_INT);
$max = filter_input(INPUT_POST, 'max', FILTER_VALIDATE_INT);

// Validate input
if ($min === false || $max === false || $min === null || $max === null || $min >= $max) {
    header('Location: index.html');
    exit;
}

// Generate and store secret number in session
$_SESSION['secret'] = rand($min, $max);
$_SESSION['min'] = $min;
$_SESSION['max'] = $max;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Guessing Game – Guess the Number</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; }
        input, button { padding: 0.5rem; margin: 0.5rem 0; width: 100%; box-sizing: border-box; }
    </style>
</head>
<body>
    <h1>🔢 Guess the Number</h1>
    <p>I've picked a secret number between <?php echo $min; ?> and <?php echo $max; ?>.</p>

    <form action="result.php" method="POST">
        <label for="guess">Your guess:</label>
        <input type="number" id="guess" name="guess" required>
        <button type="submit">Submit Guess</button>
    </form>
</body>
</html>