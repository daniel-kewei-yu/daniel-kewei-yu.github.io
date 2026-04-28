<?php
// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database configuration
$host = 'localhost';
$db   = 'my_polls_app';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Initialize variables
$message = '';
$pollId = '';
$option = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get and trim user input
    $pollId = trim($_POST['poll_id'] ?? '');
    $option = trim($_POST['option'] ?? '');

    // 1. Basic validation: fields not empty
    if ($pollId === '' || $option === '') {
        $message = '<p style="color:red;">❌ Poll ID and option are required.</p>';
    }
    // 2. Validate option is numeric and between 1 and 4
    elseif (!ctype_digit($option) || $option < 1 || $option > 4) {
        $message = '<p style="color:red;">❌ Option must be a number between 1 and 4.</p>';
    } else {
        try {
            // Connect to database
            $pdo = new PDO($dsn, $user, $pass, $options);

            // 3. Check if poll exists and the chosen option is available
            //    First, fetch the poll record
            $stmt = $pdo->prepare('SELECT ID, option1, option2, option3, option4 FROM poll WHERE ID = :id');
            $stmt->execute(['id' => $pollId]);
            $poll = $stmt->fetch();

            if (!$poll) {
                $message = '<p style="color:red;">❌ Poll ID not found.</p>';
            } else {
                // Check if the selected option column is NOT NULL
                $optionColumn = 'option' . $option;  // e.g., 'option1'
                if (is_null($poll[$optionColumn])) {
                    $message = '<p style="color:red;">❌ This poll does not have option ' . $option . '.</p>';
                } else {
                    // 4. Update the corresponding vote count
                    $voteColumn = 'vote' . $option;   // e.g., 'vote1'
                    $update = $pdo->prepare("UPDATE poll SET $voteColumn = $voteColumn + 1 WHERE ID = :id");
                    $update->execute(['id' => $pollId]);

                    // Check if any row was affected (should be 1)
                    if ($update->rowCount() > 0) {
                        $message = '<p style="color:green;">✅ Your vote has been recorded. Thank you!</p>';
                    } else {
                        // This shouldn't happen if poll exists, but just in case
                        $message = '<p style="color:orange;">⚠️ No changes made. Please try again.</p>';
                    }
                }
            }
        } catch (PDOException $e) {
            // Database connection or query error
            $message = '<p style="color:red;">❌ Database error: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Poll Voting</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 2em;
        }

        .container {
            max-width: 500px;
            margin: auto;
            padding: 1em;
            border: 1px solid #ccc;
            border-radius: 5px;
        }

        label {
            display: inline-block;
            width: 100px;
        }

        input[type=text],
        input[type=number] {
            width: 200px;
            padding: 5px;
        }

        .option-group {
            margin: 10px 0;
        }

        input[type=radio] {
            margin-left: 20px;
        }

        .btn {
            background: #007bff;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }

        .btn:hover {
            background: #0056b3;
        }

        .message {
            margin: 15px 0;
            padding: 10px;
            border-radius: 3px;
        }
    </style>
</head>

<body>
    <div class="container">
        <h2>Vote in a Poll</h2>
        <?php if ($message): ?>
            <div class="message"><?= $message ?></div>
        <?php endif; ?>

        <form method="post">
            <div class="option-group">
                <label for="poll_id">Poll ID:</label>
                <input type="number" name="poll_id" id="poll_id" value="<?= htmlspecialchars($pollId) ?>" required min="1">
            </div>

            <div class="option-group">
                <label>Option:</label>
                <input type="radio" name="option" value="1" id="opt1" <?= $option == '1' ? 'checked' : '' ?> required>
                <label for="opt1" style="display:inline;">1</label>
                <input type="radio" name="option" value="2" id="opt2" <?= $option == '2' ? 'checked' : '' ?>>
                <label for="opt2" style="display:inline;">2</label>
                <input type="radio" name="option" value="3" id="opt3" <?= $option == '3' ? 'checked' : '' ?>>
                <label for="opt3" style="display:inline;">3</label>
                <input type="radio" name="option" value="4" id="opt4" <?= $option == '4' ? 'checked' : '' ?>>
                <label for="opt4" style="display:inline;">4</label>
            </div>

            <div>
                <button type="submit" class="btn">Vote</button>
            </div>
        </form>

        <p style="margin-top:20px; font-size:0.9em;">Note: Only options that exist in the poll can be voted on.</p>
    </div>
</body>

</html>