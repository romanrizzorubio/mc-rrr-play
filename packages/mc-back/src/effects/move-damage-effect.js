import {TARGET_YOU} from 'mc-shared';
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

    getDamageSource(params) {
        if (this.fromTarget === TARGET_YOU) {
            return params.player;
        }

        return path(params, this.fromTarget);
    }

    async prepare(params) {
        await super.prepare(params);

        const lastStepDamage = this.getLastStepParam('damage', params);
        if (lastStepDamage !== undefined) {
            this.damage = lastStepDamage;
        } else if (this.paramsCalc) {
            this.damage = this.calculate(params);
        } else {
            this.damage = this.baseDamage ?? params.damage;
        }
    }

    filterTarget(card, params) {
        const source = this.getDamageSource(params);
        const damage = this.getLastStepParam('damage', params) ??
            (this.paramsCalc ?
                this.calculate(params) :
                this.baseDamage ?? params.damage);

        if (!source ||
            !Number.isFinite(source.damage) ||
            !Number.isFinite(damage) ||
            source.damage < damage) {
            return false;
        }

        return super.filterTarget.apply(this, arguments);
    }

    async execute(params) {
        const {selectedTarget, damage} = this;

        const source = this.getDamageSource(params);

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
