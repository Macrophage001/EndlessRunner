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

export default AnimationEventSystem;