import {Effect} from "./effect.js";

export class GetSurgeEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.surge = false;
        this.addedSurge = false;
    }
    async execute(params) {
        const {selectedTarget, addedSurge} = this;

        this.surge = selectedTarget.surge || addedSurge;
    }
}