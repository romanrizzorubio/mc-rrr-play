import {
    EFFECT_DEAL_DAMAGE,
    LABEL_ATTACK,
    TARGET_ENEMY,
} from 'mc-shared';
import {DealDamageEffect} from '../../effects/deal-damage-effect.js';

import {BasicAbility} from './basic-ability.js';

export class AttackBasicAbility extends BasicAbility {
    constructor({
        target = TARGET_ENEMY,
    }) {
        super(arguments[0]);

        this.defaultTarget = target;
        this.labels = [LABEL_ATTACK];
        this.effect = new DealDamageEffect({
            effectType: EFFECT_DEAL_DAMAGE,
            target,
            refreshTarget: true,
            match: this.match,
            ability: this,
        });
    }
    resetDistribution() {
        const effects = new Set([this.effectDefinition, this.effect]);

        effects.forEach(effect => {
            effect.setConfigValue('target', this.defaultTarget);
            effect.setConfigValue('distribute', false);
        });
    }
    async applyConsequencial(params) {
        const {card} = this;
        const damage = await card.getattackConsequentialValue(params);

        if (damage) {
            return super.applyConsequencial({player: card.controller}, damage);
        }
    }
    async getAttackValue(params) {
        const card = this.getCurrentCard();
        const attack = await card.getAttackValue(params);

        this.syncEffectConfigurationFromCurrentSide();

        return attack;
    }
    async resolveAbility(params) {
        this.resetDistribution();

        try {
            const damage = await this.getAttackValue(params);

            return await super.resolveAbility({
                ...params,
                damage,
            });
        } finally {
            this.resetDistribution();
        }
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
        };
    }
}