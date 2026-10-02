import {EFFECT_DEFEAT} from 'mc-shared';
import {Effect} from './effect.js';

export class RemoveThreatEffect extends Effect {
    constructor({
        threat,
        thwart,
    }) {
        super(arguments[0]);

        this.threat = threat;
        this.thwart = thwart;
    }
    filterTarget(card) {
        return card.canRemoveThreat() &&
            super.filterTarget.apply(this, arguments);
    }
    async prepare(params) {
        await super.prepare(params);

        if (this.threat === undefined) {
            if (this.paramsCalc) {
                this.threat = this.calculate(params);
            } else {
                this.threat = params.threat;
            }
        }
    }
    execute(params) {
        const {selectedTarget, threat} = this;

        selectedTarget.removeThreat(threat);

        selectedTarget.refresh();

        if (selectedTarget.isSideScheme && selectedTarget.threat <= 0) {
            const defeatEffect = this.match.effectsFactory.createEffect({
                type: EFFECT_DEFEAT,
                selectedTarget,
                ability: this.ability,
            });
            return defeatEffect.runEffect(params);
        }
    }
}
