class InputSystem {
    constructor() {
        this.keyHandlers = {};
        this.inputIntervals = {};
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
            if (this.inputIntervals[e.key] === undefined) {
                this.inputIntervals[e.key] = setInterval(() => {
                    this.keyHandlers[e.key].keyDown.forEach(cb => cb());
                });
            }
        }

        document.onkeyup = (e) => {
            e.preventDefault();
            if (this.inputIntervals[e.key] !== undefined) {
                for (const prop in this.inputIntervals) {
                    if (prop === e.key) {
                        clearInterval(this.inputIntervals[prop]);
                        this.inputIntervals[e.key] = undefined;
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

export default InputSystem;