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

        console.log(`${this.element.className} hit ${collidedWith.className}`);
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
    }

    AddKeyHandler(key, callBack) {
        if (this.keyHandlers.length > 0) {
            for (let i = 0; i < this.keyHandlers.length; i++) {
                if (this.keyHandlers[i].key.toLowerCase() === key.toLowerCase()) {
                    this.keyHandlers[i].callBacks.push(callBack);
                    break;
                }
            }
        }
        else {
            this.keyHandlers.push({ key, callBacks: [callBack]});
        }
    }

    HandleKeys() {
        console.log(this.keyHandlers);
        for (let i = 0; i < this.keyHandlers.length; i++) {
            let keyHandler = this.keyHandlers[i];
            document.onkeydown = (e) => {
                if (e.key === keyHandler.key) {
                    keyHandler.callBacks.forEach(cb => cb());
                }
            }
        }
    }
}

window.onload = () => {
    let mainCollisionSystem = new CollisionSystem();
    const inputHandler = new InputHandler();

    mainCollisionSystem.AddCollisionHandler(new PlayerCollisionHandler(player));

    inputHandler.AddKeyHandler('w', () => console.log("'w' was pressed!"));
    inputHandler.HandleKeys();

    generateLoopCallback(() => {
        mainCollisionSystem.HandleCollision((col1, col2) => {});
    }, 10);
}

