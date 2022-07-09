"use strict";

const riverGame = {
    
    // ======================================================
    // DOM References
    // ======================================================
    // General
    $gameArea: $("#game-area"),

    // Buttons
    $btns: $(".btn"),
    $startBtn: $(".start-btn"),
    $instructionsBtn: $(".instructions-btn"),
    $homeBtn: $(".home-btn"),
    $controlsBtn: $(".controls-btn"),
    $backBtn: $(".back-btn"),
    $playBtn: $(".play-btn"),
    $playAgainBtn: $(".play-again-btn"),
    $leaderboardBtn: $(".leaderboard-btn"),
    $quitBtn: $(".quit-btn"),
    $leftBtn: $(".left-btn"),
    $rightBtn: $(".right-btn"),

    // Screens
    $screens: $(".screen-container"),
    $gameScreen: $("#game-screen"),

    // Game Elements
    $nameBox: $("#name"), 
    $pathContainer: $("#path-container"),
    $playerTrailContainer: $("#player-trail-container"),
    $distanceValue: $(".distance .distance-value"),
    $bestDistanceValue: $(".best-distance .distance-value"),
    $finalScoreValue: $(".final-score-value"),
    $leaderboardList: $(".leaderboard-list"),

    // ======================================================
    // Game Variables
    // ======================================================
    // General
    isRunning: false,

    // Screens
    screen: "splash-screen",
    lastScreen: "splash-screen",
    gameScreens: ["splash-screen", "instructions-screen", "controls-screen", "setup-screen", "game-screen", "game-over-screen", "leaderboard-screen"],

    // Game Update Loop
    updateInterval: 20,
    intervalID: null,

    // Screen Dimensions - Set in init()
    screenWidth: 0,
    screenHeight: 0,
    tileSize: 5,

    // Path Blocks
    // Path array
    paths: [],
    // Path Position Bounds - Set in init()
    boundMargin: 20,
    leftBound: 0,
    rightBound: 0,
    // Path width bounds
    minPathWidth: 150,
    maxPathWidth: 200,
    // Path dimensions
    initialPathWidth: 0,    // Set in init()
    initialPathHeight: 10,
    pathWidth: 0,           // Set in initializePaths()
    pathHeight: 10,
    // Last path (left) position tracker - Initialized in initizePaths()
    pathPosition: 200,
    extraPaths: 5,          // Used to add padding/buffer at top of screen when moving paths
    // Path Adjustment
    pathWidthAdjustment: 0,
    pathLeftAdjustment: 0,
    pathAdjustmentPathCounter: 0,
    pathAdjustmentPeriod: 10,  // Paths per adjustment cycle

    // Player 
    // Player object
    player: null,
    // Player Image
    playerImg: "./images/donut.png",
    // Player dimensions
    playerWidth: 50,
    playerHeight: 50,
    // Player movement
    playerAccelerationFactor: 0.075,
    playerMaxSpeed: 10,
    // Player Position - Set in init()
    initialPlayerLeft: 0,
    initialPlayerTop: 350,

    // Player Trails
    trailSpawnCounter: 0,
    trailSpawnInterval: 2,
    playerTrails: [],
    trailDim: 4,
    trailLifeSpan: 20,
    trailAngleLimit: 30,    //30 deg cone

    // Vertical game scrolling
    initialScrollSpeed: 4,
    scrollSpeed: 0,             // Set in reset()
    backgroundScroll: 0,
    initialSpeedAdjustmentPeriod: 100,
    speedAdjustmentPeriod: 100, // Path updates per adjustment cycle
    // Compensate for player's initial position
    // Set equal to initialPlayerTop in init() 
    initialDistanceOffset: 0,
    distanceScrolled: 0,            // In pixels
    distanceScrolledMeters: 0,      // In "meters"
    pixelsPerMeter: 20,             // Distance conversion factor
    bestDistance: 0,

    // Leaderboard
    leaderboard: [
        {
            name: "CJANG",
            score: 1000
        }, 
        {
            name: "FAKER",
            score: 800
        }, 
        {
            name: "[___]",
            score: 600
        }, 
        {
            name: "SMILE",
            score: 400
        }, 
        {
            name: "STEVE",
            score: 200
        }, 
    ],

    // Sounds
    clickSound: new Audio("./media/click.wav"),
    clickVolume: 0.5,
    smackSound: new Audio("./media/smack.wav"),
    smackVolume: 0.2,
    speedUpSound: new Audio("./media/speed-up.mp3"),
    speedUpVolume: 0.1,
    bgMusic: new Audio("./media/synth-music-80.mp3"),
    bgmVolume: 0.1,
    bgmSpeedIncrement: 0.05,

    // ======================================================
    // Game Functions
    // ======================================================
    // Function to pause the game
    setPaused: () => {
        riverGame.isRunning = false;
        riverGame.$gameScreen.addClass("paused")
        riverGame.stopUpdate();

        riverGame.pauseSound(riverGame.bgMusic);
    },

    // Function to unpause the game
    clearPaused: () => {
        riverGame.isRunning = true;
        riverGame.$gameScreen.removeClass("paused")
        riverGame.runUpdate();
        
        // Play background music at 20% volume
        riverGame.playSound(riverGame.bgMusic, riverGame.bgmVolume);
    },

    // Function to handle game over
    gameOver: () => {
        riverGame.setPaused();
        riverGame.switchScreen("game-over-screen");
        riverGame.$finalScoreValue.text(riverGame.distanceScrolledMeters);
        riverGame.updateLeaderboard();
        riverGame.pauseSound(riverGame.bgMusic);
    },
    
    // Function to reset the game
    reset: () => {
        // Set game paused
        riverGame.setPaused();

        // Destroy existing paths
        riverGame.destroyPaths();

        // Create new paths
        riverGame.initializePaths();

        // Reset Path variables
        riverGame.pathWidth = riverGame.initialPathWidth;
        riverGame.pathWidthAdjustment = 0;
        riverGame.pathLeftAdjustment = 0;
        riverGame.pathAdjustmentPathCounter = 0;

        // Reset speed
        riverGame.scrollSpeed = riverGame.initialScrollSpeed;
        riverGame.speedAdjustmentPeriod = riverGame.initialSpeedAdjustmentPeriod;

        // Reset distance and display "0" for the distance
        riverGame.distanceScrolled = 0;
        riverGame.updateDistance("0"); 

        // Reset player
        riverGame.player.reset();

        // Destroy any player trails
        riverGame.destroyPlayerTrails();

        // Reset BG Music speed
        riverGame.bgMusic.playbackRate = 1;
    },
    
    // ======================================================
    // Screen Functions
    // ======================================================
    // Function to switch between game screens
    switchScreen: (screen) => {
        // Verify that user input is valid
        if (riverGame.gameScreens.includes(screen)) {
            // Hide all screens
            riverGame.$screens.hide();

            // Record Original Screen
            riverGame.lastScreen = riverGame.screen;
    
            // Change screen
            riverGame.screen = screen;
            
            // Show new screen
            $(`#${screen}`).show();
        } else {
            console.log(`${screen} is not a valid screen selection`);
        }
    },

    // ======================================================
    // Game Update Functions
    // ======================================================
    // Function to run the update loop
    runUpdate: () => {
        // Stop existing update interval
        riverGame.stopUpdate();
        // Start a new update interval
        riverGame.intervalID = setInterval(riverGame.updateLoop, riverGame.updateInterval);
    },

    // Function to cancel the update loop
    stopUpdate: () => {
        clearInterval(riverGame.intervalID);
    },

    // Update Loop logic
    updateLoop: () => {
        // Update Player
        riverGame.player.update();
        riverGame.updatePlayerTrails();

        // Update path blocks and background
        riverGame.updatePaths();
        riverGame.scrollBackground();

        // Update Score (distance value)
        riverGame.updateDistance();

        // Update speed
        riverGame.updateSpeed()
    },

    // ======================================================
    // Path Functions
    // ======================================================
    // Function to populate the initial paths
    initializePaths: () => {
        // Reset pathPosition to the center of the screen
        riverGame.pathPosition = (riverGame.screenWidth - riverGame.initialPathWidth)/2;

        // Generate enough paths to cover the screen plus some extra paths for padding
        let numPaths = Math.ceil(riverGame.$gameScreen.height()/riverGame.initialPathHeight) + 1 + riverGame.extraPaths;

        // Automatically populate paths in a cone shape to start
        for(let i = 0; i < numPaths; i++) {
            new Path(
                riverGame.pathPosition - i*riverGame.tileSize,
                riverGame.initialPathHeight*(i - riverGame.extraPaths),
                riverGame.initialPathWidth + i*riverGame.tileSize*2,
                riverGame.initialPathHeight
            )
        }
    },

    // Function to remove all paths
    destroyPaths: () => {
        // Destroy all paths
        riverGame.paths.forEach(path => {
            path.element.remove();
        })
        riverGame.paths.length = 0;
    },

    // Function to add a path element to the DOM based on a given path object and also add the path object to the paths array
    addPath: (pathObj) => {
        const $path = $("<div></div>").addClass("path");
        $path.css(pathObj.getPosition());
        $path.outerWidth(pathObj.width);
        $path.height(pathObj.height);
        riverGame.paths.push(pathObj);
        riverGame.$pathContainer.append($path);
        return $path;
    },

    // Function to update each path object
    updatePaths: () => {
        // Loop through array backwards to mitigate the problem where
        for (let i = riverGame.paths.length - 1; i >= 0; i--) {
            let path = riverGame.paths[i];
            path.update();

            // Check if any part of the entire player overlaps with the current path, if so, check the individual hitboxes, if there is a hitbox collision, the game is over
            if(riverGame.player.overlapsVertically(path)) {
                if (riverGame.player.checkHitboxCollisions(path) ) {
                    riverGame.playSound(riverGame.smackSound, riverGame.smackVolume);
                    riverGame.gameOver();
                    break
                };
            }

            if (path.isOffScreen()) {
                riverGame.generateDirectedPath(path);
            }
        }
    },

    // Function to generate a path based on set of directions, directions will control the path generation behaviour over the course of a path cycle
    generateDirectedPath(path) {
        // Move path to top of the screen - minus some offset for extra path elements
        path.addTop(-(riverGame.$pathContainer.height() + (riverGame.pathHeight * (riverGame.extraPaths + 1))));

        // Remove speed-up class if it exists
        path.element.removeClass("speed-up");

        // Indicate at what point a speed up will happen
        // Height of paths in pixels since "0m" point = game.pathAdjustmentPathCounter*game.pathHeight 
        // Pixels to speedAdjustmentPeriod from "0m" point = game.speedAdjustmentPeriod*game.pixelsPerMeter
        if ( riverGame.pathAdjustmentPathCounter*riverGame.pathHeight === riverGame.speedAdjustmentPeriod*riverGame.pixelsPerMeter ) {
            path.element.addClass("speed-up");
        }

        // Update Width
        riverGame.pathWidth += (riverGame.pathWidthAdjustment * riverGame.tileSize);
        
        // Check width bounds - if a bound is hit, set width to the bound and stop adjusting width until next adjustment cycle
        if (riverGame.pathWidth < riverGame.minPathWidth) {
            riverGame.pathWidth = riverGame.minPathWidth;
            riverGame.pathWidthAdjustment = 0;
        }
        if (riverGame.pathWidth > riverGame.maxPathWidth) {
            riverGame.pathWidth = riverGame.maxPathWidth;
            riverGame.pathWidthAdjustment = 0;
        }

        path.setWidth(riverGame.pathWidth);

        // Update path position
        riverGame.pathPosition += (riverGame.pathLeftAdjustment * riverGame.tileSize);
        
        // Subtract half of the width offset to keep width growth "centered"
        riverGame.pathPosition -= (riverGame.pathWidthAdjustment * riverGame.tileSize)/2;

        // Check position bounds
        if (riverGame.pathPosition <= riverGame.leftBound) {
            riverGame.pathPosition = riverGame.leftBound;
        }
        if (riverGame.pathPosition >= riverGame.rightBound - riverGame.pathWidth) {
            riverGame.pathPosition = riverGame.rightBound - riverGame.pathWidth;
        }
        
        path.setLeft(riverGame.pathPosition);

        riverGame.pathAdjustmentPathCounter++;

        // Handle path adjustment cycle - after counter passes the set period, get a new path adjustment direction
        if (riverGame.pathAdjustmentPathCounter % riverGame.pathAdjustmentPeriod == 0) {
            riverGame.changePathDirections();
        }
    },

    // Function to generate a new set of directions for the next path cycle 
    changePathDirections() {
        // Set new adjustment factors for width and left position of paths
        // -1, 0, 1 => Shrink by 1 tile, stay same, grow by 1 tile
        let newWidthAdjustment = Math.floor(Math.random() * 3) - 1;
        // -1, 0, 1 => Move left, stay same, move right
        let newLeftAdjustment = Math.floor(Math.random() * 3) - 1;

        // Don't allow consecutive straight path cycles
        if ( riverGame.pathLeftAdjustment == 0 && newLeftAdjustment == 0 ) {
            let plusOrMinus = Math.random() < 0.5 ? -1 : 1;
            riverGame.pathLeftAdjustment += plusOrMinus;
        }

        // If the width adjustment is trying to grow while at the max width, or shrink while at the min width, reverse the width adjustment
        if ( 
            (riverGame.pathWidth == riverGame.maxPathWidth && newWidthAdjustment == 1) || 
            ( riverGame.pathWidth == riverGame.minPathWidth && newWidthAdjustment == -1) ) {
            newWidthAdjustment *= -1;
        }

        // Update adjustment factors
        riverGame.pathWidthAdjustment = newWidthAdjustment;
        riverGame.pathLeftAdjustment = newLeftAdjustment;
    },

    // ======================================================
    // Player Functions
    // ======================================================
    //  Function to add a path element to the DOM based on a given path object and also add the path object to the paths array
    addPlayer: (playerObj) => {
        const $player = $("<img></img>").addClass("player");
        $player.attr("src",playerObj.img);
        $player.attr("alt","A pink donut");
        $player.css(playerObj.getPosition());
        $player.outerWidth(playerObj.width);
        riverGame.$gameScreen.append($player);
        return $player;
    },

    // Function to handle when left inputs are pressed or released
    leftPressed: (pressed = false) => {
        riverGame.player.setMoveLeft(pressed);

        if ( pressed ) {
            riverGame.$leftBtn.addClass("pressed");
        } else {
            riverGame.$leftBtn.removeClass("pressed");
        }
    },
    
    // Function to handle when right inputs are pressed or released
    rightPressed: (pressed = false) => {
        riverGame.player.setMoveRight(pressed);

        if ( pressed ) {
            riverGame.$rightBtn.addClass("pressed");
        } else {
            riverGame.$rightBtn.removeClass("pressed");
        }
    },

    // ======================================================
    // Player Trail Functions
    // ======================================================
    // Function to add a path trail elment
    addPlayerTrail: (playerTrailObj) => {
        const $playerTrail = $("<div></div>").addClass("player-trail");
        $playerTrail.css(playerTrailObj.getPosition());
        $playerTrail.outerWidth(playerTrailObj.getWidth());
        $playerTrail.outerHeight(playerTrailObj.getHeight());
        riverGame.playerTrails.push(playerTrailObj);
        riverGame.$playerTrailContainer.append($playerTrail);
        return $playerTrail;
    },
    
    // Function to remove a single player trail element
    removePlayerTrail: (playerTrailObj) => {
        playerTrailObj.element.remove();

        // Find playerTrail in playerTrails array and remove it
        let index = riverGame.playerTrails.indexOf(playerTrailObj);
        riverGame.playerTrails.splice(index,1);
    },

    // Function to destroy all player trail elements
    destroyPlayerTrails: () => {
        // Destroy all paths
        riverGame.playerTrails.forEach(playerTrail => {
            playerTrail.element.remove();
        })
        riverGame.playerTrails.length = 0;
    },

    // Function to generate the random player trails
    generateRandomPlayerTrail: () => {
        let playerAngle = riverGame.player.getRotation();
        // Get a offset angle
        let angleOffset = Math.random()*riverGame.trailAngleLimit - riverGame.trailAngleLimit/2;
        // Add random offset to player angle
        let trailAngleDeg = playerAngle + angleOffset;
        // Convert angle from degree to rad
        let trailAngle = trailAngleDeg/180*Math.PI;

        new PlayerTrail(
            riverGame.player.getLeft() + (riverGame.player.getWidth() - riverGame.trailDim)/2,
            riverGame.player.getTop() + (riverGame.player.getHeight() - riverGame.trailDim)/2,
            trailAngle,
            riverGame.scrollSpeed/2);
    },

    // Function to update the position and rotation of the player trails
    updatePlayerTrails: () => {
        // Spawn a trail every other update
        if (riverGame.trailSpawnCounter >= riverGame.trailSpawnInterval) {
            riverGame.generateRandomPlayerTrail();
            riverGame.trailSpawnCounter = 0;
        }
        riverGame.trailSpawnCounter++;
        // Update each trail
        riverGame.playerTrails.forEach((trail) => {
            trail.update();
        })
    },

    // ======================================================
    // Scrolling Functions
    // ======================================================
    // Function to move the background positions to visually match the scrolling of the path blocks
    scrollBackground: () => {
        // Increment the background scroll position, matching the scroll speed
        riverGame.backgroundScroll+=riverGame.scrollSpeed;

        // if the background scrolls past the height of the screen, reset it back to the top
        if (riverGame.backgroundScroll >= riverGame.screenHeight) {
            riverGame.backgroundScroll -= riverGame.screenHeight;
        }
        
        // Scroll the background for all paths
        $(".path").css("background-position-y",riverGame.backgroundScroll)
        
        // Scroll the grass background
        riverGame.$gameScreen.css("background-position-y",riverGame.backgroundScroll)
    },

    // Function to update the distance scores and display it
    updateDistance: (value) => {
        // Update the distanceScrolled variable and display that
        // If value is optionally set, then display that value
        if (!value) {
            riverGame.distanceScrolled += riverGame.scrollSpeed;
            // Update Distance value display in UI
            // Compensate for player distance offset to top of screen, and offset of extra paths to top of screen
            let distanceScrolledPixels = riverGame.distanceScrolled - riverGame.initialDistanceOffset - (riverGame.initialPathHeight*riverGame.extraPaths);
            // Convert distance to "Meters" and round to nearest meter
            riverGame.distanceScrolledMeters = Math.round(distanceScrolledPixels/riverGame.pixelsPerMeter);
            riverGame.$distanceValue.text(riverGame.distanceScrolledMeters);

            // Check if current distance is greater than the best distance
            if (riverGame.distanceScrolledMeters >= riverGame.bestDistance) {
                riverGame.bestDistance = riverGame.distanceScrolledMeters;
                riverGame.$bestDistanceValue.text(riverGame.bestDistance);

            }
        } else {
            riverGame.$distanceValue.text(value);
        }

    },

    // Function to update the speed of the game
    // Update the speed when the required distance has been passed
    updateSpeed: () => {
        if (riverGame.distanceScrolledMeters >= riverGame.speedAdjustmentPeriod) {
            // For the first speed adjustment period, increase adjustment distance by 100m, after that increase by 200m
            if (riverGame.speedAdjustmentPeriod == riverGame.initialSpeedAdjustmentPeriod) {
                riverGame.speedAdjustmentPeriod += 100;
            } else {
                riverGame.speedAdjustmentPeriod += 200;
            }
            // Increment scroll speed by 1
            riverGame.scrollSpeed++;

            // Increase background music playback
            riverGame.bgMusic.playbackRate += riverGame.bgmSpeedIncrement;

            // Play Speed Up sound
            riverGame.playSound(riverGame.speedUpSound,riverGame.speedUpVolume);
            
            // Display a Speed Up Message for 1s (1000ms)
            riverGame.$gameScreen.addClass("speed-up-msg");
            setTimeout(()=>{
                riverGame.$gameScreen.removeClass("speed-up-msg");
            },1000)
        }
    },

    // ======================================================
    // Leaderboard Functions
    // ======================================================
    // Function to update leaderboard with top 5 scores
    updateLeaderboard: () => {
        // Check if player's current score exceeds any of the existing leaderboard scores, if so, splice the player's score into the leaderboard and break out of the loop
        for (let i = 0; i < riverGame.leaderboard.length; i++) {
            if (riverGame.distanceScrolledMeters > riverGame.leaderboard[i].score) {
                riverGame.leaderboard.splice(i,0,{
                    name: riverGame.player.getName(),
                    score: riverGame.distanceScrolledMeters
                })
                break;
            }
        }

        // Limit leaderboard to top 5
        riverGame.leaderboard = riverGame.leaderboard.slice(0,5);

        // Empty DOM leaderboard
        riverGame.$leaderboardList.empty();

        // Redraw DOM Leaderboard
        riverGame.leaderboard.forEach((player,index) => {
            let $newRow = $(
                `<tr>
                    <td>${index+1}.</td>
                    <td>${player.name}</td>
                    <td>${player.score}m</td>
                </tr>`);
            
            // If the leaderboard name matches the current player name, then identify those players with the player-score class
            if (player.name == riverGame.player.name) {
                $newRow.addClass("player-score")
            }
            riverGame.$leaderboardList.append($newRow);
        })
    },

    // ======================================================
    // Sound Functions
    // ======================================================
    // Function to play a Audio object with controls for volume and speed
    playSound: (sound, volume, playbackRate) => {
        if (volume) {
            sound.volume = volume;
        }
        if (playbackRate) {
            sound.playbackRate = playbackRate;
        }
        sound.currentTime = 0;
        sound.play();
    },

    // Function to pause a Audio object
    pauseSound: (sound) => {
        sound.pause();
    },

    // ======================================================
    // Initialization Function
    // ======================================================
    init: () => {
        // Update screen dimensions
        riverGame.screenWidth = riverGame.$gameArea.width();
        riverGame.screenHeight = riverGame.$gameArea.height();

        // Update left and right bound based on gameArea
        riverGame.leftBound = riverGame.boundMargin;
        riverGame.rightBound = riverGame.screenWidth - riverGame.boundMargin;

        // Set initial path width to halfway between the min and max path width
        riverGame.initialPathWidth = (riverGame.minPathWidth + riverGame.maxPathWidth)/2;

        // Create Player
        // Center player horizontally
        riverGame.initialPlayerLeft = riverGame.screenWidth/2 - riverGame.playerWidth/2;
        riverGame.player = new Player(riverGame.initialPlayerLeft, riverGame.initialPlayerTop, "NAME")

        // Update initial distance offset to player position (top)
        riverGame.initialDistanceOffset = riverGame.initialPlayerTop;

        // Make music looping
        riverGame.bgMusic.addEventListener('ended', function() {
            riverGame.playSound(riverGame.bgMusic);
        }, false);
        
        // Add click sound to all buttons
        riverGame.$btns.click((e) => {
            riverGame.playSound(riverGame.clickSound, riverGame.clickVolume);
        })

        // Start Button
        riverGame.$startBtn.click((e) => {
            e.preventDefault();
            
            riverGame.reset();
            riverGame.switchScreen("setup-screen");
        })

        // Instructions Button
        riverGame.$instructionsBtn.click((e) => {
            e.preventDefault();
            
            riverGame.switchScreen("instructions-screen");
        })
        
        // Controls Button
        riverGame.$controlsBtn.click((e) => {
            e.preventDefault();
            
            riverGame.switchScreen("controls-screen");
        })

        // Back Button
        riverGame.$backBtn.click((e) => {
            e.preventDefault();
            
            riverGame.switchScreen(riverGame.lastScreen);
        })
        
        // Play Button
        riverGame.$playBtn.click((e) => {
            e.preventDefault();
            // If the player entered a name, use it
            if (riverGame.$nameBox.val() != "") {
                riverGame.player.setName(riverGame.$nameBox.val());
            }
            
            riverGame.switchScreen("game-screen");
        })

        // Play Again Buttons 
        riverGame.$playAgainBtn.click((e) => {
            e.preventDefault();

            riverGame.reset();
            riverGame.switchScreen("game-screen");
        })

        // Leaderboard Button
        riverGame.$leaderboardBtn.click((e) => {
            e.preventDefault();
            
            riverGame.switchScreen("leaderboard-screen");
        })

        // Quit Buttons 
        riverGame.$quitBtn.click((e) => {
            e.preventDefault();

            riverGame.switchScreen("splash-screen");
        })

        // Home Button
        riverGame.$homeBtn.click((e) => {
            e.preventDefault();

            riverGame.setPaused();
            riverGame.switchScreen("splash-screen")
        })

        // Left Button
        riverGame.$leftBtn.mousedown((e) => {
            e.preventDefault();

            riverGame.leftPressed(true);
        })
        
        riverGame.$leftBtn.mouseup((e) => {
            e.preventDefault();

            riverGame.leftPressed(false);
        })

        // Right Button
        riverGame.$rightBtn.mousedown((e) => {
            e.preventDefault();

            riverGame.rightPressed(true);
        })
        
        riverGame.$rightBtn.mouseup((e) => {
            e.preventDefault();

            riverGame.rightPressed(false);
        })

        // Click screen to start the game
        riverGame.$gameScreen.click((e) => {
            if (riverGame.screen === "game-screen") {
                riverGame.playSound(riverGame.clickSound);
                if (riverGame.isRunning) {
                    riverGame.setPaused();
                } else {
                    riverGame.clearPaused();
                }
            }
        })

        // Player Keyboard Controls
        $(window).keydown((e) => {
            let key = e.key;
            switch (key) {
                case "A":
                case "a":
                case "ArrowLeft":
                    riverGame.leftPressed(true);
                    break;
                    
                case "D":
                case "d":
                case "ArrowRight":
                    riverGame.rightPressed(true);
                    break;
                
                // Open instructions screen on splash page 
                case "I":
                case "i":
                    if (riverGame.screen === "splash-screen") {
                        riverGame.switchScreen("instructions-screen")
                    }
                    break;

                // Return to previous screen on screens where there is a back button 
                case "Escape":
                case "Backspace":
                    if (riverGame.screen === "instructions-screen" || riverGame.screen === "leaderboard-screen") {
                        riverGame.switchScreen(riverGame.lastScreen);
                    }
                    break;
                        
                default:
                    break;
            }
        })
          
        $(window).keyup((e) => {
            let key = e.key;
            switch (key) {
                case "A":
                case "a":
                case "ArrowLeft":
                    riverGame.leftPressed(false);
                    break;
                    
                case "D":
                case "d":
                case "ArrowRight":
                    riverGame.rightPressed(false);
                    break;

                case "X":
                case "x":
                    e.preventDefault();
                    if (riverGame.screen === "game-screen") {
                        riverGame.playSound(riverGame.clickSound);
                        if (riverGame.isRunning) {
                            riverGame.setPaused();
                        } else {
                            riverGame.clearPaused();
                        }
                    } else if (riverGame.screen === "game-over-screen") {
                        riverGame.playSound(riverGame.clickSound);
                        riverGame.reset();
                        riverGame.switchScreen("game-screen");
                    }
                        
                default:
                    break;
            }
        })

        // Reset the game to the initial state
        riverGame.reset()
    }
}

