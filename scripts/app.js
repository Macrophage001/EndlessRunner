const root = document.querySelector(':root');
const body = document.querySelector('body');

const game             = document.querySelector('.game');
const player           = document.querySelector('.player');
const playerScoreDiv   = document.querySelector('.score h2');
const playerHeartsDiv  = document.querySelector('.hearts ul');

const colliders = document.getElementsByClassName('collider');
const spawnArea        = document.querySelector('.spawn-area');
const endCard          = document.querySelector('.end-card');

const progressBarThumb = document.querySelector('.progress-bar-thumb');
const progressBarTrail = document.querySelector('.progress-bar-trail');


const interactablePatternTemplates = [
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="heart collider"><h2>&hearts;</h2></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="coin collider"></div>
            <div class="coin-big collider"></div>
            <div class="coin collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="coin collider"></div>
            <div class="coin-big collider"></div>
            <div class="coin collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="coin collider"></div>
            <div class="coin-big collider"></div>
            <div class="coin collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="obstacle-spike-trap collider"></div>
            <div class="obstacle-spike-trap collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
            <div class="coin collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="obstacle-spike-trap collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="obstacle-spike-trap collider"></div>
            <div class="obstacle-spike-trap collider"></div>
            <div class="obstacle-spike-trap collider"></div>
        </div>
    `,
    `
        <div class="interactable-pattern coin-move-animation">
            <div class="obstacle-spike-trap collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="obstacle-spike-trap collider"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="obstacle-spike-trap collider"></div>
        </div>
    `
]

const playerHeartsTemplate = (heartsCount) => {
    let heartElements = '';
    for (let i = 0; i < heartsCount; i++) {
        heartElements += '<li>&hearts;</li>';
    }
    return `${heartElements}`
}
const endCardTemplate = (state, points) => `
    <div class="end-card end-card-animation">
        <h2>
            ${
                state === GameState.WIN
                ? 'You Win!'
                : 'You Lose!'
            }
        </h2>
        <div class="end-score"><div class="coin-icon"></div><h2>${points}</h2></div>
        <div class="controls">
            ${
                state === GameState.WIN
                ? '<button onclick="startNextLevel(this)"><h2>Next Level</h2></button>'
                : '<button onclick="restartGame(this)"><h2>Restart</h2></button>'
            }
        </div>
    </div>
`

const FPS = 60;
const velocityX = 1.5;
const maxDst = 100;
const dstIncrement = 0.02;

const minObstacleSpawnChance = 0.50;
const maxObstacleSpawnChance = 0.80;

var obstacleSpawnChance = minObstacleSpawnChance;

let distanceTravelled = 0;

let currentLevel = 1;
let playerScore  = 0;
let playerHearts = 3;

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;
const clamp = (v, min, max) => v < min ? v = min : v > max ? v = max : v;
const range = (min, max) => Math.random() * (max - min) + min;


// GAME STATES:
class GameState {
    static WIN     = Symbol('WIN');
    static LOSE    = Symbol('LOSE');
    static PLAYING = Symbol('PLAYING');
}

let currentState = GameState.PLAYING;

// I only need the element's x, y, width, and height for my purposes.
const generateRect = (element) => {
    let boundingRect = element.getBoundingClientRect();
    return {
        x: boundingRect.x,
        y: boundingRect.y,
        width: boundingRect.width,
        height: boundingRect.height
    };
};
const support = (function() {
    if (!window.DOMParser) return false;
    var parser = new DOMParser();
    try {
        parser.parseFromString('x', 'text/html');
    } catch (err) {
        console.trace(err);
        return false;
    }
    return true;
})();
const generateHTML = (str) => {
    if (support) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body;
    }
    var dom = document.createElement('div');
    dom.innerHTML = str;
    return dom;
}

var t;
var i;

let mainIntervals = [];
const generateLoopCallback = (callback, interval, arr) => {
    if (arr) {
        arr.push(setInterval(() => {
            callback();
        }, interval));
    } else {
        i = setInterval(() => {
            callback();
        }, interval);
    }
}

const playerLeaveAnimation = () => ([
    { left: `${Math.trunc(100 * (player.getBoundingClientRect().left / window.innerWidth))}vw` },
    { left: `90vw` }
]);
const playerLeaveTiming = {
    duration: 3000,
    iterations: 1,
    fill: 'forwards'
}

class CollisionHandler {
    constructor(element) {
        this.element = element;
    }
}
class PlayerCollisionHandler extends CollisionHandler {
    Handle(collider) {
        interactables.forEach(i => {
            if (i.className === collider.classList[0]) {
                i.OnCollect();
                collider.className = 'empty';
            }
        });
    }
}
class InteractableSystem {
    constructor(className) {
        this.className = className;
    }
    OnCollect() { };
}
class CoinInteractable extends InteractableSystem {
    constructor() {
        super('coin');
    }
    OnCollect() {
        modPlayerScore(100);
    }
}
class BigCoinInteractable extends InteractableSystem {
    constructor() {
        super('coin-big');
    }
    OnCollect() {
        modPlayerScore(200);
    }
}
class SpikeTrapInteractable extends InteractableSystem {
    constructor() {
        super('obstacle-spike-trap');
    }

    OnCollect() {
        modPlayerScore(-75);
        decreasePlayerHearts();
    }
}
class HeartInteractable extends InteractableSystem {
    constructor() {
        super('heart');
    }
    OnCollect() {
        playerHearts = clamp(playerHearts + 1, 0, 3);
    }
}

class CollisionSystem {
    constructor() {
        this.collisionHandlers = [];
        this.colliders = document.getElementsByClassName('collider');
    }

    AddCollisionHandler(collisionHandler) {
        this.collisionHandlers.push(collisionHandler);
    }

    // Source: https://stackoverflow.com/questions/9768291/check-collision-between-certain-divs
    Overlap(colA, colB) {
        const rectA = colA.getBoundingClientRect();
        const rectB = colB.getBoundingClientRect();

        const inHorizontalBounds = rectA.x < rectB.x + rectB.width && rectA.x + rectA.width > rectB.x;
        const inVerticalBounds = rectA.y < rectB.y + rectB.height && rectA.y + rectA.height > rectB.y;

        return inHorizontalBounds && inVerticalBounds;
    }

    HandleCollision() {
        this.collisionHandlers.forEach(handler => {
            for (let i = 0; i < this.colliders.length; i++) {
                let collider = this.colliders[i];
                if (this.Overlap(handler.element, collider)) {
                    handler.Handle(collider);
                }
            }
        });
    }
}

let inputIntervals = {};
class InputSystem {
    constructor() {
        this.keyHandlers = {};
    }

    AddKeyHandler(key, onKeyDown, onKeyUp) {
        if (this.keyHandlers[key] !== undefined) {
            this.keyHandlers[key].push(onKeyDown);
            this.keyHandlers[key].keyDown.push(onKeyDown);
            this.keyHandlers[key].keyUp.push(onKeyUp);
        } else {
            this.keyHandlers[key] = { keyDown: [onKeyDown], keyUp: [onKeyUp] };
        }
    }

    HandleKeys() {
        document.onkeydown = (e) => {
            e.preventDefault();
            if (inputIntervals[e.key] === undefined) {
                inputIntervals[e.key] = setInterval(() => {
                    this.keyHandlers[e.key].keyDown.forEach(cb => cb());
                });
            }
        }

        document.onkeyup = (e) => {
            e.preventDefault();
            if (inputIntervals[e.key] !== undefined) {
                for (const prop in inputIntervals) {
                    if (prop === e.key) {
                        clearInterval(inputIntervals[prop]);
                        inputIntervals[e.key] = undefined;
                        this.keyHandlers[e.key].keyUp.forEach(cb => { if (typeof cb === 'function') cb() });
                    }
                }
            }
        }
    }
    DisableKeys() {
        document.onkeydown = null;
        document.onkeyup   = null;
    }
}
class AnimationEventSystem {
    constructor() {
        this.animationEventHandlers = [];
    }

    AddAnimationEventHandler(element, animationName, eventType, callBack) {
        this.animationEventHandlers.push({ element, animationName, eventType, callBack });
    }

    HandleAnimationEvents() {
        for (let i = 0; i < this.animationEventHandlers.length; i++) {
            let evHandler = this.animationEventHandlers[i];
            document.addEventListener(evHandler.eventType, () => {
                if (evHandler.element.classList.contains(evHandler.animationName)) {
                    evHandler.callBack()
                }
            });
        }
    }
}
let dstTravelledTimeouts = [];
class DistanceSystem {
    constructor(maxDst, dstIncrement, scrollingBGDiv) {
        this.maxDst = maxDst;
        this.defaultDstIncrement = this.dstIncrement = dstIncrement;
        this.distanceTraveled = 0;
        this.percentageTraveled = 0;
        this.scrollingBGDiv = scrollingBGDiv;
        this.dstTraveledTimeouts = [];
        this.dstReached = false;
    }
    Pause() {
        this.dstIncrement = 0;
        this.SetSpeed(0);
        this.dstTraveledTimeouts.forEach(t => clearTimeout(t));
    }
    Start() {
        this.dstIncrement = this.defaultDstIncrement;
        this.SetSpeed(5500);
        this.UpdateDistanceTraveled();
    }
    Restart() {
        this.dstIncrement = this.defaultDstIncrement;
        this.percentageTraveled = 0;
        this.distanceTraveled = 0;
        this.SetSpeed(5500);
        this.UpdateDistanceTraveled();
    }

    SetSpeed(ms) {
        root.style.setProperty('--run-speed', `${ms}ms`);
    }

    UpdateDistanceTraveled() {
        generateLoopCallback(() => {
            this.distanceTraveled += this.dstIncrement;
            this.percentageTraveled = (this.distanceTraveled / this.maxDst);
            if (this.percentageTraveled < 1) {
                let thumbPositionX = lerp(-1, 23, this.percentageTraveled);
                progressBarThumb.style.left = `${thumbPositionX}vw`;
                progressBarTrail.style.width = `${this.percentageTraveled * 100}%`;
            }
            else {
                this.Pause();
            }
        }, 10, this.dstTraveledTimeouts);
    }
}

let interactables = [];
const initInteractables = () => {
    interactables.push(new CoinInteractable());
    interactables.push(new BigCoinInteractable());
    interactables.push(new SpikeTrapInteractable());
    interactables.push(new HeartInteractable());
}
const initCollisionHandlers = () => collisionSystem.AddCollisionHandler(new PlayerCollisionHandler(player));
const initAnimEvents = () => {
    animEventSystem.AddAnimationEventHandler(player, 'player-jump-animation', 'animationend', () => {
        player.classList.remove('player-jump-animation');
        player.classList.toggle('player-jumping');
        player.classList.toggle('player-running');
    });
    animEventSystem.HandleAnimationEvents();
}
const initInputs = () => {
    // ' ' = Spacebar 
    inputSystem.AddKeyHandler(' ', () => {
        if (!player.classList.contains('player-jump-animation')) {
            player.classList.add('player-jump-animation');
            player.classList.toggle('player-running');
            player.classList.toggle('player-jumping');
        }
    });
    inputSystem.AddKeyHandler('ArrowRight', () => {
        let right     = player.getBoundingClientRect().right;
        let left      = player.getBoundingClientRect().left;
        let gameRight = game.getBoundingClientRect().right;

        if (right < gameRight - 5)
            player.style.left = `${left + velocityX}px`;
    });
    inputSystem.AddKeyHandler('ArrowLeft', () => {
        let left = player.getBoundingClientRect().left;
        let gameLeft = game.getBoundingClientRect().left;

        if (left > gameLeft + 5) {
            player.style.left = `${left - velocityX}px`;
        }
    });
    inputSystem.AddKeyHandler('h', () => {
        playerHearts += 1;
    });

}

const setPlayerScore = (score) => {
    playerScore = clamp(score, 0, 9999);
    playerScoreDiv.innerHTML = playerScore;
}
const modPlayerScore = (score) => {
    playerScore = clamp(playerScore + score, 0, 9999);
    playerScoreDiv.innerHTML = playerScore;
}

const checkPlayerWon = () => {
    if (distanceSystem.percentageTraveled >= 1 && playerHearts > 0) {
        currentState = GameState.WIN;
    }
}
const checkPlayerLost = () => {
    if (distanceSystem.percentageTraveled < 1 && playerHearts === 0) {
        currentState = GameState.LOSE;
    }
}

const startNextLevel = (element) => {
    resetPlayer();

    distanceSystem.Restart();

    let endCard = element.parentNode.parentNode;
    endCard.remove();

    let activeColliders = document.querySelectorAll('.collider');
    for (let i = 0; i < activeColliders.length; i++) {
        if (activeColliders[i].classList.contains('player'))
            continue;
        activeColliders[i].remove();
    }

    generateLoopCallback(() => {
        update();
    }, FPS / 1000);

    currentState = GameState.PLAYING;
}

const resetPlayerProperties = () => {
    player.classList.remove('player-won');
    player.classList.remove('player-lost'); // In case I add a player-lost css property.
    player.classList.remove('player-jumping');
    player.classList.remove('player-jumping-animation');

    if (!player.classList.contains('player-running')) player.classList.add('player-running');
}
const resetPlayer = () => {
    resetPlayerProperties();

    playerHearts = 3;
    setPlayerScore(0);
    player.style.left = '13vw';
}
const restartGame = (element) => {
    resetPlayer();

    distanceSystem.Restart();

    let endCard = element.parentNode.parentNode;
    endCard.remove();

    let activeColliders = document.querySelectorAll('.collider');
    for (let i = 0; i < activeColliders.length; i++) {
        if (activeColliders[i].classList.contains('player'))
            continue;
        activeColliders[i].remove();
    }

    generateLoopCallback(() => {
        update();
    }, FPS / 1000);

    currentState = GameState.PLAYING;
}

const decreasePlayerHearts = () => {
    playerHearts = clamp(playerHearts - 1, 0, 3);
}

const onPlayerWon = () => {
    if (currentState === GameState.WIN) {
        inputSystem.DisableKeys();
        distanceSystem.Pause();
        
        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');
        player.classList.add('player-won');

        clearInterval(i);

        game.append(generateHTML(endCardTemplate(GameState.WIN, playerScore)));
    }
}
const onPlayerLost = () => {
    if (currentState === GameState.LOSE) {
        // TODO: Player lose state. Show the lost screen and ask the player if they'd like to restart.
        inputSystem.DisableKeys();
        distanceSystem.Pause();
        modPlayerScore(0);

        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');
        player.classList.add('player-won');

        clearInterval(i);

        game.append(generateHTML(endCardTemplate(GameState.LOSE, playerScore)));
    }
}

const collisionSystem = new CollisionSystem();
const animEventSystem = new AnimationEventSystem();
const inputSystem     = new InputSystem();
const distanceSystem  = new DistanceSystem(maxDst, dstIncrement);

const updatePlayerHeartsDisplay = () => {
    let heartsDisplayedCount = playerHeartsDiv.querySelectorAll('li').length;
    if (heartsDisplayedCount !== playerHearts) {
        playerHeartsDiv.innerHTML = playerHeartsTemplate(playerHearts);
    }
}

let spawningTicks = 0;
const update = () => {
    switch (currentState) {
        case GameState.WIN:
            clearInterval(i);
            mainIntervals.forEach(i => clearInterval(i));
            onPlayerWon();
            break;
        case GameState.LOSE:
            clearInterval(i);
            mainIntervals.forEach(i => clearInterval(i));
            onPlayerLost();
            break;
        case GameState.PLAYING:
            inputSystem.HandleKeys();
                
            collisionSystem.HandleCollision();
            updatePlayerHeartsDisplay();

            checkPlayerWon();
            checkPlayerLost();
            break;
        default:
            console.error('Invalid State!', currentState);
            break;
    }
}

const init = () => {
    initInteractables();
    initCollisionHandlers();
    initAnimEvents();
    initInputs();

    generateLoopCallback(() => {
        update();
    }, FPS / 1000, mainIntervals);
    generateLoopCallback(() => {
        if (currentState === GameState.PLAYING) {
            let spawnChance = Math.random();
            if (spawnChance <= obstacleSpawnChance) {
                let randomIndex = Math.floor(Math.random() * interactablePatternTemplates.length);
                let interactable = generateHTML(interactablePatternTemplates[randomIndex]);

                game.append(interactable);
            }
        }
    }, 2000, mainIntervals);
    generateLoopCallback(() => {
        obstacleSpawnChance = clamp(obstacleSpawnChance + 0.01, minObstacleSpawnChance, maxObstacleSpawnChance);
    }, 2000, mainIntervals);
    distanceSystem.Start();
}

window.onload = () => {
    init();
}

