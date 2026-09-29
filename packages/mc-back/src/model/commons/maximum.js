import {Engine} from "../../engine/engine.js";

export class Maximum extends Engine {
    constructor({
// Maximum
        count,
        time,
        card,
        ability,
        target,
    }) {
        super(arguments[0]);

        this.count = count;
        this.time = time;
        this.card = card;
        this.ability = ability;
        this.target = target;
    }
}