class Entity {
    constructor(left=0,top=0,width=0,height=0,element=null) {
        // Motion trackers - position and speed
        this.left = left;
        this.top = top;
        // Dimensions
        this.width = width;
        this.height = height;
        // DOM Element
        this.element = element;
    }

    // Function to return position in a format that is friendly for JQuery to position elements
    getPosition() {
        return {top: this.top, left:this.left}
    }

    // Functions to get left/top/right/bottom edge position
    getLeft() {
        return this.left;
    }

    getTop() {
        return this.top;
    }

    getRight() {
        return this.left + this.width;
    }

    getBottom() {
        return this.top + this.height;
    }

    // Function to set position by left/top/right/bottom
    setLeft(left) {
        this.left = left;
        this.element.css(this.getPosition());
    }

    setTop(top) {
        this.top = top;
        this.element.css(this.getPosition());
    }

    setRight(right) {
        this.left = right - this.width;
        this.element.css(this.getPosition());
    }

    setBottom(bottom) {
        this.top = bottom - this.height;
        this.element.css(this.getPosition());
    }

    // Function to add position to left/top
    addLeft(increment) {
        this.left += increment;
        this.element.css(this.getPosition());
    }

    addTop(increment) {
        this.top += increment;
        this.element.css(this.getPosition());
    }

