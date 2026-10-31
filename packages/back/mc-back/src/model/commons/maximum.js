import {Engine} from '../../engine/engine.js';
import {TARGET_EFFECT} from 'mc-shared';

export class Maximum extends Engine {
    static #usesByEffect = new WeakMap();

    constructor({
// Maximum
        count,
        card,
        ability,
        target,
    }) {
        super(arguments[0]);
        this.count = count;
        this.target = target;
        this.card = card;
        this.ability = ability;
        this.used = 0;
    }
    get match() {
        return this.ability?.match || this.card?.match;
    }
    get cardName() {
        return this.ability?.card?.name || this.card?.name;
    }
    getEffectScope(params) {
        const effect = params?.triggeredEffect ?? params?.effect;
        if (!effect || typeof effect !== 'object') {
            throw new Error('Un máximo por efecto requiere el efecto disparador.');
        }

        return effect;
    }
    canUse(params) {
        if (!this.target) {
            throw new Error('Un máximo de capacidad requiere un objetivo.');
        }
        if (!this.match?.limits || !this.cardName) {
            throw new Error('Un máximo requiere una carta y una partida.');
        }

        if (this.target === TARGET_EFFECT) {
            const uses = Maximum.#usesByEffect.get(this.getEffectScope(params));

            return (uses?.get(this.cardName) ?? 0) < this.count;
        }

        const used = (this.match.limits[this.target] || [])
            .reduce((total, maximum) => {
                if (maximum instanceof Maximum &&
                    maximum.cardName === this.cardName) {
                    return total + (maximum.used || 0);
                }

                return total;
            }, 0);

        return used < this.count;
    }
    use(params) {
        if (this.target === TARGET_EFFECT) {
            const effect = this.getEffectScope(params);
            let uses = Maximum.#usesByEffect.get(effect);
            if (!uses) {
                uses = new Map();
                Maximum.#usesByEffect.set(effect, uses);
            }
            uses.set(this.cardName, (uses.get(this.cardName) ?? 0) + 1);
            this.used++;
            return;
        }

        this.used++;

        const maximums = this.match.limits[this.target] || [];
        if (!maximums.includes(this)) {
            this.setLimit(this);
        }
    }
    clean() {
        this.used = 0;
    }
}