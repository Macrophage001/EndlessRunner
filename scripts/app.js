import { CollisionSystem } from "./collisionSystem.js";
import { DistanceSystem } from "./distanceSystem.js";
import { clamp, generateLoopCallback, generateHTML } from "./utils.js";

const root             = document.querySelector(':root');

const game             = document.querySelector('.game');
const player           = document.querySelector('.player');
const playerScoreDiv   = document.querySelector('.score h2');
const playerHeartsDiv  = document.querySelector('.hearts ul');

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
            <div class="empty"></div>
            <div class="empty"></div>
            <div class="obstacle-spike-trap collider"></div>
        </div>
    `
]

let mainIntervals = [];

const playerHeartsTemplate = (heartsCount) => {
    let heartElements = '';
    for (let i = 0; i < heartsCount; i++) {
        heartElements += '<li>&hearts;</li>';
    }
    return `${heartElements}`
}
const endCardTemplate = (state, points) => {
    let endCardDiv = generateHTML(`
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
                    ? generateHTML('<button id="next-level-btn"><h2>Next Level</h2></button>').outerHTML
                    : generateHTML('<button id="restart-btn"><h2>Restart</h2></button>').outerHTML
                }
            </div>
        </div>
    `);

    let nextLevelBtn = endCardDiv.querySelector('#next-level-btn');
    if (nextLevelBtn !== null) {
        nextLevelBtn.addEventListener('click', () => startNextLevel(nextLevelBtn));
        console.log(nextLevelBtn);
    }

    let restartBtn = endCardDiv.querySelector('#restart-btn');
    if (restartBtn !== null) {
        restartBtn.addEventListener('click', () => restartGame(restartBtn));
        console.log(restartBtn);
    }

    return endCardDiv;
}

const FPS = 60;
const velocityX = 1.5;
const maxDst = 100;
const dstIncrement = 0.02;

let minObstacleSpawnChance = 0.50;
let maxObstacleSpawnChance = 0.80;

let obstacleSpawnChance = minObstacleSpawnChance;

let currentLevel = 1;
let playerScore  = 0;
let playerHearts = 3;

const levelMaps = {
    1:  {maxDst: 100, minObstacleSpawnChance: 0.5,  maxObstacleSpawnChance: 0.8 },
    2:  {maxDst: 125, minObstacleSpawnChance: 0.55, maxObstacleSpawnChance: 0.8 },
    3:  {maxDst: 150, minObstacleSpawnChance: 0.6,  maxObstacleSpawnChance: 0.8 },
    4:  {maxDst: 175, minObstacleSpawnChance: 0.65, maxObstacleSpawnChance: 0.8 },
    5:  {maxDst: 200, minObstacleSpawnChance: 0.7,  maxObstacleSpawnChance: 0.8 },
    6:  {maxDst: 225, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    7:  {maxDst: 250, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    8:  {maxDst: 275, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    9:  {maxDst: 300, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    10: {maxDst: 325, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 }
}

// GAME STATES:
class GameState {
    static WIN     = Symbol('WIN');
    static LOSE    = Symbol('LOSE');
    static PLAYING = Symbol('PLAYING');
}

let currentState = GameState.PLAYING;

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
        player.classList.remove('player-jumping');
        player.classList.add('player-running');
    });
    animEventSystem.HandleAnimationEvents();
}
const initInputs = () => {
    // ' ' = Spacebar 
    inputSystem.AddKeyHandler(' ', () => {
        if (!player.classList.contains('player-jump-animation')) {
            player.classList.add('player-jump-animation');
            player.classList.add('player-jumping');
            player.classList.remove('player-running');
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
const initLoops = () => {
    generateLoopCallback(() => {
        update();
    }, 1000 / FPS, mainIntervals);
    generateLoopCallback(() => {
        if (currentState === GameState.PLAYING) {
            let spawnChance = Math.random();
            if (spawnChance <= obstacleSpawnChance) {
                let randomIndex = Math.floor(Math.random() * interactablePatternTemplates.length);
                let interactable = generateHTML(interactablePatternTemplates[randomIndex]);

                generatedInteractables.push(interactable);

                game.append(interactable);
            }
        }
    }, 2000, mainIntervals);
    generateLoopCallback(() => {
        obstacleSpawnChance = clamp(obstacleSpawnChance + 0.01, minObstacleSpawnChance, maxObstacleSpawnChance);
    }, 2000, mainIntervals);
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
    currentLevel++;

    minObstacleSpawnChance = levelMaps[currentLevel].minObstacleSpawnChance;
    maxObstacleSpawnChance = levelMaps[currentLevel].maxObstacleSpawnChance;

    resetPlayer();
    resetGeneratedInteractables();

    distanceSystem.Restart(levelMaps[currentLevel]);

    let endCard = element.parentNode.parentNode;
    endCard.remove();

    let activeColliders = document.querySelectorAll('.collider');
    for (let i = 0; i < activeColliders.length; i++) {
        if (activeColliders[i].classList.contains('player'))
            continue;
        activeColliders[i].remove();
    }

    initLoops();

    currentState = GameState.PLAYING;
}
window.startNextLevel = startNextLevel;

const resetGeneratedInteractables = () => {
    generatedInteractables.forEach(i => i.remove());
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
    resetGeneratedInteractables();

    distanceSystem.Restart(levelMaps[currentLevel]);

    let endCard = element.parentNode.parentNode;
    endCard.remove();

    let activeColliders = document.querySelectorAll('.collider');
    for (let i = 0; i < activeColliders.length; i++) {
        if (activeColliders[i].classList.contains('player'))
            continue;
        activeColliders[i].remove();
    }

    initLoops();

    currentState = GameState.PLAYING;
}
window.restartGame = restartGame;

const decreasePlayerHearts = () => {
    playerHearts = clamp(playerHearts - 1, 0, 3);
}

const onPlayerWon = () => {
    if (currentState === GameState.WIN) {
        inputSystem.DisableKeys();
        distanceSystem.Pause(root);
        
        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');
        player.classList.add('player-won');

        // clearInterval(i);
        mainIntervals.forEach(i => clearInterval(i));

        game.append(endCardTemplate(GameState.WIN, playerScore));
    }
}
const onPlayerLost = () => {
    if (currentState === GameState.LOSE) {
        // TODO: Player lose state. Show the lost screen and ask the player if they'd like to restart.
        inputSystem.DisableKeys();
        distanceSystem.Pause(root);
        modPlayerScore(0);

        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');

        player.classList.add('player-won');

        // clearInterval(i);
        mainIntervals.forEach(i => clearInterval(i));

        game.append(endCardTemplate(GameState.LOSE, playerScore));
    }
}

const updatePlayerHeartsDisplay = () => {
    let heartsDisplayedCount = playerHeartsDiv.querySelectorAll('li').length;
    if (heartsDisplayedCount !== playerHearts) {
        playerHeartsDiv.innerHTML = playerHeartsTemplate(playerHearts);
    }
}

const collisionSystem = new CollisionSystem();
const animEventSystem = new AnimationEventSystem();
const inputSystem     = new InputSystem();
const distanceSystem  = new DistanceSystem(maxDst, dstIncrement, root, progressBarThumb, progressBarTrail);

let spawningTicks = 0;
const update = () => {
    switch (currentState) {
        case GameState.WIN:
            // clearInterval(i);
            mainIntervals.forEach(i => clearInterval(i));
            onPlayerWon();
            break;
        case GameState.LOSE:
            // clearInterval(i);
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

let generatedInteractables = [];
const init = () => {
    initInteractables();
    initCollisionHandlers();
    initAnimEvents();
    initInputs();
    initLoops();

    distanceSystem.Start(levelMaps[currentLevel]);
}

window.onload = () => {
    init();
}