    // Function to get the width/height of the entity
    getWidth() {
        return this.width;
    }
    
    getHeight() {
        return this.height;
    }

    // Function to set the width/height of the entity
    setWidth(width) {
        this.width = width;
        this.element.outerWidth(width);
    }
    
    setHeight(height) {
        this.height = height;
        this.element.height(height);
    }

    // Function to check whether this entity overlaps with another entity vertically
    overlapsVertically(anotherEntity, top=this.getTop(), bottom = this.getBottom()) {
        // A: this entity, B: another entity
        if( ( 
            // Case 1: A is partially in B (B contains A's bottom edge)
            bottom >= anotherEntity.getTop() && 
            bottom <= anotherEntity.getBottom()
        ) || ( 
            // Case 2: A is partially in B (B contains A's top edge)
            top >= anotherEntity.getTop() && 
            top <= anotherEntity.getBottom()
        ) || ( 
            // Case 3: B is completely in A (B contains neither of A's edges, but A contains both of B's edges)
            anotherEntity.getTop() >= top && 
            anotherEntity.getBottom() <= bottom
        ) ) {
            return true;
        }
        
        return false;
    }
    
    // Function to check whether this entity is contained within another entity horizontally
    isContainedHorizontally(anotherEntity, left=this.getLeft(), right=this.getRight()) {
        // A: this entity, B: another entity
        // Case 1: B is completely in A
        let case1 = ( 
            anotherEntity.getLeft() < left && 
            anotherEntity.getRight() > right
        );
        
        // Check all cases
        if( case1 ) {
            return true;
        }
        
        return false;
    }
}

