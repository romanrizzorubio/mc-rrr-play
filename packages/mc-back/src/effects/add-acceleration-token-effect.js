import {Effect} from "./effect.js";

export class AddAccelerationTokenEffect extends Effect {
    constructor({
        count = 1,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(params) {
        const {selectedTarget, count} = this;

        selectedTarget.addAccelerationToken(count);

        selectedTarget.refresh();
    }
}