document.addEventListener('DOMContentLoaded', function () {
    // Get all rabbit elements and message elements
    const rabbits = [
        document.getElementById('rabbit1'),
        document.getElementById('rabbit2'),
        document.getElementById('rabbit3'),
        document.getElementById('rabbit4')
    ];

    const noEggsMsg = document.getElementById('noeggs');
    const slowMsg = document.getElementById('slow');

    // Set initial state
    let currentRabbit = 0; // Index of currently visible rabbit (0-3)
    let attempts = 0;

    // Hide all rabbits except the first one
    for (let i = 1; i < rabbits.length; i++) {
        rabbits[i].style.visibility = 'hidden';
    }

    // Hide messages initially
    noEggsMsg.style.visibility = 'hidden';
    slowMsg.style.visibility = 'hidden';

    // Add mouseover event to all rabbits
    rabbits.forEach(rabbit => {
        rabbit.addEventListener('mouseover', function () {
            // Only process if this is the currently visible rabbit
            if (rabbit === rabbits[currentRabbit]) {
                attempts++;

                // Check for message conditions
                if (attempts === 4) {
                    noEggsMsg.style.visibility = 'visible';
                } else if (attempts === 20) {
                    slowMsg.style.visibility = 'visible';
                }

                // Hide current rabbit
                rabbit.style.visibility = 'hidden';

                // Move to next rabbit (with wrap-around)
                currentRabbit = (currentRabbit + 1) % 4;

                // Show next rabbit
                rabbits[currentRabbit].style.visibility = 'visible';
            }
        });
    });
});