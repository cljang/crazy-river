"use strict";

// Change the name of the game object at some point
const game = {
    
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
    $menuBtn: $(".menu-btn"),
    $leftBtn: $(".left-btn"),
    $rightBtn: $(".right-btn"),

    // Screens
    $screens: $(".screen-container"),
    $splashScreen: $("#splash-screen"),
    $gameScreen: $("#game-screen"),
    $gameOverScreen: $("#game-over-screen"),

    // Game Elements
    $nameBox: $("#name"), 
    $pathContainer: $("#path-container"),
    $playerTrailContainer: $("#player-trail-container"),
    $distanceValue: $(".distance .distance-value"),
    $bestDistanceValue: $(".best-distance .distance-value"),
    $finalScoreValue: $(".final-score-value"),
    $leaderboardList: $(".leaderboard-list"),

    // Modals
    $gameInstructions: $("#game-instructions"),
    $setupInstructions: $("#setup-instructions"),

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
    extraPaths: 5,
    // Path Adjustment
    pathWidthAdjustment: 0,
    pathLeftAdjustment: 0,
    pathAdjustmentPathCounter: 0,
    pathAdjustmentPeriod: 10,  // Paths per adjustment cycle

    // Player 
    // Player object
    player: null,
    // Player Image
    playerImg: "./images/donut.gif",
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
        game.isRunning = false;
        game.$gameScreen.addClass("paused")
        game.stopUpdate();

        game.pauseSound(game.bgMusic);
    },

    // Function to unpause the game
    clearPaused: () => {
        game.isRunning = true;
        game.$gameScreen.removeClass("paused")
        game.runUpdate();
        
        // Play background music at 20% volume
        game.playSound(game.bgMusic, game.bgmVolume);
    },

    // Function to handle game over
    gameOver: () => {
        game.setPaused();
        game.switchScreen("game-over-screen");
        game.$finalScoreValue.text(game.distanceScrolledMeters);
        game.updateLeaderboard();
        game.pauseSound(game.bgMusic);
    },
    
    // Function to reset the game
    reset: () => {
        // Set game paused
        game.setPaused();

        // Destroy existing paths
        game.destroyPaths();

        // Create new paths
        game.initializePaths();

        // Reset Path variables
        game.pathWidth = game.initialPathWidth;
        game.pathWidthAdjustment = 0;
        game.pathLeftAdjustment = 0;
        game.pathAdjustmentPathCounter = 0;

        // Reset speed
        game.scrollSpeed = game.initialScrollSpeed;
        game.speedAdjustmentPeriod = game.initialSpeedAdjustmentPeriod;

        // Reset distance
        game.distanceScrolled = 0;
        game.updateDistance(true); 

        // Reset player
        game.player.reset();

        // Destroy any player trails
        game.destroyPlayerTrails();

        // Reset BG Music speed
        game.resetSoundSpeed(game.bgMusic);
    },
    
    // ======================================================
    // Screen Functions
    // ======================================================
    // Function to switch between game screens
    switchScreen: (screen) => {
        // Verify that user input is valid
        if (game.gameScreens.includes(screen)) {
            // Hide all screens
            game.$screens.hide();

            // Record Original Screen
            game.lastScreen = game.screen;
    
            // Change screen
            game.screen = screen;
            
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
        game.stopUpdate();
        // Start a new update interval
        game.intervalID = setInterval(game.updateLoop, game.updateInterval);
    },

    // Function to cancel the update loop
    stopUpdate: () => {
        clearInterval(game.intervalID);
    },

    // Update Loop logic
    updateLoop: () => {
        // Update Player
        game.player.update();
        game.updatePlayerTrails();

        // Update path blocks and background
        game.updatePaths();
        game.scrollBackground();

        // Update Score (distance value)
        game.updateDistance();

        // Update speed
        game.updateSpeed()
    },

    // ======================================================
    // Path Functions
    // ======================================================
    // Function to populate the initial paths
    initializePaths: () => {
        // Reset pathPosition to the center of the screen
        game.pathPosition = (game.screenWidth - game.initialPathWidth)/2;

        // Generate enough paths to cover the screen plus some extra paths for padding
        let numPaths = Math.ceil(game.$gameScreen.height()/game.initialPathHeight) + 1 + game.extraPaths;

        // Automatically populate paths in a cone shape to start
        for(let i = 0; i < numPaths; i++) {
            new Path(
                game.pathPosition - i*game.tileSize,
                game.initialPathHeight*(i - game.extraPaths),
                game.initialPathWidth + i*game.tileSize*2,
                game.initialPathHeight
            )
        }
    },

    // Function to remove all paths
    destroyPaths: () => {
        // Destroy all paths
        game.paths.forEach(path => {
            path.element.remove();
        })
        game.paths.length = 0;
    },

    // Function to add a path element to the DOM based on a given path object and also add the path object to the paths array
    addPath: (pathObj) => {
        const $path = $("<div></div>").addClass("path");
        $path.css(pathObj.getPosition());
        $path.outerWidth(pathObj.width);
        $path.height(pathObj.height);
        game.paths.push(pathObj);
        game.$pathContainer.append($path);
        return $path;
    },

    // Function to remove a path element from the DOM and also remove it from the paths array
    removePath: (pathObj) => {
        pathObj.element.remove();

        // Find obstacle in obstacle array and remove it
        let index = game.paths.indexOf(pathObj);
        game.paths.splice(index,1);
    },

    // Update each path object
    updatePaths: () => {
        if (game.isRunning) {
            // Loop through array backwards to mitigate the problem where
            for (let i = game.paths.length - 1; i >= 0; i--) {
                let path = game.paths[i];
                path.update();
    
                // Check if any part of the entire player overlaps with the current path, if so, check the individual hitboxes, if there is a hitbox collision, the game is over
                if(game.player.overlapsVertically(path)) {
                    if (game.player.checkHitboxCollisions(path) ) {
                        game.playSound(game.smackSound, game.smackVolume);
                        game.gameOver();
                        break
                    };
                }
    
                if (path.isOffScreen()) {
                    game.generateDirectedPath(path);
                }
            }
        }
    },

    generateDirectedPath(path) {
        // Move path to top of the screen - minus some offset for extra path elements
        path.addTop(-(game.$pathContainer.height() + (game.pathHeight * (game.extraPaths + 1))));

        // Remove speed-up class if it exists
        path.element.removeClass("speed-up");

        // Indicate at what point a speed up will happen
        // Height of paths in pixels since "0m" point = game.pathAdjustmentPathCounter*game.pathHeight 
        // Pixels to speedAdjustmentPeriod from "0m" point = game.speedAdjustmentPeriod*game.pixelsPerMeter
        if ( game.pathAdjustmentPathCounter*game.pathHeight === game.speedAdjustmentPeriod*game.pixelsPerMeter ) {
            path.element.addClass("speed-up");
        }

        // Update Width
        game.pathWidth += (game.pathWidthAdjustment * game.tileSize);
        
        // Check width bounds - if a bound is hit, set width to the bound and stop adjusting width until next adjustment cycle
        if (game.pathWidth < game.minPathWidth) {
            game.pathWidth = game.minPathWidth;
            game.pathWidthAdjustment = 0;
        }
        if (game.pathWidth > game.maxPathWidth) {
            game.pathWidth = game.maxPathWidth;
            game.pathWidthAdjustment = 0;
        }

        path.setWidth(game.pathWidth);

        // Update path position
        game.pathPosition += (game.pathLeftAdjustment * game.tileSize);
        
        // Subtract half of the width offset to keep width growth "centered"
        game.pathPosition -= (game.pathWidthAdjustment * game.tileSize)/2;

        // Check position bounds
        if (game.pathPosition <= game.leftBound) {
            game.pathPosition = game.leftBound;
        }
        if (game.pathPosition >= game.rightBound - game.pathWidth) {
            game.pathPosition = game.rightBound - game.pathWidth;
        }
        
        path.setLeft(game.pathPosition);

        game.pathAdjustmentPathCounter++;

        // Handle path adjustment cycle - after counter passes the set period, get a new path adjustment direction
        if (game.pathAdjustmentPathCounter % game.pathAdjustmentPeriod == 0) {
            game.changePathDirections();
        }
    },

    changePathDirections() {
        // Set new adjustment factors for width and left position of paths
        // -1, 0, 1 => Shrink by 1 tile, stay same, grow by 1 tile
        let newWidthAdjustment = Math.floor(Math.random() * 3) - 1;
        // -1, 0, 1 => Move left, stay same, move right
        let newLeftAdjustment = Math.floor(Math.random() * 3) - 1;

        // Don't allow consecutive straight path cycles
        if ( game.pathLeftAdjustment == 0 && newLeftAdjustment == 0 ) {
            let plusOrMinus = Math.random() < 0.5 ? -1 : 1;
            game.pathLeftAdjustment += plusOrMinus;
        }

        // If the width adjustment is trying to grow while at the max width, or shrink while at the min width, reverse the width adjustment
        if ( 
            (game.pathWidth == game.maxPathWidth && newWidthAdjustment == 1) || 
            ( game.pathWidth == game.minPathWidth && newWidthAdjustment == -1) ) {
            newWidthAdjustment *= -1;
        }

        // Update adjustment factors
        game.pathWidthAdjustment = newWidthAdjustment;
        game.pathLeftAdjustment = newLeftAdjustment;
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
        game.$gameScreen.append($player);
        return $player;
    },

    // Function to handle when left inputs are pressed or released
    leftPressed: (pressed = false) => {
        game.player.setMoveLeft(pressed);

        if ( pressed ) {
            game.$leftBtn.addClass("pressed");
        } else {
            game.$leftBtn.removeClass("pressed");
        }
    },
    
    // Function to handle when right inputs are pressed or released
    rightPressed: (pressed = false) => {
        game.player.setMoveRight(pressed);

        if ( pressed ) {
            game.$rightBtn.addClass("pressed");
        } else {
            game.$rightBtn.removeClass("pressed");
        }
    },

    // ======================================================
    // Player Trail Functions
    // ======================================================

    addPlayerTrail: (playerTrailObj) => {
        const $playerTrail = $("<div></div>").addClass("player-trail");
        $playerTrail.css(playerTrailObj.getPosition());
        $playerTrail.outerWidth(playerTrailObj.getWidth());
        $playerTrail.outerHeight(playerTrailObj.getHeight());
        game.playerTrails.push(playerTrailObj);
        game.$playerTrailContainer.append($playerTrail);
        return $playerTrail;
    },
    
    removePlayerTrail: (playerTrailObj) => {
        playerTrailObj.element.remove();

        // Find playerTrail in playerTrails array and remove it
        let index = game.playerTrails.indexOf(playerTrailObj);
        game.playerTrails.splice(index,1);
    },

    destroyPlayerTrails: () => {
        // Destroy all paths
        game.playerTrails.forEach(playerTrail => {
            playerTrail.element.remove();
        })
        game.playerTrails.length = 0;
    },

    generateRandomPlayerTrail: () => {
        let playerAngle = game.player.getRotation();
        let angleOffset = Math.random()*game.trailAngleLimit - game.trailAngleLimit/2;
        let trailAngleDeg = playerAngle + angleOffset;
        // Convert angle from degree to rad
        let trailAngle = trailAngleDeg/180*Math.PI;

        new PlayerTrail(
            game.player.getLeft() + (game.player.getWidth() - game.trailDim)/2,
            game.player.getTop() + (game.player.getHeight() - game.trailDim)/2,
            trailAngle,
            game.scrollSpeed/2);
    },

    updatePlayerTrails: () => {
        // Spawn a trail every other update
        if (game.trailSpawnCounter >= game.trailSpawnInterval) {
            game.generateRandomPlayerTrail();
            game.trailSpawnCounter = 0;
        }
        game.trailSpawnCounter++;
        // Update each trail
        game.playerTrails.forEach((trail) => {
            trail.update();
        })
    },

    // ======================================================
    // Scrolling Functions
    // ======================================================
    // Move the background positions to match the scrolling of the path blocks
    scrollBackground: () => {
        if (game.isRunning) {
            // Scroll the background for all paths
            $(".path").css("background-position-y",game.backgroundScroll)
            
            // Scroll the background for all paths
            game.$gameScreen.css("background-position-y",game.backgroundScroll)
    
            game.backgroundScroll+=game.scrollSpeed;
    
            if (game.backgroundScroll >= game.screenHeight) {
                game.backgroundScroll -= game.screenHeight;
            }
        }
    },

    updateDistance: (displayZero=false) => {
        if (game.isRunning) {
            // Update the distanceScrolled variable and display that
            // If displayZero is optionally set to true, then just show a zero
            if (!displayZero) {
                game.distanceScrolled += game.scrollSpeed;
                // Update Distance value display in UI
                // Compensate for player distance offset to top of screen, and offset of extra paths to top of screen
                let distanceScrolledPixels = game.distanceScrolled - game.initialDistanceOffset - (game.initialPathHeight*game.extraPaths);
                // Convert distance to "Meters" and round to nearest tenth of a meter
                game.distanceScrolledMeters = Math.round(distanceScrolledPixels/game.pixelsPerMeter);
                game.$distanceValue.text(game.distanceScrolledMeters);
    
                // Check if current distance is greater than the best distance
                if (game.distanceScrolledMeters >= game.bestDistance) {
                    game.bestDistance = game.distanceScrolledMeters;
                    game.$bestDistanceValue.text(game.bestDistance);
    
                }
            } else {
                game.$distanceValue.text("0");
            }
        }

    },

    // Function to update the speed of the game
    // Update the speed when the required distance has been passed
    updateSpeed: () => {
        if (game.distanceScrolledMeters >= game.speedAdjustmentPeriod) {
            // For the first speed adjustment period, increase adjustment distance by 100m, after that increase by 200m
            if (game.speedAdjustmentPeriod == game.initialSpeedAdjustmentPeriod) {
                game.speedAdjustmentPeriod += 100;
            } else {
                game.speedAdjustmentPeriod += 200;
            }
            // Increment scroll speed by 1
            game.scrollSpeed++;

            // Increase background music playback
            game.bgMusic.playbackRate += game.bgmSpeedIncrement;

            // Play Speed Up sound
            game.playSound(game.speedUpSound,game.speedUpVolume);
            
            // Display a Speed Up Message for 1s (1000ms)
            game.$gameScreen.addClass("speed-up-msg");
            setTimeout(()=>{
                game.$gameScreen.removeClass("speed-up-msg");
            },1000)
        }
    },

    // ======================================================
    // Leaderboard Functions
    // ======================================================
    updateLeaderboard: () => {
        // Check if player's current score exceeds any of the existing leaderboard scores, if so, splice the player's score into the leaderboard and break out of the loop
        for (let i = 0; i < game.leaderboard.length; i++) {
            if (game.distanceScrolledMeters > game.leaderboard[i].score) {
                game.leaderboard.splice(i,0,{
                    name: game.player.getName(),
                    score: game.distanceScrolledMeters
                })
                break;
            }
        }

        // Limit leaderboard to top 5
        game.leaderboard = game.leaderboard.slice(0,5);

        // Empty DOM leaderboard
        game.$leaderboardList.empty();

        // Redraw DOM Leaderboard
        game.leaderboard.forEach((player,index) => {
            let $newRow = $(
                `<tr>
                    <td>${index+1}.</td>
                    <td>${player.name}</td>
                    <td>${player.score}m</td>
                </tr>`);
            
            // If the leaderboard name matches the current player name, then identify those players with the player-score class
            if (player.name == game.player.name) {
                $newRow.addClass("player-score")
            }
            game.$leaderboardList.append($newRow);
        })
    },

    // ======================================================
    // Sound Functions
    // ======================================================
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

    pauseSound: (sound) => {
        sound.pause();
    },

    resetSoundSpeed: (sound) => {
        sound.playbackRate = 1;
    },

    // ======================================================
    // Initialization Functions
    // ======================================================
    init: () => {
        // Update screen dimensions
        game.screenWidth = game.$gameArea.width();
        game.screenHeight = game.$gameArea.height();

        // Update left and right bound based on gameArea
        game.leftBound = game.boundMargin;
        game.rightBound = game.screenWidth - game.boundMargin;

        // Set initial path width to halfway between the min and max path width
        game.initialPathWidth = (game.minPathWidth + game.maxPathWidth)/2;

        // Create Player
        // Center player horizontally
        game.initialPlayerLeft = game.screenWidth/2 - game.playerWidth/2;
        game.player = new Player(game.initialPlayerLeft, game.initialPlayerTop, "NAME")

        // Update initial distance offset to player position (top)
        game.initialDistanceOffset = game.initialPlayerTop;

        // Make music looping
        game.bgMusic.addEventListener('ended', function() {
            game.playSound(game.bgMusic);
        }, false);
        
        // Add click sound to all buttons
        game.$btns.click((e) => {
            game.playSound(game.clickSound, game.clickVolume);
        })

        // Start Button
        game.$startBtn.click((e) => {
            e.preventDefault();
            
            game.reset();
            game.switchScreen("setup-screen");
        })

        // Instructions Button
        game.$instructionsBtn.click((e) => {
            e.preventDefault();
            
            game.switchScreen("instructions-screen");
        })
        
        // Controls Button
        game.$controlsBtn.click((e) => {
            e.preventDefault();
            
            game.switchScreen("controls-screen");
        })

        // Back Button
        game.$backBtn.click((e) => {
            e.preventDefault();
            
            game.switchScreen(game.lastScreen);
        })
        
        // Play Button
        game.$playBtn.click((e) => {
            e.preventDefault();
            // If the player entered a name, use it
            if (game.$nameBox.val() != "") {
                game.player.setName(game.$nameBox.val());
            }
            
            game.switchScreen("game-screen");
        })

        // Play Again Buttons 
        game.$playAgainBtn.click((e) => {
            e.preventDefault();

            game.reset();
            game.switchScreen("game-screen");
        })

        // Leaderboard Button
        game.$leaderboardBtn.click((e) => {
            e.preventDefault();
            
            game.switchScreen("leaderboard-screen");
        })

        // Quit Buttons 
        game.$quitBtn.click((e) => {
            e.preventDefault();

            game.switchScreen("splash-screen");
        })

        // Menu Button
        game.$homeBtn.click((e) => {
            e.preventDefault();

            game.setPaused();
            game.switchScreen("splash-screen")
        })

        // Left Button
        game.$leftBtn.mousedown((e) => {
            e.preventDefault();

            game.leftPressed(true);
        })
        
        game.$leftBtn.mouseup((e) => {
            e.preventDefault();

            game.leftPressed(false);
        })

        // Right Button
        game.$rightBtn.mousedown((e) => {
            e.preventDefault();

            game.rightPressed(true);
        })
        
        game.$rightBtn.mouseup((e) => {
            e.preventDefault();

            game.rightPressed(false);
        })

        // Player Keyboard Controls
        $(window).keydown((e) => {
            let key = e.key;
            switch (key) {
                case "A":
                case "a":
                case "ArrowLeft":
                    game.leftPressed(true);
                    break;
                    
                case "D":
                case "d":
                case "ArrowRight":
                    game.rightPressed(true);
                    break;
                
                // Open instructions screen on splash page 
                case "I":
                case "i":
                    if (game.screen === "splash-screen") {
                        game.switchScreen("instructions-screen")
                    }
                    break;

                // Return to previous screen on screens where there is a back button 
                case "Escape":
                case "Backspace":
                    if (game.screen === "instructions-screen" || game.screen === "leaderboard-screen") {
                        game.switchScreen(game.lastScreen);
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
                    game.leftPressed(false);
                    break;
                    
                case "D":
                case "d":
                case "ArrowRight":
                    game.rightPressed(false);
                    break;

                case "X":
                case "x":
                    e.preventDefault();
                    if (game.screen === "game-screen") {
                        game.playSound(game.clickSound);
                        if (game.isRunning) {
                            game.setPaused();
                        } else {
                            game.clearPaused();
                        }
                    } else if (game.screen === "game-over-screen") {
                        game.playSound(game.clickSound);
                        game.reset();
                        game.switchScreen("game-screen");
                    }
                        
                default:
                    break;
            }
        })

        // Reset the game to the initial state
        game.reset()
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
    constructor(left=0,top=0,width=game.initialPathWidth,height=game.initialPathHeight) {
        super(left,top,width,height);
        this.element = game.addPath(this);
    }

    // Function to move the obstacle based on the set scroll speed
    // Vertical scroll down
    move() {
        this.addTop(game.scrollSpeed);
        this.element.css(this.getPosition());
    }

    // Function to check if the path block has scrolled off the bottom of the screen
    isOffScreen() {
        // Handle bottom bounds
        if (this.getTop() >= game.$pathContainer.height()) {
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
        super(left,top,game.playerWidth,game.playerHeight);
        
        // Player identifiers
        this.img = game.playerImg;
        this.name = name;

        // Player motion variables
        this.speed = 0;
        this.maxSpeed = game.playerMaxSpeed;
        this.accelerationFactor = game.playerAccelerationFactor;
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
        this.element = game.addPlayer(this);
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
        let speedIncrement = (-this.movingLeft + this.movingRight) * game.scrollSpeed * this.accelerationFactor;

        // Update the player speed and check the max speed limit
        this.addSpeed(speedIncrement);
        this.checkMaxSpeed()

        // Move the player position
        this.addLeft(this.getSpeed());
        this.element.css(this.getPosition());
    }

    // Function to check whether the player is out of bounds
    checkBounds() {
        if(this.getLeft() < game.leftBound) {
            this.setLeft(game.leftBound);
        }
        if(this.getRight() > game.rightBound) {
            this.setRight(game.rightBound);
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
            Math.random()+game.trailDim,
            Math.random()+game.trailDim);
        this.angle = angle;
        this.speed = speed;
        this.lifespan = game.trailLifeSpan;
        this.element = game.addPlayerTrail(this);
    }

    update() {
        this.addTop(this.speed*Math.cos(this.angle));
        this.addLeft(this.speed*Math.sin(this.angle));
        // Modify Opacity based on Lifespan percent (200% - 0%) 
        // ^Start fading halfway through
        let lifespanPercent = 2*this.lifespan/game.trailLifeSpan;
        this.element.css("opacity",lifespanPercent);
        // Tilt trail element randomly
        let randomTilt = Math.random()*180;
        this.element.css("transform",`rotate(${randomTilt}deg)`);
        this.lifespan--;

        if (this.lifespan <= 0) {
            game.removePlayerTrail(this);
        }
    }
}



// ======================================================
// Run Game
// ======================================================
game.init();