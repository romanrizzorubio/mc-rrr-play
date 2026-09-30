import {path} from '../engine/utils.js';

import {DealDamageEffect} from './deal-damage-effect.js';
import {Effect} from './effect.js';
import {HealEffect} from './heal-effect.js';

export class MoveDamageEffect extends Effect {
    constructor({
        damage,
        fromTarget,
    }) {
        super(arguments[0]);

        this.baseDamage = damage;
        this.fromTarget = fromTarget;
    }

    async prepare(params) {
        await super.prepare(params);

        if (this.paramsCalc) {
            this.damage = this.calculate(params);
        } else {
            this.damage = this.baseDamage || params.damage;
        }
    }

    filterTarget(card, params) {
        const {damage, fromTarget} = this;

        const source = path(params, fromTarget);

        if (source && source.damage < damage) {
            return false;
        }

        return super.filterTarget.apply(this, arguments);
    }

    async execute(params) {
        const {selectedTarget, damage, fromTarget} = this;

        const source = path(params, fromTarget);

        if (!source || source.damage < damage) {
            return;
        }

        // Primero sanamos al origen
        const healEffect = new HealEffect({
            selectedTarget: source,
            damage,
            match: this.match,
            ability: this.ability,
        });

        await healEffect.runEffect(params);

        // Luego infligimos daño al destino
        const dealDamageEffect = new DealDamageEffect({
            selectedTarget,
            damage,
            match: this.match,
            ability: this.ability,
            activation: this.activation,
        });

        await dealDamageEffect.runEffect(params);
    }
}
