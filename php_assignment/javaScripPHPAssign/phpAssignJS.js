/**
 * Author: Daniel Yu
 * Date: 2026-02-27
 * Description: Main JavaScript file for the 2D Perspective Platformer game "VANTAGE".
 * Implements game mechanics, physics, rendering, object manipulation,
 * level management, and local storage for best times.
 * 
 * Server-side integration: tracks total game time and stars across levels,
 * submits results to leaderboard.php on game completion or quit.
 * Also saves game progress in localStorage to resume later.
 */

window.addEventListener('load', init);

// ==================== Global Variables ====================
let canvas, ctx;
let splashCanvas, splashCtx;
let gameContainer, splashDiv;
let levelStatus, levelNameEl, feedbackDiv, gameoverDiv, historyDiv;
let startBtn, helpBtn, helpPanel, replayBtn, restartBtn, prevLevelBtn, nextLevelBtn;
let jumpBtn, zoomOutBtn, zoomInBtn, rotateBtn, selectionControls, pauseOverlay;
let moveLeftBtn, moveRightBtn;
let gameLoopId = null;
let animationId;
let game = null;
let gameOverTimeout = null;
let gameStarted = false;   // prevent multiple game starts

// Timer for hiding pendulum feedback message
let pendulumFeedbackTimeout = null;

// World dimensions – fixed size for game world (not canvas pixels)
const WORLD_WIDTH = 400;
const WORLD_HEIGHT = 700;
const FLOOR_Y = WORLD_HEIGHT - 15;  // y-coordinate of the floor (top of floor block)

// Zoom limits – to prevent extreme scaling
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

// Epsilon for floating-point comparisons and minimum object size after zoom
const EPS = 1e-4;
const MIN_SIZE = 5;  // smallest allowed base dimension after dropping an object

// ==================== Image Assets ====================
// Background image
let bgImage = new Image();
bgImage.src = 'imagesPHPAssign/backgroundJsIndi.jpg';

//Silly splash image
let iamMeImg = new Image();
iamMeImg.src = 'imagesPHPAssign/iamMe.png';

// Player sprites
let playerIdleImg = new Image();
playerIdleImg.src = 'imagesPHPAssign/thePlayer.png';

let playerRunFrames = [];
const frameFiles = [
    'ThePlayerFrame1.png',
    'ThePlayerFrame2.png',
    'ThePlayerFrame3.png',
    'ThePlayerFrame4.png'
];
frameFiles.forEach(function (file) {
    const img = new Image();
    img.src = 'imagesPHPAssign/' + file;
    playerRunFrames.push(img);
});

// Object textures
let clockImg = new Image();
clockImg.src = 'imagesPHPAssign/clock.png';
let starImg = new Image();
starImg.src = 'imagesPHPAssign/star.png';
let emptyStarImg = new Image();
emptyStarImg.src = 'imagesPHPAssign/emptyStar.png';

let platformImg = new Image();
platformImg.src = 'imagesPHPAssign/platform.png';
let floorImg = new Image();
floorImg.src = 'imagesPHPAssign/floor.png';
let pencilImg = new Image();
pencilImg.src = 'imagesPHPAssign/pencil.png';
let crateImg = new Image();
crateImg.src = 'imagesPHPAssign/crate.png';
let doorImg = new Image();
doorImg.src = 'imagesPHPAssign/door.png';

// ==================== Audio ====================
let bgMusic = new Audio('soundsPHPAssign/bkgMusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
bgMusic.preload = 'auto';

let splashMusic = new Audio('soundsPHPAssign/splashMusic.mp3');
splashMusic.loop = true;
splashMusic.volume = 0.5;
splashMusic.preload = 'auto';

// ==================== Animation State ====================
let lastFrameTime = performance.now();
const FRAME_INTERVAL = 100;       // milliseconds between running animation frames
let currentRunFrame = 0;          // index of current frame in playerRunFrames
let playerDirection = 'right';    // 'left' or 'right' for flipping sprite

// ==================== Camera & Selection State ====================
let zoom = 1.0;                   // current zoom factor
let zoomCenterX = 0;              // screen X coordinate that maps to world center (used for zoom)
let zoomCenterY = 0;              // screen Y coordinate
let selectedObject = null;        // currently held GameObject, if any
let dragState = {
    active: false,                // whether a drag is in progress
    grabNormX: 0.5,               // normalized grab point (0..1) within object's width
    grabNormY: 0.5,               // normalized grab point within object's height
    grabWorldX: 0,                // world X of grab point
    grabWorldY: 0,                // world Y of grab point
    grabBaseW: 0,                 // width of object at the moment of grabbing (world units)
    grabBaseH: 0,                 // height of object at moment of grabbing
    grabZoom: 1.0,                // zoom level at moment of grabbing
    startWorldX: 0,               // starting world X of object (used for revert on failed rotate)
    startWorldY: 0,               // starting world Y
    rotationChanged: false,       // whether rotation occurred during this drag
    startOrientation: 0,          // orientation at start of drag
    originalBaseW: 0,             // original base width (before any scaling)
    originalBaseH: 0              // original base height
};

let currentTouch = { x: 0, y: 0 }; // last touch position in canvas pixels (for reference)
let moveLeft = false;              // flag: left movement key/button pressed
let moveRight = false;             // flag: right movement key/button pressed
let jumpPressed = false;           // flag: jump key/button pressed
let paused = false;                // whether game is paused (help panel open)
let activeTouchId = null;          // identifier of the primary touch for dragging

// ==================== Helper Function ====================

/**
 * Converts client coordinates (relative to viewport) to canvas pixel coordinates.
 * Accounts for the canvas's actual display size vs. its drawing buffer.
 * @param {number} clientX - X coordinate relative to viewport.
 * @param {number} clientY - Y coordinate relative to viewport.
 * @returns {Object} - { x, y } canvas pixel coordinates.
 */
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    return { x: canvasX, y: canvasY };
}

// ==================== Game State Saving ====================

/**
 * Saves the current game progress to localStorage.
 * Key: "vantage_save_<email>"
 */
function saveGameState() {
    if (!game || !userEmail) return;
    const state = {
        levelIndex: game.levelIndex,
        totalGameTime: game.totalGameTime,
        totalStarsEarned: game.totalStarsEarned
    };
    localStorage.setItem(`vantage_save_${userEmail}`, JSON.stringify(state));
}

/**
 * Loads a saved game state for the given email.
 * @returns {object|null} The saved state or null if none.
 */
function loadGameState() {
    if (!userEmail) return null;
    const saved = localStorage.getItem(`vantage_save_${userEmail}`);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) { return null; }
    }
    return null;
}

/**
 * Clears the saved game state for the current user.
 */
function clearGameState() {
    if (!userEmail) return;
    localStorage.removeItem(`vantage_save_${userEmail}`);
}

// ==================== Model Classes ====================

/**
 * Represents a static wall or platform.
 * Walls are immovable and used for collision detection.
 */
class Wall {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} w - Width.
     * @param {number} h - Height.
     * @param {boolean} isPlatform - True if the wall is a platform (walkable only from top).
     */
    constructor(x, y, w, h, isPlatform = false) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.isPlatform = isPlatform;
    }
}

/**
 * Represents a moving wall (crusher in level 3).
 * Moves back and forth within world boundaries.
 */
class MovingWall {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} w - Width.
     * @param {number} h - Height.
     * @param {number} speed - Movement speed (positive = down/right).
     * @param {boolean} horizontal - True if moving horizontally, false for vertical.
     */
    constructor(x, y, w, h, speed, horizontal = false) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.speed = speed;
        this.baseSpeed = speed;       // original speed (used for reset)
        this.originalX = x;           // original position (used for reset)
        this.originalY = y;
        this.originalSpeed = speed;
        this.horizontal = horizontal; // direction flag
    }

    /** Updates position based on speed. Reverses direction at boundaries. */
    update() {
        if (this.horizontal) {
            this.x += this.speed;
        } else {
            this.y += this.speed;
        }
    }

    /** Resets to original position and speed. */
    reset() {
        this.x = this.originalX;
        this.y = this.originalY;
        this.speed = this.originalSpeed;
    }
}

/**
 * Represents a grabbable object (cube, clock, pencil).
 * The core of the forced perspective mechanic. Objects have a base size (baseW, baseH)
 * and an orientation. Their effective world size (worldW, worldH) is calculated
 * based on orientation and, if held, the current zoom factor applied to them.
 */
