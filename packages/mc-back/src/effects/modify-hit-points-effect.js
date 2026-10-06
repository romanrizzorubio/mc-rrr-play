import {TARGET_YOUR_SUPERHERO} from 'mc-shared';

import {Effect} from './effect.js';
import {GetHitPointsEffect} from './get-hit-points-effect.js';

export class ModifyHitPointsEffect extends Effect {
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
        const {selectedTarget, count, paramsCalc} = this;
        const modifyHitPoints = paramsCalc ?
            this.calculate(params) :
            count;

        if (effect instanceof GetHitPointsEffect) {
            const selectedTargets = Array.isArray(selectedTarget) ?
                selectedTarget :
                [selectedTarget];
            const queriedCharacter = effect.selectedTarget?.parent ||
                effect.selectedTarget;
            const modifiesQueriedCharacter = selectedTargets.some(target =>
                (target?.parent || target) === queriedCharacter);

            if (!modifiesQueriedCharacter) {
                return;
            }
            if (!Number.isFinite(modifyHitPoints)) {
                throw new Error('A hit-point modifier must resolve to a finite number.');
            }

            effect.modifyHitPoints += modifyHitPoints;

            return;
        }

        selectedTarget.modifyHitPoints = modifyHitPoints;
    }
}
