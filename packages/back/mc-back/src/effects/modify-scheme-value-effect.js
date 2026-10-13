import {Effect} from './effect.js';
import {getCurrentSideTargets} from '../utils/target-utils.js';

export class ModifySchemeValueEffect extends Effect {
    constructor({
        count,
        characterTarget,
        isCleanup = false,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
        this.isCleanup = isCleanup;
        this.modifiedScheme = undefined;
    }
    async execute(params) {
        const {selectedTarget, count, isCleanup} = this;
        const {lasting} = params;
        const modifyScheme = this.paramsCalc ?
            await this.calculate(params) :
            count;
        this.modifiedScheme = modifyScheme;

        const targets = getCurrentSideTargets(selectedTarget);

        for (const target of targets) {
            target.modifyScheme = (target.modifyScheme ?? 0) + modifyScheme;

            if (lasting && target.isCard && !isCleanup) {
                const cleanup = new ModifySchemeValueEffect({
                    count: -modifyScheme,
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
