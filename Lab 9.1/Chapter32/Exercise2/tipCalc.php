<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Initialize variables with default values
$servername = $email1 = $email2 = $bill = $tip_percent = $creditcard = '';
$error_message = '';
$show_results = false;
$tip_amount = $total = 0;
$bill_float = $tip_percent_int = 0;

// Process only if the form was submitted via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve raw input safely
    $servername_raw = trim($_POST['servername'] ?? '');
    $email1_raw = trim($_POST['email1'] ?? '');
    $email2_raw = trim($_POST['email2'] ?? '');
    $bill_raw = trim($_POST['bill'] ?? '');
    $tip_raw = trim($_POST['tip'] ?? '');
    $creditcard_raw = trim($_POST['creditcard'] ?? '');

    // Sanitize for safe output (used in value attributes)
    $servername = htmlspecialchars($servername_raw, ENT_QUOTES, 'UTF-8');
    $email1 = htmlspecialchars($email1_raw, ENT_QUOTES, 'UTF-8');
    $email2 = htmlspecialchars($email2_raw, ENT_QUOTES, 'UTF-8');
    $bill = htmlspecialchars($bill_raw, ENT_QUOTES, 'UTF-8');
    $tip_percent = htmlspecialchars($tip_raw, ENT_QUOTES, 'UTF-8');
    $creditcard = htmlspecialchars($creditcard_raw, ENT_QUOTES, 'UTF-8');

    // Validation
    if ($servername_raw === '') {
        $error_message .= "Server name is required.<br>";
    }

    if ($email1_raw === '') {
        $error_message .= "Email is required.<br>";
    } elseif (!filter_var($email1_raw, FILTER_VALIDATE_EMAIL)) {
        $error_message .= "First email is not a valid address.<br>";
    }

    if ($email2_raw === '') {
        $error_message .= "Confirm email is required.<br>";
    } elseif (!filter_var($email2_raw, FILTER_VALIDATE_EMAIL)) {
        $error_message .= "Second email is not a valid address.<br>";
    }

    if ($email1_raw !== $email2_raw) {
        $error_message .= "Emails do not match.<br>";
    }

    if ($bill_raw === '') {
        $error_message .= "Bill amount is required.<br>";
    } elseif (!is_numeric($bill_raw) || $bill_raw <= 0) {
        $error_message .= "Bill amount must be a positive number.<br>";
    }

    // Allow "0" as a valid tip percentage
    if ($tip_raw === '') {
        $error_message .= "Tip percentage is required.<br>";
    } elseif (!is_numeric($tip_raw) || $tip_raw < 0 || $tip_raw > 100) {
        $error_message .= "Tip percentage must be between 0 and 100.<br>";
    }

    if ($creditcard_raw === '') {
        $error_message .= "Credit card number is required.<br>";
    } elseif (!preg_match('/^\d{16}$/', $creditcard_raw)) {
        $error_message .= "Credit card must be exactly 16 digits.<br>";
    }

    // If no errors, calculate results
    if (empty($error_message)) {
        $show_results = true;
        $bill_float = (float)$bill_raw;
        $tip_percent_int = (int)$tip_raw;
        $tip_amount = $bill_float * ($tip_percent_int / 100);
        $total = $bill_float + $tip_amount;
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tip Calculator - One Page App</title>
    <style>
        * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: #f5f7fa;
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }

        h1 {
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 25px;
            font-weight: 600;
            border-left: 5px solid #3498db;
            padding-left: 15px;
        }

        .error-box {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }

        .error-box h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
        }

        .error-box p {
            margin: 0;
        }

        .result-box {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .result-box h2 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 21px;
        }

        .result-detail {
            background: white;
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
        }

        .result-detail p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 5px;
        }

        .result-detail p:last-child {
            border-bottom: none;
        }

        .result-detail .total {
            font-size: 19px;
            font-weight: bold;
            color: #0b5e2e;
        }

        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 25px 0;
        }

        .form-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 18px;
        }

        .form-row label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
            font-size: 15px;
        }

        .form-row input {
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border 0.2s;
        }

        .form-row input:focus {
            outline: none;
            border-color: #3498db;
        }

        .form-row input[type="number"]::-webkit-outer-spin-button,
        .form-row input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        button[type="submit"] {
            background: #3498db;
            color: white;
            border: none;
            padding: 15px 20px;
            font-size: 19px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s, transform 0.1s;
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(52, 152, 219, 0.3);
        }

        button[type="submit"]:hover {
            background: #2980b9;
        }

        button[type="submit"]:active {
            transform: scale(0.98);
        }

        .note {
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 20px;
        }

        .small-print {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            color: #555;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Tip Calculator</h1>

        <!-- Display the form -->
        <form method="post" action="<?= htmlspecialchars($_SERVER['PHP_SELF']) ?>">
            <div class="form-row">
                <label for="servername">Server Name:</label>
                <input type="text" id="servername" name="servername" value="<?= $servername ?? '' ?>" required>
            </div>
            <div class="form-row">
                <label for="email1">Email:</label>
                <input type="email" id="email1" name="email1" value="<?= $email1 ?? '' ?>" required>
            </div>
            <div class="form-row">
                <label for="email2">Confirm Email:</label>
                <input type="email" id="email2" name="email2" value="<?= $email2 ?? '' ?>" required>
            </div>
            <div class="form-row">
                <label for="bill">Bill Amount ($):</label>
                <input type="number" id="bill" name="bill" step="0.01" min="0.01" value="<?= $bill ?? '' ?>" required>
            </div>
            <div class="form-row">
                <label for="tip">Tip (%):</label>
                <input type="number" id="tip" name="tip" min="0" max="100" value="<?= $tip_percent ?? '' ?>" required>
            </div>
            <div class="form-row">
                <label for="creditcard">Credit Card (16 digits):</label>
                <input type="text" id="creditcard" name="creditcard" pattern="\d{16}" title="Must be 16 digits" value="<?= $creditcard ?? '' ?>" required>
            </div>
            <button type="submit">Calculate Tip</button>
        </form>

        <!-- Display results or errors after form submission -->
        <?php if ($show_results): ?>
            <hr>
            <div class="result-box">
                <h2>Thank you, <?= htmlspecialchars($servername) ?>!</h2>
                <div class="result-detail">
                    <p><span>Email:</span> <span><?= htmlspecialchars($email1) ?></span></p>
                    <p><span>Original Bill:</span> <span>$<?= number_format($bill_float, 2) ?></span></p>
                    <p><span>Tip (<?= $tip_percent_int ?>%):</span> <span>$<?= number_format($tip_amount, 2) ?></span></p>
                    <p class="total"><span>Total:</span> <span>$<?= number_format($total, 2) ?></span></p>
                    <p><span>Credit Card:</span> <span>**** **** **** <?= substr($creditcard_raw, -4) ?></span></p>
                </div>
            </div>
        <?php elseif (!empty($error_message)): ?>
            <hr>
            <div class="error-box">
                <h3>Please fix the following errors:</h3>
                <p><?= $error_message ?></p>
            </div>
        <?php endif; ?>

        <div class="note small-print">
            Credit card information is not stored. For demonstration only.
        </div>
    </div>
</body>

</html>