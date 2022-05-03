const game = document.querySelector('.game');
const player = document.querySelector('.player');
const colliders = document.getElementsByClassName('collider');

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
const generateLoopCallback = (callback, interval) => {
    let repeat = () => {
        clearTimeout(t);
        callback();
        t = setTimeout(() => {
            repeat();
        }, interval);
    }
    repeat();
}
const generateCollisionHandler = (callback) => {
    return (col1, col2) => callback(col1, col2);
}

class CollisionHandler {
    constructor(element) {
        this.element = element;
    }
}
class PlayerCollisionHandler extends CollisionHandler {
    Handle(colA, colB) {
        let collidedWith;
        if (colA === this.element) {
            collidedWith = colB;
        } else {
            collidedWith = colA;
        }

        // console.log(`${this.element.className} hit ${collidedWith.className}`);
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

    CheckCollision(rect1, rect2) {
        if (rect1.x < rect2.x + rect2.width || rect1.x + rect1.width > rect2.x ||
            rect1.y < rect2.y + rect2.height || rect1.y + rect1.height > rect2.y) {
            return true;
        }
        return false;
    }
    HandleCollision() {
        for (let i = 0; i < this.colliders.length; i++) {
            let collider1 = colliders[i];
            for (let j = 0; j < this.colliders.length; j++) {
                let collider2 = colliders[j];
                if (collider1 === collider2) continue;
                let colliderRect1 = generateRect(collider1);
                let colliderRect2 = generateRect(collider2);

                if (this.CheckCollision(colliderRect1, colliderRect2)) {
                    // onCollision(collider1, collider2);
                    for (let k = 0; k < this.collisionHandlers.length; k++) {
                        this.collisionHandlers[k].Handle(collider1, collider2);
                    }
                }
            }
        }
    }
}
class InputHandler {
    constructor() {
        this.keyHandlers = [];
        this.keyMap = {};
    }

    AddKeyHandler(key, callBack) {
        let hasKey = false;
        if (this.keyHandlers.length > 0) {
            for (let i = 0; i < this.keyHandlers.length; i++) {
                if (this.keyHandlers[i].key.toLowerCase() === key.toLowerCase()) {
                    this.keyHandlers[i].callBacks.push(callBack);
                    hasKey = true;
                    break;
                }
            }
        }
        if (!hasKey) {
            this.keyHandlers.push({ key, callBacks: [callBack]});
        }
    }

    HandleKeys() {
        document.onkeydown = document.onkeyup = (e) => {
            this.keyMap[e.key] = e.type === 'keydown';
            this.keyHandlers.forEach(keyHandler => {
                if (this.keyMap[keyHandler.key]) {
                    keyHandler.callBacks.forEach(cb => cb());
                }
            });
        }
    }
}
class AnimationEventHandler {
    constructor() {
        this.animationEventHandlers = [];
    }

    AddAnimationEventHandler(element, animationName, eventType, callBack) {
        this.animationEventHandlers.push({ element, animationName, eventType, callBack });
    }

    HandleAnimationEvents() {
        for (let i = 0; i < this.animationEventHandlers.length; i++) {
            let evHandler = this.animationEventHandlers[i];
            document.addEventListener(evHandler.eventType, () => evHandler.callBack());
        }
    }
}

const FPS = 60;

const mainCollisionSystem = new CollisionSystem();
const mainAnimEvHandler = new AnimationEventHandler();
const inputHandler = new InputHandler();

const velocityX = 4;

const initAnimEventHandler = () => {
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
        let left = player.getBoundingClientRect().left;
        player.style.left = `${left + velocityX}px`;
    });
    inputHandler.AddKeyHandler('ArrowLeft', () => {
        let left = player.getBoundingClientRect().left;
        player.style.left = `${left - velocityX}px`;
    });
    inputHandler.HandleKeys();
}

window.onload = () => {
    mainCollisionSystem.AddCollisionHandler(new PlayerCollisionHandler(player));
    mainAnimEvHandler.AddAnimationEventHandler(player, 'player-jump-animation', 'animationend', () => {
        player.classList.remove('player-jump-animation');
        player.classList.toggle('player-jumping');
        player.classList.toggle('player-running');
    });
    mainAnimEvHandler.HandleAnimationEvents();

    initInputs();

    generateLoopCallback(() => {
        mainCollisionSystem.HandleCollision((col1, col2) => { });
    }, FPS / 1000);
}