class GameObject {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} baseW - Base width.
     * @param {number} baseH - Base height.
     * @param {boolean} isCube - True if cube (crate texture).
     * @param {boolean} isClock - True if clock.
     * @param {string} texture - Custom texture name ('pencil').
     */
    constructor(x, y, baseW = 15, baseH = 40, isCube = false, isClock = false, texture = null) {
        this.x = x; this.y = y;
        this.baseW = baseW;
        this.baseH = baseH;
        this.isCube = isCube;
        this.isClock = isClock;
        this.texture = texture;
        this.vx = 0; this.vy = 0;       // velocity for physics
        this.held = false;              // true if currently selected (being manipulated)
        this.orientation = 0;           // 0:0°, 1:90°, 2:180°, 3:270°
        this.isPendulum = false;        // Only used in level 3 – the special clock that slows crusher
        this.pendulumActivated = false; // True once the pendulum effect has been triggered (to show message only once)
    }

    /**
     * Current world width. If orientation is odd (1 or 3), baseW and baseH are swapped.
     * If the object is held, its size is further multiplied by the zoom factor
     * (grabZoom / current zoom) to simulate scaling in the player's hands.
     * @returns {number} The effective width of the object in world coordinates.
     */
    get worldW() {
        // If orientation is 1 or 3, width comes from base height
        let effectiveBase = this.orientation % 2 === 1 ? this.baseH : this.baseW;
        if (this.held && selectedObject === this) {
            // While held, size is determined by the zoom factor at grab time and current zoom
            return dragState.grabBaseW * dragState.grabZoom / zoom;
        } else {
            return effectiveBase;
        }
    }

    /**
     * Current world height. If orientation is odd (1 or 3), baseW and baseH are swapped.
     * If the object is held, its size is further multiplied by the zoom factor.
     * @returns {number} The effective height of the object in world coordinates.
     */
    get worldH() {
        let effectiveBase = this.orientation % 2 === 1 ? this.baseW : this.baseH;
        if (this.held && selectedObject === this) {
            return dragState.grabBaseH * dragState.grabZoom / zoom;
        } else {
            return effectiveBase;
        }
    }
    // Convenience aliases for collision functions that expect .w and .h
    get w() { return this.worldW; }
    get h() { return this.worldH; }
}

/**
 * Represents the player character.
 */
class Player {
    /**
     * @param {number} x - Starting X coordinate.
     * @param {number} y - Starting Y coordinate.
     */
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 30;
        this.h = 30;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
    }
}

/**
 * Represents the exit door.
 */
class Exit {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} w - Width.
     * @param {number} h - Height.
     */
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
    }
}

/**
 * Contains all elements of a single level.
 */
class Level {
    /**
     * @param {Wall[]} walls - Static walls.
     * @param {MovingWall[]} movingWalls - Moving walls.
     * @param {GameObject[]} objects - Grabbable objects.
     * @param {number} startX - Player start X.
     * @param {number} startY - Player start Y.
     * @param {number} exitX - Exit X.
     * @param {number} exitY - Exit Y.
     * @param {number} exitW - Exit width.
     * @param {number} exitH - Exit height.
     */
    constructor(walls, movingWalls, objects, startX, startY, exitX, exitY, exitW = 25, exitH = 50) {
        this.walls = walls;
        this.movingWalls = movingWalls || [];
        this.objects = objects;
        this.startX = startX; this.startY = startY;
        this.exit = new Exit(exitX, exitY, exitW, exitH);
    }
}

/**
 * Main game controller. Manages levels, game state, and core logic.
 */
class Game {
    constructor(initialState = null) {
        this.levelIndex = 0;
        this.levels = this.createLevels();
        this.player = null;
        this.objects = [];
        this.walls = [];
        this.movingWalls = [];
        this.exit = null;
        this.levelComplete = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.pendulum = null; // Reference to the special pendulum clock in level 3
        // Server-side cumulative totals
        this.totalGameTime = 0;    // total time across completed levels (ms)
        this.totalStarsEarned = 0; // total stars earned across completed levels

        if (initialState) {
            // Restore from saved state
            this.levelIndex = initialState.levelIndex;
            this.totalGameTime = initialState.totalGameTime;
            this.totalStarsEarned = initialState.totalStarsEarned;
            this.loadLevel(this.levelIndex);
        } else {
            this.loadLevel(0);
        }
    }

    /** Creates all levels. */
    createLevels() {
        // Level 1: Bridge – introduces the pencil (long thin object)
        const level1Walls = [
            new Wall(0, FLOOR_Y, WORLD_WIDTH, 15, true),       // floor
            new Wall(-10, 0, 10, WORLD_HEIGHT, false),         // left wall
            new Wall(WORLD_WIDTH, 0, 10, WORLD_HEIGHT, false), // right wall
            new Wall(0, 350, 100, FLOOR_Y - 350, true),        // left platform
            new Wall(300, 350, 100, FLOOR_Y - 350, true)       // right platform
        ];
        const bridgeObj = new GameObject(200, 400, 5, 60, false, false, 'pencil');
        const level1Objs = [bridgeObj];
        const level1 = new Level(
            level1Walls, [], level1Objs,
            30, 200,         // player start
            350, 300, 25, 50 // exit position and size
        );

        // Level 2: Tower – two crates to stack/move
        const level2Walls = [
            new Wall(0, FLOOR_Y, WORLD_WIDTH, 15, true),
            new Wall(-10, 0, 10, WORLD_HEIGHT, false),
            new Wall(WORLD_WIDTH, 0, 10, WORLD_HEIGHT, false),
            new Wall(50, 400, 120, 15, true), // lower platform
            new Wall(250, 150, 120, 15, true) // upper platform
        ];
        const crate1 = new GameObject(100, 480, 100, 100, true, false);
        const crate2 = new GameObject(300, 330, 100, 100, true, false);
        const level2Objs = [crate1, crate2];
        const level2 = new Level(
            level2Walls, [], level2Objs,
            30, FLOOR_Y - 35, // player start just above floor
            320, 100, 25, 50
        );

        // Level 3: Time Dilation – moving crusher and four clocks, one is the pendulum
        const level3Walls = [
            new Wall(0, FLOOR_Y, WORLD_WIDTH, 15, true),
            new Wall(-10, 0, 10, WORLD_HEIGHT, false),
            new Wall(WORLD_WIDTH, 0, 10, WORLD_HEIGHT, false),
            new Wall(0, 300, WORLD_WIDTH, 15, true) // ceiling and floor for pendulums
        ];
        const crusher = new MovingWall(0, 315, WORLD_WIDTH, 15, 6.5, false); // moves down vertically
        const clockBaseW = 20;
        const clockBaseH = 60;
        const clockPositions = [80, 160, 240, 320];
        const clocks = clockPositions.map(function (x) {
            return new GameObject(x, 300 - clockBaseH, clockBaseW, clockBaseH, false, true);
        });
        // Randomly designate one clock as the pendulum
        const pendulumIndex = Math.floor(Math.random() * clocks.length);
        clocks[pendulumIndex].isPendulum = true;
        clocks[pendulumIndex].pendulumActivated = false;

        const level3 = new Level(
            level3Walls, [crusher], clocks,
            30, FLOOR_Y - 35,
            WORLD_WIDTH - 50, FLOOR_Y - 50, 25, 50
        );

        return [level1, level2, level3];
    }

    /** Loads a level by index. Resets all state. */
    loadLevel(index) {
        const lvl = this.levels[index];
        this.walls = lvl.walls.slice(); // copy walls (they are immutable anyway)
        // Copy moving walls to preserve original positions for reset
        this.movingWalls = lvl.movingWalls ? lvl.movingWalls.map(function (mw) {
            return new MovingWall(mw.x, mw.y, mw.w, mw.h, mw.baseSpeed, mw.horizontal);
        }) : [];
        // Deep copy objects to reset their state (held, velocity, pendulum flags)
        this.objects = lvl.objects.map(function (obj) {
            let newObj = new GameObject(obj.x, obj.y, obj.baseW, obj.baseH, obj.isCube, obj.isClock, obj.texture);
            // Copy pendulum flag from template (will be re-randomized for level 3)
            if (obj.isPendulum) {
                newObj.isPendulum = true;
                newObj.pendulumActivated = false;
            }
            return newObj;
        });

        // For level 3, re-randomize which clock is the pendulum on every load
        if (index === 2) {
            // Reset all pendulum flags
            this.objects.forEach(obj => {
                obj.isPendulum = false;
                obj.pendulumActivated = false;
            });
            // Randomly select one clock to be the pendulum
            const clocks = this.objects.filter(obj => obj.isClock);
            if (clocks.length > 0) {
                const randomIndex = Math.floor(Math.random() * clocks.length);
                clocks[randomIndex].isPendulum = true;
            }
        }

        // Identify pendulum for level 3 (the one with isPendulum = true)
        this.pendulum = null;
        if (index === 2) {
            this.pendulum = this.objects.find(function (obj) { return obj.isPendulum; });
        }

        this.player = new Player(lvl.startX, lvl.startY);
        this.exit = lvl.exit;
        this.levelComplete = false;
        this.startTime = performance.now(); // start timing
        this.elapsedTime = 0;
        // Reset camera and selection
        zoom = 1.0;
        zoomCenterX = canvas.width / 2;
        zoomCenterY = canvas.height / 2;
        selectedObject = null;
        dragState.active = false;
        canvas.style.cursor = 'grab';
        selectionControls.classList.add('hidden');
        updateLevelStars(index); // update star display for this level

        const names = ['Bridge', 'Tower', 'Time Dilation'];
        if (levelNameEl) levelNameEl.textContent = names[index];

        // Navigation buttons will be shown only after level completion
        updateNavButtonsVisibility();

        // Reset animation
        currentRunFrame = 0;
        lastFrameTime = performance.now();
        playerDirection = 'right';
    }

