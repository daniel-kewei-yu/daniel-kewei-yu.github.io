/*
Name: Shiza Afaqui & Leena Matheen 
Date: February 27, 2026
Description: JavaScript file for the Shawarma Clicker game. It handles the game logic, 
including clicking to earn shawarmas, purchasing upgrades, the auto-clicker , achievement 
tracking, and updating the progress bar.
*/

window.addEventListener("load", function() {

   let shawarmaButton = document.getElementById("shawarmaButton");
   let countSpan = document.getElementById("count");

   let shawarmaValue = document.getElementById("shawarmaValue");
   let clickValue = document.getElementById("clickValue");
   let upgradeValue = document.getElementById("upgradeValue");
   let autoValue = document.getElementById("autoValue");

   let pickleBtn = document.querySelectorAll(".upgrader")[0];
   let hotsauceBtn = document.querySelectorAll(".upgrader")[1];
   let friesBtn = document.querySelectorAll(".upgrader")[2];
   let autoClickerButton = document.querySelector(".upgraderspeed");

   let pickleCostDisplay = document.getElementById("pickleCostDisplay");
   let hotsauceCostDisplay = document.getElementById("hotsauceCostDisplay");
   let friesCostDisplay = document.getElementById("friesCostDisplay");
   let autoCostDisplay = document.getElementById("autoCostDisplay");

   let rewardsArea = document.getElementById("rewardContent");

   let helpBtn = document.getElementById("help-btn");
   let helpOverlay = document.getElementById("help-overlay");
   let closeHelpBtn = document.getElementById("close-help");
   let popupMsg = document.getElementById("popup-msg");

   let progressBar = document.getElementById("progressBar");
   let progressText = document.getElementById("progressText");

   let shawarmas = 0;
   let maxShawarmas = 0;
   let totalEarned = 0;
   let multiplier = 1;

   let pickleCost = 10;
   let pickleCount = 0;

   let hotsauceCost = 25;
   let hotsauceCount = 0;

   let friesCost = 60;
   let friesCount = 0;

   let autoClickerCost = 15;
   let autoClickerCount = 0;
   let autoClickerTimer = null;

   let gotRollRookie = false;
   let gotKitchenHelper = false;
   let gotGrillMaster = false;
   let gotShawarmaSultan = false;
   let gotChosenOne = false;

   let gotPickleEnthusiast = false;
   let gotSauceSpecialist = false;
   let gotFryCommander = false;
   let gotSpeedDemon = false;


   /**
    * updateDisplay
    * ----------------------------
    * Purpose:
    * Updates all visual elements so the screen reflects
    * the current state of the game.
    *
    * Parameters:
    * None
    *
    * Returns:
    * Nothing
    */
   function updateDisplay() {

       countSpan.innerHTML = shawarmas;
       shawarmaValue.innerHTML = shawarmas;
       clickValue.innerHTML = multiplier;

       upgradeValue.innerHTML =
           "Pickle x" + pickleCount +
           " | Sauce x" + hotsauceCount +
           " | Fries x" + friesCount;

        if (autoClickerCount > 0) {
            autoValue.innerHTML = "LVL " + autoClickerCount;
        }
        else {
            autoValue.innerHTML = "OFF";
        }

       pickleCostDisplay.innerHTML = "(" + pickleCost + " shawarmas)";
       hotsauceCostDisplay.innerHTML = "(" + hotsauceCost + " shawarmas)";
       friesCostDisplay.innerHTML = "(" + friesCost + " shawarmas)";
       autoCostDisplay.innerHTML = "(" + autoClickerCost + " shawarmas)";

       checkRewards();
       updateProgress();
   }


   /**
    * updateProgress
    * ----------------------------
    * Purpose:
    * Updates the progress bar to show how far the player
    * is within the current milestone range. Uses maxShawarmas
    * to determine the tier so purchases never reset the bar.
    *
    * Parameters:
    * None
    *
    * Returns:
    * Nothing
    */
   function updateProgress() {

       let lowerBound;
       let upperBound;

       if (maxShawarmas < 1) {
           lowerBound = 0;
           upperBound = 1;
       }
       else if (maxShawarmas < 100) {
           lowerBound = 1;
           upperBound = 100;
       }
       else if (maxShawarmas < 1000) {
           lowerBound = 100;
           upperBound = 1000;
       }
       else if (maxShawarmas < 10000) {
           lowerBound = 1000;
           upperBound = 10000;
       }
       else if (maxShawarmas < 100000) {
           lowerBound = 10000;
           upperBound = 100000;
       }
       else {
           progressBar.style.width = "100%";
           progressText.textContent = "All milestones reached!";
           return;
       }

       let progress = shawarmas - lowerBound;
       let range = upperBound - lowerBound;
       let percent = (progress / range) * 100;
       if (percent < 0) percent = 0;

       progressBar.style.width = percent + "%";
       progressText.textContent = shawarmas + " / " + upperBound;
   }


   /**
    * checkRewards
    * ----------------------------
    * Purpose:
    * Checks if achievement conditions are met
    * and unlocks them when appropriate.
    *
    * Parameters:
    * None
    *
    * Returns:
    * Nothing
    */
   function checkRewards() {

       if (!gotRollRookie && shawarmas >= 1) {
           gotRollRookie = true;
           addReward("🌯 Roll Rookie");
       }

       if (!gotKitchenHelper && shawarmas >= 100) {
           gotKitchenHelper = true;
           addReward("🍴 Kitchen Helper");
       }

       if (!gotGrillMaster && shawarmas >= 1000) {
           gotGrillMaster = true;
           addReward("🔥 Grill Master");
       }

       if (!gotShawarmaSultan && shawarmas >= 10000) {
           gotShawarmaSultan = true;
           addReward("👑 Shawarma Sultan");
       }

       if (!gotChosenOne && shawarmas >= 100000) {
           gotChosenOne = true;
           addReward("⭐ The Chosen One of the Grill");
       }

       if (!gotPickleEnthusiast && pickleCount >= 10) {
           gotPickleEnthusiast = true;
           addReward("🥒 Pickle Enthusiast");
       }

       if (!gotSauceSpecialist && hotsauceCount >= 10) {
           gotSauceSpecialist = true;
           addReward("🌶 Sauce Specialist");
       }

       if (!gotFryCommander && friesCount >= 10) {
           gotFryCommander = true;
           addReward("🍟 Fry Commander");
       }

       if (!gotSpeedDemon && autoClickerCount >= 5) {
           gotSpeedDemon = true;
           addReward("⚡ Speed Demon");
       }
   }


   function addReward(text) {
       let badge = document.createElement("div");
       badge.className = "reward-badge";
       badge.innerHTML = text;
       rewardsArea.appendChild(badge);

       showMessage("Achievement Unlocked: " + text);
   }

   function showMessage(text) {
       popupMsg.innerHTML = text;
       popupMsg.style.display = "block";

       setTimeout(function() {
           popupMsg.style.display = "none";
       }, 5000);
   }

// ----------------------------
// Event Listeners
// ----------------------------
// Event listeners that handle all user interactions,
// including clicking the shawarma, purchasing upgrades,
// activating the auto-clicker, and opening/closing the help menu.

   shawarmaButton.addEventListener("click", function() {
       shawarmas += multiplier;
       totalEarned += multiplier;
       if (shawarmas > maxShawarmas) maxShawarmas = shawarmas;
       updateDisplay();
   });

   pickleBtn.addEventListener("click", function() {
       if (shawarmas >= pickleCost) {
           shawarmas -= pickleCost;
           multiplier += 1;
           pickleCount++;
           pickleCost = Math.ceil(pickleCost * 2.6);
           updateDisplay();
       }
   });

   hotsauceBtn.addEventListener("click", function() {
       if (shawarmas >= hotsauceCost) {
           shawarmas -= hotsauceCost;
           multiplier += 3;
           hotsauceCount++;
           hotsauceCost = Math.ceil(hotsauceCost * 2.7);
           updateDisplay();
       }
   });

   friesBtn.addEventListener("click", function() {
       if (shawarmas >= friesCost) {
           shawarmas -= friesCost;
           multiplier += 8;
           friesCount++;
           friesCost = Math.ceil(friesCost * 1.8);
           updateDisplay();
       }
   });

   autoClickerButton.addEventListener("click", function() {
       if (shawarmas >= autoClickerCost) {

           shawarmas -= autoClickerCost;
           autoClickerCount++;
           autoClickerCost = Math.ceil(autoClickerCost * 4);

           if (autoClickerTimer !== null) {
               clearInterval(autoClickerTimer);
           }

           let interval = Math.floor(2000 / (2 ** (autoClickerCount - 1)));
           if (interval < 200) interval = 200;

           autoClickerTimer = setInterval(function() {
               shawarmas += multiplier;
               totalEarned += multiplier;
               if (shawarmas > maxShawarmas) maxShawarmas = shawarmas;
               updateDisplay();
           }, interval);

           updateDisplay();
       }
   });

   helpBtn.addEventListener("click", function() {
       helpOverlay.style.display = "flex";
   });

   closeHelpBtn.addEventListener("click", function() {
       helpOverlay.style.display = "none";
   });

   updateDisplay();
});