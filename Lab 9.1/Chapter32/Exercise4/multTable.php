<?php
// Default values
$default_rows = 10;
$default_cols = 10;
$default_title = "Multiplication Table";
$default_header = "#3498db";
$default_bg = "#ffffff";
$default_text = "#000000";
$default_op = "multiply";

// Retrieve parameters with defaults if missing
$title = filter_input(INPUT_GET, "title", FILTER_SANITIZE_SPECIAL_CHARS);
$rows_param = filter_input(INPUT_GET, "rows", FILTER_VALIDATE_INT);
$cols_param = filter_input(INPUT_GET, "cols", FILTER_VALIDATE_INT);
$operation = filter_input(INPUT_GET, "operation", FILTER_SANITIZE_SPECIAL_CHARS);
$header_color = filter_input(INPUT_GET, "header_color", FILTER_SANITIZE_SPECIAL_CHARS);
$bg_color = filter_input(INPUT_GET, "bg_color", FILTER_SANITIZE_SPECIAL_CHARS);
$text_color = filter_input(INPUT_GET, "text_color", FILTER_SANITIZE_SPECIAL_CHARS);

// Track missing parameters for warning
$missing = [];
if ($title === null || $title === false || $title === "") $missing[] = "title";
if ($rows_param === null || $rows_param === false) $missing[] = "rows";
if ($cols_param === null || $cols_param === false) $missing[] = "columns";
if ($operation === null || $operation === false) $missing[] = "operation";
if ($header_color === null || $header_color === false) $missing[] = "header color";
if ($bg_color === null || $bg_color === false) $missing[] = "background color";
if ($text_color === null || $text_color === false) $missing[] = "text color";

// Apply defaults for missing or invalid values
$title = $title ?: $default_title;
$rows = ($rows_param && $rows_param > 0 && $rows_param <= 20) ? $rows_param : $default_rows;
$cols = ($cols_param && $cols_param > 0 && $cols_param <= 20) ? $cols_param : $default_cols;
$header_color = $header_color ?: $default_header;
$bg_color = $bg_color ?: $default_bg;
$text_color = $text_color ?: $default_text;

// Validate operation
$valid_ops = ['multiply', 'add', 'subtract'];
$operation = in_array($operation, $valid_ops) ? $operation : $default_op;

// Define the operation function
function calculate($i, $j, $op)
{
    switch ($op) {
        case 'add':
            return $i + $j;
        case 'subtract':
            return $i - $j;
        default:
            return $i * $j;
    }
}

// Get operation symbol for display
function get_symbol($op)
{
    switch ($op) {
        case 'add':
            return '+';
        case 'subtract':
            return '−';
        default:
            return '×';
    }
}
$symbol = get_symbol($operation);
?>
<!DOCTYPE html>
<html>

<head>
    <title><?= htmlspecialchars($title) ?></title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 90%;
            overflow-x: auto;
        }

        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #ffeeba;
        }

        table {
            border-collapse: collapse;
            margin: 20px 0;
            background: <?= htmlspecialchars($bg_color) ?>;
            color: <?= htmlspecialchars($text_color) ?>;
        }

        td {
            padding: 10px 15px;
            border: 1px solid #999;
            text-align: center;
        }

        tr:first-child td,
        td:first-child {
            background: <?= htmlspecialchars($header_color) ?>;
            color: white;
            font-weight: bold;
        }

        .back-link {
            margin-top: 20px;
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }

        .back-link:hover {
            background: #2980b9;
        }

        .params {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            color: #666;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1><?= htmlspecialchars($title) ?></h1>

        <div class="params">
            Operation: <?= ucfirst($operation) ?> (<?= $symbol ?>) |
            Size: <?= $rows ?> rows × <?= $cols ?> columns
        </div>

        <?php if (!empty($missing)): ?>
            <div class="warning">
                <strong>Note:</strong> The following parameters were missing or invalid,
                so default values were used: <?= implode(', ', $missing) ?>.
            </div>
        <?php endif; ?>

        <table>
            <?php for ($i = 0; $i <= $rows; $i++): ?>
                <tr>
                    <?php for ($j = 0; $j <= $cols; $j++): ?>
                        <?php if ($i == 0 && $j == 0): ?>
                            <td><?= $symbol ?></td>
                        <?php elseif ($i == 0): ?>
                            <td><?= $j ?></td>
                        <?php elseif ($j == 0): ?>
                            <td><?= $i ?></td>
                        <?php else: ?>
                            <td><?= calculate($i, $j, $operation) ?></td>
                        <?php endif; ?>
                    <?php endfor; ?>
                </tr>
            <?php endfor; ?>
        </table>

        <a href="form.html" class="back-link">← Create Another Table</a>
    </div>
</body>

</html>