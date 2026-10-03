import {EFFECT_DEFEAT} from 'mc-shared';
import {Effect} from './effect.js';

export class RemoveThreatEffect extends Effect {
    constructor({
        threat,
        thwart,
    }) {
        super(arguments[0]);

        this.baseThreat = threat;
        this.threat = threat;
        this.thwart = thwart;
    }
    filterTarget(card) {
        return card.canRemoveThreat() &&
            super.filterTarget.apply(this, arguments);
    }
    async prepare(params) {
        await super.prepare(params);

        const lastStepThreat = this.getLastStepParam('threat', params);
        if (lastStepThreat !== undefined) {
            this.threat = lastStepThreat;
        } else if (this.paramsCalc) {
            this.threat = this.calculate(params);
        } else {
            this.threat = this.baseThreat ?? params.threat;
        }
    }
    async execute(params) {
        const {selectedTarget, threat} = this;

        if (Array.isArray(selectedTarget)) {
            return this.promisesSequential(selectedTarget, selectedTarget => {
                const effect = new RemoveThreatEffect({
                    selectedTarget,
                    threat,
                    match: this.match,
                    ability: this.ability,
                });
                return effect.runEffect(params);
            });
        }

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
