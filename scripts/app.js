const root = document.querySelector(':root');

const game = document.querySelector('.game');
const player = document.querySelector('.player');
const colliders = document.getElementsByClassName('collider');

const progressBarThumb = document.querySelector('.progress-bar-thumb');
const progressBarTrail = document.querySelector('.progress-bar-trail');

const coinTemplate = `<div class="coin collider"></div>`;
const spikeTemplate = `<div class="spikes collider"></div>`

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

// I want the collision system to be running on a loop.
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
    
    // let repeat = () => {
    //     callback();
    //     t = setTimeout(() => {
    //         repeat();
    //     }, interval);
    //     if (arr !== undefined) {
    //         arr.push(t);
    //     }
    // }
    // repeat();
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
        if (collider.classList[0] === 'coin') {
            // TODO: Pickup coin and add to score.
            collider.style.display = 'none';
        }
        if (collider.classList[0] === 'obstacle') {

        }
    }
}
class CollectibleSystem {
    constructor() {
        this.collectibles = {};
    }
    AddCollectible(className, pointValue) {
        this.collectibles[className] = pointValue;
    }
    OnCollect(className) {
        return this.collectibles[className];
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

    AddKeyHandler(key, callBack) {
        if (this.keyHandlers[key] !== undefined) {
            this.keyHandlers[key].push(callBack);
        } else {
            this.keyHandlers[key] = [callBack];
        }
    }

    HandleKeys() {
        document.onkeydown = (e) => {
            e.preventDefault();
            if (inputIntervals[e.key] === undefined) {
                inputIntervals[e.key] = setInterval(() => {
                    this.keyHandlers[e.key].forEach(cb => cb());
                });
            }
        }

        document.onkeyup = () => {
            for (const prop in inputIntervals) {
                clearInterval(inputIntervals[prop]);
            }
            inputIntervals = {};
        }
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
        root.style.setProperty('--run-speed', '0ms');
        this.dstTraveledTimeouts.forEach(t => clearTimeout(t));
    }
    Start() {
        this.dstIncrement = this.defaultDstIncrement;
        root.style.setProperty('--run-speed', '3500ms');
        this.UpdateDistanceTraveled();
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
                game.style.position = 'relative';
                player.style.top = '54.5vh';
                player.style.left = '50%';
                if (!this.dstReached) {
                    player.animate(playerLeaveAnimation(), playerLeaveTiming);
                }
                this.dstReached = true;
            }
        }, 10, this.dstTraveledTimeouts);
    }
}

const FPS = 60;
const velocityX = 2.5;
const maxDst = 100;
const dstIncrement = 0.1;

const collisionSystem   = new CollisionSystem();
const animEventSystem   = new AnimationEventSystem();
const collectibleSystem = new CollectibleSystem();
const inputSystem       = new InputSystem();
const distanceSystem    = new DistanceSystem(maxDst, dstIncrement);

let distanceTravelled = 0;

const initCollisionHandlers = () => {
    collisionSystem.AddCollisionHandler(new PlayerCollisionHandler(player));   
}
const initAnimEvents = () => {
    animEventSystem.AddAnimationEventHandler(player, 'player-jump-animation', 'animationend', () => {
        player.classList.remove('player-jump-animation');
        player.classList.toggle('player-jumping');
        player.classList.toggle('player-running');
    });
    animEventSystem.HandleAnimationEvents();
}
const initInputs = () => {
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
}

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

let dstTravelledTimeouts = [];

window.onload = () => {
    initCollisionHandlers();
    initAnimEvents();
    initInputs();

    inputSystem.HandleKeys();

    generateLoopCallback(() => {
        collisionSystem.HandleCollision();
    }, FPS / 1000);
    distanceSystem.Start();
}