    /** Restarts the current level. */
    restartLevel() { this.loadLevel(this.levelIndex); }

    /** Advances to the next level if not on the last level. */
    nextLevel() { 
        if (this.levelIndex < this.levels.length - 1) { 
            this.levelIndex++; 
            this.loadLevel(this.levelIndex); 
            // Save progress after moving to next level
            saveGameState();
        } 
    }

    /** Goes back to the previous level if not on the first level. */
    prevLevel() { 
        if (this.levelIndex > 0) { 
            this.levelIndex--; 
            this.loadLevel(this.levelIndex);
            saveGameState();
        } 
    }

    /**
     * Returns stars based on elapsed seconds.
     * @param {number} seconds - Time in seconds.
     * @returns {number} 0-3 stars.
     */
    getStarsFromTime(seconds) {
        if (seconds < 15) return 3;
        if (seconds < 20) return 2;
        if (seconds < 25) return 1;
        return 0;
    }

    /** Saves best time to localStorage. */
    saveBestTime() {
        const seconds = this.elapsedTime / 1000;
        const stars = this.getStarsFromTime(seconds);
        const key = `level${this.levelIndex}_best`;
        const stored = localStorage.getItem(key);
        let best = stored ? JSON.parse(stored) : { time: Infinity, stars: 0 };
        if (seconds < best.time) {
            best.time = seconds;
            best.stars = stars;
            localStorage.setItem(key, JSON.stringify(best));
        }
        updateLevelStars(this.levelIndex);
    }

    /** Updates moving walls and handles pendulum effect. */
    updateMovingWalls() {
        for (let mw of this.movingWalls) {
            mw.update();   // move by speed
            // Reverse direction if hitting world bounds (only for horizontal walls, but we have none)
            if (mw.horizontal) {
                if (mw.x < 0 || mw.x + mw.w > WORLD_WIDTH) {
                    mw.speed = -mw.speed;
                    mw.x = Math.max(0, Math.min(WORLD_WIDTH - mw.w, mw.x));
                }
            }
            // Level 3: pendulum (special clock) affects crusher speed
            if (this.levelIndex === 2 && this.pendulum) {
                // Determine current size of pendulum (max dimension because orientation can change)
                const size = Math.max(this.pendulum.worldW, this.pendulum.worldH);
                const baseSpeed = this.movingWalls[0].baseSpeed;  // original crusher speed
                // Speed is inversely proportional to pendulum size, but capped between 0.2 and baseSpeed
                let targetSpeed = baseSpeed * Math.max(0.2, 30 / size);
                targetSpeed = Math.min(baseSpeed, Math.max(0.2, targetSpeed));

                // Show feedback only when the player is holding the correct pendulum
                // and it's the first time the speed drops below base (i.e., pendulum effect starts)
                if (selectedObject === this.pendulum && !this.pendulum.pendulumActivated && targetSpeed < baseSpeed) {
                    this.pendulum.pendulumActivated = true;
                    // Display message in feedback div below canvas
                    feedbackDiv.classList.remove('hidden');
                    feedbackDiv.textContent = 'Pendulum activated! Time slows...';
                    // Clear any previous timeout to avoid multiple timers
                    if (pendulumFeedbackTimeout) {
                        clearTimeout(pendulumFeedbackTimeout);
                    }
                    // Hide message after 2 seconds
                    pendulumFeedbackTimeout = setTimeout(() => {
                        feedbackDiv.classList.add('hidden');
                        pendulumFeedbackTimeout = null;
                    }, 2000);
                }
                // Apply the new speed to the crusher
                this.movingWalls[0].speed = targetSpeed;
            }
            // If player collides with moving wall, reset player to start
            if (this.player.x < mw.x + mw.w && this.player.x + this.player.w > mw.x &&
                this.player.y < mw.y + mw.h && this.player.y + this.player.h > mw.y) {
                this.resetPlayer();
            }
        }
    }

    /** Resets player to level start and resets moving walls. */
    resetPlayer() {
        const lvl = this.levels[this.levelIndex];
        this.player.x = lvl.startX;
        this.player.y = lvl.startY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        // Reset moving walls to original positions (crusher resets)
        for (let mw of this.movingWalls) {
            mw.reset();
        }
    }
}

// ==================== History Manager ====================
class HistoryManager {
    /**
     * Displays best times from localStorage.
     * @param {HTMLElement} container - Element to display history.
     */
    static display(container) {
        let html = '<h3>Best Times</h3><ul style="list-style:none; padding:0; text-align:left;">';
        let anyData = false;
        for (let i = 0; i < 3; i++) {
            const key = `level${i}_best`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const data = JSON.parse(stored);
                html += `<li>Level ${i + 1}: ${data.time.toFixed(2)}s  (${data.stars} ⭐)</li>`;
                anyData = true;
            } else {
                html += `<li>Level ${i + 1}: not played yet</li>`;
            }
        }
        html += '</ul>';
        if (!anyData) html = '<p>No best times yet.</p>';
        container.innerHTML = html;
    }
}

// ==================== Initialization ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    splashCanvas = document.getElementById('splashCanvas');
    if (!splashCanvas) {
        // Fallback: if splash canvas missing, just start the game directly
        gameContainer = document.getElementById('gameContainer');
        splashDiv = document.getElementById('splash');
        if (splashDiv) splashDiv.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        bgMusic.play().catch(function(e) {});
        if (window.isPlayPage && typeof userEmail !== 'undefined' && userEmail) {
            const savedState = loadGameState();
            game = savedState ? new Game(savedState) : new Game();
        } else {
            game = new Game();
        }
        updateLevelStatus();
        if (prevLevelBtn) prevLevelBtn.classList.add('hidden');
        if (nextLevelBtn) nextLevelBtn.classList.add('hidden');
        gameLoop();
        gameStarted = true;
        return;
    }

    splashCtx = splashCanvas.getContext('2d');
    ctx = canvas.getContext('2d');
    splashDiv = document.getElementById('splash');
    gameContainer = document.getElementById('gameContainer');
    historyDiv = document.getElementById('history');
    levelStatus = document.getElementById('levelStatus');
    levelNameEl = document.querySelector('header h1');
    feedbackDiv = document.getElementById('feedback');
    gameoverDiv = document.getElementById('gameover');
    startBtn = document.getElementById('startBtn');
    helpBtn = document.getElementById('helpBtn');
    helpPanel = document.getElementById('helpPanel');
    replayBtn = document.getElementById('replayBtn');
    restartBtn = document.getElementById('restartBtn');
    prevLevelBtn = document.getElementById('prevLevelBtn');
    nextLevelBtn = document.getElementById('nextLevelBtn');
    jumpBtn = document.getElementById('jumpBtn');
    zoomOutBtn = document.getElementById('zoomOutBtn');
    zoomInBtn = document.getElementById('zoomInBtn');
    rotateBtn = document.getElementById('rotateBtn');
    selectionControls = document.getElementById('selectionControls');
    pauseOverlay = document.getElementById('pauseOverlay');
    moveLeftBtn = document.getElementById('moveLeftBtn');
    moveRightBtn = document.getElementById('moveRightBtn');

    setupEventListeners();

    animateSplash();
    setTimeout(function () {
        const splashMsg = document.getElementById('splashMsg');
        if (splashMsg) splashMsg.textContent = 'READY?';
        startBtn.classList.remove('hidden');
    }, 2000);

    splashMusic.play().catch(function (error) {
        function tryPlaySplashMusic() {
            splashMusic.play().catch(function (e) {});
            document.removeEventListener('click', tryPlaySplashMusic);
            document.removeEventListener('touchstart', tryPlaySplashMusic);
        }
        document.addEventListener('click', tryPlaySplashMusic);
        document.addEventListener('touchstart', tryPlaySplashMusic);
    });
}

