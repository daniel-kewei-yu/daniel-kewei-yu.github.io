<?php
/* 
 * File: result.php
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Third page of guessing game. Checks the user's guess
 * against the secret number stored in the session,
 * displays the result, and destroys the session.
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

// Destroy session after showing result
session_destroy();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Guessing Game – Result</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; text-align: center; }
        .correct { color: green; font-size: 1.5rem; }
        .incorrect { color: red; font-size: 1.5rem; }
        a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🎯 Result</h1>

    <?php if ($isCorrect): ?>
        <p class="correct">✅ Correct! The secret number was <?php echo $secret; ?>.</p>
        <p>You guessed it!</p>
    <?php else: ?>
        <p class="incorrect">❌ Wrong! The secret number was <?php echo $secret; ?>.</p>
        <p>Your guess was <?php echo $guess; ?>.</p>
    <?php endif; ?>

    <p>Range was <?php echo $min; ?> – <?php echo $max; ?>.</p>
    <a href="index.html">Play Again</a>
</body>
</html>