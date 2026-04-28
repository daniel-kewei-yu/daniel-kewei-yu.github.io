<?php
/**
 * Author: Daniel Yu
 * Date: 2026-03-18
 * Description: Leaderboard page. Accepts POST submissions from the game to
 *              store results (email, total_time, total_stars) in the results table.
 *              Also displays the current user's stats (if email GET param provided)
 *              and the top 5 players based on total stars earned.
 */
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $total_time = filter_input(INPUT_POST, 'total_time', FILTER_VALIDATE_FLOAT);
    $total_stars = filter_input(INPUT_POST, 'total_stars', FILTER_VALIDATE_INT);

    if ($email && $total_time !== false && $total_stars !== false && $total_stars >= 0 && $total_stars <= 9) {
        $stmt = $pdo->prepare("INSERT INTO results (email, date_played, total_time, total_stars) VALUES (?, NOW(), ?, ?)");
        try {
            $stmt->execute([$email, $total_time, $total_stars]);
            $success = true;
        } catch (PDOException $e) {
            $error = "Failed to save result: " . $e->getMessage();
        }
    } else {
        $error = "Invalid submission data.";
    }
}

$user_email = filter_input(INPUT_GET, 'email', FILTER_SANITIZE_EMAIL);

$user_stats = null;
$user_results = [];
if ($user_email) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as completions, SUM(total_stars) as total_stars, AVG(total_time) as avg_time FROM results WHERE email = ?");
    $stmt->execute([$user_email]);
    $user_stats = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT date_played, total_time, total_stars FROM results WHERE email = ? ORDER BY date_played DESC LIMIT 5");
    $stmt->execute([$user_email]);
    $user_results = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$top_users = [];
$stmt = $pdo->prepare("SELECT email, SUM(total_stars) as total_stars, COUNT(*) as completions, AVG(total_time) as avg_time 
                       FROM results 
                       GROUP BY email 
                       ORDER BY total_stars DESC, completions DESC 
                       LIMIT 5");
$stmt->execute();
$top_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VANTAGE - Leaderboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="stylesPHPAssign/phpAssignStyles.css">
    <link rel="icon" type="image/x-icon" href="imagesPHPAssign/favicon.ico">
</head>

<body>
    <div class="leaderboard-container">
        <h1>VANTAGE Leaderboard</h1>

        <?php if (isset($success)): ?>
            <div class="message">Result recorded successfully!</div>
        <?php endif; ?>
        <?php if (isset($error)): ?>
            <div class="message error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if ($user_email && $user_stats): ?>
            <h2>Your Stats</h2>
            <div class="stats-box">
                <p>Email: <?php echo htmlspecialchars($user_email); ?></p>
                <p>Completions: <?php echo $user_stats['completions']; ?></p>
                <p>Total Stars Earned: <?php echo $user_stats['total_stars']; ?></p>
                <p>Average Completion Time: <?php echo $user_stats['avg_time'] ? number_format($user_stats['avg_time'], 2) : 'N/A'; ?> seconds</p>
                <?php if (!empty($user_results)): ?>
                    <h3>Recent Games</h3>
                    <table>
                        <tr>
                            <th>Date</th>
                            <th>Time (s)</th>
                            <th>Stars</th>
                        </tr>
                        <?php foreach ($user_results as $row): ?>
                            <tr>
                                <td><?php echo date('Y-m-d H:i', strtotime($row['date_played'])); ?></td>
                                <td><?php echo number_format($row['total_time'], 2); ?></td>
                                <td><?php echo $row['total_stars']; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </table>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <h2>Top 5 Players</h2>
        <?php if (count($top_users) > 0): ?>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Email</th>
                    <th>Total Stars</th>
                    <th>Completions</th>
                    <th>Avg Time (s)</th>
                </tr>
                <?php $rank = 1;
                foreach ($top_users as $user): ?>
                    <tr>
                        <td><?php echo $rank++; ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td><?php echo $user['total_stars']; ?></td>
                        <td><?php echo $user['completions']; ?></td>
                        <td><?php echo $user['avg_time'] ? number_format($user['avg_time'], 2) : 'N/A'; ?></td>
                    </tr>
                <?php endforeach; ?>
            </table>
        <?php else: ?>
            <p>No results yet. Be the first to play!</p>
        <?php endif; ?>

        <div style="text-align: center;">
            <a href="index.php" class="button">Play Again</a>
            <a href="play.php?email=<?php echo urlencode($user_email ?: ''); ?>" class="button">Back to Game</a>
        </div>
    </div>
</body>

</html>