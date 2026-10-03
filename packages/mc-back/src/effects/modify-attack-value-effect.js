import {Effect} from './effect.js';
import {getSelectedTargets} from '../utils/target-utils.js';

export class ModifyAttackValueEffect extends Effect {
    constructor({
        count,
        characterTarget,
        isCleanup = false,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
        this.isCleanup = isCleanup;
    }
    async execute(params) {
        const {selectedTarget, count, isCleanup} = this;
        const {lasting} = params;
        const modifyAttack = this.paramsCalc ?
            this.calculate(params) :
            count;

        const targets = getSelectedTargets(selectedTarget);

        for (const target of targets) {
            target.modifyAttack = (target.modifyAttack ?? 0) + modifyAttack;

            if (lasting && target.isCard && !isCleanup) {
                const cleanup = new ModifyAttackValueEffect({
                    count: -modifyAttack,
                    isCleanup: true,
                    match: this.match,
                });
                lasting.registerCleanup(cleanup, target);
            }

            if (target.isCard) {
                await target.refresh();
            }
        }
    }
}