class Path extends Entity {
    constructor(left=0,top=0,width=riverGame.initialPathWidth,height=riverGame.initialPathHeight) {
        super(left,top,width,height);
        this.element = riverGame.addPath(this);
    }

    // Function to move the obstacle based on the set scroll speed
    // Vertical scroll down
    move() {
        this.addTop(riverGame.scrollSpeed);
        this.element.css(this.getPosition());
    }

    // Function to check if the path block has scrolled off the bottom of the screen
    isOffScreen() {
        // Handle bottom bounds
        if (this.getTop() >= riverGame.$pathContainer.height()) {
            return true;
        }
        return false;
    }

    // Function to update path motion
    update() {
        this.move();
    }
}

class Player extends Entity {
    constructor(left=0,top=0, name="") {
        super(left,top,riverGame.playerWidth,riverGame.playerHeight);
        
        // Player identifiers
        this.img = riverGame.playerImg;
        this.name = name;

        // Player motion variables
        this.speed = 0;
        this.maxSpeed = riverGame.playerMaxSpeed;
        this.accelerationFactor = riverGame.playerAccelerationFactor;
        this.movingLeft = false;
        this.movingRight = false
        this.rotation = 0;
        
        // Player initial conditions
        this.initialLeft = left;
        this.initialRotation = 0;

        // Smaller individual hitboxes to build up a "circular" composite hitbox
        this.hitboxes = [
            {
                left: 0.4*this.width,
                top: 0,
                width: 0.2*this.width,
                height: 0.1*this.height
            },
            {
                left: 0.2*this.width,
                top: 0.1*this.height,
                width: 0.6*this.width,
                height: 0.1*this.height
            },
            {
                left: 0.1*this.width,
                top: 0.2*this.height,
                width: 0.8*this.width,
                height: 0.2*this.height
            },
            {
                left: 0,
                top: 0.4*this.height,
                width: this.width,
                height: 0.2*this.height
            },
            {
                left: 0.1*this.width,
                top: 0.6*this.height,
                width: 0.8*this.width,
                height: 0.2*this.height
            },
            {
                left: 0.2*this.width,
                top: 0.8*this.height,
                width: 0.6*this.width,
                height: 0.1*this.height
            },
            {
                left: 0.4*this.width,
                top: 0.9*this.height,
                width: 0.2*this.width,
                height: 0.1*this.height
            }
        ]
        
        // Overwrite player element
        this.element = riverGame.addPlayer(this);
    }

