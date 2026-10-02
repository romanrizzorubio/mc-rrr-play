import {LABEL_THWART,TARGET_SCHEME} from 'mc-shared';
import {GetThwartEffect} from '../../effects/get-thwart-effect.js';
import {RemoveThreatEffect} from '../../effects/remove-threat-effect.js';

import {BasicAbility} from './basic-ability.js';

export class ThwartBasicAbility extends BasicAbility {
    constructor({
        player: _player,
        target = TARGET_SCHEME,
    }) {
        super(arguments[0]);

        this.labels = [LABEL_THWART];
        this.effect = new RemoveThreatEffect({
            target,
            refreshTarget: true,
            match: this.match,
            isThwart: true,
            ability: this,
        });
    }
    applyConsequencial() {
        const {card} = this;

        if (card.thwartConsequencial) {
            return super.applyConsequencial({player: card.controller}, card.thwartConsequencial);
        }
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
    async getThwartValue(params) {
        const {card} = this;

        const getThwartEffect = new GetThwartEffect({
            selectedTarget: card,
            match: this.match,
        });

        await getThwartEffect.runEffect(params);

        return getThwartEffect.thwart;
    }
    async resolveAbility(params) {
        const thwart = await this.getThwartValue(params);

        return super.resolveAbility({
            ...params,
            threat: thwart,
        });
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
        };
    }
}