/** Sets up all event listeners. */
function setupEventListeners() {
    // Movement buttons (touch and mouse)
    if (moveLeftBtn) {
        moveLeftBtn.addEventListener('touchstart', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveLeft = true; });
        moveLeftBtn.addEventListener('touchend', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveLeft = false; });
        moveLeftBtn.addEventListener('mousedown', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveLeft = true; });
        moveLeftBtn.addEventListener('mouseup', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveLeft = false; });
    }
    if (moveRightBtn) {
        moveRightBtn.addEventListener('touchstart', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveRight = true; });
        moveRightBtn.addEventListener('touchend', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveRight = false; });
        moveRightBtn.addEventListener('mousedown', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveRight = true; });
        moveRightBtn.addEventListener('mouseup', function (e) { e.preventDefault(); if (game && game.levelComplete) return; moveRight = false; });
    }

    // Jump button
    jumpBtn.addEventListener('touchstart', function (e) { e.preventDefault(); if (game && game.levelComplete) return; jumpPressed = true; });
    jumpBtn.addEventListener('touchend', function (e) { e.preventDefault(); if (game && game.levelComplete) return; jumpPressed = false; });
    jumpBtn.addEventListener('mousedown', function (e) { e.preventDefault(); if (game && game.levelComplete) return; jumpPressed = true; });
    jumpBtn.addEventListener('mouseup', function (e) { e.preventDefault(); if (game && game.levelComplete) return; jumpPressed = false; });

    // Selection controls (zoom/rotate) – only active when an object is selected
    zoomOutBtn.addEventListener('click', function () {
        if (!selectedObject || paused) return;
        const screenGrab = worldToScreen(dragState.grabWorldX, dragState.grabWorldY);
        applyZoom(0.9, screenGrab.x, screenGrab.y);
    });
    zoomInBtn.addEventListener('click', function () {
        if (!selectedObject || paused) return;
        const screenGrab = worldToScreen(dragState.grabWorldX, dragState.grabWorldY);
        applyZoom(1.1, screenGrab.x, screenGrab.y);
    });
    rotateBtn.addEventListener('click', function () {
        if (!selectedObject || paused) return;
        rotateSelected();
    });

    // Main UI buttons
    startBtn.addEventListener('click', transitionToGame);
    helpBtn.addEventListener('click', toggleHelp);
    replayBtn.addEventListener('click', resetGame);
    restartBtn.addEventListener('click', function () {
        if (game) {
            if (gameOverTimeout) {
                clearTimeout(gameOverTimeout);
                gameOverTimeout = null;
            }
            if (pendulumFeedbackTimeout) {
                clearTimeout(pendulumFeedbackTimeout);
                pendulumFeedbackTimeout = null;
                feedbackDiv.classList.add('hidden');
            }
            game.restartLevel();
            feedbackDiv.classList.add('hidden');
            saveGameState();
        }
    });

    // Level navigation buttons
    if (prevLevelBtn) {
        prevLevelBtn.addEventListener('click', function () {
            if (game && !paused) {
                if (gameOverTimeout) {
                    clearTimeout(gameOverTimeout);
                    gameOverTimeout = null;
                }
                if (pendulumFeedbackTimeout) {
                    clearTimeout(pendulumFeedbackTimeout);
                    pendulumFeedbackTimeout = null;
                    feedbackDiv.classList.add('hidden');
                }
                game.prevLevel();
                updateLevelStatus();
                feedbackDiv.classList.add('hidden');
                saveGameState();
            }
        });
    }
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', function () {
            if (game && !paused) {
                if (gameOverTimeout) {
                    clearTimeout(gameOverTimeout);
                    gameOverTimeout = null;
                }
                if (pendulumFeedbackTimeout) {
                    clearTimeout(pendulumFeedbackTimeout);
                    pendulumFeedbackTimeout = null;
                    feedbackDiv.classList.add('hidden');
                }
                game.nextLevel();
                updateLevelStatus();
                feedbackDiv.classList.add('hidden');
                saveGameState();
            }
        });
    }

    // Keyboard events (WASD / arrows, R for rotate)
    window.addEventListener('keydown', function (e) {
        if (paused) return;
        if (game && game.levelComplete) return;
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'arrowleft') {
            moveLeft = true;
            playerDirection = 'left';
        }
        if (key === 'd' || key === 'arrowright') {
            moveRight = true;
            playerDirection = 'right';
        }
        if (key === 'w' || key === 'arrowup') jumpPressed = true;
        if (key === 'r' && selectedObject) {
            e.preventDefault();
            rotateSelected();
        }
    });
    window.addEventListener('keyup', function (e) {
        if (paused) return;
        if (game && game.levelComplete) return;
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'arrowleft') moveLeft = false;
        if (key === 'd' || key === 'arrowright') moveRight = false;
        if (key === 'w' || key === 'arrowup') jumpPressed = false;
    });

    // Canvas events (touch and mouse)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Quit button (only present on play.php)
    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.addEventListener('click', function() {
            if (game) {
                saveGameState();
                submitGameResults();
            }
        });
    }
}

// ==================== Touch & Mouse Handlers ====================
/**
 * Handles touch start events on the canvas.
 * Selects an object if one is touched, otherwise drops any currently selected object.
 * @param {TouchEvent} e - The touch event object.
 */
function onTouchStart(e) {
    e.preventDefault();
    if (paused || !game || game.levelComplete) return;
    const touch = e.touches[0];
    if (!touch) return;
    activeTouchId = touch.identifier;  // remember this touch for dragging

    const canvasCoords = getCanvasCoords(touch.clientX, touch.clientY);
    currentTouch = canvasCoords;
    const worldTouch = screenToWorld(canvasCoords.x, canvasCoords.y);

    if (!selectedObject) {
        // Check if any object was touched (iterate backwards so topmost in array order is checked? but order doesn't matter)
        let touchedObj = null;
        for (let obj of game.objects) {
            if (worldTouch.x >= obj.x && worldTouch.x <= obj.x + obj.worldW &&
                worldTouch.y >= obj.y && worldTouch.y <= obj.y + obj.worldH) {
                touchedObj = obj;
                break;
            }
        }
        if (touchedObj) {
            selectObject(touchedObj, worldTouch.x, worldTouch.y);
            return;
        }
    } else {
        // Touched empty space while holding an object -> drop it
        dropSelected();
        return;
    }
}

/**
 * Handles touch move events.
 * If an object is selected, it is dragged to follow the touch point.
 * Collisions are resolved during the drag to prevent moving through obstacles.
 * @param {TouchEvent} e - The touch event object.
 */
function onTouchMove(e) {
    e.preventDefault();
    if (paused || !game || game.levelComplete) return;
    // Find the touch with the stored identifier
    let touch = null;
    for (let t of e.touches) {
        if (t.identifier === activeTouchId) {
            touch = t;
            break;
        }
    }
    if (!touch) return;

    const canvasCoords = getCanvasCoords(touch.clientX, touch.clientY);
    currentTouch = canvasCoords;

    if (selectedObject) {
        const worldTouch = screenToWorld(canvasCoords.x, canvasCoords.y);
        const obj = selectedObject;

        // Store previous state for potential revert
        const prevX = obj.x;
        const prevY = obj.y;
        const prevGrabX = dragState.grabWorldX;
        const prevGrabY = dragState.grabWorldY;

        // Desired position: grab point should be exactly at worldTouch
        let desiredX = worldTouch.x - dragState.grabNormX * obj.worldW;
        let desiredY = worldTouch.y - dragState.grabNormY * obj.worldH;
        // Clamp to world bounds
        desiredX = Math.max(0, Math.min(WORLD_WIDTH - obj.worldW, desiredX));
        desiredY = Math.max(0, Math.min(FLOOR_Y - obj.worldH, desiredY));

        obj.x = desiredX;
        obj.y = desiredY;

        // Resolve collisions with other objects and walls (push out)
        resolveDragCollisions(obj);

        // Update grab world position to new object position + normalized offset
        dragState.grabWorldX = obj.x + dragState.grabNormX * obj.worldW;
        dragState.grabWorldY = obj.y + dragState.grabNormY * obj.worldH;

        // If after resolution the object still collides with something, revert to previous position
        if (checkAnyCollision(obj)) {
            obj.x = prevX;
            obj.y = prevY;
            dragState.grabWorldX = prevGrabX;
            dragState.grabWorldY = prevGrabY;
            resolveDragCollisions(obj); // resolve again to ensure no overlap with old position
        }
    }
}

/**
 * Handles touch end events. Clears the active touch ID.
 * @param {TouchEvent} e - The touch event object.
 */
