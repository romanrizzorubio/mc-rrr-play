import {LABEL_ATTACK} from '../../constants/labels.js';
import {TARGET_ENEMY} from '../../constants/targets.js';
import {DealDamageEffect} from '../../effects/deal-damage-effect.js';
import {GetAttackEffect} from '../../effects/get-attack-effect.js';

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
    applyConsequencial() {
        const {card} = this;

        if (card.attackConsequencial) {
            return super.applyConsequencial({player: card.controller}, card.attackConsequencial);
        }
    }
    async getAttackValue(params) {
        const {card} = this;

        const getAttackEffect = new GetAttackEffect({
            selectedTarget: card,
            match: this.match,
        });

        await getAttackEffect.runEffect(params);

        return getAttackEffect.attack;
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