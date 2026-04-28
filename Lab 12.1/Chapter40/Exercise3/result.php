<?php
/*
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Third page of extended guessing game. Checks the user's guess
 * against the secret number stored in the session.
 * If correct, displays success and destroys the session.
 * If incorrect, shows a "Try Again" link that returns to game.php
 * and keeps the session alive.
 */
session_start();

$guess = filter_input(INPUT_POST, 'guess', FILTER_VALIDATE_INT);

// If no valid guess or session missing, redirect to start
if ($guess === false || $guess === null || !isset($_SESSION['secret'])) {
    header('Location: index.html');
    exit;
}

$secret = $_SESSION['secret'];
$isCorrect = ($guess == $secret);
$min = $_SESSION['min'];
$max = $_SESSION['max'];

if ($isCorrect) {
    // Correct guess: destroy session
    session_destroy();
    $message = "<p class='correct'>✅ Correct! The secret number was $secret.</p>
                <p>You guessed it!</p>
                <p>Range was $min – $max.</p>
                <a href='index.html'>Play Again</a>";
} else {
    // Wrong guess: keep session, show feedback and a "Try Again" link back to game.php
    $message = "<p class='incorrect'>❌ Wrong! $guess is not the secret number.</p>
                <p>Try again!</p>
                <a href='game.php'>Try Again</a>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Guessing Game – Result</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; text-align: center; }
        .correct { color: green; font-size: 1.2rem; }
        .incorrect { color: red; font-size: 1.2rem; }
        a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🎯 Result</h1>
    <?php echo $message; ?>
</body>
</html>