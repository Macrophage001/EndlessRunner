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

class CollisionSystem {
    constructor(collisionHandlers) {
        this.colliders = document.getElementsByClassName('collider');
        this.collisionHandlers = collisionHandlers;
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

window.onload = () => {
    let mainCollisionSystem = new CollisionSystem();

    generateLoopCallback(() => {
        mainCollisionSystem.HandleCollision((col1, col2) => {
            // console.log(`${col1.classList[0]} has collided with ${col2.classList[0]}`);
        });
    }, 10);
}

