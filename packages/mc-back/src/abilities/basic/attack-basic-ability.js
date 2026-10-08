import {LABEL_ATTACK, TARGET_ENEMY} from 'mc-shared';
import {DealDamageEffect} from '../../effects/deal-damage-effect.js';

import {BasicAbility} from './basic-ability.js';

export class AttackBasicAbility extends BasicAbility {
    constructor({
        target = TARGET_ENEMY,
    }) {
        super(arguments[0]);

        this.labels = [LABEL_ATTACK];
        this.effect = new DealDamageEffect({
            target,
            refreshTarget: true,
            match: this.match,
            ability: this,
        });
    }
    async applyConsequencial(params) {
        const {card} = this;
        const damage = await card.getAttackConsequencialValue(params);

        if (damage) {
            return super.applyConsequencial({player: card.controller}, damage);
        }
    }
    async getAttackValue(params) {
        const {card} = this;

        return card.getAttackValue(params);
    }
    async resolveAbility(params) {
        const damage = await this.getAttackValue(params);

        return super.resolveAbility({
            ...params,
            damage,
        });
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
        };
    }
}