function onTouchEnd(e) {
    e.preventDefault();
    activeTouchId = null;
}

/**
 * Handles mouse down events on the canvas.
 * Selects an object if one is clicked, otherwise drops any currently selected object.
 * @param {MouseEvent} e - The mouse event object.
 */
function onMouseDown(e) {
    if (paused || !game || game.levelComplete) return;
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    currentTouch = canvasCoords;
    const worldMouse = screenToWorld(canvasCoords.x, canvasCoords.y);

    if (!selectedObject) {
        // Check if any object was clicked
        let touchedObj = null;
        for (let obj of game.objects) {
            if (worldMouse.x >= obj.x && worldMouse.x <= obj.x + obj.worldW &&
                worldMouse.y >= obj.y && worldMouse.y <= obj.y + obj.worldH) {
                touchedObj = obj;
                break;
            }
        }
        if (touchedObj) {
            selectObject(touchedObj, worldMouse.x, worldMouse.y);
            return;
        }
    } else {
        // Clicked empty space while holding an object -> drop it
        dropSelected();
        return;
    }
}

/**
 * Handles mouse move events.
 * If an object is selected, it is dragged to follow the mouse.
 * @param {MouseEvent} e - The mouse event object.
 */
function onMouseMove(e) {
    if (paused || !game || game.levelComplete || !selectedObject) return;
    e.preventDefault();
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    currentTouch = canvasCoords;
    const worldMouse = screenToWorld(canvasCoords.x, canvasCoords.y);
    const obj = selectedObject;

    const prevX = obj.x;
    const prevY = obj.y;
    const prevGrabX = dragState.grabWorldX;
    const prevGrabY = dragState.grabWorldY;

    let desiredX = worldMouse.x - dragState.grabNormX * obj.worldW;
    let desiredY = worldMouse.y - dragState.grabNormY * obj.worldH;
    desiredX = Math.max(0, Math.min(WORLD_WIDTH - obj.worldW, desiredX));
    desiredY = Math.max(0, Math.min(FLOOR_Y - obj.worldH, desiredY));

    obj.x = desiredX;
    obj.y = desiredY;

    resolveDragCollisions(obj);

    dragState.grabWorldX = obj.x + dragState.grabNormX * obj.worldW;
    dragState.grabWorldY = obj.y + dragState.grabNormY * obj.worldH;

    if (checkAnyCollision(obj)) {
        obj.x = prevX;
        obj.y = prevY;
        dragState.grabWorldX = prevGrabX;
        dragState.grabWorldY = prevGrabY;
        resolveDragCollisions(obj);
    }
}

// ==================== Zoom & Rotation ====================

/**
 * Applies zoom centered at screen coordinates. This is the core of the forced perspective
 * manipulation. It attempts to change the zoom level and reposition the selected object
 * so that the point under the cursor remains fixed in world coordinates. If the new
 * zoom and position would place the object out of bounds, the zoom is reverted.
 * @param {number} factor - Multiplicative zoom factor (e.g., 0.9 to zoom out, 1.1 to zoom in).
 * @param {number} centerScreenX - Screen X coordinate of the zoom center (the cursor).
 * @param {number} centerScreenY - Screen Y coordinate of the zoom center (the cursor).
 */
function applyZoom(factor, centerScreenX, centerScreenY) {
    if (!selectedObject) return;

    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (Math.abs(newZoom - zoom) < 1e-6) return; // no significant change

    const oldZoom = zoom;
    const oldCenterX = zoomCenterX;
    const oldCenterY = zoomCenterY;
    const obj = selectedObject;

    zoom = newZoom;
    zoomCenterX = centerScreenX;
    zoomCenterY = centerScreenY;

    // Compute where the zoom center (cursor) is in world coordinates with new zoom
    const worldCenter = screenToWorld(centerScreenX, centerScreenY);
    // New world dimensions of object after zoom (since grabBaseW/H and grabZoom are fixed)
    const newWorldW = dragState.grabBaseW * dragState.grabZoom / zoom;
    const newWorldH = dragState.grabBaseH * dragState.grabZoom / zoom;
    // Desired position so that the grab point stays at worldCenter
    const desiredX = worldCenter.x - dragState.grabNormX * newWorldW;
    const desiredY = worldCenter.y - dragState.grabNormY * newWorldH;

    // Check bounds with a small epsilon for floating point
    if (desiredX >= -EPS && desiredX + newWorldW <= WORLD_WIDTH + EPS &&
        desiredY >= -EPS && desiredY + newWorldH <= FLOOR_Y + EPS) {
        obj.x = desiredX;
        obj.y = desiredY;
        dragState.grabWorldX = worldCenter.x;
        dragState.grabWorldY = worldCenter.y;
        resolveDragCollisions(obj); // ensure no overlap after repositioning
    } else {
        // Revert zoom if placement is invalid
        zoom = oldZoom;
        zoomCenterX = oldCenterX;
        zoomCenterY = oldCenterY;
    }
}

/**
 * Handles mouse wheel events to zoom the selected object in and out.
 * @param {WheelEvent} e - The wheel event object.
 */
function onWheel(e) {
    if (!selectedObject || paused) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.95 : 1.05; // scroll down = zoom out
    applyZoom(delta, mouseX, mouseY);
}

/**
 * Checks if an object collides with any obstacle (walls, player, other non-held objects).
 * @param {GameObject} obj - Object to check.
 * @returns {boolean} True if collision exists.
 */
function checkAnyCollision(obj) {
    const obstacles = [
        ...game.walls,
        game.player,
        ...game.objects.filter(function (o) { return o !== obj && !o.held; })
    ];
    for (let ob of obstacles) {
        if (aabbCollide(obj, ob)) return true;
    }
    return false;
}

/**
 * Selects an object for manipulation. Stores the grab point relative to the object's
 * top-left corner (grabNormX, grabNormY) and its current world size and zoom level.
 * @param {GameObject} obj - Object to select.
 * @param {number} worldX - World X of the grab point (e.g., where the user clicked).
 * @param {number} worldY - World Y of the grab point.
 */
function selectObject(obj, worldX, worldY) {
    // If this object is already selected, do nothing
    if (selectedObject === obj) return;

    // Store the object's current world dimensions at the moment of grabbing
    // These are used to maintain the correct size during scaling/rotation
    const baseW = obj.worldW;
    const baseH = obj.worldH;

    // Set the selected object reference
    selectedObject = obj;
    // Mark the object as being held so it won't be affected by physics while dragged
    obj.held = true;
    // Activate drag state to indicate a manipulation is in progress
    dragState.active = true;

    // Calculate the normalized grab point relative to the object's top-left corner.
    // This value (0-1) remains constant during dragging, zooming, and rotating.
    dragState.grabNormX = (worldX - obj.x) / baseW;
    dragState.grabNormY = (worldY - obj.y) / baseH;

    // Store the world coordinates of the grab point (used to reposition the object)
    dragState.grabWorldX = worldX;
    dragState.grabWorldY = worldY;

    // Save the object's world dimensions at grab time - these are used to compute
    // new world dimensions when zoom changes (since baseW and baseH are constant)
    dragState.grabBaseW = baseW;
    dragState.grabBaseH = baseH;

    // Record the current zoom level so that future zoom changes can scale the object
    // relative to this starting zoom.
    dragState.grabZoom = zoom;

    // Store the object's starting position - useful for reverting if a rotation fails
    dragState.startWorldX = obj.x;
    dragState.startWorldY = obj.y;

    // Flags and state for rotation handling
    dragState.rotationChanged = false; // whether rotation occurred during this drag
    dragState.startOrientation = obj.orientation; // original orientation before any rotation

    // Keep a copy of the original base dimensions - used when committing final size for validity when updating the game object new size and position
    dragState.originalBaseW = obj.baseW;
    dragState.originalBaseH = obj.baseH;

    // Show the zoom/rotate controls now that an object is selected
    selectionControls.classList.remove('hidden');
    // Change cursor to indicate grabbing for mouse
    canvas.style.cursor = 'grabbing';
}

/**
 * Resolves collisions for a dragged object by pushing it out of obstacles.
 * This is an iterative process that tries to find the closest valid position
 * by checking for the smallest move required to separate from each colliding obstacle.
 * @param {GameObject} obj - The dragged object.
 */
