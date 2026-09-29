import {Engine} from "../../engine/engine.js";
import {path} from "../../engine/utils.js";

export class Limit extends Engine {
    constructor({
// Limit
        count,
        time,
        ability,
    }) {
        super(arguments[0]);

        this.count = count;
        this.time = time;
        this.ability = ability;

        this.used = 0;
    }
    get match() {
        return path(this, 'ability.match');
    }
    canUse() {
        return this.used < this.count;
    }

    clean() {
        return this.used = 0;
    }

    use() {
        this.used++;

        this.setLimit(this);
    }
}