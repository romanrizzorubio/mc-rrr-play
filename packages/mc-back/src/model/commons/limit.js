import {Engine} from '../../engine/engine.js';
import {path} from '../../engine/utils.js';

export class Limit extends Engine {
    constructor({
// Limit
        count,
        target,
        ability,
    }) {
        super(arguments[0]);

        this.count = count;
        this.target = target;
        this.ability = ability;

        this.used = 0;
    }
    get match() {
        return path(this, 'ability.match');
    }
    canUse() {
        if (!this.target) {
            throw new Error('Un límite de capacidad requiere un objetivo.');
        }
        if (!this.match?.limits) {
            throw new Error('Un límite requiere una carta y una partida.');
        }

        return this.used < this.count;
    }

    clean() {
        return this.used = 0;
    }

    use() {
        this.used++;

        const limits = this.match.limits[this.target] || [];
        if (!limits.includes(this)) {
            this.setLimit(this);
        }
    }
}