    // Function to get the player's name
    getName() {
        return this.name;
    }

    setName(name) {
        this.name = name;
    }

    // Function to get the current horizontal player speed
    getSpeed() {
        return this.speed;
    }

    // Function to set the current player speed
    setSpeed(speed) {
        this.speed = speed;
    }

    // Function to increment the current player speed
    addSpeed(increment) {
        this.speed += increment;
    }

    // Function to get the max speed value
    getMaxSpeed() {
        return this.maxSpeed;
    }

    // Function to check that the player is not exceeding the max speed
    checkMaxSpeed() {
        let speed = this.getSpeed();
        if (Math.abs(speed) >= this.getMaxSpeed()) {
            this.setSpeed(Math.sign(speed) * this.getMaxSpeed())
        }
    }

    // Function to set the movingLeft flag
    setMoveLeft(value = false) {
        this.movingLeft = value;
    }

    // Function to set the movingRight flag
    setMoveRight(value = false) {
        this.movingRight = value;
    }

    // Function to move the player horizontally
    move() {
        // Based on movingLeft/Right flags, determine the direction of the speedIncrement
        // Magnitude of speedIncrement is proportional to scrollSpeed, proportion set by accelerationFactor
        let speedIncrement = (-this.movingLeft + this.movingRight) * riverGame.scrollSpeed * this.accelerationFactor;

        // Update the player speed and check the max speed limit
        this.addSpeed(speedIncrement);
        this.checkMaxSpeed()

        // Move the player position
        this.addLeft(this.getSpeed());
        this.element.css(this.getPosition());
    }

