<?php
/**
 * Author: Daniel Yu
 * Date: 2026-03-18
 * Description: Main game page. Expects an email GET parameter.
 *              Embeds the email into JavaScript for use by the game logic.
 *              If email is missing, shows error and link to index.
 */
session_start();
$email = filter_input(INPUT_GET, 'email', FILTER_SANITIZE_EMAIL);
if (!$email) {
    die("Error: No email provided. Please <a href='index.php'>login</a> first.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>VANTAGE - Play</title>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="stylesPHPAssign/phpAssignStyles.css">
    <link rel="icon" type="image/x-icon" href="imagesPHPAssign/favicon.ico">
</head>
<body>
    <!-- Game container - same structure as original index.html -->
    <div id="splash" class="splash">
        <h1>VANTAGE</h1>
        <canvas id="splashCanvas" width="400" height="400"></canvas>
        <p id="splashMsg">LOADING . . .</p>
        <button id="startBtn" class="hidden">START</button>
    </div>

    <div id="gameContainer" class="hidden">
        <header>
            <h1>Tutorial</h1>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div id="bestTime" style="margin-left: 10px;">--:--</div>
                <div id="levelStars" style="display: flex; gap: 2px; margin-left: 10px;">
                    <img src="imagesPHPAssign/emptyStar.png" class="star" id="star1">
                    <img src="imagesPHPAssign/emptyStar.png" class="star" id="star2">
                    <img src="imagesPHPAssign/emptyStar.png" class="star" id="star3">
                </div>
                <div id="levelStatus">level 1 / 3</div>
                <button id="restartBtn" title="Restart level">↻</button>
            </div>
        </header>

        <button id="prevLevelBtn" class="hidden" title="Previous level">◀</button>
        <button id="nextLevelBtn" class="hidden" title="Next level">▶</button>

        <div class="canvas-wrapper">
            <canvas id="gameCanvas" width="400" height="700"></canvas>
        </div>

        <div id="selectionControls" class="selection-controls hidden">
            <button id="zoomOutBtn" class="control-btn" title="Zoom Out">−</button>
            <button id="zoomInBtn" class="control-btn" title="Zoom In">+</button>
            <button id="rotateBtn" class="control-btn" title="Rotate">R</button>
        </div>

        <button id="jumpBtn" class="jump-btn" title="Jump">↑</button>
        <button id="moveLeftBtn" class="move-btn" title="Move Left">←</button>
        <button id="moveRightBtn" class="move-btn" title="Move Right">→</button>
        <button id="helpBtn">?</button>

        <div id="helpPanel" class="hidden">
            <h3>How to play</h3>
            <p>Use buttons on screen to move or use W/A/D or arrow keys to move the character.</p>
            <p>Tap an object to select it and drop it. Use the buttons to zoom in/out, rotate.</p>
            <p>Use blocks to bridge gaps, create towers, etc., to reach the exit.</p>
        </div>

        <div id="pauseOverlay" class="hidden"></div>

        <div id="gameover" class="hidden">
            <h2>level complete!</h2>
            <p id="finalMsg"></p>
            <div id="history"></div>
            <button id="replayBtn">play again</button>
        </div>

        <div id="feedback" class="hidden"></div>
    </div>

    <button id="quitBtn">Quit</button>

    <script>
        var userEmail = "<?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?>";
        window.isPlayPage = true;
    </script>
    <script src="javaScripPHPAssign/phpAssignJS.js"></script>
</body>
</html>