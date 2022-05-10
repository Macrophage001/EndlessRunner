import CollisionSystem from "./collisionSystem.js";
import DistanceSystem from "./distanceSystem.js";
import InputSystem from "./inputSystem.js";
import AnimationEventSystem from "./animationEventSystem.js";

import { MathEX, Generators } from "./utils.js";

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

// GAME STATES:
class GameState {
    static WIN     = 'WIN';
    static LOSE    = 'LOSE';
    static PLAYING = 'PLAYING';
}

let currentState = GameState.PLAYING;

let mainIntervals = [];

const playerHeartsGenerator = (heartsCount) => {
    let heartElements = '';
    for (let i = 0; i < heartsCount; i++) {
        heartElements += '<li>&hearts;</li>';
    }
    return heartElements;
}
const endMenuGenerator = (state) => {
    let endCardDiv = Generators.generateHTML(`
        <div class="end-card end-card-animation">
            <h2>
                ${
                    state === GameState.WIN
                    ? 'You Win!'
                    : 'You Lose!'
                }
            </h2>
            <div class="end-score"><div class="coin-icon"></div><h2>${playerScore}</h2></div>
            <div class="controls">
                ${
                    state === GameState.WIN
                    ? Generators.generateHTML('<button id="next-level-btn"><h2>Next Level</h2></button>').outerHTML
                    : Generators.generateHTML('<button id="restart-btn"><h2>Restart</h2></button>').outerHTML
                }
            </div>
        </div>
    `);

    let nextLevelBtn = endCardDiv.querySelector('#next-level-btn');
    if (nextLevelBtn !== null) {
        nextLevelBtn.addEventListener('click', startNextLevel);
    }

    let restartBtn = endCardDiv.querySelector('#restart-btn');
    if (restartBtn !== null) {
        restartBtn.addEventListener('click', restartGame);
    }

    return endCardDiv;
}

const FPS = 60;
const velocityX = 1.5;

const dstIncrement = 0.02;

const collisionSystem = new CollisionSystem();
const animEventSystem = new AnimationEventSystem();
const inputSystem     = new InputSystem();
const distanceSystem  = new DistanceSystem(dstIncrement, root, progressBarThumb, progressBarTrail);

let minObstacleSpawnChance = 0.50;
let maxObstacleSpawnChance = 0.80;

let obstacleSpawnChance = minObstacleSpawnChance;

let currentLevel = 0;
let playerScore  = 0;
let playerHearts = 3;

const levelMaps = [
    {maxDst: 50,  minObstacleSpawnChance: 0.5,  maxObstacleSpawnChance: 0.8 },
    {maxDst: 75,  minObstacleSpawnChance: 0.55, maxObstacleSpawnChance: 0.8 },
    {maxDst: 100, minObstacleSpawnChance: 0.6,  maxObstacleSpawnChance: 0.8 },
    {maxDst: 125, minObstacleSpawnChance: 0.65, maxObstacleSpawnChance: 0.8 },
    {maxDst: 150, minObstacleSpawnChance: 0.7,  maxObstacleSpawnChance: 0.8 },
    {maxDst: 175, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    {maxDst: 200, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    {maxDst: 225, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    {maxDst: 250, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 },
    {maxDst: 275, minObstacleSpawnChance: 0.75, maxObstacleSpawnChance: 0.8 }
]

class CollisionHandler {
    constructor(element) {
        this.element = element;
    }
    Handle(interactables, collider) {
        console.warn('Should not be using the base class "Handle" function');
    }
}
class PlayerCollisionHandler extends CollisionHandler {
    Handle(interactables, collider) {
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
        playerHearts = MathEX.clamp(playerHearts + 1, 0, 3);
    }
}

let generatedInteractables = [];
const spawnInteractable = () => {
    let randomIndex = Math.floor(Math.random() * interactablePatternTemplates.length);
    let interactable = Generators.generateHTML(interactablePatternTemplates[randomIndex]);

    generatedInteractables.push(interactable);

    game.append(interactable);
}

const setPlayerScore = (score) => {
    playerScore = MathEX.clamp(score, 0, 9999);
    playerScoreDiv.innerHTML = playerScore;
}
const modPlayerScore = (score) => {
    playerScore = MathEX.clamp(playerScore + score, 0, 9999);
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

const startNextLevel = () => {
    currentLevel++;
    if (currentLevel > levelMaps.length - 1)
        currentLevel = levelMaps.length - 1;

    minObstacleSpawnChance = levelMaps[currentLevel].minObstacleSpawnChance;
    maxObstacleSpawnChance = levelMaps[currentLevel].maxObstacleSpawnChance;

    resetPlayer();
    resetGeneratedInteractables();

    distanceSystem.Restart(levelMaps[currentLevel]);

    document.querySelector('.end-card').remove();

    initLoops();

    currentState = GameState.PLAYING;
}

const resetGeneratedInteractables = () => generatedInteractables.forEach(i => i.remove());
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
const restartGame = () => {
    resetPlayer();
    resetGeneratedInteractables();

    distanceSystem.Restart(levelMaps[currentLevel]);

    document.querySelector('.end-card').remove();

    initLoops();

    currentState = GameState.PLAYING;
}

const onPlayerWon = () => {
    if (currentState === GameState.WIN) {
        inputSystem.DisableKeys();
        distanceSystem.Pause(root);
        
        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');
        player.classList.add('player-won');

        mainIntervals.forEach(i => clearInterval(i));

        game.append(endMenuGenerator(GameState.WIN));
    }
}
const onPlayerLost = () => {
    if (currentState === GameState.LOSE) {
        inputSystem.DisableKeys();
        distanceSystem.Pause(root);

        player.classList.remove('player-jump-animation');
        player.classList.remove('player-jumping');
        player.classList.remove('player-running');

        player.classList.add('player-won');

        mainIntervals.forEach(i => clearInterval(i));

        game.append(endMenuGenerator(GameState.LOSE));
    }
}

const decreasePlayerHearts = () => playerHearts = MathEX.clamp(playerHearts - 1, 0, 3);
const updatePlayerHeartsDisplay = () => {
    let heartsDisplayedCount = playerHeartsDiv.querySelectorAll('li').length;
    if (heartsDisplayedCount !== playerHearts) {
        playerHeartsDiv.innerHTML = playerHeartsGenerator(playerHearts);
    }
}

const update = () => {
    switch (currentState) {
        case GameState.WIN:
            mainIntervals.forEach(i => clearInterval(i));
            onPlayerWon();
            break;
        case GameState.LOSE:
            mainIntervals.forEach(i => clearInterval(i));
            onPlayerLost();
            break;
        case GameState.PLAYING:
            inputSystem.HandleKeys();
            collisionSystem.HandleCollision(interactables);

            updatePlayerHeartsDisplay();

            checkPlayerWon();
            checkPlayerLost();
            break;
        default:
            console.error('Invalid State!', currentState);
            break;
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
}
const initLoops = () => {
    Generators.generateLoopCallback(() => {
        update();
    }, 1000 / FPS, mainIntervals);
    Generators.generateLoopCallback(() => {
        if (currentState === GameState.PLAYING) {
            let spawnChance = Math.random();
            if (spawnChance <= obstacleSpawnChance) {
                spawnInteractable();
            }
        }
        obstacleSpawnChance = MathEX.clamp(obstacleSpawnChance + 0.01, minObstacleSpawnChance, maxObstacleSpawnChance);
    }, 2000, mainIntervals);
}

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
};