    // Function to check whether the player is out of bounds
    checkBounds() {
        if(this.getLeft() < riverGame.leftBound) {
            this.setLeft(riverGame.leftBound);
        }
        if(this.getRight() > riverGame.rightBound) {
            this.setRight(riverGame.rightBound);
        }
    }

    // Function to get visual rotation of the player
    getRotation() {
        return this.rotation;
    }

    // Function to visually rotate the player
    setRotation(degree) {
        this.rotation = degree;
        this.element.css("transform",`rotate(${degree}deg)`);
    }
    
    // Function to check if the player's individual hitboxes collide with a given path 
    checkHitboxCollisions(path) {
        // Loop through hitboxes and check whether any hitbox is colliding with the path, if so return true, else return false
        for(let i = 0; i < this.hitboxes.length; i++) {
            let hitbox = this.hitboxes[i];
            // Check if the individual hitbox overlaps the path vertically
            // If so, check if the individual hitbox is contained within the path horizontally
            if(this.overlapsVertically(
                path,
                // use the individual hitbox for collision 
                this.getTop() + hitbox.top,
                this.getTop() + hitbox.top + hitbox.height
            )) {
                // Check if the individual hitbox is NOT contained within the horizontal path boundaries
                // If not contained, the player has gone off the path and a collision has occured
                if ( !this.isContainedHorizontally(
                    path,
                    // use the individual hitbox for collision
                    this.getLeft() + hitbox.left,
                    this.getLeft() + hitbox.left + hitbox.width
                ) ) {
                    return true;
                }
            } 
        }
        return false;
    }

