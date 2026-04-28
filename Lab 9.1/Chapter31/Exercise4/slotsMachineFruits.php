<!DOCTYPE html>
<!-- A simple PHP Slot Machine. Adapted from Sam Scott's template, 2025 -->
<html>

<head>
    <title> PHP Slot Machine </title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Style to make it look like a slot machine */
        body {
            font-family: 'Courier New', monospace;
            background: #2e1b0e;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }

        .slot-machine {
            background: #ffe388;
            padding: 30px 20px 30px 20px;
            border-radius: 40px 40px 20px 20px;
            box-shadow: 0 20px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px #aa7c4f;
            border: 8px solid #8b5a2b;
            text-align: center;
            width: fit-content;
        }

        .reels {
            background: #000;
            padding: 30px 20px;
            border-radius: 30px;
            border: 5px inset #bba77e;
            display: flex;
            gap: 25px;
            justify-content: center;
            margin-bottom: 30px;
            box-shadow: inset 0 0 20px #333;
        }

        .reel {
            background: #fff;
            border-radius: 20px;
            padding: 15px;
            box-shadow: 0 0 0 4px #c0a062, 0 10px 15px rgba(0, 0, 0, 0.5);
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .reel img {
            max-width: 100px;
            max-height: 100px;
            image-rendering: crisp-edges;
        }

        .message {
            font-size: 35px;
            font-weight: bold;
            background: #f9f3d9;
            padding: 20px 30px;
            border-radius: 60px;
            border: 5px groove #d4af37;
            margin: 20px 0 25px 0;
            color: #2c1e0e;
            text-shadow: 2px 2px 0 #e6c78c;
            letter-spacing: 2px;
        }

        .play-again {
            display: inline-block;
            background: #e62e2e;
            color: white;
            font-size: 29px;
            font-weight: bold;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 40px;
            border-bottom: 8px solid #8b1a1a;
            border-right: 4px solid #8b1a1a;
            font-family: inherit;
            text-transform: uppercase;
            transition: 0.1s ease;
            box-shadow: 0 10px 0 #4d2e1b;
            margin-top: 15px;
        }

        .play-again:hover {
            background: #ff4d4d;
            transform: translateY(3px);
            border-bottom-width: 5px;
            box-shadow: 0 7px 0 #4d2e1b;
        }

        .play-again:active {
            transform: translateY(8px);
            border-bottom-width: 2px;
            box-shadow: 0 2px 0 #4d2e1b;
        }

        footer {
            color: #ecd9b4;
            margin-top: 15px;
            font-size: 18px;
        }
    </style>
</head>

<body>
    <?php
    // Define the range of fruit image numbers (1 to 7)
    $min_fruit = 1;
    $max_fruit = 7;

    // Generate three random fruit numbers
    $fruit1 = rand($min_fruit, $max_fruit);
    $fruit2 = rand($min_fruit, $max_fruit);
    $fruit3 = rand($min_fruit, $max_fruit);

    // Determine the win message based on matches
    $win_message = "Better luck next spin!";

    // Check for jackpot (all three match)
    if ($fruit1 == $fruit2 && $fruit2 == $fruit3) {
        $win_message = "JACKPOT!";
    }
    // Check for two matching (but not all three)
    elseif ($fruit1 == $fruit2 || $fruit1 == $fruit3 || $fruit2 == $fruit3) {
        $win_message = "You win a small prize!";
    }

    // Path to the fruit images
    $image_path = "fruits/";
    $extension = ".png";
    ?>

    <div class="slot-machine">
        <h1 style="color: #ffd966; margin-top: 0; font-size: 48px; text-shadow: 4px 4px 0 #7a4f1a;">SLOT FRUIT</h1>
        <div class="reels">
            <div class="reel">
                <img src="<?= $image_path . $fruit1 . $extension ?>" alt="Fruit <?= $fruit1 ?>">
            </div>
            <div class="reel">
                <img src="<?= $image_path . $fruit2 . $extension ?>" alt="Fruit <?= $fruit2 ?>">
            </div>
            <div class="reel">
                <img src="<?= $image_path . $fruit3 . $extension ?>" alt="Fruit <?= $fruit3 ?>">
            </div>
        </div>

        <div class="message">
            <?= $win_message ?>
        </div>

        <a class="play-again" href="<?= $_SERVER['PHP_SELF'] ?>">PUSH BUTTON</a>
        <footer>~ Pull the lever for another round! ~</footer>
    </div>
</body>

</html>