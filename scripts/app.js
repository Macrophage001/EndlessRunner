const game = document.querySelector('.game');
const player = document.querySelector('.player');
const colliders = document.getElementsByClassName('collider');

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
const generateLoopCallback = (callback, interval, arr) => {
    let repeat = () => {
        callback();
        t = setTimeout(() => {
            repeat();
        }, interval);
        if (arr !== undefined) {
            arr.push(t);
        }
    }
    repeat();
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

let inputTimeouts = [];
class InputSystem {
    constructor() {
        this.keyHandlers = {};
    }

    AddKeyHandler(key, callBack) {
        // let hasKey = false;

        if (this.keyHandlers[key] !== undefined) {
            this.keyHandlers[key].push(callBack);
        } else {
            this.keyHandlers[key] = [callBack];
        }

        // if (this.keyHandlers.length > 0) {
        //     for (let i = 0; i < this.keyHandlers.length; i++) {
        //         if (this.keyHandlers[i].key.toLowerCase() === key.toLowerCase()) {
        //             this.keyHandlers[i].callBacks.push(callBack);
        //             hasKey = true;
        //             break;
        //         }
        //     }
        // }
        // if (!hasKey) {
        //     this.keyHandlers.push({ key, callBacks: [callBack]});
        // }
    }

    HandleKeys() {
        document.onkeydown = (e) => {
            e.preventDefault();
            // console.log(typeof e.key);
            // console.log(this.keyHandlers[e.key]);

            let callBacks = this.keyHandlers[e.key];
            console.log(callBacks);

            inputTimeouts.forEach(t => clearTimeout(t));
            let repeat = () => {
                this.keyHandlers[e.key].forEach(cb => cb());
                let t = setTimeout(repeat, 10);
                inputTimeouts.push(t);
            }
            repeat();
            
            // this.keyMap[e.key] = e.type === 'keydown';
            // this.keyHandlers.forEach(keyHandler => {
            //     if (this.keyMap[keyHandler.key]) {
            //         keyHandler.callBacks.forEach(cb => cb());
            //     }
            // });
        }

        document.onkeyup = () => inputTimeouts.forEach(t => clearTimeout(t));
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

const FPS = 60;

const collisionSystem   = new CollisionSystem();
const animEventHandler  = new AnimationEventSystem();
const collectibleSystem = new CollectibleSystem();
const inputHandler      = new InputSystem();

const velocityX = 4;

const initCollisionHandlers = () => {
    collisionSystem.AddCollisionHandler(new PlayerCollisionHandler(player));   
}
const initAnimEvents = () => {
    animEventHandler.AddAnimationEventHandler(player, 'player-jump-animation', 'animationend', () => {
        player.classList.remove('player-jump-animation');
        player.classList.toggle('player-jumping');
        player.classList.toggle('player-running');
    });
    animEventHandler.HandleAnimationEvents();
}
const initInputs = () => {
    inputHandler.AddKeyHandler(' ', () => {
        if (!player.classList.contains('player-jump-animation')) {
            player.classList.add('player-jump-animation');
            player.classList.toggle('player-running');
            player.classList.toggle('player-jumping');
        }
    });
    inputHandler.AddKeyHandler('ArrowRight', () => {
        let right = player.getBoundingClientRect().right;
        let left = player.getBoundingClientRect().left;
        let gameRight = game.getBoundingClientRect().right;

        if (right < gameRight - 5)
            player.style.left = `${left + velocityX}px`;
    });
    inputHandler.AddKeyHandler('ArrowLeft', () => {
        let left = player.getBoundingClientRect().left;
        let gameLeft = game.getBoundingClientRect().left;

        if (left > gameLeft + 5)
            player.style.left = `${left - velocityX}px`;
    });
}

window.onload = () => {
    initCollisionHandlers();
    initAnimEvents();
    initInputs();

    inputHandler.HandleKeys();

    generateLoopCallback(() => {
        collisionSystem.HandleCollision();
    }, 1000);
}

