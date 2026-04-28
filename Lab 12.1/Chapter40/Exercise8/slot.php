<?php
/* 
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: AJAX endpoint for slot machine spins.
 * Receives bet, checks session, generates random symbols,
 * calculates payout, updates credits, and returns JSON.
 * Destroys session when credits run out.
 */

header('Content-Type: application/json');
session_start();

// Check if session exists and credits are defined
if (!isset($_SESSION['credits'])) {
    echo json_encode(['error' => 'Session expired or not started. Please reload the page.']);
    exit;
}

$credits = (int) $_SESSION['credits'];

// If credits are 0 or negative, game over – kill session and return error
if ($credits <= 0) {
    session_destroy();
    echo json_encode(['error' => 'Game over! No credits left.', 'credits' => 0]);
    exit;
}

// Get and validate bet
$bet = filter_input(INPUT_POST, 'bet', FILTER_VALIDATE_INT);
if ($bet === false || $bet === null || $bet < 1) {
    echo json_encode(['error' => 'Invalid bet amount. Must be at least 1.']);
    exit;
}
if ($bet > $credits) {
    echo json_encode(['error' => 'Bet exceeds current credits.']);
    exit;
}

// Define symbols (pure emojis, no text)
$symbols = ['🍒', '🍋', '🍊', '🔔', '⭐', '💎'];
$result = [];

// Generate three random symbols
for ($i = 0; $i < 3; $i++) {
    $result[] = $symbols[array_rand($symbols)];
}

// Determine payout
$payout = 0;
$winMessage = '';
if ($result[0] === $result[1] && $result[1] === $result[2]) {
    // All three match
    $payout = $bet * 5;
    $winMessage = 'JACKPOT! All three match!';
} elseif ($result[0] === $result[1] || $result[1] === $result[2] || $result[0] === $result[2]) {
    // Two match
    $payout = $bet * 2;
    $winMessage = 'Two of a kind!';
} else {
    $winMessage = 'No match. Better luck next time!';
}

// Update credits
$credits = $credits - $bet + $payout;
$_SESSION['credits'] = $credits;

// If credits are zero or negative, destroy session
if ($credits <= 0) {
    session_destroy();
    $credits = 0; // ensure we report zero
}

// Return JSON response
echo json_encode([
    'symbols' => $result,
    'payout' => $payout,
    'credits' => $credits,
    'result' => $winMessage,
    'bet' => $bet
]);
?>