function resolveDragCollisions(obj) {
    const obstacles = [
        ...game.walls,
        game.player,
        ...game.objects.filter(function (o) { return o !== obj && !o.held; })
    ];
    const maxIterations = 30;  // prevent infinite loop
    for (let iter = 0; iter < maxIterations; iter++) {
        let anyCollision = false;

        // First, clamp to world bounds
        if (obj.x < 0) { obj.x = 0; anyCollision = true; }
        if (obj.x + obj.worldW > WORLD_WIDTH) { obj.x = WORLD_WIDTH - obj.worldW; anyCollision = true; }
        if (obj.y < 0) { obj.y = 0; anyCollision = true; }
        if (obj.y + obj.worldH > FLOOR_Y) { obj.y = FLOOR_Y - obj.worldH; anyCollision = true; }

        // Then resolve collisions with each obstacle
        for (let ob of obstacles) {
            if (aabbCollide(obj, ob)) {
                anyCollision = true;
                const moves = [];

                // All possible translations to resolve collision, moving horizontally or vertically
                // Move left: align obj's right edge with ob's left edge
                const leftX = ob.x - obj.worldW;
                if (leftX >= 0 && leftX + obj.worldW <= WORLD_WIDTH) {
                    moves.push({ dx: leftX - obj.x, dy: 0, dist: Math.abs(leftX - obj.x) });
                }
                // Move right: align obj's left edge with ob's right edge
                const rightX = ob.x + ob.w;
                if (rightX >= 0 && rightX + obj.worldW <= WORLD_WIDTH) {
                    moves.push({ dx: rightX - obj.x, dy: 0, dist: Math.abs(rightX - obj.x) });
                }
                // Move up: align obj's bottom edge with ob's top edge
                const topY = ob.y - obj.worldH;
                if (topY >= 0 && topY + obj.worldH <= FLOOR_Y) {
                    moves.push({ dx: 0, dy: topY - obj.y, dist: Math.abs(topY - obj.y) });
                }
                // Move down: align obj's top edge with ob's bottom edge
                const bottomY = ob.y + ob.h;
                if (bottomY >= 0 && bottomY + obj.worldH <= FLOOR_Y) {
                    moves.push({ dx: 0, dy: bottomY - obj.y, dist: Math.abs(bottomY - obj.y) });
                }

                if (moves.length > 0) {
                    // Choose the smallest move (closest exit direction)
                    moves.sort(function (a, b) { return a.dist - b.dist; });
                    const best = moves[0];
                    obj.x += best.dx;
                    obj.y += best.dy;
                }
            }
        }

        if (!anyCollision) break;  // no collisions, done
    }
    // Final clamp to ensure no bounds violation after all iterations
    obj.x = Math.max(0, Math.min(WORLD_WIDTH - obj.worldW, obj.x));
    obj.y = Math.max(0, Math.min(FLOOR_Y - obj.worldH, obj.y));
}

/** Drops the currently selected object, committing size changes. */
function dropSelected() {
    if (!selectedObject) return;
    const obj = selectedObject;

    // Commit the new size to base dimensions (so it stays after drop)
    const effW = obj.worldW;
    const effH = obj.worldH;
    if (obj.orientation % 2 === 1) {
        // If orientation is odd, swap base dimensions
        obj.baseW = effH;
        obj.baseH = effW;
    } else {
        obj.baseW = effW;
        obj.baseH = effH;
    }
    // Ensure minimum size
    if (obj.baseW < MIN_SIZE) obj.baseW = MIN_SIZE;
    if (obj.baseH < MIN_SIZE) obj.baseH = MIN_SIZE;

    // Reset camera zoom
    zoom = 1.0;
    zoomCenterX = canvas.width / 2;
    zoomCenterY = canvas.height / 2;

    obj.held = false;
    selectedObject = null;
    dragState.active = false;
    canvas.style.cursor = 'grab';
    selectionControls.classList.add('hidden');
    moveLeft = false;   // prevent lingering movement keys
    moveRight = false;
}

/** Rotates the selected object by 90 degrees, keeping the grab point fixed in screen space. */
function rotateSelected() {
    if (!selectedObject) return;
    const obj = selectedObject;

    // Save state before rotation
    const oldOrientation = obj.orientation;
    const oldX = obj.x;
    const oldY = obj.y;
    const oldGrabBaseW = dragState.grabBaseW;
    const oldGrabBaseH = dragState.grabBaseH;
    const oldGrabWorldX = dragState.grabWorldX;
    const oldGrabWorldY = dragState.grabWorldY;

    // Swap base dimensions because orientation changes (width becomes height)
    [dragState.grabBaseW, dragState.grabBaseH] = [dragState.grabBaseH, dragState.grabBaseW];
    obj.orientation = (obj.orientation + 1) % 4;
    dragState.rotationChanged = true;

    // Convert grab point to screen coordinates (with old zoom)
    const grabScreenX = (dragState.grabWorldX - zoomCenterX) * zoom + zoomCenterX;
    const grabScreenY = (dragState.grabWorldY - zoomCenterY) * zoom + zoomCenterY;
    // Convert back to world with new orientation (zoom unchanged, but object dimensions changed)
    const newGrabWorldX = (grabScreenX - zoomCenterX) / zoom + zoomCenterX;
    const newGrabWorldY = (grabScreenY - zoomCenterY) / zoom + zoomCenterY;

    // Position object so that grab point remains fixed
    obj.x = newGrabWorldX - dragState.grabNormX * obj.worldW;
    obj.y = newGrabWorldY - dragState.grabNormY * obj.worldH;
    // Clamp to world bounds
    obj.x = Math.max(0, Math.min(WORLD_WIDTH - obj.worldW, obj.x));
    obj.y = Math.max(0, Math.min(FLOOR_Y - obj.worldH, obj.y));

    // Update grab world position
    dragState.grabWorldX = obj.x + dragState.grabNormX * obj.worldW;
    dragState.grabWorldY = obj.y + dragState.grabNormY * obj.worldH;

    // Resolve collisions after move
    resolveDragCollisions(obj);
    // Update grab world again in case collision resolution moved object
    dragState.grabWorldX = obj.x + dragState.grabNormX * obj.worldW;
    dragState.grabWorldY = obj.y + dragState.grabNormY * obj.worldH;

    // If still colliding, revert everything
    if (checkAnyCollision(obj)) {
        obj.orientation = oldOrientation;
        [dragState.grabBaseW, dragState.grabBaseH] = [oldGrabBaseH, oldGrabBaseW];
        obj.x = oldX;
        obj.y = oldY;
        dragState.grabWorldX = oldGrabWorldX;
        dragState.grabWorldY = oldGrabWorldY;
        dragState.rotationChanged = false;
        resolveDragCollisions(obj);
    }
}

// ==================== Help & UI ====================
/**
 * Toggles the help panel and pauses/unpauses the game.
 */
function toggleHelp() {
    if (helpPanel.classList.contains('hidden')) {
        helpPanel.classList.remove('hidden');
        pauseOverlay.classList.remove('hidden');
        paused = true;
    } else {
        helpPanel.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        paused = false;
    }
}

/**
 * Animates the splash screen with a rotating, pulsing white square on a dark gradient.
 */
