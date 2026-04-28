
let currentRabbit = 1;
let attempts = 0;

window.addEventListener("load", function(event) {


    // Hide rabbits 2, 3, 4
    for (let i = 2; i <= 4; i++) {
        document.getElementById("rabbit" + i).style.visibility = "hidden";
    }

    // Hide messages
    document.getElementById("noeggs").style.visibility = "hidden";
    document.getElementById("slow").style.visibility = "hidden";

    // Add mouseover listeners
    for (let i = 1; i <= 4; i++) {
        document.getElementById("rabbit" + i)
            .addEventListener("mouseover", moveRabbit);
    }
});

function moveRabbit() {

    attempts++;

    // Hide current rabbit
    document.getElementById("rabbit" + currentRabbit)
        .style.visibility = "hidden";

    // Move to next rabbit (loop back to 1 after 4)
    currentRabbit++;
    if (currentRabbit > 4) {
        currentRabbit = 1;
    }

    // Show next rabbit
    document.getElementById("rabbit" + currentRabbit)
        .style.visibility = "visible";

    // Show messages based on attempts
    if (attempts >= 4) {
        document.getElementById("noeggs")
            .style.visibility = "visible";
    }

    if (attempts >= 20) {
        document.getElementById("slow")
            .style.visibility = "visible";
    }
}