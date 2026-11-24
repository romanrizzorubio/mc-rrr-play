import {Engine} from '../../engine/engine.js';
import {path} from '../../engine/utils.js';

export class Limit extends Engine {
    constructor({
// Limit
        count,
        target,
        perPlayer = false,
        ability,
    }) {
        super(arguments[0]);

        this.count = count;
        this.target = target;
        this.perPlayer = perPlayer;
        this.ability = ability;

        this.used = 0;
        this.usedByPlayer = {};
    }
    get match() {
        return path(this, 'ability.match');
    }
    canUse({player} = {}) {
        if (!this.target) {
            throw new Error('Un límite de capacidad requiere un objetivo.');
        }
        if (!this.match?.limits) {
            throw new Error('Un límite requiere una carta y una partida.');
        }

        if (this.perPlayer) {
            this.usedByPlayer ??= {};
            const playerId = player?.id ?? player?.name;
            if (!playerId) {
                throw new Error('Un límite por jugador requiere un jugador.');
            }

            return (this.usedByPlayer[playerId] || 0) < this.count;
        }

        return this.used < this.count;
    }

    clean() {
        this.used = 0;
        this.usedByPlayer = {};
    }

    use({player} = {}) {
        if (this.perPlayer) {
            this.usedByPlayer ??= {};
            const playerId = player?.id ?? player?.name;
            if (!playerId) {
                throw new Error('Un límite por jugador requiere un jugador.');
            }

            this.usedByPlayer[playerId] =
                (this.usedByPlayer[playerId] || 0) + 1;
        } else {
            this.used++;
        }

        const limits = this.match.limits[this.target] || [];
        if (!limits.includes(this)) {
            this.setLimit(this);
        }
    }
}