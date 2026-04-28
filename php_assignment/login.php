<?php
/**
 * Author: Daniel Yu
 * Date: 2026-03-18
 * Description: Processes login form submission. Checks if email exists in
 *              players table. If yes, verifies birth date. If no, creates new
 *              player. Redirects to play.php with email parameter on success,
 *              otherwise shows an error and link back to index.
 */
session_start();
require_once 'config.php';

$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$birthdate = filter_input(INPUT_POST, 'birthdate', FILTER_SANITIZE_STRING);

if (!$email || !$birthdate) {
    die("Missing required parameters. <a href='index.php'>Go back</a>");
}

$stmt = $pdo->prepare("SELECT * FROM players WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    if ($user['birth_date'] === $birthdate) {
        $message = "Welcome back, " . htmlspecialchars($email) . "!";
        $link = "play.php?email=" . urlencode($email);
        $linkText = "Continue your adventure";
    } else {
        $message = "The email '" . htmlspecialchars($email) . "' is already registered with a different birth date.";
        $link = "index.php";
        $linkText = "Try Again";
    }
} else {
    $stmt = $pdo->prepare("INSERT INTO players (email, birth_date) VALUES (?, ?)");
    try {
        $stmt->execute([$email, $birthdate]);
        $message = "Welcome to VANTAGE, " . htmlspecialchars($email) . "! Your account has been created.";
        $link = "play.php?email=" . urlencode($email);
        $linkText = "Start your adventure";
    } catch (PDOException $e) {
        die("Error creating user: " . $e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VANTAGE - Login Result</title>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="stylesPHPAssign/phpAssignStyles.css">
    <link rel="icon" type="image/x-icon" href="imagesPHPAssign/favicon.ico">
</head>
<body>
    <div class="result-box">
        <div class="message"><?php echo $message; ?></div>
        <a href="<?php echo $link; ?>"><?php echo $linkText; ?></a>
    </div>
</body>
</html>