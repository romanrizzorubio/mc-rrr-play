import {
    LABEL_THWART,
    TARGET_SCHEME,
} from 'mc-shared';
import {GetThwartEffect} from '../../effects/get-thwart-effect.js';
import {RemoveThreatEffect} from '../../effects/remove-threat-effect.js';

import {BasicAbility} from './basic-ability.js';

export class ThwartBasicAbility extends BasicAbility {
    constructor({
        player: _player,
        target = TARGET_SCHEME,
    }) {
        super(arguments[0]);

        this.defaultTarget = target;
        this.labels = [LABEL_THWART];
        this.effect = new RemoveThreatEffect({
            target,
            refreshTarget: true,
            match: this.match,
            isThwart: true,
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
    canRun(params) {
        const {card} = params;

        if (card.thwart === null) {
            return false;
        }

        if (card.isConfused) {
            return true;
        }

        return super.canRun(params);
    }
    applyConsequencial() {
        const {card} = this;

        if (card.thwartConsequential) {
            return super.applyConsequencial({player: card.controller}, card.thwartConsequential);
        }
    }
    async getThwartValue(params) {
        const card = this.getCurrentCard();

        const getThwartEffect = new GetThwartEffect({
            selectedTarget: card,
            scheme: this.effect.selectedTarget,
            match: this.match,
        });

        await getThwartEffect.runEffect(params);
        const thwart = await getThwartEffect.chooseThwartValue(params);

        this.syncEffectConfigurationFromCurrentSide();

        return thwart;
    }
    async resolveAbility(params) {
        this.resetDistribution();

        try {
            const thwart = await this.getThwartValue(params);

            return await super.resolveAbility({
                ...params,
                threat: thwart,
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