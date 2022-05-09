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

    HandleCollision(interactables) {
        this.collisionHandlers.forEach(handler => {
            for (let i = 0; i < this.colliders.length; i++) {
                let collider = this.colliders[i];
                if (this.Overlap(handler.element, collider)) {
                    handler.Handle(interactables, collider);
                }
            }
        });
    }
}

export default CollisionSystem;