function animateSplash() {
    let phase = 0; // Tracks time to drive the pulsing and rotation
    const baseSize = 200; // The starting width/height of the square

    function draw() {
        phase += 0.02; // Increment time for a smooth animation speed
        const w = splashCanvas.width, h = splashCanvas.height;
        const ctx = splashCtx;

        // Reset the canvas for the new frame
        ctx.clearRect(0, 0, w, h);

        // Fill background with a single solid dark blue color
        ctx.fillStyle = '#1a2632';
        ctx.fillRect(0, 0, w, h);

        // Calculate center coordinates
        const vpX = w / 2;
        const vpY = h / 2 - 10;

        // Calculate a scale factor between 0.6 and 1.0 using a sine wave
        const scale = 0.8 + 0.2 * Math.sin(phase * 2);
        const currentSize = baseSize * scale;

        // Calculate the current rotation angle
        const rotation = phase * 0.1;

        ctx.save(); // Save current canvas state (prevents rotation affecting everything)

        // Move drawing origin to the center and rotate the "paper"
        ctx.translate(vpX, vpY - 20);
        ctx.rotate(rotation);

        // Draw the image centered on the new origin
        if (iamMeImg.complete && iamMeImg.naturalHeight > 0) {
            ctx.drawImage(iamMeImg, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
        }

        ctx.restore(); // Reset canvas state for the next draw call

        // Loop the function to create continuous motion
        animationId = requestAnimationFrame(draw);
    }

    // Initial trigger to start the loop
    animationId = requestAnimationFrame(draw);
}

/**
 * Transitions from the splash screen to the main game container and starts a new game.
 */
function transitionToGame() {
    if (gameStarted) return; // prevent multiple starts

    // Stop splash music and reset it
    splashMusic.pause();
    splashMusic.currentTime = 0;

    cancelAnimationFrame(animationId);
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    splashDiv.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    bgMusic.play().then(function () { });

    if (window.isPlayPage && typeof userEmail !== 'undefined' && userEmail) {
        const savedState = loadGameState();
        if (savedState) {
            game = new Game(savedState);
        } else {
            game = new Game();
        }
    } else {
        game = new Game();
    }

    updateLevelStatus();
    if (prevLevelBtn) prevLevelBtn.classList.add('hidden');
    if (nextLevelBtn) nextLevelBtn.classList.add('hidden');
    gameLoop();
    gameStarted = true;
}

/**
 * Starts a new game instance, resetting any existing game state.
 */
function startNewGame() {
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    game = new Game();
    updateLevelStatus();
    if (prevLevelBtn) prevLevelBtn.classList.add('hidden');
    if (nextLevelBtn) nextLevelBtn.classList.add('hidden');
    gameLoop();
}

/**
 * Updates the level status display (e.g., "level 1 / 3").
 */
function updateLevelStatus() {
    levelStatus.textContent = `level ${game.levelIndex + 1} / ${game.levels.length}`;
}

/**
 * Updates the displayed best time and stars for a given level index.
 * @param {number} levelIndex - The index of the level (0, 1, or 2).
 */
function updateLevelStars(levelIndex) {
    const key = `level${levelIndex}_best`;
    const stored = localStorage.getItem(key);
    let bestTime = '--:--';
    let stars = 0;
    if (stored) {
        const data = JSON.parse(stored);
        bestTime = data.time.toFixed(2) + 's';
        stars = data.stars;
    }
    const bestTimeEl = document.getElementById('bestTime');
    if (bestTimeEl) bestTimeEl.textContent = bestTime;
    for (let i = 1; i <= 3; i++) {
        const starEl = document.getElementById(`star${i}`);
        if (starEl) {
            const starSrc = i <= stars ? 'imagesPHPAssign/star.png' : 'imagesPHPAssign/emptyStar.png';
            starEl.src = starSrc + '?t=' + Date.now(); // cache bust
        }
    }
}

/**
 * Updates the visibility of the previous/next level buttons based on
 * whether the current level is completed and the level index.
 */
function updateNavButtonsVisibility() {
    if (!game) return;
    const levelIndex = game.levelIndex;
    const lastIndex = game.levels.length - 1;

    if (game.levelComplete) {
        // Show previous button only if not the first level
        if (prevLevelBtn) {
            prevLevelBtn.classList.toggle('hidden', levelIndex === 0);
        }
        // Show next button only if not the last level
        if (nextLevelBtn) {
            nextLevelBtn.classList.toggle('hidden', levelIndex === lastIndex);
        }
    } else {
        // Level not complete – hide both buttons
        if (prevLevelBtn) prevLevelBtn.classList.add('hidden');
        if (nextLevelBtn) nextLevelBtn.classList.add('hidden');
    }
}

// ==================== Game Loop ====================
/**
 * The main game loop. Updates game state if not paused or complete, then renders.
 */
function gameLoop() {
    if (!game) return;
    if (!game.levelComplete && !paused) {
        if (game.startTime) game.elapsedTime = performance.now() - game.startTime;
        updatePhysics();
        game.updateMovingWalls();
        checkExit();
    }
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ==================== Physics ====================
/**
 * Updates player and object physics, including gravity, movement, and collision resolution.
 */
function updatePhysics() {
    const p = game.player;
    const objects = game.objects;
    const walls = game.walls;
    let playerObstacles = [...walls];
    let objectObstacles = [...walls];

    // Player horizontal input
    p.vx = 0;
    if (moveLeft) p.vx = -2.5;
    if (moveRight) p.vx = 2.5;
    if (jumpPressed && p.onGround) {
        p.vy = -10;   // jump velocity
        p.onGround = false;
    }
    p.vy += 0.5; // gravity (approx 9.8 scaled to frame rate, but we use consistent time step)

    // Horizontal movement and collision
    p.x += p.vx;
    resolveCollisionsMinOverlap(p, playerObstacles, true);
    resolveCollisionsMinOverlap(p, objects.filter(function (obj) { return !obj.held; }), true);
    // Vertical movement and collision
    p.y += p.vy;
    p.onGround = false; // will be set true if landing on something
    resolveCollisionsMinOverlap(p, playerObstacles, false);
    resolveCollisionsMinOverlap(p, objects.filter(function (obj) { return !obj.held; }), false);
    clampPlayer();

    // Update non‑held objects (gravity, collisions)
    for (let obj of objects) {
        if (!obj.held) {
            obj.vy += 0.5;
            obj.x += obj.vx;
            resolveCollisionsMinOverlap(obj, objectObstacles, true);
            resolveCollisionsMinOverlap(obj, [p], true);
            resolveCollisionsMinOverlap(obj, objects.filter(function (o) { return o !== obj && !o.held; }), true);
            obj.y += obj.vy;
            resolveCollisionsMinOverlap(obj, objectObstacles, false);
            resolveCollisionsMinOverlap(obj, [p], false);
            resolveCollisionsMinOverlap(obj, objects.filter(function (o) { return o !== obj && !o.held; }), false);
            clampObject(obj);
        }
    }
}

/**
 * Resolves collisions by minimal translation. Moves the entity out of any colliding obstacles
 * by the smallest distance possible.
 * @param {Object} entity - Object with x, y, w, h, vx, vy properties.
 * @param {Array} obstacles - Array of objects with x, y, w, h properties.
 * @param {boolean} isHorizontal - True for horizontal resolution, false for vertical.
 */
function resolveCollisionsMinOverlap(entity, obstacles, isHorizontal) {
    for (let ob of obstacles) {
        if (entity.x < ob.x + ob.w && entity.x + entity.w > ob.x &&
            entity.y < ob.y + ob.h && entity.y + entity.h > ob.y) {
            if (isHorizontal) {
                const overlapLeft = (entity.x + entity.w) - ob.x;
                const overlapRight = (ob.x + ob.w) - entity.x;
                if (overlapLeft < overlapRight) entity.x = ob.x - entity.w;
                else entity.x = ob.x + ob.w;
                entity.vx = 0; // stop horizontal velocity
            } else {
                const overlapTop = (entity.y + entity.h) - ob.y;
                const overlapBottom = (ob.y + ob.h) - entity.y;
                if (overlapTop < overlapBottom) {
                    entity.y = ob.y - entity.h;
                    if (entity === game.player) entity.onGround = true;  // landed on something
                } else entity.y = ob.y + ob.h;
                entity.vy = 0; // stop vertical velocity
            }
        }
    }
}

/**
 * Clamps the player's position within the world boundaries.
 */
function clampPlayer() {
    const p = game.player;
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > WORLD_WIDTH) p.x = WORLD_WIDTH - p.w;
    if (p.y + p.h > FLOOR_Y) { p.y = FLOOR_Y - p.h; p.vy = 0; p.onGround = true; }
    if (p.y < 0) { p.y = 0; p.vy = 0; }
}

/**
 * Clamps a generic object's position within the world boundaries.
 * @param {GameObject} obj - The object to clamp.
 */
function clampObject(obj) {
    if (obj.x < 0) obj.x = 0;
    if (obj.x + obj.worldW > WORLD_WIDTH) obj.x = WORLD_WIDTH - obj.worldW;
    if (obj.y + obj.worldH > FLOOR_Y) { obj.y = FLOOR_Y - obj.worldH; obj.vy = 0; }
    if (obj.y < 0) { obj.y = 0; obj.vy = 0; }
}

/**
 * Checks if the player has reached the exit. If so, marks the level complete,
 * saves the best time, and displays a success message. For the last level,
 * triggers the game over screen after a delay.
 */
function checkExit() {
    const p = game.player;
    const exit = game.exit;
    if (!game.levelComplete &&
        p.x < exit.x + exit.w && p.x + p.w > exit.x &&
        p.y < exit.y + exit.h && p.y + p.h > exit.y) {

        if (selectedObject) {
            dropSelected();   // drop any held object before completing level
        }

        game.levelComplete = true;
        // Accumulate time and stars for server-side leaderboard
        game.totalGameTime += game.elapsedTime;
        game.totalStarsEarned += game.getStarsFromTime(game.elapsedTime / 1000);
        updateNavButtonsVisibility();
        game.saveBestTime();
        // Save progress after completing level
        saveGameState();

        moveLeft = false;
        moveRight = false;
        jumpPressed = false;

        const seconds = (game.elapsedTime / 1000).toFixed(2);
        const stars = game.getStarsFromTime(game.elapsedTime / 1000);
        feedbackDiv.classList.remove('hidden');
        feedbackDiv.textContent = `Level complete! Time: ${seconds}s, Stars: ${stars}`;

        if (game.levelIndex === game.levels.length - 1) {
            if (gameOverTimeout) clearTimeout(gameOverTimeout);
            gameOverTimeout = setTimeout(function () {
                feedbackDiv.classList.add('hidden');
                showGameOver();
                gameOverTimeout = null;
            }, 2000);
        }
    }
}

/**
 * Displays the game over screen, showing the player's history from localStorage.
 * Adds a button to submit results to the leaderboard.
 */
function showGameOver() {
    HistoryManager.display(historyDiv);
    gameoverDiv.classList.remove('hidden');
    document.querySelector('#gameContainer header').style.display = 'none';
    helpBtn.classList.add('hidden');

    // Hide navigation buttons during game over
    if (prevLevelBtn) prevLevelBtn.classList.add('hidden');
    if (nextLevelBtn) nextLevelBtn.classList.add('hidden');

    // Change heading to "Game Completed!" instead of "level complete!"
    const gameoverHeading = document.querySelector('#gameover h2');
    if (gameoverHeading) {
        gameoverHeading.textContent = 'Game Completed!';
    }

    // Add leaderboard button if not already present
    let existingLeaderboardBtn = document.querySelector('#leaderboardBtn');
    if (!existingLeaderboardBtn) {
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.id = 'leaderboardBtn';
        leaderboardBtn.textContent = 'View Leaderboard';
        leaderboardBtn.style.background = '#3a6ea5';
        leaderboardBtn.style.color = 'white';
        leaderboardBtn.style.border = 'none';
        leaderboardBtn.style.padding = '6px 16px';
        leaderboardBtn.style.fontFamily = 'inherit';
        leaderboardBtn.style.fontSize = '12px';
        leaderboardBtn.style.cursor = 'pointer';
        leaderboardBtn.style.marginTop = '10px';
        leaderboardBtn.addEventListener('click', submitGameResults);
        document.querySelector('#gameover').appendChild(leaderboardBtn);
    }
    
    // Clear saved state because game is finished
    clearGameState();
}

/**
 * Submits the final game results to leaderboard.php via AJAX,
 * then redirects to the leaderboard page.
 */
function submitGameResults() {
    // Ensure game and userEmail exist
    if (!game || !userEmail) {
        console.error('Cannot submit: game or userEmail missing');
        // Still redirect to leaderboard if possible
        if (userEmail) {
            window.location.href = `leaderboard.php?email=${encodeURIComponent(userEmail)}`;
        } else {
            window.location.href = 'leaderboard.php';
        }
        return;
    }

    const totalSeconds = (game.totalGameTime / 1000).toFixed(2);
    const totalStars = game.totalStarsEarned;

    fetch('leaderboard.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(userEmail)}&total_time=${totalSeconds}&total_stars=${totalStars}`
    }).then(() => {
        window.location.href = `leaderboard.php?email=${encodeURIComponent(userEmail)}`;
    }).catch(err => {
        console.error('Failed to submit results:', err);
        window.location.href = `leaderboard.php?email=${encodeURIComponent(userEmail)}`;
    });
}

