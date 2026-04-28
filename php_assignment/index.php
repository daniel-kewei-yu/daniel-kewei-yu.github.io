<?php
/**
 * Author: Daniel Yu
 * Date: 2026-03-18
 * Description: Landing page for VANTAGE. Displays a login form where users
 *              enter their email and birth date (used as password).
 *              Includes client-side validation for email format.
 */
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VANTAGE - Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="stylesPHPAssign/phpAssignStyles.css">
    <link rel="icon" type="image/x-icon" href="imagesPHPAssign/favicon.ico">
</head>
<body>
    <div class="login-form">
        <h2>VANTAGE</h2>
        <p class="sub-message">Enter your details to begin</p>
        <form id="loginForm" method="POST" action="login.php">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required placeholder="name@example.com">
            </div>
            <div class="form-group">
                <label for="birthdate">Birth Date (password):</label>
                <input type="date" id="birthdate" name="birthdate" required>
            </div>
            <div id="emailError" class="error hidden"></div>
            <button type="submit">Play</button>
        </form>
    </div>

    <script>
        // Flag to indicate this is the index page (not play.php)
        window.isIndexPage = true;
        
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            const email = document.getElementById('email').value.trim();
            const errorDiv = document.getElementById('emailError');
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                errorDiv.textContent = 'Please enter a valid email address (e.g., name@domain.com)';
                errorDiv.classList.remove('hidden');
                e.preventDefault();
            } else {
                errorDiv.classList.add('hidden');
            }
        });
    </script>
    <script src="javaScripPHPAssign/phpAssignJS.js"></script>
</body>
</html>