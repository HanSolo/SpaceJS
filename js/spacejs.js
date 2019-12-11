/*
 * Copyright (c) 2019 by Gerrit Grunwald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const WIDTH                   = 700;
const HEIGHT                  = 700;
const NO_OF_STARS             = 200;
const NO_OF_ASTEROIDS         = 15;
const NO_OF_ENEMIES           = 5;
const TORPEDO_SPEED           = 6;
const ENEMY_TORPEDO_SPEED     = 5;
const ENEMY_FIRE_SENSITIVITY  = 10;
const SCORE_COLOR             = 'rgb(51, 210, 206)';
const SCORE_FONT              = '30px Spaceboy';
const SCORE_FONT_60           = '60px Spaceboy';
const SHIELD_INDICATOR_X      = WIDTH * 0.73;
const SHIELD_INDICATOR_Y      = HEIGHT * 0.06;
const SHIELD_INDICATOR_WIDTH  = WIDTH * 0.26;
const SHIELD_INDICATOR_HEIGHT = HEIGHT * 0.01428571;
const LIFES                   = 5;
const SHIELDS                 = 10;
const DEFLECTOR_SHIELD_TIME   = 5000;

const startscreenImg          = new Image();
startscreenImg.src            = 'img/startscreen.png';

const gameoverImg             = new Image();
gameoverImg.src               = 'img/gameover.png';

const asteroidImages          = [
    'img/asteroid1.png',
    'img/asteroid2.png',
    'img/asteroid3.png',
    'img/asteroid4.png',
    'img/asteroid5.png',
    'img/asteroid6.png',
    'img/asteroid7.png',
    'img/asteroid8.png',
    'img/asteroid9.png',
    'img/asteroid10.png',
    'img/asteroid11.png'
];

const enemyImages             = [
    'img/enemy1.png',
    'img/enemy2.png',
    'img/enemy3.png'
];

const spaceshipImg            = new Image();
spaceshipImg.src              = 'img/fighter.png';

const spaceshipThrustImg      = new Image();
spaceshipThrustImg.src        = 'img/fighterThrust.png';

const miniSpaceshipImg        = new Image();
miniSpaceshipImg.src          = 'img/minifighter.png';

const miniDeflectorShieldImg  = new Image();
miniDeflectorShieldImg.src    = 'img/minideflectorshield.png';

const torpedoImg              = new Image();
torpedoImg.src                = 'img/torpedo.png';

const enemyTorpedoImg         = new Image();
enemyTorpedoImg.src           = 'img/enemyTorpedo.png';

const explosionImg            = new Image();
explosionImg.src              = 'img/explosion.png';

const spaceShipExplosionImg   = new Image();
spaceShipExplosionImg.src     = 'img/spaceshipexplosion.png';

const soundTheme             = new Audio("snd/CityStomper.mp3"); // soundTheme.pause(); soundTheme.currentTime = 0;
soundTheme.addEventListener('ended', function() {
   this.currentTime = 0;
   this.play();
});
const gameSoundTheme         = new Audio("snd/RaceToMars.mp3");
gameSoundTheme.addEventListener('ended', function() {
   this.currentTime = 0;
   this.play();
});

var   lastFrameTime          = 0;
var   running                = false;
var   gameOverScreen         = false;
var   score                  = 0;
var   scorePosX              = WIDTH * 0.5;
var   scorePosY              = 30;
var   hasBeenHit             = false;
var   noOfLifes              = LIFES;
var   noOfShields            = SHIELDS;
var   lastShieldActivated    = new Date();

var   gameLoopRequestId;

let   canvas                 = document.getElementById("canvas");
let   ctx                    = canvas.getContext('2d');
ctx.textAlign                = 'center';
ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.drawImage(startscreenImg, 0, 0);

// Helper methods
function startGame() {
    gameLoopRequestId = window.requestAnimationFrame(gameLoop);
}
function stopGame() {
    if (gameLoopRequestId) {
        setTimeout(function() {
            window.cancelAnimationFrame(gameLoopRequestId);
            gameLoopRequestId = undefined;
        });
    }
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
function isHitCircleCircle(c1X, c1Y, c1R, c2X, c2Y, c2R) {
    let distX    = c1X - c2X;
    let distY    = c1Y - c2Y;
    let distance = Math.sqrt((distX * distX) + (distY * distY));
    return (distance <= c1R + c2R);
}



// Background Image
var   backgroundViewportY = 2079;
let   backgroundImg       = new Image();
backgroundImg.src         = 'img/background.jpg';

// Deflectorshield Image
var deflectorShieldImg    = new Image();
deflectorShieldImg.src    = 'img/deflectorshield.png';
let deflectorShieldRadius = 50;

// Stars
let   stars               = [];
class Star {
    constructor() {
        this.xVariation = 0;
        this.minSpeedY  = 4;
        // Random size
        this.size = 1;
        // Position
        this.x    = (0.5 + (Math.random() * WIDTH)) << 0;
        this.y    = (0.5 + (-this.size)) << 0;
        // Random speed
        this.vYVariation = Math.random() * 0.5 + 0.2;
        // Velocity
        this.vX = (0.5 + ((Math.random() * this.xVariation) - this.xVariation * 0.5)) << 0;
        this.vY = (0.5 + (((Math.random() * 1.5) + this.minSpeedY) * this.vYVariation)) << 0;
    }

    respawn() {
        this.x = (0.5 + (Math.random() * WIDTH)) << 0;
        this.y = -this.size;
    }

    update() {
        this.x = this.x + (0.5 + this.vX) << 0;
        this.y = this.y + (0.5 + this.vY) << 0;

        // Respawn star
        if(this.y > HEIGHT + this.size) {
            this.respawn();
        }
    }
}
initStars();

// Asteroids
let asteroids             = [];
class Asteroid {
    constructor(image) {
        // Image
        this.image = image;

        this.init();
    }

    init() {
        const MAX_VALUE      = 10;
        const X_VARIATION    = 2;
        const MIN_SPEED_Y    = 2;
        const MIN_ROTATION_R = 0.00174533;

        // Position
        this.x   = Math.random() * WIDTH;
        this.y   = -this.image.height;
        this.rot = 0;

        // Random Size
        this.scale = (Math.random() * 0.6) + 0.2;

        // No of hits (0.2 - 0.8)
        this.hits  = (0.5 + (this.scale * 5.0)) << 0;

        // Value
        this.value = (0.5 + (1 / this.scale * MAX_VALUE)) << 0;

        // Random Speed
        this.vYVariation = (Math.random() * 0.5) + 0.2;

        this.width       = this.image.width * this.scale;
        this.height      = this.image.height * this.scale;
        this.size        = this.width > this.height ? this.width : this.height;
        this.radius      = this.size * 0.5;
        this.imgCenterX  = this.image.width / 2;
        this.imgCenterY  = this.image.height / 2;

        // Velocity
        this.vX          = ((Math.random() * X_VARIATION) - X_VARIATION * 0.5);
        this.vY          = (((Math.random() * 1.5) + MIN_SPEED_Y * 1 / this.scale) * this.vYVariation);
        this.vR          = ((Math.random() * 0.00872665) + MIN_ROTATION_R);
        this.rotateRight = Math.random() >= 0.5;
    }

    respawn() {
        this.image.src = asteroidImages[getRandomInt(0, asteroidImages.length)];
        this.init();
    }

    update() {
        this.x = this.x + this.vX;
        this.y = this.y + this.vY;

        this.cX = this.x + this.imgCenterX;
        this.cY = this.y + this.imgCenterY;

        if (this.rotateRight) {
            this.rot += this.vR;
            if (this.rot > 2 * Math.PI) {
                this.rot = 0;
            }
        } else {
            this.rot -= this.vR;
            if (this.rot < 0) {
                this.rot = 2 * Math.PI;
            }
        }

        // Respawn asteroid
        if(this.x < -this.size || this.x - this.radius > WIDTH || this.y - this.height > HEIGHT) {
            this.respawn();
        }
    }
}
initAsteroids();

// Spaceship
class SpaceShip {
    constructor(image, imageThrust) {
        this.image       = image;
        this.imageThrust = imageThrust;
        this.x           = WIDTH * 0.5;
        this.y           = HEIGHT - 2 * image.height;
        this.width       = image.width;
        this.height      = image.height;
        this.size        = this.width > this.height ? this.width : this.height;
        this.radius      = this.size * 0.5;
        this.vX          = 0;
        this.vY          = 0;
        this.shield      = false;
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;
        if (this.x + this.width * 0.5 > WIDTH) {
            this.x = WIDTH - this.width * 0.5;
        }
        if (this.x - this.width * 0.5 < 0) {
            this.x = this.width * 0.5;
        }
        if (this.y + this.height * 0.5 > HEIGHT) {
            this.y = HEIGHT - this.height * 0.5;
        }
        if (this.y - this.height * 0.5 < 0) {
            this.y = this.height * 0.5;
        }
    }
}
let spaceShip             = new SpaceShip(spaceshipImg, spaceshipThrustImg);

// Enemies
let enemies               = [];
class Enemy {
    static MAX_VALUE    = 49;
    static X_VARIATION  = 1;
    static MIN_SPEED_Y  = 3;

    constructor(image) {
        // Image
        this.image = image;
        this.init();
    }

    init() {
        // Position
        this.x = Math.random() * WIDTH;
        this.y = -this.image.height;

        // Value
        this.value = getRandomInt(0, Enemy.MAX_VALUE) + 1;

        // Random Speed
        this.vYVariation = (Math.random() * 0.5) + 0.2;

        this.width  = this.image.width;
        this.height = this.image.height;
        this.size   = this.width > this.height ? this.width : this.height;
        this.radius = this.size * 0.5;

        // Velocity
        this.vX = ((Math.random() * Enemy.X_VARIATION) - Enemy.X_VARIATION * 0.5);
        this.vY = (((Math.random() * 1.5) + Enemy.MIN_SPEED_Y) * this.vYVariation);

        // Rotation
        this.rot = Math.atan2(this.vY, this.vX) - Math.PI / 2;

        // Related to laser fire
        this.lastShotY = 0;
    }

    respawn() {
        this.image.src = enemyImages[getRandomInt(0, enemyImages.length)];
        this.init();
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;

        // Respawn Enemy
        if (this.x < -this.size || this.x > WIDTH + this.size || this.y > HEIGHT + this.size) {
            this.respawn();
        }
    }
}
initEnemies();

// Torpedos
let torpedos              = [];
let torpedosToRemove      = [];
class Torpedo {
    constructor(image, x, y) {
        this.image  = image;
        this.x      = x;
        this.y      = y - this.image.height;
        this.width  = this.image.width;
        this.height = this.image.height;
        this.size   = this.width > this.height ? this.width : this.height;
        this.radius = this.size * 0.5;
        this.vX     = 0;
        this.vY     = TORPEDO_SPEED;
    }

    update() {
        this.y -= this.vY;
        if (this.y < -this.size) {
            torpedosToRemove.push(this);
        }
    }
}

// EnemyTorpedos
let enemyTorpedos         = [];
let enemyTorpedosToRemove = [];
class EnemyTorpedo {
    constructor(image, x, y, vX, vY) {
        this.image  = image;
        this.x      = x - this.image.width / 2.0;
        this.y      = y;
        this.width  = this.image.width;
        this.height = this.image.height;
        this.size   = this.width > this.height ? this.width : this.height;
        this.radius = this.size * 0.5;
        this.vX     = vX;
        this.vY     = vY;
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;

        if (!hasBeenHit) {
            var hit;
            if (spaceShip.shield) {
                this.hit = isHitCircleCircle(this.x, this.y, this.radius, spaceShip.x, spaceShip.y, deflectorShieldRadius);
            } else {
                this.hit = isHitCircleCircle(this.x, this.y, this.radius, spaceShip.x, spaceShip.y, spaceShip.radius);
            }
            if (this.hit) {
                enemyTorpedosToRemove.push(this);
                if (spaceShip.shield) {
                    new Audio("snd/shieldhit.wav").play();
                } else {
                    hasBeenHit = true;
                    new Audio("snd/spaceShipExplosionSound.wav").play();
                    noOfLifes--;
                    if (0 === noOfLifes) {
                        gameOver();
                    }
                }
            }
        } else if (this.y > HEIGHT) {
            if (this.y < -this.size) {
                enemyTorpedosToRemove.push(this);
            }
        }
    }
}

// Explosion
let explosions            = [];
let explosionsToRemove    = [];
class Explosion {
    static FRAME_WIDTH  = 192;
    static FRAME_HEIGHT = 192;
    static FRAME_CENTER = 96;
    static MAX_FRAME_X  = 5;
    static MAX_FRAME_Y  = 4;

    constructor(x, y, vX, vY, scale) {
        this.x      = x;
        this.y      = y;
        this.vX     = vX;
        this.vY     = vY;
        this.scale  = scale;
        this.countX = 0;
        this.countY = 0;
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;

        this.countX++;
        if (this.countX === Explosion.MAX_FRAME_X) {
            this.countY++;
            if (this.countX === Explosion.MAX_FRAME_X && this.countY === Explosion.MAX_FRAME_Y) {
                explosionsToRemove.push(this);
            }
            this.countX = 0;
            if (this.countY === Explosion.MAX_FRAME_Y) {
                this.countY = 0;
            }
        }
    }
}

// SpaceExplosion
class SpaceShipExplosion {
    static FRAME_WIDTH  = 100;
    static FRAME_HEIGHT = 100;
    static FRAME_CENTER = 50;
    static MAX_FRAME_X  = 8;
    static MAX_FRAME_Y  = 6;

    constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.countX = 0;
        this.countY = 0;
    }

    update() {
        this.countX++;
        if (this.countX === SpaceShipExplosion.MAX_FRAME_X) {
            this.countX = 0;
            this.countY++;
            if (this.countY === SpaceShipExplosion.MAX_FRAME_Y) {
                this.countY = 0;
            }
            if (this.countX === 0 && this.countY === 0) {
                hasBeenHit  = false;
                spaceShip.x = WIDTH * 0.5;
                spaceShip.y = HEIGHT - 2 * spaceShip.height;
            }
        }
    }
}
var spaceShipExplosion   = new SpaceShipExplosion(0, 0);

// Hit
let hitImg               = new Image();
hitImg.src               = 'img/torpedoHit2.png';
let hits                 = [];
let hitsToRemove         = [];
class Hit {
    static FRAME_WIDTH  = 80;
    static FRAME_HEIGHT = 80;
    static FRAME_CENTER = 40;
    static MAX_FRAME_X  = 5;
    static MAX_FRAME_Y  = 2;

    constructor(x, y, vX, vY) {
        this.x      = x;
        this.y      = y;
        this.vX     = vX;
        this.vY     = vY;
        this.countX = 0;
        this.countY = 0;
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;

        this.countX++;
        if (this.countX == Hit.MAX_FRAME_X) {
            this.countY++;
            if (this.countX == Hit.MAX_FRAME_X && this.countY == Hit.MAX_FRAME_Y) {
                hitsToRemove.push(this);
            }
            this.countX = 0;
            if (this.countY == Hit.MAX_FRAME_Y) {
                this.countY = 0;
            }
        }
    }
}


// Initializations
function initStars() {
    for (let i = 0 ; i < NO_OF_STARS ; i++) {
        let star = new Star();
        star.y = Math.random() * HEIGHT;
        stars[i] = star;
    }
}

function initAsteroids() {
    for (let i = 0 ; i < NO_OF_ASTEROIDS ; i++) {
        let img = new Image();
        img.src = asteroidImages[getRandomInt(0, asteroidImages.length)];
        asteroids[i] = new Asteroid(img);
    }
}

function initEnemies() {
    for (let i = 0 ; i < NO_OF_ENEMIES ; i ++) {
        let img = new Image();
        img.src = enemyImages[getRandomInt(0, enemyImages.length)];
        enemies[i] = new Enemy(img);
    }
}


// Spawn different objects
function spawnTorpedo(x, y) {
    torpedos.push(new Torpedo(torpedoImg, x, y));
    new Audio('snd/laserSound.wav').play();
}

function spawnEnemyTorpedo(x, y, vX, vY) {
    let vFactor = ENEMY_TORPEDO_SPEED / vY; // make sure the speed is always the defined one
    enemyTorpedos.push(new EnemyTorpedo(enemyTorpedoImg, x, y, vFactor * vX, vFactor * vY));
    new Audio('snd/enemyLaserSound.wav').play();
}


// Game Over
function gameOver() {
    stopGame();
    running        = false;
    gameOverScreen = true;

    gameSoundTheme.pause();
    gameSoundTheme.currentTime = 0;

    setTimeout(function() {
        // GameOver Screen
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(gameoverImg, 0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = SCORE_COLOR;
        ctx.font      = SCORE_FONT_60;
        ctx.fillText((score << 0), scorePosX, HEIGHT * 0.25);
        new Audio('snd/gameover.wav').play();

        setTimeout(function() {
            // StartScreen
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            ctx.drawImage(startscreenImg, 0, 0);

            gameOverScreen = false;
            explosions     = [];
            torpedos       = [];
            enemyTorpedos  = [];
            for (let i = 0 ; i < stars.length ; i++) { stars[i].respawn(); }
            for (let i = 0 ; i < asteroids.length ; i++) { asteroids[i].respawn(); }
            for (let i = 0 ; i < enemies.length ; i++) { enemies[i].respawn(); }
            spaceShip.x  = WIDTH * 0.5;
            spaceShip.y  = HEIGHT - 2 * spaceShip.image.height;
            spaceShip.vX = 0;
            spaceShip.vY = 0;
            hasBeenHit   = false;
            noOfLifes    = LIFES;
            noOfShields  = SHIELDS;
            score        = 0;
            soundTheme.play();
        }, 5000);
    }, 1000);
}


// Game loop
function gameLoop(time) {
    lastFrameTime = time;
    updateAndDraw(ctx);
    gameLoopRequestId = window.requestAnimationFrame(gameLoop);
}

// Combined update and draw method
function updateAndDraw(ctx) {
    torpedosToRemove      = [];
    enemyTorpedosToRemove = [];
    explosionsToRemove    = [];
    hitsToRemove          = [];

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw background
    backgroundViewportY -= 0.5;
    if (backgroundViewportY <= 0) {
        backgroundViewportY = 2079; //backgroundImg.getHeight() - HEIGHT;
    }
    ctx.drawImage(backgroundImg, 0, backgroundViewportY, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);

    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < NO_OF_STARS; i++) {
        var star = stars[i];
        star.update(i);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    // Draw asteroids
    for (let i = 0 ; i < NO_OF_ASTEROIDS ; i++) {
        let asteroid = asteroids[i];
        asteroid.update();

        ctx.save();
        ctx.translate(asteroid.cX, asteroid.cY);
        ctx.rotate(asteroid.rot);
        ctx.scale(asteroid.scale, asteroid.scale);
        ctx.translate(-asteroid.imgCenterX, -asteroid.imgCenterY);
        ctx.drawImage(asteroid.image, 0, 0);
        ctx.restore();

        // Check for torpedo hits
        for (let j = 0 ; j < torpedos.length ; j++) {
            let torpedo = torpedos[j];
            if (isHitCircleCircle(torpedo.x, torpedo.y, torpedo.radius, asteroid.cX, asteroid.cY, asteroid.radius)) {
                asteroid.hits--;
                if (asteroid.hits <= 0) {
                    explosions.push(new Explosion(asteroid.cX - Explosion.FRAME_CENTER * asteroid.scale, asteroid.cY - Explosion.FRAME_CENTER * asteroid.scale, asteroid.vX, asteroid.vY, asteroid.scale));
                    score += asteroid.value;
                    asteroids[i].respawn();
                    torpedosToRemove.push(torpedo);
                    new Audio('snd/explosionSound.wav').play();
                } else {
                    hits.push(new Hit(torpedo.x - Hit.FRAME_CENTER, torpedo.y - Hit.FRAME_HEIGHT, asteroid.vX, asteroid.vY));
                    torpedosToRemove.push(torpedo);
                    new Audio('snd/hit.wav').play();
                }
            }
        }

        // Check for space ship hit
        if (!hasBeenHit) {
            let hit;
            if (spaceShip.shield) {
                hit = isHitCircleCircle(spaceShip.x, spaceShip.y, deflectorShieldRadius, asteroid.cX, asteroid.cY, asteroid.radius);
            } else {
                hit = isHitCircleCircle(spaceShip.x, spaceShip.y, spaceShip.radius, asteroid.cX, asteroid.cY, asteroid.radius);
            }
            if (hit) {
                spaceShipExplosion.countX = 0;
                spaceShipExplosion.countY = 0;
                spaceShipExplosion.x      = spaceShip.x - SpaceShipExplosion.FRAME_WIDTH;
                spaceShipExplosion.y      = spaceShip.y - SpaceShipExplosion.FRAME_HEIGHT;
                asteroids[i].respawn();
                if (spaceShip.shield) {
                    new Audio('snd/explosionSound.wav').play();
                    explosions.push(
                        new Explosion(asteroid.cX - Explosion.FRAME_CENTER * asteroid.scale, asteroid.cY - Explosion.FRAME_CENTER * asteroid.scale, asteroid.vX,
                            asteroid.vY, asteroid.scale));
                } else {
                    new Audio('snd/spaceShipExplosionSound.wav').play();
                    hasBeenHit = true;
                    noOfLifes--;
                    if (0 === noOfLifes) {
                        gameOver();
                    }
                }
            }
        }
    }

    // Draw Enemies
    for (let i = 0 ; i < NO_OF_ENEMIES ; i++) {
        let enemy = enemies[i];
        enemy.update();
        ctx.save();
        ctx.translate(enemy.x - enemy.radius, enemy.y - enemy.radius);
        ctx.save();
        ctx.translate(enemy.radius, enemy.radius);
        ctx.rotate(enemy.rot);
        ctx.translate(-enemy.radius, -enemy.radius);
        ctx.drawImage(enemy.image, 0, 0);
        ctx.restore();
        ctx.restore();

        // Fire if spaceship is below enemy
        if (enemy.x > spaceShip.x - ENEMY_FIRE_SENSITIVITY && enemy.x < spaceShip.x + ENEMY_FIRE_SENSITIVITY) {
            if (enemy.y - enemy.lastShotY > 15) {
                spawnEnemyTorpedo(enemy.x, enemy.y, enemy.vX, enemy.vY);
                enemy.lastShotY = enemy.y;
            }
        }

        // Check for torpedo hits
        for (let j = 0 ; j < torpedos.length ; j++) {
            let torpedo = torpedos[j];
            if (isHitCircleCircle(torpedo.x, torpedo.y, torpedo.radius, enemy.x, enemy.y, enemy.radius)) {
                explosions.push(new Explosion(enemy.x - Explosion.FRAME_WIDTH * 0.25, enemy.y - Explosion.FRAME_HEIGHT * 0.25, enemy.vX, enemy.vY, 0.5));
                score += enemy.value;
                enemies[i].respawn();
                torpedosToRemove.push(torpedo);
                new Audio('snd/spaceShipExplosionSound.wav').play();
            }
        }

        // Check for space ship hit
        if (!hasBeenHit) {
            let hit;
            if (spaceShip.shield) {
                hit = isHitCircleCircle(spaceShip.x, spaceShip.y, deflectorShieldRadius, enemy.x, enemy.y, enemy.radius);
            } else {
                hit = isHitCircleCircle(spaceShip.x, spaceShip.y, spaceShip.radius, enemy.x, enemy.y, enemy.radius);
            }
            if (hit) {
                spaceShipExplosion.countX = 0;
                spaceShipExplosion.countY = 0;
                spaceShipExplosion.x      = spaceShip.x - SpaceShipExplosion.FRAME_WIDTH;
                spaceShipExplosion.y      = spaceShip.y - SpaceShipExplosion.FRAME_HEIGHT;
                enemies[i].respawn();
                new Audio('snd/spaceShipExplosionSound.wav').play();
                if (spaceShip.shield) {
                    explosions.push(new Explosion(enemy.x - Explosion.FRAME_WIDTH * 0.125, enemy.y - Explosion.FRAME_HEIGHT * 0.125, enemy.vX, enemy.vY, 0.5));
                } else {
                    hasBeenHit = true;
                    noOfLifes--;
                    if (0 === noOfLifes) {
                        gameOver();
                    }
                }
            }
        }
    }

    // Draw Torpedos
    for (let i = 0 ; i < torpedos.length ; i++) {
        let torpedo = torpedos[i];
        torpedo.update();
        ctx.drawImage(torpedo.image, torpedo.x - torpedo.radius, torpedo.y - torpedo.radius);
    }
    for (let k = 0 ; k < torpedosToRemove.length ; k++) {
        let torpedo = torpedosToRemove[k];
        let idx = torpedos.indexOf(torpedo);
        if (idx > -1) {
            torpedos.splice(idx, 1);
        }
    }

    // Draw EnemyTorpedos
    for (let i = 0 ; i < enemyTorpedos.length ; i++) {
        let enemyTorpedo = enemyTorpedos[i];
        enemyTorpedo.update();
        ctx.drawImage(enemyTorpedo.image, enemyTorpedo.x, enemyTorpedo.y);
    }
    for (let k = 0 ; k < enemyTorpedosToRemove.length ; k++) {
        let enemyTorpedo = enemyTorpedosToRemove[k];
        let idx = enemyTorpedos.indexOf(enemyTorpedo);
        if (idx > -1) {
            enemyTorpedos.splice(idx, 1);
        }
    }

    // Draw Explosions
    for (let i = 0 ; i < explosions.length ; i++) {
        let explosion = explosions[i];
        explosion.update();
        ctx.drawImage(explosionImg, explosion.countX * Explosion.FRAME_WIDTH, explosion.countY * Explosion.FRAME_HEIGHT, Explosion.FRAME_WIDTH, Explosion.FRAME_HEIGHT, explosion.x, explosion.y, Explosion.FRAME_WIDTH * explosion.scale, Explosion.FRAME_HEIGHT * explosion.scale);
    }
    for (let k = 0 ; k < explosionsToRemove.length ; k++) {
        let explosion = explosionsToRemove[k];
        let idx = explosions.indexOf(explosion);
        if (idx > -1) {
            explosions.splice(idx, 1);
        }
    }

    // Draw Hits
    for (let i = 0 ; i < hits.length ; i++) {
        let hit = hits[i];
        hit.update();
        ctx.drawImage(hitImg, hit.countX * Hit.FRAME_WIDTH, hit.countY * Hit.FRAME_HEIGHT, Hit.FRAME_WIDTH, Hit.FRAME_HEIGHT, hit.x, hit.y, Hit.FRAME_WIDTH, Hit.FRAME_HEIGHT);
    }
    for (let k = 0 ; k < hitsToRemove.length ; k++) {
        let hit = hitsToRemove[k];
        let idx = hits.indexOf(hit);
        if (idx > -1) {
            hits.splice(idx, 1);
        }
    }

    // Draw Spaceship, score, lifes and shields
    if (noOfLifes > 0) {
        // Draw Spaceship or it's explosion
        if (hasBeenHit) {
            spaceShipExplosion.update();
            ctx.drawImage(spaceShipExplosionImg, spaceShipExplosion.countX * SpaceShipExplosion.FRAME_WIDTH, spaceShipExplosion.countY * SpaceShipExplosion.FRAME_HEIGHT,
                SpaceShipExplosion.FRAME_WIDTH, SpaceShipExplosion.FRAME_HEIGHT, spaceShip.x - SpaceShipExplosion.FRAME_CENTER, spaceShip.y - SpaceShipExplosion.FRAME_CENTER,
                SpaceShipExplosion.FRAME_WIDTH, SpaceShipExplosion.FRAME_HEIGHT);
        } else {
            // Draw space ship
            spaceShip.update();
            ctx.drawImage((0 == spaceShip.vX && 0 == spaceShip.vY) ? spaceShip.image : spaceShip.imageThrust, spaceShip.x - spaceShip.radius, spaceShip.y - spaceShip.radius);
            if (spaceShip.shield) {
                var delta = new Date().getTime() - lastShieldActivated.getTime();
                if (delta > DEFLECTOR_SHIELD_TIME) {
                    spaceShip.shield = false;
                    noOfShields--;
                } else {
                    ctx.strokeStyle = SCORE_COLOR;
                    ctx.fillStyle   = SCORE_COLOR;

                    ctx.strokeRect(SHIELD_INDICATOR_X, SHIELD_INDICATOR_Y, SHIELD_INDICATOR_WIDTH, SHIELD_INDICATOR_HEIGHT);
                    ctx.fillRect(SHIELD_INDICATOR_X, SHIELD_INDICATOR_Y, SHIELD_INDICATOR_WIDTH - SHIELD_INDICATOR_WIDTH * delta / DEFLECTOR_SHIELD_TIME, SHIELD_INDICATOR_HEIGHT);
                    ctx.globalAlpha = Math.random() * 0.5 + 0.1;
                    ctx.drawImage(deflectorShieldImg, spaceShip.x - deflectorShieldRadius, spaceShip.y - deflectorShieldRadius);
                    ctx.globalAlpha = 1;
                }
            }
        }

        // Draw score
        ctx.fillStyle = SCORE_COLOR;
        ctx.font      = SCORE_FONT;
        ctx.fillText((score << 0), scorePosX, scorePosY);

        // Draw lifes
        for (let i = 0 ; i < noOfLifes ; i++) {
            ctx.drawImage(miniSpaceshipImg, i * miniSpaceshipImg.width + 10, 20);
        }

        // Draw shields
        for (let i = 0 ; i < noOfShields ; i++) {
            ctx.drawImage(miniDeflectorShieldImg, WIDTH - i * (miniDeflectorShieldImg.width + 5), 20);
        }
    }
}


// Key listener
function keyPressed(e) {
    if (running) {
        switch(e.code) {
            case 'KeyT':
                spaceShip.vY = -5;
                break;
            case 'KeyV':
                spaceShip.vY = 5;
                break;
            case 'KeyG':
                spaceShip.vX = 5;
                break;
            case 'KeyF':
                spaceShip.vX = -5;
                break;
            case 'KeyS':
                if (noOfShields > 0 && !spaceShip.shield) {
                    lastShieldActivated = new Date();
                    spaceShip.shield    = true;
                    new Audio('snd/deflectorshieldSound.wav').play();
                }
                break;
            case 'Space':
                spawnTorpedo(spaceShip.x, spaceShip.y);
                break;
        }
    } else if (e.code === 'KeyP' && !gameOverScreen) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(backgroundImg, 0, 0);

        soundTheme.pause();
        soundTheme.currentTime = 0;

        gameSoundTheme.play();
        running = true;
        startGame();
    }
}
function keyReleased(e) {
    if (running) {
        switch (e.code) {
            case 'KeyT' : spaceShip.vY = 0; break;
            case 'KeyV' : spaceShip.vY = 0; break;
            case 'KeyG' : spaceShip.vX = 0; break;
            case 'KeyF' : spaceShip.vX = 0; break;
        }
    }
}

window.addEventListener( "keypress", keyPressed, false );
window.addEventListener("keyup", keyReleased, false);