import {Engine} from '../engine/engine.js';
import {path} from '../engine/utils.js';

export class Activation extends Engine {
    constructor({
        effect,
    }) {
        super(arguments[0]);

        this.effect = effect;

        this.triggersWouldLaunched = false;
        this.triggersInitLaunched = false;
        this.triggersEndsLaunched = false;
    }
    get activationEnd() {
        const {effect} = this;

        return effect.activationEnd;
    }
    get character() {
        return path(this, 'effect.character');
    }
    get match() {
        return this.effect.match;
    }
    get selectedTarget() {
        return path(this, 'effect.selectedTarget');
    }
    set selectedTarget(selectedTarget) {
        this.effect.selectedTarget = selectedTarget;
    }
    createDelayedEffect(effect) {
        this.effect.createDelayedEffect(effect);
    }
    async canRun() {
        return !this.checkStatus();
    }
    checkStatus() {
        return true;
    }
    getTriggersEnds(_params) {
        this.triggersEndsLaunched = true;

        return [];
    }
    getTriggersInit(_params) {
        this.triggersEndsLaunched = false;
        this.triggersInitLaunched = true;

        return [];
    }
    getTriggersParams(params) {
        return params;
    }
    getTriggersWould(_params) {
        this.triggersWouldLaunched = true;

        return [];
    }
}