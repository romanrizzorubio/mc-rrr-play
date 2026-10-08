import {Engine} from '../../engine/engine.js';

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
        this.used = 0;
    }
    get match() {
        return this.ability?.match || this.card?.match;
    }
    get cardName() {
        return this.ability?.card?.name || this.card?.name;
    }
    canUse() {
        if (!this.time) {
            throw new Error('Un máximo de capacidad requiere un periodo.');
        }
        if (!this.match?.limits || !this.cardName) {
            throw new Error('Un máximo requiere una carta y una partida.');
        }

        const used = (this.match.limits[this.time] || [])
            .reduce((total, maximum) => {
                if (maximum instanceof Maximum &&
                    maximum.cardName === this.cardName) {
                    return total + (maximum.used || 0);
                }

                return total;
            }, 0);

        return used < this.count;
    }
    use() {
        this.used++;

        const maximums = this.match.limits[this.time] || [];
        if (!maximums.includes(this)) {
            this.setLimit(this);
        }
    }
    clean() {
        this.used = 0;
    }
}