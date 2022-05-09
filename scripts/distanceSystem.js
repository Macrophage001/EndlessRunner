import { MathEX, Generators } from './utils.js';

class DistanceSystem {
    constructor(maxDst, dstIncrement, element, progressBarThumb, progressBarTrail) {
        this.maxDst = maxDst;
        this.defaultDstIncrement = this.dstIncrement = dstIncrement;
        this.distanceTraveled = 0;
        this.percentageTraveled = 0;
        this.dstTraveledTimeouts = [];
        this.dstReached = false;
        this.element = element;

        this.progressBarThumb = progressBarThumb;
        this.progressBarTrail = progressBarTrail;
    }
    Pause() {
        this.dstIncrement = 0;
        this.SetSpeed(0);
        this.dstTraveledTimeouts.forEach(t => clearTimeout(t));
    }
    Start(levelMap) {
        this.maxDst = levelMap.maxDst;

        this.dstIncrement = this.defaultDstIncrement;
        this.SetSpeed(5500);
        this.StartDistanceTracker();
    }
    Restart(levelMap) {
        this.maxDst = levelMap.maxDst;

        this.dstIncrement = this.defaultDstIncrement;
        this.percentageTraveled = 0;
        this.distanceTraveled = 0;
        this.SetSpeed(5500);
        this.StartDistanceTracker();
    }

    SetSpeed(ms) {
        this.element.style.setProperty('--run-speed', `${ms}ms`);
    }

    StartDistanceTracker() {
        Generators.generateLoopCallback(() => {
            this.distanceTraveled += this.dstIncrement;
            this.percentageTraveled = (this.distanceTraveled / this.maxDst);
            if (this.percentageTraveled < 1) {
                let thumbPositionX = MathEX.lerp(-1, 23, this.percentageTraveled);
                this.progressBarThumb.style.left = `${thumbPositionX}vw`;
                this.progressBarTrail.style.width = `${this.percentageTraveled * 100}%`;
            }
            else {
                this.Pause();
            }
        }, 10, this.dstTraveledTimeouts);
    }
}

export default DistanceSystem;