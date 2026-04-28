// Exercise 3: Single Lottery Ball Object
function createBall() {
    const colors = ['red', 'white'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomValue = Math.floor(Math.random() * 101); // 0 to 100

    return {
        color: randomColor,
        value: randomValue
    };
}

// Create and display a single ball (Exercise 3)
const singleBall = createBall();
alert(`Exercise 3: Single Ball Created!\nColor: ${singleBall.color}\nValue: ${singleBall.value}`);

// Exercise 4: Array of 100 balls and game logic
function initializeBalls() {
    const balls = [];
    for (let i = 0; i < 100; i++) {
        balls.push(createBall());
    }
    return balls;
}

function playLotteryGame() {
    const balls = initializeBalls();
    const drawnBalls = new Set(); // Track drawn balls by index
    let totalScore = 0;
    let gameActive = true;

    alert("Exercise 4: Welcome to the Lottery Ball Game!\n\nYou can draw balls by entering their index (0-99).\nWhite balls add points, red balls end the game and deduct points.");

    while (gameActive) {
        let input = prompt(
            `Current Score: ${totalScore}\n\n` +
            `Enter a ball index (0-99) to draw, or type 'quit' to exit:`
        );

        // Check if user wants to quit
        if (input === null || input.toLowerCase() === 'quit') {
            gameActive = false;
            break;
        }

        const index = parseInt(input);

        // Validate input
        if (isNaN(index) || index < 0 || index > 99) {
            alert("Invalid input! Please enter a number between 0 and 99.");
            continue;
        }

        // Check if ball was already drawn
        if (drawnBalls.has(index)) {
            alert(`Ball ${index} was already drawn! Try a different one.`);
            continue;
        }

        // Draw the ball
        drawnBalls.add(index);
        const ball = balls[index];

        alert(`You drew ball ${index}:\nColor: ${ball.color}\nValue: ${ball.value}`);

        // Process the ball
        if (ball.color === 'red') {
            totalScore -= ball.value;
            alert(`RED BALL! Game Over!\nYou lost ${ball.value} points.`);
            gameActive = false;
        } else {
            totalScore += ball.value;
            alert(`WHITE BALL! You gained ${ball.value} points.\nTotal score: ${totalScore}`);

            // Ask if they want to continue (unless they got a red ball)
            const continuePlaying = confirm("Would you like to draw another ball?");
            if (!continuePlaying) {
                gameActive = false;
            }
        }
    }

    // Show final score
    alert(`Game Over!\n\nTotal Score: ${totalScore}\nBalls Drawn: ${drawnBalls.size}`);
}

// Start the game
playLotteryGame();