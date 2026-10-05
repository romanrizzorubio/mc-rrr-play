import {EFFECT_DEFEAT} from 'mc-shared';

import {Effect} from './effect.js';

export class PreventDefeatEffect extends Effect {
    canRun(params) {
        return params.effect?.effectType === EFFECT_DEFEAT && super.canRun(params);
    }
    execute(params) {
        const {effect} = params;

        if (effect?.effectType !== EFFECT_DEFEAT) {
            throw new Error('PreventDefeatEffect requires a defeat effect context.');
        }

        effect.prevented = true;
    }
}
