import {Effect} from './effect.js';
import {getSelectedTargets} from '../utils/target-utils.js';

export class ModifyThwartValueEffect extends Effect {
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
        const modifyThwart = this.paramsCalc ?
            this.calculate(params) :
            count;

        const targets = getSelectedTargets(selectedTarget);

        for (const target of targets) {
            target.modifyThwart = (target.modifyThwart ?? 0) + modifyThwart;

            if (lasting && target.isCard && !isCleanup) {
                const cleanup = new ModifyThwartValueEffect({
                    count: -modifyThwart,
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