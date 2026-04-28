/*
   Author: Daniel & Abdullah
   Date: 2026-02-18
   Description: JavaScript for Banana Empire incremental game
*/

window.addEventListener('load', function () {
    // Game state variables
    let bananas = 0;
    let manualClicks = 0;
    let clickValue = 1;

    // CPS upgrade data - seven levels with names, costs, values, images and descriptions
    const cpsUpgrades = [
        { level: 1, name: 'Peeling Monkey', cost: 25, value: 2, image: 'peelingMonkey.png', desc: 'He is a happy fella and increases the value of each click from 1 to 2.' },
        { level: 2, name: 'Smoothie Blender', cost: 100, value: 8, image: 'smoothieBlender.png', desc: 'High-speed blenders that turn your harvest into Banana Milk or smoothies, boosting click value to 8.' },
        { level: 3, name: 'Tropical Plantations', cost: 200, value: 36, image: 'tropicalPlantation.png', desc: 'Large-scale farms that grow exotic banana varieties like "Blue Java" to increase your base production to 36.' },
        { level: 4, name: 'Potassium Mine', cost: 400, value: 99, image: 'potassiumMine.png', desc: 'Deep excavations where miners dig for crystallized banana essence and mineral-rich soil, raising click value to 99.' },
        { level: 5, name: 'Banana Republic', cost: 800, value: 202, image: 'bananaRepublic.png', desc: 'Industrial shipping hubs that automate the global export of your fruit, increasing click value to 202.' },
        { level: 6, name: 'Banana Space Station', cost: 1600, value: 1000, image: 'bananaSpaceStation.png', desc: 'An orbital facility that uses zero-gravity to grow perfectly straight, massive bananas for the intergalactic market - click value 1000.' },
        { level: 7, name: 'Prehistoric Banana', cost: 3200, value: 2000, image: 'prehistoricBanana.png', desc: 'A "Time Machine" style upgrade that harvests ancient, giant bananas perfectly preserved in Arctic ice, boosting click value to 2000.' }
    ];
    let currentCpsLevel = 0;

    // Auto-clicker properties
    let autoClicker = {
        purchased: false,
        level: 0,
        baseCost: 100,
        upgradeBaseCost: 1000,
        currentUpgradeCost: 1000,
        intervalMs: 30000,
        timerId: null
    };

    // Trophy definitions with check functions
    const trophies = [
        { id: 'noLife', name: 'No life', achieved: false, check: function () { return bananas >= 1e9; }, emoji: '🏆' },
        { id: 'stopClicking', name: 'STOP CLICKING', achieved: false, check: function () { return manualClicks >= 20000; }, emoji: '🖐️' },
        { id: 'timeIsGone', name: 'Time is gone', achieved: false, check: function () { return currentCpsLevel >= 7; }, emoji: '⏳' },
        { id: 'fingersRest', name: 'Your fingers can now rest', achieved: false, check: function () { return autoClicker.purchased; }, emoji: '😌' },
        { id: 'oohAh', name: 'ooh ooh ah ah', achieved: false, check: function () { return currentCpsLevel >= 1; }, emoji: '🐒' }
    ];

    // Get references to all dom elements that will be updated
    const bananaImage = document.getElementById('bananaImage');
    const bananaCountSpan = document.getElementById('bananaCount');
    const clickValueSpan = document.getElementById('clickValue');
    const autoLevelSpan = document.getElementById('autoLevel');
    const manualClicksSpan = document.getElementById('manualClicks');

    const cpsUpgradeImg = document.getElementById('cpsUpgradeImage');
    const cpsUpgradeName = document.getElementById('cpsUpgradeName');
    const cpsUpgradeDesc = document.getElementById('cpsUpgradeDesc');
    const cpsUpgradeCostSpan = document.getElementById('cpsUpgradeCost');
    const cpsUpgradeBtn = document.getElementById('cpsUpgradeButton');

    const cpsVisualContainer = document.getElementById('cpsVisualContainer');
    const cpsVisualImage = document.getElementById('cpsVisualImage');

    const autoTitle = document.getElementById('autoClickerTitle');
    const autoDesc = document.getElementById('autoClickerDesc');
    const autoCostSpan = document.getElementById('autoClickerCost');
    const autoBtn = document.getElementById('autoClickerButton');

    const rewardsContainer = document.getElementById('rewardsContainer');
    const congratsDiv = document.getElementById('congratsMessage');
    const trophyCountSpan = document.getElementById('trophyCount');
    const middleColumn = document.querySelector('.middle-column');

    const helpBtn = document.getElementById('helpButton');
    const helpPanel = document.getElementById('helpPanel');

    // Timer for hiding congratulations message
    let congratsTimer = null;

    /**
     * Displays a temporary congratulations message at the bottom left
     * @param {string} text - The message to display
     * @returns {void}
     */
    function showCongrats(text) {
        if (congratsTimer) {
            clearTimeout(congratsTimer);
        }
        congratsDiv.textContent = text;
        congratsDiv.classList.remove('hidden');
        congratsTimer = setTimeout(function () {
            congratsDiv.classList.add('hidden');
        }, 3000);
    }

    /**
     * Updates the trophy counter display (e.g., (2/5))
     * @returns {void}
     */
    function updateTrophyCounter() {
        let achievedCount = 0;
        for (let i = 0; i < trophies.length; i++) {
            if (trophies[i].achieved) {
                achievedCount++;
            }
        }
        trophyCountSpan.textContent = '(' + achievedCount + '/5)';
    }

    /**
     * Checks all trophy conditions and unlocks any that are newly achieved
     * Also updates the trophy counter and shows a congrats message
     * @returns {void}
     */
    function checkTrophies() {
        for (let i = 0; i < trophies.length; i++) {
            let t = trophies[i];
            if (!t.achieved && t.check()) {
                t.achieved = true;
                let badge = document.createElement('span');
                badge.className = 'badge';
                badge.title = t.name;
                badge.textContent = t.emoji;
                rewardsContainer.appendChild(badge);
                showCongrats('Trophy Unlocked: ' + t.name);
            }
        }
        updateTrophyCounter();
    }

    /**
     * Starts or restarts the auto-clicker interval timer
     * Clears any existing timer before starting a new one
     * @returns {void}
     */
    function startAutoClicker() {
        if (autoClicker.timerId) {
            clearInterval(autoClicker.timerId);
        }
        if (autoClicker.purchased && autoClicker.level > 0) {
            autoClicker.timerId = setInterval(function () {
                bananas += clickValue;
                updateDisplay();
            }, autoClicker.intervalMs);
        }
    }

    /**
     * Updates all UI elements to reflect the current game state
     * Called after any state change
     * @returns {void}
     */
    function updateDisplay() {
        // Update basic statistics
        bananaCountSpan.textContent = Math.floor(bananas);
        clickValueSpan.textContent = clickValue;
        autoLevelSpan.textContent = autoClicker.level;
        manualClicksSpan.textContent = manualClicks;

        // Update cps upgrade card with next available upgrade or max level message
        if (currentCpsLevel < 7) {
            let next = cpsUpgrades[currentCpsLevel];
            cpsUpgradeName.textContent = next.name;
            cpsUpgradeDesc.textContent = next.desc;
            cpsUpgradeCostSpan.textContent = next.cost;
            cpsUpgradeBtn.disabled = (bananas < next.cost);
            cpsUpgradeImg.src = 'imagesIncrements/CPSUpgrades/' + next.image;
        } else {
            cpsUpgradeName.textContent = 'Max level';
            cpsUpgradeDesc.textContent = 'All cps upgrades purchased';
            cpsUpgradeCostSpan.textContent = '-';
            cpsUpgradeBtn.disabled = true;
            let last = cpsUpgrades[6];
            cpsUpgradeImg.src = 'imagesIncrements/CPSUpgrades/' + last.image;
        }

        // Show or hide the cps visual in middle column and adjust trophy positioning
        if (currentCpsLevel === 0) {
            cpsVisualContainer.style.display = 'none';
            middleColumn.classList.add('cps-hidden');
        } else {
            let current = cpsUpgrades[currentCpsLevel - 1];
            cpsVisualImage.src = 'imagesIncrements/CPSUpgrades/' + current.image;
            cpsVisualContainer.style.display = 'flex';
            middleColumn.classList.remove('cps-hidden');
        }

        // Update auto-clicker card based on purchase state
        if (!autoClicker.purchased) {
            autoTitle.textContent = 'auto-clicker (not owned)';
            autoDesc.textContent = 'First purchase: clicks every 30 seconds.';
            autoCostSpan.textContent = autoClicker.baseCost;
            autoBtn.textContent = 'purchase';
            autoBtn.disabled = (bananas < autoClicker.baseCost);
        } else {
            autoTitle.textContent = 'auto-clicker level ' + autoClicker.level;
            let sec = (autoClicker.intervalMs / 1000).toFixed(1);
            autoDesc.textContent = 'Clicks every ' + sec + ' seconds. Speed increased by 20% per upgrade.';
            autoCostSpan.textContent = autoClicker.currentUpgradeCost;
            autoBtn.textContent = 'upgrade speed';
            autoBtn.disabled = (bananas < autoClicker.currentUpgradeCost);
        }

        checkTrophies();
    }

    /**
     * Attempts to purchase the next CPS upgrade if the player has enough bananas
     * Updates game state and UI on success
     * @returns {void}
     */
    function buyCpsUpgrade() {
        if (currentCpsLevel >= 7) {
            return;
        }
        let next = cpsUpgrades[currentCpsLevel];
        if (bananas >= next.cost) {
            bananas -= next.cost;
            currentCpsLevel++;
            clickValue = next.value;
            updateDisplay();
        }
    }

    /**
     * Attempts to purchase the auto-clicker or upgrade its speed
     * Handles first purchase separately from subsequent speed upgrades
     * Updates game state and UI on success
     * @returns {void}
     */
    function buyAutoClicker() {
        if (!autoClicker.purchased) {
            if (bananas >= autoClicker.baseCost) {
                bananas -= autoClicker.baseCost;
                autoClicker.purchased = true;
                autoClicker.level = 1;
                autoClicker.intervalMs = 30000;
                autoClicker.currentUpgradeCost = autoClicker.upgradeBaseCost;
                startAutoClicker();
                updateDisplay();
            }
        } else {
            if (bananas >= autoClicker.currentUpgradeCost) {
                bananas -= autoClicker.currentUpgradeCost;
                autoClicker.level++;
                autoClicker.intervalMs = Math.floor(autoClicker.intervalMs / 1.2);
                if (autoClicker.intervalMs < 100) {
                    autoClicker.intervalMs = 100;
                }
                autoClicker.currentUpgradeCost = Math.floor(autoClicker.currentUpgradeCost * 1.2);
                startAutoClicker();
                updateDisplay();
            }
        }
    }

    // Event listeners for user interactions
    bananaImage.addEventListener('click', function () {
        bananas += clickValue;
        manualClicks++;
        updateDisplay();
    });

    cpsUpgradeBtn.addEventListener('click', buyCpsUpgrade);
    autoBtn.addEventListener('click', buyAutoClicker);

    helpBtn.addEventListener('click', function () {
        helpPanel.classList.toggle('hidden');
    });

    window.addEventListener('click', function (e) {
        if (!helpPanel.contains(e.target) && e.target !== helpBtn && !helpPanel.classList.contains('hidden')) {
            helpPanel.classList.add('hidden');
        }
    });

    // Initial display update
    updateDisplay();
    updateTrophyCounter();
});