/*
Name: Shiza Afaqui
Date: March 16, 2026
Description: This file contains the JavaScript for the Polka Dot Game. In the game, 
The player controls a circle that grows by consuming smaller dots while avoiding larger ones.
The game includes a splash screen animation, scoring system, help menu, and high score tracking.
*/

window.addEventListener("load", function() {

// Splash Screen 

let splash = document.getElementById("splash")
let startBtn = document.getElementById("startBtn")
let splashCanvas = document.getElementById("splashCanvas")
let splashCtx = splashCanvas.getContext("2d")

splashCanvas.width = window.innerWidth
splashCanvas.height = window.innerHeight

let splashDots = []

/**
 * Creates an animated dot for the splash screen.
 * 
 * @param none
 * @returns nothing
 */

function spawnSplashDot(){

    let x = Math.random() * splashCanvas.width
    let y = Math.random() * splashCanvas.height
    let targetR = Math.random() * 16 + 10

    let colors = ["#ff9aa2","#b5ead7","#ffdac1","#c7ceea"]
    let index = Math.floor(Math.random() * colors.length)

    let dot = {
        x: x,
        y: y,
        r: 0,
        targetR: targetR,
        color: colors[index]
    }

    splashDots.push(dot)
}

setInterval(spawnSplashDot, 200)

/**
 * Animates the splash screen dots by updating and drawing them.
 * 
 * @param none
 * @returns nothing
 */

function animateSplash(){

    splashCtx.clearRect(0,0,splashCanvas.width,splashCanvas.height)

    for(let i = 0; i < splashDots.length; i++){

        let d = splashDots[i]

        d.r = d.r + (d.targetR - d.r) * 0.25

        splashCtx.beginPath()
        splashCtx.arc(d.x,d.y,d.r,0,Math.PI*2)
        splashCtx.fillStyle = d.color
        splashCtx.fill()
    }

    if(splashDots.length > 40){
        splashDots.shift()
    }

    requestAnimationFrame(animateSplash)
}

animateSplash()

// Game Basics 

let canvas = document.getElementById("game")
let ctx = canvas.getContext("2d")
let scoreText = document.getElementById("score")

let helpBtn = document.getElementById("helpBtn")
let helpText = document.getElementById("helpText")

let gameOverScreen = document.getElementById("gameOverScreen")
let finalScore = document.getElementById("finalScore")
let restartBtn = document.getElementById("restartBtn")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let gameStarted = false
let gameOver = false

// the player object represents the user's circle

let player = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 8,
    score: 0
}

// array storing all active dots
let dots = []

// Class For Dots 

/**
 * Represents a moving dot in the game.
 */
class Dot {
    constructor(x,y,radius,dx,dy,color){
        this.x = x
        this.y = y
        this.radius = radius
        this.dx = dx
        this.dy = dy
        this.color = color
    }

    /**
     * Moves the dot based on its velocity.
     */
    move(){
        this.x = this.x + this.dx
        this.y = this.y + this.dy
    }

    /**
     * Draws the dot on the canvas.
     * 
     * @param {Object} ctx
     */

    draw(ctx){
        ctx.beginPath()
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

// Button Events 

// start Game
startBtn.addEventListener("click", function(){
    splash.style.display = "none"
    gameStarted = true
})

// Help Button
helpBtn.addEventListener("click", function(){

    if(helpText.style.display === "none"){
        helpText.style.display = "block"
    }
    else{
        helpText.style.display = "none"
    }
})

// Restart Game
restartBtn.addEventListener("click", function(){
    resetGame()
})

// Player Controls

// Mouse Movement
window.addEventListener("mousemove", function(e){
    player.x = e.clientX
    player.y = e.clientY
})

// Touch Movement ( For Playing Mobile )
window.addEventListener("touchmove", function(e){
    let touch = e.touches[0]
    player.x = touch.clientX
    player.y = touch.clientY
})

// Spawning Dots 

/**
 * Returns a random color for a dot.
 * 
 * @param none
 * @returns {String} color
 */

function randomColor(){
    let colors = ["#ff6b6b","#4ecdc4","#556270","#c7f464"]
    let index = Math.floor(Math.random() * colors.length)
    return colors[index]
}

// Intervals to Create New Dots 
setInterval(function(){

    if(!gameStarted || gameOver) return

    let r
    let rand = Math.random()

    // Different Dot Sizes ( Small / Medium / Large )
    if(rand < 0.15){
        r = player.radius * (0.4 + Math.random()*0.5)
    }
    else if(rand < 0.55){
        r = Math.random()*25 + player.radius * 1.5
    }   
    else{
        r = player.radius * (1.5 + Math.random()*2)
    }

    let speed = Math.random()*3 + 3
    let side = Math.floor(Math.random()*4)

    let x,y,dx,dy

    // To Make The Dots Spawn From The Edges Of The Screen
    
    if(side === 0){
        x = -r
        y = Math.random()*canvas.height
        dx = Math.random()*speed
        dy = (Math.random()-0.5)*speed
    }
    else if(side === 1){
        x = canvas.width + r
        y = Math.random()*canvas.height
        dx = -Math.random()*speed
        dy = (Math.random()-0.5)*speed
    }
    else if(side === 2){
        x = Math.random()*canvas.width
        y = -r
        dx = (Math.random()-0.5)*speed
        dy = Math.random()*speed
    }
    else{
        x = Math.random()*canvas.width
        y = canvas.height + r
        dx = (Math.random()-0.5)*speed
        dy = -Math.random()*speed
    }

    let newDot = new Dot(x,y,r,dx,dy,randomColor())
    dots.push(newDot)

},130)

// Game Logic 

/**
 * Calculates distance between two objects.
 * 
 * @param {Object} a - first object with x,y
 * @param {Object} b - second object with x,y
 * @returns {Number} distance
 */

function distance(a,b){
    return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y))
}

/**
 * Main game loop that updates and draws everything.
 * 
 * @param none
 * @returns nothing
 */

function update(){

    if(!gameStarted){
        requestAnimationFrame(update)
        return
    }

    if(gameOver) return

    ctx.clearRect(0,0,canvas.width,canvas.height)

    // Draw Player
    ctx.beginPath()
    ctx.arc(player.x,player.y,player.radius,0,Math.PI*2)
    ctx.fillStyle="white"
    ctx.fill()

    for(let i = dots.length - 1; i >= 0; i--){

        let d = dots[i]

        d.move()
        d.draw(ctx)

        // Check For Collision 
        if(distance(player,d) < player.radius + d.radius - 3){

            if(player.radius >= d.radius){
                player.radius = player.radius + 0.3
                player.score = player.score + 1
                scoreText.innerText = player.score
                dots.splice(i,1)
            }
            else{
                endGame()
            }
        }
    }

    requestAnimationFrame(update)
}

// Reset Game

/**
 * Resets all game variables and restarts the game.
 * 
 * @param none
 * @returns nothing
 */

function resetGame(){

    player.x = canvas.width / 2
    player.y = canvas.height / 2
    player.radius = 8
    player.score = 0

    dots = []
    gameOver = false

    scoreText.innerText = 0
    gameOverScreen.style.display = "none"

    update()
}

// End Game

/**
 * Ends the game, saves score to localStorage, and displays results.
 * 
 * @param none
 * @returns nothing
 */

function endGame(){

    gameOver = true

    let scores = localStorage.getItem("scores")

    if(scores == null){
        scores = []
    }
    else{
        scores = JSON.parse(scores)
    }

    scores.push(player.score)
    localStorage.setItem("scores", JSON.stringify(scores))

    let best = scores[0]

    for(let i = 1; i < scores.length; i++){
        if(scores[i] > best){
            best = scores[i]
        }
    }

    finalScore.innerText = "Score: " + player.score + " | High Score: " + best
    gameOverScreen.style.display = "block"
}

update()

})