    // Function to handle all player updates
    update() {
        this.move();
        let rotationAmount = this.speed/this.maxSpeed*45;
        this.setRotation(rotationAmount);
        this.checkBounds();
    }

    // Function to reset player
    reset() {
        this.setLeft(this.initialLeft);
        this.setSpeed(0);
        this.setRotation(this.initialRotation);
        this.setMoveLeft(false);
        this.setMoveLeft(false);
    }
}

class PlayerTrail extends Entity {
    constructor(left=0,top=0,angle=0,speed=0) {
        super(
            left,
            top,
            Math.random()+riverGame.trailDim,
            Math.random()+riverGame.trailDim);
        this.angle = angle;
        this.speed = speed;
        this.lifespan = riverGame.trailLifeSpan;
        this.element = riverGame.addPlayerTrail(this);
    }

    update() {
        this.addTop(this.speed*Math.cos(this.angle));
        this.addLeft(this.speed*Math.sin(this.angle));
        // Modify Opacity based on Lifespan percent (200% - 0%) 
        // ^Start fading halfway through
        let lifespanPercent = 2*this.lifespan/riverGame.trailLifeSpan;
        this.element.css("opacity",lifespanPercent);
        // Tilt trail element randomly
        let randomTilt = Math.random()*180;
        this.element.css("transform",`rotate(${randomTilt}deg)`);
        this.lifespan--;

        if (this.lifespan <= 0) {
            riverGame.removePlayerTrail(this);
        }
    }
}



// ======================================================
// Run Game
// ======================================================
riverGame.init();