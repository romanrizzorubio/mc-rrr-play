import {TARGET_YOUR_SUPERHERO} from 'mc-shared';

import {GetHandSizeEffect} from './get-hand-size-effect.js';
import {Effect} from './effect.js';

export class ModifyHandSizeEffect extends Effect {
    constructor({
        count,
        characterTarget,
        target = TARGET_YOUR_SUPERHERO,
    }) {
        super({
            ...arguments[0],
            target,
        });

        this.characterTarget = characterTarget;
        this.count = count;
    }
    execute(params) {
        const {effect} = params;
        const {count, paramsCalc} = this;
        const modifyHandSize = paramsCalc ?
            this.calculate(params) :
            count;

        if (!(effect instanceof GetHandSizeEffect)) {
            throw new Error('ModifyHandSizeEffect requires a GetHandSizeEffect context.');
        }
        if (!Number.isFinite(modifyHandSize)) {
            throw new Error('A hand-size modifier must resolve to a finite number.');
        }

        effect.modifyHandSize += modifyHandSize;
    }
}