/**
 * Resets the game from the game over screen, restarting from level 1.
 */
function resetGame() {
    if (gameOverTimeout) {
        clearTimeout(gameOverTimeout);
        gameOverTimeout = null;
    }
    if (pendulumFeedbackTimeout) {
        clearTimeout(pendulumFeedbackTimeout);
        pendulumFeedbackTimeout = null;
        feedbackDiv.classList.add('hidden');
    }
    gameoverDiv.classList.add('hidden');
    document.querySelector('#gameContainer header').style.display = 'flex';
    helpBtn.classList.remove('hidden');
    // Clear saved state before starting new game
    clearGameState();
    startNewGame();
}

// ==================== Coordinate Conversion ====================
/**
 * Converts world coordinates to screen coordinates, accounting for current zoom and center.
 * @param {number} wx - World X coordinate.
 * @param {number} wy - World Y coordinate.
 * @returns {Object} - { x, y } screen pixel coordinates.
 */
function worldToScreen(wx, wy) {
    return {
        x: (wx - zoomCenterX) * zoom + zoomCenterX,
        y: (wy - zoomCenterY) * zoom + zoomCenterY
    };
}

/**
 * Converts screen coordinates to world coordinates, accounting for current zoom and center.
 * @param {number} sx - Screen X coordinate.
 * @param {number} sy - Screen Y coordinate.
 * @returns {Object} - { x, y } world coordinates.
 */
function screenToWorld(sx, sy) {
    return {
        x: (sx - zoomCenterX) / zoom + zoomCenterX,
        y: (sy - zoomCenterY) / zoom + zoomCenterY
    };
}

/**
 * Axis-Aligned Bounding Box collision detection.
 * @param {Object} a - Object with x, y, w, h properties.
 * @param {Object} b - Object with x, y, w, h properties.
 * @returns {boolean} True if the two AABBs intersect.
 */
function aabbCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ==================== Rendering ====================
/**
 * Renders the entire game world: background, walls, moving walls, exit, player, and objects.
 * Applies the current camera zoom and center transformations.
 */
function render() {
    const now = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(zoomCenterX, zoomCenterY);
    ctx.scale(zoom, zoom);
    ctx.translate(-zoomCenterX, -zoomCenterY);

    // Background
    if (bgImage.complete && bgImage.naturalHeight > 0) {
        ctx.drawImage(bgImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
        ctx.fillStyle = '#c0d0e2';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    // Draw static walls (platforms and floor)
    game.walls.forEach(function (w) {
        if (w.isPlatform) {
            let img = (w.y === FLOOR_Y) ? floorImg : platformImg;
            if (img.complete && img.naturalHeight > 0) {
                const pattern = ctx.createPattern(img, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(w.x, w.y, w.w, w.h);
            } else {
                ctx.fillStyle = '#acb7c9';
                ctx.fillRect(w.x, w.y, w.w, w.h);
            }
        }
    });

    // Draw moving walls (crusher) – simple red fill
    ctx.fillStyle = '#aa5555';
    game.movingWalls.forEach(function (mw) { ctx.fillRect(mw.x, mw.y, mw.w, mw.h); });

    // Draw exit door
    if (doorImg.complete && doorImg.naturalHeight > 0) {
        ctx.drawImage(doorImg, game.exit.x, game.exit.y, game.exit.w, game.exit.h);
    } else {
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(game.exit.x, game.exit.y, game.exit.w, game.exit.h);
    }

    // Player animation (choose frame based on movement)
    const p = game.player;
    const isMoving = moveLeft || moveRight;

    if (isMoving) {
        if (now - lastFrameTime > FRAME_INTERVAL) {
            currentRunFrame = (currentRunFrame + 1) % playerRunFrames.length;
            lastFrameTime = now;
        }
        if (moveLeft) playerDirection = 'left';
        if (moveRight) playerDirection = 'right';
    } else {
        currentRunFrame = 0;   // idle frame (first frame of run animation is actually idle)
    }

    let playerImg = isMoving ? playerRunFrames[currentRunFrame] : playerIdleImg;

    if (playerImg.complete && playerImg.naturalHeight > 0) {
        if (playerDirection === 'right') {
            ctx.drawImage(playerImg, p.x, p.y, p.w, p.h);
        } else {
            // Flip horizontally by scaling -1
            ctx.save();
            ctx.translate(p.x + p.w, p.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, 0, 0, p.w, p.h);
            ctx.restore();
        }
    }

    // Draw grabbable objects with textures
    for (let obj of game.objects) {
        let drawWidth = obj.worldW;
        let drawHeight = obj.worldH;
        let angle = obj.orientation * Math.PI / 2;
        let img = null;

        if (obj.isClock && clockImg.complete && clockImg.naturalHeight > 0) {
            img = clockImg;
        } else if (obj.isCube && crateImg.complete && crateImg.naturalHeight > 0) {
            img = crateImg;
        } else if (obj.texture === 'pencil' && pencilImg.complete && pencilImg.naturalHeight > 0) {
            img = pencilImg;
        }

        if (img) {
            ctx.save();
            // For rotated drawing, adjust dimensions if orientation swapped
            let drawW = drawWidth;
            let drawH = drawHeight;
            if (obj.orientation % 2 === 1) {
                drawW = drawHeight;
                drawH = drawWidth;
            }
            ctx.translate(obj.x + drawWidth / 2, obj.y + drawHeight / 2);
            ctx.rotate(angle);
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }
    }
    ctx.restore(); // restore from zoom transform

    // Draw timer – in screen coordinates after ctx.restore
    if (game && !game.levelComplete) {
        let seconds = (game.elapsedTime / 1000).toFixed(2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`Time: ${seconds}s`, 10, 30);
    }
}